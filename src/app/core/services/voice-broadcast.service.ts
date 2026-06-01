import { Injectable, signal, inject } from '@angular/core';
import { WebsocketService } from './websocket.service';
import { SessionPreferencesService } from './session-preferences.service';

@Injectable({ providedIn: 'root' })
export class VoiceBroadcastService {
  private ws = inject(WebsocketService);
  private prefs = inject(SessionPreferencesService);

  private sessionId = '';
  private myUserId = '';

  private localStream: MediaStream | null = null;
  private peerConnections = new Map<string, RTCPeerConnection>();
  // Queued ICE candidates that arrived before setRemoteDescription was called
  private pendingCandidates = new Map<string, RTCIceCandidateInit[]>();
  private remoteDescriptionSet = new Set<string>();

  private audioElement: HTMLAudioElement | null = null;

  readonly isReceivingAudio = signal(false);
  readonly isBroadcasting = signal(false);

  private readonly rtcConfig: RTCConfiguration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  };

  init(sessionId: string, userId: string): void {
    this.sessionId = sessionId;
    this.myUserId = userId;
  }

  // ── Speaker ──────────────────────────────────────────────────────────────

  async startBroadcast(): Promise<void> {
    if (this.isBroadcasting()) return;
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this.isBroadcasting.set(true);
      await this.ws.emit('VoiceBroadcastStart', this.sessionId, this.myUserId);
    } catch {
      // mic permission denied or browser not supported — silently skip broadcast
    }
  }

  async createOfferForListener(listenerUserId: string): Promise<void> {
    if (!this.localStream || listenerUserId === this.myUserId) return;

    const pc = this.createPeerConnection(listenerUserId);
    this.localStream.getAudioTracks().forEach(track => pc.addTrack(track, this.localStream!));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    await this.ws.emit(
      'SendWebRTCOffer',
      this.sessionId,
      listenerUserId,
      JSON.stringify(pc.localDescription)
    );
  }

  async handleAnswer(fromUserId: string, answerJson: string): Promise<void> {
    const pc = this.peerConnections.get(fromUserId);
    if (!pc) return;
    const answer = JSON.parse(answerJson) as RTCSessionDescriptionInit;
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
    this.remoteDescriptionSet.add(fromUserId);
    await this.drainPendingCandidates(fromUserId, pc);
  }

  async stopBroadcast(): Promise<void> {
    if (!this.isBroadcasting()) return;
    this.isBroadcasting.set(false);
    this.localStream?.getTracks().forEach(t => t.stop());
    this.localStream = null;
    this.closePeerConnections();
    await this.ws.emit('VoiceBroadcastStop', this.sessionId, this.myUserId).catch(() => {});
  }

  // ── Listener ─────────────────────────────────────────────────────────────

  async handleBroadcastStarted(speakerId: string): Promise<void> {
    if (speakerId === this.myUserId) return;
    if (!this.prefs.prefs.listenVoiceBroadcast) return;
    await this.ws.emit('RequestVoiceStream', this.sessionId, this.myUserId).catch(() => {});
  }

  async handleOffer(fromUserId: string, offerJson: string): Promise<void> {
    if (!this.prefs.prefs.listenVoiceBroadcast) return;
    if (fromUserId === this.myUserId) return;

    const pc = this.createPeerConnection(fromUserId);

    pc.ontrack = (event) => {
      if (!this.audioElement) {
        this.audioElement = new Audio();
        this.audioElement.autoplay = true;
      }
      this.audioElement.srcObject = event.streams[0];
      this.audioElement.play().catch(() => {});
      this.isReceivingAudio.set(true);
    };

    const offer = JSON.parse(offerJson) as RTCSessionDescriptionInit;
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    this.remoteDescriptionSet.add(fromUserId);
    // Drain any ICE candidates that arrived before this remote description was set
    await this.drainPendingCandidates(fromUserId, pc);

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    await this.ws.emit(
      'SendWebRTCAnswer',
      this.sessionId,
      fromUserId,
      JSON.stringify(pc.localDescription)
    );
  }

  handleBroadcastStopped(): void {
    this.isReceivingAudio.set(false);
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.srcObject = null;
    }
    this.closePeerConnections();
  }

  // ── ICE (both sides) ─────────────────────────────────────────────────────

  async handleIceCandidate(fromUserId: string, candidateJson: string): Promise<void> {
    const candidate = JSON.parse(candidateJson) as RTCIceCandidateInit;

    if (!this.remoteDescriptionSet.has(fromUserId)) {
      // Queue the candidate until setRemoteDescription is called for this peer
      const queue = this.pendingCandidates.get(fromUserId) ?? [];
      queue.push(candidate);
      this.pendingCandidates.set(fromUserId, queue);
      return;
    }

    const pc = this.peerConnections.get(fromUserId);
    if (!pc) return;
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch { /* stale or invalid candidate */ }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async drainPendingCandidates(peerId: string, pc: RTCPeerConnection): Promise<void> {
    const queued = this.pendingCandidates.get(peerId) ?? [];
    this.pendingCandidates.delete(peerId);
    for (const candidate of queued) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch { /* stale candidate */ }
    }
  }

  private createPeerConnection(peerId: string): RTCPeerConnection {
    const existing = this.peerConnections.get(peerId);
    if (existing) { existing.close(); }

    // Reset ICE state for this peer
    this.remoteDescriptionSet.delete(peerId);
    this.pendingCandidates.delete(peerId);

    const pc = new RTCPeerConnection(this.rtcConfig);

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        this.ws.emit(
          'SendICECandidate',
          this.sessionId,
          peerId,
          JSON.stringify(candidate)
        ).catch(() => {});
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.peerConnections.delete(peerId);
        this.remoteDescriptionSet.delete(peerId);
        this.pendingCandidates.delete(peerId);
      }
    };

    this.peerConnections.set(peerId, pc);
    return pc;
  }

  private closePeerConnections(): void {
    this.peerConnections.forEach(pc => pc.close());
    this.peerConnections.clear();
    this.remoteDescriptionSet.clear();
    this.pendingCandidates.clear();
  }

  destroy(): void {
    // Listener-side cleanup first (sync)
    this.handleBroadcastStopped();
    // Speaker-side cleanup (async — fire-and-forget, emit may fail if WS is already disconnecting)
    this.stopBroadcast();
  }
}

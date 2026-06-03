import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface VadConfig {
  silenceThresholdDB?: number;  // dB below which audio is considered silent (default -50)
  silenceDurationMs?: number;   // ms of continuous silence before callback fires (default 1200)
  speechThresholdDB?: number;   // dB above which audio is treated as active speech (default -35)
}

@Injectable({ providedIn: 'root' })
export class AudioActivityDetector {

  volumeLevel$ = new BehaviorSubject<number>(0);
  waveformData$ = new BehaviorSubject<Uint8Array>(new Uint8Array(128));

  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private animationFrame: number | null = null;

  // Configurable thresholds — overridden per-device via configure()
  private silenceThresholdDB = -50;
  private silenceDurationMs  = 1200;
  // Amplitude must rise above this level at least once before silence can trigger the callback.
  // Prevents the callback from firing on ambient/startup noise before the user has spoken.
  private speechThresholdDB  = -35;

  private silenceStartTime: number | null = null;
  private silenceCallback: (() => void) | null = null;
  private pauseCount = 0;
  private wasSilent  = false;
  private isRunning  = false;

  // True once the user's audio has exceeded speechThresholdDB during this session.
  // Guards the silence callback so it never fires before the user has actually spoken.
  private _hasSpeechStarted = false;

  private dataArray: Uint8Array = new Uint8Array(128);

  // ─── CONFIGURATION ──────────────────────────────────────────────────────────

  /**
   * Override VAD thresholds before calling start().
   * Call this from VoiceRecognitionEngine with device-appropriate values.
   */
  configure(opts: VadConfig): void {
    if (opts.silenceThresholdDB !== undefined) this.silenceThresholdDB = opts.silenceThresholdDB;
    if (opts.silenceDurationMs  !== undefined) this.silenceDurationMs  = opts.silenceDurationMs;
    if (opts.speechThresholdDB  !== undefined) this.speechThresholdDB  = opts.speechThresholdDB;
    console.debug('[VAD] configured', {
      silenceThresholdDB: this.silenceThresholdDB,
      silenceDurationMs:  this.silenceDurationMs,
      speechThresholdDB:  this.speechThresholdDB
    });
  }

  /** Returns true once audio volume has exceeded speechThresholdDB this session. */
  hasSpeechStarted(): boolean {
    return this._hasSpeechStarted;
  }

  onSilenceDetected(callback: () => void): void {
    this.silenceCallback = callback;
  }

  // ─── LIFECYCLE ───────────────────────────────────────────────────────────────

  async start(): Promise<void> {
    if (this.isRunning) return;

    // Reset per-session state
    this._hasSpeechStarted = false;
    this.pauseCount = 0;
    this.wasSilent  = false;
    this.silenceStartTime = null;

    try {
      // IMPORTANT: autoGainControl is disabled so the AGC does not rapidly shift the
      // amplitude baseline mid-speech, which would cause brief near-silence readings
      // between words and trigger false silence detection on mobile devices.
      // sampleRate constraint is intentionally omitted — specifying 16000 in
      // getUserMedia is not a valid constraint and is silently ignored or rejected
      // by some mobile browsers, causing the stream to fail or behave unexpectedly.
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl:  false,
          channelCount:     1
        }
      });

      // Let the browser choose its native sample rate — we only need RMS amplitude,
      // not frequency precision, so sample rate does not affect correctness here.
      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;              // larger for smoother RMS
      this.analyser.smoothingTimeConstant = 0.4;
      this.analyser.minDecibels = -90;
      this.analyser.maxDecibels = -10;

      source.connect(this.analyser);
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.isRunning  = true;

      this.tick();
    } catch (e) {
      console.warn('[VAD] failed to start', e);
    }
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.volumeLevel$.next(0);
    this.waveformData$.next(new Uint8Array(128));
  }

  getPauseCount(): number {
    return this.pauseCount;
  }

  // ─── ANALYSIS LOOP ───────────────────────────────────────────────────────────

  private tick(): void {
    if (!this.isRunning || !this.analyser) return;

    this.analyser.getByteTimeDomainData(this.dataArray);
    this.waveformData$.next(new Uint8Array(this.dataArray));

    // RMS → dB
    const rms = this.calculateRMS(this.dataArray);
    const db  = rms > 0 ? 20 * Math.log10(rms) : -100;
    const volumeNormalized = Math.max(0, Math.min(100, (db + 90) / 80 * 100));
    this.volumeLevel$.next(volumeNormalized);

    // Track whether the user has started speaking (one-way latch per session).
    // Only audio that exceeds speechThresholdDB counts as "real speech" —
    // ambient noise typically sits below this level even on noisy mobile devices.
    if (db > this.speechThresholdDB) {
      this._hasSpeechStarted = true;
    }

    // Silence detection
    const isSilent = db < this.silenceThresholdDB;
    const now = Date.now();

    if (isSilent) {
      if (!this.wasSilent) {
        this.silenceStartTime = now;
        this.wasSilent = true;
      } else if (this.silenceStartTime && now - this.silenceStartTime >= this.silenceDurationMs) {
        this.pauseCount++;
        this.silenceStartTime = null; // prevent double-firing on sustained silence

        // Only fire if the user has actually spoken above the speech threshold.
        // This prevents the callback from triggering on startup ambient noise
        // before the user has said anything.
        if (this.silenceCallback && this._hasSpeechStarted) {
          console.debug('[VAD] silence detected after speech — firing callback', {
            pauseCount: this.pauseCount
          });
          this.silenceCallback();
        }
      }
    } else {
      this.wasSilent = false;
      this.silenceStartTime = null;
    }

    this.animationFrame = requestAnimationFrame(() => this.tick());
  }

  private calculateRMS(buffer: Uint8Array): number {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      const normalized = buffer[i] / 128 - 1; // 0–255 → -1..1
      sum += normalized * normalized;
    }
    return Math.sqrt(sum / buffer.length);
  }
}

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AudioActivityDetector {

  volumeLevel$ = new BehaviorSubject<number>(0);
  waveformData$ = new BehaviorSubject<Uint8Array>(new Uint8Array(128));

  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private animationFrame: number | null = null;
  private silenceThresholdDB = -50;     // dB threshold for silence
  private silenceDurationMs = 1200;     // hold silence this long before firing
  private silenceStartTime: number | null = null;
  private silenceCallback: (() => void) | null = null;
  private pauseCount = 0;
  private wasSilent = false;
  private isRunning = false;
  private dataArray: Uint8Array = new Uint8Array(128);

  onSilenceDetected(callback: () => void): void {
    this.silenceCallback = callback;
  }

  async start(): Promise<void> {
    if (this.isRunning) return;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,      // KEY: built-in browser noise reduction
          autoGainControl: true,       // auto adjusts mic sensitivity
          sampleRate: 16000            // optimal for speech recognition
        }
      });

      this.audioContext = new AudioContext({ sampleRate: 16000 });
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;         // small for low latency
      this.analyser.smoothingTimeConstant = 0.4;
      this.analyser.minDecibels = -90;
      this.analyser.maxDecibels = -10;

      source.connect(this.analyser);

      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.pauseCount = 0;
      this.wasSilent = false;
      this.silenceStartTime = null;
      this.isRunning = true;

      this.tick();
    } catch (e) {
      console.warn('AudioActivityDetector: failed to start', e);
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

  private tick(): void {
    if (!this.isRunning || !this.analyser) return;

    this.analyser.getByteTimeDomainData(this.dataArray);
    this.waveformData$.next(new Uint8Array(this.dataArray));

    // Calculate RMS volume in dB
    const rms = this.calculateRMS(this.dataArray);
    const db = rms > 0 ? 20 * Math.log10(rms) : -100;
    const volumeNormalized = Math.max(0, Math.min(100, (db + 90) / 80 * 100));
    this.volumeLevel$.next(volumeNormalized);

    // Silence detection
    const isSilent = db < this.silenceThresholdDB;
    const now = Date.now();

    if (isSilent) {
      if (!this.wasSilent) {
        // Just became silent
        this.silenceStartTime = now;
        this.wasSilent = true;
      } else if (
        this.silenceStartTime &&
        now - this.silenceStartTime >= this.silenceDurationMs
      ) {
        // Has been silent long enough
        this.pauseCount++;
        this.silenceStartTime = null; // prevent double-firing
        if (this.silenceCallback) {
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
      const normalized = buffer[i] / 128 - 1; // convert 0-255 to -1..1
      sum += normalized * normalized;
    }
    return Math.sqrt(sum / buffer.length);
  }
}

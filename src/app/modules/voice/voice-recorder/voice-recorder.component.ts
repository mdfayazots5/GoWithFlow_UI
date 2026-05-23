import {
  Component, Input, Output, EventEmitter, OnDestroy, OnInit, ElementRef, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { VoiceRecognitionEngine, VoiceSessionResult, RecordingState } from '../../../core/services/voice/voice-recognition.engine';

@Component({
  selector: 'app-voice-recorder',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './voice-recorder.component.html',
  styleUrls: ['./voice-recorder.component.scss']
})
export class VoiceRecorderComponent implements OnInit, OnDestroy {

  @Input() expectedText = '';
  @Input() turnIndex = 0;
  @Output() recordingComplete = new EventEmitter<VoiceSessionResult>();
  @Output() recordingStarted = new EventEmitter<void>();
  @Output() errorOccurred = new EventEmitter<string>();

  @ViewChild('waveformCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  state: RecordingState = 'idle';
  interimText = '';
  volumeLevel = 0;
  errorMessage = '';
  private canvasCtx: CanvasRenderingContext2D | null = null;
  private destroy$ = new Subject<void>();

  constructor(private engine: VoiceRecognitionEngine) {}

  ngOnInit(): void {
    this.engine.state$.pipe(takeUntil(this.destroy$)).subscribe(s => {
      this.state = s;
      if (s === 'listening') {
        setTimeout(() => this.initCanvas(), 100);
      }
    });

    this.engine.interimTranscript$.pipe(takeUntil(this.destroy$)).subscribe(t => {
      this.interimText = t;
    });

    this.engine.volumeLevel$.pipe(takeUntil(this.destroy$)).subscribe(v => {
      this.volumeLevel = v;
    });

    this.engine.waveformData$.pipe(takeUntil(this.destroy$)).subscribe(data => {
      if (this.state === 'listening') this.drawWaveform(data);
    });
  }

  async startRecording(): Promise<void> {
    this.errorMessage = '';
    this.recordingStarted.emit();
    try {
      const result = await this.engine.startSession(this.expectedText);
      this.recordingComplete.emit(result);
    } catch (err: any) {
      this.errorMessage = err?.message || 'Recording failed. Please try again.';
      this.errorOccurred.emit(this.errorMessage);
    }
  }

  stopEarly(): void {
    this.engine.stopSession();
  }

  private initCanvas(): void {
    if (!this.canvasRef?.nativeElement) return;
    const canvas = this.canvasRef.nativeElement;
    this.canvasCtx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  private drawWaveform(data: Uint8Array): void {
    if (!this.canvasCtx || !this.canvasRef?.nativeElement) return;
    const canvas = this.canvasRef.nativeElement;
    const ctx = this.canvasCtx;
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = 'rgba(61, 90, 153, 0.08)';
    ctx.fillRect(0, 0, W, H);

    // Waveform line
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#3D5A99';
    ctx.beginPath();

    const sliceWidth = W / data.length;
    let x = 0;
    for (let i = 0; i < data.length; i++) {
      const v = data[i] / 128.0;
      const y = (v * H) / 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      x += sliceWidth;
    }
    ctx.lineTo(W, H / 2);
    ctx.stroke();
  }

  getStateLabel(): string {
    const labels: Record<RecordingState, string> = {
      idle: 'Tap mic to start',
      requesting: 'Requesting microphone...',
      listening: 'Listening...',
      processing: 'Analyzing...',
      done: 'Done',
      error: 'Error'
    };
    return labels[this.state] || '';
  }

  ngOnDestroy(): void {
    this.engine.stopSession();
    this.destroy$.next();
    this.destroy$.complete();
  }
}

import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, X, Check, ZoomIn } from 'lucide-angular';

/**
 * Self-contained square avatar cropper (no external dependency). Shows the chosen image inside a
 * square frame the user can DRAG to pan and ZOOM with a slider; on save it renders the framed region
 * to a 512×512 JPEG `File`. Used by the avatar upload so every avatar is a normalized square (Item 6).
 *
 * Usage: render conditionally and bind `[file]`; it emits `(cropped)` with the 512×512 File or
 * `(cancelled)` when dismissed.
 */
@Component({
  selector: 'app-avatar-cropper',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style="background: rgba(15,15,28,0.78);" (click)="onBackdrop($event)">
      <div class="w-full max-w-sm rounded-3xl bg-gw-card-bg overflow-hidden shadow-2xl"
        style="padding-bottom: env(safe-area-inset-bottom);">

        <!-- Header -->
        <div class="flex items-center justify-between px-5 pt-4 pb-2">
          <h3 class="text-base font-black text-gw-text uppercase tracking-tight">Crop photo</h3>
          <button (click)="cancel()"
            class="w-9 h-9 rounded-xl bg-gw-bg flex items-center justify-center text-gw-text-muted active:scale-95 transition-all">
            <i-lucide [img]="CloseIcon" size="18"></i-lucide>
          </button>
        </div>

        <!-- Square crop frame -->
        <div class="px-5">
          <div #frame
            class="relative mx-auto rounded-2xl overflow-hidden bg-gw-bg touch-none select-none cursor-grab active:cursor-grabbing"
            [style.width.px]="FRAME" [style.height.px]="FRAME"
            (pointerdown)="onDown($event)" (pointermove)="onMove($event)"
            (pointerup)="onUp($event)" (pointercancel)="onUp($event)">
            <img #img [src]="objectUrl()" alt="" draggable="false"
              class="absolute top-0 left-0 origin-top-left max-w-none pointer-events-none"
              [style.transform]="transform()" (load)="onImageLoad()">
            <!-- Circular mask hint -->
            <div class="absolute inset-0 pointer-events-none rounded-2xl"
              style="box-shadow: 0 0 0 9999px rgba(0,0,0,0); outline: 2px dashed rgba(255,255,255,0.45); outline-offset: -8px;"></div>
          </div>
        </div>

        <!-- Zoom -->
        <div class="flex items-center gap-3 px-6 pt-4">
          <i-lucide [img]="ZoomIcon" size="16" class="text-gw-text-muted shrink-0"></i-lucide>
          <input type="range" min="1" max="3" step="0.01" [value]="zoom()"
            (input)="onZoom($any($event.target).value)"
            class="flex-1 accent-gw-primary">
        </div>

        <!-- Actions -->
        <div class="flex gap-2.5 px-5 py-4">
          <button (click)="cancel()"
            class="flex-1 h-11 rounded-xl bg-gw-bg text-gw-text font-black uppercase tracking-widest text-[12px] active:scale-95 transition-all">
            Cancel
          </button>
          <button (click)="save()" [disabled]="!ready()"
            class="flex-1 h-11 rounded-xl bg-gw-primary text-white font-black uppercase tracking-widest text-[12px]
                   flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-40">
            <i-lucide [img]="CheckIcon" size="15"></i-lucide> Use photo
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`:host { display: block; }`],
})
export class AvatarCropperComponent implements AfterViewInit, OnDestroy {
  /** Source image to crop. */
  @Input({ required: true }) file!: File;
  /** Emits the cropped 512×512 JPEG. */
  @Output() cropped = new EventEmitter<File>();
  /** Emits when the user dismisses the cropper. */
  @Output() cancelled = new EventEmitter<void>();

  @ViewChild('img') private imgRef?: ElementRef<HTMLImageElement>;

  readonly CloseIcon = X;
  readonly CheckIcon = Check;
  readonly ZoomIcon = ZoomIn;

  /** Crop frame size in CSS px. Output is always 512×512 regardless of this. */
  readonly FRAME = 260;
  private readonly OUTPUT = 512;

  readonly objectUrl = signal<string>('');
  readonly ready = signal(false);
  readonly zoom = signal(1);

  // Pan offset (top-left of the image relative to the frame) and the cover base scale.
  private tx = 0;
  private ty = 0;
  private baseScale = 1;       // scale that makes the image exactly COVER the frame at zoom 1
  private natW = 0;
  private natH = 0;

  private dragging = false;
  private lastX = 0;
  private lastY = 0;

  ngAfterViewInit(): void {
    this.objectUrl.set(URL.createObjectURL(this.file));
  }

  ngOnDestroy(): void {
    const u = this.objectUrl();
    if (u) URL.revokeObjectURL(u);
  }

  /** Once the image loads, compute the cover scale and center it in the frame. */
  onImageLoad(): void {
    const img = this.imgRef?.nativeElement;
    if (!img) return;
    this.natW = img.naturalWidth;
    this.natH = img.naturalHeight;
    this.baseScale = Math.max(this.FRAME / this.natW, this.FRAME / this.natH);
    this.zoom.set(1);
    const dispW = this.natW * this.effectiveScale();
    const dispH = this.natH * this.effectiveScale();
    this.tx = (this.FRAME - dispW) / 2;
    this.ty = (this.FRAME - dispH) / 2;
    this.ready.set(true);
  }

  private effectiveScale(): number {
    return this.baseScale * this.zoom();
  }

  /** CSS transform that positions + scales the image inside the frame. */
  transform(): string {
    return `translate(${this.tx}px, ${this.ty}px) scale(${this.effectiveScale()})`;
  }

  onZoom(value: string | number): void {
    const z = Math.max(1, Math.min(3, +value));
    // Keep the frame center anchored while zooming.
    const cx = this.FRAME / 2, cy = this.FRAME / 2;
    const prev = this.effectiveScale();
    this.zoom.set(z);
    const next = this.effectiveScale();
    const ratio = next / prev;
    this.tx = cx - (cx - this.tx) * ratio;
    this.ty = cy - (cy - this.ty) * ratio;
    this.clamp();
  }

  onDown(e: PointerEvent): void {
    this.dragging = true;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  onMove(e: PointerEvent): void {
    if (!this.dragging) return;
    this.tx += e.clientX - this.lastX;
    this.ty += e.clientY - this.lastY;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.clamp();
  }

  onUp(e: PointerEvent): void {
    this.dragging = false;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  }

  /** Keep the image always covering the frame (no empty gaps). */
  private clamp(): void {
    const dispW = this.natW * this.effectiveScale();
    const dispH = this.natH * this.effectiveScale();
    this.tx = Math.min(0, Math.max(this.FRAME - dispW, this.tx));
    this.ty = Math.min(0, Math.max(this.FRAME - dispH, this.ty));
  }

  onBackdrop(e: MouseEvent): void {
    if (e.target === e.currentTarget) this.cancel();
  }

  cancel(): void {
    this.cancelled.emit();
  }

  /** Render the framed square to a 512×512 canvas and emit it as a JPEG File. */
  save(): void {
    const img = this.imgRef?.nativeElement;
    if (!img || !this.ready()) return;

    const ratio = this.OUTPUT / this.FRAME;
    const canvas = document.createElement('canvas');
    canvas.width = this.OUTPUT;
    canvas.height = this.OUTPUT;
    const ctx = canvas.getContext('2d');
    if (!ctx) { this.cancel(); return; }

    const dispW = this.natW * this.effectiveScale();
    const dispH = this.natH * this.effectiveScale();
    ctx.drawImage(img, this.tx * ratio, this.ty * ratio, dispW * ratio, dispH * ratio);

    canvas.toBlob(blob => {
      if (!blob) { this.cancel(); return; }
      const name = (this.file.name || 'avatar').replace(/\.[^.]+$/, '') + '.jpg';
      this.cropped.emit(new File([blob], name, { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.9);
  }
}

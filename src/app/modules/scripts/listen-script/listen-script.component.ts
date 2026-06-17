import { Component, OnDestroy, OnInit, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import {
  LucideAngularModule, ChevronLeft, Play, Pause, SkipForward, SkipBack,
  AudioLines, Headphones, SlidersHorizontal,
} from 'lucide-angular';
import { catchError, of } from 'rxjs';
import { ScriptService } from '@core/services/script.service';
import { ScriptPlaybackService } from '@core/services/voice/script-playback.service';
import { ListenSettingsSheetComponent } from './listen-settings.sheet';

/**
 * Listen Script — immersive, Spotify-style audio player for a session script.
 *
 * Full-screen (no app header / bottom tab bar — see app.component fullBleedPatterns). Audio is
 * generated live, on-device, line-by-line (ScriptPlaybackService). The active line is highlighted
 * and auto-scrolled into view; the user can tap any line — or tap/drag the seek bar — to jump.
 * The on-device TTS engine is LINE-LEVEL (no mid-line seek), so the seek bar snaps to the nearest
 * line. Speed / Repeat / Voices live in the Settings sheet. No session, no microphone.
 */
@Component({
  selector: 'app-listen-script',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink, MatBottomSheetModule],
  template: `
    <div class="fixed inset-0 flex flex-col text-white"
      style="background: radial-gradient(120% 80% at 50% 0%, #232347 0%, #1A1A2E 45%, #0F0F1C 100%);">

      <!-- Top bar -->
      <div class="flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 shrink-0">
        <button routerLink="/scripts/listen"
          class="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:text-white active:scale-95 transition-all">
          <i-lucide [img]="BackIcon" size="22"></i-lucide>
        </button>
        <span class="text-[11px] font-black uppercase tracking-[0.25em] text-white/45 italic">Now Listening</span>
        <button (click)="openSettings()"
          class="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:text-white active:scale-95 transition-all">
          <i-lucide [img]="SettingsIcon" size="20"></i-lucide>
        </button>
      </div>

      @if (isLoading()) {
        <div class="flex-1 flex flex-col items-center justify-center gap-4">
          <div class="w-10 h-10 border-4 border-white/70 border-t-transparent rounded-full animate-spin"></div>
          <p class="text-sm font-black uppercase tracking-widest italic text-white/50">Loading script…</p>
        </div>
      }

      @else if (!playback.hasContent()) {
        <div class="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
          <div class="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
            <i-lucide [img]="HeadphonesIcon" size="24" class="text-white/60"></i-lucide>
          </div>
          <p class="text-base font-black italic">Nothing to play</p>
          <a routerLink="/scripts/listen" class="text-gw-primary font-bold text-sm italic">Pick another script</a>
        </div>
      }

      @else {
        <!-- Artwork + title -->
        <div class="flex flex-col items-center px-6 pt-2 pb-3 shrink-0">
          <div class="w-32 h-32 rounded-[28px] flex items-center justify-center shadow-2xl mb-3"
            [style.background]="'linear-gradient(135deg, ' + playback.roleColor(playback.roles()[0]) + ', #3D5A99)'">
            <i-lucide [img]="HeadphonesIcon" size="52" class="text-white"></i-lucide>
          </div>
          <h1 class="text-lg font-black italic uppercase tracking-tight text-center leading-tight line-clamp-2">
            {{ title() || 'Listen Script' }}
          </h1>
          <p class="text-[11px] font-bold uppercase tracking-widest italic text-white/40 mt-0.5">
            {{ playback.roles().length }} {{ playback.roles().length === 1 ? 'voice' : 'voices' }} · {{ playback.lines().length }} lines
          </p>
        </div>

        <!-- Lyrics list -->
        <div class="flex-1 overflow-y-auto px-4 pb-4 space-y-1.5 min-h-0">
          @for (line of playback.lines(); track line.index) {
            <button [id]="'listen-line-' + line.index"
              (click)="playback.seekTo(line.index)"
              class="w-full text-left rounded-2xl px-4 py-3 transition-all duration-300"
              [style.background]="line.index === playback.currentIndex() ? 'rgba(255,255,255,0.10)' : 'transparent'"
              [style.border]="line.index === playback.currentIndex() ? '1px solid ' + playback.roleColor(line.speakerLabel) : '1px solid transparent'">

              <div class="flex items-center gap-2 mb-1">
                <span class="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest"
                  [style.color]="playback.roleColor(line.speakerLabel)">
                  <span class="w-1.5 h-1.5 rounded-full" [style.background]="playback.roleColor(line.speakerLabel)"></span>
                  {{ line.speakerLabel }}
                </span>
                @if (line.index === playback.currentIndex() && playback.isPlaying()) {
                  <i-lucide [img]="WaveIcon" size="13" class="animate-pulse"
                    [style.color]="playback.roleColor(line.speakerLabel)"></i-lucide>
                }
              </div>

              <p class="font-bold leading-relaxed text-white transition-all duration-300"
                [class.text-base]="line.index === playback.currentIndex()"
                [class.text-sm]="line.index !== playback.currentIndex()"
                [style.opacity]="line.index === playback.currentIndex() ? 1 : (line.index < playback.currentIndex() ? 0.4 : 0.6)">
                {{ line.text }}
              </p>
            </button>
          }
        </div>

        <!-- Dock: seek + transport -->
        <div class="shrink-0 px-6 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]
                    bg-gradient-to-t from-[#0F0F1C] via-[#0F0F1C]/95 to-transparent">

          <!-- Seek bar (snaps to nearest LINE — engine has no mid-line seek) -->
          <div class="flex items-center gap-2.5 mb-3">
            <span class="text-[11px] font-bold text-white/55 tabular-nums w-6 text-right">{{ playback.currentIndex() + 1 }}</span>
            <div class="flex-1 py-2 cursor-pointer touch-none"
              (pointerdown)="onSeekDown($event)"
              (pointermove)="onSeekMove($event)"
              (pointerup)="onSeekUp($event)"
              (pointercancel)="onSeekUp($event)">
              <div class="relative h-1.5 bg-white/15 rounded-full">
                <div class="absolute inset-y-0 left-0 bg-white rounded-full" [style.width.%]="progressPct()"></div>
                <div class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white shadow"
                  [style.left.%]="progressPct()"></div>
              </div>
            </div>
            <span class="text-[11px] font-bold text-white/55 tabular-nums w-6">{{ playback.lines().length }}</span>
          </div>

          <!-- Transport -->
          <div class="flex items-center justify-center gap-6">
            <button (click)="playback.prev()"
              class="w-12 h-12 rounded-full flex items-center justify-center text-white/85 hover:text-white active:scale-95 transition-all">
              <i-lucide [img]="PrevIcon" size="26"></i-lucide>
            </button>

            <button (click)="playback.togglePlay()"
              class="w-16 h-16 rounded-full bg-white text-[#1A1A2E] flex items-center justify-center shadow-xl active:scale-95 transition-all">
              <i-lucide [img]="playback.isPlaying() ? PauseIcon : PlayIcon" size="30"></i-lucide>
            </button>

            <button (click)="playback.next()"
              class="w-12 h-12 rounded-full flex items-center justify-center text-white/85 hover:text-white active:scale-95 transition-all">
              <i-lucide [img]="NextIcon" size="26"></i-lucide>
            </button>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`:host { display: block; }`],
})
export class ListenScriptComponent implements OnInit, OnDestroy {
  readonly playback = inject(ScriptPlaybackService);
  private scriptService = inject(ScriptService);
  private route = inject(ActivatedRoute);
  private sheet = inject(MatBottomSheet);
  private platformId = inject(PLATFORM_ID);

  readonly BackIcon = ChevronLeft;
  readonly PlayIcon = Play;
  readonly PauseIcon = Pause;
  readonly NextIcon = SkipForward;
  readonly PrevIcon = SkipBack;
  readonly WaveIcon = AudioLines;
  readonly HeadphonesIcon = Headphones;
  readonly SettingsIcon = SlidersHorizontal;

  title = signal('');
  isLoading = signal(true);

  private scrubbing = false;

  readonly progressPct = computed(() => {
    const total = this.playback.lines().length;
    return total > 1 ? (this.playback.currentIndex() / (total - 1)) * 100 : 0;
  });

  constructor() {
    // Auto-scroll the active line into view whenever the playback position changes
    // (skip while the user is actively dragging the seek bar to avoid fighting their input).
    effect(() => {
      const idx = this.playback.currentIndex();
      if (!isPlatformBrowser(this.platformId) || !this.playback.hasContent() || this.scrubbing) return;
      queueMicrotask(() => {
        document.getElementById(`listen-line-${idx}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });
  }

  ngOnInit(): void {
    const scriptId = this.route.snapshot.paramMap.get('scriptId');
    if (!scriptId) {
      this.isLoading.set(false);
      return;
    }

    this.scriptService.getScriptDetail(scriptId).pipe(
      catchError(() => {
        this.isLoading.set(false);
        return of(null);
      })
    ).subscribe(data => {
      if (data) {
        this.title.set(data.scriptTitle ?? '');
        this.playback.load(scriptId, data.scriptTitle ?? '', data.utterances ?? []);
        // Auto-start: arriving here is a user navigation (gesture), so begin narration immediately.
        this.playback.play();
      }
      this.isLoading.set(false);
    });
  }

  // ── Seek bar: map an X position to the nearest LINE (no mid-line seek on-device) ──
  onSeekDown(e: PointerEvent): void {
    this.scrubbing = true;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    this.seekFromEvent(e);
  }
  onSeekMove(e: PointerEvent): void {
    if (this.scrubbing) this.seekFromEvent(e);
  }
  onSeekUp(e: PointerEvent): void {
    if (!this.scrubbing) return;
    this.scrubbing = false;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  }

  private seekFromEvent(e: PointerEvent): void {
    const total = this.playback.lines().length;
    if (!total) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const idx = Math.round(frac * (total - 1));
    if (idx !== this.playback.currentIndex()) this.playback.seekTo(idx);
  }

  openSettings(): void {
    this.sheet.open(ListenSettingsSheetComponent, { panelClass: 'preview-bottom-sheet' });
  }

  ngOnDestroy(): void {
    this.playback.reset();
  }
}

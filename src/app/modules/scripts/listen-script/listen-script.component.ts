import { Component, OnDestroy, OnInit, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatMenuModule } from '@angular/material/menu';
import {
  LucideAngularModule, ChevronLeft, Play, Pause, SkipForward, SkipBack,
  Repeat, Gauge, AudioLines, Headphones, Check
} from 'lucide-angular';
import { catchError, of } from 'rxjs';
import { ScriptService } from '@core/services/script.service';
import { ScriptPlaybackService, PLAYBACK_SPEEDS } from '@core/services/voice/script-playback.service';
import { ListenVoicesSheetComponent } from './listen-voices.sheet';

/**
 * Listen Script — Spotify-lyrics-style audio player for a session script.
 *
 * Audio is generated live, on-device, line-by-line (see ScriptPlaybackService). The active line
 * is highlighted and auto-scrolled into view; the user can scroll freely and tap any line to jump
 * playback there. No session is joined and no microphone is opened.
 */
@Component({
  selector: 'app-listen-script',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink, MatBottomSheetModule, MatMenuModule],
  template: `
    <div class="min-h-screen bg-gw-bg flex flex-col">

      <!-- Header -->
      <div class="sticky top-0 z-10 bg-gw-bg/95 backdrop-blur px-4 pt-2 pb-3 flex items-center gap-3">
        <button routerLink="/scripts/listen"
          class="w-10 h-10 rounded-xl bg-white border border-gw-card-border flex items-center justify-center text-gw-text-muted hover:text-gw-primary transition-all shrink-0">
          <i-lucide [img]="BackIcon" size="20"></i-lucide>
        </button>
        <div class="min-w-0 flex-1">
          <p class="text-[11px] font-bold text-gw-text-muted uppercase tracking-widest italic">Listen Script</p>
          <h2 class="text-base font-black text-gw-text italic uppercase tracking-tight truncate">
            {{ title() || 'Loading…' }}
          </h2>
        </div>
      </div>

      @if (isLoading()) {
        <div class="flex flex-col items-center justify-center py-24 gap-4">
          <div class="w-10 h-10 border-4 border-gw-primary border-t-transparent rounded-full animate-spin"></div>
          <p class="text-sm font-black uppercase tracking-widest italic text-gw-text-muted">Loading script…</p>
        </div>
      }

      @else if (!playback.hasContent()) {
        <div class="flex flex-col items-center justify-center py-24 gap-4 text-center px-6">
          <div class="w-12 h-12 rounded-2xl bg-white border border-gw-card-border flex items-center justify-center">
            <i-lucide [img]="HeadphonesIcon" size="22" class="text-gw-text-muted"></i-lucide>
          </div>
          <p class="text-base font-black text-gw-text italic">Nothing to play</p>
          <a routerLink="/scripts/listen" class="text-gw-primary font-bold text-sm italic">Pick another script</a>
        </div>
      }

      @else {
        <!-- Lyrics list -->
        <div class="flex-1 px-4 pb-40 space-y-1.5">
          @for (line of playback.lines(); track line.index) {
            <button [id]="'listen-line-' + line.index"
              (click)="playback.seekTo(line.index)"
              class="w-full text-left rounded-2xl px-4 py-3 transition-all duration-300"
              [class.bg-white]="line.index === playback.currentIndex()"
              [class.shadow-md]="line.index === playback.currentIndex()"
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

              <p class="font-bold leading-relaxed transition-all duration-300"
                [class.text-gw-text]="line.index === playback.currentIndex()"
                [class.text-base]="line.index === playback.currentIndex()"
                [class.text-gw-text-muted]="line.index !== playback.currentIndex()"
                [class.text-sm]="line.index !== playback.currentIndex()"
                [class.opacity-60]="line.index < playback.currentIndex()">
                {{ line.text }}
              </p>
            </button>
          }
        </div>

        <!-- Playback dock -->
        <div class="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gw-card-border px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div class="max-w-lg mx-auto">

            <!-- progress -->
            <div class="flex items-center gap-2 mb-3">
              <span class="text-[11px] font-bold text-gw-text-muted tabular-nums">{{ playback.currentIndex() + 1 }}</span>
              <div class="flex-1 h-1.5 bg-gw-bg rounded-full overflow-hidden">
                <div class="h-full bg-gw-primary rounded-full transition-all duration-300"
                  [style.width.%]="progressPct()"></div>
              </div>
              <span class="text-[11px] font-bold text-gw-text-muted tabular-nums">{{ playback.lines().length }}</span>
            </div>

            <!-- transport -->
            <div class="flex items-center justify-between gap-2">
              <!-- speed -->
              <button [matMenuTriggerFor]="speedMenu"
                class="h-11 px-3 rounded-xl bg-gw-bg flex items-center gap-1.5 text-gw-text-muted hover:text-gw-primary transition-all">
                <i-lucide [img]="SpeedIcon" size="16"></i-lucide>
                <span class="text-[11px] font-black tabular-nums">{{ playback.rate() }}x</span>
              </button>
              <mat-menu #speedMenu="matMenu" class="gwf-speed-menu">
                @for (s of speeds; track s) {
                  <button mat-menu-item (click)="playback.setRate(s)"
                    class="!flex items-center justify-between gap-6 !text-sm !font-bold">
                    <span class="tabular-nums">{{ s }}x</span>
                    @if (playback.rate() === s) {
                      <i-lucide [img]="CheckIcon" size="16" class="text-gw-primary"></i-lucide>
                    }
                  </button>
                }
              </mat-menu>

              <div class="flex items-center gap-2">
                <button (click)="playback.prev()"
                  class="w-11 h-11 rounded-xl bg-gw-bg flex items-center justify-center text-gw-text hover:text-gw-primary transition-all">
                  <i-lucide [img]="PrevIcon" size="20"></i-lucide>
                </button>

                <button (click)="playback.togglePlay()"
                  class="w-14 h-14 rounded-2xl bg-gw-primary text-white flex items-center justify-center shadow-lg hover:opacity-90 active:scale-95 transition-all">
                  <i-lucide [img]="playback.isPlaying() ? PauseIcon : PlayIcon" size="26"></i-lucide>
                </button>

                <button (click)="playback.next()"
                  class="w-11 h-11 rounded-xl bg-gw-bg flex items-center justify-center text-gw-text hover:text-gw-primary transition-all">
                  <i-lucide [img]="NextIcon" size="20"></i-lucide>
                </button>
              </div>

              <!-- repeat -->
              <button (click)="playback.cycleRepeat()"
                class="h-11 px-3 rounded-xl flex items-center gap-1.5 transition-all"
                [class.bg-gw-primary]="playback.repeat() !== 'off'"
                [class.text-white]="playback.repeat() !== 'off'"
                [class.bg-gw-bg]="playback.repeat() === 'off'"
                [class.text-gw-text-muted]="playback.repeat() === 'off'">
                <i-lucide [img]="RepeatIcon" size="16"></i-lucide>
                <span class="text-[11px] font-black uppercase">{{ repeatLabel() }}</span>
              </button>
            </div>

            <!-- voices -->
            <button (click)="openVoices()"
              class="mt-2.5 w-full h-10 rounded-xl bg-gw-bg flex items-center justify-center gap-2 text-gw-text-muted hover:text-gw-primary transition-all">
              <i-lucide [img]="WaveIcon" size="15"></i-lucide>
              <span class="text-[11px] font-black uppercase tracking-widest">Voices · {{ playback.roles().length }} roles</span>
            </button>

          </div>
        </div>
      }

    </div>
  `,
  styles: [`:host { display: block; }`]
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
  readonly RepeatIcon = Repeat;
  readonly SpeedIcon = Gauge;
  readonly WaveIcon = AudioLines;
  readonly HeadphonesIcon = Headphones;
  readonly CheckIcon = Check;

  readonly speeds = PLAYBACK_SPEEDS;

  title = signal('');
  isLoading = signal(true);

  readonly progressPct = computed(() => {
    const total = this.playback.lines().length;
    return total ? ((this.playback.currentIndex() + 1) / total) * 100 : 0;
  });

  repeatLabel(): string {
    return { off: 'Repeat', one: 'Line', all: 'All' }[this.playback.repeat()];
  }

  constructor() {
    // Auto-scroll the active line into view whenever the playback position changes.
    effect(() => {
      const idx = this.playback.currentIndex();
      if (!isPlatformBrowser(this.platformId) || !this.playback.hasContent()) return;
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
        // Auto-start: arriving here is a user navigation (gesture), so begin narration
        // immediately. If the browser blocks audio without a gesture, the user taps Play.
        this.playback.play();
      }
      this.isLoading.set(false);
    });
  }

  openVoices(): void {
    this.sheet.open(ListenVoicesSheetComponent, { panelClass: 'preview-bottom-sheet' });
  }

  ngOnDestroy(): void {
    this.playback.reset();
  }
}

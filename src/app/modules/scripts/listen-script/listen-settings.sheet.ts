import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { LucideAngularModule, X, Gauge, Repeat, AudioLines, Repeat2 } from 'lucide-angular';
import { ScriptPlaybackService, PLAYBACK_SPEEDS, RepeatMode } from '@core/services/voice/script-playback.service';
import { AI_VOICES } from '@core/services/voice/voice-personas';

/**
 * Listen Script — "Settings" sheet. Single place to change playback Speed, Repeat mode
 * (Off / Repeat line / Repeat all) and the per-role Voice. Reads/writes the live
 * ScriptPlaybackService so every change applies to playback immediately.
 */
@Component({
  selector: 'app-listen-settings-sheet',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="bg-gw-card-bg text-gw-text rounded-t-[20px] p-5 space-y-5 max-h-[85vh] overflow-y-auto">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-[11px] font-bold text-gw-text-muted uppercase tracking-widest italic">Settings</p>
          <h3 class="text-base font-black text-gw-text italic uppercase tracking-tight">Playback</h3>
        </div>
        <button (click)="close()"
          class="w-9 h-9 rounded-xl bg-gw-bg flex items-center justify-center text-gw-text-muted hover:text-gw-primary transition-all">
          <i-lucide [img]="CloseIcon" size="18"></i-lucide>
        </button>
      </div>

      <!-- Speed -->
      <div class="space-y-2">
        <div class="flex items-center gap-2 text-gw-text">
          <i-lucide [img]="SpeedIcon" size="15" class="text-gw-text-muted"></i-lucide>
          <span class="text-[11px] font-black uppercase tracking-widest">Speed</span>
        </div>
        <div class="grid grid-cols-6 gap-1.5">
          @for (s of speeds; track s) {
            <button (click)="playback.setRate(s)"
              class="h-10 rounded-xl text-[11px] font-black tabular-nums transition-all"
              [class.bg-gw-primary]="playback.rate() === s"
              [class.text-white]="playback.rate() === s"
              [class.bg-gw-bg]="playback.rate() !== s"
              [class.text-gw-text-muted]="playback.rate() !== s">
              {{ s }}x
            </button>
          }
        </div>
      </div>

      <!-- Repeat -->
      <div class="space-y-2">
        <div class="flex items-center gap-2 text-gw-text">
          <i-lucide [img]="RepeatIcon" size="15" class="text-gw-text-muted"></i-lucide>
          <span class="text-[11px] font-black uppercase tracking-widest">Repeat</span>
        </div>
        <div class="grid grid-cols-3 gap-1.5">
          @for (m of repeatModes; track m.mode) {
            <button (click)="playback.setRepeat(m.mode)"
              class="h-11 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all"
              [class.bg-gw-primary]="playback.repeat() === m.mode"
              [class.text-white]="playback.repeat() === m.mode"
              [class.bg-gw-bg]="playback.repeat() !== m.mode"
              [class.text-gw-text-muted]="playback.repeat() !== m.mode">
              {{ m.label }}
            </button>
          }
        </div>
      </div>

      <!-- Practice — repeat each line and/or pause so the learner can repeat it aloud -->
      <div class="space-y-2.5">
        <div class="flex items-center gap-2 text-gw-text">
          <i-lucide [img]="PracticeIcon" size="15" class="text-gw-text-muted"></i-lucide>
          <span class="text-[11px] font-black uppercase tracking-widest">Practice</span>
        </div>

        <!-- Master toggle -->
        <button (click)="playback.setPracticeMode(!playback.practiceMode())"
          class="w-full flex items-center justify-between gap-3 bg-gw-bg rounded-xl px-3.5 py-3 text-left">
          <span class="min-w-0">
            <span class="block text-sm font-bold text-gw-text">Repeat mode</span>
            <span class="block text-[11px] font-semibold text-gw-text-muted italic">Repeat each line, with time to say it back</span>
          </span>
          <span class="shrink-0 w-11 h-6 rounded-full transition-all relative"
            [class.bg-gw-primary]="playback.practiceMode()"
            [class.bg-gw-card-border]="!playback.practiceMode()">
            <span class="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
              [style.left.rem]="playback.practiceMode() ? 1.375 : 0.125"></span>
          </span>
        </button>

        @if (playback.practiceMode()) {
          <!-- Repeat count -->
          <div class="flex items-center justify-between gap-3 bg-gw-bg rounded-xl px-3.5 py-2.5">
            <span class="text-sm font-bold text-gw-text">Repeat each line</span>
            <div class="flex gap-1.5">
              @for (n of repeatCounts; track n) {
                <button (click)="playback.setRepeatCount(n)"
                  class="w-10 h-9 rounded-lg text-[12px] font-black tabular-nums transition-all"
                  [class.bg-gw-primary]="playback.repeatCount() === n"
                  [class.text-white]="playback.repeatCount() === n"
                  [class.bg-white]="playback.repeatCount() !== n"
                  [class.text-gw-text-muted]="playback.repeatCount() !== n">
                  {{ n }}×
                </button>
              }
            </div>
          </div>

          <!-- Pause to repeat -->
          <button (click)="playback.setPauseToRepeat(!playback.pauseToRepeat())"
            class="w-full flex items-center justify-between gap-3 bg-gw-bg rounded-xl px-3.5 py-3 text-left">
            <span class="min-w-0">
              <span class="block text-sm font-bold text-gw-text">Pause to repeat</span>
              <span class="block text-[11px] font-semibold text-gw-text-muted italic">Adds a gap after each line so you can say it</span>
            </span>
            <span class="shrink-0 w-11 h-6 rounded-full transition-all relative"
              [class.bg-gw-primary]="playback.pauseToRepeat()"
              [class.bg-gw-card-border]="!playback.pauseToRepeat()">
              <span class="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                [style.left.rem]="playback.pauseToRepeat() ? 1.375 : 0.125"></span>
            </span>
          </button>
        }
      </div>

      <!-- Voices — one of 6 named Indian voices per role -->
      @if (playback.roles().length > 0) {
        <div class="space-y-2">
          <div class="flex items-center gap-2 text-gw-text">
            <i-lucide [img]="WaveIcon" size="15" class="text-gw-text-muted"></i-lucide>
            <span class="text-[11px] font-black uppercase tracking-widest">Voices</span>
          </div>
          <div class="space-y-2">
            @for (role of playback.roles(); track role) {
              <div class="flex items-center justify-between gap-3 bg-gw-bg rounded-xl px-3.5 py-2.5">
                <span class="text-sm font-bold text-gw-text truncate flex items-center gap-2 min-w-0">
                  <span class="w-2 h-2 rounded-full shrink-0" [style.background]="playback.roleColor(role)"></span>
                  <span class="truncate">{{ role }}</span>
                </span>
                <select
                  (change)="playback.setRoleVoice(role, $any($event.target).value)"
                  class="h-9 bg-white rounded-lg px-2 text-[12px] font-bold text-gw-text border border-gw-card-border outline-none cursor-pointer shrink-0">
                  @for (v of voices; track v.id) {
                    <option [value]="v.id" [selected]="v.id === voiceIdOf(role)">{{ v.name }} ({{ v.gender === 'Male' ? 'M' : 'F' }})</option>
                  }
                </select>
              </div>
            }
          </div>
        </div>
      }

      <p class="text-[11px] font-semibold text-gw-text-muted italic leading-relaxed">
        Voices are Indian English (en-IN) and read on your device. Exact voices/speeds depend on your device's
        text-to-speech engine.
      </p>
    </div>
  `,
  styles: [`:host { display: block; }`],
})
export class ListenSettingsSheetComponent {
  readonly playback = inject(ScriptPlaybackService);
  private ref = inject(MatBottomSheetRef<ListenSettingsSheetComponent>);

  readonly CloseIcon = X;
  readonly SpeedIcon = Gauge;
  readonly RepeatIcon = Repeat;
  readonly WaveIcon = AudioLines;
  readonly PracticeIcon = Repeat2;

  readonly speeds = PLAYBACK_SPEEDS;
  readonly repeatCounts = [1, 2, 3];
  readonly voices = AI_VOICES;
  readonly repeatModes: Array<{ mode: RepeatMode; label: string }> = [
    { mode: 'off', label: 'Off' },
    { mode: 'one', label: 'Line' },
    { mode: 'all', label: 'All' },
  ];

  voiceIdOf(role: string): string {
    return this.playback.roleVoices()[role]?.id ?? this.voices[0].id;
  }

  close(): void {
    this.ref.dismiss();
  }
}

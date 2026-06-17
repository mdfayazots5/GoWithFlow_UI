import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { LucideAngularModule, X, Gauge, Repeat, AudioLines } from 'lucide-angular';
import {
  ScriptPlaybackService, PLAYBACK_SPEEDS, RepeatMode, VoiceGender,
} from '@core/services/voice/script-playback.service';

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
    <div class="p-5 space-y-5">
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

      <!-- Voices -->
      @if (playback.roles().length > 0) {
        <div class="space-y-2">
          <div class="flex items-center gap-2 text-gw-text">
            <i-lucide [img]="WaveIcon" size="15" class="text-gw-text-muted"></i-lucide>
            <span class="text-[11px] font-black uppercase tracking-widest">Voices</span>
          </div>
          <div class="space-y-2">
            @for (role of playback.roles(); track role) {
              <div class="flex items-center justify-between gap-3 bg-gw-bg rounded-xl px-3.5 py-2.5">
                <span class="text-sm font-bold text-gw-text truncate flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full shrink-0" [style.background]="playback.roleColor(role)"></span>
                  {{ role }}
                </span>
                <div class="flex bg-white rounded-lg p-0.5 border border-gw-card-border shrink-0">
                  @for (g of genders; track g) {
                    <button (click)="playback.setRoleGender(role, g)"
                      class="px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-widest transition-all"
                      [class.bg-gw-primary]="genderOf(role) === g"
                      [class.text-white]="genderOf(role) === g"
                      [class.text-gw-text-muted]="genderOf(role) !== g">
                      {{ g }}
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }

      <p class="text-[11px] font-semibold text-gw-text-muted italic leading-relaxed">
        Audio is read on your device. Voices and available speeds depend on your device's text-to-speech engine.
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

  readonly speeds = PLAYBACK_SPEEDS;
  readonly genders: VoiceGender[] = ['Female', 'Male'];
  readonly repeatModes: Array<{ mode: RepeatMode; label: string }> = [
    { mode: 'off', label: 'Off' },
    { mode: 'one', label: 'Line' },
    { mode: 'all', label: 'All' },
  ];

  genderOf(role: string): VoiceGender {
    return this.playback.roleVoices()[role]?.gender ?? 'Female';
  }

  close(): void {
    this.ref.dismiss();
  }
}

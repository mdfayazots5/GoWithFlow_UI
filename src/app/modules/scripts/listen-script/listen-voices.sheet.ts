import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { LucideAngularModule, X } from 'lucide-angular';
import { ScriptPlaybackService, VoiceGender } from '@core/services/voice/script-playback.service';

/**
 * Listen Script — "Voices" sheet. Lets the listener pick a Male/Female voice per role.
 * Reads/writes the live ScriptPlaybackService so changes apply to playback immediately.
 */
@Component({
  selector: 'app-listen-voices-sheet',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="p-5 space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-[11px] font-bold text-gw-text-muted uppercase tracking-widest italic">Voices</p>
          <h3 class="text-base font-black text-gw-text italic uppercase tracking-tight">Choose a voice per role</h3>
        </div>
        <button (click)="close()"
          class="w-9 h-9 rounded-xl bg-gw-bg flex items-center justify-center text-gw-text-muted hover:text-gw-primary transition-all">
          <i-lucide [img]="CloseIcon" size="18"></i-lucide>
        </button>
      </div>

      <div class="space-y-2.5">
        @for (role of playback.roles(); track role) {
          <div class="flex items-center justify-between gap-3 bg-gw-bg rounded-xl px-3.5 py-2.5">
            <span class="text-sm font-bold text-gw-text truncate">{{ role }}</span>
            <div class="flex bg-white rounded-lg p-0.5 border border-gw-card-border shrink-0">
              @for (g of genders; track g) {
                <button (click)="set(role, g)"
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

      <p class="text-[11px] font-semibold text-gw-text-muted italic leading-relaxed">
        Voices use your device's installed text-to-speech engine. Available voices vary by device.
      </p>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class ListenVoicesSheetComponent {
  readonly playback = inject(ScriptPlaybackService);
  private ref = inject(MatBottomSheetRef<ListenVoicesSheetComponent>);

  readonly CloseIcon = X;
  readonly genders: VoiceGender[] = ['Female', 'Male'];

  genderOf(role: string): VoiceGender {
    return this.playback.roleVoices()[role]?.gender ?? 'Female';
  }

  set(role: string, gender: VoiceGender): void {
    this.playback.setRoleGender(role, gender);
  }

  close(): void {
    this.ref.dismiss();
  }
}

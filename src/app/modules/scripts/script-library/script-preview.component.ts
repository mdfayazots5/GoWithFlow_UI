// File: src/app/modules/scripts/script-library/script-preview.component.ts
import { Component, Inject, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { Script } from '@core/models/script.model';
import { LucideAngularModule, X, Eye, EyeOff, BookOpen, Clock, Layers } from 'lucide-angular';

@Component({
  selector: 'app-script-preview',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="p-8 max-w-4xl mx-auto space-y-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
      <!-- Header -->
      <div class="flex items-start justify-between">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="px-3 py-1 bg-gw-primary/10 text-gw-primary rounded-lg text-[10px] font-black uppercase tracking-widest italic">{{ data.category }}</span>
            <span class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted italic">• V{{ data.version }}</span>
          </div>
          <h2 class="text-3xl font-black text-gw-text italic uppercase tracking-tight">{{ data.scriptTitle }}</h2>
          <p class="text-xs font-medium text-gw-text-muted">Grammar: {{ data.grammarFocusTag }} | Context: {{ data.contextTag }}</p>
        </div>
        <button (click)="close()" class="p-3 bg-gw-bg text-gw-text-muted hover:text-gw-error rounded-2xl transition-all">
          <i-lucide [img]="CloseIcon" size="24"></i-lucide>
        </button>
      </div>

      <!-- Stats Bar -->
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-gw-bg/50 p-4 rounded-3xl flex items-center gap-3">
          <div class="p-2 bg-white rounded-xl text-gw-primary">
            <i-lucide [img]="LinesIcon" size="20"></i-lucide>
          </div>
          <div>
            <p class="text-[8px] font-black uppercase tracking-widest text-gw-text-muted">Lines</p>
            <p class="text-lg font-black text-gw-text italic tabular-nums">{{ data.utteranceCount }}</p>
          </div>
        </div>
        <div class="bg-gw-bg/50 p-4 rounded-3xl flex items-center gap-3">
          <div class="p-2 bg-white rounded-xl text-gw-accent">
            <i-lucide [img]="ClockIcon" size="20"></i-lucide>
          </div>
          <div>
            <p class="text-[8px] font-black uppercase tracking-widest text-gw-text-muted">Complexity</p>
            <div class="flex gap-0.5 mt-0.5">
               @for (i of [1, 2, 3, 4, 5]; track i) {
                 <div class="w-1.5 h-1.5 rounded-full" [class.bg-gw-accent]="i <= data.complexityLevel" [class.bg-white]="i > data.complexityLevel"></div>
               }
            </div>
          </div>
        </div>
        <div class="bg-gw-bg/50 p-4 rounded-3xl flex items-center gap-3">
          <div class="p-2 bg-white rounded-xl text-gw-success">
            <i-lucide [img]="StudyIcon" size="20"></i-lucide>
          </div>
          <div>
            <p class="text-[8px] font-black uppercase tracking-widest text-gw-text-muted">Age Group</p>
            <p class="text-[10px] font-black text-gw-text uppercase italic tracking-tight">{{ data.targetAgeGroup }}</p>
          </div>
        </div>
      </div>

      <!-- Controls -->
      <div class="flex items-center justify-between border-b border-gw-bg pb-4">
        <h3 class="text-xl font-black text-gw-text italic uppercase tracking-tight">Script Content</h3>
        <button 
          (click)="showHints.set(!showHints())"
          class="flex items-center gap-2 px-4 py-2 bg-gw-bg rounded-xl text-[10px] font-black uppercase tracking-widest italic transition-all"
          [class.text-gw-primary]="showHints()"
          [class.text-gw-text-muted]="!showHints()"
        >
          <i-lucide [img]="showHints() ? EyeIcon : EyeOffIcon" size="14"></i-lucide>
          {{ showHints() ? 'Hide Hints' : 'Show All Hints' }}
        </button>
      </div>

      <!-- Utterances List -->
      <div class="space-y-4">
        @for (u of data.utterances; track u.sequenceId) {
          <div class="p-6 bg-white border border-gw-card-border rounded-3xl hover:border-gw-primary/30 transition-all group">
            <div class="flex items-start gap-6">
              <div class="w-10 h-10 rounded-2xl bg-gw-bg flex items-center justify-center text-xs font-black italic text-gw-text-muted group-hover:bg-gw-primary/10 group-hover:text-gw-primary transition-all">
                {{ u.sequenceId }}
              </div>
              <div class="flex-1 space-y-2">
                <div class="flex justify-between items-center">
                  <span class="text-[10px] font-black uppercase tracking-widest text-gw-primary italic">{{ u.speakerLabel }}</span>
                  @if (u.grammarTag) {
                    <span class="px-2 py-0.5 bg-gw-accent/5 text-gw-accent rounded text-[8px] font-black uppercase tracking-widest">{{ u.grammarTag }}</span>
                  }
                </div>
                <p class="text-lg font-bold text-gw-text leading-tight uppercase italic tracking-tight">"{{ u.englishText }}"</p>
                
                @if (showHints()) {
                  <div class="pt-2 animate-in slide-in-from-top-2 duration-300">
                    <p class="text-sm font-medium text-gw-text-muted">{{ u.hintText }}</p>
                  </div>
                }
              </div>
            </div>
          </div>
        }
      </div>

      <div class="pt-8 flex gap-4">
        <button class="flex-1 h-14 bg-gw-primary text-white font-black uppercase tracking-widest italic rounded-2xl hover:scale-[1.05] transition-all shadow-lg shadow-gw-primary/20">
          Start Session with this Script
        </button>
        <button (click)="close()" class="h-14 px-8 border-2 border-gw-card-border text-gw-text font-black uppercase tracking-widest italic rounded-2xl hover:bg-gw-bg transition-all">
          Close
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; border-radius: 48px 48px 0 0; background: white; }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--gw-bg); border-radius: 10px; }
  `]
})
export class ScriptPreviewComponent {
  private sheetRef = inject(MatBottomSheetRef<ScriptPreviewComponent>);
  
  readonly CloseIcon = X;
  readonly LinesIcon = Layers;
  readonly ClockIcon = Clock;
  readonly StudyIcon = BookOpen;
  readonly EyeIcon = Eye;
  readonly EyeOffIcon = EyeOff;

  showHints = signal(false);

  constructor(@Inject(MAT_BOTTOM_SHEET_DATA) public data: Script) {}

  close() {
    this.sheetRef.dismiss();
  }
}

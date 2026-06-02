import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ScriptService } from '@core/services/script.service';
import { LucideAngularModule, ChevronLeft, BookOpen, Mic, MicOff, Tag, MessageSquare, Globe, Play } from 'lucide-angular';
import { catchError, of } from 'rxjs';

interface Utterance {
  utteranceId: number;
  sequenceId: number;
  speakerLabel: string;
  englishText: string;
  hintText?: string;
  grammarTag?: string;
  contextTag?: string;
  focusWord?: string;
  pronunciationNote?: string;
}

interface ScriptDetail {
  scriptId: number;
  scriptTitle: string;
  category: string;
  grammarFocusTag: string;
  contextTag: string;
  complexityLevel: number;
  targetAgeGroup: string;
  hintLanguage: string;
  utteranceCount: number;
  utterances: Utterance[];
}

@Component({
  selector: 'app-script-prepare',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink],
  template: `
    <div class="space-y-6 animate-in fade-in duration-500 pb-32">

      <!-- Header -->
      <div class="flex items-center gap-4">
        <button routerLink="/scripts"
          class="w-10 h-10 rounded-xl bg-gw-bg flex items-center justify-center text-gw-text-muted hover:text-gw-primary transition-all">
          <i-lucide [img]="BackIcon" size="20"></i-lucide>
        </button>
        <div class="min-w-0">
          <p class="text-[10px] font-bold text-gw-text-muted uppercase tracking-widest italic">Session Preparation — Read Only</p>
          @if (script()) {
            <h2 class="text-xl font-black text-gw-text italic uppercase tracking-tighter truncate">{{ script()!.scriptTitle }}</h2>
          }
        </div>
      </div>

      @if (isLoading()) {
        <div class="flex flex-col items-center justify-center py-20 gap-4">
          <div class="w-10 h-10 border-4 border-gw-primary border-t-transparent rounded-full animate-spin"></div>
          <p class="text-sm font-black uppercase tracking-widest italic text-gw-text-muted">Loading script...</p>
        </div>
      }

      @else if (!script()) {
        <div class="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <p class="text-base font-black text-gw-text italic">Script not found</p>
          <a routerLink="/scripts" class="text-gw-primary font-bold text-sm italic">Back to library</a>
        </div>
      }

      @else {
        <!-- Script metadata card -->
        <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm p-5 space-y-3">
          <div class="flex flex-wrap gap-2">
            <span class="px-2.5 py-1 bg-gw-primary/10 text-gw-primary text-[9px] font-black uppercase tracking-wider rounded-lg italic">
              {{ script()!.category }}
            </span>
            <span class="px-2.5 py-1 bg-gw-bg text-gw-text-muted text-[9px] font-black uppercase tracking-wider rounded-lg italic">
              Level {{ script()!.complexityLevel }}
            </span>
            @if (script()!.grammarFocusTag && script()!.grammarFocusTag !== 'None') {
              <span class="px-2.5 py-1 bg-amber-50 text-amber-600 border border-amber-100 text-[9px] font-black uppercase tracking-wider rounded-lg italic">
                {{ script()!.grammarFocusTag }}
              </span>
            }
            @if (script()!.contextTag) {
              <span class="px-2.5 py-1 bg-gw-bg text-gw-text-muted text-[9px] font-black uppercase tracking-wider rounded-lg italic">
                {{ script()!.contextTag }}
              </span>
            }
          </div>
          <div class="flex items-center gap-4 text-[9px] font-bold text-gw-text-muted italic">
            <span>{{ script()!.utteranceCount }} turns</span>
            <span>{{ script()!.targetAgeGroup }}</span>
          </div>
          <p class="text-[10px] font-semibold text-gw-text-muted italic bg-gw-bg px-3 py-2 rounded-xl">
            Read through the script below to prepare before joining the session. No recording occurs here.
          </p>
        </div>

        <!-- Utterance list -->
        <div class="space-y-2">

          <!-- MockInterview header note -->
          @if (isMockInterview()) {
            <div class="bg-gw-primary/5 border border-gw-primary/20 rounded-xl px-4 py-2.5 flex items-start gap-2">
              <i-lucide [img]="MsgIcon" size="14" class="text-gw-primary mt-0.5 flex-shrink-0"></i-lucide>
              <p class="text-[9px] font-bold text-gw-primary italic">Interviewer turns are shaded. Prepare your Candidate answers before joining.</p>
            </div>
          }

          @for (turn of script()!.utterances; track turn.utteranceId) {
            <div class="rounded-xl border transition-all"
              [class.bg-gw-bg]="isFacilitatorTurn(turn.speakerLabel)"
              [class.bg-white]="!isFacilitatorTurn(turn.speakerLabel)"
              [class.border-gw-bg]="isFacilitatorTurn(turn.speakerLabel)"
              [class.border-gw-card-border]="!isFacilitatorTurn(turn.speakerLabel)">

              <div class="px-4 py-3">
                <!-- Speaker row -->
                <div class="flex items-center gap-2 mb-1.5">
                  <span class="text-[8px] font-black uppercase tracking-widest"
                    [class.text-gw-text-muted]="isFacilitatorTurn(turn.speakerLabel)"
                    [class.text-gw-primary]="!isFacilitatorTurn(turn.speakerLabel)">
                    {{ turn.speakerLabel }}
                  </span>
                  <span class="text-[7px] font-bold text-gw-text-muted">#{{ turn.sequenceId }}</span>
                  @if (isFacilitatorTurn(turn.speakerLabel)) {
                    <span class="text-[7px] font-black uppercase tracking-wider text-gw-text-muted italic px-1.5 py-0.5 bg-white rounded border border-gw-card-border">Facilitator</span>
                  }
                </div>

                <!-- English text -->
                <p class="text-sm font-semibold leading-relaxed"
                  [class.text-gw-text]="!isFacilitatorTurn(turn.speakerLabel)"
                  [class.text-gw-text-muted]="isFacilitatorTurn(turn.speakerLabel)">
                  {{ turn.englishText }}
                </p>

                <!-- HintText -->
                @if (turn.hintText) {
                  <p class="text-[10px] text-gw-text-muted italic mt-1 pl-2 border-l-2 border-gw-card-border">{{ turn.hintText }}</p>
                }

                <!-- Tags row -->
                @if (turn.grammarTag || turn.focusWord || turn.pronunciationNote) {
                  <div class="flex flex-wrap gap-1.5 mt-2">
                    @if (turn.grammarTag) {
                      <span class="flex items-center gap-1 text-[7px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                        <i-lucide [img]="TagIcon" size="9"></i-lucide>
                        {{ turn.grammarTag }}
                      </span>
                    }
                    @if (turn.focusWord) {
                      <span class="text-[7px] font-black uppercase tracking-wider text-gw-primary bg-gw-primary/10 px-1.5 py-0.5 rounded">
                        {{ turn.focusWord }}
                        @if (turn.pronunciationNote) { · {{ turn.pronunciationNote }} }
                      </span>
                    }
                  </div>
                }
              </div>
            </div>
          }
        </div>

        <!-- Start session CTA -->
        <div class="sticky bottom-4 flex gap-3 justify-center">
          <a routerLink="/scripts"
            class="h-12 px-5 bg-gw-bg text-gw-text-muted font-black text-[10px] uppercase tracking-widest italic rounded-2xl shadow-sm hover:bg-gw-card-border transition-all flex items-center gap-2">
            <i-lucide [img]="BookIcon" size="14"></i-lucide>
            Library
          </a>
          <button (click)="startSession()"
            class="h-12 px-8 bg-gw-primary text-white font-black text-[10px] uppercase tracking-widest italic rounded-2xl shadow-lg hover:opacity-90 transition-all flex items-center gap-2">
            <i-lucide [img]="PlayIcon" size="14"></i-lucide>
            Start Session
          </button>
        </div>
      }

    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class ScriptPrepareComponent implements OnInit {
  private scriptService = inject(ScriptService);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);

  readonly BackIcon  = ChevronLeft;
  readonly BookIcon  = BookOpen;
  readonly PlayIcon  = Play;
  readonly MicIcon   = Mic;
  readonly OffIcon   = MicOff;
  readonly TagIcon   = Tag;
  readonly MsgIcon   = MessageSquare;
  readonly GlobeIcon = Globe;

  script    = signal<ScriptDetail | null>(null);
  isLoading = signal(true);

  private readonly facilitatorLabels = new Set([
    'Interviewer', 'Tutor', 'Coach'
  ]);

  isMockInterview() {
    const cat = this.script()?.category ?? '';
    return cat === 'Mock Interview' || cat === 'Interview';
  }

  isFacilitatorTurn(speakerLabel: string): boolean {
    return this.facilitatorLabels.has(speakerLabel);
  }

  startSession() {
    const s = this.script();
    if (s) this.router.navigate(['/session/create'], { state: { script: s } });
  }

  ngOnInit() {
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
      this.script.set(data);
      this.isLoading.set(false);
    });
  }
}

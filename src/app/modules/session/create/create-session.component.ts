// File: src/app/modules/session/create/create-session.component.ts
import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SessionService } from '@core/services/session.service';
import { ScriptService } from '@core/services/script.service';
import { ToastService } from '@core/services/toast.service';
import { AI_VOICES, getVoicePersona } from '@core/services/voice/voice-personas';
import {
  LucideAngularModule,
  ChevronRight,
  Search,
  Users,
  Clock,
  Layers,
  Bot
} from 'lucide-angular';
import { Script } from '@core/models/script.model';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-create-session',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gw-bg">
      <div class="max-w-lg mx-auto px-4 pt-2 gwf-page-bottom space-y-4 animate-in fade-in duration-500">

        <!-- Page Heading -->
        <div>
          <h1 class="text-xl font-black text-gw-text tracking-tight">Create Session</h1>
          <p class="text-[11px] font-semibold text-gw-text-muted mt-0.5">Set up your practice room</p>
        </div>

        <form [formGroup]="createForm" class="space-y-5">

          <!-- Session Name -->
          <div class="bg-white rounded-2xl border border-gw-card-border p-5">
            <label class="block text-[11px] font-bold uppercase tracking-[0.22em] text-gw-text-muted mb-3">Session Name</label>
            <input
              formControlName="sessionName"
              type="text"
              class="w-full h-12 bg-gw-bg rounded-xl px-4 text-[15px] font-semibold text-gw-text border-2 border-transparent focus:border-gw-primary outline-none transition-colors placeholder:text-gw-text-muted placeholder:font-normal"
              placeholder="e.g. Weekend Interview Prep"
            >
          </div>

          <!-- Session Type + Max Members — read-only, derived from script -->
          @if (selectedScript()) {
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-white rounded-2xl border border-gw-card-border p-4 flex flex-col gap-1">
                <p class="text-[11px] font-bold uppercase tracking-[0.22em] text-gw-text-muted">Session Type</p>
                <div class="flex items-center gap-2 mt-1">
                  <i-lucide [img]="LayersIcon" size="15" class="text-gw-primary shrink-0"></i-lucide>
                  <p class="text-[13px] font-bold text-gw-text">{{ derivedMode() }}</p>
                </div>
                <p class="text-[11px] text-gw-text-muted italic">From script</p>
              </div>
              <div class="bg-white rounded-2xl border border-gw-card-border p-4 flex flex-col gap-1">
                <p class="text-[11px] font-bold uppercase tracking-[0.22em] text-gw-text-muted">Members</p>
                <div class="flex items-center gap-2 mt-1">
                  <i-lucide [img]="UsersIcon" size="15" class="text-gw-primary shrink-0"></i-lucide>
                  <p class="text-[13px] font-bold text-gw-text">{{ derivedMaxMembers() }}</p>
                </div>
                <p class="text-[11px] text-gw-text-muted italic">From script</p>
              </div>
            </div>
          }

          <!-- Script Selection -->
          <div class="bg-white rounded-2xl border border-gw-card-border p-5">
            <div class="flex items-center justify-between mb-3">
              <label class="text-[11px] font-bold uppercase tracking-[0.22em] text-gw-text-muted">Script</label>
              <a routerLink="/scripts" class="text-[11px] font-bold uppercase tracking-[0.16em] text-gw-primary hover:opacity-70 transition-opacity">Browse Library →</a>
            </div>

            @if (selectedScript()) {
              <div class="flex items-center justify-between bg-gw-primary/8 border border-gw-primary/20 rounded-xl px-4 py-3">
                <div>
                  <p class="text-[11px] font-bold uppercase tracking-[0.16em] text-gw-primary mb-0.5">Selected</p>
                  <p class="text-[14px] font-bold text-gw-text">{{ selectedScript()?.scriptTitle }}</p>
                  <p class="text-[11px] text-gw-text-muted mt-0.5">{{ selectedScript()?.utteranceCount }} lines · {{ selectedScript()?.grammarFocusTag }}</p>
                </div>
                <button type="button" (click)="clearSelectedScript()"
                  class="text-[11px] font-bold uppercase tracking-[0.16em] text-gw-text-muted hover:text-gw-error transition-colors ml-4 shrink-0">
                  Remove
                </button>
              </div>
            } @else {
              <div class="relative">
                <i-lucide [img]="SearchIcon" size="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-gw-text-muted pointer-events-none"></i-lucide>
                <input
                  type="text"
                  [formControl]="scriptSearch"
                  (focus)="showScriptDropdown.set(true)"
                  class="w-full h-12 bg-gw-bg rounded-xl pl-10 pr-4 text-[14px] font-semibold text-gw-text border-2 border-transparent focus:border-gw-primary outline-none transition-colors placeholder:text-gw-text-muted placeholder:font-normal"
                  placeholder="Search scripts..."
                >
                @if (showScriptDropdown() && filteredScripts().length) {
                  <div class="absolute z-20 top-full left-0 right-0 mt-1.5 bg-white border border-gw-card-border rounded-xl shadow-xl overflow-hidden max-h-56 overflow-y-auto">
                    @for (script of filteredScripts(); track script.id) {
                      <button
                        type="button"
                        (click)="selectScript(script)"
                        class="w-full flex flex-col items-start gap-1 px-4 py-3 hover:bg-gw-bg border-b border-gw-bg last:border-0 transition-colors text-left"
                      >
                        <span class="text-[13px] font-bold text-gw-text">{{ script.scriptTitle }}</span>
                        <span class="text-[11px] text-gw-text-muted">{{ script.utteranceCount }} lines · {{ script.grammarFocusTag }}</span>
                      </button>
                    }
                  </div>
                }
              </div>
              @if (scriptSearch.value && !selectedScript()) {
                <p class="text-[11px] text-gw-accent font-semibold mt-2 pl-1">Pick a result above to enable session creation.</p>
              }
            }
          </div>

          <!-- Duration + Expiry -->
          <div class="bg-white rounded-2xl border border-gw-card-border p-5">
            <label class="block text-[11px] font-bold uppercase tracking-[0.22em] text-gw-text-muted mb-3">Duration &amp; Room Expiry</label>
            <div class="grid grid-cols-2 gap-3">
              <select formControlName="sessionDuration"
                class="w-full h-12 bg-gw-bg rounded-xl px-3 text-[13px] font-bold text-gw-text border-2 border-transparent focus:border-gw-primary outline-none cursor-pointer">
                <option [value]="15">15 minutes</option>
                <option [value]="30">30 minutes</option>
                <option [value]="45">45 minutes</option>
                <option [value]="60">60 minutes</option>
              </select>
              <select formControlName="roomExpiry"
                class="w-full h-12 bg-gw-bg rounded-xl px-3 text-[13px] font-bold text-gw-text border-2 border-transparent focus:border-gw-primary outline-none cursor-pointer">
                <option value="1hr">Expires in 1 hr</option>
                <option value="6hr">Expires in 6 hrs</option>
                <option value="24hr">Expires in 24 hrs</option>
              </select>
            </div>
          </div>

          <!-- AI Voice Participant (Phase 17) -->
          <div class="bg-white rounded-2xl border border-gw-card-border p-5">
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-start gap-3">
                <div class="w-9 h-9 rounded-xl bg-gw-primary/10 flex items-center justify-center shrink-0">
                  <i-lucide [img]="BotIcon" size="18" class="text-gw-primary"></i-lucide>
                </div>
                <div>
                  <p class="text-[13px] font-bold text-gw-text">AI Voice Participant</p>
                  <p class="text-[11px] text-gw-text-muted mt-0.5 leading-snug">Practice solo — the AI reads the other role's scripted lines aloud. No second person needed.</p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                [attr.aria-checked]="aiEnabled()"
                (click)="toggleAi()"
                class="relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 mt-0.5"
                [style.background]="aiEnabled() ? 'var(--gw-primary)' : '#c9cdd6'"
              >
                <span class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
                  [style.transform]="aiEnabled() ? 'translateX(20px)' : 'translateX(0)'"></span>
              </button>
            </div>

            @if (aiEnabled()) {
              <div class="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gw-bg">
                <div class="flex flex-col gap-1.5">
                  <label class="text-[10px] font-bold uppercase tracking-[0.16em] text-gw-text-muted">Voice</label>
                  <select formControlName="aiVoiceName"
                    class="w-full h-11 bg-gw-bg rounded-xl px-2.5 text-[12px] font-bold text-gw-text border-2 border-transparent focus:border-gw-primary outline-none cursor-pointer">
                    @for (v of voices; track v.id) {
                      <option [value]="v.id">{{ v.name }} ({{ v.gender === 'Male' ? 'M' : 'F' }})</option>
                    }
                  </select>
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="text-[10px] font-bold uppercase tracking-[0.16em] text-gw-text-muted">Speed</label>
                  <select formControlName="aiSpeechRate"
                    class="w-full h-11 bg-gw-bg rounded-xl px-2.5 text-[12px] font-bold text-gw-text border-2 border-transparent focus:border-gw-primary outline-none cursor-pointer">
                    <option [ngValue]="0.75">Slow</option>
                    <option [ngValue]="1.00">Normal</option>
                    <option [ngValue]="1.25">Fast</option>
                  </select>
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="text-[10px] font-bold uppercase tracking-[0.16em] text-gw-text-muted">Delay</label>
                  <select formControlName="aiQuestionDelay"
                    class="w-full h-11 bg-gw-bg rounded-xl px-2.5 text-[12px] font-bold text-gw-text border-2 border-transparent focus:border-gw-primary outline-none cursor-pointer">
                    <option [ngValue]="0">0s</option>
                    <option [ngValue]="1">1s</option>
                    <option [ngValue]="2">2s</option>
                    <option [ngValue]="3">3s</option>
                    <option [ngValue]="5">5s</option>
                  </select>
                </div>
              </div>
            }
          </div>

          <!-- Submit Button -->
          <button
            type="button"
            (click)="onSubmit()"
            class="w-full h-14 rounded-2xl font-bold text-[13px] uppercase tracking-[0.2em] flex items-center justify-center gap-2.5 transition-all duration-150 cursor-pointer select-none"
            [style.background]="canCreateSession() ? 'var(--gw-accent)' : '#c9cdd6'"
            [style.color]="'white'"
            [style.opacity]="isLoading() ? '0.7' : '1'"
          >
            @if (isLoading()) {
              <span class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
              <span>Creating...</span>
            } @else {
              <span>Launch Session</span>
              <i-lucide [img]="NextIcon" size="16"></i-lucide>
            }
          </button>

        </form>

      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class CreateSessionComponent implements OnInit {
  private fb = inject(FormBuilder);
  private sessionService = inject(SessionService);
  private scriptService = inject(ScriptService);
  private toast = inject(ToastService);
  private router = inject(Router);

  private _preSelectedScript: Script | null = null;

  constructor() {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state;
    if (state?.['script']) {
      this._preSelectedScript = state['script'] as Script;
    }
  }

  readonly SearchIcon = Search;
  readonly NextIcon = ChevronRight;
  readonly UsersIcon = Users;
  readonly ClockIcon = Clock;
  readonly LayersIcon = Layers;
  readonly BotIcon = Bot;

  /** The 6 named Indian AI voices for the picker. */
  readonly voices = AI_VOICES;

  private readonly categoryModeMap: Record<string, string> = {
    'Grammar Drill': 'Grammar Drill',
    'Roleplay': 'Roleplay',
    'Mock Interview': 'Mock Interview',
    'Interview': 'Mock Interview',
    'Vocabulary Sprint': 'Vocabulary Sprint',
    'Vocabulary': 'Vocabulary Sprint',
    'Fluency Drill': 'Fluency Drill',
    'Question & Answer': 'Question & Answer',
    'Repractice Round': 'Repractice Round',
    'Repetition': 'Repractice Round'
  };

  isLoading = signal(false);
  selectedScript = signal<Script | null>(null);
  aiEnabled = signal(false);

  derivedMode = computed(() => {
    const cat = this.selectedScript()?.category ?? '';
    return this.categoryModeMap[cat] ?? cat;
  });

  derivedMaxMembers = computed(() => {
    // Distinct speaker labels count is not in the script list payload —
    // the backend derives it from utterances on creation. Display category default.
    const cat = this.selectedScript()?.category ?? '';
    const defaults: Record<string, number> = {
      'Grammar Drill': 2, 'Roleplay': 2, 'Mock Interview': 2,
      'Interview': 2, 'Vocabulary Sprint': 2, 'Vocabulary': 2,
      'Fluency Drill': 2, 'Question & Answer': 2, 'Repractice Round': 2, 'Repetition': 2
    };
    return defaults[cat] ?? 2;
  });

  scriptSearch = new FormControl('');
  filteredScripts = signal<Script[]>([]);
  showScriptDropdown = signal(false);
  private formValid = signal(false);
  canCreateSession = computed(() => !this.isLoading() && this.formValid());

  private updateFormValid() {
    this.formValid.set(
      !!this.createForm.get('sessionName')?.valid &&
      !!this.createForm.get('sessionDuration')?.valid &&
      !!this.createForm.get('roomExpiry')?.valid &&
      !!this.createForm.get('scriptId')?.value
    );
  }

  createForm: FormGroup = this.fb.group({
    sessionName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(60)]],
    scriptId: ['', Validators.required],
    sessionDuration: [30, Validators.required],
    roomExpiry: ['1hr', Validators.required],
    // AI Voice Participant (Phase 17)
    aiEnabled: [false],
    aiVoiceName: ['aarav'],
    aiSpeechRate: [1.00],
    aiQuestionDelay: [2]
  });

  toggleAi() {
    const next = !this.aiEnabled();
    this.aiEnabled.set(next);
    this.createForm.patchValue({ aiEnabled: next });
  }

  ngOnInit() {
    this.createForm.valueChanges.subscribe(() => this.updateFormValid());
    this.updateFormValid();

    this.scriptSearch.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      if (value !== this.selectedScript()?.scriptTitle) {
        this.createForm.patchValue({ scriptId: '' });
        this.selectedScript.set(null);
      }

      if (value && value.length > 1) {
        this.scriptService.getScripts({ search: value }).subscribe(res => {
          this.filteredScripts.set(res.items);
        });
      } else {
        this.filteredScripts.set([]);
      }
    });

    // Close dropdown on click outside
    document.addEventListener('click', (e: any) => {
      if (!e.target.closest('.relative')) {
        this.showScriptDropdown.set(false);
      }
    });

    if (this._preSelectedScript) {
      this.selectScript(this._preSelectedScript);
    }
  }

  selectScript(script: Script) {
    this.createForm.patchValue({ scriptId: script.id });
    this.selectedScript.set(script);
    this.scriptSearch.setValue(script.scriptTitle, { emitEvent: false });
    this.showScriptDropdown.set(false);
  }

  clearSelectedScript() {
    this.selectedScript.set(null);
    this.createForm.patchValue({ scriptId: '' });
    this.scriptSearch.setValue('');
    this.filteredScripts.set([]);
    this.showScriptDropdown.set(false);
  }

  onSubmit() {
    if (!this.canCreateSession()) {
      this.createForm.markAllAsTouched();
      this.toast.warning('Complete the session form and select a script to continue.');
      return;
    }

    const roomExpiryMap: Record<string, number> = { '1hr': 60, '6hr': 360, '24hr': 1440 };
    const payload: any = {
      sessionName: this.createForm.value.sessionName,
      sessionDuration: this.createForm.value.sessionDuration,
      scriptId: Number(this.createForm.value.scriptId),
      roomExpiryMinutes: roomExpiryMap[this.createForm.value.roomExpiry] ?? 60
    };

    // AI Voice Participant (Phase 17): send config only when enabled. The backend fills every
    // non-host slot with the AI, so the candidate can start solo without inviting anyone.
    if (this.aiEnabled()) {
      const persona = getVoicePersona(this.createForm.value.aiVoiceName);
      payload.aiEnabled = true;
      payload.aiVoiceName = persona.id;                 // named Indian voice (primary)
      payload.aiVoiceGender = persona.gender;           // derived, for legacy back-compat
      payload.aiSpeechRate = Number(this.createForm.value.aiSpeechRate);
      payload.aiQuestionDelaySec = Number(this.createForm.value.aiQuestionDelay);
    }

    this.isLoading.set(true);
    this.sessionService.createSession(payload).subscribe({
      next: (res) => {
        localStorage.setItem('gwf_sessionId', String(res.sessionId));
        localStorage.setItem('gwf_joinCode', res.joinCode);

        // AI session: every non-host slot is already filled by the AI, so there are no guest
        // slots to invite — go straight to the lobby.
        if (this.aiEnabled()) {
          this.isLoading.set(false);
          this.toast.success('AI practice session created!');
          this.router.navigate(['/session/lobby', res.sessionId]);
          return;
        }

        // Fetch all slot names from backend via validateCode — list items have no utterances
        this.sessionService.validateCode(res.joinCode).subscribe({
          next: (preview) => {
            this.isLoading.set(false);
            this.toast.success('Session created!');

            // Exclude slot 1 (host) — only pass unoccupied guest slots to invite screen
            const guestSlots = (preview.slots ?? [])
              .filter(s => !s.isOccupied)
              .map(s => ({ slotIndex: s.slotIndex, slotName: s.slotName }));

            this.router.navigate(['/session/invite'], {
              queryParams: {
                sessionId:   res.sessionId,
                sessionName: res.sessionName,
                slots:       JSON.stringify(guestSlots)
              }
            });
          },
          error: () => {
            this.isLoading.set(false);
            this.toast.success('Session created!');
            // Fallback: go to lobby if slot fetch fails
            this.router.navigate(['/session/lobby', res.sessionId]);
          }
        });
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

}

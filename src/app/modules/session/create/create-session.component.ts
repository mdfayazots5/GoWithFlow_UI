// File: src/app/modules/session/create/create-session.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SessionService } from '@core/services/session.service';
import { ScriptService } from '@core/services/script.service';
import { ToastService } from '@core/services/toast.service';
import { 
  LucideAngularModule, 
  MessageSquare, 
  Users, 
  Users2, 
  Mic2, 
  Zap, 
  RotateCcw, 
  Plus, 
  Minus, 
  ChevronRight, 
  Copy, 
  Share2, 
  Layout, 
  Clock, 
  Calendar,
  Search
} from 'lucide-angular';
import { Script } from '@core/models/script.model';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-create-session',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, RouterLink],
  template: `
    <div class="max-w-2xl mx-auto pb-20 animate-in fade-in duration-500">
      @if (!createdSession()) {
        <div class="space-y-8">
          <div class="space-y-1">
            <h2 class="text-3xl font-black text-gw-text italic uppercase tracking-tighter">CREATE SESSION</h2>
            <p class="text-xs font-bold text-gw-text-muted uppercase tracking-widest italic">Set up a new space for practice</p>
          </div>

          <div class="bg-white p-8 rounded-[48px] border border-gw-card-border shadow-sm space-y-8">
            <form [formGroup]="createForm" class="space-y-8">
              <!-- Session Name -->
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted px-2">Session Name*</label>
                <input 
                  formControlName="sessionName"
                  type="text" 
                  class="w-full h-14 bg-gw-bg/50 border-2 border-transparent focus:border-gw-primary rounded-2xl px-6 font-bold text-gw-text outline-none transition-all placeholder:italic" 
                  placeholder="e.g., Weekend Interview Prep"
                >
              </div>

              <!-- Session Mode -->
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted px-2">Practice mode*</label>
                <div class="grid grid-cols-2 gap-3">
                  @for (mode of modes; track mode.id) {
                    <button 
                      type="button"
                      (click)="createForm.get('sessionMode')?.setValue(mode.label)"
                      class="flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all gap-2"
                      [class.bg-gw-primary]="createForm.get('sessionMode')?.value === mode.label"
                      [class.border-gw-primary]="createForm.get('sessionMode')?.value === mode.label"
                      [class.text-white]="createForm.get('sessionMode')?.value === mode.label"
                      [class.bg-gw-bg/30]="createForm.get('sessionMode')?.value !== mode.label"
                      [class.border-transparent]="createForm.get('sessionMode')?.value !== mode.label"
                      [class.text-gw-text-muted]="createForm.get('sessionMode')?.value !== mode.label"
                    >
                      <i-lucide [img]="mode.icon" size="20"></i-lucide>
                      <span class="text-[10px] font-black uppercase tracking-widest text-center">{{ mode.label }}</span>
                    </button>
                  }
                </div>
              </div>

              <!-- Script Selection -->
              <div class="space-y-2 relative">
                <div class="flex justify-between items-center px-2">
                  <label class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Select Script*</label>
                  <a routerLink="/scripts" class="text-[10px] font-black uppercase tracking-widest text-gw-primary italic hover:underline">Browse Library</a>
                </div>
                <div class="relative">
                  <i-lucide [img]="SearchIcon" size="18" class="absolute left-4 top-1/2 -translate-y-1/2 text-gw-text-muted"></i-lucide>
                  <input 
                    type="text"
                    [formControl]="scriptSearch"
                    (focus)="showScriptDropdown.set(true)"
                    class="w-full h-14 bg-gw-bg/50 border-2 border-transparent focus:border-gw-primary rounded-2xl pl-12 pr-4 font-bold text-gw-text outline-none transition-all placeholder:italic"
                    placeholder="Search for a script..."
                  >
                  
                  @if (showScriptDropdown() && filteredScripts().length) {
                    <div class="absolute z-10 top-full left-0 right-0 mt-2 bg-white border border-gw-card-border rounded-3xl shadow-2xl max-h-64 overflow-y-auto overflow-x-hidden">
                      @for (script of filteredScripts(); track script.id) {
                        <button 
                          type="button"
                          (click)="selectScript(script)"
                          class="w-full p-4 border-b border-gw-bg last:border-0 hover:bg-gw-bg/50 transition-all flex flex-col items-start gap-1"
                        >
                          <span class="text-sm font-black text-gw-text italic uppercase tracking-tight">{{ script.scriptTitle }}</span>
                          <div class="flex gap-2">
                            <span class="text-[8px] font-black uppercase tracking-widest text-gw-accent italic">{{ script.grammarFocusTag }}</span>
                            <span class="text-[8px] font-black uppercase tracking-widest text-gw-text-muted italic">• {{ script.utteranceCount }} Lines</span>
                          </div>
                        </button>
                      }
                    </div>
                  }
                </div>
              </div>

              <!-- Max Members & Duration -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div class="space-y-2">
                  <label class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted px-2">Max Members</label>
                  <div class="flex items-center justify-between h-14 bg-gw-bg/50 rounded-2xl px-2">
                    <button type="button" (click)="adjustMembers(-1)" class="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gw-text-muted hover:text-gw-primary transition-all">
                      <i-lucide [img]="MinusIcon" size="18"></i-lucide>
                    </button>
                    <div class="flex items-center gap-2">
                       @for (i of [1,2,3,4,5]; track i) {
                         <div 
                           class="w-2.5 h-2.5 rounded-full" 
                           [class.bg-gw-primary]="i <= createForm.get('maxMembers')?.value"
                           [class.bg-white/50]="i > createForm.get('maxMembers')?.value"
                         ></div>
                       }
                       <span class="text-lg font-black italic ml-2">{{ createForm.get('maxMembers')?.value }}</span>
                    </div>
                    <button type="button" (click)="adjustMembers(1)" class="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gw-text-muted hover:text-gw-primary transition-all">
                      <i-lucide [img]="PlusIcon" size="18"></i-lucide>
                    </button>
                  </div>
                </div>

                <div class="space-y-2">
                  <label class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted px-2">Duration / Expiry</label>
                  <div class="grid grid-cols-2 gap-2">
                     <select formControlName="sessionDuration" class="h-14 bg-gw-bg/50 border-2 border-transparent focus:border-gw-primary rounded-2xl px-4 font-bold text-gw-text outline-none appearance-none transition-all cursor-pointer">
                        <option [value]="15">15 Min</option>
                        <option [value]="30">30 Min</option>
                        <option [value]="45">45 Min</option>
                        <option [value]="60">60 Min</option>
                     </select>
                     <select formControlName="roomExpiry" class="h-14 bg-gw-bg/50 border-2 border-transparent focus:border-gw-primary rounded-2xl px-4 font-bold text-gw-text outline-none appearance-none transition-all cursor-pointer">
                        <option value="1hr">1 Hour</option>
                        <option value="6hr">6 Hours</option>
                        <option value="24hr">24 Hours</option>
                     </select>
                  </div>
                </div>
              </div>

              <button 
                type="button"
                [disabled]="createForm.invalid || isLoading()"
                (click)="onSubmit()"
                class="w-full h-16 bg-gw-primary text-white font-black uppercase tracking-widest italic rounded-2xl hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3 shadow-xl shadow-gw-primary/20"
              >
                {{ isLoading() ? 'CREATING...' : 'CREATE SESSION' }}
                <i-lucide [img]="NextIcon" size="20"></i-lucide>
              </button>
            </form>
          </div>
        </div>
      } @else {
        <!-- SUCCESS STATE / JOIN CODE CARD -->
        <div class="space-y-8 animate-in zoom-in duration-500">
           <div class="bg-white p-12 rounded-[64px] border border-gw-card-border shadow-2xl text-center space-y-10 relative overflow-hidden">
              <div class="absolute top-0 left-0 w-full h-2 bg-gw-primary"></div>
              
              <div class="space-y-2">
                <div class="w-16 h-16 bg-gw-success/10 rounded-[24px] flex items-center justify-center text-gw-success mx-auto mb-4">
                   <i-lucide [img]="CheckIcon" size="32"></i-lucide>
                </div>
                <h3 class="text-3xl font-black text-gw-text italic uppercase tracking-tight">READY TO FLOW</h3>
                <p class="text-sm font-bold text-gw-text-muted uppercase tracking-widest italic">Share this code with your family</p>
              </div>

              <div class="bg-gw-bg/50 p-10 rounded-[40px] relative group">
                 <p class="text-6xl font-black text-gw-text tracking-[0.2em] italic">{{ createdSession()?.joinCode }}</p>
                 <div class="flex justify-center gap-4 mt-8">
                    <button (click)="copyCode()" class="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-gw-text-muted hover:text-gw-primary shadow-sm transition-all">
                       <i-lucide [img]="CopyIcon" size="20"></i-lucide>
                    </button>
                    <button (click)="shareSession()" class="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-gw-text-muted hover:text-gw-accent shadow-sm transition-all">
                       <i-lucide [img]="ShareIcon" size="20"></i-lucide>
                    </button>
                 </div>
              </div>

              <div class="grid gap-4">
                 <button (click)="goToLobby()" class="h-16 bg-gw-primary text-white font-black uppercase tracking-widest italic rounded-2xl hover:scale-[1.05] transition-all shadow-xl shadow-gw-primary/20">
                    ENTER LOBBY
                 </button>
                 <button (click)="createdSession.set(null)" class="text-xs font-black text-gw-text-muted uppercase tracking-widest italic hover:text-gw-text transition-colors">
                    Create Another
                 </button>
              </div>
           </div>
        </div>
      }
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

  readonly SearchIcon = Search;
  readonly MinusIcon = Minus;
  readonly PlusIcon = Plus;
  readonly NextIcon = ChevronRight;
  readonly CopyIcon = Copy;
  readonly ShareIcon = Share2;
  readonly CheckIcon = Zap;

  modes = [
    { id: '1', label: 'Grammar Drill', icon: MessageSquare },
    { id: '2', label: 'Roleplay', icon: Users },
    { id: '3', label: 'Mock Interview', icon: Layout },
    { id: '4', label: 'Vocabulary Sprint', icon: Zap },
    { id: '5', label: 'Fluency Drill', icon: Mic2 },
    { id: '6', label: 'Repractice Round', icon: RotateCcw }
  ];

  isLoading = signal(false);
  createdSession = signal<any>(null);
  
  scriptSearch = new FormControl('');
  filteredScripts = signal<Script[]>([]);
  showScriptDropdown = signal(false);

  createForm: FormGroup = this.fb.group({
    sessionName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(60)]],
    sessionMode: ['Grammar Drill', Validators.required],
    scriptId: ['', Validators.required],
    scriptTitle: ['', Validators.required],
    maxMembers: [4, [Validators.required, Validators.min(2), Validators.max(5)]],
    sessionDuration: [30, Validators.required],
    roomExpiry: ['1hr', Validators.required]
  });

  ngOnInit() {
    this.scriptSearch.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
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
  }

  selectScript(script: Script) {
    this.createForm.patchValue({
      scriptId: script.id,
      scriptTitle: script.scriptTitle
    });
    this.scriptSearch.setValue(script.scriptTitle, { emitEvent: false });
    this.showScriptDropdown.set(false);
  }

  adjustMembers(delta: number) {
    const current = this.createForm.get('maxMembers')?.value;
    const next = current + delta;
    if (next >= 2 && next <= 5) {
      this.createForm.get('maxMembers')?.setValue(next);
    }
  }

  onSubmit() {
    if (this.createForm.invalid) return;

    this.isLoading.set(true);
    this.sessionService.createSession(this.createForm.value).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.createdSession.set(res);
        this.toast.success('Session created!');
      },
      error: () => this.isLoading.set(false)
    });
  }

  copyCode() {
    if (this.createdSession()) {
      navigator.clipboard.writeText(this.createdSession().joinCode);
      this.toast.success('Code copied to clipboard');
    }
  }

  shareSession() {
    if (navigator.share && this.createdSession()) {
      navigator.share({
        title: 'Join GoWithFlow Session',
        text: `Join my ${this.createForm.value.sessionMode} session! Code: ${this.createdSession().joinCode}`,
        url: window.location.origin + '/session/join?code=' + this.createdSession().joinCode
      }).catch(() => {});
    } else {
      this.copyCode();
    }
  }

  goToLobby() {
    if (this.createdSession()) {
      this.router.navigate(['/session/lobby', this.createdSession().id]);
    }
  }
}

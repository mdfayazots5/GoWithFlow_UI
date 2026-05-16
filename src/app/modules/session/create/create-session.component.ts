import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Plus, Play, Users, BookOpen, ChevronRight, Check } from 'lucide-angular';
import { SessionService } from '@core/services/session.service';
import { ScriptService, Script } from '@core/services/script.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-session',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="p-6 max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-5 duration-500">
      <div class="text-center space-y-2">
        <h1 class="text-4xl font-black italic uppercase tracking-tighter text-ls-text">Start Practice</h1>
        <p class="text-ls-text-muted font-bold text-xs uppercase tracking-widest">Create a room for your family to practice together</p>
      </div>

      <div class="card space-y-8 shadow-2xl shadow-black/5">
        <div class="space-y-6">
          <!-- Session Name -->
          <div class="space-y-2">
            <label class="text-[10px] font-black uppercase tracking-widest text-ls-text-muted px-1">Session Name</label>
            <input type="text" [(ngModel)]="sessionData.title" placeholder="e.g. Sunday Family Practice" class="input-field h-14">
          </div>

          <!-- Mode & Capacity -->
          <div class="grid grid-cols-2 gap-4">
             <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-ls-text-muted px-1">Mode</label>
                <select [(ngModel)]="sessionData.mode" class="input-field h-14 appearance-none cursor-pointer">
                   <option value="Grammar Drill">Grammar Drill</option>
                   <option value="Roleplay">Roleplay</option>
                   <option value="Mock Interview">Mock Interview</option>
                </select>
             </div>
             <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-ls-text-muted px-1">Max Members</label>
                <select [(ngModel)]="sessionData.maxMembers" class="input-field h-14 appearance-none cursor-pointer">
                   <option [ngValue]="2">2 People</option>
                   <option [ngValue]="4">4 People</option>
                   <option [ngValue]="6">6 People</option>
                </select>
             </div>
          </div>

          <!-- Script Selection -->
          <div class="space-y-2">
            <label class="text-[10px] font-black uppercase tracking-widest text-ls-text-muted px-1 flex justify-between">
              Select Script
              <span class="text-ls-primary hover:underline cursor-pointer">Browse All</span>
            </label>
            <div class="space-y-3">
               <div *ngFor="let s of scripts" 
                    (click)="sessionData.scriptId = s.id"
                    [class.border-ls-primary]="sessionData.scriptId === s.id"
                    [class.bg-blue-50]="sessionData.scriptId === s.id"
                    class="p-4 border border-ls-card-border rounded-2xl flex items-center justify-between cursor-pointer hover:bg-ls-bg transition-all group">
                  <div class="flex items-center gap-4">
                     <div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-ls-text-muted group-hover:text-ls-primary transition-colors">
                        <i-lucide [img]="BookIcon" size="18"></i-lucide>
                     </div>
                     <div>
                        <p class="text-sm font-bold text-ls-text">{{ s.title }}</p>
                        <p class="text-[10px] font-medium text-ls-text-muted uppercase tracking-widest">{{ s.category }} • {{ s.grammarFocusTag }}</p>
                     </div>
                  </div>
                  <div *ngIf="sessionData.scriptId === s.id" class="w-6 h-6 bg-ls-primary rounded-full flex items-center justify-center text-white">
                     <i-lucide [img]="CheckIcon" size="14"></i-lucide>
                  </div>
               </div>
            </div>
          </div>
        </div>

        <button 
          (click)="createSession()"
          [disabled]="loading || !sessionData.title || !sessionData.scriptId"
          class="w-full btn-primary h-16 text-xl gap-3"
        >
          {{ loading ? 'Opening Room...' : 'Create Practice Room' }}
          <i-lucide *ngIf="!loading" [img]="PlayIcon" size="24"></i-lucide>
        </button>
      </div>

      <!-- Success Dialog (Simulated) -->
      <div *ngIf="createdSession" class="fixed inset-0 bg-ls-text/80 backdrop-blur-sm z-[110] flex items-center justify-center p-6 animate-in fade-in duration-300">
         <div class="card w-full max-w-sm text-center space-y-6 scale-in-center">
            <div class="w-20 h-20 bg-ls-success/10 text-ls-success rounded-[32px] flex items-center justify-center mx-auto">
               <i-lucide [img]="CheckIcon" size="40"></i-lucide>
            </div>
            <div class="space-y-2">
               <h3 class="text-2xl font-black italic uppercase tracking-tighter text-ls-text">Room Created!</h3>
               <p class="text-ls-text-muted text-xs font-semibold uppercase tracking-widest">Share this code with your group</p>
            </div>
            <div class="bg-ls-bg py-6 rounded-3xl border-2 border-dashed border-ls-card-border">
               <span class="text-5xl font-black italic text-ls-primary tracking-[0.2em]">{{ createdSession.joinCode }}</span>
            </div>
            <button (click)="goToLobby()" class="w-full btn-primary h-14">Go to Lobby</button>
         </div>
      </div>
    </div>
  `,
  styles: []
})
export class CreateSessionComponent implements OnInit {
  readonly BookIcon = BookOpen;
  readonly CheckIcon = Check;
  readonly PlayIcon = Play;

  loading = false;
  scripts: Script[] = [];
  createdSession: any = null;

  sessionData = {
    title: '',
    mode: 'Grammar Drill',
    scriptId: '',
    maxMembers: 4
  };

  constructor(
    private sessionService: SessionService,
    private scriptService: ScriptService,
    private router: Router
  ) {}

  ngOnInit() {
    this.scriptService.getScripts({ PageSize: 3 }).subscribe(res => this.scripts = res.items);
  }

  createSession() {
    this.loading = true;
    this.sessionService.createSession(this.sessionData).subscribe({
      next: (res) => {
        this.createdSession = res;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  goToLobby() {
    this.router.navigate(['/session/lobby', this.createdSession.id]);
  }
}

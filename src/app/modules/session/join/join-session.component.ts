import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Hash, UserPlus, ArrowRight, Play, CheckCircle } from 'lucide-angular';
import { SessionService } from '@core/services/session.service';
import { AuthService } from '@core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-join-session',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="p-6 max-w-md mx-auto space-y-8 animate-in slide-in-from-top-10 duration-700">
      <div class="flex flex-col items-center gap-6">
        <div class="w-20 h-20 bg-ls-accent rounded-[32px] flex items-center justify-center shadow-xl shadow-ls-accent/20 rotate-6">
          <i-lucide [img]="HashIcon" size="40" class="text-white"></i-lucide>
        </div>
        <div class="text-center">
          <h1 class="text-4xl font-black italic uppercase tracking-tighter text-ls-text">Join Practice</h1>
          <p class="text-ls-text-muted font-bold text-xs uppercase tracking-widest mt-1">Enter your family's room code</p>
        </div>
      </div>

      <div class="card p-8 space-y-8 shadow-2xl shadow-black/5 relative overflow-hidden">
        <div class="absolute -right-20 -top-20 w-40 h-40 bg-ls-primary/5 rounded-full blur-3xl"></div>

        <div *ngIf="!validatedSession" class="space-y-8 relative">
           <div class="space-y-2">
              <label class="text-[10px] font-black uppercase tracking-widest text-ls-text-muted px-1">6-Digit Join Code</label>
              <input 
                type="text" 
                [(ngModel)]="joinCode"
                placeholder="000000"
                maxlength="6"
                class="w-full h-20 bg-ls-bg border-none rounded-3xl text-center text-4xl font-black italic tracking-[0.2em] text-ls-primary outline-none focus:ring-4 focus:ring-ls-primary/10 transition-all placeholder:text-ls-text-muted/20"
              >
           </div>

           <button 
             (click)="validateCode()"
             [disabled]="loading || joinCode.length < 6"
             class="w-full btn-primary h-16 text-xl gap-3"
           >
             {{ loading ? 'Searching...' : 'Find Room' }}
             <i-lucide *ngIf="!loading" [img]="NextIcon" size="24"></i-lucide>
           </button>
        </div>

        <div *ngIf="validatedSession" class="space-y-8 animate-in zoom-in-95 duration-500">
           <div class="bg-ls-bg p-6 rounded-3xl border border-ls-card-border space-y-4">
              <div class="flex items-center gap-4">
                 <div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-ls-primary shadow-sm">
                    <i-lucide [img]="PlayIcon" size="24"></i-lucide>
                 </div>
                 <div>
                    <p class="font-black italic text-ls-text uppercase tracking-tight text-lg">{{ validatedSession.title }}</p>
                    <p class="text-[10px] font-black uppercase tracking-widest text-ls-text-muted">{{ validatedSession.mode }}</p>
                 </div>
              </div>
           </div>

           <button 
             (click)="joinSession()"
             [disabled]="joining"
             class="w-full btn-primary h-16 text-xl gap-3 bg-ls-success shadow-ls-success/20"
           >
              {{ joining ? 'Securing Slot...' : 'Join Now' }}
              <i-lucide *ngIf="!joining" [img]="JoinIcon" size="24"></i-lucide>
           </button>

           <button (click)="validatedSession = null" class="w-full text-xs font-black uppercase tracking-widest text-ls-text-muted hover:text-ls-primary transition-all">
             Try a different code
           </button>
        </div>
      </div>

      <div class="text-center pt-4">
         <p class="text-xs text-ls-text-muted font-bold uppercase tracking-widest">Don't have a code?</p>
         <button [routerLink]="['/session/create']" class="text-ls-primary font-black italic tracking-tight text-lg hover:underline mt-1">Start a New Practice Room</button>
      </div>
    </div>
  `,
  styles: []
})
export class JoinSessionComponent {
  readonly HashIcon = Hash;
  readonly NextIcon = ArrowRight;
  readonly PlayIcon = Play;
  readonly JoinIcon = UserPlus;

  joinCode = '';
  loading = false;
  joining = false;
  validatedSession: any = null;

  constructor(
    private sessionService: SessionService,
    private auth: AuthService,
    private router: Router
  ) {}

  validateCode() {
    this.loading = true;
    this.sessionService.validateCode(this.joinCode).subscribe({
      next: (res) => {
        this.validatedSession = res;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  joinSession() {
    const user = this.auth.currentUser;
    if (!user) return;

    this.joining = true;
    this.sessionService.joinSession({
      sessionId: this.validatedSession.id,
      userId: user.id,
      name: user.name
    }).subscribe({
      next: () => {
        this.joining = false;
        this.router.navigate(['/session/lobby', this.validatedSession.id]);
      },
      error: () => this.joining = false
    });
  }
}

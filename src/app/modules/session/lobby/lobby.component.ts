// File: src/app/modules/session/lobby/lobby.component.ts
import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SessionService } from '@core/services/session.service';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';
import { 
  LucideAngularModule, 
  Copy, 
  CheckCircle2, 
  Circle, 
  ChevronDown, 
  ChevronUp, 
  Play, 
  LogOut, 
  User, 
  Loader2,
  Calendar,
  Clock,
  Layers,
  ArrowRight
} from 'lucide-angular';
import { LobbyState, LobbyMember } from '@core/models/session.model';
import { environment } from '@env/environment';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-24">
      <!-- Session Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="px-3 py-1 bg-gw-primary/10 text-gw-primary rounded-lg text-[10px] font-black uppercase tracking-widest italic">{{ state()?.session?.sessionMode }}</span>
            <span class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted italic">• {{ state()?.session?.scriptTitle }}</span>
          </div>
          <h2 class="text-4xl font-black text-gw-text italic uppercase tracking-tighter">{{ state()?.session?.sessionName }}</h2>
        </div>

        <div class="bg-white p-4 rounded-[32px] border border-gw-card-border shadow-sm flex items-center gap-6 pr-8">
           <div class="flex flex-col items-center pl-4">
              <span class="text-[8px] font-black uppercase tracking-widest text-gw-text-muted mb-1">Join Code</span>
              <span class="text-3xl font-black text-gw-text tracking-widest italic">{{ state()?.session?.joinCode }}</span>
           </div>
           <button (click)="copyCode()" class="w-12 h-12 bg-gw-bg rounded-2xl flex items-center justify-center text-gw-text-muted hover:text-gw-primary transition-all">
              <i-lucide [img]="CopyIcon" size="20"></i-lucide>
           </button>
        </div>
      </div>

      <!-- Member Slots -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        @for (member of [0, 1, 2, 3, 4].slice(0, state()?.session?.maxMembers || 0); track member) {
          @let activeMember = getMemberAtSlot(member + 1);
          
          <div 
            class="bg-white p-6 rounded-[40px] border-2 transition-all flex items-center justify-between"
            [class.border-gw-success]="activeMember?.ready"
            [class.border-gw-primary]="activeMember && !activeMember.ready"
            [class.border-gw-card-border]="!activeMember"
            [class.border-dashed]="!activeMember"
          >
            <div class="flex items-center gap-4">
               @if (activeMember) {
                 <div class="w-14 h-14 rounded-2xl bg-gw-bg border border-gw-card-border p-1">
                    <img [src]="activeMember.avatar" class="w-full h-full object-cover rounded-xl">
                 </div>
                 <div>
                    <div class="flex items-center gap-2">
                       <h4 class="text-lg font-black text-gw-text italic tracking-tight">{{ activeMember.name }}</h4>
                       @if (activeMember.isHost) {
                         <span class="px-2 py-0.5 bg-gw-accent/10 text-gw-accent rounded-md text-[8px] font-black uppercase tracking-widest italic">Host</span>
                       }
                    </div>
                    <span class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted italic">{{ activeMember.slotName }}</span>
                 </div>
               } @else {
                 <div class="w-14 h-14 rounded-2xl border-2 border-dashed border-gw-card-border flex items-center justify-center text-gw-card-border animate-pulse">
                    <i-lucide [img]="UserIcon" size="20"></i-lucide>
                 </div>
                 <div>
                    <h4 class="text-lg font-black text-gw-card-border italic tracking-tight">WAITING...</h4>
                    <span class="text-[10px] font-black uppercase tracking-widest text-gw-card-border italic">Available Slot</span>
                 </div>
               }
            </div>

            @if (activeMember) {
              <div 
                class="flex flex-col items-center gap-1 transition-all"
                [class.text-gw-success]="activeMember.ready"
                [class.text-gw-text-muted]="!activeMember.ready"
              >
                 <i-lucide [img]="activeMember.ready ? CheckIcon : EmptyIcon" size="24"></i-lucide>
                 <span class="text-[8px] font-black uppercase tracking-widest italic">{{ activeMember.ready ? 'READY' : 'JOINING' }}</span>
              </div>
            }
          </div>
        }
      </div>

      <!-- Script Accordion -->
      <div class="bg-white rounded-[32px] border border-gw-card-border shadow-sm overflow-hidden transition-all">
         <button 
           (click)="showScript.set(!showScript())"
           class="w-full p-6 flex items-center justify-between hover:bg-gw-bg/30 transition-all font-black uppercase text-[10px] tracking-widest text-gw-text italic"
         >
           <div class="flex items-center gap-3">
              <i-lucide [img]="ScriptIcon" size="18" class="text-gw-primary"></i-lucide>
              Script Preview: {{ state()?.session?.scriptTitle }}
           </div>
           <i-lucide [img]="showScript() ? UpIcon : DownIcon" size="18"></i-lucide>
         </button>
         
         @if (showScript()) {
           <div class="p-8 pt-0 space-y-4 animate-in slide-in-from-top-4 duration-300">
              <p class="text-sm font-medium text-gw-text leading-relaxed border-l-4 border-gw-primary pl-4 bg-gw-bg/20 py-4 rounded-r-2xl italic">
                 "{{ state()?.session?.scriptTitle }} — First utterance logic will be displayed here as a preview of what you are about to practice."
              </p>
              <div class="flex gap-4">
                 <div class="flex items-center gap-2 text-xs font-bold text-gw-text-muted italic">
                    <i-lucide [img]="LayersIcon" size="14"></i-lucide>
                    4 Utterances
                 </div>
                 <div class="flex items-center gap-2 text-xs font-bold text-gw-text-muted italic">
                    <i-lucide [img]="ClockIcon" size="14"></i-lucide>
                    30 Min Estimated
                 </div>
              </div>
           </div>
         }
      </div>

      <!-- Footer Actions -->
      <div class="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-gw-card-border z-40">
         <div class="max-w-4xl mx-auto flex gap-4">
            <button (click)="leaveSession()" class="h-16 px-8 bg-white border-2 border-gw-card-border text-gw-text-muted rounded-2xl flex items-center justify-center hover:bg-gw-error/10 hover:text-gw-error hover:border-gw-error/20 transition-all">
               <i-lucide [img]="LeaveIcon" size="24"></i-lucide>
            </button>
            
            @if (isHost()) {
              <button 
                [disabled]="!state()?.canStart || isLoading()"
                (click)="startSession()"
                class="flex-1 h-16 bg-gw-primary text-white font-black uppercase tracking-widest italic rounded-2xl hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3 shadow-xl shadow-gw-primary/20"
              >
                {{ isLoading() ? 'STARTING...' : 'START SESSION' }}
                <i-lucide [img]="PlayIcon" size="20"></i-lucide>
              </button>
            } @else {
              <button 
                (click)="toggleReady()"
                class="flex-1 h-16 border-2 font-black uppercase tracking-widest italic rounded-2xl transition-all flex items-center justify-center gap-3"
                [class.bg-gw-success]="isReady()"
                [class.text-white]="isReady()"
                [class.border-gw-success]="isReady()"
                [class.bg-white]="!isReady()"
                [class.text-gw-text-muted]="!isReady()"
                [class.border-gw-card-border]="!isReady()"
              >
                {{ isReady() ? 'READY TO GO' : 'IM READY' }}
                @if (isReady()) {
                  <i-lucide [img]="CheckIcon" size="20"></i-lucide>
                }
              </button>
            }
         </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class LobbyComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private sessionService = inject(SessionService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  readonly CopyIcon = Copy;
  readonly CheckIcon = CheckCircle2;
  readonly EmptyIcon = Circle;
  readonly UserIcon = User;
  readonly ScriptIcon = Clock;
  readonly LayersIcon = Layers;
  readonly ClockIcon = Clock;
  readonly UpIcon = ChevronUp;
  readonly DownIcon = ChevronDown;
  readonly PlayIcon = Play;
  readonly LeaveIcon = LogOut;

  state = signal<LobbyState | null>(null);
  isLoading = signal(false);
  isReady = signal(false);
  isHost = signal(false);
  showScript = signal(false);

  private pollInterval: any;

  ngOnInit() {
    this.route.params.subscribe(params => {
      const sessionId = params['sessionId'];
      if (sessionId) {
        this.loadLobby(sessionId);
        
        // In demo mode, simulate updates via interval
        if (environment.isDemo) {
          this.pollInterval = setInterval(() => this.loadLobby(sessionId), 5000);
        }
      }
    });

    const user = this.authService.currentUser;
    // Default isReady for demo if needed, but normally it's false
  }

  ngOnDestroy() {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  loadLobby(sessionId: string) {
    this.sessionService.getLobbyState(sessionId).subscribe(state => {
      this.state.set(state);
      const user = this.authService.currentUser;
      const myMember = state.members.find(m => m.userId === user?.id);
      if (myMember) {
        this.isReady.set(myMember.ready);
        this.isHost.set(myMember.isHost);
      }
    });
  }

  getMemberAtSlot(slotIndex: number): LobbyMember | undefined {
    return this.state()?.members.find(m => m.slotIndex === slotIndex);
  }

  copyCode() {
    if (this.state()?.session) {
      navigator.clipboard.writeText(this.state()!.session.joinCode);
      this.toast.success('Code copied!');
    }
  }

  toggleReady() {
    const next = !this.isReady();
    this.sessionService.updateReadyStatus({
      sessionId: this.state()!.session.id,
      ready: next
    }).subscribe(() => {
      this.isReady.set(next);
      this.loadLobby(this.state()!.session.id);
    });
  }

  startSession() {
    this.isLoading.set(true);
    this.sessionService.startSession(this.state()!.session.id).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/live-session/room', this.state()!.session.id]);
      },
      error: () => this.isLoading.set(false)
    });
  }

  leaveSession() {
    if (confirm('Are you sure you want to leave this session?')) {
      this.sessionService.leaveSession(this.state()!.session.id).subscribe(() => {
        this.router.navigate(['/user/dashboard']);
      });
    }
  }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, User, Clock, Play, CheckCircle, MessageSquare, ArrowLeft, Copy, Share2 } from 'lucide-angular';
import { SessionService } from '@core/services/session.service';
import { WebsocketService } from '@core/services/websocket.service';
import { AuthService } from '@core/services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-ls-bg p-6 space-y-8 animate-in fade-in duration-700">
      <!-- Header -->
      <div class="flex items-center justify-between">
         <button [routerLink]="['/admin/dashboard']" class="p-3 bg-white rounded-2xl border border-ls-card-border text-ls-text-muted hover:text-ls-primary transition-all shadow-sm">
            <i-lucide [img]="BackIcon" size="20"></i-lucide>
         </button>
         <div class="text-center">
            <h2 class="text-2xl font-black italic uppercase tracking-tighter text-ls-text">{{ session?.title }}</h2>
            <div class="flex items-center justify-center gap-2">
               <span class="text-[10px] font-black uppercase tracking-widest text-ls-success animate-pulse">Lobby Active</span>
               <div class="w-1.5 h-1.5 bg-ls-success rounded-full"></div>
            </div>
         </div>
         <button (click)="copyCode()" class="p-3 bg-ls-primary text-white rounded-2xl shadow-xl shadow-ls-primary/20 hover:scale-105 active:scale-95 transition-all">
            <i-lucide [img]="ShareIcon" size="20"></i-lucide>
         </button>
      </div>

      <!-- Join Code Showcase -->
      <div class="card bg-white border-2 border-ls-primary relative overflow-hidden flex flex-col items-center py-10 gap-4 shadow-2xl shadow-ls-primary/10">
         <div class="absolute -left-10 -bottom-10 w-40 h-40 bg-ls-primary/5 rounded-full"></div>
         <p class="text-[10px] font-black uppercase tracking-[0.3em] text-ls-text-muted">Invitation Code</p>
         <h3 class="text-6xl font-black italic text-ls-primary tracking-[0.2em]">{{ session?.joinCode }}</h3>
         <button (click)="copyCode()" class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-ls-text-muted hover:text-ls-primary transition-all">
            <i-lucide [img]="CopyIcon" size="14"></i-lucide>
            Click to Copy
         </button>
      </div>

      <!-- Members Grid -->
      <div class="space-y-4">
         <h3 class="text-xs font-black uppercase tracking-[0.2em] text-ls-text-muted px-2 flex justify-between">
            Group Members
            <span>{{ members.length }}/6</span>
         </h3>
         
         <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div *ngFor="let m of members" class="card flex items-center justify-between group transition-all" [class.border-ls-success]="m.ready">
               <div class="flex items-center gap-4">
                  <div class="relative">
                     <img [src]="'https://api.dicebear.com/7.x/avataaars/svg?seed=' + m.name" class="w-14 h-14 rounded-2xl border-2 border-ls-bg group-hover:border-ls-primary transition-all">
                     <div *ngIf="m.isHost" class="absolute -top-2 -left-2 bg-ls-accent text-white p-1 rounded-lg">
                        <i-lucide [img]="CheckIcon" size="10"></i-lucide>
                     </div>
                  </div>
                   <div>
                     <p class="font-black italic text-ls-text text-lg leading-none">{{ m.name }}</p>
                     <p class="text-[10px] font-bold text-ls-text-muted uppercase tracking-widest">{{ m.slotName }}</p>
                  </div>
               </div>
               
               <div class="flex flex-col items-end gap-1">
                  <div class="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border" 
                       [class.bg-green-50]="m.ready" [class.text-ls-success]="m.ready" [class.border-green-100]="m.ready"
                       [class.bg-ls-bg]="!m.ready" [class.text-ls-text-muted]="!m.ready" [class.border-ls-card-border]="!m.ready">
                     {{ m.ready ? 'Ready' : 'Waiting' }}
                  </div>
               </div>
            </div>

            <!-- Empty Slot -->
            <div *ngIf="members.length < (session?.maxMembers || 4)" class="card border-dashed flex items-center justify-center py-6 gap-3 opacity-50">
               <div class="w-10 h-10 bg-ls-bg rounded-xl flex items-center justify-center text-ls-text-muted/50">
                  <i-lucide [img]="UserIcon" size="20"></i-lucide>
               </div>
               <span class="text-[10px] font-black uppercase tracking-[0.2em] text-ls-text-muted">Empty Slot</span>
            </div>
         </div>
      </div>

      <!-- Footer Controls -->
      <div class="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-ls-card-border z-50 md:pl-[246px]">
         <div class="max-w-4xl mx-auto flex gap-4">
            <button 
              (click)="toggleReady()"
              class="flex-1 h-16 rounded-2xl font-black italic uppercase tracking-tighter text-xl transition-all border-4 flex items-center justify-center gap-3"
              [class.bg-white]="isReady" [class.border-ls-success]="isReady" [class.text-ls-success]="isReady"
              [class.bg-ls-bg]="!isReady" [class.border-ls-card-border]="!isReady" [class.text-ls-text-muted]="!isReady"
            >
               <i-lucide [img]="isReady ? CheckIcon : ClockIcon" size="24"></i-lucide>
               {{ isReady ? "I'm Ready!" : 'Wait, Setting Up' }}
            </button>

            <button 
              *ngIf="isHost"
              (click)="startSession()"
              [disabled]="!allReady"
              class="flex-1 btn-primary h-16 text-xl gap-3 shadow-ls-primary/30"
            >
               Start Session
               <i-lucide [img]="PlayIcon" size="24"></i-lucide>
            </button>
         </div>
      </div>
    </div>
  `,
  styles: []
})
export class LobbyComponent implements OnInit, OnDestroy {
  readonly BackIcon = ArrowLeft;
  readonly UserIcon = User;
  readonly ClockIcon = Clock;
  readonly PlayIcon = Play;
  readonly CheckIcon = CheckCircle;
  readonly MessageIcon = MessageSquare;
  readonly CopyIcon = Copy;
  readonly ShareIcon = Share2;

  sessionId = 0;
  session: any;
  members: any[] = [];
  isReady = false;
  isHost = false;
  userId = '';

  private subs = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sessionService: SessionService,
    private ws: WebsocketService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('sessionId') || '';
    this.sessionId = parseInt(idParam, 10);
    this.userId = this.auth.currentUser?.id || '';

    if (this.sessionId) {
      this.loadLobby();
      this.ws.connectLobby(this.sessionId.toString());
      this.ws.invokeLobby('JoinLobby', this.sessionId, this.userId);

      this.setupEvents();
    }
  }

  loadLobby() {
    this.sessionService.getLobbyInfo(this.sessionId).subscribe(res => {
      this.session = res.session;
      this.members = res.members;
      const me = res.members.find((m: any) => m.userId === this.userId);
      this.isHost = me?.isHost || false;
      this.isReady = me?.ready || false;
    });
  }

  setupEvents() {
    this.subs.add(this.ws.onLobby('MEMBER_JOINED').subscribe(data => {
      if (data) {
        // Prevent duplicates
        if (!this.members.find(m => m.userId === data.userId)) {
          this.members.push(data);
        }
      }
    }));

    this.subs.add(this.ws.onLobby('MEMBER_READY').subscribe(data => {
      if (data) {
        const m = this.members.find(m => m.userId === data.userId);
        if (m) m.ready = data.ready;
      }
    }));

    this.subs.add(this.ws.onLobby('SESSION_STARTED').subscribe(data => {
      if (data) {
        this.router.navigate(['/live-session', this.sessionId]);
      }
    }));
  }

  toggleReady() {
    this.isReady = !this.isReady;
    this.ws.invokeLobby('SetReady', this.sessionId, this.userId, this.isReady);
  }

  startSession() {
    this.ws.invokeLobby('StartSession', this.sessionId);
  }

  get allReady() {
    return this.members.length > 0 && this.members.every(m => m.ready);
  }

  copyCode() {
    navigator.clipboard.writeText(this.session?.joinCode);
    alert('Room code copied to clipboard!');
  }

  ngOnDestroy() {
    this.ws.disconnectAll();
    this.subs.unsubscribe();
  }
}

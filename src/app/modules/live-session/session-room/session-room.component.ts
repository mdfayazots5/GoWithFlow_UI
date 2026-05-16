import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule, LogOut, Settings, Info, MessageSquare } from 'lucide-angular';
import { TurnService, TurnState } from '@core/services/turn.service';
import { WebsocketService } from '@core/services/websocket.service';
import { AuthService } from '@core/services/auth.service';
import { Subscription } from 'rxjs';
import { SpeakerScreenComponent } from './speaker-screen.component';
import { ListenerScreenComponent } from './listener-screen.component';

@Component({
  selector: 'app-session-room',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, SpeakerScreenComponent, ListenerScreenComponent],
  template: `
    <div class="min-h-screen flex flex-col focus-mode bg-[#1A1A2E] text-[#EAEAEA] relative overflow-hidden">
      <!-- Session Header -->
      <header class="h-20 border-b border-white/10 flex items-center justify-between px-6 z-10">
        <div class="flex items-center gap-4">
           <div class="w-10 h-10 bg-ls-primary/20 rounded-xl flex items-center justify-center border border-ls-primary/30">
              <span class="font-black italic text-ls-primary">F</span>
           </div>
           <div>
              <p class="text-xs font-black uppercase tracking-widest text-[#EAEAEA]/50">Live Session</p>
              <h2 class="text-lg font-black italic tracking-tight leading-none uppercase">Engage & Practice</h2>
           </div>
        </div>

        <div class="flex items-center gap-2">
           <div class="px-4 py-2 bg-white/5 rounded-full border border-white/10 flex items-center gap-2">
              <div class="w-2 h-2 bg-ls-success rounded-full animate-pulse shadow-[0_0_8px_#2E7D32]"></div>
              <span class="text-[10px] font-black uppercase tracking-widest">Room Synced</span>
           </div>
           <button (click)="quitSession()" class="p-3 hover:bg-red-500/10 text-ls-error transition-all rounded-xl">
              <i-lucide [img]="LogoutIcon" size="20"></i-lucide>
           </button>
        </div>
      </header>

      <!-- Main Interaction Area -->
      <main class="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center">
        <ng-container *ngIf="turnState">
          <app-speaker-screen 
            *ngIf="isMyTurn" 
            [state]="turnState" 
            (completed)="onTurnComplete()">
          </app-speaker-screen>
          
          <app-listener-screen 
            *ngIf="!isMyTurn" 
            [state]="turnState">
          </app-listener-screen>
        </ng-container>

        <div *ngIf="!turnState" class="flex flex-col items-center gap-4">
           <div class="w-12 h-12 border-4 border-ls-primary border-t-transparent rounded-full animate-spin"></div>
           <p class="text-xs font-black uppercase tracking-[0.3em] text-white/30">Loading State...</p>
        </div>
      </main>

      <!-- Footer Info -->
      <footer class="h-16 border-t border-white/5 flex items-center justify-center text-[10px] font-black uppercase tracking-[0.4em] text-white/20">
         Turn Index: {{ turnState?.turnIndex || 0 }} • Sequential Broadcast Active
      </footer>

      <!-- Background Elements -->
      <div class="absolute -top-40 -left-40 w-96 h-96 bg-ls-primary/10 rounded-full blur-[100px]"></div>
      <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-ls-accent/5 rounded-full blur-[100px]"></div>
    </div>
  `,
  styles: []
})
export class SessionRoomComponent implements OnInit, OnDestroy {
  readonly LogoutIcon = LogOut;

  sessionId = '';
  turnState?: TurnState;
  userId = '';
  private subs = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private turnService: TurnService,
    private ws: WebsocketService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.sessionId = this.route.snapshot.paramMap.get('id') || '';
    this.userId = this.auth.currentUser?.id || '';

    if (this.sessionId) {
      this.loadTurn();
      this.ws.connect(this.sessionId, 'live-session');
      this.setupEvents();
    }
  }

  loadTurn() {
    this.turnService.getCurrentTurn(this.sessionId).subscribe(res => {
      this.turnState = res;
    });
  }

  setupEvents() {
    this.subs.add(this.ws.onEvent('TURN_SHIFT').subscribe(data => {
      if (data) {
        this.turnState = {
          sessionId: this.sessionId,
          activeMemberId: data.newActiveMemberId,
          slotIndex: data.slotIndex,
          turnIndex: data.turnIndex,
          utterance: data.nextUtterance,
          isLastTurn: data.isLastTurn || false
        };
      }
    }));

    this.subs.add(this.ws.onEvent('SESSION_ENDED').subscribe(data => {
      if (data) {
        this.router.navigate(['/session/report', this.sessionId]);
      }
    }));
  }

  get isMyTurn(): boolean {
    return this.turnState?.activeMemberId === this.userId;
  }

  onTurnComplete() {
    this.turnService.shiftTurn(this.sessionId).subscribe();
  }

  quitSession() {
    if (confirm('Are you sure you want to exit the live session?')) {
      this.router.navigate(['/admin/dashboard']);
    }
  }

  ngOnDestroy() {
    this.ws.disconnect();
    this.subs.unsubscribe();
  }
}

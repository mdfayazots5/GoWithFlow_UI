// File: src/app/modules/user/invitations/my-invitations.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  LucideAngularModule,
  Inbox, Clock, Check, X, Loader2, User, Calendar, ChevronRight
} from 'lucide-angular';
import { SessionService } from '@core/services/session.service';
import { ToastService } from '@core/services/toast.service';
import { UserInvitation } from '@core/models/session.model';
import { UserAvatarComponent } from '@shared/components/user-avatar/user-avatar.component';

@Component({
  selector: 'app-my-invitations',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, UserAvatarComponent],
  template: `
    <div class="min-h-screen bg-gw-bg">
      <div class="max-w-lg mx-auto px-4 pt-4 pb-28 space-y-4 animate-in fade-in duration-500">

        <div>
          <h1 class="text-lg font-black text-gw-text tracking-tight">My Invitations</h1>
          <p class="text-[11px] text-gw-text-muted mt-0.5 italic">
            Pending session invitations from other hosts.
          </p>
        </div>

        @if (loading()) {
          <div class="flex justify-center py-10">
            <i-lucide [img]="LoaderIcon" size="24" class="animate-spin text-gw-primary"></i-lucide>
          </div>
        } @else if (invitations().length === 0) {
          <div class="flex flex-col items-center gap-3 py-16 text-center">
            <i-lucide [img]="InboxIcon" size="32" class="text-gw-text-muted opacity-40"></i-lucide>
            <p class="text-sm font-semibold text-gw-text-muted">No pending invitations</p>
            <p class="text-[11px] text-gw-text-muted opacity-70">
              When a host invites you to a session, it will appear here.
            </p>
          </div>
        } @else {
          @for (inv of invitations(); track inv.invitationId) {
            <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm overflow-hidden">

              <!-- Session header -->
              <div class="px-4 py-3 border-b border-gw-bg">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <p class="text-sm font-black text-gw-text truncate">{{ inv.sessionName }}</p>
                    <p class="text-[10px] text-gw-text-muted mt-0.5 italic">{{ inv.sessionMode }}</p>
                  </div>
                  <span class="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full shrink-0"
                        [class.bg-amber-100]="inv.status === 'PENDING'"
                        [class.text-amber-700]="inv.status === 'PENDING'">
                    {{ inv.status }}
                  </span>
                </div>
              </div>

              <!-- Details -->
              <div class="px-4 py-3 space-y-2.5">
                <div class="flex items-center gap-2">
                  <app-user-avatar [name]="inv.hostName" size="xs"></app-user-avatar>
                  <p class="text-xs text-gw-text"><span class="font-semibold">{{ inv.hostName }}</span> invited you</p>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <p class="text-[9px] font-black uppercase tracking-widest text-gw-text-muted">Your Role</p>
                    <p class="text-xs font-bold text-gw-primary mt-0.5">{{ inv.slotName }}</p>
                  </div>
                  <div>
                    <p class="text-[9px] font-black uppercase tracking-widest text-gw-text-muted">Duration</p>
                    <p class="text-xs font-bold text-gw-text mt-0.5">{{ inv.sessionDuration }} min</p>
                  </div>
                </div>

                @if (inv.scheduledAt) {
                  <div class="flex items-center gap-2 px-3 py-2 rounded-xl bg-gw-bg">
                    <i-lucide [img]="CalIcon" size="12" class="text-gw-primary shrink-0"></i-lucide>
                    <p class="text-xs font-semibold text-gw-text">
                      {{ inv.scheduledAt | date:'EEE, MMM d · h:mm a' }}
                    </p>
                  </div>
                }
              </div>

              <!-- Actions -->
              <div class="px-4 pb-4 flex gap-2">
                <button (click)="respond(inv, 'DECLINED')"
                        [disabled]="respondingId() === inv.invitationId"
                        class="flex-1 py-2.5 rounded-xl border border-gw-card-border text-xs font-bold text-gw-text-muted
                               hover:border-red-300 hover:text-red-500 transition-all disabled:opacity-40">
                  @if (respondingId() === inv.invitationId && pendingStatus() === 'DECLINED') {
                    <i-lucide [img]="LoaderIcon" size="12" class="animate-spin inline mr-1"></i-lucide>
                  } @else {
                    <i-lucide [img]="XIcon" size="12" class="inline mr-1"></i-lucide>
                  }
                  Decline
                </button>
                <button (click)="respond(inv, 'ACCEPTED')"
                        [disabled]="respondingId() === inv.invitationId"
                        class="flex-1 py-2.5 rounded-xl bg-gw-primary text-xs font-black text-white
                               hover:opacity-90 transition-all disabled:opacity-40">
                  @if (respondingId() === inv.invitationId && pendingStatus() === 'ACCEPTED') {
                    <i-lucide [img]="LoaderIcon" size="12" class="animate-spin inline mr-1"></i-lucide>
                  } @else {
                    <i-lucide [img]="CheckIcon" size="12" class="inline mr-1"></i-lucide>
                  }
                  Accept
                </button>
              </div>

            </div>
          }
        }

      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class MyInvitationsComponent implements OnInit {
  private sessionSvc = inject(SessionService);
  private toast      = inject(ToastService);
  private router     = inject(Router);

  readonly InboxIcon  = Inbox;
  readonly ClockIcon  = Clock;
  readonly CheckIcon  = Check;
  readonly XIcon      = X;
  readonly LoaderIcon = Loader2;
  readonly UserIcon   = User;
  readonly CalIcon    = Calendar;
  readonly NextIcon   = ChevronRight;

  loading       = signal(true);
  invitations   = signal<UserInvitation[]>([]);
  respondingId  = signal<number | null>(null);
  pendingStatus = signal<'ACCEPTED' | 'DECLINED' | null>(null);

  ngOnInit() {
    this.sessionSvc.getMyInvitations().subscribe({
      next: invs => {
        this.invitations.set(invs);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  respond(inv: UserInvitation, status: 'ACCEPTED' | 'DECLINED') {
    if (this.respondingId() !== null) return;
    this.respondingId.set(inv.invitationId);
    this.pendingStatus.set(status);

    this.sessionSvc.respondToInvitation(String(inv.sessionId), inv.invitationId, status).subscribe({
      next: () => {
        this.invitations.update(list => list.filter(i => i.invitationId !== inv.invitationId));
        this.respondingId.set(null);
        this.pendingStatus.set(null);

        if (status === 'ACCEPTED') {
          this.toast.success('Invitation accepted! Navigate to lobby when you\'re ready.');
          this.router.navigate(['/session/lobby', inv.sessionId]);
        } else {
          this.toast.success('Invitation declined.');
        }
      },
      error: () => {
        this.respondingId.set(null);
        this.pendingStatus.set(null);
        this.toast.error('Could not respond to invitation. Please try again.');
      }
    });
  }
}

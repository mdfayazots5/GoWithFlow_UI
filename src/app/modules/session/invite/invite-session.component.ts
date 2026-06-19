// File: src/app/modules/session/invite/invite-session.component.ts
import {
  Component, inject, signal, computed, OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  LucideAngularModule,
  Search, UserPlus, X, CheckCircle2, Send, Loader2, User, ChevronRight
} from 'lucide-angular';
import { SessionService } from '@core/services/session.service';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';
import { UserSearchResult } from '@core/models/session.model';
import { debounceTime, distinctUntilChanged, Subject, switchMap, of, catchError } from 'rxjs';
import { UserAvatarComponent } from '@shared/components/user-avatar/user-avatar.component';

interface SlotAssignment {
  slotIndex: number;
  slotName: string;
  assignedUser: UserSearchResult | null;
}

@Component({
  selector: 'app-invite-session',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, UserAvatarComponent],
  template: `
    <div class="min-h-screen bg-gw-bg">
      <div class="max-w-lg mx-auto gwf-page-bottom space-y-5 animate-in fade-in duration-500">

        <div>
          <h1 class="text-lg font-black text-gw-text tracking-tight">Assign Roles</h1>
          <p class="text-[11px] text-gw-text-muted mt-0.5 italic">
            Search and assign participants to each role before sending invitations.
          </p>
        </div>

        @for (slot of slots(); track slot.slotIndex) {
          <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm p-4 space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-[11px] font-black uppercase tracking-widest text-gw-primary italic">Role {{ slot.slotIndex }}</p>
                <p class="text-sm font-bold text-gw-text">{{ slot.slotName }}</p>
              </div>
              @if (slot.assignedUser) {
                <button (click)="clearAssignment(slot.slotIndex)"
                        class="text-gw-text-muted hover:text-red-500 transition-colors">
                  <i-lucide [img]="XIcon" size="16"></i-lucide>
                </button>
              }
            </div>

            @if (slot.assignedUser) {
              <div class="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-green-50 border border-green-200">
                <app-user-avatar [name]="slot.assignedUser.fullName" [avatarUrl]="slot.assignedUser.avatarUrl" size="sm"></app-user-avatar>
                <span class="text-sm font-semibold text-gw-text">{{ slot.assignedUser.fullName }}</span>
                <i-lucide [img]="CheckIcon" size="16" class="text-green-500 ml-auto shrink-0"></i-lucide>
              </div>
            } @else {
              <div class="relative">
                <i-lucide [img]="SearchIcon" size="14"
                  class="absolute left-3 top-1/2 -translate-y-1/2 text-gw-text-muted pointer-events-none"></i-lucide>
                <input
                  type="text"
                  [(ngModel)]="searchQueries[slot.slotIndex]"
                  (ngModelChange)="onSearch(slot.slotIndex, $event)"
                  placeholder="Search participant by name..."
                  class="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-gw-card-border bg-gw-bg
                         focus:outline-none focus:ring-2 focus:ring-gw-primary/30 focus:border-gw-primary transition-all"
                />
              </div>

              @if (searchResults[slot.slotIndex]?.length) {
                <div class="space-y-1.5 max-h-40 overflow-y-auto">
                  @for (user of searchResults[slot.slotIndex]; track user.userId) {
                    <button (click)="assignUser(slot.slotIndex, user)"
                            class="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gw-bg transition-colors text-left">
                      <app-user-avatar [name]="user.fullName" [avatarUrl]="user.avatarUrl" size="xs"></app-user-avatar>
                      <span class="text-sm text-gw-text font-medium">{{ user.fullName }}</span>
                      <i-lucide [img]="AddIcon" size="14" class="text-gw-primary ml-auto shrink-0"></i-lucide>
                    </button>
                  }
                </div>
              }
            }
          </div>
        }

        @if (allSlotsAssigned()) {
          <div class="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 flex items-center gap-3">
            <i-lucide [img]="CheckIcon" size="16" class="text-green-600 shrink-0"></i-lucide>
            <p class="text-sm font-semibold text-green-700">All roles assigned — ready to send invitations.</p>
          </div>
        }

        <div class="flex gap-3">
          <button (click)="goToLobby()"
                  class="flex-1 py-3 rounded-2xl border border-gw-card-border text-sm font-bold text-gw-text-muted
                         hover:border-gw-primary hover:text-gw-primary transition-all">
            Skip to Lobby
          </button>
          <button (click)="sendInvitations()"
                  [disabled]="!allSlotsAssigned() || isSending()"
                  class="flex-1 py-3 rounded-2xl text-sm font-black text-white transition-all
                         disabled:opacity-40 disabled:cursor-not-allowed"
                  [class.bg-gw-primary]="allSlotsAssigned() && !isSending()"
                  [class.bg-gw-text-muted]="!allSlotsAssigned()">
            @if (isSending()) {
              <i-lucide [img]="LoaderIcon" size="16" class="animate-spin inline mr-2"></i-lucide>
              Sending...
            } @else {
              <i-lucide [img]="SendIcon" size="14" class="inline mr-2"></i-lucide>
              Send Invitations
            }
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class InviteSessionComponent implements OnInit {
  private route    = inject(ActivatedRoute);
  private router   = inject(Router);
  private session  = inject(SessionService);
  private auth     = inject(AuthService);
  private toast    = inject(ToastService);

  readonly SearchIcon = Search;
  readonly AddIcon    = UserPlus;
  readonly XIcon      = X;
  readonly CheckIcon  = CheckCircle2;
  readonly SendIcon   = Send;
  readonly LoaderIcon = Loader2;
  readonly UserIcon   = User;
  readonly NextIcon   = ChevronRight;

  sessionId = '';
  sessionName = '';
  isSending   = signal(false);

  slots           = signal<SlotAssignment[]>([]);
  searchQueries:  Record<number, string>           = {};
  searchResults:  Record<number, UserSearchResult[]> = {};

  private searchSubjects: Record<number, Subject<string>> = {};

  allSlotsAssigned = computed(() =>
    this.slots().length > 0 && this.slots().every(s => s.assignedUser !== null)
  );

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.sessionId   = params['sessionId'] ?? '';
      this.sessionName = params['sessionName'] ?? 'Session';

      if (!this.sessionId) return;

      try {
        const rawSlots: Array<{ slotIndex: number; slotName: string }> = JSON.parse(params['slots'] ?? '[]');
        if (rawSlots.length === 0) {
          this.goToLobby(); return;
        }
        this.slots.set(rawSlots.map(s => ({ ...s, assignedUser: null })));
      } catch {
        this.goToLobby();
      }
    });
  }

  onSearch(slotIndex: number, term: string) {
    if (!this.searchSubjects[slotIndex]) {
      this.searchSubjects[slotIndex] = new Subject<string>();
      this.searchSubjects[slotIndex].pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(q => q.length >= 2
          ? this.session.searchUsers(q).pipe(catchError(() => of([])))
          : of([]))
      ).subscribe(results => {
        this.searchResults[slotIndex] = results;
      });
    }
    this.searchSubjects[slotIndex].next(term);
  }

  assignUser(slotIndex: number, user: UserSearchResult) {
    this.slots.update(slots =>
      slots.map(s => s.slotIndex === slotIndex ? { ...s, assignedUser: user } : s)
    );
    this.searchQueries[slotIndex] = '';
    this.searchResults[slotIndex] = [];
  }

  clearAssignment(slotIndex: number) {
    this.slots.update(slots =>
      slots.map(s => s.slotIndex === slotIndex ? { ...s, assignedUser: null } : s)
    );
  }

  sendInvitations() {
    if (!this.allSlotsAssigned() || this.isSending()) return;

    this.isSending.set(true);
    const assignments = this.slots()
      .filter(s => s.assignedUser)
      .map(s => ({ userId: s.assignedUser!.userId, slotIndex: s.slotIndex }));

    this.session.sendInvitations(this.sessionId, assignments).subscribe({
      next: () => {
        this.toast.success('Invitations sent successfully!');
        this.goToLobby();
      },
      error: () => {
        this.isSending.set(false);
        this.toast.error('Failed to send invitations. Please try again.');
      }
    });
  }

  goToLobby() {
    this.router.navigate(['/session/lobby', this.sessionId]);
  }
}

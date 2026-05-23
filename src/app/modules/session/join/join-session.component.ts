// File: src/app/modules/session/join/join-session.component.ts
import { Component, inject, viewChildren, ElementRef, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { SessionService } from '@core/services/session.service';
import { ToastService } from '@core/services/toast.service';
import {
  LucideAngularModule,
  Search, ChevronRight, User, Users, Clock,
  BookOpen, AlertCircle, CheckCircle2, Loader2, Zap
} from 'lucide-angular';
import { SessionPreview } from '@core/models/session.model';

@Component({
  selector: 'app-join-session',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-gw-bg">
      <div class="max-w-lg mx-auto px-4 pt-4 pb-28 space-y-4 animate-in fade-in duration-500">

        <!-- ── Page Title ────────────────────────────────────────────── -->
        <div>
          <h1 class="text-xl font-black text-gw-text tracking-tight">Join a Session</h1>
          <p class="text-[11px] font-semibold text-gw-text-muted mt-0.5">
            Enter the 6-character code shared by the host
          </p>
        </div>

        <!-- ── Code Entry Card ───────────────────────────────────────── -->
        <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm p-5 space-y-4">

          <!-- Digit boxes -->
          <div class="flex justify-center gap-2">
            @for (idx of [0,1,2,3,4,5]; track idx) {
              <input
                #digitInput
                type="text"
                inputmode="text"
                maxlength="1"
                (input)="onInput(idx, $event)"
                (keydown)="onKeyDown(idx, $event)"
                class="w-11 h-14 bg-gw-bg border-2 border-gw-card-border rounded-2xl
                       text-center text-xl font-black text-gw-text uppercase outline-none
                       transition-all duration-150
                       focus:border-gw-primary focus:bg-white
                       focus:shadow-[0_0_0_3px_rgba(61,90,153,0.10)]"
              >
            }
          </div>

          <!-- Error -->
          @if (error()) {
            <div class="flex items-start gap-2.5 bg-red-50 border border-red-100
                        rounded-xl px-4 py-3 animate-in fade-in duration-200">
              <i-lucide [img]="ErrorIcon" size="14" class="text-red-500 shrink-0 mt-0.5"></i-lucide>
              <span class="text-xs font-semibold text-red-600 leading-snug">{{ error() }}</span>
            </div>
          }

          <!-- Find button -->
          <button
            [disabled]="code().length < 6 || isLoading()"
            (click)="findSession()"
            class="w-full h-12 rounded-xl bg-gw-primary text-white text-sm font-bold
                   flex items-center justify-center gap-2
                   hover:opacity-90 active:scale-[0.98] transition-all
                   disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
          >
            @if (isLoading()) {
              <i-lucide [img]="LoaderIcon" size="15" class="animate-spin"></i-lucide>
              <span>Searching…</span>
            } @else {
              <i-lucide [img]="SearchIcon" size="15"></i-lucide>
              <span>Find Session</span>
            }
          </button>

        </div>

        <!-- ── Session Preview ───────────────────────────────────────── -->
        @if (preview()) {
          <div class="space-y-4 animate-in slide-in-from-bottom-3 fade-in duration-300">

            <!-- Session Identity Card -->
            <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm overflow-hidden">

              <!-- Coloured banner -->
              <div class="h-2 w-full"
                   style="background: linear-gradient(90deg, #3D5A99 0%, #5B7EC9 60%, #E07B39 100%);"></div>

              <div class="p-5 space-y-4">

                <!-- Mode badge + member count -->
                <div class="flex items-center justify-between">
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide"
                        style="background:rgba(61,90,153,0.08); color:#3D5A99;">
                    <i-lucide [img]="ZapIcon" size="10"></i-lucide>
                    {{ preview()?.sessionMode }}
                  </span>
                  <span class="text-[10px] font-bold text-gw-text-muted uppercase tracking-wide">
                    {{ preview()?.currentMembers }}/{{ preview()?.maxMembers }} members
                  </span>
                </div>

                <!-- Session name -->
                <h2 class="text-lg font-black text-gw-text tracking-tight leading-snug">
                  {{ preview()?.sessionName }}
                </h2>

                <!-- Meta chips -->
                <div class="flex items-center gap-2 flex-wrap">
                  <div class="flex items-center gap-1.5 bg-gw-bg rounded-xl px-3 py-1.5">
                    <i-lucide [img]="ScriptIcon" size="11" class="text-gw-text-muted"></i-lucide>
                    <span class="text-[10px] font-bold text-gw-text-muted max-w-[140px] truncate">
                      {{ preview()?.scriptTitle }}
                    </span>
                  </div>
                  <div class="flex items-center gap-1.5 bg-gw-bg rounded-xl px-3 py-1.5">
                    <i-lucide [img]="DurationIcon" size="11" class="text-gw-text-muted"></i-lucide>
                    <span class="text-[10px] font-bold text-gw-text-muted">
                      {{ preview()?.sessionDuration }} min
                    </span>
                  </div>
                </div>

              </div>
            </div>

            <!-- Role Selection Card -->
            <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm overflow-hidden">

              <div class="flex items-center justify-between px-5 py-3.5 border-b border-gw-bg">
                <p class="text-[10px] font-black text-gw-text-muted uppercase tracking-widest">
                  Select your role
                </p>
                <span class="text-[10px] font-bold text-gw-text-muted">
                  {{ availableSlotCount() }} open
                </span>
              </div>

              <div class="divide-y divide-gw-bg">
                @for (slot of preview()?.slots; track slot.slotIndex) {
                  <button
                    [disabled]="slot.isOccupied"
                    (click)="selectedSlot.set(slot.slotIndex)"
                    class="w-full flex items-center gap-3.5 px-5 py-4 text-left transition-all duration-150"
                    [class.bg-gw-bg]="slot.isOccupied"
                    [class.cursor-not-allowed]="slot.isOccupied"
                    [style.background]="!slot.isOccupied && selectedSlot() === slot.slotIndex
                                        ? 'rgba(61,90,153,0.04)' : ''"
                  >
                    <!-- Icon -->
                    <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-150"
                         [style.background]="slot.isOccupied
                           ? '#E0E4EC'
                           : selectedSlot() === slot.slotIndex
                             ? '#3D5A99'
                             : 'rgba(61,90,153,0.08)'">
                      <i-lucide
                        [img]="slot.isOccupied ? UserIcon : (selectedSlot() === slot.slotIndex ? CheckIcon : SlotIcon)"
                        size="15"
                        [style.color]="slot.isOccupied ? '#6B7280' : selectedSlot() === slot.slotIndex ? '#fff' : '#3D5A99'"
                      ></i-lucide>
                    </div>

                    <!-- Label -->
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-bold text-gw-text leading-tight"
                         [class.text-gw-text-muted]="slot.isOccupied">
                        {{ slot.slotName }}
                      </p>
                      <p class="text-[10px] font-semibold mt-0.5"
                         [class.text-gw-text-muted]="slot.isOccupied || selectedSlot() !== slot.slotIndex"
                         [style.color]="!slot.isOccupied && selectedSlot() === slot.slotIndex ? '#3D5A99' : ''">
                        @if (slot.isOccupied) { Already taken }
                        @else if (selectedSlot() === slot.slotIndex) { Selected — you'll join as this role }
                        @else { Available }
                      </p>
                    </div>

                    <!-- Right badge -->
                    @if (slot.isOccupied) {
                      <span class="shrink-0 text-[9px] font-bold uppercase tracking-wide
                                   text-gw-text-muted bg-white border border-gw-card-border
                                   px-2.5 py-1 rounded-lg">
                        Taken
                      </span>
                    } @else if (selectedSlot() === slot.slotIndex) {
                      <div class="w-5 h-5 rounded-full bg-gw-primary flex items-center justify-center shrink-0">
                        <i-lucide [img]="CheckIcon" size="10" style="color:white;"></i-lucide>
                      </div>
                    }
                  </button>
                }
              </div>

              <!-- Confirm button -->
              <div class="px-5 py-4 border-t border-gw-bg space-y-2">
                <button
                  [disabled]="selectedSlot() === null || isJoining()"
                  (click)="joinSession()"
                  class="w-full h-12 rounded-xl bg-gw-primary text-white text-sm font-bold
                         flex items-center justify-center gap-2
                         hover:opacity-90 active:scale-[0.98] transition-all
                         disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
                >
                  @if (isJoining()) {
                    <i-lucide [img]="LoaderIcon" size="15" class="animate-spin"></i-lucide>
                    <span>Joining…</span>
                  } @else {
                    <span>Confirm & Join</span>
                    <i-lucide [img]="NextIcon" size="15"></i-lucide>
                  }
                </button>
                @if (selectedSlot() === null) {
                  <p class="text-[10px] font-semibold text-gw-text-muted text-center">
                    Select a role above to continue
                  </p>
                }
              </div>

            </div>

          </div>
        }

      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class JoinSessionComponent implements OnInit {
  private elRefs         = viewChildren<ElementRef>('digitInput');
  private sessionService = inject(SessionService);
  private toast          = inject(ToastService);
  private router         = inject(Router);
  private route          = inject(ActivatedRoute);

  readonly SearchIcon   = Search;
  readonly ErrorIcon    = AlertCircle;
  readonly ScriptIcon   = BookOpen;
  readonly DurationIcon = Clock;
  readonly UserIcon     = User;
  readonly SlotIcon     = Users;
  readonly NextIcon     = ChevronRight;
  readonly CheckIcon    = CheckCircle2;
  readonly LoaderIcon   = Loader2;
  readonly ZapIcon      = Zap;

  code         = signal('');
  isLoading    = signal(false);
  error        = signal('');
  preview      = signal<SessionPreview | null>(null);
  selectedSlot = signal<number | null>(null);
  isJoining    = signal(false);

  availableSlotCount() {
    return this.preview()?.slots.filter(s => !s.isOccupied).length ?? 0;
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const codeParam = params['code'];
      if (codeParam && codeParam.length === 6) {
        setTimeout(() => this.fillCode(codeParam), 100);
      }
    });
  }

  fillCode(code: string) {
    const inputs = this.elRefs();
    code.split('').forEach((char, i) => {
      if (inputs[i]) inputs[i].nativeElement.value = char.toUpperCase();
    });
    this.code.set(code.toUpperCase());
    this.findSession();
  }

  onInput(index: number, event: any) {
    const char = event.target.value.toUpperCase();
    event.target.value = char;
    this.updateCode();
    if (char && index < 5) this.elRefs()[index + 1].nativeElement.focus();
  }

  onKeyDown(index: number, event: KeyboardEvent) {
    if (event.key === 'Backspace' && !this.elRefs()[index].nativeElement.value && index > 0) {
      this.elRefs()[index - 1].nativeElement.focus();
    }
  }

  updateCode() {
    const code = this.elRefs().map(r => r.nativeElement.value).join('');
    this.code.set(code);
    if (this.error()) this.error.set('');
    if (this.preview()) this.preview.set(null);
    this.selectedSlot.set(null);
  }

  findSession() {
    if (this.code().length < 6) return;
    this.isLoading.set(true);
    this.error.set('');
    this.preview.set(null);

    this.sessionService.validateCode(this.code()).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.preview.set(res);
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err?.error?.errors?.[0] || err?.error?.message || 'Session not found or code expired.';
        this.error.set(msg);
      }
    });
  }

  joinSession() {
    if (this.selectedSlot() === null || !this.preview()) return;
    this.isJoining.set(true);
    this.sessionService.joinSession({
      joinCode: this.code(),
      slotIndex: this.selectedSlot()!
    }).subscribe({
      next: (res) => {
        this.isJoining.set(false);
        this.router.navigate(['/session/lobby', res.sessionId]);
        this.toast.success('Joined session!');
      },
      error: (err) => {
        this.isJoining.set(false);
        const msg = err?.error?.errors?.[0] || err?.error?.message || 'Failed to join session. Please try again.';
        this.toast.error(msg);
      }
    });
  }
}

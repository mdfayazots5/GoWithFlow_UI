// File: src/app/modules/session/join/join-session.component.ts
import { Component, inject, viewChildren, ElementRef, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { SessionService } from '@core/services/session.service';
import { ToastService } from '@core/services/toast.service';
import { LucideAngularModule, Search, ChevronRight, User, Users, Clock, BookOpen, AlertCircle, CheckCircle2, Loader2, Zap } from 'lucide-angular';
import { SessionPreview } from '@core/models/session.model';

@Component({
  selector: 'app-join-session',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="h-screen bg-gw-bg flex flex-col overflow-hidden text-black">

      <!-- Fixed header -->
      <div class="flex-none px-5 pt-5 pb-3 text-center">
        <p class="text-[8px] font-black uppercase tracking-[0.35em] text-black italic mb-0.5">GoWithFlow</p>
        <h1 class="text-[22px] font-black italic uppercase tracking-tight text-black leading-none">Join a Session</h1>
      </div>

      <!-- Scrollable body -->
      <div class="flex-1 overflow-y-auto overscroll-contain" [class.pb-32]="preview()">
        <div class="max-w-md mx-auto px-4 pt-1 pb-6 space-y-3">

          <!-- ── Code Entry Card ── -->
          <div class="bg-white rounded-3xl border border-gw-card-border shadow-sm p-5">

            <p class="text-[8px] font-black uppercase tracking-[0.3em] text-black italic text-center mb-4">
              Enter the 6-character session code
            </p>

            <!-- Code boxes -->
            <div class="flex justify-center gap-2 mb-4">
              @for (idx of [0,1,2,3,4,5]; track idx) {
                <input
                  #digitInput
                  type="text"
                  inputmode="text"
                  maxlength="1"
                  (input)="onInput(idx, $event)"
                  (keydown)="onKeyDown(idx, $event)"
                  class="w-11 h-14 bg-gw-bg border-2 rounded-2xl text-center text-xl font-black text-black uppercase outline-none
                    transition-all duration-150 border-gw-card-border
                    focus:border-gw-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(61,90,153,0.10)]"
                >
              }
            </div>

            <!-- Error banner -->
            @if (error()) {
              <div class="flex items-start gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mb-3 animate-in fade-in duration-200">
                <i-lucide [img]="ErrorIcon" size="14" class="text-red-500 flex-shrink-0 mt-0.5"></i-lucide>
                <span class="text-[10px] font-black uppercase tracking-wide text-red-600 italic leading-relaxed">{{ error() }}</span>
              </div>
            }

            <!-- Find button -->
            <button
              [disabled]="code().length < 6 || isLoading()"
              (click)="findSession()"
              class="w-full h-12 rounded-2xl border-2 border-black font-black uppercase tracking-widest italic text-sm text-black
                flex items-center justify-center gap-2 transition-all duration-150
                bg-white hover:bg-black/5 active:scale-[0.98]
                disabled:bg-black/5 disabled:text-black disabled:opacity-100 disabled:cursor-not-allowed"
            >
              @if (isLoading()) {
                <i-lucide [img]="LoaderIcon" size="15" class="animate-spin"></i-lucide>
                <span>Searching...</span>
              } @else {
                <i-lucide [img]="SearchIcon" size="15"></i-lucide>
                <span>Find Session</span>
              }
            </button>
          </div>

          <!-- ── Session Preview ── -->
          @if (preview()) {
            <div class="space-y-3 animate-in slide-in-from-bottom-3 fade-in duration-300">

              <!-- Session Identity Card (blue) -->
              <div class="bg-white rounded-3xl border border-gw-card-border p-5 shadow-sm">

                <!-- Top row: mode badge + member count -->
                <div class="flex items-center justify-between mb-3">
                  <span class="inline-flex items-center gap-1.5 bg-black/5 rounded-xl px-3 py-1">
                    <i-lucide [img]="ZapIcon" size="10" class="text-black"></i-lucide>
                    <span class="text-[8px] font-black uppercase tracking-widest text-black italic">{{ preview()?.sessionMode }}</span>
                  </span>
                  <div class="text-right">
                    <div class="text-[8px] font-black uppercase tracking-wider text-black italic">Members</div>
                    <div class="text-xl font-black text-black italic leading-tight">
                      {{ preview()?.currentMembers }}<span class="text-sm font-bold text-black">/{{ preview()?.maxMembers }}</span>
                    </div>
                  </div>
                </div>

                <!-- Session name -->
                <h2 class="text-[20px] font-black italic uppercase tracking-tight text-black leading-tight mb-4">
                  {{ preview()?.sessionName }}
                </h2>

                <!-- Meta chips -->
                <div class="flex items-center gap-2 flex-wrap">
                  <div class="flex items-center gap-1.5 bg-black/5 rounded-xl px-3 py-1.5">
                    <i-lucide [img]="ScriptIcon" size="11" class="text-black"></i-lucide>
                    <span class="text-[9px] font-black text-black italic uppercase tracking-wide max-w-[130px] truncate">
                      {{ preview()?.scriptTitle }}
                    </span>
                  </div>
                  <div class="flex items-center gap-1.5 bg-black/5 rounded-xl px-3 py-1.5">
                    <i-lucide [img]="DurationIcon" size="11" class="text-black"></i-lucide>
                    <span class="text-[9px] font-black text-black italic uppercase tracking-wide">
                      {{ preview()?.sessionDuration }} Min
                    </span>
                  </div>
                </div>
              </div>

              <!-- Role Selection Card -->
              <div class="bg-white rounded-3xl border border-gw-card-border shadow-sm p-5">

                <div class="flex items-center justify-between mb-3">
                  <p class="text-[8px] font-black uppercase tracking-[0.3em] text-black italic">Select your role</p>
                  <span class="text-[8px] font-black uppercase tracking-wide text-black italic bg-gw-bg rounded-lg px-2 py-1">
                    {{ availableSlotCount() }} open
                  </span>
                </div>

                <div class="space-y-2">
                  @for (slot of preview()?.slots; track slot.slotIndex) {
                    <button
                      [disabled]="slot.isOccupied"
                      (click)="selectedSlot.set(slot.slotIndex)"
                      class="w-full px-4 py-3.5 rounded-2xl border-2 flex items-center justify-between text-left transition-all duration-150"
                      [ngClass]="slot.isOccupied
                        ? 'border-gw-card-border bg-gw-bg cursor-not-allowed'
                        : selectedSlot() === slot.slotIndex
                          ? 'border-gw-primary bg-gw-primary/[0.04] shadow-[0_0_0_1px_rgba(61,90,153,0.12)]'
                          : 'border-gw-card-border bg-white hover:border-gw-primary/40 hover:bg-gw-primary/[0.02] cursor-pointer'"
                    >
                      <!-- Left: icon + label -->
                      <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors duration-150"
                          [ngClass]="slot.isOccupied
                            ? 'bg-gw-card-border'
                            : selectedSlot() === slot.slotIndex
                              ? 'bg-gw-primary'
                              : 'bg-gw-bg'">
                          <i-lucide
                            [img]="slot.isOccupied ? UserIcon : (selectedSlot() === slot.slotIndex ? CheckIcon : SlotIcon)"
                            size="15"
                            class="text-black"
                          ></i-lucide>
                        </div>
                        <div>
                          <span class="text-[13px] font-black text-black italic block leading-tight">{{ slot.slotName }}</span>
                          @if (slot.isOccupied) {
                            <span class="text-[9px] text-black italic">Already taken</span>
                          } @else if (selectedSlot() === slot.slotIndex) {
                            <span class="text-[9px] text-black font-bold italic">You'll join as this role</span>
                          } @else {
                            <span class="text-[9px] text-black italic">Tap to select</span>
                          }
                        </div>
                      </div>

                      <!-- Right: state badge -->
                      @if (slot.isOccupied) {
                        <span class="text-[8px] font-black uppercase tracking-wider text-black italic bg-white border border-gw-card-border px-2.5 py-1 rounded-xl flex-shrink-0">
                          Taken
                        </span>
                      } @else if (selectedSlot() === slot.slotIndex) {
                        <div class="w-5 h-5 rounded-full bg-gw-primary/15 border border-gw-primary flex items-center justify-center flex-shrink-0">
                          <i-lucide [img]="CheckIcon" size="10" class="text-black"></i-lucide>
                        </div>
                      }
                    </button>
                  }
                </div>

                <div class="pt-4 space-y-2">
                  <button
                    [disabled]="selectedSlot() === null || isJoining()"
                    (click)="joinSession()"
                    class="w-full h-14 rounded-2xl border-2 border-black font-black uppercase tracking-widest italic text-sm text-black
                      flex items-center justify-center gap-2 transition-all duration-150
                      bg-white shadow-sm
                      hover:bg-black/5 active:scale-[0.98]
                      disabled:bg-black/5 disabled:text-black disabled:opacity-100 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    @if (isJoining()) {
                      <i-lucide [img]="LoaderIcon" size="16" class="animate-spin"></i-lucide>
                      <span>Joining...</span>
                    } @else {
                      <span>Confirm & Join</span>
                      <i-lucide [img]="NextIcon" size="16"></i-lucide>
                    }
                  </button>
                  <p class="text-[9px] font-black uppercase tracking-wider text-black italic text-center transition-opacity duration-200"
                     [class.opacity-0]="selectedSlot() !== null">
                    Select a role above to continue
                  </p>
                </div>
              </div>

            </div>
          }

        </div>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; }
    .pb-safe { padding-bottom: max(1rem, env(safe-area-inset-bottom)); }
  `]
})
export class JoinSessionComponent implements OnInit {
  private elRefs = viewChildren<ElementRef>('digitInput');
  private sessionService = inject(SessionService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly SearchIcon = Search;
  readonly ErrorIcon = AlertCircle;
  readonly ScriptIcon = BookOpen;
  readonly DurationIcon = Clock;
  readonly UserIcon = User;
  readonly SlotIcon = Users;
  readonly NextIcon = ChevronRight;
  readonly CheckIcon = CheckCircle2;
  readonly LoaderIcon = Loader2;
  readonly ZapIcon = Zap;

  code = signal('');
  isLoading = signal(false);
  error = signal('');
  preview = signal<SessionPreview | null>(null);
  selectedSlot = signal<number | null>(null);
  isJoining = signal(false);

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

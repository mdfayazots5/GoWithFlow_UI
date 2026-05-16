// File: src/app/modules/session/join/join-session.component.ts
import { Component, inject, viewChildren, ElementRef, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { SessionService } from '@core/services/session.service';
import { ToastService } from '@core/services/toast.service';
import { LucideAngularModule, Search, ChevronRight, User, Users, Calendar, Clock, BookOpen, AlertCircle } from 'lucide-angular';
import { SessionPreview } from '@core/models/session.model';

@Component({
  selector: 'app-join-session',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="max-w-xl mx-auto space-y-10 pb-20 animate-in fade-in duration-500">
      <div class="text-center space-y-2">
        <h2 class="text-3xl font-black text-gw-text italic uppercase tracking-tighter">JOIN A SESSION</h2>
        <p class="text-sm font-bold text-gw-text-muted uppercase tracking-widest italic">Enter the 6-character code</p>
      </div>

      <!-- Code Input Grid -->
      <div class="flex justify-center gap-3">
        @for (i of [0,1,2,3,4,5]; track i) {
          <input 
            #digitInput
            type="text" 
            maxlength="1"
            (input)="onInput(i, $event)"
            (keydown)="onKeyDown(i, $event)"
            class="w-12 h-16 md:w-16 md:h-20 bg-white border-2 border-gw-card-border rounded-2xl text-center text-2xl md:text-3xl font-black text-gw-text uppercase outline-none focus:border-gw-primary focus:shadow-[0_0_20px_rgba(61,90,153,0.15)] transition-all"
          >
        }
      </div>

      <div class="flex flex-col items-center gap-6">
        <button 
          [disabled]="code().length < 6 || isLoading()"
          (click)="findSession()"
          class="w-full h-16 bg-gw-text text-white font-black uppercase tracking-widest italic rounded-2xl hover:scale-[1.05] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-xl shadow-gw-text/20"
        >
          {{ isLoading() ? 'SEARCHING...' : 'FIND SESSION' }}
          <i-lucide [img]="SearchIcon" size="20"></i-lucide>
        </button>

        @if (error()) {
          <div class="flex items-center gap-2 text-gw-error animate-in shake duration-300">
             <i-lucide [img]="ErrorIcon" size="16"></i-lucide>
             <span class="text-[10px] font-black uppercase tracking-widest italic">{{ error() }}</span>
          </div>
        }
      </div>

      <!-- SESSION PREVIEW CARD -->
      @if (preview()) {
        <div class="animate-in slide-in-from-bottom-8 duration-500">
           <div class="bg-white rounded-[48px] border-2 border-gw-primary p-8 shadow-2xl space-y-8 relative overflow-hidden">
              <div class="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                 <i-lucide [img]="PreviewIcon" size="120"></i-lucide>
              </div>

              <div class="space-y-4">
                 <div class="flex justify-between items-start">
                    <span class="px-3 py-1 bg-gw-primary/10 text-gw-primary rounded-lg text-[10px] font-black uppercase tracking-widest italic">{{ preview()?.sessionMode }}</span>
                    <span class="text-xs font-black text-gw-text-muted italic">{{ preview()?.currentMembers }}/{{ preview()?.maxMembers }} Members</span>
                 </div>
                 <h3 class="text-2xl font-black text-gw-text italic uppercase tracking-tight">{{ preview()?.sessionName }}</h3>
                 
                 <div class="grid grid-cols-2 gap-4">
                    <div class="flex items-center gap-2">
                       <i-lucide [img]="ScriptIcon" size="14" class="text-gw-text-muted"></i-lucide>
                       <span class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted italic truncate">{{ preview()?.scriptTitle }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                       <i-lucide [img]="DurationIcon" size="14" class="text-gw-text-muted"></i-lucide>
                       <span class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted italic">{{ preview()?.sessionDuration }} Min</span>
                    </div>
                 </div>
              </div>

              <div class="space-y-4">
                 <p class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted px-2 italic">Select your role</p>
                 <div class="grid gap-2">
                    @for (slot of preview()?.slots; track slot.slotIndex) {
                      <button 
                         [disabled]="slot.isOccupied"
                         (click)="selectedSlot.set(slot.slotIndex)"
                         class="w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all"
                         [class.bg-gw-primary/5]="selectedSlot() === slot.slotIndex"
                         [class.border-gw-primary]="selectedSlot() === slot.slotIndex"
                         [class.border-transparent]="selectedSlot() !== slot.slotIndex"
                         [class.bg-gw-bg/30]="selectedSlot() !== slot.slotIndex"
                         [class.opacity-50]="slot.isOccupied"
                      >
                         <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gw-text-muted">
                               <i-lucide [img]="slot.isOccupied ? UserIcon : SlotIcon" size="16"></i-lucide>
                            </div>
                            <span class="text-sm font-bold text-gw-text">{{ slot.slotName }}</span>
                         </div>
                         @if (slot.isOccupied) {
                           <span class="text-[8px] font-black uppercase tracking-widest text-gw-text-muted italic">Occupied by {{ slot.userName }}</span>
                         } @else if (selectedSlot() === slot.slotIndex) {
                           <div class="w-5 h-5 rounded-full bg-gw-primary flex items-center justify-center">
                              <i-lucide [img]="NextIcon" size="12" class="text-white"></i-lucide>
                           </div>
                         }
                      </button>
                    }
                 </div>
              </div>

              <button 
                [disabled]="selectedSlot() === null || isJoining()"
                (click)="joinSession()"
                class="w-full h-16 bg-gw-primary text-white font-black uppercase tracking-widest italic rounded-2xl hover:scale-[1.05] transition-all shadow-xl shadow-gw-primary/20"
              >
                {{ isJoining() ? 'JOINING...' : 'CONFIRM & JOIN' }}
              </button>
           </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-4px); }
      75% { transform: translateX(4px); }
    }
    .animate-in.shake {
      animation: shake 0.3s ease-in-out;
    }
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
  readonly PreviewIcon = Users;
  readonly ScriptIcon = BookOpen;
  readonly DurationIcon = Clock;
  readonly UserIcon = User;
  readonly SlotIcon = Users;
  readonly NextIcon = ChevronRight;

  code = signal('');
  isLoading = signal(false);
  error = signal('');
  preview = signal<SessionPreview | null>(null);
  selectedSlot = signal<number | null>(null);
  isJoining = signal(false);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const codeParam = params['code'];
      if (codeParam && codeParam.length === 6) {
        // We can't auto-fill and focus inputs easily here without a small delay
        setTimeout(() => this.fillCode(codeParam), 100);
      }
    });
  }

  fillCode(code: string) {
    const inputs = this.elRefs();
    code.split('').forEach((char, i) => {
      if (inputs[i]) {
        inputs[i].nativeElement.value = char.toUpperCase();
      }
    });
    this.code.set(code.toUpperCase());
    this.findSession();
  }

  onInput(index: number, event: any) {
    const char = event.target.value.toUpperCase();
    event.target.value = char;
    
    this.updateCode();

    if (char && index < 5) {
      this.elRefs()[index + 1].nativeElement.focus();
    }
  }

  onKeyDown(index: number, event: KeyboardEvent) {
    if (event.key === 'Backspace' && !this.elRefs()[index].nativeElement.value && index > 0) {
      this.elRefs()[index - 1].nativeElement.focus();
    }
  }

  updateCode() {
    const code = this.elRefs().map(input => input.nativeElement.value).join('');
    this.code.set(code);
    if (this.error()) this.error.set('');
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
      error: () => {
        this.isLoading.set(false);
        this.error.set('Session not found or expired');
      }
    });
  }

  joinSession() {
    if (this.selectedSlot() === null || !this.preview()) return;

    this.isJoining.set(true);
    this.sessionService.joinSession({
      sessionId: this.preview()!.id,
      slotIndex: this.selectedSlot()!
    }).subscribe({
      next: (res) => {
        this.isJoining.set(false);
        this.router.navigate(['/session/lobby', res.session.id]);
        this.toast.success('Joined session!');
      },
      error: () => this.isJoining.set(false)
    });
  }
}

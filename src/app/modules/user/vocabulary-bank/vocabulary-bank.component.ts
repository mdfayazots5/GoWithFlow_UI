// File: src/app/modules/user/vocabulary-bank/vocabulary-bank.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserService } from '@core/services/user.service';
import { LucideAngularModule, BookOpen, RotateCcw, CheckCircle2, Clock } from 'lucide-angular';
import { catchError, of } from 'rxjs';

interface VocabularyBankItem {
  focusWord: string;
  dateIntroduced: string;
  timesEncountered: number;
  timesCorrect: number;
  correctRate: number;
  isDueForReview: boolean;
}

interface VocabularyBank {
  totalWords: number;
  dueForReviewCount: number;
  words: VocabularyBankItem[];
}

@Component({
  selector: 'app-vocabulary-bank',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gw-bg">
      <div class="max-w-lg mx-auto px-4 pt-2 gwf-page-bottom space-y-4 animate-in fade-in duration-500">

      <!-- Page heading -->
      <div>
        <h1 class="text-xl font-black text-gw-text tracking-tight">Vocabulary Bank</h1>
        <p class="text-[11px] font-semibold text-gw-text-muted mt-0.5">Words you've practiced in Vocabulary Sprint</p>
      </div>

      <!-- Loading -->
      @if (isLoading()) {
        <div class="flex flex-col items-center justify-center py-20 gap-4">
          <div class="w-10 h-10 border-4 border-gw-primary border-t-transparent rounded-full animate-spin"></div>
          <p class="text-sm font-black uppercase tracking-widest italic text-gw-text-muted">Loading vocabulary bank...</p>
        </div>
      }

      <!-- Empty state -->
      @else if (!bank() || bank()!.totalWords === 0) {
        <div class="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div class="w-16 h-16 rounded-2xl bg-gw-bg flex items-center justify-center">
            <i-lucide [img]="BookIcon" size="32" class="text-gw-text-muted"></i-lucide>
          </div>
          <div>
            <p class="text-base font-black text-gw-text italic">No words yet</p>
            <p class="text-sm text-gw-text-muted italic mt-1">Complete a Vocabulary Sprint session to start building your bank.</p>
          </div>
          <a routerLink="/scripts"
            class="px-5 py-2.5 bg-gw-primary text-white font-black text-[11px] uppercase tracking-widest italic rounded-xl hover:opacity-90 transition-all">
            Browse Scripts
          </a>
        </div>
      }

      <!-- Bank content -->
      @else if (bank()) {

        <!-- Stats -->
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-white p-5 rounded-2xl border border-gw-card-border shadow-sm text-center">
            <p class="text-[11px] font-black uppercase tracking-widest text-gw-text-muted italic">Total Words</p>
            <p class="text-3xl font-black text-gw-primary italic">{{ bank()!.totalWords }}</p>
          </div>
          <div class="bg-white p-5 rounded-2xl border border-gw-card-border shadow-sm text-center"
               [class.border-gw-accent]="bank()!.dueForReviewCount > 0">
            <p class="text-[11px] font-black uppercase tracking-widest text-gw-text-muted italic">Due for Review</p>
            <p class="text-3xl font-black italic"
               [class.text-gw-accent]="bank()!.dueForReviewCount > 0"
               [class.text-gw-success]="bank()!.dueForReviewCount === 0">
              {{ bank()!.dueForReviewCount }}
            </p>
          </div>
        </div>

        <!-- Due for review section -->
        @if (dueWords().length > 0) {
          <div class="bg-gw-accent/5 border border-gw-accent/20 rounded-2xl overflow-hidden">
            <div class="px-5 py-3 border-b border-gw-accent/15 flex items-center gap-2">
              <i-lucide [img]="ReviewIcon" size="14" class="text-gw-accent flex-shrink-0"></i-lucide>
              <p class="text-[11px] font-black uppercase tracking-widest text-gw-accent italic">Due for Review (7+ days ago)</p>
            </div>
            <div class="divide-y divide-gw-accent/10">
              @for (word of dueWords(); track word.focusWord) {
                <div class="px-5 py-3 flex items-center justify-between gap-3">
                  <span class="font-black text-gw-text italic uppercase tracking-wide">{{ word.focusWord }}</span>
                  <div class="flex items-center gap-3 flex-shrink-0">
                    <span class="text-[11px] font-bold text-gw-text-muted">{{ word.correctRate | number:'1.0-0' }}% correct</span>
                    <span class="text-[11px] font-bold text-gw-accent italic">{{ word.timesEncountered }}x</span>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- All words -->
        <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm overflow-hidden">
          <div class="px-5 py-3 border-b border-gw-bg">
            <p class="text-[11px] font-black uppercase tracking-widest text-gw-text-muted italic">All Words</p>
          </div>
          <div class="divide-y divide-gw-bg">
            @for (word of bank()!.words; track word.focusWord) {
              <div class="px-5 py-3.5 flex items-center justify-between gap-3">
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-black text-gw-text italic uppercase tracking-wide">{{ word.focusWord }}</span>
                    @if (word.isDueForReview) {
                      <span class="px-1.5 py-0.5 bg-gw-accent/10 text-gw-accent text-[11px] font-black uppercase tracking-wider rounded-md">Review</span>
                    }
                  </div>
                  <p class="text-[11px] font-semibold text-gw-text-muted mt-0.5">
                    Introduced {{ word.dateIntroduced | date:'MMM d, yyyy' }} · {{ word.timesEncountered }}x practiced
                  </p>
                </div>
                <div class="flex items-center gap-1.5 shrink-0">
                  <div class="h-1.5 w-16 bg-gw-bg rounded-full overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-500"
                         [style.width.%]="word.correctRate"
                         [class.bg-gw-success]="word.correctRate >= 70"
                         [class.bg-amber-400]="word.correctRate >= 40 && word.correctRate < 70"
                         [class.bg-gw-error]="word.correctRate < 40">
                    </div>
                  </div>
                  <span class="text-[11px] font-black italic"
                        [class.text-gw-success]="word.correctRate >= 70"
                        [class.text-amber-500]="word.correctRate >= 40 && word.correctRate < 70"
                        [class.text-gw-error]="word.correctRate < 40">
                    {{ word.correctRate | number:'1.0-0' }}%
                  </span>
                </div>
              </div>
            }
          </div>
        </div>

      }

      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class VocabularyBankComponent implements OnInit {
  private userService = inject(UserService);

  readonly BookIcon   = BookOpen;
  readonly ReviewIcon = RotateCcw;
  readonly CheckIcon  = CheckCircle2;
  readonly ClockIcon  = Clock;

  bank      = signal<VocabularyBank | null>(null);
  isLoading = signal(true);

  dueWords() {
    return (this.bank()?.words ?? []).filter(w => w.isDueForReview);
  }

  ngOnInit() {
    this.userService.getVocabularyBank().pipe(
      catchError(() => {
        this.isLoading.set(false);
        return of(null);
      })
    ).subscribe(data => {
      this.bank.set(data);
      this.isLoading.set(false);
    });
  }
}

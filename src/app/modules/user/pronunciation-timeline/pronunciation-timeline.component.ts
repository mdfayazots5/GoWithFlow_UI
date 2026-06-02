import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserService } from '@core/services/user.service';
import { LucideAngularModule, Volume2, AlertTriangle, CheckCircle2, BookOpen, Mic } from 'lucide-angular';
import { catchError, of } from 'rxjs';

interface PronunciationSessionEntry {
  sessionId: number;
  sessionDate: string;
  hadIssue: boolean;
  issueNote: string;
}

interface PronunciationProblemWord {
  word: string;
  totalOccurrences: number;
  ipaReference: string;
  isPersistent: boolean;
  practiceScriptId: number;
  practiceScriptTitle: string;
  sessionHistory: PronunciationSessionEntry[];
}

interface PronunciationTimeline {
  hasData: boolean;
  problemWords: PronunciationProblemWord[];
  topPersistentWords: PronunciationProblemWord[];
}

@Component({
  selector: 'app-pronunciation-timeline',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gw-bg">
      <div class="max-w-lg mx-auto px-4 pt-2 pb-28 space-y-4 animate-in fade-in duration-500">

      <!-- Page heading -->
      <div>
        <h1 class="text-xl font-black text-gw-text tracking-tight">Pronunciation Timeline</h1>
        <p class="text-[11px] font-semibold text-gw-text-muted mt-0.5">Problem words across your sessions</p>
      </div>

      @if (isLoading()) {
        <div class="flex flex-col items-center justify-center py-20 gap-4">
          <div class="w-10 h-10 border-4 border-gw-primary border-t-transparent rounded-full animate-spin"></div>
          <p class="text-sm font-black uppercase tracking-widest italic text-gw-text-muted">Analysing your pronunciation...</p>
        </div>
      }

      @else if (!data() || !data()!.hasData) {
        <div class="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div class="w-16 h-16 rounded-2xl bg-gw-bg flex items-center justify-center">
            <i-lucide [img]="MicIcon" size="32" class="text-gw-text-muted"></i-lucide>
          </div>
          <div>
            <p class="text-base font-black text-gw-text italic">No pronunciation data yet</p>
            <p class="text-sm text-gw-text-muted italic mt-1">Complete sessions with voice recording to see your pronunciation timeline.</p>
          </div>
        </div>
      }

      @else if (data()) {
        <!-- Top Persistent Words -->
        @if (data()!.topPersistentWords.length > 0) {
          <div class="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
            <div class="px-5 py-3 border-b border-amber-200 flex items-center gap-2">
              <i-lucide [img]="AlertIcon" size="14" class="text-amber-600 flex-shrink-0"></i-lucide>
              <p class="text-[10px] font-black uppercase tracking-widest text-amber-700 italic">Persistent Problem Words — Practice These</p>
            </div>
            <div class="divide-y divide-amber-100">
              @for (word of data()!.topPersistentWords; track word.word) {
                <div class="px-5 py-4">
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="font-black text-gw-text italic uppercase tracking-wide text-base">{{ word.word }}</span>
                        @if (word.ipaReference) {
                          <span class="text-[10px] text-amber-600 font-mono bg-amber-100 px-1.5 py-0.5 rounded">{{ word.ipaReference }}</span>
                        }
                      </div>
                      <p class="text-[9px] font-bold text-amber-600 mt-0.5 italic">{{ word.totalOccurrences }} sessions with issues</p>
                    </div>
                    @if (word.practiceScriptId > 0) {
                      <a [routerLink]="['/scripts']" [queryParams]="{ scriptId: word.practiceScriptId }"
                        class="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-[8px] font-black uppercase tracking-wider italic hover:bg-amber-700 transition-all">
                        <i-lucide [img]="BookIcon" size="10"></i-lucide>
                        Practice
                      </a>
                    }
                  </div>
                  <!-- Session dot history -->
                  <div class="flex items-center gap-1 mt-3 flex-wrap">
                    @for (entry of word.sessionHistory.slice(-12); track entry.sessionId) {
                      <div class="w-4 h-4 rounded-full flex-shrink-0 cursor-default"
                        [class.bg-gw-error]="entry.hadIssue"
                        [class.bg-gw-success]="!entry.hadIssue"
                        [title]="(entry.hadIssue ? 'Issue: ' + entry.issueNote : 'OK') + ' — ' + (entry.sessionDate | date:'MMM d')">
                      </div>
                    }
                    @if (word.sessionHistory.length > 12) {
                      <span class="text-[8px] text-amber-600 font-bold italic">+{{ word.sessionHistory.length - 12 }} more</span>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- All problem words -->
        <div class="bg-white rounded-2xl border border-gw-card-border shadow-sm overflow-hidden">
          <div class="px-5 py-3 border-b border-gw-bg flex items-center gap-2">
            <i-lucide [img]="VolumeIcon" size="14" class="text-gw-text-muted"></i-lucide>
            <p class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted italic">All Problem Words ({{ data()!.problemWords.length }})</p>
          </div>
          <div class="divide-y divide-gw-bg">
            @for (word of data()!.problemWords; track word.word) {
              <div class="px-5 py-4">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="font-black text-gw-text italic uppercase tracking-wide">{{ word.word }}</span>
                      @if (word.ipaReference) {
                        <span class="text-[9px] text-gw-primary font-mono bg-gw-primary/10 px-1.5 py-0.5 rounded">{{ word.ipaReference }}</span>
                      }
                      @if (word.isPersistent) {
                        <span class="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[7px] font-black uppercase tracking-wider rounded-md">Persistent</span>
                      }
                    </div>
                    <p class="text-[9px] font-semibold text-gw-text-muted mt-0.5 italic">{{ word.totalOccurrences }} occurrence{{ word.totalOccurrences !== 1 ? 's' : '' }}</p>
                    <!-- Dot timeline -->
                    <div class="flex items-center gap-1 mt-2 flex-wrap">
                      @for (entry of word.sessionHistory.slice(-10); track entry.sessionId) {
                        <div class="w-3 h-3 rounded-full flex-shrink-0"
                          [class.bg-gw-error]="entry.hadIssue"
                          [class.bg-gw-success]="!entry.hadIssue"
                          [title]="entry.hadIssue ? 'Issue — ' + (entry.sessionDate | date:'MMM d') : 'OK — ' + (entry.sessionDate | date:'MMM d')">
                        </div>
                      }
                    </div>
                  </div>
                  @if (word.practiceScriptId > 0) {
                    <a [routerLink]="['/scripts']" [queryParams]="{ scriptId: word.practiceScriptId }"
                      class="shrink-0 text-[8px] font-black text-gw-primary uppercase tracking-wider italic hover:underline mt-0.5">
                      Practice →
                    </a>
                  }
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Legend -->
        <div class="flex items-center gap-4 px-1">
          <div class="flex items-center gap-1.5">
            <div class="w-3 h-3 rounded-full bg-gw-error"></div>
            <span class="text-[9px] font-bold text-gw-text-muted italic">Issue detected</span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-3 h-3 rounded-full bg-gw-success"></div>
            <span class="text-[9px] font-bold text-gw-text-muted italic">No issue</span>
          </div>
          <span class="text-[9px] text-gw-text-muted italic">Dots = sessions, newest on right</span>
        </div>
      }

      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class PronunciationTimelineComponent implements OnInit {
  private userService = inject(UserService);

  readonly VolumeIcon = Volume2;
  readonly AlertIcon  = AlertTriangle;
  readonly CheckIcon  = CheckCircle2;
  readonly BookIcon   = BookOpen;
  readonly MicIcon    = Mic;

  data      = signal<PronunciationTimeline | null>(null);
  isLoading = signal(true);

  ngOnInit() {
    this.userService.getPronunciationTimeline().pipe(
      catchError(() => {
        this.isLoading.set(false);
        return of(null);
      })
    ).subscribe(data => {
      this.data.set(data);
      this.isLoading.set(false);
    });
  }
}

import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ScriptService } from '@core/services/script.service';
import { ChallengeService } from '@core/services/challenge.service';
import { ToastService } from '@core/services/toast.service';
import {
  LucideAngularModule,
  ChevronLeft, FileText, Tag, Hash, Users, Layers, List, Calendar, Download,
} from 'lucide-angular';

@Component({
  selector: 'app-admin-script-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <div class="space-y-6 pb-12">

      <!-- Back + Header -->
      <div class="flex items-center gap-4">
        <a routerLink="/admin/scripts"
          class="w-10 h-10 flex items-center justify-center bg-white border border-gw-card-border rounded-2xl text-gw-text-muted hover:text-gw-primary hover:border-gw-primary transition-all shadow-sm">
          <i-lucide [img]="BackIcon" size="18"></i-lucide>
        </a>
        @if (loading()) {
          <div class="w-7 h-7 border-2 border-gw-primary border-t-transparent rounded-full animate-spin"></div>
        } @else if (script()) {
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-gw-primary/10 flex items-center justify-center">
              <i-lucide [img]="ScriptIcon" size="22" class="text-gw-primary"></i-lucide>
            </div>
            <div>
              <h2 class="text-xl font-black text-gw-text">{{ script()!.scriptTitle }}</h2>
              <div class="flex items-center gap-3 mt-0.5">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
                  [class]="script()!.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'">
                  <span class="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    [class]="script()!.active ? 'bg-green-500' : 'bg-red-400'"></span>
                  {{ script()!.active ? 'Active' : 'Inactive' }}
                </span>
                <span class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted">v{{ script()!.version }}</span>
              </div>
            </div>
          </div>
        }
      </div>

      @if (!loading() && !script()) {
        <div class="flex flex-col items-center justify-center py-20 gap-4">
          <div class="w-16 h-16 rounded-2xl bg-gw-bg flex items-center justify-center">
            <i-lucide [img]="ScriptIcon" size="28" class="text-gw-text-muted"></i-lucide>
          </div>
          <p class="font-black text-gw-text">Script not found</p>
          <a routerLink="/admin/scripts" class="text-sm font-bold text-gw-primary hover:underline">Back to Scripts</a>
        </div>
      }

      @if (!loading() && script()) {
        <div class="grid lg:grid-cols-3 gap-6">

          <!-- Left: Info + Version History -->
          <div class="lg:col-span-2 space-y-6">

            <!-- Script Info -->
            <div class="bg-white border border-gw-card-border rounded-2xl shadow-sm overflow-hidden">
              <div class="px-5 py-4 border-b border-gw-card-border">
                <h3 class="text-sm font-black text-gw-text uppercase tracking-wider">Script Info</h3>
              </div>
              <div class="p-5 grid sm:grid-cols-2 gap-4">

                <div class="flex items-center gap-3 p-3 bg-gw-bg rounded-xl">
                  <i-lucide [img]="TagIcon" size="16" class="text-gw-text-muted flex-shrink-0"></i-lucide>
                  <div>
                    <p class="text-[9px] font-black uppercase tracking-widest text-gw-text-muted">Category</p>
                    <p class="text-sm font-bold text-gw-text mt-0.5">{{ script()!.category }}</p>
                  </div>
                </div>

                <div class="flex items-center gap-3 p-3 bg-gw-bg rounded-xl">
                  <i-lucide [img]="HashIcon" size="16" class="text-gw-text-muted flex-shrink-0"></i-lucide>
                  <div>
                    <p class="text-[9px] font-black uppercase tracking-widest text-gw-text-muted">Grammar Tag</p>
                    <p class="text-sm font-bold text-gw-text mt-0.5">{{ script()!.grammarFocusTag }}</p>
                  </div>
                </div>

                <div class="flex items-center gap-3 p-3 bg-gw-bg rounded-xl">
                  <i-lucide [img]="UsersIcon" size="16" class="text-gw-text-muted flex-shrink-0"></i-lucide>
                  <div>
                    <p class="text-[9px] font-black uppercase tracking-widest text-gw-text-muted">Age Group</p>
                    <p class="text-sm font-bold text-gw-text mt-0.5">{{ script()!.targetAgeGroup }}</p>
                  </div>
                </div>

                <div class="flex items-center gap-3 p-3 bg-gw-bg rounded-xl">
                  <i-lucide [img]="LinesIcon" size="16" class="text-gw-text-muted flex-shrink-0"></i-lucide>
                  <div>
                    <p class="text-[9px] font-black uppercase tracking-widest text-gw-text-muted">Utterance Lines</p>
                    <p class="text-sm font-bold text-gw-text mt-0.5">{{ script()!.utteranceCount }}</p>
                  </div>
                </div>

                <div class="flex items-center gap-3 p-3 bg-gw-bg rounded-xl">
                  <i-lucide [img]="LayersIcon" size="16" class="text-gw-text-muted flex-shrink-0"></i-lucide>
                  <div>
                    <p class="text-[9px] font-black uppercase tracking-widest text-gw-text-muted">Complexity</p>
                    <div class="flex gap-1 mt-1.5">
                      @for (d of [1,2,3,4,5]; track d) {
                        <span class="w-3 h-3 rounded-full"
                          [class]="d <= script()!.complexityLevel ? 'bg-gw-primary' : 'bg-gray-200'"></span>
                      }
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-3 p-3 bg-gw-bg rounded-xl">
                  <i-lucide [img]="CalendarIcon" size="16" class="text-gw-text-muted flex-shrink-0"></i-lucide>
                  <div>
                    <p class="text-[9px] font-black uppercase tracking-widest text-gw-text-muted">Uploaded</p>
                    <p class="text-sm font-bold text-gw-text mt-0.5">{{ script()!.uploadedDate | date:'d MMM y' }}</p>
                  </div>
                </div>

              </div>
            </div>

            <!-- Version History -->
            <div class="bg-white border border-gw-card-border rounded-2xl shadow-sm overflow-hidden">
              <div class="px-5 py-4 border-b border-gw-card-border">
                <h3 class="text-sm font-black text-gw-text uppercase tracking-wider">Version History</h3>
              </div>

              @if (versionsLoading()) {
                <div class="flex items-center justify-center py-10 gap-2 text-gw-text-muted">
                  <div class="w-5 h-5 border-2 border-gw-primary border-t-transparent rounded-full animate-spin"></div>
                  <span class="text-sm font-medium">Loading versions...</span>
                </div>
              } @else if (versions().length === 0) {
                <div class="flex items-center justify-center py-10 text-sm text-gw-text-muted">
                  No version history available.
                </div>
              } @else {
                <div class="overflow-x-auto">
                  <table class="w-full">
                    <thead>
                      <tr class="border-b border-gw-card-border">
                        <th class="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Version</th>
                        <th class="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gw-text-muted hidden sm:table-cell">Date</th>
                        <th class="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gw-text-muted hidden md:table-cell">Notes</th>
                        <th class="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (v of versions(); track v.versionNumber; let first = $first) {
                        <tr class="border-b border-gw-card-border/50 last:border-0 hover:bg-gw-bg/40 transition-colors">
                          <td class="px-5 py-3.5">
                            <div class="flex items-center gap-2">
                              <span class="text-sm font-black text-gw-text">v{{ v.versionNumber }}</span>
                              @if (first) {
                                <span class="px-2 py-0.5 bg-gw-primary/10 text-gw-primary text-[9px] font-black uppercase tracking-wider rounded-full">Current</span>
                              }
                            </div>
                          </td>
                          <td class="px-4 py-3.5 hidden sm:table-cell">
                            <span class="text-xs font-medium text-gw-text-muted">
                              {{ v.uploadedDate | date:'d MMM y' }}
                            </span>
                          </td>
                          <td class="px-4 py-3.5 hidden md:table-cell">
                            <span class="text-xs text-gw-text-muted italic">{{ v.versionNotes || '—' }}</span>
                          </td>
                          <td class="px-4 py-3.5 text-right">
                            @if (!first) {
                              <button (click)="rollback(v.versionNumber)"
                                class="h-7 px-3 text-[10px] font-black uppercase tracking-wider text-gw-primary border border-gw-primary/30 rounded-lg hover:bg-gw-primary/10 transition-colors">
                                Rollback
                              </button>
                            }
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          </div>

          <!-- Right: Actions -->
          <div class="space-y-4">
            <div class="bg-white border border-gw-card-border rounded-2xl shadow-sm overflow-hidden">
              <div class="px-5 py-4 border-b border-gw-card-border">
                <h3 class="text-sm font-black text-gw-text uppercase tracking-wider">Actions</h3>
              </div>
              <div class="p-5 space-y-2.5">

                <button (click)="toggle()"
                  class="w-full h-11 font-black text-sm uppercase tracking-widest rounded-xl border-2 transition-all"
                  [class]="script()!.active
                    ? 'border-red-400 text-red-500 hover:bg-red-50'
                    : 'border-green-400 text-green-600 hover:bg-green-50'">
                  {{ script()!.active ? 'Deactivate Script' : 'Activate Script' }}
                </button>

                <button (click)="duplicate()"
                  class="w-full h-11 font-black text-sm uppercase tracking-widest rounded-xl border-2 border-gw-primary/30 text-gw-primary hover:bg-gw-primary/5 transition-all">
                  Duplicate Script
                </button>

                <button (click)="setChallenge()"
                  class="w-full h-11 font-black text-sm uppercase tracking-widest rounded-xl border-2 border-amber-400 text-amber-600 hover:bg-amber-50 transition-all">
                  Set Weekly Challenge
                </button>

                <button (click)="download()"
                  class="w-full h-11 font-black text-sm uppercase tracking-widest rounded-xl border-2 border-gray-200 text-gw-text-muted hover:text-gw-success hover:border-gw-success hover:bg-green-50 transition-all flex items-center justify-center gap-2">
                  <i-lucide [img]="DownloadIcon" size="15"></i-lucide>
                  Download Excel
                </button>

              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class AdminScriptDetailComponent implements OnInit {
  private route        = inject(ActivatedRoute);
  private router       = inject(Router);
  private scriptSvc    = inject(ScriptService);
  private challengeSvc = inject(ChallengeService);
  private toast        = inject(ToastService);

  readonly BackIcon     = ChevronLeft;
  readonly ScriptIcon   = FileText;
  readonly TagIcon      = Tag;
  readonly HashIcon     = Hash;
  readonly UsersIcon    = Users;
  readonly LayersIcon   = Layers;
  readonly LinesIcon    = List;
  readonly CalendarIcon = Calendar;
  readonly DownloadIcon = Download;

  script          = signal<any>(null);
  versions        = signal<any[]>([]);
  loading         = signal(false);
  versionsLoading = signal(false);

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) this.load(params['id']);
    });
  }

  load(id: string) {
    this.loading.set(true);
    this.scriptSvc.getScriptDetail(id).subscribe({
      next: (data: any) => {
        this.script.set({
          ...data,
          id:     String(data.scriptId ?? id),
          active: data.isActive ?? data.active,
        });
        this.loading.set(false);
        this.loadVersions(id);
      },
      error: () => {
        this.toast.error('Failed to load script');
        this.loading.set(false);
      }
    });
  }

  loadVersions(id: string) {
    this.versionsLoading.set(true);
    this.scriptSvc.getVersionHistory(id).subscribe({
      next: (v: any) => { this.versions.set(v ?? []); this.versionsLoading.set(false); },
      error: () => this.versionsLoading.set(false)
    });
  }

  toggle() {
    const s = this.script();
    if (!s) return;
    const goActive = !s.active;
    this.scriptSvc.updateScriptStatus({ scriptId: Number(s.id), isActive: goActive }).subscribe({
      next: () => {
        this.script.update(sc => sc ? { ...sc, active: goActive } : sc);
        this.toast.success(`Script ${goActive ? 'activated' : 'deactivated'}`);
      },
      error: () => this.toast.error('Failed to update status')
    });
  }

  duplicate() {
    const s = this.script();
    if (!s) return;
    this.scriptSvc.duplicateScript(Number(s.id)).subscribe({
      next: () => { this.toast.success('Script duplicated'); this.router.navigate(['/admin/scripts']); },
      error: () => this.toast.error('Duplication failed')
    });
  }

  setChallenge() {
    const s = this.script();
    if (!s) return;
    this.challengeSvc.setWeeklyChallenge(Number(s.id)).subscribe({
      next: () => this.toast.success(`"${s.scriptTitle}" set as weekly challenge`),
      error: () => this.toast.error('Failed to set weekly challenge')
    });
  }

  download() {
    const s = this.script();
    if (!s) return;
    this.scriptSvc.downloadScript(s.id).subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${s.scriptTitle}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.toast.error('Download failed')
    });
  }

  rollback(versionNumber: number) {
    const s = this.script();
    if (!s) return;
    this.scriptSvc.rollbackScriptVersion(Number(s.id), versionNumber).subscribe({
      next: () => {
        this.toast.success(`Rolled back to v${versionNumber}`);
        this.load(s.id);
      },
      error: () => this.toast.error('Rollback failed')
    });
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Plus, History, Power, Edit3, Trash2, FileText, CheckCircle, XCircle } from 'lucide-angular';
import { ScriptService } from '@core/services/script.service';
import { Script } from '@core/models/script.model';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-admin-scripts',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterModule],
  template: `
    <div class="p-8 space-y-8 animate-in slide-in-from-right-5 duration-500">
      <div class="flex items-center justify-between">
        <div class="space-y-1">
          <h1 class="text-3xl font-black italic tracking-tighter uppercase text-ls-text">Script Management</h1>
          <p class="text-ls-text-muted font-medium">Control the content pipeline and version history</p>
        </div>
        <button [routerLink]="['../upload']" class="btn-primary px-8 gap-2">
          <i-lucide [img]="PlusIcon" size="18"></i-lucide>
          Upload New Script
        </button>
      </div>

      <div class="card p-0 overflow-hidden shadow-xl shadow-black/5">
        <table class="w-full text-left">
          <thead class="bg-ls-bg/50 border-b border-ls-card-border">
            <tr>
              <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-ls-text-muted">Scenario Title</th>
              <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-ls-text-muted">Category</th>
              <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-ls-text-muted">Focus Tag</th>
              <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-ls-text-muted">Target</th>
              <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-ls-text-muted text-center">Status</th>
              <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-ls-text-muted text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-ls-card-border">
            <tr *ngFor="let s of scripts" class="hover:bg-ls-bg/30 transition-colors group">
              <td class="px-6 py-5">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-ls-bg rounded-xl flex items-center justify-center text-ls-text-muted group-hover:text-ls-primary transition-colors">
                    <i-lucide [img]="FileIcon" size="18"></i-lucide>
                  </div>
                  <div>
                    <p class="font-bold text-ls-text">{{ s.title }}</p>
                    <p class="text-[10px] font-medium text-ls-text-muted uppercase tracking-widest">Version {{ s.version }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-5">
                <span class="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-ls-bg rounded-lg text-ls-text-muted">{{ s.category }}</span>
              </td>
              <td class="px-6 py-5">
                 <span class="text-[10px] font-bold text-ls-accent italic">{{ s.grammarFocusTag }}</span>
              </td>
              <td class="px-6 py-5">
                 <span class="text-[10px] font-black uppercase tracking-widest text-ls-text">{{ s.targetAgeGroup }}</span>
              </td>
              <td class="px-6 py-5 text-center">
                 <div class="flex items-center justify-center gap-2">
                    <i-lucide *ngIf="s.active" [img]="CheckIcon" size="16" class="text-ls-success"></i-lucide>
                    <i-lucide *ngIf="!s.active" [img]="XIcon" size="16" class="text-ls-error"></i-lucide>
                    <span class="text-[10px] font-black uppercase tracking-widest" [class.text-ls-success]="s.active" [class.text-ls-error]="!s.active">
                      {{ s.active ? 'Active' : 'Inactive' }}
                    </span>
                 </div>
              </td>
              <td class="px-6 py-5 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button (click)="viewHistory(s.id)" class="p-2 text-ls-text-muted hover:bg-ls-bg rounded-lg transition-all" title="History">
                    <i-lucide [img]="HistoryIcon" size="18"></i-lucide>
                  </button>
                  <button
                    (click)="toggleStatus(s)"
                    class="p-2 hover:bg-ls-bg rounded-lg transition-all"
                    [class.text-ls-error]="s.active"
                    [class.text-ls-success]="!s.active"
                    title="Toggle Status"
                  >
                    <i-lucide [img]="PowerIcon" size="18"></i-lucide>
                  </button>
                  <button class="p-2 text-ls-primary hover:bg-blue-50 rounded-lg transition-all" title="Edit">
                    <i-lucide [img]="EditIcon" size="18"></i-lucide>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: []
})
export class AdminScriptsComponent implements OnInit {
  readonly PlusIcon = Plus;
  readonly FileIcon = FileText;
  readonly HistoryIcon = History;
  readonly PowerIcon = Power;
  readonly EditIcon = Edit3;
  readonly TrashIcon = Trash2;
  readonly CheckIcon = CheckCircle;
  readonly XIcon = XCircle;

  scripts: Script[] = [];

  constructor(private scriptService: ScriptService) {}

  ngOnInit() {
    this.scriptService.getScripts({}).subscribe(res => this.scripts = res.items);
  }

  toggleStatus(script: Script) {
    this.scriptService.updateScriptStatus({ scriptId: script.id, active: !script.active }).subscribe(() => {
      script.active = !script.active;
    });
  }

  viewHistory(scriptId: string) {
    this.scriptService.getVersionHistory(scriptId).subscribe(history => {
      console.table(history);
      alert(`Version history for ${scriptId} logged to console (Demo)`);
    });
  }
}

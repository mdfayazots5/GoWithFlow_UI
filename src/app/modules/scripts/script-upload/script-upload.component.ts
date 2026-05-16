import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Upload, CheckCircle, AlertTriangle, FileSpreadsheet, ArrowRight, ArrowLeft, Download, Info } from 'lucide-angular';
import { ScriptService } from '@core/services/script.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-script-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="p-8 max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-5 duration-500">
      <div class="flex items-center justify-between">
        <h1 class="text-3xl font-black italic tracking-tighter uppercase text-ls-text">Script Upload Wizard</h1>
        <div class="flex gap-2">
           <div *ngFor="let s of [1,2,3]" class="w-3 h-3 rounded-full border-2" 
                [class.bg-ls-primary]="step >= s" 
                [class.border-ls-primary]="step >= s"
                [class.border-ls-card-border]="step < s"></div>
        </div>
      </div>

      <!-- Step 1: File Selection -->
      <div *ngIf="step === 1" class="space-y-8">
        <div class="card border-dashed border-2 py-20 flex flex-col items-center justify-center gap-6 group hover:border-ls-primary transition-all cursor-pointer relative">
           <input type="file" (change)="onFileSelected($event)" accept=".xlsx" class="absolute inset-0 opacity-0 cursor-pointer">
           <div class="w-20 h-20 bg-ls-bg rounded-[32px] flex items-center justify-center text-ls-text-muted group-hover:bg-ls-primary group-hover:text-white transition-all shadow-xl shadow-black/5">
              <i-lucide [img]="UploadIcon" size="32"></i-lucide>
           </div>
           <div class="text-center space-y-2">
              <p class="text-xl font-black italic uppercase tracking-tighter text-ls-text">Drag & Drop Excel Scenario</p>
              <p class="text-xs text-ls-text-muted font-bold uppercase tracking-widest">Only .xlsx files up to 5MB supported</p>
           </div>
        </div>

        <div class="card bg-blue-50/50 border-blue-100 flex items-center justify-between">
           <div class="flex items-center gap-4 text-ls-primary font-black text-xs uppercase tracking-widest">
              <i-lucide [img]="InfoIcon" size="18"></i-lucide>
              Download Sample excel template
           </div>
           <button (click)="downloadTemplate()" class="h-10 px-6 bg-white border border-blue-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-ls-primary flex items-center gap-2 hover:bg-blue-50 transition-all shadow-sm">
              <i-lucide [img]="DownloadIcon" size="14"></i-lucide>
              Excel_Template.xlsx
           </button>
        </div>
      </div>

      <!-- Step 2: Preview & Validation -->
      <div *ngIf="step === 2" class="space-y-6">
        <div class="card space-y-6">
           <div class="flex items-center justify-between border-b border-ls-card-border pb-4">
              <div class="flex items-center gap-3">
                 <i-lucide [img]="ExcelIcon" size="24" class="text-ls-success"></i-lucide>
                 <div>
                    <p class="text-sm font-black italic">{{ selectedFile?.name }}</p>
                    <p class="text-[10px] font-bold text-ls-text-muted uppercase tracking-widest">{{ parsedData?.rows?.length }} Utterances Detected</p>
                 </div>
              </div>
              <div class="px-3 py-1 bg-green-50 text-ls-success text-[10px] font-black uppercase tracking-widest rounded-lg border border-green-100 flex items-center gap-1.5">
                 <i-lucide [img]="CheckIcon" size="12"></i-lucide>
                 Validation Passed
              </div>
           </div>

           <div class="max-h-[300px] overflow-y-auto border border-ls-card-border rounded-xl">
              <table class="w-full text-left text-[10px]">
                 <thead class="bg-ls-bg/50 sticky top-0 border-b border-ls-card-border">
                    <tr>
                       <th class="px-4 py-2 font-black uppercase tracking-widest text-ls-text-muted">ID</th>
                       <th class="px-4 py-2 font-black uppercase tracking-widest text-ls-text-muted">Speaker</th>
                       <th class="px-4 py-2 font-black uppercase tracking-widest text-ls-text-muted">English Text</th>
                       <th class="px-4 py-2 font-black uppercase tracking-widest text-ls-text-muted">Hint (Regional)</th>
                    </tr>
                 </thead>
                 <tbody class="divide-y divide-ls-card-border">
                    <tr *ngFor="let row of parsedData?.rows" class="hover:bg-ls-bg/30">
                       <td class="px-4 py-3 font-black">{{ row.sequenceId }}</td>
                       <td class="px-4 py-3 text-ls-primary font-bold italic">{{ row.speakerLabel }}</td>
                       <td class="px-4 py-3 font-medium text-ls-text line-clamp-1">{{ row.englishText }}</td>
                       <td class="px-4 py-3 font-medium text-ls-text-muted italic">{{ row.hintText }}</td>
                    </tr>
                 </tbody>
              </table>
           </div>
        </div>

        <div class="flex gap-4">
           <button (click)="step = 1" class="h-14 px-8 border-2 border-ls-card-border rounded-2xl font-black italic uppercase text-ls-text flex items-center gap-2 transition-all hover:bg-ls-bg shadow-sm">
             <i-lucide [img]="BackIcon" size="18"></i-lucide>
             Re-upload
           </button>
           <button (click)="step = 3" class="flex-1 btn-primary text-lg gap-2">
             Continue to Metadata
             <i-lucide [img]="NextIcon" size="20"></i-lucide>
           </button>
        </div>
      </div>

      <!-- Step 3: Metadata & Finish -->
      <div *ngIf="step === 3" class="space-y-6 animate-in fade-in zoom-in-95 duration-500">
         <div class="card space-y-6">
            <h3 class="text-xs font-black uppercase tracking-[0.2em] text-ls-text-muted px-1 border-b border-ls-card-border pb-4">Scenario Properties</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div class="space-y-2">
                  <label class="text-[10px] font-black uppercase tracking-widest text-ls-text-muted px-1">Scenario Title</label>
                  <input type="text" [(ngModel)]="metadata.title" placeholder="e.g. Office Talk - Meetings" class="input-field">
               </div>

               <div class="space-y-2">
                  <label class="text-[10px] font-black uppercase tracking-widest text-ls-text-muted px-1">Category</label>
                  <select [(ngModel)]="metadata.category" class="input-field appearance-none cursor-pointer">
                     <option value="Grammar Drill">Grammar Drill</option>
                     <option value="Roleplay">Roleplay</option>
                     <option value="Mock Interview">Mock Interview</option>
                     <option value="Vocabulary Sprint">Vocabulary Sprint</option>
                  </select>
               </div>

               <div class="space-y-2">
                  <label class="text-[10px] font-black uppercase tracking-widest text-ls-text-muted px-1">Grammar Focus Tag</label>
                  <select [(ngModel)]="metadata.grammarFocusTag" class="input-field appearance-none cursor-pointer text-ls-accent italic">
                     <option value="None">None (Conversational)</option>
                     <option value="Have Been">Have Been / Has Been</option>
                     <option value="Must Be">Must Be / Should Be</option>
                     <option value="Was/Were">Was / Were</option>
                  </select>
               </div>

               <div class="space-y-2">
                  <label class="text-[10px] font-black uppercase tracking-widest text-ls-text-muted px-1">Target Age Group</label>
                  <select [(ngModel)]="metadata.targetAgeGroup" class="input-field appearance-none cursor-pointer">
                     <option value="All">All Audiences</option>
                     <option value="Child">Child (6-12)</option>
                     <option value="Teen">Teen (13-17)</option>
                     <option value="Adult">Adult (18+)</option>
                  </select>
               </div>
            </div>

            <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-ls-text-muted px-1">Brief Description (Optional)</label>
                <textarea [(ngModel)]="metadata.description" class="w-full h-24 bg-white border border-ls-card-border rounded-xl p-4 text-sm font-medium outline-none focus:border-ls-primary transition-all overflow-hidden resize-none" placeholder="What will participants learn in this session?"></textarea>
            </div>
         </div>

         <div class="flex gap-4">
           <button (click)="step = 2" class="h-14 px-8 border-2 border-ls-card-border rounded-2xl font-black italic uppercase text-ls-text flex items-center gap-2 transition-all hover:bg-ls-bg shadow-sm">
             <i-lucide [img]="BackIcon" size="18"></i-lucide>
             Review Excel
           </button>
           <button (click)="handleUpload()" [disabled]="loading || !metadata.title" class="flex-1 btn-primary text-lg gap-2">
             {{ loading ? 'Synchronizing...' : 'Finalize & Post to Library' }}
             <i-lucide *ngIf="!loading" [img]="CheckIcon" size="20"></i-lucide>
           </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ScriptUploadComponent {
  readonly UploadIcon = Upload;
  readonly CheckIcon = CheckCircle;
  readonly AlertIcon = AlertTriangle;
  readonly ExcelIcon = FileSpreadsheet;
  readonly NextIcon = ArrowRight;
  readonly BackIcon = ArrowLeft;
  readonly DownloadIcon = Download;
  readonly InfoIcon = Info;

  step = 1;
  loading = false;
  selectedFile: File | null = null;
  parsedData: any = null;

  metadata = {
    title: '',
    category: 'Grammar Drill',
    grammarFocusTag: 'None',
    targetAgeGroup: 'All',
    description: ''
  };

  constructor(private scriptService: ScriptService, private router: Router) {}

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.xlsx')) {
      this.selectedFile = file;
      this.validateFile();
    } else {
      alert('Invalid file type. Please select an .xlsx file.');
    }
  }

  validateFile() {
    if (!this.selectedFile) return;
    this.loading = true;
    this.scriptService.validateExcel(this.selectedFile).subscribe({
      next: (res) => {
        this.parsedData = res;
        this.step = 2;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  handleUpload() {
    if (!this.selectedFile) return;
    this.loading = true;
    this.scriptService.uploadScript(this.selectedFile, this.metadata).subscribe({
      next: () => {
        this.loading = false;
        alert('Script successfully published to GoWithFlow Library!');
        this.router.navigate(['/admin/dashboard']); 
      },
      error: () => this.loading = false
    });
  }

  downloadTemplate() {
    this.scriptService.getSampleTemplate().subscribe(res => {
      window.open(res.url, '_blank');
    });
  }
}

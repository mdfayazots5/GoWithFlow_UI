// File: src/app/modules/scripts/script-upload/script-upload.component.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ScriptService } from '@core/services/script.service';
import { LucideAngularModule, Upload, CheckCircle2, AlertCircle, FileText, Download, ChevronRight, Save, Trash2, ArrowLeft } from 'lucide-angular';
import { ToastService } from '@core/services/toast.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-script-upload',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h2 class="text-3xl font-black text-gw-text italic tracking-tight">UPOLAD NEW SCRIPT</h2>
        <div class="flex gap-2">
          @for (s of [1, 2, 3]; track s) {
            <div 
              class="w-12 h-1 bg-gw-bg rounded-full overflow-hidden"
              [class.bg-gw-primary]="step() >= s"
            >
              <div 
                class="h-full bg-gw-primary transition-all duration-500"
                [style.width.%]="step() >= s ? 100 : 0"
              ></div>
            </div>
          }
        </div>
      </div>

      <!-- STEP 1: Upload Excel -->
      @if (step() === 1) {
        <div class="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          <div 
            class="relative group"
            (dragover)="$event.preventDefault(); isDragging.set(true)"
            (dragleave)="isDragging.set(false)"
            (drop)="onFileDrop($event)"
          >
            <label 
              class="flex flex-col items-center justify-center w-full min-h-[320px] bg-white border-4 border-dashed rounded-[40px] transition-all cursor-pointer"
              [class.border-gw-primary]="isDragging() || selectedFile()"
              [class.border-gw-card-border]="!isDragging() && !selectedFile()"
              [class.bg-gw-primary/5]="isDragging()"
            >
              <input type="file" class="hidden" accept=".xlsx" (change)="onFileSelect($event)">
              
              @if (!selectedFile()) {
                <div class="flex flex-col items-center text-center space-y-4">
                  <div class="w-20 h-20 rounded-3xl bg-gw-bg flex items-center justify-center text-gw-text-muted group-hover:scale-110 group-hover:text-gw-primary transition-all duration-300">
                    <i-lucide [img]="UploadIcon" size="40"></i-lucide>
                  </div>
                  <div>
                    <p class="text-xl font-black text-gw-text uppercase italic tracking-tight">Drop your Excel file here</p>
                    <p class="text-xs font-bold text-gw-text-muted uppercase tracking-widest mt-1">or click to browse (.xlsx, max 5MB)</p>
                  </div>
                </div>
              } @else {
                <div class="flex flex-col items-center text-center space-y-4 animate-in zoom-in duration-300">
                  <div class="w-20 h-20 rounded-3xl bg-gw-success/10 flex items-center justify-center text-gw-success">
                    <i-lucide [img]="FileIcon" size="40"></i-lucide>
                  </div>
                  <div>
                    <p class="text-xl font-black text-gw-text italic tracking-tight uppercase">{{ selectedFile()?.name }}</p>
                    <p class="text-xs font-bold text-gw-text-muted uppercase tracking-widest mt-1">{{ (selectedFile()?.size || 0) / 1024 | number:'1.0-1' }} KB • READY TO VALIDATE</p>
                  </div>
                  <button (click)="$event.stopPropagation(); removeFile()" class="p-2 text-gw-error hover:bg-gw-error/10 rounded-xl transition-all">
                    <i-lucide [img]="TrashIcon" size="20"></i-lucide>
                  </button>
                </div>
              }
            </label>
          </div>

          <div class="flex flex-col md:flex-row items-center justify-between gap-4 pt-4">
            <button (click)="downloadTemplate()" class="h-12 px-8 border-2 border-gw-primary text-gw-primary font-black uppercase tracking-widest italic rounded-2xl hover:bg-gw-primary hover:text-white transition-all flex items-center gap-2">
              <i-lucide [img]="DownloadIcon" size="18"></i-lucide>
              Download Template
            </button>
            
            <button 
              [disabled]="!selectedFile() || isValidating()"
              (click)="validateFile()"
              class="h-14 px-12 bg-gw-text text-white font-black uppercase tracking-widest italic rounded-2xl hover:scale-[1.05] active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all flex items-center gap-2 shadow-lg shadow-gw-text/20"
            >
              {{ isValidating() ? 'Validating...' : 'Validate File' }}
              <i-lucide [img]="NextIcon" size="20"></i-lucide>
            </button>
          </div>
        </div>
      }

      <!-- STEP 2: Validate & Configure -->
      @if (step() === 2) {
        <div class="space-y-8 animate-in slide-in-from-right duration-500">
          <!-- Validation Results -->
          <div class="grid md:grid-cols-2 gap-4">
            <div class="bg-gw-success/5 border border-gw-success/20 p-6 rounded-3xl flex items-start gap-4">
              <div class="p-2 bg-gw-success/10 rounded-xl text-gw-success">
                <i-lucide [img]="CheckIcon" size="24"></i-lucide>
              </div>
              <div>
                <h4 class="font-black text-gw-text uppercase italic tracking-tight">Rows Validated</h4>
                <p class="text-2xl font-black text-gw-success">{{ validationResult()?.rows?.length || 0 }} rows ready</p>
              </div>
            </div>

            @if (validationResult()?.errors?.length) {
              <div class="bg-gw-error/5 border border-gw-error/20 p-6 rounded-3xl flex items-start gap-4">
                <div class="p-2 bg-gw-error/10 rounded-xl text-gw-error">
                  <i-lucide [img]="ErrorIcon" size="24"></i-lucide>
                </div>
                <div>
                  <h4 class="font-black text-gw-text uppercase italic tracking-tight">Errors Found</h4>
                  <ul class="text-xs font-bold text-gw-error mt-1 space-y-1">
                    @for (err of validationResult()?.errors; track err) {
                      <li>• {{ err }}</li>
                    }
                  </ul>
                </div>
              </div>
            }
          </div>

          <!-- Preview Table -->
          <div class="bg-white rounded-[32px] border border-gw-card-border shadow-sm overflow-hidden">
            <div class="px-8 py-4 border-b border-gw-bg flex justify-between items-center bg-gw-bg/30">
               <span class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted italic">Lines Preview (Showing 5 of {{ validationResult()?.rows?.length }})</span>
               <button class="text-[10px] font-black uppercase tracking-widest text-gw-primary italic hover:underline">Show All</button>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left">
                <thead class="bg-gw-bg/50">
                  <tr>
                    <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Seq</th>
                    <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Speaker</th>
                    <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gw-text-muted">English Text</th>
                    <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Hint</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gw-bg">
                  @for (row of validationResult()?.rows?.slice(0, 5); track row.sequenceId) {
                    <tr>
                      <td class="px-6 py-4 text-xs font-black italic">{{ row.sequenceId }}</td>
                      <td class="px-6 py-4 text-xs font-bold text-gw-text-muted uppercase tracking-tight">{{ row.speakerLabel }}</td>
                      <td class="px-6 py-4 text-sm font-bold text-gw-text">{{ row.englishText }}</td>
                      <td class="px-6 py-4 text-xs font-medium text-gw-text-muted">{{ row.hintText }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <!-- Metadata Form -->
          <div class="bg-white p-8 rounded-[40px] border border-gw-card-border shadow-sm space-y-8">
            <h3 class="text-xl font-black text-gw-text italic uppercase tracking-tight">Script Settings</h3>
            
            <form [formGroup]="metadataForm" class="grid md:grid-cols-2 gap-8">
              <div class="md:col-span-2 space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted px-2">Script Title*</label>
                <input formControlName="scriptTitle" type="text" class="w-full h-14 bg-gw-bg/50 border-2 border-transparent focus:border-gw-primary rounded-2xl px-6 font-bold text-gw-text outline-none transition-all placeholder:italic" placeholder="e.g., Office Gossip Protocol">
              </div>

              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted px-2">Category*</label>
                <select formControlName="category" class="w-full h-14 bg-gw-bg/50 border-2 border-transparent focus:border-gw-primary rounded-2xl px-6 font-bold text-gw-text outline-none appearance-none transition-all">
                  <option value="Grammar Drill">Grammar Drill</option>
                  <option value="Roleplay">Roleplay</option>
                  <option value="Interview">Interview</option>
                  <option value="Vocabulary">Vocabulary</option>
                  <option value="Fluency Drill">Fluency Drill</option>
                </select>
              </div>

              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted px-2">Grammar Focus</label>
                <select formControlName="grammarFocusTag" class="w-full h-14 bg-gw-bg/50 border-2 border-transparent focus:border-gw-primary rounded-2xl px-6 font-bold text-gw-text outline-none appearance-none transition-all">
                  <option value="Have Been">Have Been</option>
                  <option value="Has Been">Has Been</option>
                  <option value="Must Be">Must Be</option>
                  <option value="Should Be">Should Be</option>
                  <option value="Can Be">Can Be</option>
                  <option value="Was/Were">Was/Were</option>
                  <option value="Did/Didn't">Did/Didn't</option>
                  <option value="Will Be">Will Be</option>
                  <option value="Had Been">Had Been</option>
                  <option value="Would Have">Would Have</option>
                </select>
              </div>

              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted px-2">Complexity*</label>
                <div class="flex gap-3">
                  @for (level of [1, 2, 3, 4, 5]; track level) {
                    <button 
                      (click)="metadataForm.get('complexityLevel')?.setValue(level)"
                      class="flex-1 h-14 rounded-2xl font-black transition-all border-2"
                      [class.bg-gw-primary]="metadataForm.get('complexityLevel')?.value === level"
                      [class.text-white]="metadataForm.get('complexityLevel')?.value === level"
                      [class.border-gw-primary]="metadataForm.get('complexityLevel')?.value === level"
                      [class.bg-gw-bg/50]="metadataForm.get('complexityLevel')?.value !== level"
                      [class.text-gw-text-muted]="metadataForm.get('complexityLevel')?.value !== level"
                      [class.border-transparent]="metadataForm.get('complexityLevel')?.value !== level"
                    >
                      {{ level }}
                    </button>
                  }
                </div>
              </div>

              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted px-2">Target Age Group*</label>
                <div class="flex gap-2">
                  @for (age of ['All', 'Child', 'Teen', 'Adult']; track age) {
                    <button 
                      (click)="metadataForm.get('targetAgeGroup')?.setValue(age)"
                      class="flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2"
                      [class.bg-gw-text]="metadataForm.get('targetAgeGroup')?.value === age"
                      [class.text-white]="metadataForm.get('targetAgeGroup')?.value === age"
                      [class.border-gw-text]="metadataForm.get('targetAgeGroup')?.value === age"
                      [class.bg-gw-bg/50]="metadataForm.get('targetAgeGroup')?.value !== age"
                      [class.text-gw-text-muted]="metadataForm.get('targetAgeGroup')?.value !== age"
                      [class.border-transparent]="metadataForm.get('targetAgeGroup')?.value !== age"
                    >
                      {{ age }}
                    </button>
                  }
                </div>
              </div>

              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted px-2">Hint Language*</label>
                <select formControlName="hintLanguage" class="w-full h-14 bg-gw-bg/50 border-2 border-transparent focus:border-gw-primary rounded-2xl px-6 font-bold text-gw-text outline-none appearance-none transition-all">
                  <option value="Telugu">Telugu</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Tamil">Tamil</option>
                  <option value="Kannada">Kannada</option>
                  <option value="None">None (English Only)</option>
                </select>
              </div>
            </form>
          </div>

          <div class="flex items-center justify-between gap-4 pt-4">
             <button (click)="step.set(1)" class="h-12 px-8 text-gw-text-muted font-black uppercase tracking-widest italic rounded-2xl hover:bg-gw-bg transition-all flex items-center gap-2">
              <i-lucide [img]="BackArrowIcon" size="18"></i-lucide>
              Back
            </button>
            <button 
              [disabled]="metadataForm.invalid || validationResult()?.errors?.length"
              (click)="step.set(3)"
              class="h-14 px-12 bg-gw-text text-white font-black uppercase tracking-widest italic rounded-2xl hover:scale-[1.05] active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all flex items-center gap-2 shadow-lg shadow-gw-text/20"
            >
              Continue
              <i-lucide [img]="NextIcon" size="20"></i-lucide>
            </button>
          </div>
        </div>
      }

      <!-- STEP 3: Confirm & Save -->
      @if (step() === 3) {
        <div class="space-y-8 animate-in slide-in-from-right duration-500">
           <div class="bg-white p-10 rounded-[48px] border border-gw-card-border shadow-xl space-y-10">
              <div class="grid md:grid-cols-2 gap-12">
                 <div class="space-y-6">
                    <h3 class="text-2xl font-black text-gw-text italic uppercase tracking-tight">Confirm Details</h3>
                    <div class="space-y-4">
                       <div class="flex items-center justify-between border-b border-gw-bg pb-3">
                          <span class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted italic">Title</span>
                          <span class="text-sm font-black text-gw-text">{{ metadataForm.value.scriptTitle }}</span>
                       </div>
                       <div class="flex items-center justify-between border-b border-gw-bg pb-3">
                          <span class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted italic">Category</span>
                          <span class="px-3 py-1 bg-gw-primary/10 text-gw-primary rounded-lg text-xs font-black uppercase tracking-tighter">{{ metadataForm.value.category }}</span>
                       </div>
                       <div class="flex items-center justify-between border-b border-gw-bg pb-3">
                          <span class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted italic">Complexity</span>
                          <div class="flex gap-1">
                             @for (i of [1, 2, 3, 4, 5]; track i) {
                               <div class="w-3 h-3 rounded-full" [class.bg-gw-accent]="i <= metadataForm.value.complexityLevel" [class.bg-gw-bg]="i > metadataForm.value.complexityLevel"></div>
                             }
                          </div>
                       </div>
                       <div class="flex items-center justify-between border-b border-gw-bg pb-3">
                          <span class="text-[10px] font-black uppercase tracking-widest text-gw-text-muted italic">Age Group</span>
                          <span class="text-sm font-black text-gw-text">{{ metadataForm.value.targetAgeGroup }}</span>
                       </div>
                    </div>
                 </div>

                 <div class="space-y-6">
                    <h3 class="text-2xl font-black text-gw-text italic uppercase tracking-tight">Lines Summary</h3>
                    <div class="bg-gw-bg/30 p-6 rounded-3xl space-y-4">
                       @for (row of validationResult()?.rows?.slice(0, 3); track row.sequenceId) {
                         <div class="text-xs space-y-1 border-b border-white/50 last:border-0 pb-3 last:pb-0">
                            <span class="font-black text-gw-text-muted uppercase tracking-widest">{{ row.speakerLabel }}</span>
                            <p class="font-medium text-gw-text italic">"{{ row.englishText | slice:0:60 }}..."</p>
                         </div>
                       }
                       <p class="text-[10px] font-black text-gw-primary italic text-center pt-2">+ {{ (validationResult()?.rows?.length || 0) - 3 }} more utterances</p>
                    </div>
                 </div>
              </div>

              @if (isSaving()) {
                <div class="space-y-4">
                  <div class="h-2 bg-gw-bg rounded-full overflow-hidden">
                    <div class="h-full bg-gw-primary animate-progress-ind"></div>
                  </div>
                  <p class="text-center text-[10px] font-black text-gw-text-muted uppercase tracking-widest italic animate-pulse">Uploading and Indexing Script...</p>
                </div>
              }

              <div class="flex gap-4 pt-6">
                <button [disabled]="isSaving()" (click)="step.set(2)" class="flex-1 h-14 text-gw-text-muted font-black uppercase tracking-widest italic rounded-2xl hover:bg-gw-bg transition-all border-2 border-transparent">
                  Back to edit
                </button>
                <button 
                  [disabled]="isSaving()"
                  (click)="uploadScript()"
                  class="flex-[2] h-14 bg-gw-primary text-white font-black uppercase tracking-widest italic rounded-2xl hover:scale-[1.05] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-xl shadow-gw-primary/20"
                >
                  <i-lucide [img]="SaveIcon" size="20"></i-lucide>
                  {{ isSaving() ? 'Saving...' : 'Save to Library' }}
                </button>
              </div>
           </div>
        </div>
      }

      <!-- SUCCESS STATE -->
      @if (step() === 4) {
        <div class="fixed inset-0 bg-gw-bg/90 backdrop-blur-xl z-50 flex items-center justify-center p-6 animate-in fade-in duration-500">
           <div class="max-w-md w-full bg-white p-12 rounded-[64px] border border-gw-card-border shadow-2xl text-center space-y-8 animate-in zoom-in duration-500">
              <div class="w-24 h-24 bg-gw-success/10 rounded-[32px] flex items-center justify-center text-gw-success mx-auto shadow-inner">
                 <i-lucide [img]="CheckIcon" size="48"></i-lucide>
              </div>
              <div>
                <h3 class="text-3xl font-black text-gw-text italic uppercase tracking-tight">Script Saved!</h3>
                <p class="text-sm font-bold text-gw-text-muted uppercase tracking-widest mt-2">New version v{{ uploadResponse()?.version }} indexed</p>
              </div>
              <div class="grid gap-3">
                <a routerLink="/scripts" class="h-14 bg-gw-text text-white font-black uppercase tracking-widest italic rounded-2xl flex items-center justify-center hover:scale-[1.05] transition-all">
                  View in Library
                </a>
                <button (click)="resetUpload()" class="h-14 bg-white border-2 border-gw-card-border text-gw-text font-black uppercase tracking-widest italic rounded-2xl hover:bg-gw-bg transition-all">
                  Upload Another
                </button>
              </div>
           </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    @keyframes progress-ind {
      0% { width: 0%; margin-left: 0%; }
      50% { width: 40%; margin-left: 60%; }
      100% { width: 0%; margin-left: 100%; }
    }
    .animate-progress-ind {
      animation: progress-ind 2s ease-in-out infinite;
    }
  `]
})
export class ScriptUploadComponent {
  private fb = inject(FormBuilder);
  private scriptService = inject(ScriptService);
  private toast = inject(ToastService);

  readonly UploadIcon = Upload;
  readonly FileIcon = FileText;
  readonly DownloadIcon = Download;
  readonly NextIcon = ChevronRight;
  readonly CheckIcon = CheckCircle2;
  readonly ErrorIcon = AlertCircle;
  readonly TrashIcon = Trash2;
  readonly SaveIcon = Save;
  readonly BackArrowIcon = ArrowLeft;

  step = signal(1);
  isDragging = signal(false);
  selectedFile = signal<File | null>(null);
  isValidating = signal(false);
  validationResult = signal<any>(null);
  isSaving = signal(false);
  uploadResponse = signal<any>(null);

  metadataForm: FormGroup = this.fb.group({
    scriptTitle: ['', Validators.required],
    category: ['Grammar Drill', Validators.required],
    grammarFocusTag: ['Have Been'],
    contextTag: ['Office'],
    complexityLevel: [3, Validators.required],
    targetAgeGroup: ['Adult', Validators.required],
    hintLanguage: ['Telugu', Validators.required]
  });

  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (file) this.handleFile(file);
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.handleFile(file);
  }

  private handleFile(file: File) {
    if (!file.name.endsWith('.xlsx')) {
      this.toast.error('Only .xlsx files are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.toast.error('File size must be under 5MB');
      return;
    }
    this.selectedFile.set(file);
  }

  removeFile() {
    this.selectedFile.set(null);
  }

  downloadTemplate() {
    this.scriptService.getSampleTemplate().subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sample-script-template.xlsx';
      a.click();
    });
  }

  validateFile() {
    const file = this.selectedFile();
    if (!file) return;

    this.isValidating.set(true);
    this.scriptService.validateExcel(file).subscribe({
      next: (res) => {
        this.isValidating.set(false);
        this.validationResult.set(res);
        this.step.set(2);
      },
      error: () => this.isValidating.set(false)
    });
  }

  uploadScript() {
    const file = this.selectedFile();
    if (!file) return;

    this.isSaving.set(true);
    this.scriptService.uploadScript(file, this.metadataForm.value).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        this.uploadResponse.set(res);
        this.step.set(4);
        this.toast.success('Script uploaded successfully');
      },
      error: () => this.isSaving.set(false)
    });
  }

  resetUpload() {
    this.step.set(1);
    this.selectedFile.set(null);
    this.validationResult.set(null);
    this.uploadResponse.set(null);
    this.metadataForm.reset({
      category: 'Grammar Drill',
      grammarFocusTag: 'Have Been',
      contextTag: 'Office',
      complexityLevel: 3,
      targetAgeGroup: 'Adult',
      hintLanguage: 'Telugu'
    });
  }
}

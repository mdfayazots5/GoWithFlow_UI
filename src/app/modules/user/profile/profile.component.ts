// File: src/app/modules/user/profile/profile.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '@core/services/user.service';
import { UserProfile } from '@core/models/user.model';
import { LucideAngularModule, User, Mail, Smartphone, Calendar, Award, Target, Flame, Edit2, LogOut, Camera, Check } from 'lucide-angular';
import { AuthService } from '@core/services/auth.service';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, ReactiveFormsModule],
  template: `
    <div class="space-y-10 animate-in fade-in duration-500 pb-32">
      <!-- Profile Header -->
      <div class="flex flex-col items-center gap-6 relative">
         <div class="relative group">
            <div class="w-32 h-32 rounded-[48px] overflow-hidden border-4 border-white shadow-xl bg-gw-bg">
               <img [src]="profile()?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + profile()?.fullName" class="w-full h-full object-cover">
            </div>
            <label class="absolute -bottom-2 -right-2 w-10 h-10 bg-gw-primary text-white rounded-2xl flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 active:scale-95 transition-all">
               <i-lucide [img]="CameraIcon" size="18"></i-lucide>
               <input type="file" class="hidden" (change)="onAvatarChange($event)">
            </label>
         </div>

         <div class="text-center space-y-2">
            @if (!isEditing()) {
              <div class="flex items-center justify-center gap-3">
                 <h2 class="text-3xl font-black text-gw-text italic uppercase tracking-tighter">{{ profile()?.fullName }}</h2>
                 <button (click)="toggleEdit()" class="text-gw-text-muted hover:text-gw-primary transition-colors">
                    <i-lucide [img]="EditIcon" size="18"></i-lucide>
                 </button>
              </div>
            } @else {
              <div class="flex flex-col gap-4">
                 <form [formGroup]="editForm" (ngSubmit)="saveProfile()" class="space-y-4">
                    <input 
                      formControlName="fullName"
                      class="w-full h-12 bg-white border-2 border-gw-card-border rounded-xl px-4 text-lg font-bold italic focus:border-gw-primary outline-none text-center"
                      placeholder="Full Name"
                    >
                    <div class="flex gap-2">
                       <button type="button" (click)="toggleEdit()" class="flex-1 h-10 border border-gw-card-border rounded-xl text-[10px] font-black uppercase tracking-widest text-gw-text-muted">Cancel</button>
                       <button type="submit" [disabled]="editForm.invalid || isLoading()" class="flex-1 h-10 bg-gw-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                          @if (isLoading()) { <div class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> }
                          Save
                       </button>
                    </div>
                 </form>
              </div>
            }
            <div class="flex gap-2 justify-center">
               <span class="px-3 py-1 bg-gw-accent/10 text-gw-accent rounded-lg text-[8px] font-black uppercase tracking-widest italic">{{ profile()?.ageGroup }}</span>
               <span class="px-3 py-1 bg-gw-primary/10 text-gw-primary rounded-lg text-[8px] font-black uppercase tracking-widest italic">{{ profile()?.preferredHintLanguage }} Hint</span>
               <span class="px-3 py-1 bg-[#F59E0B]/10 text-[#F59E0B] rounded-lg text-[8px] font-black uppercase tracking-widest italic flex items-center gap-1">
                  <i-lucide [img]="FlameIcon" size="10"></i-lucide>
                  {{ profile()?.dailyStreakCount }} Streak
               </span>
            </div>
         </div>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        @for (stat of stats; track stat.label) {
          <div class="bg-white p-6 rounded-[32px] border border-gw-card-border shadow-sm space-y-1">
             <span class="text-[8px] font-black uppercase tracking-widest text-gw-text-muted italic">{{ stat.label }}</span>
             <p class="text-2xl font-black text-gw-text italic">{{ stat.value }}</p>
          </div>
        }
      </div>

      <!-- Account Info -->
      <div class="bg-white p-8 rounded-[40px] border border-gw-card-border shadow-sm space-y-8">
         <div class="flex items-center gap-4 text-gw-text-muted">
            <div class="w-10 h-10 bg-gw-bg rounded-xl flex items-center justify-center">
               <i-lucide [img]="SmartphoneIcon" size="18"></i-lucide>
            </div>
            <div class="flex-1">
               <p class="text-[8px] font-black uppercase tracking-widest italic">Mobile Number</p>
               <p class="font-bold italic">{{ profile()?.mobileNumber }}</p>
            </div>
         </div>

         <div class="flex items-center gap-4 text-gw-text-muted">
            <div class="w-10 h-10 bg-gw-bg rounded-xl flex items-center justify-center">
               <i-lucide [img]="MailIcon" size="18"></i-lucide>
            </div>
            <div class="flex-1">
               <p class="text-[8px] font-black uppercase tracking-widest italic">Email Address</p>
               <p class="font-bold italic">{{ profile()?.email || 'Not provided' }}</p>
            </div>
         </div>

         <div class="flex items-center gap-4 text-gw-text-muted">
            <div class="w-10 h-10 bg-gw-bg rounded-xl flex items-center justify-center">
               <i-lucide [img]="CalendarIcon" size="18"></i-lucide>
            </div>
            <div class="flex-1">
               <p class="text-[8px] font-black uppercase tracking-widest italic">Member Since</p>
               <p class="font-bold italic">{{ profile()?.registrationDate | date:'MMMM yyyy' }}</p>
            </div>
         </div>
      </div>

      <!-- Preferences -->
      <div class="space-y-6">
        <h3 class="text-lg font-black text-gw-text italic uppercase tracking-widest border-l-4 border-gw-accent pl-4">Update Preferences</h3>
        <div class="grid gap-4">
           <div class="bg-white p-6 rounded-3xl border border-gw-card-border flex items-center justify-between">
              <span class="text-xs font-bold text-gw-text-muted uppercase tracking-widest italic">Hint Language</span>
              <select 
                [value]="profile()?.preferredHintLanguage"
                (change)="updatePreference('preferredHintLanguage', $any($event.target).value)"
                class="bg-gw-bg px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-none outline-none"
              >
                 <option value="Telugu">Telugu</option>
                 <option value="Hindi">Hindi</option>
                 <option value="Tamil">Tamil</option>
                 <option value="Kannada">Kannada</option>
                 <option value="None">None</option>
              </select>
           </div>
           
           <div class="bg-white p-6 rounded-3xl border border-gw-card-border flex items-center justify-between">
              <span class="text-xs font-bold text-gw-text-muted uppercase tracking-widest italic">Age Group</span>
              <select 
                [value]="profile()?.ageGroup"
                (change)="updatePreference('ageGroup', $any($event.target).value)"
                class="bg-gw-bg px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-none outline-none"
              >
                 <option value="Child (6-12)">Child (6-12)</option>
                 <option value="Teen (13-17)">Teen (13-17)</option>
                 <option value="Adult (18+)">Adult (18+)</option>
              </select>
           </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="pt-6">
         <button 
           (click)="logout()"
           class="w-full h-16 border-2 border-gw-error text-gw-error font-black uppercase tracking-widest italic rounded-2xl flex items-center justify-center gap-3 hover:bg-gw-error hover:text-white transition-all shadow-lg shadow-gw-error/5"
         >
            <i-lucide [img]="LogoutIcon" size="20"></i-lucide>
            Log Out
         </button>
      </div>

      <!-- Hidden File Input for Avatar is handled via label -->
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class ProfileComponent implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  readonly CameraIcon = Camera;
  readonly EditIcon = Edit2;
  readonly FlameIcon = Flame;
  readonly SmartphoneIcon = Smartphone;
  readonly MailIcon = Mail;
  readonly CalendarIcon = Calendar;
  readonly LogoutIcon = LogOut;

  profile = signal<UserProfile | null>(null);
  isEditing = signal(false);
  isLoading = signal(false);
  stats: any[] = [];

  editForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]]
  });

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.userService.getProfile().subscribe(res => {
      this.profile.set(res);
      this.editForm.patchValue({ fullName: res.fullName });
      this.stats = [
        { label: 'Sessions', value: res.totalSessionsPlayed },
        { label: 'Avg Fluency', value: res.avgFluencyScore + '%' },
        { label: 'Mistakes Fixed', value: res.mistakesFixed },
        { label: 'Streak', value: res.dailyStreakCount }
      ];
    });
  }

  toggleEdit() {
    this.isEditing.set(!this.isEditing());
  }

  saveProfile() {
    if (this.editForm.invalid) return;
    this.isLoading.set(true);
    const fullName = this.editForm.value.fullName as string;
    
    this.userService.updateProfile({ fullName }).subscribe({
      next: (res) => {
        this.profile.set(res);
        this.isEditing.set(false);
        this.isLoading.set(false);
        this.toast.success('Profile updated successfully');
      },
      error: () => this.isLoading.set(false)
    });
  }

  onAvatarChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.isLoading.set(true);
      this.userService.uploadAvatar(file).subscribe({
        next: (res) => {
          this.profile.update(p => p ? ({ ...p, avatar: res.avatarUrl }) : null);
          this.isLoading.set(false);
          this.toast.success('Avatar updated');
        },
        error: () => this.isLoading.set(false)
      });
    }
  }

  updatePreference(key: string, value: any) {
    this.userService.updateProfile({ [key]: value }).subscribe(res => {
      this.profile.set(res);
      this.toast.success('Preference updated');
    });
  }

  logout() {
    this.authService.logout();
  }
}

import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Centralized avatar component — single source of truth for all user avatar display.
 *
 * Priority:
 *   1. Shows [avatarUrl] image when provided and loads successfully.
 *   2. Falls back to initials on image load error or when avatarUrl is null/empty.
 *
 * Sizes:
 *  xs  — 28px  (inline chips, tiny presence contexts)
 *  sm  — 36px  (header, list rows, card metadata)
 *  md  — 48px  (lobby cards, invitation cards)
 *  lg  — 64px  (listener-screen speaker identity)
 *  xl  — 96px  (profile hero)
 *
 * [dark]="true" — lighter border for dark backgrounds.
 */
@Component({
  selector: 'app-user-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      [style.width.px]="px()"
      [style.height.px]="px()"
      [style.border-radius.px]="radius()"
      [style.background]="'linear-gradient(135deg, #3D5A99 0%, #5B7EC9 100%)'"
      [style.border]="borderStyle()"
      [style.box-shadow]="shadow()"
      [style.flex-shrink]="'0'"
      [style.position]="'relative'"
      [style.overflow]="'hidden'"
      class="flex items-center justify-center select-none"
      [attr.aria-label]="name + ' avatar'">

      <!-- Avatar image — hidden until loaded; replaced by initials on error -->
      @if (avatarUrl && !imgError()) {
        <img
          [src]="avatarUrl"
          [style.width.px]="px()"
          [style.height.px]="px()"
          style="object-fit:cover;position:absolute;inset:0;"
          [alt]="name + ' avatar'"
          (load)="imgLoaded.set(true)"
          (error)="imgError.set(true)">
      }

      <!-- Initials — always rendered; visually hidden when image covers it -->
      @if (!avatarUrl || imgError()) {
        <span
          [style.font-size.px]="fontSize()"
          class="font-black text-white leading-none tracking-tight">
          {{ initials() }}
        </span>
      }
    </div>
  `,
  styles: [`:host { display: inline-flex; }`]
})
export class UserAvatarComponent {
  @Input() name      = '';
  @Input() avatarUrl: string | null | undefined = null;
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'sm';
  @Input() dark      = false;

  imgLoaded = signal(false);
  imgError  = signal(false);

  initials = computed(() => {
    const n = this.name?.trim() ?? '';
    if (!n) return '?';
    const parts = n.split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  });

  px = computed(() => {
    switch (this.size) {
      case 'xs': return 28;
      case 'sm': return 36;
      case 'md': return 48;
      case 'lg': return 64;
      case 'xl': return 96;
    }
  });

  radius = computed(() => {
    switch (this.size) {
      case 'xs': return 8;
      case 'sm': return 10;
      case 'md': return 14;
      case 'lg': return 18;
      case 'xl': return 16;
    }
  });

  fontSize = computed(() => {
    switch (this.size) {
      case 'xs': return 10;
      case 'sm': return 12;
      case 'md': return 16;
      case 'lg': return 22;
      case 'xl': return 34;
    }
  });

  borderStyle = computed(() => {
    const color = this.dark ? 'rgba(255,255,255,0.18)' : 'white';
    const width = this.size === 'xl' ? 4 : this.size === 'lg' ? 3 : 2;
    return `${width}px solid ${color}`;
  });

  shadow = computed(() => {
    if (this.size === 'xs') return 'none';
    return this.dark
      ? '0 2px 12px rgba(0,0,0,0.4)'
      : '0 4px 12px rgba(61,90,153,0.25)';
  });
}

import { registerPlugin, PluginListenerHandle } from '@capacitor/core';

/** A single queued line handed to the native foreground media service. */
export interface ListenMediaLine {
  text: string;
  speakerLabel: string;
  gender: 'Male' | 'Female';
  pitch: number;
  /** Which same-gender en-IN device voice to prefer (0,1,2) — the named persona's variant. */
  variant?: number;
}

export interface ListenMediaStartOptions {
  title: string;
  lines: ListenMediaLine[];
  startIndex: number;
  rate: number;
  repeat: 'off' | 'one' | 'all';
}

/** State pushed from the native service whenever playback changes (incl. lock-screen / notification actions). */
export interface ListenMediaState {
  index: number;
  isPlaying: boolean;
  rate: number;
  repeat: 'off' | 'one' | 'all';
  finished: boolean;
}

export interface ListenMediaPlugin {
  start(options: ListenMediaStartOptions): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  next(): Promise<void>;
  prev(): Promise<void>;
  seekTo(options: { index: number }): Promise<void>;
  setRate(options: { rate: number }): Promise<void>;
  setRepeat(options: { mode: 'off' | 'one' | 'all' }): Promise<void>;
  stop(): Promise<void>;
  ensureNotificationPermission(): Promise<{ granted: boolean }>;
  addListener(
    eventName: 'stateChanged',
    listenerFunc: (state: ListenMediaState) => void
  ): Promise<PluginListenerHandle>;
}

/**
 * Bridge to the native Android foreground media service (lock screen + notification controls).
 * Android-only — guard every call with `Capacitor.isNativePlatform()`; on web it has no
 * implementation and the Listen Script player falls back to its in-WebView TTS loop.
 */
export const ListenMedia = registerPlugin<ListenMediaPlugin>('ListenMedia');

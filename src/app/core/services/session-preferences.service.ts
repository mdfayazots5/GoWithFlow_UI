import { Injectable, signal } from '@angular/core';

export interface SessionPreferences {
  defaultVoiceStarter: boolean;
  autoSubmitOnStop: boolean;
  listenVoiceBroadcast: boolean;
}

@Injectable({ providedIn: 'root' })
export class SessionPreferencesService {
  private readonly KEY = 'gwf_session_prefs';

  private readonly defaults: SessionPreferences = {
    defaultVoiceStarter: true,
    autoSubmitOnStop: false,
    listenVoiceBroadcast: false
  };

  private _prefs = signal<SessionPreferences>(this.load());

  get prefs(): SessionPreferences {
    return this._prefs();
  }

  update(patch: Partial<SessionPreferences>): void {
    const next = { ...this._prefs(), ...patch };
    this._prefs.set(next);
    localStorage.setItem(this.KEY, JSON.stringify(next));
  }

  private load(): SessionPreferences {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? { ...this.defaults, ...JSON.parse(raw) } : { ...this.defaults };
    } catch {
      return { ...this.defaults };
    }
  }
}

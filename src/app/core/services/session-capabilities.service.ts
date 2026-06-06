import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';

/**
 * Single source of truth for what the live Session Room can actually do on the
 * current platform. UI (settings toggles, badges) and services must read this
 * instead of scattering their own `Capacitor.isNativePlatform()` checks — that
 * duplication let the "shown" state drift from the "works" state (e.g. the dead
 * "Hear Speaker's Voice" toggle on the APK).
 */
@Injectable({ providedIn: 'root' })
export class SessionCapabilitiesService {
  readonly isNative = Capacitor.isNativePlatform();

  /**
   * WebRTC peer voice broadcast (speaker → listeners).
   *
   * Disabled on native (Capacitor APK): the native Google SpeechRecognizer used
   * for pronunciation scoring needs exclusive microphone access, and Android
   * cannot reliably share one mic between it and the WebView's getUserMedia.
   * Scoring is the core feature, so peer audio is sacrificed on native.
   * Web browsers can run both, so broadcast is available there.
   */
  readonly canBroadcastVoice = !this.isNative;
}

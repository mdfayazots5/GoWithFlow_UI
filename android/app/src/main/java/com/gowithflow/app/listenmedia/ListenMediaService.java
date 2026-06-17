package com.gowithflow.app.listenmedia;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import androidx.media.app.NotificationCompat.MediaStyle;

import android.support.v4.media.MediaMetadataCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

/**
 * Listen Script — foreground media service.
 *
 * Owns the on-device TextToSpeech queue for a script, posts a MediaStyle notification, and drives a
 * MediaSessionCompat so playback controls appear on the LOCK SCREEN and in the NOTIFICATION PANEL and
 * keep running when the app is backgrounded / the screen is locked. The Angular UI is a remote control
 * + mirror: it sends the queue/commands and listens for {@code stateChanged} to highlight the active line.
 *
 * OUTPUT only — never opens the microphone (Voice constitution rule #1: no recognizer contention).
 */
public class ListenMediaService extends Service {

    public static final String ACTION_START = "com.gowithflow.app.listen.START";
    public static final String ACTION_TOGGLE = "com.gowithflow.app.listen.TOGGLE";
    public static final String ACTION_PLAY = "com.gowithflow.app.listen.PLAY";
    public static final String ACTION_PAUSE = "com.gowithflow.app.listen.PAUSE";
    public static final String ACTION_NEXT = "com.gowithflow.app.listen.NEXT";
    public static final String ACTION_PREV = "com.gowithflow.app.listen.PREV";
    public static final String ACTION_SEEK = "com.gowithflow.app.listen.SEEK";
    public static final String ACTION_SET_RATE = "com.gowithflow.app.listen.SET_RATE";
    public static final String ACTION_SET_REPEAT = "com.gowithflow.app.listen.SET_REPEAT";
    public static final String ACTION_STOP = "com.gowithflow.app.listen.STOP";

    public static final String EXTRA_QUEUE = "queue";       // JSON array of lines
    public static final String EXTRA_TITLE = "title";
    public static final String EXTRA_INDEX = "index";
    public static final String EXTRA_RATE = "rate";
    public static final String EXTRA_REPEAT = "repeat";

    private static final String CHANNEL_ID = "listen_media";
    private static final int NOTIF_ID = 4711;

    /** Lets the Capacitor plugin observe playback state and forward it to JS. */
    public interface StateCallback {
        void onState(int index, boolean isPlaying, float rate, String repeat, boolean finished);
    }

    private static StateCallback callback;
    public static void setCallback(@Nullable StateCallback cb) { callback = cb; }

    private final Handler main = new Handler(Looper.getMainLooper());

    private TextToSpeech tts;
    private boolean ttsReady = false;
    private boolean pendingPlay = false;

    private MediaSessionCompat session;

    private final List<Line> lines = new ArrayList<>();
    private String title = "";
    private int index = 0;
    private boolean isPlaying = false;
    private float rate = 1f;
    private String repeat = "off";

    /** Generation token: bumped on every stop/seek so a stale TTS onDone is ignored. */
    private int gen = 0;

    private static class Line {
        String text = "";
        String speaker = "";
        String gender = "Female";
        float pitch = 1f;
    }

    // ── Lifecycle ─────────────────────────────────────────────────────

    @Override
    public void onCreate() {
        super.onCreate();
        createChannel();
        setupSession();
        tts = new TextToSpeech(getApplicationContext(), status -> {
            ttsReady = status == TextToSpeech.SUCCESS;
            if (ttsReady) {
                tts.setOnUtteranceProgressListener(progressListener);
                if (pendingPlay) {
                    pendingPlay = false;
                    main.post(this::speakCurrent);
                }
            }
        });
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null || intent.getAction() == null) return START_NOT_STICKY;
        switch (intent.getAction()) {
            case ACTION_START:
                handleStart(intent);
                break;
            case ACTION_TOGGLE:
                if (isPlaying) pause(); else play();
                break;
            case ACTION_PLAY: play(); break;
            case ACTION_PAUSE: pause(); break;
            case ACTION_NEXT: seekTo(index + 1); break;
            case ACTION_PREV: seekTo(index - 1); break;
            case ACTION_SEEK: seekTo(intent.getIntExtra(EXTRA_INDEX, index)); break;
            case ACTION_SET_RATE: setRate((float) intent.getDoubleExtra(EXTRA_RATE, rate)); break;
            case ACTION_SET_REPEAT: setRepeat(intent.getStringExtra(EXTRA_REPEAT)); break;
            case ACTION_STOP: stopPlayback(); break;
            default: break;
        }
        return START_NOT_STICKY;
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) { return null; }

    @Override
    public void onDestroy() {
        gen++;
        if (tts != null) { tts.stop(); tts.shutdown(); tts = null; }
        if (session != null) { session.release(); session = null; }
        super.onDestroy();
    }

    // ── Command handling ──────────────────────────────────────────────

    private void handleStart(Intent intent) {
        parseQueue(intent.getStringExtra(EXTRA_QUEUE));
        title = orEmpty(intent.getStringExtra(EXTRA_TITLE));
        index = clamp(intent.getIntExtra(EXTRA_INDEX, 0));
        rate = (float) intent.getDoubleExtra(EXTRA_RATE, 1.0);
        repeat = normalizeRepeat(intent.getStringExtra(EXTRA_REPEAT));
        isPlaying = true;
        startForegroundWithNotification();
        if (ttsReady) speakCurrent(); else pendingPlay = true;
    }

    private void play() {
        if (lines.isEmpty()) return;
        if (!isPlaying) {
            isPlaying = true;
            if (ttsReady) speakCurrent(); else pendingPlay = true;
        }
        pushState(false);
    }

    private void pause() {
        isPlaying = false;
        gen++;
        if (tts != null) tts.stop();
        pushState(false);
    }

    private void seekTo(int target) {
        if (lines.isEmpty()) return;
        gen++;
        if (tts != null) tts.stop();
        index = clamp(target);
        if (isPlaying) speakCurrent(); else pushState(false);
    }

    private void setRate(float r) {
        rate = r;
        if (isPlaying) { gen++; if (tts != null) tts.stop(); speakCurrent(); }
        else pushState(false);
    }

    private void setRepeat(String mode) {
        repeat = normalizeRepeat(mode);
        pushState(false);
    }

    private void stopPlayback() {
        isPlaying = false;
        gen++;
        if (tts != null) tts.stop();
        pushState(true);
        stopForeground(true);
        stopSelf();
    }

    // ── TTS narration ─────────────────────────────────────────────────

    private void speakCurrent() {
        if (!ttsReady || tts == null || lines.isEmpty() || !isPlaying) { pushState(false); return; }
        index = clamp(index);
        Line line = lines.get(index);
        applyVoice(line);
        tts.setSpeechRate(rate);
        tts.setPitch(line.pitch);
        final int g = ++gen;
        Bundle params = new Bundle();
        tts.speak(line.text, TextToSpeech.QUEUE_FLUSH, params, String.valueOf(g));
        pushState(false);
    }

    private final UtteranceProgressListener progressListener = new UtteranceProgressListener() {
        @Override public void onStart(String utteranceId) { }

        @Override
        public void onDone(String utteranceId) {
            main.post(() -> {
                if (!isPlaying) return;
                if (!String.valueOf(gen).equals(utteranceId)) return; // stale (stopped/seeked)
                if ("one".equals(repeat)) { speakCurrent(); return; }
                int next = index + 1;
                if (next >= lines.size()) {
                    if ("all".equals(repeat)) { index = 0; speakCurrent(); }
                    else { isPlaying = false; index = lines.size() - 1; pushState(true); }
                } else {
                    index = next;
                    speakCurrent();
                }
            });
        }

        @Override public void onError(String utteranceId) {
            // Never wedge: skip the failed line forward so playback keeps moving.
            main.post(() -> {
                if (!isPlaying || !String.valueOf(gen).equals(utteranceId)) return;
                int next = index + 1;
                if (next >= lines.size()) { isPlaying = false; pushState(true); }
                else { index = next; speakCurrent(); }
            });
        }
    };

    /** Best-effort gender voice match (same rule as the JS TtsService: "female" contains "male"). */
    private void applyVoice(Line line) {
        try {
            if (tts.getVoices() == null) return;
            boolean wantFemale = !"Male".equalsIgnoreCase(line.gender);
            for (Voice v : tts.getVoices()) {
                String n = v.getName() == null ? "" : v.getName().toLowerCase();
                boolean isFemale = n.contains("female");
                boolean match = wantFemale ? isFemale : (n.contains("male") && !isFemale);
                if (match) { tts.setVoice(v); return; }
            }
        } catch (Exception ignored) { /* device voice set varies — fall back to default */ }
    }

    // ── MediaSession + notification ───────────────────────────────────

    private void setupSession() {
        session = new MediaSessionCompat(this, "GwfListenMedia");
        session.setCallback(new MediaSessionCompat.Callback() {
            @Override public void onPlay() { play(); }
            @Override public void onPause() { pause(); }
            @Override public void onSkipToNext() { seekTo(index + 1); }
            @Override public void onSkipToPrevious() { seekTo(index - 1); }
            @Override public void onStop() { stopPlayback(); }
        });
        session.setActive(true);
    }

    private void startForegroundWithNotification() {
        Notification n = buildNotification();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIF_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(NOTIF_ID, n);
        }
    }

    private void pushState(boolean finished) {
        updateSessionState();
        Notification n = buildNotification();
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) nm.notify(NOTIF_ID, n);
        // When paused, let the notification be dismissible.
        if (!isPlaying) stopForeground(false);
        else startForegroundWithNotification();
        if (callback != null) callback.onState(index, isPlaying, rate, repeat, finished);
    }

    private void updateSessionState() {
        long actions = PlaybackStateCompat.ACTION_PLAY | PlaybackStateCompat.ACTION_PAUSE
                | PlaybackStateCompat.ACTION_PLAY_PAUSE | PlaybackStateCompat.ACTION_SKIP_TO_NEXT
                | PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS | PlaybackStateCompat.ACTION_STOP;
        PlaybackStateCompat state = new PlaybackStateCompat.Builder()
                .setActions(actions)
                .setState(isPlaying ? PlaybackStateCompat.STATE_PLAYING : PlaybackStateCompat.STATE_PAUSED,
                        index, isPlaying ? rate : 0f)
                .build();
        session.setPlaybackState(state);

        Line current = lines.isEmpty() ? null : lines.get(clamp(index));
        MediaMetadataCompat.Builder meta = new MediaMetadataCompat.Builder()
                .putString(MediaMetadataCompat.METADATA_KEY_TITLE, current != null ? current.text : title)
                .putString(MediaMetadataCompat.METADATA_KEY_ARTIST,
                        current != null ? current.speaker + " · " + title : title)
                .putLong(MediaMetadataCompat.METADATA_KEY_NUM_TRACKS, lines.size())
                .putLong(MediaMetadataCompat.METADATA_KEY_TRACK_NUMBER, index + 1L);
        Bitmap art = getArtwork();
        if (art != null) {
            meta.putBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART, art);
            meta.putBitmap(MediaMetadataCompat.METADATA_KEY_DISPLAY_ICON, art);
        }
        session.setMetadata(meta.build());
    }

    /** App-launcher icon rendered to a Bitmap (cached) for lock-screen / notification artwork.
     *  Handles adaptive/vector launcher icons by drawing the Drawable to a Bitmap. */
    private Bitmap artwork;
    private Bitmap getArtwork() {
        if (artwork != null) return artwork;
        try {
            int iconRes = getApplicationInfo().icon;
            Drawable d = androidx.core.content.ContextCompat.getDrawable(this, iconRes);
            if (d instanceof BitmapDrawable) {
                artwork = ((BitmapDrawable) d).getBitmap();
            } else if (d != null) {
                int w = d.getIntrinsicWidth() > 0 ? d.getIntrinsicWidth() : 512;
                int h = d.getIntrinsicHeight() > 0 ? d.getIntrinsicHeight() : 512;
                Bitmap bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
                Canvas canvas = new Canvas(bmp);
                d.setBounds(0, 0, canvas.getWidth(), canvas.getHeight());
                d.draw(canvas);
                artwork = bmp;
            }
        } catch (Exception ignored) { /* no artwork — notification still shows, just without an image */ }
        return artwork;
    }

    private Notification buildNotification() {
        Line current = lines.isEmpty() ? null : lines.get(clamp(index));
        int smallIcon = getApplicationInfo().icon;

        NotificationCompat.Builder b = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(smallIcon)
                .setLargeIcon(getArtwork())
                .setContentTitle(current != null ? current.speaker : "Listen Script")
                .setContentText(current != null ? current.text : title)
                .setContentIntent(contentIntent())
                .setDeleteIntent(servicePending(ACTION_STOP, 10))
                .setOnlyAlertOnce(true)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setPriority(NotificationCompat.PRIORITY_LOW);

        b.addAction(android.R.drawable.ic_media_previous, "Previous", servicePending(ACTION_PREV, 1));
        if (isPlaying) {
            b.addAction(android.R.drawable.ic_media_pause, "Pause", servicePending(ACTION_TOGGLE, 2));
        } else {
            b.addAction(android.R.drawable.ic_media_play, "Play", servicePending(ACTION_TOGGLE, 2));
        }
        b.addAction(android.R.drawable.ic_media_next, "Next", servicePending(ACTION_NEXT, 3));

        b.setStyle(new MediaStyle()
                .setMediaSession(session.getSessionToken())
                .setShowActionsInCompactView(0, 1, 2)
                .setShowCancelButton(true)
                .setCancelButtonIntent(servicePending(ACTION_STOP, 10)));

        return b.build();
    }

    private PendingIntent contentIntent() {
        Intent launch = getPackageManager().getLaunchIntentForPackage(getPackageName());
        if (launch == null) launch = new Intent();
        launch.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        return PendingIntent.getActivity(this, 0, launch, pendingFlags());
    }

    private PendingIntent servicePending(String action, int rc) {
        Intent i = new Intent(this, ListenMediaService.class).setAction(action);
        return PendingIntent.getService(this, rc, i, pendingFlags());
    }

    private int pendingFlags() {
        return PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(
                    CHANNEL_ID, "Listen Script", NotificationManager.IMPORTANCE_LOW);
            ch.setDescription("Script audio playback controls");
            ch.setShowBadge(false);
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) nm.createNotificationChannel(ch);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private void parseQueue(String json) {
        lines.clear();
        if (json == null) return;
        try {
            JSONArray arr = new JSONArray(json);
            for (int i = 0; i < arr.length(); i++) {
                JSONObject o = arr.getJSONObject(i);
                Line l = new Line();
                l.text = o.optString("text", "");
                l.speaker = o.optString("speakerLabel", "");
                l.gender = o.optString("gender", "Female");
                l.pitch = (float) o.optDouble("pitch", 1.0);
                lines.add(l);
            }
        } catch (Exception ignored) { /* malformed queue → empty, JS will surface empty state */ }
    }

    private int clamp(int i) {
        if (lines.isEmpty()) return 0;
        return Math.max(0, Math.min(lines.size() - 1, i));
    }

    private static String orEmpty(String s) { return s == null ? "" : s; }

    private static String normalizeRepeat(String m) {
        if ("one".equals(m) || "all".equals(m)) return m;
        return "off";
    }
}

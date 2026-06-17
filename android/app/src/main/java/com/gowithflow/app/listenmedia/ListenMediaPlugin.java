package com.gowithflow.app.listenmedia;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

/**
 * Listen Script — JS bridge to {@link ListenMediaService}.
 *
 * The Angular ScriptPlaybackService calls {@code start} with the full line queue, then issues
 * transport commands; this plugin relays them to the foreground service. The service calls back via
 * {@link ListenMediaService#setCallback} and we forward {@code stateChanged} events to JS so the
 * lyrics UI mirrors lock-screen / notification control actions.
 */
@CapacitorPlugin(
        name = "ListenMedia",
        permissions = {
                @Permission(alias = "notifications", strings = { Manifest.permission.POST_NOTIFICATIONS })
        }
)
public class ListenMediaPlugin extends Plugin {

    @Override
    public void load() {
        ListenMediaService.setCallback((index, isPlaying, rate, repeat, finished) -> {
            JSObject data = new JSObject();
            data.put("index", index);
            data.put("isPlaying", isPlaying);
            data.put("rate", rate);
            data.put("repeat", repeat);
            data.put("finished", finished);
            notifyListeners("stateChanged", data);
        });
    }

    @PluginMethod
    public void start(PluginCall call) {
        JSArray lines = call.getArray("lines", new JSArray());
        Intent i = new Intent(getContext(), ListenMediaService.class)
                .setAction(ListenMediaService.ACTION_START)
                .putExtra(ListenMediaService.EXTRA_QUEUE, lines != null ? lines.toString() : "[]")
                .putExtra(ListenMediaService.EXTRA_TITLE, call.getString("title", ""))
                .putExtra(ListenMediaService.EXTRA_INDEX, call.getInt("startIndex", 0))
                .putExtra(ListenMediaService.EXTRA_RATE, call.getDouble("rate", 1.0))
                .putExtra(ListenMediaService.EXTRA_REPEAT, call.getString("repeat", "off"));
        ContextCompat.startForegroundService(getContext(), i);
        call.resolve();
    }

    @PluginMethod public void play(PluginCall call) { send(ListenMediaService.ACTION_PLAY); call.resolve(); }
    @PluginMethod public void pause(PluginCall call) { send(ListenMediaService.ACTION_PAUSE); call.resolve(); }
    @PluginMethod public void next(PluginCall call) { send(ListenMediaService.ACTION_NEXT); call.resolve(); }
    @PluginMethod public void prev(PluginCall call) { send(ListenMediaService.ACTION_PREV); call.resolve(); }

    @PluginMethod
    public void seekTo(PluginCall call) {
        Intent i = base(ListenMediaService.ACTION_SEEK)
                .putExtra(ListenMediaService.EXTRA_INDEX, call.getInt("index", 0));
        getContext().startService(i);
        call.resolve();
    }

    @PluginMethod
    public void setRate(PluginCall call) {
        Intent i = base(ListenMediaService.ACTION_SET_RATE)
                .putExtra(ListenMediaService.EXTRA_RATE, call.getDouble("rate", 1.0));
        getContext().startService(i);
        call.resolve();
    }

    @PluginMethod
    public void setRepeat(PluginCall call) {
        Intent i = base(ListenMediaService.ACTION_SET_REPEAT)
                .putExtra(ListenMediaService.EXTRA_REPEAT, call.getString("mode", "off"));
        getContext().startService(i);
        call.resolve();
    }

    @PluginMethod public void stop(PluginCall call) { send(ListenMediaService.ACTION_STOP); call.resolve(); }

    /** Requests POST_NOTIFICATIONS on Android 13+ (no-op below). Notification controls need it. */
    @PluginMethod
    public void ensureNotificationPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) { resolveGranted(call, true); return; }
        boolean granted = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS)
                == PackageManager.PERMISSION_GRANTED;
        if (granted) { resolveGranted(call, true); return; }
        requestPermissionForAlias("notifications", call, "permsCallback");
    }

    @PermissionCallback
    private void permsCallback(PluginCall call) {
        boolean granted = Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU
                || ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS)
                    == PackageManager.PERMISSION_GRANTED;
        resolveGranted(call, granted);
    }

    private void resolveGranted(PluginCall call, boolean granted) {
        JSObject r = new JSObject();
        r.put("granted", granted);
        call.resolve(r);
    }

    private Intent base(String action) {
        return new Intent(getContext(), ListenMediaService.class).setAction(action);
    }

    private void send(String action) {
        getContext().startService(base(action));
    }
}

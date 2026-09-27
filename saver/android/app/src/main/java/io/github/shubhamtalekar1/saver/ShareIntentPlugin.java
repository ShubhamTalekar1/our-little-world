package io.github.shubhamtalekar1.saver;

import android.content.Intent;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Receives links and text shared to Saver from other apps.
 *
 * Two cases: the app was closed (the share is the launch intent, held until
 * the web app asks for it with getPending) or already running (delivered as
 * a "share" event via onNewIntent).
 */
@CapacitorPlugin(name = "ShareIntent")
public class ShareIntentPlugin extends Plugin {

    private JSObject pending;

    @Override
    public void load() {
        pending = read(getActivity().getIntent());
    }

    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);
        JSObject share = read(intent);
        if (share != null) notifyListeners("share", share, true);
    }

    @PluginMethod
    public void getPending(PluginCall call) {
        JSObject result = pending != null ? pending : new JSObject();
        pending = null;
        call.resolve(result);
    }

    private JSObject read(Intent intent) {
        if (intent == null || !Intent.ACTION_SEND.equals(intent.getAction())) return null;
        String type = intent.getType();
        if (type == null || !type.startsWith("text/")) return null;
        CharSequence text = intent.getCharSequenceExtra(Intent.EXTRA_TEXT);
        String subject = intent.getStringExtra(Intent.EXTRA_SUBJECT);
        if (text == null && subject == null) return null;
        // Consume it so rotating the phone or reopening from recents doesn't save it twice.
        intent.setAction(Intent.ACTION_MAIN);
        JSObject share = new JSObject();
        share.put("text", text != null ? text.toString() : "");
        share.put("title", subject != null ? subject : "");
        return share;
    }
}

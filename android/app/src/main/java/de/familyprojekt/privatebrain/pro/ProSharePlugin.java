package de.familyprojekt.privatebrain.pro;

import android.content.ClipData;
import android.content.ContentResolver;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;
import android.util.Base64;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Receives files from Android's share sheet (ACTION_SEND / ACTION_SEND_MULTIPLE).
 * Only content:// addresses granted by the sending app are read; the app's own provider and
 * file:// paths are refused. Shared text without a file becomes a small text note.
 */
@CapacitorPlugin(name = "ProShare")
public class ProSharePlugin extends Plugin {
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private ShareInbox inbox;
    private volatile int refused;

    @Override public void load() {
        inbox = new ShareInbox(new File(getContext().getCacheDir(), "shared-in"));
        inbox.clear();
        Intent first = getActivity() == null ? null : getActivity().getIntent();
        if (first != null) take(first);
    }

    @Override protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);
        take(intent);
    }

    private void take(Intent intent) {
        String action = intent.getAction();
        if (!Intent.ACTION_SEND.equals(action) && !Intent.ACTION_SEND_MULTIPLE.equals(action)) return;
        List<Uri> uris = new ArrayList<>();
        ClipData clip = intent.getClipData();
        if (clip != null) for (int i = 0; i < clip.getItemCount(); i++) if (clip.getItemAt(i).getUri() != null) uris.add(clip.getItemAt(i).getUri());
        if (uris.isEmpty()) {
            try {
                if (Intent.ACTION_SEND.equals(action)) { Uri one = intent.getParcelableExtra(Intent.EXTRA_STREAM); if (one != null) uris.add(one); }
                else { ArrayList<Uri> many = intent.getParcelableArrayListExtra(Intent.EXTRA_STREAM); if (many != null) uris.addAll(many); }
            } catch (Exception ignored) { /* a malformed extra is treated as no file */ }
        }
        String text = intent.getStringExtra(Intent.EXTRA_TEXT), subject = intent.getStringExtra(Intent.EXTRA_SUBJECT);
        String type = intent.getType();
        // Consume the intent so a later restart does not import the same share again.
        intent.setAction(Intent.ACTION_MAIN);
        worker.execute(() -> {
            int before = inbox.count();
            ContentResolver resolver = getContext().getContentResolver();
            for (Uri uri : uris) {
                if (!allowed(uri)) { refused++; continue; }
                try (InputStream in = resolver.openInputStream(uri)) {
                    if (in == null) { refused++; continue; }
                    inbox.add(in, displayName(resolver, uri), resolver.getType(uri) != null ? resolver.getType(uri) : type);
                } catch (Exception error) { refused++; }
            }
            if (uris.isEmpty() && text != null && !text.trim().isEmpty() && text.length() <= 200_000) {
                String name = ShareInbox.safeName(subject == null || subject.trim().isEmpty() ? "Geteilter Text" : subject.trim(), "Geteilter Text");
                if (!name.toLowerCase(java.util.Locale.ROOT).endsWith(".txt")) name += ".txt";
                try { inbox.add(new java.io.ByteArrayInputStream(text.getBytes(StandardCharsets.UTF_8)), name, "text/plain"); }
                catch (Exception error) { refused++; }
            }
            JSObject event = new JSObject().put("added", inbox.count() - before).put("refused", refused);
            notifyListeners("shared", event, true);
        });
    }

    private boolean allowed(Uri uri) {
        if (uri == null || !ContentResolver.SCHEME_CONTENT.equals(uri.getScheme())) return false;
        String authority = uri.getAuthority();
        return authority != null && !authority.startsWith(getContext().getPackageName());
    }

    private static String displayName(ContentResolver resolver, Uri uri) {
        try (Cursor cursor = resolver.query(uri, new String[]{OpenableColumns.DISPLAY_NAME}, null, null, null)) {
            if (cursor != null && cursor.moveToFirst() && !cursor.isNull(0)) return cursor.getString(0);
        } catch (Exception ignored) { /* fall back to the last path part */ }
        return uri.getLastPathSegment();
    }

    @PluginMethod public void pending(PluginCall call) {
        worker.execute(() -> {   // after any copy still running
            JSArray list = new JSArray();
            for (ShareInbox.Item item : inbox.list())
                list.put(new JSObject().put("id", item.id).put("name", item.name).put("mime", item.mime).put("size", item.size));
            int gone = refused; refused = 0;
            call.resolve(new JSObject().put("items", list).put("refused", gone));
        });
    }

    @PluginMethod public void read(PluginCall call) {
        String id = call.getString("id", "");
        long offset = call.getData().optLong("offset", -1);
        worker.execute(() -> {
            try { call.resolve(new JSObject().put("data", Base64.encodeToString(inbox.read(id, offset), Base64.NO_WRAP))); }
            catch (Exception error) { call.reject("Shared file unavailable", "SHARE_UNAVAILABLE"); }
        });
    }

    @PluginMethod public void done(PluginCall call) {
        String id = call.getString("id", "");
        worker.execute(() -> { inbox.remove(id); call.resolve(); });
    }
}

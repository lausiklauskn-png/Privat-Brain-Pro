package de.familyprojekt.privatebrain.pro;

import android.content.ClipData;
import android.content.Intent;
import android.util.Base64;
import android.webkit.MimeTypeMap;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Explicitly open a selected local file in another Android app. No arbitrary path access. */
@CapacitorPlugin(name = "ProFiles")
public class ProFilesPlugin extends Plugin {
    private final ExecutorService worker = Executors.newSingleThreadExecutor();

    @PluginMethod public void open(PluginCall call) {
        String encoded = call.getString("data");
        String name = call.getString("name", "file");
        if (encoded == null || encoded.length() > 22369624 || name.length() > 1024) {
            call.reject("File unavailable", "FILE_UNAVAILABLE"); return;
        }
        worker.execute(() -> {
            try {
                byte[] bytes = Base64.decode(encoded, Base64.NO_WRAP);
                if (bytes.length > 16 * 1024 * 1024) throw new IllegalArgumentException();
                File directory = new File(getContext().getCacheDir(), "exports/files");
                if (!directory.isDirectory() && !directory.mkdirs()) throw new IllegalStateException();
                long used = 0;
                File[] existing = directory.listFiles();
                if (existing != null) for (File file : existing) {
                    if (!file.isFile()) continue;
                    if (System.currentTimeMillis() - file.lastModified() > 24L * 60 * 60 * 1000) file.delete();
                    if (file.exists()) used += file.length();
                }
                if (used + bytes.length > 64L * 1024 * 1024) throw new IllegalStateException();
                String safeName = MailMime.filename(name);
                File file = new File(directory, UUID.randomUUID() + "-" + safeName);
                try (FileOutputStream stream = new FileOutputStream(file)) { stream.write(bytes); }
                var uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", file);
                String extension = safeName.contains(".") ? safeName.substring(safeName.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT) : "";
                String type = MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension);
                Intent intent = new Intent(Intent.ACTION_VIEW).setDataAndType(uri, type == null ? "application/octet-stream" : type)
                    .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                intent.setClipData(ClipData.newRawUri("", uri));
                getActivity().runOnUiThread(() -> {
                    try {
                        getActivity().startActivity(Intent.createChooser(intent, safeName));
                        call.resolve(new JSObject().put("ok", true));
                    } catch (Exception error) { call.reject("File unavailable", "FILE_UNAVAILABLE"); }
                });
            } catch (Exception error) { call.reject("File unavailable", "FILE_UNAVAILABLE"); }
        });
    }

    @Override protected void handleOnDestroy() { worker.shutdown(); }
}

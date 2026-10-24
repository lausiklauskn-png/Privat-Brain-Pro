package de.familyprojekt.privatebrain.pro;

import android.content.ClipData;
import android.content.Intent;
import android.app.Activity;
import android.net.Uri;
import android.util.Base64;
import android.webkit.MimeTypeMap;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.ActivityCallback;
import androidx.activity.result.ActivityResult;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.concurrent.atomic.AtomicBoolean;
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
    // A slow PDF render must not queue a deliberate Open/Share action behind it.
    // The selected original is still verified on this background lane before any URI is granted.
    private final ExecutorService handoffs = Executors.newSingleThreadExecutor();
    private final AtomicBoolean handingOff = new AtomicBoolean();
    private final Object exportLock = new Object();
    private volatile boolean destroyed;
    private final AtomicBoolean exportingRecovery = new AtomicBoolean();
    private byte[] recoveryBytes;

    /** No cache file, arbitrary path, network request or persistent URI grant. */
    @PluginMethod public void saveRecoveryKeys(PluginCall call) {
        if (!exportingRecovery.compareAndSet(false, true)) { call.reject("Export busy", "RECOVERY_BUSY"); return; }
        try {
            org.json.JSONArray shares = call.getArray("shares");
            String name = call.getString("name", "PRIVATE-BRAIN-RECOVERY-KEYS.txt");
            String heading = call.getString("heading", "Private Brain: recovery keys (3 of 5 required).");
            if (shares == null || shares.length() != 5 || !name.matches("[A-Za-z0-9_-]{1,80}\\.txt") || heading.length() > 1024) throw new IllegalArgumentException();
            StringBuilder content = new StringBuilder(heading).append("\n\n");
            for (int n = 0; n < 5; n++) {
                String share = shares.getString(n);
                if (share.length() > 8192 || !share.matches("JT3v5-" + (n + 1) + "-[A-Za-z0-9_-]+")) throw new IllegalArgumentException();
                content.append(share).append('\n');
            }
            recoveryBytes = content.toString().getBytes(StandardCharsets.UTF_8);
            // Do not retain the transport JSON while the Android picker is open.
            call.getData().remove("shares");
            Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT).setType("text/plain")
                .addCategory(Intent.CATEGORY_OPENABLE).putExtra(Intent.EXTRA_TITLE, name)
                .putExtra(Intent.EXTRA_LOCAL_ONLY, true);
            startActivityForResult(call, intent, "recoverySaved");
        } catch (Exception error) {
            clearRecovery(); call.reject("Recovery export unavailable", "RECOVERY_EXPORT_FAILED");
        }
    }

    @ActivityCallback private void recoverySaved(PluginCall call, ActivityResult result) {
        if (call == null) { clearRecovery(); return; }
        Intent data = result.getData();
        if (result.getResultCode() != Activity.RESULT_OK || data == null || data.getData() == null) {
            clearRecovery(); call.resolve(new JSObject().put("cancelled", true).put("saved", false)); return;
        }
        Uri destination = data.getData();
        worker.execute(() -> {
            try {
                if (!"content".equals(destination.getScheme()) || recoveryBytes == null) throw new SecurityException();
                try (OutputStream output = getContext().getContentResolver().openOutputStream(destination, "w")) {
                    if (output == null) throw new IllegalStateException();
                    output.write(recoveryBytes); output.flush();
                }
                clearRecovery(); call.resolve(new JSObject().put("saved", true));
            } catch (Exception error) {
                clearRecovery(); call.reject("Recovery export unavailable", "RECOVERY_EXPORT_FAILED");
            }
        });
    }

    private void clearRecovery() {
        if (recoveryBytes != null) Arrays.fill(recoveryBytes, (byte) 0);
        recoveryBytes = null; exportingRecovery.set(false);
    }
    private OriginalFileStore originals;
    @Override public void load() { originals = new OriginalFileStore(getContext()); }
    private interface Work { org.json.JSONObject run() throws Exception; }
    private void original(PluginCall call, Work work) {
        worker.execute(() -> {
            try { call.resolve(JSObject.fromJSONObject(work.run())); }
            catch (Exception error) { call.reject("Original unavailable", "ORIGINAL_UNAVAILABLE"); }
        });
    }
    @PluginMethod public void listOriginals(PluginCall call) { original(call, () -> new org.json.JSONObject().put("items", originals.list())); }
    @PluginMethod public void originalInfo(PluginCall call) { original(call, () -> {
        org.json.JSONObject info = originals.info(call.getString("hash"));
        // New device: an original missing here is brought back from the chosen folder, verified by fingerprint.
        if (info == null) try { if (Vault.get(getContext()).restoreOriginal(call.getString("hash"), originals)) info = originals.info(call.getString("hash")); }
            catch (Exception ignored) { /* Not in the folder or folder locked: the page offers reselecting the file. */ }
        return info == null ? new org.json.JSONObject().put("missing", true) : info;
    }); }
    @PluginMethod public void beginImport(PluginCall call) { original(call, () -> originals.begin(call.getString("hash"), call.getData().optLong("size", -1), call.getString("name"), call.getString("type", ""))); }
    @PluginMethod public void appendImport(PluginCall call) { original(call, () -> {
        String data = call.getString("data");
        if (data == null || data.length() > 349528) throw new IllegalArgumentException();
        originals.append(call.getString("ticket"), call.getData().optLong("offset", -1), Base64.decode(data, Base64.NO_WRAP));
        return new org.json.JSONObject().put("ok", true);
    }); }
    @PluginMethod public void finishImport(PluginCall call) { original(call, () -> {
        String hash = originals.finish(call.getString("ticket"));
        Vault vault = Vault.get(getContext());
        boolean copied = false;
        // Folder mode: every new original also goes encrypted into the chosen folder.
        if (vault.configured() && vault.unlocked()) {
            try { vault.copyOriginal(hash, originals.file(hash), originals.info(hash)); copied = true; }
            catch (Exception error) { return new org.json.JSONObject().put("ok", true).put("vault", false); }
        }
        return new org.json.JSONObject().put("ok", true).put("vault", copied);
    }); }
    @PluginMethod public void abortImport(PluginCall call) { original(call, () -> { originals.abort(call.getString("ticket")); return new org.json.JSONObject().put("ok", true); }); }
    @PluginMethod public void readOriginal(PluginCall call) { original(call, () -> new org.json.JSONObject().put("data", Base64.encodeToString(originals.read(call.getString("hash"), call.getData().optLong("offset", -1)), Base64.NO_WRAP))); }

    private final PdfPreviewStore pdf = new PdfPreviewStore();
    private static final class Selected { File file;String name;Selected(File file,String name){this.file=file;this.name=name;} }
    private Selected selected(PluginCall call) throws Exception {
        String hash=call.getString("hash");
        if(hash!=null){
            org.json.JSONObject metadata=originals.info(hash);if(metadata==null)throw new IllegalStateException();
            File file=originals.file(hash);if(!hash.equals(OriginalFileStore.digest(file)))throw new IllegalStateException();
            return new Selected(file,MailMime.filename(metadata.getString("name")));
        }
        synchronized(exportLock){return exported(call);}
    }
    private Selected exported(PluginCall call) throws Exception {
        String encoded=call.getString("data"),name=call.getString("name","file");
        if(encoded==null||encoded.length()>22369624||name.length()>1024)throw new IllegalArgumentException();
        byte[] bytes=Base64.decode(encoded,Base64.NO_WRAP);if(bytes.length>16*1024*1024)throw new IllegalArgumentException();
        File directory=new File(getContext().getCacheDir(),"exports/files");
        if(!directory.isDirectory()&&!directory.mkdirs())throw new IllegalStateException();
        long used=0;File[] existing=directory.listFiles();
        if(existing!=null)for(File file:existing){
            if(!file.isFile())continue;
            if(System.currentTimeMillis()-file.lastModified()>24L*60*60*1000)file.delete();
            if(file.exists())used+=file.length();
        }
        if(used+bytes.length>64L*1024*1024)throw new IllegalStateException();
        String safe=MailMime.filename(name);File file=new File(directory,UUID.randomUUID()+"-"+safe);
        try(FileOutputStream output=new FileOutputStream(file)){output.write(bytes);}
        return new Selected(file,safe);
    }
    @PluginMethod public void open(PluginCall call){external(call,false);}
    @PluginMethod public void share(PluginCall call){external(call,true);}
    private void external(PluginCall call,boolean share){
        if (destroyed) { call.reject("File unavailable","FILE_UNAVAILABLE"); return; }
        if (!handingOff.compareAndSet(false,true)) { call.reject("File action busy","FILE_BUSY"); return; }
        try{handoffs.execute(()->{
            try{
                Selected chosen=selected(call);Intent intent=fileIntent(getContext(),chosen.file,chosen.name,share);
                if(destroyed)throw new IllegalStateException();
                getActivity().runOnUiThread(()->{
                    try{
                        if(destroyed||getActivity().isFinishing()||getActivity().isDestroyed())throw new IllegalStateException();
                        getActivity().startActivity(Intent.createChooser(intent,chosen.name));call.resolve(new JSObject().put("ok",true));
                    }
                    catch(Exception error){call.reject("File unavailable","FILE_UNAVAILABLE");}
                    finally{handingOff.set(false);}
                });
            }catch(Exception error){handingOff.set(false);call.reject("File unavailable","FILE_UNAVAILABLE");}
        });}catch(java.util.concurrent.RejectedExecutionException error){handingOff.set(false);call.reject("File unavailable","FILE_UNAVAILABLE");}
    }
    static Intent fileIntent(android.content.Context context,File file,String name,boolean share)throws Exception{
        String safe=MailMime.filename(name);
        var uri=FileProvider.getUriForFile(context,context.getPackageName()+".fileprovider",file,safe);
        String extension=safe.contains(".")?safe.substring(safe.lastIndexOf('.')+1).toLowerCase(Locale.ROOT):"";
        String type=MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension);if(type==null)type="application/octet-stream";
        Intent intent=new Intent(share?Intent.ACTION_SEND:Intent.ACTION_VIEW);
        if(share)intent.setType(type).putExtra(Intent.EXTRA_STREAM,uri).putExtra(Intent.EXTRA_TITLE,safe);
        else intent.setDataAndType(uri,type);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION).setClipData(ClipData.newRawUri("",uri));return intent;
    }
    @PluginMethod public void openPdf(PluginCall call){worker.execute(()->{
        final Selected chosen;
        try{chosen=selected(call);}
        catch(Exception error){call.reject("Original unavailable","ORIGINAL_UNAVAILABLE");return;}
        try{call.resolve(JSObject.fromJSONObject(pdf.open(chosen.file)));}
        catch(Exception error){call.reject("PDF preview unavailable","PDF_PREVIEW_UNAVAILABLE");}
    });}
    @PluginMethod public void pdfPage(PluginCall call){original(call,()->pdf.page(call.getString("id"),call.getInt("page",-1),call.getInt("width",1200)));}
    @PluginMethod public void closePdf(PluginCall call){original(call,()->{pdf.close(call.getString("id"));return new org.json.JSONObject().put("ok",true);});}
    @Override protected void handleOnDestroy(){destroyed=true;handoffs.shutdown();worker.execute(()->{clearRecovery();pdf.close();});worker.shutdown();}
}

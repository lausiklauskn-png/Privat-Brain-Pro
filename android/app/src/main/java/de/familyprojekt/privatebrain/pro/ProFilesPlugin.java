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
        return info == null ? new org.json.JSONObject().put("missing", true) : info;
    }); }
    @PluginMethod public void beginImport(PluginCall call) { original(call, () -> originals.begin(call.getString("hash"), call.getData().optLong("size", -1), call.getString("name"), call.getString("type", ""))); }
    @PluginMethod public void appendImport(PluginCall call) { original(call, () -> {
        String data = call.getString("data");
        if (data == null || data.length() > 349528) throw new IllegalArgumentException();
        originals.append(call.getString("ticket"), call.getData().optLong("offset", -1), Base64.decode(data, Base64.NO_WRAP));
        return new org.json.JSONObject().put("ok", true);
    }); }
    @PluginMethod public void finishImport(PluginCall call) { original(call, () -> { originals.finish(call.getString("ticket")); return new org.json.JSONObject().put("ok", true); }); }
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
        worker.execute(()->{
            try{
                Selected chosen=selected(call);Intent intent=fileIntent(getContext(),chosen.file,chosen.name,share);
                getActivity().runOnUiThread(()->{
                    try{getActivity().startActivity(Intent.createChooser(intent,chosen.name));call.resolve(new JSObject().put("ok",true));}
                    catch(Exception error){call.reject("File unavailable","FILE_UNAVAILABLE");}
                });
            }catch(Exception error){call.reject("File unavailable","FILE_UNAVAILABLE");}
        });
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
    @PluginMethod public void openPdf(PluginCall call){original(call,()->pdf.open(selected(call).file));}
    @PluginMethod public void pdfPage(PluginCall call){original(call,()->pdf.page(call.getString("id"),call.getInt("page",-1),call.getInt("width",1200)));}
    @PluginMethod public void closePdf(PluginCall call){original(call,()->{pdf.close(call.getString("id"));return new org.json.JSONObject().put("ok",true);});}
    @Override protected void handleOnDestroy(){worker.execute(()->pdf.close());worker.shutdown();}
}

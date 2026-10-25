package de.familyprojekt.privatebrain.pro;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.util.Base64;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.*;
import com.getcapacitor.annotation.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;

/** Reopen Android's folder chooser on every explicit click, independent of hint preferences. */
@CapacitorPlugin(name="ProFolders")
public class ProFoldersPlugin extends Plugin {
    private final ExecutorService worker=Executors.newSingleThreadExecutor();
    private final AtomicBoolean choosing=new AtomicBoolean();
    private FolderStore folders;
    @Override public void load(){folders=new FolderStore(getContext());}
    private interface Work{org.json.JSONObject run()throws Exception;}
    private void work(PluginCall call,Work task){worker.execute(()->{try{call.resolve(JSObject.fromJSONObject(task.run()));}catch(Exception error){call.reject("Folder operation unavailable","FOLDER_LIMIT".equals(error.getMessage())?"FOLDER_LIMIT":"FOLDER_UNAVAILABLE");}});}
    @PluginMethod public void state(PluginCall call){work(call,()->folders.state());}
    @PluginMethod public void pause(PluginCall call){work(call,()->folders.pause());}
    @PluginMethod public void resume(PluginCall call){work(call,()->folders.resume());}
    @PluginMethod public void chooseLibrary(PluginCall call){choose(call,true);}
    @PluginMethod public void chooseSource(PluginCall call){choose(call,false);}
    private void choose(PluginCall call,boolean library){
        if(!choosing.compareAndSet(false,true)){call.reject("Folder chooser busy","FOLDER_BUSY");return;}
        call.getData().put("library",library);
        Intent intent=new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION|Intent.FLAG_GRANT_PREFIX_URI_PERMISSION|(library?Intent.FLAG_GRANT_WRITE_URI_PERMISSION:0));
        try{startActivityForResult(call,intent,"folderChosen");}catch(Exception error){choosing.set(false);call.reject("Folder chooser unavailable","FOLDER_UNAVAILABLE");}
    }
    @ActivityCallback private void folderChosen(PluginCall call,ActivityResult result){
        choosing.set(false);if(call==null)return;
        Intent data=result.getData();
        if(result.getResultCode()!=Activity.RESULT_OK||data==null||data.getData()==null){call.resolve(new JSObject().put("cancelled",true));return;}
        Uri tree=data.getData();boolean library=call.getBoolean("library",false);
        work(call,()->{
            int required=Intent.FLAG_GRANT_READ_URI_PERMISSION|(library?Intent.FLAG_GRANT_WRITE_URI_PERMISSION:0);
            if(!"content".equals(tree.getScheme())||(data.getFlags()&required)!=required)throw new SecurityException();
            // Library must stay usable after restart. Source import only needs the current grant.
            if(library)getContext().getContentResolver().takePersistableUriPermission(tree,required);
            return library?folders.library(tree):folders.source(tree);
        });
    }
    @PluginMethod public void readSource(PluginCall call){work(call,()->new org.json.JSONObject().put("data",Base64.encodeToString(folders.read(call.getString("id"),call.getData().optLong("offset",-1)),Base64.NO_WRAP)));}
    @PluginMethod public void finishSource(PluginCall call){work(call,()->{folders.finishSource();return new org.json.JSONObject().put("ok",true);});}
    @PluginMethod public void copyOriginal(PluginCall call){work(call,()->folders.copy(call.getString("hash"),call.getString("name","file")));}
    @Override protected void handleOnDestroy(){worker.shutdown();}
}

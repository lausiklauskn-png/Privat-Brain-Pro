package de.familyprojekt.privatebrain.pro;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import org.json.JSONArray;
import org.json.JSONObject;

/** Explicit, current-folder SAF cleanup; catalog paths never grant filesystem access. */
@CapacitorPlugin(name="ProDuplicates")
public class ProDuplicatesPlugin extends Plugin {
    private final ExecutorService worker=Executors.newSingleThreadExecutor();
    private final AtomicBoolean busy=new AtomicBoolean();
    private DuplicateCleanupStore store;

    @Override public void load(){store=new DuplicateCleanupStore(getContext());}
    private interface Work{JSONObject run()throws Exception;}
    private boolean reserve(PluginCall call){
        if(!busy.compareAndSet(false,true)){call.reject("Duplicate cleanup busy","DUPLICATES_BUSY");return false;}
        try{store.prepareWork();return true;}
        catch(Exception error){busy.set(false);call.reject("Duplicate cleanup unavailable","DUPLICATES_UNAVAILABLE");return false;}
    }
    private void work(PluginCall call,Work task){
        try{worker.execute(()->{
            try{call.resolve(JSObject.fromJSONObject(task.run()));}
            catch(Exception error){call.reject("Duplicate cleanup unavailable","DUPLICATES_UNAVAILABLE");}
            finally{busy.set(false);}
        });}catch(RuntimeException error){store.abandonWork();busy.set(false);call.reject("Duplicate cleanup unavailable","DUPLICATES_UNAVAILABLE");}
    }
    @PluginMethod public void chooseFolder(PluginCall call){
        if(Build.VERSION.SDK_INT<Build.VERSION_CODES.Q){call.reject("Folder cleanup requires Android 10 or newer","DUPLICATES_ANDROID_VERSION");return;}
        if(!reserve(call))return;
        Intent intent=new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE).addFlags(
            Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_WRITE_URI_PERMISSION|Intent.FLAG_GRANT_PREFIX_URI_PERMISSION);
        try{startActivityForResult(call,intent,"folderChosen");}
        catch(Exception error){store.abandonWork();busy.set(false);call.reject("Folder chooser unavailable","DUPLICATES_UNAVAILABLE");}
    }
    @ActivityCallback private void folderChosen(PluginCall call,ActivityResult result){
        if(call==null){store.abandonWork();busy.set(false);return;}
        Intent data=result.getData();
        if(result.getResultCode()!=Activity.RESULT_OK||data==null||data.getData()==null){
            store.abandonWork();busy.set(false);call.resolve(new JSObject().put("cancelled",true));return;
        }
        Uri tree=data.getData();
        int required=Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_WRITE_URI_PERMISSION;
        if(!"content".equals(tree.getScheme())||(data.getFlags()&required)!=required){
            store.abandonWork();busy.set(false);call.reject("Read and write folder access required","DUPLICATES_PERMISSION");return;
        }
        // This is a new, explicit writable selection. Existing import permissions stay read-only.
        work(call,()->store.scan(tree));
    }
    @PluginMethod public void progress(PluginCall call){
        try{call.resolve(JSObject.fromJSONObject(store.progress()));}
        catch(Exception error){call.reject("Progress unavailable","DUPLICATES_UNAVAILABLE");}
    }
    @PluginMethod public void cancel(PluginCall call){
        // Do not enqueue cancellation behind hashing or deletion.
        store.cancel();call.resolve(new JSObject().put("ok",true));
    }
    @PluginMethod public void deleteSelected(PluginCall call){
        if(!Boolean.TRUE.equals(call.getBoolean("confirmed",false))){
            call.reject("Review and confirmation required","DUPLICATES_CONFIRM");return;
        }
        JSONArray values=call.getData().optJSONArray("ids");
        String session=call.getString("session","");
        if(values==null||values.length()==0||values.length()>2000||session.isEmpty()){
            call.reject("Select current file copies","DUPLICATES_SELECTION");return;
        }
        List<String> ids=new ArrayList<>();
        for(int i=0;i<values.length();i++){
            Object value=values.opt(i);
            if(!(value instanceof String)||((String)value).isEmpty()){
                call.reject("Invalid file selection","DUPLICATES_SELECTION");return;
            }
            ids.add((String)value);
        }
        if(!reserve(call))return;
        work(call,()->store.delete(session,ids));
    }
    @Override protected void handleOnDestroy(){store.cancel();worker.shutdownNow();}
}

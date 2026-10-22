package de.familyprojekt.privatebrain.pro;

import java.net.HttpURLConnection;
import java.nio.file.Path;
import java.util.concurrent.atomic.AtomicBoolean;
import org.json.JSONObject;

/** Same download/hash/resume engine and pins as Android; native cancellation stays concurrent. */
final class DesktopModel {
    private final SemanticModel model;
    private final DesktopState.Preferences prefs;
    private final AtomicBoolean running=new AtomicBoolean();
    DesktopModel(DesktopState state,Path manifest)throws Exception {
        model=new SemanticModel(state.directory.resolve("semantic").toFile(),SemanticPins.entries(manifest),url->(HttpURLConnection)url.openConnection());
        prefs=state.getSharedPreferences("semantic",0);
        if(prefs.getBoolean("loading",false))save(prefs.edit().putBoolean("loading",false).putInt("crashes",prefs.getInt("crashes",0)+1).putString("lastGone","model start interrupted"));
    }
    private static void save(DesktopState.Preferences.Editor editor)throws Exception {if(!editor.commit())throw new VaultCrypto.Failure("VAULT_UNAVAILABLE");}
    private JSONObject state() {
        return new JSONObject().put("installed",model.installed()).put("running",running.get()).put("present",model.present())
            .put("total",model.total()).put("files",model.entries().size()).put("crashes",prefs.getInt("crashes",0)).put("lastGone",prefs.getString("lastGone",""));
    }
    JSONObject asset(String value)throws Exception {
        java.net.URI uri=java.net.URI.create(value);String path=uri.getPath(),relative=null;
        String base="/npm/@xenova/transformers@2.17.2";
        if("https".equals(uri.getScheme())&&"cdn.jsdelivr.net".equals(uri.getHost())){
            if(path.equals(base)||path.equals(base+"/"))relative="lib/transformers.min.js";
            else if(path.startsWith(base+"/"))relative="lib/"+path.substring(base.length()+1);
        }else if("https".equals(uri.getScheme())&&"tauri.localhost".equals(uri.getHost())&&path.startsWith("/models/Xenova/multilingual-e5-small/")){
            relative="model/"+path.substring("/models/Xenova/multilingual-e5-small/".length());
        }
        if(relative==null)return new JSONObject().put("missing",true);
        java.io.File file=model.file(relative);if(file==null)return new JSONObject().put("missing",true);
        DesktopFiles.noLinks(file.toPath());
        SemanticModel.Entry found=null;for(SemanticModel.Entry entry:model.entries())if(entry.path.equals(relative))found=entry;
        if(found==null||!found.sha256.equals(OriginalFileStore.digest(file)))throw new VaultCrypto.Failure("VAULT_DAMAGED");
        return new JSONObject().put("path",file.toString()).put("size",file.length());
    }
    JSONObject call(String method)throws Exception {
        switch(method){
            case "getState":return state();
            case "cancel":model.cancel();return state();
            case "install":
                if(!running.compareAndSet(false,true))throw new MailFailure("BUSY");
                long[] last={0};
                try{
                    model.install((done,total,file,source)->{
                        long now=System.currentTimeMillis();if(now-last[0]<250&&done<total)return;last[0]=now;
                        EngineMain.event("ProSemantic:progress",new JSONObject().put("done",done).put("total",total).put("file",file).put("source",source));
                    });
                }finally{running.set(false);}
                return state();
            case "remove":
                if(!running.compareAndSet(false,true))throw new MailFailure("BUSY");
                try{model.remove();}finally{running.set(false);}return state();
            case "markLoading":save(prefs.edit().putBoolean("loading",true));return state();
            case "markLoaded":save(prefs.edit().putBoolean("loading",false).putInt("crashes",0));return state();
            case "clearCrash":save(prefs.edit().putInt("crashes",0));return state();
            default:throw new MailFailure("INVALID_INPUT");
        }
    }
}

package de.familyprojekt.privatebrain.pro;

import java.net.HttpURLConnection;
import java.nio.file.Path;
import java.util.concurrent.atomic.AtomicBoolean;
import org.json.JSONObject;

/** Same download/hash/resume engine and pins as Android; native cancellation stays concurrent.
 *  One instance per model: the meaning model ("semantic", ProSemantic), since Sitzung 4 the image model
 *  ("caption", ProCaption), and since Pro-Umbau 5 the two stages of the second meaning model of the app's search
 *  ("meaning-mittel", "meaning-gross", ProMeaning), each with its own folder, preferences and route. */
final class DesktopModel {
    private final SemanticModel model;
    private final DesktopState.Preferences prefs;
    private final String event;
    private final java.util.function.Function<String,String> route;
    private final AtomicBoolean running=new AtomicBoolean();
    DesktopModel(DesktopState state,Path manifest)throws Exception { this(state,manifest,"semantic","ProSemantic",BundledRoutes::modelPath); }
    DesktopModel(DesktopState state,Path manifest,String name,String plugin,java.util.function.Function<String,String> modelPath)throws Exception {
        // A missing manifest (older runtime folder, protocol probe without the file) means "no pins": the model cannot be
        // installed (NO_PINS), but the engine starts (measured: APP_RUNTIME_UNAVAILABLE in the shared-engine check).
        this(state,java.nio.file.Files.isRegularFile(manifest)?SemanticPins.entries(manifest):java.util.List.of(),name,plugin,modelPath,null);
    }
    /** Pro-Umbau 5: one stage of the second meaning model (ProMeaning); its progress events carry the stage. */
    static DesktopModel meaning(DesktopState state,Path manifest,String stage,java.util.function.Function<String,String> modelPath)throws Exception {
        java.util.List<SemanticModel.Entry> entries=java.nio.file.Files.isRegularFile(manifest)?SemanticPins.meaningEntries(java.nio.file.Files.readString(manifest),stage):java.util.List.of();
        return new DesktopModel(state,entries,"meaning-"+stage,"ProMeaning",modelPath,stage);
    }
    private final String stage;
    private DesktopModel(DesktopState state,java.util.List<SemanticModel.Entry> entries,String name,String plugin,java.util.function.Function<String,String> modelPath,String stage)throws Exception {
        event=plugin+":progress";route=modelPath;this.stage=stage;
        model=new SemanticModel(state.directory.resolve(name).toFile(),entries,url->(HttpURLConnection)url.openConnection());
        prefs=state.getSharedPreferences(name,0);
        if(prefs.getBoolean("loading",false))save(prefs.edit().putBoolean("loading",false).putInt("crashes",prefs.getInt("crashes",0)+1).putString("lastGone","model start interrupted"));
    }
    private static void save(DesktopState.Preferences.Editor editor)throws Exception {if(!editor.commit())throw new VaultCrypto.Failure("VAULT_UNAVAILABLE");}
    void rendererGone()throws Exception {
        if(prefs.getBoolean("loading",false))save(prefs.edit().putBoolean("loading",false).putInt("crashes",prefs.getInt("crashes",0)+1).putString("lastGone","WebView renderer stopped during model loading"));
    }
    JSONObject state() {
        return new JSONObject().put("installed",model.installed()).put("running",running.get()).put("present",model.present())
            .put("total",model.total()).put("files",model.entries().size()).put("crashes",prefs.getInt("crashes",0)).put("lastGone",prefs.getString("lastGone",""));
    }
    JSONObject asset(String value)throws Exception {
        String name=BundledRoutes.file(value),relative=name==null?route.apply(value):"lib/"+name;
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
                if(model.entries().isEmpty())throw new MailFailure("NO_PINS");
                if(!running.compareAndSet(false,true))throw new MailFailure("BUSY");
                long[] last={0};
                try{
                    model.install((done,total,file,source)->{
                        long now=System.currentTimeMillis();if(now-last[0]<250&&done<total)return;last[0]=now;
                        JSONObject p=new JSONObject().put("done",done).put("total",total).put("file",file).put("source",source);if(stage!=null)p.put("stage",stage);
                        EngineMain.event(event,p);
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

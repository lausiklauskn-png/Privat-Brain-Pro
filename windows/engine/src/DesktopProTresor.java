package de.familyprojekt.privatebrain.pro;

import de.familyprojekt.tresor.DateiAblage;
import de.familyprojekt.tresor.TresorOrdner;
import de.familyprojekt.tresor.Eintrag;
import de.familyprojekt.tresor.Fach;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import org.json.JSONArray;
import org.json.JSONObject;

/** Windows connection to the same optional common vault. Secrets stay in the native host and DPAPI-protected preferences. */
final class DesktopProTresor {
    private final DesktopState device;
    private final DesktopService.Host host;
    private final Vault own;
    private final OriginalFileStore originals;
    private TresorOrdner open;
    private boolean manuallyLocked;
    DesktopProTresor(DesktopState device,DesktopService.Host host,Vault own,OriginalFileStore originals) {
        this.device=device;this.host=host;this.own=own;this.originals=originals;
    }
    private DesktopState.Preferences prefs(){return device.getSharedPreferences("pb-tresorordner-v1",0);}
    private Path folder()throws IOException {
        String value=prefs().getString("baum",null);if(value==null)throw new IOException("TRESOR_KEIN_ORDNER");
        Path path=Path.of(value);DesktopFiles.noLinks(path);
        if(!Files.isDirectory(path))throw new IOException("TRESOR_ORDNER_NICHT_ERREICHBAR");return path;
    }
    private DateiAblage storage()throws IOException{return new DateiAblage(folder().toFile());}
    private void close(){if(open!=null)open.close();open=null;}
    private boolean remembered(){
        if(open!=null)return true;if(manuallyLocked||!prefs().contains("merken"))return false;
        byte[] key=null;
        try {
            DateiAblage storage=storage();if(!TresorOrdner.kennung(storage).equals(prefs().getString("kennung","")))return false;
            key=java.util.Base64.getDecoder().decode(prefs().getString("merken",""));
            open=TresorOrdner.mitHauptschluessel(storage,TresorEinzug.APP,key);return true;
        }catch(Exception error){close();return false;}finally{if(key!=null)Arrays.fill(key,(byte)0);}
    }
    private TresorOrdner checked()throws Exception {
        if(open==null&&!remembered())throw new IOException("TRESOR_GESPERRT");
        if(!open.id().equals(TresorOrdner.kennung(storage()))){close();throw new IOException("TRESOR_UEBERGABE_FREMD");}
        return open;
    }
    private void joinOwn()throws Exception {
        if(!"PASST".equals(TresorEinzug.pruefen(storage(),own.tresorId())))throw new IOException("TRESOR_ORDNER_PASST_NICHT");
        byte[] key=own.tresorSchluessel();try{TresorEinzug.einziehen(checked(),key);}finally{Arrays.fill(key,(byte)0);}
    }
    JSONObject status()throws Exception {
        var p=prefs();JSONObject z=new JSONObject().put("uebergaben",true).put("gewaehlt",p.contains("baum"))
            .put("ordner",p.getString("name","")).put("pfad",p.getString("baum","")).put("gemerkt",p.contains("merken")).put("offen",false).put("eingezogen",false);
        if(!p.contains("baum"))return z;
        try {
            DateiAblage storage=storage();boolean exists=TresorOrdner.vorhanden(storage);
            z.put("erreichbar",true).put("vorhanden",exists);
            if(own.configured())z.put("pruefung",TresorEinzug.pruefen(storage,own.tresorId()));
            if(exists){z.put("kennung",TresorOrdner.kennung(storage));if(open!=null)checked();else remembered();}else close();
            z.put("offen",open!=null);
            if(open!=null){boolean joined=TresorEinzug.eingezogen(open);z.put("eingezogen",joined).put("eintraege",joined?open.eigenesVerzeichnis(TresorEinzug.FACH).size():0);}
        }catch(IOException error){close();z.put("offen",false).put("erreichbar",false).put("problem",error.getMessage());}
        return z;
    }
    private JSONObject connect(JSONObject args)throws Exception {
        boolean only=args.optBoolean("nurVerbinden");
        if(!only){byte[] key=own.tresorSchluessel();Arrays.fill(key,(byte)0);}
        if(args.optBoolean("neuWaehlen")||!prefs().contains("baum")){
            JSONObject chosen=host.call("folder",new JSONObject());if(chosen.optBoolean("cancelled"))return new JSONObject().put("abgebrochen",true);
            Path folder=Path.of(chosen.getString("path")).toAbsolutePath().normalize();DesktopFiles.noLinks(folder);
            if(!Files.isDirectory(folder))throw new IOException("TRESOR_ORDNER_NICHT_ERREICHBAR");
            DateiAblage probe=new DateiAblage(folder.toFile());
            if(!only){String result=TresorEinzug.pruefen(probe,own.tresorId());if(!"PASST".equals(result))throw new IOException("TRESOR_ORDNER_"+result);}
            if(!prefs().edit().putString("baum",folder.toString()).putString("name",folder.getFileName()==null?folder.toString():folder.getFileName().toString()).remove("merken").remove("kennung").commit())throw new IOException("TRESOR_NICHT_VERFUEGBAR");
            close();
        }
        manuallyLocked=false;
        if(!remembered()){
            DateiAblage storage=storage();boolean create=!TresorOrdner.vorhanden(storage);
            JSONObject answer=host.call("password",new JSONObject().put("mode",create?"create":"open").put("context","pro-verbund"));
            if(answer.optBoolean("cancelled"))return new JSONObject().put("abgebrochen",true);
            String password=answer.getString("password");
            if(password.length()<10||create&&(!password.equals(answer.optString("repeat"))||!answer.optBoolean("notice")))throw new IOException("VAULT_PASSWORD_CONFIRM");
            open=create?TresorOrdner.anlegen(storage,TresorEinzug.APP,password):TresorOrdner.oeffnen(storage,TresorEinzug.APP,password);
            if(answer.optBoolean("remember")){
                byte[] key=open.hauptschluesselKopie();
                try {if(!prefs().edit().putString("kennung",open.id()).putString("merken",java.util.Base64.getEncoder().encodeToString(key)).commit())throw new IOException("TRESOR_NICHT_VERFUEGBAR");}
                finally{Arrays.fill(key,(byte)0);}
            }
        }
        if(!only)joinOwn();return status().put("eingezogenJetzt",!only);
    }
    JSONObject call(String method,JSONObject args)throws Exception {
        return switch(method){
            case "tresorZustand" -> status();
            case "tresorEinziehen" -> connect(args);
            case "tresorSperren" -> {close();manuallyLocked=true;if(args.optBoolean("vergessen")&&!prefs().edit().remove("merken").remove("kennung").commit())throw new IOException("TRESOR_NICHT_VERFUEGBAR");yield status();}
            case "tresorUebergabe" -> ProVerbund.call(checked(),originals,args);
            case "tresorFach" -> {String slug=args.getString("fach");Fach.nachSlug(slug);JSONArray items=new JSONArray();for(Eintrag entry:checked().verzeichnis(slug))items.put(new JSONObject(entry.alsMap()));yield new JSONObject().put("fach",slug).put("eintraege",items);}
            case "tresorVerzeichnis" -> {
                if(!TresorEinzug.eingezogen(checked()))throw new IOException("TRESOR_FACH_FEHLT");
                if(!"PASST".equals(TresorEinzug.pruefen(storage(),own.tresorId())))throw new IOException("TRESOR_ORDNER_PASST_NICHT");
                List<Map<String,Object>> input=new ArrayList<>();JSONArray rows=args.getJSONArray("zeilen");for(int i=0;i<rows.length();i++)input.add(rows.getJSONObject(i).toMap());
                List<Eintrag> entries=TresorEinzug.eintraege(input);boolean changed=TresorEinzug.schreibenWennGeaendert(checked(),entries);
                yield new JSONObject().put("geschrieben",changed).put("eintraege",entries.size());
            }
            default -> throw new IOException("INVALID_INPUT");
        };
    }
}

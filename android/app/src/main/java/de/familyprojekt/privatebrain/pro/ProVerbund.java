package de.familyprojekt.privatebrain.pro;

import de.familyprojekt.tresor.TresorOrdner;
import de.familyprojekt.tresor.Uebergaben;
import de.familyprojekt.tresor.Eintrag;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.Arrays;
import java.util.Map;
import org.json.JSONArray;
import org.json.JSONObject;

/** Same bounded transfer operations on Android and Windows. Uses the canonical FPT1 format and existing originals. */
final class ProVerbund {
    private ProVerbund() { }
    static JSONObject call(TresorOrdner vault,OriginalFileStore originals,JSONObject args)throws Exception {
        if(vault==null)throw new IOException("TRESOR_GESPERRT");
        if(!vault.id().equals(args.optString("vaultId")))throw new IOException("TRESOR_UEBERGABE_FREMD");
        Uebergaben transfers=new Uebergaben(vault);
        return switch(args.optString("aktion")) {
            case "eingang" -> new JSONObject().put("items",new JSONArray(transfers.offen()));
            case "lesen" -> {
                String entry=args.optString("entryId");Map<String,Object> contract=transfers.beschreibung(entry);
                byte[] bytes=transfers.lesen(entry);String hash=String.valueOf(contract.get("sha256")),ticket=null;
                if(bytes.length==0)throw new IOException("TRESOR_UEBERGABE_VERTRAG");
                try {
                    JSONObject begin=originals.begin(hash,bytes.length,String.valueOf(contract.get("name")),String.valueOf(contract.get("mime")));
                    if(!begin.optBoolean("stored")) {
                        ticket=begin.getString("ticket");
                        for(int offset=0;offset<bytes.length;offset+=256*1024)
                            originals.append(ticket,offset,Arrays.copyOfRange(bytes,offset,Math.min(bytes.length,offset+256*1024)));
                        originals.finish(ticket);ticket=null;
                    }
                    if(!hash.equals(OriginalFileStore.digest(originals.file(hash))))throw new IOException("ORIGINAL_HASH_MISMATCH");
                    // No canonical mark here: the page must still commit its ordinary catalog import and receipt.
                    yield new JSONObject().put("vertrag",new JSONObject(contract)).put("entryId",entry).put("originalHash",hash);
                } finally {if(ticket!=null)originals.abort(ticket);Arrays.fill(bytes,(byte)0);}
            }
            case "quittieren" -> {transfers.quittieren(args.optString("entryId"),args.optString("sha256"));yield new JSONObject().put("stand","im-eingang");}
            case "stand" -> new JSONObject().put("bestaetigt",transfers.bestaetigt(args.optString("ziel"),args.optString("entryId")));
            case "senden" -> {
                JSONObject m=args.getJSONObject("vertrag");String hash=m.optString("sha256"),target=m.optString("ziel");
                if(!Uebergaben.VERTRAG.equals(m.optString("vertrag"))||!TresorEinzug.APP.equals(m.optString("quelle"))||
                    !Arrays.asList("familienakte","workflow-pdf-pro","bookledgerpro").contains(target))throw new IOException("TRESOR_UEBERGABE_VERTRAG");
                File file=originals.file(hash);long size=m.optLong("groesse",-1);
                if(size<=0||size>Uebergaben.MAX_BYTES||file.length()!=size||!OriginalFileStore.digest(file).equals(hash))throw new IOException("TRESOR_UEBERGABE_PRUEFSUMME");
                String name=m.getString("name"),mime=m.getString("mime");boolean pdf=mime.equals("application/pdf")||name.toLowerCase(java.util.Locale.ROOT).endsWith(".pdf");
                if(target.equals("workflow-pdf-pro")&&!pdf&&!mime.startsWith("image/"))throw new IOException("TRESOR_UEBERGABE_TYP");
                if(target.equals("bookledgerpro")&&!pdf&&!mime.startsWith("image/")&&!name.toLowerCase(java.util.Locale.ROOT).endsWith(".eml"))throw new IOException("TRESOR_UEBERGABE_TYP");
                Eintrag result;
                try(FileInputStream source=new FileInputStream(file)){
                    result=transfers.senden(target,m.getString("id"),m.getString("dokumentId"),m.optString("bezug"),name,mime,source);
                }
                if(!result.sha256.equals(hash)||result.groesse!=size)throw new IOException("TRESOR_UEBERGABE_PRUEFSUMME");
                yield new JSONObject(result.alsMap());
            }
            default -> throw new IOException("TRESOR_UEBERGABE_VERTRAG");
        };
    }
}

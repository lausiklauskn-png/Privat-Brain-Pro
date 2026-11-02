import de.familyprojekt.tresor.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import org.json.JSONObject;

/** Canonical Family actor for the installed Windows acceptance. No native test endpoint in production. */
public class CommonVaultFixture {
    static final String PASSWORD="CI-Tresor-ä-Probe-2026",NAME="Windows-Pro-Verbund.txt",TEXT="Erfundener Windows-Brief aus Familienakte";
    public static void main(String[] args)throws Exception {
        DateiAblage storage=new DateiAblage(new File(args[1]));boolean seed=args[0].equals("seed");
        try(TresorOrdner family=seed?TresorOrdner.anlegen(storage,"familienakte",PASSWORD):TresorOrdner.oeffnen(storage,"familienakte",PASSWORD)){
            Uebergaben transfers=new Uebergaben(family);byte[] bytes=TEXT.getBytes(StandardCharsets.UTF_8);
            var original=transfers.senden("private-brain","windows-family-17","akte-17","",NAME,"text/plain",new ByteArrayInputStream(bytes));
            JSONObject result=new JSONObject().put("vaultId",family.id()).put("sourceAccepted",transfers.bestaetigt("private-brain",original.id));
            if(!seed){
                var list=transfers.offen();if(list.size()!=1)throw new AssertionError("exactly one Family return expected");
                var item=list.get(0);String id=String.valueOf(item.get("entryId"));var contract=transfers.beschreibung(id);
                if(!"windows-family-17".equals(contract.get("bezug"))||!Arrays.equals(transfers.lesen(id),(TEXT+" – bearbeitet").getBytes(StandardCharsets.UTF_8)))throw new AssertionError("source relation or returned bytes differ");
                result.put("returnId",id);if(args[0].equals("ack"))transfers.quittieren(id,String.valueOf(contract.get("sha256")));
            }
            System.out.println(result);
        }
    }
}

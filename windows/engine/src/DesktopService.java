package de.familyprojekt.privatebrain.pro;

import java.nio.file.*;
import org.json.*;

/** Named device contracts for the same native/*.js frontend used by Android. */
final class DesktopService {
    interface Host { JSONObject call(String method,JSONObject options)throws Exception; }
    private final DesktopState state;
    private final Host host;
    private final EncryptedMailStore storage;
    private final Vault vault;
    private final OriginalFileStore originals;
    private final MailEngine mail;
    private final DesktopOAuth oauth;
    private final Protection protection;
    private final DesktopModel model;
    DesktopService(DesktopState state,Path resources,Host host)throws Exception {
        this.state=state;this.host=host;AppNetwork.initialize(state);
        storage=new EncryptedMailStore(state);vault=Vault.get(state);originals=new OriginalFileStore(state);
        String client=new JSONObject(Files.readString(resources.resolve("gmail-desktop.json"))).optString("clientId");
        oauth=new DesktopOAuth(client,storage,url->host.call("browser",new JSONObject().put("url",url)));
        mail=new MailEngine(storage,oauth,vault);
        state.metered=()->{try{return host.call("metered",new JSONObject()).optBoolean("metered",true);}catch(Exception error){return true;}};
        protection=Protection.create(state);
        model=new DesktopModel(state,resources.resolve("semantic-model.json"));
    }
    private static JSONObject yes(){return new JSONObject().put("ok",true);}
    private static String required(JSONObject o,String key)throws MailFailure {
        String v=o.optString(key,"");if(v.isEmpty()||v.length()>4096)throw new MailFailure("INVALID_INPUT");return v;
    }
    private static byte[] block(JSONObject o)throws MailFailure {
        String data=o.getString("data");if(data.length()>349528)throw new MailFailure("INVALID_INPUT");return Base64.decode(data,Base64.NO_WRAP);
    }
    private static JSONObject bytes(byte[] b){return new JSONObject().put("data",Base64.encodeToString(b,Base64.NO_WRAP));}
    JSONObject call(String plugin,String method,JSONObject options)throws Exception {
        JSONObject o=options==null?new JSONObject():options;
        return switch(plugin){
            case "ProDevice" -> new JSONObject().put("platform","windows").put("versionName","1.0.0-preview.29").put("versionCode",29).put("nativeMail",true).put("persistentFolders",true).put("persistentFiles",true);
            case "ProNetwork" -> network(method,o);
            case "ProVault" -> vault(method,o);
            case "ProFiles" -> files(method,o);
            case "ProMail" -> mail(method,o);
            case "ProProtect" -> protect(method,o);
            case "ProSemantic" -> model.call(method);
            case "DesktopInternal" -> {
                if(!method.equals("modelAsset"))throw new MailFailure("INVALID_INPUT");
                yield model.asset(required(o,"url"));
            }
            default -> throw new MailFailure("INVALID_INPUT");
        };
    }
    private JSONObject protect(String method,JSONObject o)throws Exception {
        return switch(method){
            case "state" -> protection.state();
            case "update" -> protection.update(o.optBoolean("force"));
            case "setAuto" -> {protection.setAuto(o.optBoolean("value",true));yield protection.state();}
            case "checkHashes" -> protection.checkHashes(o.getJSONArray("items"));
            case "checkUrls" -> protection.checkUrls(o.getJSONArray("items"));
            case "virusTotal" -> protection.virusTotal(required(o,"sha256"));
            case "setKey" -> {
                String service=required(o,"service");if(!service.equals("abusech")&&!service.equals("virustotal"))throw new MailFailure("INVALID_INPUT");
                JSONObject fields=host.call("key",new JSONObject().put("service",service));
                if(fields.optBoolean("cancelled"))yield fields;
                protection.setKey(service,fields.getString("password"));yield protection.state();
            }
            default -> throw new MailFailure("INVALID_INPUT");
        };
    }
    private JSONObject network(String method,JSONObject o)throws Exception {
        if(method.equals("setOffline"))AppNetwork.setOffline(state,o.getBoolean("offline"));
        else if(!method.equals("getState"))throw new MailFailure("INVALID_INPUT");
        return new JSONObject().put("offline",AppNetwork.isOffline());
    }
    private JSONObject files(String method,JSONObject o)throws Exception {
        String hash=o.optString("hash");
        return switch(method){
            case "listOriginals" -> new JSONObject().put("items",originals.list());
            case "originalInfo" -> {
                JSONObject info=originals.info(hash);
                if(info==null&&vault.configured()&&vault.unlocked()&&vault.restoreOriginal(hash,originals))info=originals.info(hash);
                yield info==null?new JSONObject().put("missing",true):info;
            }
            case "beginImport" -> originals.begin(hash,o.optLong("size",-1),required(o,"name"),o.optString("type"));
            case "appendImport" -> {originals.append(required(o,"ticket"),o.optLong("offset",-1),block(o));yield yes();}
            case "finishImport" -> {
                String id=originals.finish(required(o,"ticket"));boolean copied=false;
                if(vault.configured()&&vault.unlocked()){try{vault.copyOriginal(id,originals.file(id),originals.info(id));copied=true;}catch(Exception error){yield yes().put("vault",false);}}
                yield yes().put("vault",copied);
            }
            case "abortImport" -> {originals.abort(required(o,"ticket"));yield yes();}
            case "readOriginal" -> bytes(originals.read(hash,o.optLong("offset",-1)));
            case "open","share" -> {
                java.io.File file=originals.file(hash);JSONObject meta=originals.info(hash);
                if(meta==null||!OriginalFileStore.digest(file).equals(hash))throw new java.io.IOException("ORIGINAL_UNAVAILABLE");
                yield host.call("openVerified",new JSONObject().put("path",file.toString()).put("name",meta.optString("name","file")));
            }
            default -> throw new MailFailure("INVALID_INPUT");
        };
    }
    private JSONObject vault(String method,JSONObject o)throws Exception {
        return switch(method){
            case "state" -> vault.state();
            case "volumes" -> host.call("volumes",new JSONObject());
            case "choose" -> {
                JSONObject picked=host.call("folder",new JSONObject());if(picked.optBoolean("cancelled"))yield picked;
                String path=picked.getString("path");boolean exists=vault.find(path)!=null;
                JSONObject fields=host.call("password",new JSONObject().put("mode",exists?"open":"create"));
                if(fields.optBoolean("cancelled"))yield fields;
                String pw=fields.getString("password");
                if(!exists&&(!pw.equals(fields.optString("repeat"))||!fields.optBoolean("notice")))throw new VaultCrypto.Failure("VAULT_PASSWORD_CONFIRM");
                yield exists?vault.open(path,pw,fields.optBoolean("remember")):vault.create(path,pw,fields.optBoolean("remember"));
            }
            case "unlock" -> {
                JSONObject fields=host.call("password",new JSONObject().put("mode","unlock"));if(fields.optBoolean("cancelled"))yield fields;
                yield vault.unlock(fields.getString("password"),fields.optBoolean("remember"));
            }
            case "lock" -> vault.lock();
            case "migrate" -> vault.migrate(originals,storage);
            case "backupMail" -> {vault.backupMailStore(storage);yield yes();}
            case "attachments" -> new JSONObject().put("items",vault.attachments());
            case "clearAttachments" -> vault.clearAttachments();
            case "readAttachment" -> bytes(vault.readAttachment(required(o,"id"),o.optLong("offset",-1)));
            case "openAttachment" -> host.call("openVerified",new JSONObject().put("path",vault.stageAttachment(required(o,"id")).toString()));
            case "catalogBegin" -> new JSONObject().put("ticket",vault.catalogBegin());
            case "catalogAppend" -> {vault.catalogAppend(required(o,"ticket"),o.optLong("offset",-1),block(o));yield yes();}
            case "catalogFinish" -> {vault.catalogFinish(required(o,"ticket"));yield yes();}
            case "catalogAbort" -> {vault.catalogAbort(required(o,"ticket"));yield yes();}
            case "catalogInfo" -> vault.catalogInfo();
            case "catalogRead" -> bytes(vault.catalogRead(o.optLong("version",-1),o.optLong("offset",-1)));
            default -> throw new MailFailure("INVALID_INPUT");
        };
    }
    private void backup()throws Exception {if(vault.configured()&&vault.unlocked())vault.backupMailStore(storage);}
    private JSONObject mail(String method,JSONObject o)throws Exception {
        if(method.equals("accounts"))return new JSONObject().put("items",mail.accounts());
        if(method.equals("addAccount")){
            JSONObject fields=host.call("account",new JSONObject());if(fields.optBoolean("cancelled"))throw new MailFailure("CANCELLED");
            MailProvider provider=MailProvider.find(fields.getString("provider"));JSONObject account;
            if(provider==MailProvider.GOOGLE){
                String email=oauth.authorize(null);account=new JSONObject().put("provider","gmail").put("authType","oauth2").put("email",email).put("user",email).put("imap",provider.imap).put("smtp",provider.smtp);
            }else account=fields;
            MailAccount value=new MailAccount(account);mail.verify(value);JSONObject result=mail.saveAccount(value);backup();return result;
        }
        if(method.equals("removeAccount")){mail.removeAccount(required(o,"account"));backup();return yes();}
        if(method.equals("saved"))return new JSONObject().put("items",mail.saved(required(o,"account")));
        if(method.equals("savedDraft"))return mail.savedDraft(required(o,"account"),required(o,"id"));
        if(method.equals("unsubscribe")){Unsubscribe.Result result=Unsubscribe.oneClick(required(o,"url"),url->(java.net.HttpURLConnection)url.openConnection());return yes().put("ok",result.ok).put("status",result.status);}
        MailAccount account=mail.account(required(o,"account"));
        return switch(method){
            case "folders" -> new JSONObject().put("items",mail.folders(account));
            case "createFolder" -> {mail.createFolder(account,required(o,"name"));yield yes();}
            case "messages" -> mail.messages(account,required(o,"folder"),o.optLong("before",0));
            case "index" -> mail.index(account,required(o,"folder"),o.optLong("since",-1),o.optLong("before",0));
            case "locate" -> mail.locate(account,required(o,"folder"),required(o,"messageId"));
            case "indexText" -> mail.indexText(account,required(o,"folder"),required(o,"validity"),o.optJSONArray("uids"));
            case "message" -> mail.message(account,required(o,"folder"),required(o,"validity"),o.optLong("uid",-1));
            case "action" -> {mail.action(account,required(o,"folder"),required(o,"validity"),o.optLong("uid",-1),required(o,"action"),o.optString("target"));yield yes();}
            case "actions" -> mail.actions(account,required(o,"folder"),required(o,"validity"),o.optJSONArray("uids"),required(o,"action"),o.optString("target"));
            case "send" -> {JSONObject result=mail.send(account,o.getJSONObject("draft"));backup();yield result;}
            case "saveDraft" -> {mail.saveDraft(account,o.getJSONObject("draft"));backup();yield yes();}
            case "forgetMessage" -> {mail.forgetMessage(account,required(o,"folder"),required(o,"validity"),o.optLong("uid",-1));yield yes();}
            default -> throw new MailFailure("INVALID_INPUT");
        };
    }
}

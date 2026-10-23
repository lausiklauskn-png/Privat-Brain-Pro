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
    private final DesktopPdf pdf=new DesktopPdf();
    private final DesktopFolders folders;
    private final ShareInbox inbox;
    private final DesktopUpdates updates=new DesktopUpdates();
    private final DesktopExports exports;
    private int refused;
    DesktopService(DesktopState state,Path resources,Host host)throws Exception {
        this.state=state;this.host=host;AppNetwork.initialize(state);
        exports=new DesktopExports(state);
        storage=new EncryptedMailStore(state);vault=Vault.get(state);originals=new OriginalFileStore(state);
        String client=new JSONObject(Files.readString(resources.resolve("gmail-desktop.json"))).optString("clientId");
        oauth=new DesktopOAuth(client,storage,url->host.call("browser",new JSONObject().put("url",url)));
        mail=new MailEngine(storage,oauth,vault);
        state.metered=()->{try{return host.call("metered",new JSONObject()).optBoolean("metered",true);}catch(Exception error){return true;}};
        protection=Protection.create(state);
        model=new DesktopModel(state,resources.resolve("semantic-model.json"));
        folders=new DesktopFolders(state);
        Path incoming=state.directory.resolve("cache/incoming");DesktopFiles.noLinks(incoming);Files.createDirectories(incoming);
        inbox=new ShareInbox(incoming.toFile());inbox.clear();
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
            case "ProDevice" -> new JSONObject().put("platform","windows").put("versionName",DesktopBuild.VERSION).put("versionCode",DesktopBuild.CODE).put("nativeMail",true).put("persistentFolders",true).put("persistentFiles",true);
            case "ProUpdates" -> {
                if(method.equals("check"))yield updates.check();
                if(method.equals("openDownload"))yield host.call("external",new JSONObject().put("url",updates.download()));
                throw new MailFailure("INVALID_INPUT");
            }
            case "ProNetwork" -> network(method,o);
            case "ProVault" -> vault(method,o);
            case "ProFiles" -> files(method,o);
            case "ProFolders" -> folders(method,o);
            case "ProShare" -> share(method,o);
            case "ProMail" -> mail(method,o);
            case "ProProtect" -> protect(method,o);
            case "ProSemantic" -> model.call(method);
            case "ProLinks" -> {
                if(method.equals("prepare"))yield new JSONObject().put("tickets",BrowserLinks.prepare(o.getJSONArray("urls")));
                if(!method.equals("open"))throw new MailFailure("INVALID_INPUT");
                String safe=BrowserLinks.allowed(required(o,"url"));if(safe==null)throw new MailFailure("LINK_UNAVAILABLE");
                yield host.call("external",new JSONObject().put("url",safe));
            }
            case "DesktopInternal" -> {
                if(method.equals("modelAsset"))yield model.asset(required(o,"url"));
                if(method.equals("rendererGone")){model.rendererGone();yield yes();}
                if(method.equals("mailLink"))yield new JSONObject().put("url",BrowserLinks.resolve(required(o,"url")));
                if(method.equals("receive"))yield receive(o.getJSONArray("paths"));
                throw new MailFailure("INVALID_INPUT");
            }
            default -> throw new MailFailure("INVALID_INPUT");
        };
    }
    private JSONObject share(String method,JSONObject o)throws Exception {
        synchronized(inbox){
            return switch(method){
                case "pending" -> {
                    JSONArray items=new JSONArray();for(ShareInbox.Item item:inbox.list())items.put(new JSONObject().put("id",item.id).put("name",item.name).put("mime",item.mime).put("size",item.size));
                    int count=refused;refused=0;yield new JSONObject().put("items",items).put("refused",count);
                }
                case "read" -> {try{yield bytes(inbox.read(required(o,"id"),o.optLong("offset",-1)));}catch(Exception error){throw new java.io.IOException("SHARE_UNAVAILABLE");}}
                case "done" -> {inbox.remove(required(o,"id"));yield yes();}
                default -> throw new MailFailure("INVALID_INPUT");
            };
        }
    }
    private JSONObject receive(JSONArray paths)throws Exception {
        synchronized(inbox){
            long used=0;for(ShareInbox.Item item:inbox.list())used+=item.size;
            for(int i=0;i<paths.length();i++){
                ShareInbox.Item copied=null;
                try{
                    Path file=Path.of(paths.getString(i)).toAbsolutePath().normalize();DesktopFiles.noLinks(file);
                    var before=Files.readAttributes(file,java.nio.file.attribute.BasicFileAttributes.class,LinkOption.NOFOLLOW_LINKS);
                    if(!before.isRegularFile()||before.size()>ShareInbox.MAX_FILE||used+before.size()>512L*1024*1024||Files.getFileStore(state.directory).getUsableSpace()<before.size()+32L*1024*1024)throw new java.io.IOException();
                    try(java.io.InputStream input=Files.newInputStream(file)){copied=inbox.add(input,file.getFileName().toString(),Files.probeContentType(file));}
                    var after=Files.readAttributes(file,java.nio.file.attribute.BasicFileAttributes.class,LinkOption.NOFOLLOW_LINKS);
                    if(copied.size!=before.size()||!before.lastModifiedTime().equals(after.lastModifiedTime())||!java.util.Objects.equals(before.fileKey(),after.fileKey()))throw new java.io.IOException();
                    used+=copied.size;
                }catch(Exception error){if(copied!=null)inbox.remove(copied.id);refused++;}
            }
        }
        EngineMain.event("ProShare:received",yes());return yes();
    }
    private JSONObject folders(String method,JSONObject o)throws Exception {
        return switch(method){
            case "state" -> folders.state();case "pause" -> folders.pause();
            case "chooseLibrary","chooseSource" -> {
                JSONObject chosen=host.call("folder",new JSONObject());if(chosen.optBoolean("cancelled"))yield chosen;
                yield method.equals("chooseLibrary")?folders.library(chosen.getString("path")):folders.source(chosen.getString("path"));
            }
            case "readSource" -> bytes(folders.read(required(o,"id"),o.optLong("offset",-1)));
            case "finishSource" -> {folders.finish();yield yes();}
            case "copyOriginal" -> folders.copy(required(o,"hash"),o.optString("name","file"));
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
                String value=fields.getString("password").trim();protection.setKey(service,value);
                yield new JSONObject().put("saved",!value.isEmpty()).put("removed",value.isEmpty()).put("state",protection.state());
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
            case "open","share" -> {Selected selected=selected(o);yield export(selected,method.equals("share"));}
            case "saveRecoveryKeys" -> recovery(o);
            case "scan" -> {
                Selected selected;
                if(o.has("vaultRef")){java.io.File file=vault.stageAttachment(required(o,"vaultRef"));selected=new Selected(file,file.getName());}
                else selected=selected(o);
                Path copy=exports.stage(selected.file,selected.name);yield host.call("scanVerified",new JSONObject().put("path",copy.toString()));
            }
            case "openPdf" -> pdf.open(selected(o).file);
            case "pdfPage" -> pdf.page(required(o,"id"),o.optInt("page",-1),o.optInt("width",1200));
            case "closePdf" -> {pdf.close(required(o,"id"));yield yes();}
            default -> throw new MailFailure("INVALID_INPUT");
        };
    }
    private record Selected(java.io.File file,String name){}
    private JSONObject export(Selected selected,boolean save)throws Exception {
        if(save){
            JSONObject chosen=host.call("saveLocation",new JSONObject().put("name",selected.name));if(chosen.optBoolean("cancelled"))return chosen.put("saved",false);
            // The chooser confirms replacement. Commit atomically in the chosen directory.
            Path target=Path.of(chosen.getString("path"));DesktopFiles.noLinks(target);
            Path pending=target.resolveSibling(".pb-export-"+java.util.UUID.randomUUID());
            try{DesktopExports.copy(selected.file.toPath(),pending);Files.move(pending,target,StandardCopyOption.ATOMIC_MOVE,StandardCopyOption.REPLACE_EXISTING);}
            finally{Files.deleteIfExists(pending);}
            return yes().put("saved",true);
        }
        Path staged=exports.stage(selected.file,selected.name);
        return host.call("openVerified",new JSONObject().put("path",staged.toString()));
    }
    private JSONObject recovery(JSONObject o)throws Exception {
        JSONArray shares=o.getJSONArray("shares");String name=o.optString("name","PRIVATE-BRAIN-RECOVERY-KEYS.txt"),heading=o.optString("heading","Private Brain: recovery keys (3 of 5 required).");
        if(shares.length()!=5||!name.matches("[A-Za-z0-9_-]{1,80}\\.txt")||heading.length()>1024)throw new java.io.IOException("RECOVERY_EXPORT_FAILED");
        StringBuilder content=new StringBuilder(heading).append("\n\n");
        for(int i=0;i<5;i++){String share=shares.getString(i);if(share.length()>8192||!share.matches("JT3v5-"+(i+1)+"-[A-Za-z0-9_-]+"))throw new java.io.IOException("RECOVERY_EXPORT_FAILED");content.append(share).append('\n');}
        JSONObject chosen=host.call("saveLocation",new JSONObject().put("name",name));if(chosen.optBoolean("cancelled"))return chosen.put("saved",false);
        byte[] data=content.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
        try{DesktopFiles.atomic(Path.of(chosen.getString("path")),data);return yes().put("saved",true);}
        finally{java.util.Arrays.fill(data,(byte)0);}
    }
    private Selected selected(JSONObject o)throws Exception {
        if(o.has("hash")){
            String hash=required(o,"hash");JSONObject meta=originals.info(hash);java.io.File file=originals.file(hash);
            if(meta==null||!hash.equals(OriginalFileStore.digest(file)))throw new java.io.IOException("ORIGINAL_UNAVAILABLE");
            DesktopFiles.noLinks(file.toPath());return new Selected(file,DesktopNames.safe(MailMime.filename(meta.getString("name"))));
        }
        String encoded=o.getString("data"),name=o.optString("name","file");
        if(encoded.length()>22369624||name.length()>1024)throw new MailFailure("INVALID_INPUT");
        byte[] bytes=Base64.decode(encoded,Base64.NO_WRAP);if(bytes.length>16*1024*1024)throw new MailFailure("INVALID_INPUT");
        Path folder=state.directory.resolve("cache/exports/files");DesktopFiles.noLinks(folder);Files.createDirectories(folder);long used=0;
        try(DirectoryStream<Path> files=Files.newDirectoryStream(folder)){
            for(Path file:files){DesktopFiles.noLinks(file);if(!Files.isRegularFile(file))throw new java.io.IOException("FILE_UNAVAILABLE");
                if(System.currentTimeMillis()-Files.getLastModifiedTime(file).toMillis()>24L*60*60*1000)Files.delete(file);else used+=Files.size(file);}
        }
        if(used+bytes.length>64L*1024*1024)throw new java.io.IOException("STORAGE_FULL");
        String safe=DesktopNames.safe(MailMime.filename(name));Path target=folder.resolve(java.util.UUID.randomUUID()+"-"+safe);
        DesktopFiles.atomic(target,bytes);return new Selected(target.toFile(),safe);
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
                if(exists)yield new JSONObject().put("state",vault.open(path,pw,fields.optBoolean("remember"))).put("opened",true).put("restored",vault.restoreMailStore(storage));
                yield new JSONObject().put("state",vault.create(path,pw,fields.optBoolean("remember"))).put("created",true);
            }
            case "unlock" -> {
                JSONObject fields=host.call("password",new JSONObject().put("mode","unlock"));if(fields.optBoolean("cancelled"))yield fields;
                yield new JSONObject().put("state",vault.unlock(fields.getString("password"),fields.optBoolean("remember"))).put("unlocked",true);
            }
            case "lock" -> vault.lock();
            case "migrate" -> vault.migrate(originals,storage);
            case "backupMail" -> {vault.backupMailStore(storage);yield yes();}
            case "attachments" -> new JSONObject().put("items",vault.attachments());
            case "clearAttachments" -> vault.clearAttachments();
            case "readAttachment" -> bytes(vault.readAttachment(required(o,"id"),o.optLong("offset",-1)));
            case "openAttachment" -> {java.io.File file=vault.stageAttachment(required(o,"id"));yield export(new Selected(file,file.getName()),false);}
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
            JSONArray templates=new JSONArray();
            for(MailProvider provider:MailProvider.values()){
                JSONArray help=new JSONArray(),plan=new JSONArray();for(int language=0;language<4;language++){help.put(provider.help(language));plan.put(provider==MailProvider.MICROSOFT?MailProvider.microsoftPlan(language):"");}
                templates.put(new JSONObject().put("id",provider.id).put("label",provider.label).put("imap",provider.imap).put("smtp",provider.smtp).put("editable",provider.editable).put("customUser",provider.customUser()).put("ready",provider.ready()).put("help",help).put("plan",plan));
            }
            JSONObject fields=host.call("account",new JSONObject().put("providers",templates));if(fields.optBoolean("cancelled"))throw new MailFailure("CANCELLED");
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
            case "openOriginal" -> {
                byte[] data=mail.raw(account,required(o,"folder"),required(o,"validity"),o.optLong("uid",-1));
                yield export(selected(new JSONObject().put("name","mail.eml").put("data",Base64.encodeToString(data,Base64.NO_WRAP))),true);
            }
            case "openAttachment" -> {
                JSONObject message=mail.message(account,required(o,"folder"),required(o,"validity"),o.optLong("uid",-1));
                JSONArray attachments=message.getJSONArray("attachments");int index=o.optInt("index",-1);if(index<0||index>=attachments.length())throw new MailFailure("INVALID_INPUT");
                JSONObject attachment=attachments.getJSONObject(index);
                if(attachment.has("ref")){java.io.File file=vault.stageAttachment(attachment.getString("ref"));yield export(new Selected(file,attachment.optString("name",file.getName())),false);}
                yield export(selected(attachment),false);
            }
            case "action" -> {mail.action(account,required(o,"folder"),required(o,"validity"),o.optLong("uid",-1),required(o,"action"),o.optString("target"));yield yes();}
            case "actions" -> mail.actions(account,required(o,"folder"),required(o,"validity"),o.optJSONArray("uids"),required(o,"action"),o.optString("target"));
            case "send" -> {JSONObject result=mail.send(account,o.getJSONObject("draft"));backup();yield result;}
            case "saveDraft" -> {mail.saveDraft(account,o.getJSONObject("draft"));backup();yield yes();}
            case "forgetMessage" -> {mail.forgetMessage(account,required(o,"folder"),required(o,"validity"),o.optLong("uid",-1));yield yes();}
            default -> throw new MailFailure("INVALID_INPUT");
        };
    }
}

package de.familyprojekt.privatebrain.pro;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.security.MessageDigest;
import java.util.*;
import org.json.*;

/** Real disk/crypto/protocol-state tests. OS DPAPI and the installed host are tested on Windows. */
public final class EngineTests {
    static int count;
    static final String PASSWORD = "Tresor-Test-ä-123456";
    static void ok(boolean value, String name) { if (!value) throw new AssertionError(name); count++; System.out.println("PASS " + name); }
    interface Work { void run() throws Exception; }
    static void fails(String code, Work work) throws Exception {
        try { work.run(); throw new AssertionError("Expected " + code); }
        catch (Exception error) { if (!code.equals(error.getMessage())) throw error; }
        count++; System.out.println("PASS failure " + code);
    }
    static final class TestProtection implements DesktopState.Protection {
        final byte[] key = VaultCrypto.random(32); boolean broken;
        public byte[] protect(String binding, byte[] plain) throws Exception {
            if (broken) throw new IOException("test failure");
            return VaultCrypto.seal(key, plain, binding.getBytes(StandardCharsets.UTF_8));
        }
        public byte[] unprotect(String binding, byte[] sealed) throws Exception {
            if (broken) throw new IOException("test failure");
            return VaultCrypto.open(key, sealed, binding.getBytes(StandardCharsets.UTF_8));
        }
    }
    static Map<String,String> snapshot(Path root) throws Exception {
        Map<String,String> result = new TreeMap<>();
        try (var files = Files.walk(root)) {
            for (Path p : files.filter(Files::isRegularFile).toList())
                result.put(root.relativize(p).toString(), VaultCrypto.hex(MessageDigest.getInstance("SHA-256").digest(Files.readAllBytes(p))));
        }
        return result;
    }
    static void catalog(Vault v, String text) throws Exception {
        String ticket = v.catalogBegin(); v.catalogAppend(ticket, 0, text.getBytes(StandardCharsets.UTF_8)); v.catalogFinish(ticket);
    }
    static Map<String,String> query(java.net.URI uri) {
        Map<String,String> fields=new HashMap<>();
        for(String entry:uri.getRawQuery().split("&")){String[] kv=entry.split("=",2);fields.put(java.net.URLDecoder.decode(kv[0],StandardCharsets.UTF_8),java.net.URLDecoder.decode(kv[1],StandardCharsets.UTF_8));}
        return fields;
    }
    static int callback(String redirect,String query)throws Exception {
        java.net.HttpURLConnection c=(java.net.HttpURLConnection)new java.net.URL(redirect+"?"+query).openConnection();
        c.setConnectTimeout(3000);c.setReadTimeout(3000);try{return c.getResponseCode();}finally{c.disconnect();}
    }
    static void oauth(DesktopState state)throws Exception {
        String client="123456-test.apps.googleusercontent.com";int[] exchanges={0},rejected={0};
        java.util.concurrent.atomic.AtomicReference<Map<String,String>> authorization=new java.util.concurrent.atomic.AtomicReference<>();
        java.util.concurrent.atomic.AtomicReference<Throwable> browserFailure=new java.util.concurrent.atomic.AtomicReference<>();
        DesktopOAuth.Browser browser=url->{
            java.net.URI uri=java.net.URI.create(url);Map<String,String> f=query(uri);authorization.set(f);
            ok(uri.getHost().equals("accounts.google.com")&&f.get("client_id").equals(client)&&f.get("code_challenge_method").equals("S256"),"authorization uses the desktop client and S256 in the system browser");
            Thread thread=new Thread(()->{try{
                if(callback(f.get("redirect_uri"),"code=spoof&state=wrong")==400)rejected[0]++;
                callback(f.get("redirect_uri"),"code=accepted&state="+f.get("state"));
            }catch(Throwable e){browserFailure.set(e);}});thread.start();
        };
        EncryptedMailStore store=new EncryptedMailStore(state);
        DesktopOAuth oauth=new DesktopOAuth(client,store,browser,fields->{
            exchanges[0]++;
            if(fields.get("grant_type").equals("authorization_code")){
                ok(fields.get("code").equals("accepted")&&DesktopOAuth.challenge(fields.get("code_verifier")).equals(authorization.get().get("code_challenge")),"only the verified callback is exchanged with its matching PKCE verifier");
                return new JSONObject().put("access_token","test-access").put("refresh_token","test-refresh").put("expires_in",3600).put("scope",DesktopOAuth.MAIL_SCOPE+" "+DesktopOAuth.EMAIL_SCOPE);
            }
            return new JSONObject().put("access_token","test-refreshed").put("expires_in",3600);
        },token->"person@gmail.com");
        ok(oauth.authorize("person@googlemail.com").equals("person@googlemail.com")&&browserFailure.get()==null&&rejected[0]==1,"wrong state rejected; verified Googlemail alias preserved");
        ok(oauth.token("person@gmail.com").equals("test-access")&&exchanges[0]==1,"valid native access token reused without another browser login");
        oauth.invalidate("test-access");
        ok(oauth.token("person@gmail.com").equals("test-refreshed")&&exchanges[0]==2,"rejected access token refreshed with the same desktop client");
        DesktopOAuth restart=new DesktopOAuth(client,store,url->{throw new AssertionError("unexpected browser");},fields->{throw new AssertionError("unexpected exchange");},token->"person@gmail.com");
        ok(restart.token("person@gmail.com").equals("test-refreshed"),"restart restores tokens through the encrypted native store");
        fails("GMAIL_AUTH_REQUIRED",()->restart.token("other@gmail.com"));
        DesktopOAuth denied=new DesktopOAuth(client,store,url->{Map<String,String> f=query(java.net.URI.create(url));new Thread(()->{try{callback(f.get("redirect_uri"),"error=access_denied&state="+f.get("state"));}catch(Exception e){throw new RuntimeException(e);}}).start();},fields->{throw new AssertionError("denied code exchanged");},token->"person@gmail.com");
        fails("CANCELLED",()->denied.authorize(null));
        fails("GMAIL_DESKTOP_CLIENT_REQUIRED",()->new DesktopOAuth("",store,browser).authorize(null));
    }
    static void pdf(Path root)throws Exception {
        Path file=root.resolve("native-preview.pdf");
        try(var document=new org.apache.pdfbox.pdmodel.PDDocument()){
            var page=new org.apache.pdfbox.pdmodel.PDPage();document.addPage(page);
            try(var content=new org.apache.pdfbox.pdmodel.PDPageContentStream(document,page)){
                content.setNonStrokingColor(java.awt.Color.BLUE);content.addRect(40,40,200,200);content.fill();
            }
            document.save(file.toFile());
        }
        try(DesktopPdf preview=new DesktopPdf()){
            JSONObject opened=preview.open(file.toFile());String id=opened.getString("id");
            ok(opened.getInt("pages")==1,"isolated renderer opens a real PDF");
            JSONObject page=preview.page(id,0,900);
            byte[] png=Base64.decode(page.getString("data"),Base64.NO_WRAP);
            var image=javax.imageio.ImageIO.read(new ByteArrayInputStream(png));
            ok(image!=null&&image.getWidth()>=320&&image.getWidth()<=2048&&image.getHeight()<=2048,"PDF worker returns a bounded real PNG page");
            ok((image.getRGB(100,image.getHeight()-100)&0xffffff)==0x0000ff,"PDF page content is actually rendered");
            preview.close(id);fails("PDF_UNAVAILABLE",()->preview.page(id,0,900));
            Path bad=root.resolve("broken.pdf");Files.writeString(bad,"not a PDF");fails("PDF_UNAVAILABLE",()->preview.open(bad.toFile()));
            ok(preview.open(file.toFile()).getInt("pages")==1,"a malformed PDF does not break later rendering or the vault engine");
        }
    }
    static void folders(Path root,DesktopState state)throws Exception {
        Path source=Files.createDirectories(root.resolve("source-folder/nested"));
        Files.writeString(source.resolve("note.txt"),"source text");
        DesktopFolders folders=new DesktopFolders(state);
        JSONObject picked=folders.source(source.getParent().toString());JSONObject item=picked.getJSONArray("items").getJSONObject(0);
        ok(item.getString("path").equals("source-folder/nested/note.txt")&&new String(folders.read(item.getString("id"),0),StandardCharsets.UTF_8).equals("source text"),"chosen folder reads bounded bytes with the original relative path");
        Files.writeString(source.resolve("note.txt"),"a changed source must be selected again");
        fails("FILE_CHANGED",()->folders.read(item.getString("id"),0));folders.finish();
        fails("INVALID_INPUT",()->folders.read(item.getString("id"),0));
        Path library=Files.createDirectory(root.resolve("library"));folders.library(library.toString());
        byte[] data="verified library copy".getBytes(StandardCharsets.UTF_8);String hash=VaultCrypto.hex(MessageDigest.getInstance("SHA-256").digest(data));
        OriginalFileStore originals=new OriginalFileStore(state);JSONObject started=originals.begin(hash,data.length,"source.txt","text/plain");
        originals.append(started.getString("ticket"),0,data);originals.finish(started.getString("ticket"));
        for(String name:new String[]{"CON.pdf","😀".repeat(150)+".PDF","Ж".repeat(220)+".txt","e\u0301".repeat(250)+".pdf"}){
            JSONObject copied=folders.copy(hash,name);String safe=copied.getString("name");
            ok(safe.length()<=160&&safe.getBytes(StandardCharsets.UTF_8).length<=200&&java.text.Normalizer.isNormalized(safe,java.text.Normalizer.Form.NFC)&&Arrays.equals(Files.readAllBytes(library.resolve(safe)),data),"real library copy handles reserved and long Unicode names");
            String next=folders.copy(hash,name).getString("name");ok(!next.equals(safe)&&Files.exists(library.resolve(safe)),"existing library file remains intact on a duplicate name");
        }
        folders.pause();ok(!folders.copy(hash,"paused.txt").getBoolean("copied"),"pausing keeps originals and previously made copies");
        DesktopFolders reopened=new DesktopFolders(state);ok(!reopened.state().getBoolean("enabled")&&reopened.state().getBoolean("configured")&&reopened.state().getString("name").equals("library"),"pause preserves the destination across reopen");
        ok(reopened.resume().getBoolean("enabled")&&new DesktopFolders(state).state().getBoolean("enabled"),"resume verifies the remembered destination and persists enabled state");
        ok(reopened.copy(hash,"resumed.txt").getBoolean("copied")&&Arrays.equals(Files.readAllBytes(library.resolve("resumed.txt")),data),"resumed library writes exact additional bytes without reselection");
        try(var names=Files.list(library)){ok(names.noneMatch(path->path.getFileName().toString().startsWith(".private-brain-copy-check-")),"resume removes its temporary access probe");}
        reopened.pause();Path absent=Files.createDirectory(root.resolve("gone-library"));reopened.library(absent.toString());reopened.pause();Files.delete(absent);
        try{reopened.resume();throw new AssertionError("missing destination was re-enabled");}catch(IOException expected){}
        ok(!new DesktopFolders(state).state().getBoolean("enabled")&&new DesktopFolders(state).state().getString("name").equals("gone-library")&&Arrays.equals(originals.read(hash,0),data),"failed resume keeps copying off and preserves originals and selected destination");
    }
    static void service(Path root,Path repository)throws Exception {
        Path resources=Files.createDirectory(root.resolve("resources")),chosen=Files.createDirectory(root.resolve("api-vault"));
        Files.copy(repository.resolve("windows/gmail-desktop.json"),resources.resolve("gmail-desktop.json"));
        Files.copy(repository.resolve("tools/native/semantic-model.json"),resources.resolve("semantic-model.json"));
        DesktopService service=new DesktopService(new DesktopState(root.resolve("api-device"),new TestProtection()),resources,(method,options)->switch(method){
            case "folder" -> new JSONObject().put("path",chosen.toString());
            case "password" -> new JSONObject().put("password",PASSWORD).put("repeat",PASSWORD).put("notice",true).put("remember",true);
            case "metered" -> new JSONObject().put("metered",true);
            case "key" -> new JSONObject().put("password","fixture-only-protection-key-not-real");
            default -> throw new IOException("unexpected native operation");
        });
        JSONObject created=service.call("ProVault","choose",new JSONObject());
        ok(created.getBoolean("created")&&created.getJSONObject("state").getBoolean("unlocked"),"vault choice uses the same created/state response contract as Android");
        service.call("ProVault","lock",new JSONObject());JSONObject unlocked=service.call("ProVault","unlock",new JSONObject());
        ok(unlocked.getBoolean("unlocked")&&unlocked.getJSONObject("state").getBoolean("unlocked"),"vault unlock uses the same unlocked/state response contract as Android");
        JSONObject opened=service.call("ProVault","choose",new JSONObject());
        ok(opened.getBoolean("opened")&&opened.getJSONObject("restored").getInt("accounts")==0,"opening another device folder reports restored account/draft state");
        byte[] large=new byte[180000];new Random(12).nextBytes(large);String hash=VaultCrypto.hex(MessageDigest.getInstance("SHA-256").digest(large));
        JSONObject begun=service.call("ProFiles","beginImport",new JSONObject().put("hash",hash).put("size",large.length).put("name","api-import.bin"));
        service.call("ProFiles","appendImport",new JSONObject().put("ticket",begun.getString("ticket")).put("offset",0).put("data",Base64.encodeToString(large,Base64.NO_WRAP)));
        service.call("ProFiles","finishImport",new JSONObject().put("ticket",begun.getString("ticket")));
        JSONObject read=service.call("ProFiles","readOriginal",new JSONObject().put("hash",hash).put("offset",0));
        ok(Arrays.equals(large,Base64.decode(read.getString("data"),Base64.NO_WRAP)),"real plugin transfer accepts a full native block instead of truncating to a text-field limit");
        JSONObject protection=service.call("ProProtect","checkHashes",new JSONObject().put("items",new JSONArray().put(hash)));
        ok(protection.has("items"),"protection adapter accepts the actual frontend items contract");
        JSONObject key=service.call("ProProtect","setKey",new JSONObject().put("service","virustotal"));
        ok(key.getBoolean("saved")&&!key.getBoolean("removed")&&key.has("state")&&!key.toString().contains("fixture-only-protection-key-not-real"),"native protection key commit returns the same saved/state contract without exposing the key");
        service.call("ProSemantic","markLoading",new JSONObject());service.call("DesktopInternal","rendererGone",new JSONObject());
        ok(service.call("ProSemantic","getState",new JSONObject()).getInt("crashes")==1,"renderer loss during model startup persists a guard against automatic retry");
        service.call("DesktopInternal","rendererGone",new JSONObject());
        ok(service.call("ProSemantic","getState",new JSONObject()).getInt("crashes")==1,"repeated renderer notices do not count the same interrupted model startup twice");
        service.call("ProSemantic","clearCrash",new JSONObject());ok(service.call("ProSemantic","getState",new JSONObject()).getInt("crashes")==0,"only an explicit retry clears the model crash guard");
    }
    static void tls(DesktopState state)throws Exception {
        AppNetwork.setOffline(state,false);
        try(TestMailTlsServer server=new TestMailTlsServer("test",false,false)){
            var client=javax.mail.Session.getInstance(MailAccount.properties()).getStore("imaps");boolean rejected=false;
            try{client.connect("localhost",server.port,"test","not-a-real-password");}catch(Exception expected){rejected=true;}finally{client.close();}
            server.await();ok(rejected&&server.authentications.get()==0,"untrusted TLS is rejected before any IMAP authentication");
        }
        try(TestMailTlsServer server=new TestMailTlsServer("test",false,false)){
            var properties=MailAccount.properties();properties.put("mail.imaps.ssl.socketFactory",server.trustedClient);
            var client=javax.mail.Session.getInstance(properties).getStore("imaps");boolean rejected=false;
            try{client.connect(server.numericHost(),server.port,"test","not-a-real-password");}catch(Exception expected){rejected=true;}finally{client.close();}
            server.await();ok(rejected&&server.authentications.get()==0,"a trusted test issuer still cannot bypass hostname validation");
        }
        for(boolean smtp:new boolean[]{false,true})try(TestMailTlsServer server=new TestMailTlsServer("test",smtp,false,true)){
            String protocol=smtp?"smtps":"imaps";var properties=MailAccount.properties("oauth2");properties.put("mail."+protocol+".ssl.socketFactory",server.trustedClient);
            var session=javax.mail.Session.getInstance(properties);
            try(var client=smtp?session.getTransport(protocol):session.getStore(protocol)){
                client.connect("localhost",server.port,TestMailTlsServer.OAUTH_USER,TestMailTlsServer.OAUTH_TOKEN);
                ok(client.isConnected(),"real "+protocol+" verified TLS connection accepts XOAUTH2 without password fallback");
            }
            server.await();ok(server.authentications.get()==1,"shared Android TLS fixture verifies exactly one "+protocol+" OAuth authentication");
        }
        for(boolean loss:new boolean[]{false,true})try(TestMailTlsServer server=new TestMailTlsServer("test",true,loss)){
            var properties=MailAccount.properties();properties.put("mail.smtps.ssl.socketFactory",server.trustedClient);var session=javax.mail.Session.getInstance(properties);
            MailAccount account=new MailAccount(new JSONObject().put("provider","hetzner").put("email","sender@example.invalid").put("password","fixture-only").put("imap","mail.example.invalid").put("smtp","mail.example.invalid"));
            JSONObject draft=new JSONObject().put("submission",UUID.randomUUID().toString()).put("to","receiver@example.invalid").put("bcc","hidden@example.invalid").put("subject","TLS proof").put("text","local fixture only").put("attachments",new JSONArray());
            byte[] raw=MailMime.bytes(MailMime.compose(account,draft,session));int[] connects={0};
            MailOutbox.Delivery delivery=new MailOutbox.Delivery(){
                com.sun.mail.smtp.SMTPTransport client;
                public void connect()throws Exception{connects[0]++;client=(com.sun.mail.smtp.SMTPTransport)session.getTransport("smtps");client.connect("localhost",server.port,"test","fixture-only");}
                public void send(byte[] data)throws Exception{var message=new javax.mail.internet.MimeMessage(session,new ByteArrayInputStream(data));client.sendMessage(message,message.getAllRecipients());}
                public void close(){try{if(client!=null)client.close();}catch(Exception ignored){}}
            };
            var store=new EncryptedMailStore(state);JSONObject result=new MailOutbox(store).send(account.id,draft,raw,delivery);
            ok(result.getString("status").equals(loss?"uncertain":"sent"),"real TLS SMTP delivery keeps its "+(loss?"uncertain":"confirmed")+" result");
            JSONObject repeated=new MailOutbox(new EncryptedMailStore(state)).send(account.id,draft,raw,delivery);server.await();
            ok(repeated.getString("status").equals(result.getString("status"))&&connects[0]==1&&server.deliveries.get()==1&&!server.leakedBcc.get(),"reopening the store cannot resend SMTP DATA or expose Bcc headers");
        }
    }
    static void updatesAndExports(Path root,DesktopState state)throws Exception {
        ok("ort-wasm-simd.wasm".equals(BundledRoutes.file(BundledRoutes.PREFIX+"/dist/ort-wasm-simd.wasm"))&&"transformers.min.js".equals(BundledRoutes.file(BundledRoutes.PREFIX+"/dist/transformers.min.js?cache=1")),"actual model library and WASM URLs use Android's shared local routing rules");
        ok(BundledRoutes.file(BundledRoutes.PREFIX+"-foreign/dist/transformers.min.js")==null&&BundledRoutes.modelPath(BundledRoutes.MODEL_PREFIX+"../secrets")==null,"similar CDN packages and traversing model paths are never mapped to local files");
        String version="1.0.0-preview.30",tag="windows-v"+version,name="Private-Brain-Pro-Windows-"+version+"-x64-setup.exe";
        String url="https://github.com/"+UpdatePolicy.REPOSITORY+"/releases/download/"+tag+"/"+name;
        JSONObject asset=new JSONObject().put("name",name).put("browser_download_url",url).put("state","uploaded").put("size",100);
        JSONObject release=new JSONObject().put("tag_name",tag).put("draft",false).put("prerelease",true).put("assets",new JSONArray().put(asset));
        JSONObject available=DesktopUpdates.select(new JSONArray().put(release),"1.0.0-preview.29");
        ok(available.getString("status").equals("available")&&available.getString("url").equals(url),"Windows update selects only a canonical newer installer in its own channel");
        JSONObject android=new JSONObject(release.toString()).put("tag_name","v"+version);
        JSONObject foreign=new JSONObject(release.toString());foreign.getJSONArray("assets").getJSONObject(0).put("browser_download_url","https://example.org/setup.exe");
        JSONObject draft=new JSONObject(release.toString()).put("draft",true);
        ok(DesktopUpdates.select(new JSONArray().put(android).put(foreign).put(draft),"1.0.0-preview.29").getString("status").equals("current"),"Android releases, drafts and foreign download URLs never enter the Windows channel");
        fails("UPDATE_NOT_CHECKED",()->new DesktopUpdates().download());
        Path source=root.resolve("export-original.txt");Files.writeString(source,"read-only source bytes");
        Path staged=new DesktopExports(state).stage(source.toFile(),"Ж".repeat(140)+".pdf");
        ok(staged.getFileName().toString().endsWith(".pdf")&&Files.readString(staged).equals(Files.readString(source)),"verified export keeps its filename type and original bytes");
        Path existing=root.resolve("existing.txt");Files.writeString(existing,"previous data");
        try{DesktopExports.copy(source,existing);throw new AssertionError("existing export overwritten");}catch(FileAlreadyExistsException expected){}
        ok(Files.readString(existing).equals("previous data")&&Files.readString(source).equals("read-only source bytes"),"an existing export and the source survive a failed CREATE_NEW copy");
    }
    static void mailNames(Path root)throws Exception {
        for(String value:new String[]{"a"+"😀".repeat(120)+".pdf","Ж".repeat(200)+".PDF","e\u0301".repeat(200)+".pdf"}){
            String name=MailMime.filename(value);
            ok(name.toLowerCase(Locale.ROOT).endsWith(".pdf")&&name.length()<=160&&name.getBytes(StandardCharsets.UTF_8).length<=200&&java.text.Normalizer.isNormalized(name,java.text.Normalizer.Form.NFC)&&name.codePoints().noneMatch(cp->cp>=0xd800&&cp<=0xdfff),"shared MIME filename preserves type and complete Unicode characters");
            Path file=root.resolve(UUID.randomUUID()+"-"+name);Files.writeString(file,"filename proof");
            ok(Files.readString(file).equals("filename proof"),"shared MIME filename works with the vault export prefix on the real filesystem");
        }
        String shared=ShareInbox.safeName("a"+"😀".repeat(100)+".pdf","file");
        ok(shared.endsWith(".pdf")&&shared.length()<=120&&shared.codePoints().noneMatch(cp->cp>=0xd800&&cp<=0xdfff),"shared incoming name also preserves complete Unicode characters");
    }
    public static void main(String[] args) throws Exception {
        Path root = Files.createTempDirectory("pb-engine-");
        TestProtection protection = new TestProtection();
        DesktopState state = new DesktopState(root.resolve("device-a"), protection);
        EncryptedMailStore store = new EncryptedMailStore(state);
        store.write("accounts", new JSONObject().put("items", new JSONArray()).put("private", "not plaintext"));
        ok(!Files.readString(root.resolve("device-a/native-mail-v1/accounts.dat"), java.nio.charset.StandardCharsets.ISO_8859_1).contains("not plaintext"), "device store is encrypted");
        protection.broken = true;
        fails("VAULT_UNAVAILABLE", () -> store.read("accounts"));
        try { store.write("accounts", new JSONObject().put("private", "replacement")); throw new AssertionError(); } catch (IOException expected) { }
        protection.broken = false;
        ok(store.read("accounts").getString("private").equals("not plaintext"), "failed protection preserves prior account data");
        Path chosen = Files.createDirectory(root.resolve("Speicher-ä-😀"));
        Vault vault = new Vault(state, "vault-a", "unused");
        vault.create(chosen.toString(), PASSWORD, false);
        catalog(vault, "first catalog"); catalog(vault, "second catalog");
        Path folder = chosen.resolve("Private Brain");
        ok(Files.isDirectory(folder.resolve("Anhänge")) && Files.exists(folder.resolve("tresor.json")), "real portable vault folder and readable directory names");
        vault.writeDocument(Vault.LISTS, "test-list", "protected list".getBytes(StandardCharsets.UTF_8));
        byte[] original = "Original-ä-😀".getBytes(StandardCharsets.UTF_8);
        String hash = VaultCrypto.hex(MessageDigest.getInstance("SHA-256").digest(original));
        Path source = root.resolve("original.txt"); Files.write(source, original);
        vault.copyOriginal(hash, source.toFile(), new JSONObject().put("name", "original.txt").put("type", "text/plain"));
        Map<String,String> before = snapshot(folder);
        DesktopState other = new DesktopState(root.resolve("device-b"), new TestProtection());
        Vault reopened = new Vault(other, "vault-b", "unused");
        fails("VAULT_PASSWORD_WRONG", () -> reopened.open(chosen.toString(), "wrong password", false));
        ok(before.equals(snapshot(folder)), "wrong password changes no file in the portable folder");
        reopened.open(chosen.toString(), PASSWORD, false);
        ok(new String(reopened.catalogRead(2,0),StandardCharsets.UTF_8).equals("second catalog"), "new device restores the same catalog with its password");
        ok(new String(reopened.readDocument(Vault.LISTS,"test-list",1024),StandardCharsets.UTF_8).equals("protected list"), "protection lists use shared portable format");
        OriginalFileStore originals = new OriginalFileStore(other);
        ok(reopened.restoreOriginal(hash, originals) && Arrays.equals(Files.readAllBytes(originals.file(hash).toPath()),original), "original restored and verified on another device");
        Path unplugged=root.resolve("temporarily-unavailable-drive");Files.move(chosen,unplugged);
        fails("VAULT_FOLDER_UNAVAILABLE",()->reopened.catalogInfo());
        ok(!reopened.state().optBoolean("reachable",true),"a missing drive reports unavailable without replacing the selected folder");
        Files.move(unplugged,chosen);
        ok(new String(reopened.catalogRead(2,0),StandardCharsets.UTF_8).equals("second catalog")&&before.equals(snapshot(folder)),"returning drive restores access to the unchanged portable folder");
        Path newest = folder.resolve("Katalog/katalog-2.pbv"); byte[] damaged = Files.readAllBytes(newest); damaged[damaged.length-1] ^= 1; Files.write(newest,damaged);
        ok(reopened.catalogInfo().getLong("version")==1, "damaged newest catalog falls back to prior backup");
        Path first = folder.resolve("Katalog/katalog-1.pbv"); Files.write(first,new byte[]{1,2,3});
        fails("VAULT_DAMAGED", () -> reopened.catalogInfo());
        Path list = folder.resolve("Schutzlisten/test-list-1.pbv"); Files.write(list,new byte[]{1,2,3});
        fails("VAULT_DAMAGED", () -> reopened.readDocument(Vault.LISTS,"test-list",1024));
        // Partial/truncated/chunk-boundary streams are authenticated by the unchanged Android codec.
        byte[] key = VaultCrypto.random(32);
        for(int size : new int[]{0,1,VaultCrypto.CHUNK,VaultCrypto.CHUNK+1}) {
            byte[] data = new byte[size]; new Random(size).nextBytes(data);
            Path p = root.resolve("stream-"+size);
            try(VaultCrypto.Writer writer = new VaultCrypto.Writer(new FileOutputStream(p.toFile()),key,"test/id",size)) { writer.write(data); }
            try(VaultCrypto.Reader reader = new VaultCrypto.Reader(java.nio.channels.FileChannel.open(p),null,key,"test/id")) {
                ok(Arrays.equals(data,VaultCrypto.readAll(reader,size)), "PBV1 authenticated stream size "+size);
            }
            try(VaultCrypto.Reader reader = new VaultCrypto.Reader(java.nio.channels.FileChannel.open(p),null,key,"wrong/id")) { throw new AssertionError("wrong AAD accepted"); }
            catch(VaultCrypto.Failure expected) { ok(expected.getMessage().equals("VAULT_DAMAGED"),"wrong logical binding rejected "+size); }
        }
        JSONObject draft = new JSONObject().put("submission", UUID.randomUUID().toString()).put("to","person@example.org")
            .put("subject","test").put("text","Hello").put("attachments",new JSONArray());
        int[] sends={0}; String account=UUID.randomUUID().toString();
        MailOutbox.Delivery ambiguous = new MailOutbox.Delivery() {
            public void connect(){} public void send(byte[] bytes)throws Exception{sends[0]++;throw new IOException("lost SMTP reply");}public void close(){}
        };
        ok(new MailOutbox(store).send(account,draft,new byte[]{1},ambiguous).getString("status").equals("uncertain"),"ambiguous SMTP reports uncertainty");
        DesktopState restart = new DesktopState(root.resolve("device-a"), protection);
        ok(new MailOutbox(new EncryptedMailStore(restart)).send(account,draft,new byte[]{1},ambiguous).getString("status").equals("uncertain")&&sends[0]==1,"restart never resends an ambiguous SMTP attempt");
        AppNetwork.initialize(state);
        try(java.net.ServerSocket listener=new java.net.ServerSocket(0,1,java.net.InetAddress.getLoopbackAddress());java.net.Socket client=new java.net.Socket("127.0.0.1",listener.getLocalPort());java.net.Socket accepted=listener.accept()){
            AppNetwork.track(client);AppNetwork.setOffline(state,true);
            ok(client.isClosed(),"offline switch closes a real active socket");
            fails("APP_OFFLINE",AppNetwork::check);
        }
        AppNetwork.setOffline(state,false);
        oauth(new DesktopState(root.resolve("oauth-device"), new TestProtection()));
        pdf(root);
        folders(root,new DesktopState(root.resolve("folders-device"),new TestProtection()));
        service(root,Path.of(args[0]));
        mailNames(root);
        updatesAndExports(root,state);
        tls(state);
        DesktopState linkedState=new DesktopState(root.resolve("linked-device"),new TestProtection());
        Path link=linkedState.directory.resolve("originals-v1");
        if(!System.getProperty("os.name").startsWith("Windows"))Files.createSymbolicLink(link,folder);
        else{
            Process junction=new ProcessBuilder("cmd.exe","/d","/c","mklink","/J",link.toString(),folder.toString()).redirectErrorStream(true).start();
            junction.getInputStream().transferTo(OutputStream.nullOutputStream());
            ok(junction.waitFor()==0,"real NTFS junction fixture created without altering the target");
        }
        fails("VAULT_FOLDER_UNAVAILABLE",()->DesktopFiles.noLinks(link));
        OriginalFileStore linkedOriginals=new OriginalFileStore(linkedState);
        fails("VAULT_FOLDER_UNAVAILABLE",()->linkedOriginals.read("0".repeat(64),0));
        fails("VAULT_FOLDER_UNAVAILABLE",()->linkedOriginals.begin("0".repeat(64),10,"test.txt","text/plain"));
        Files.delete(link);
        System.out.println(count+" desktop engine checks passed; OS protection was an explicit test provider.");
    }
}

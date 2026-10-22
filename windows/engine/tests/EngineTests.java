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
        if(!System.getProperty("os.name").startsWith("Windows")){
            Path link=root.resolve("link");Files.createSymbolicLink(link,folder);
            fails("VAULT_FOLDER_UNAVAILABLE",()->DesktopFiles.noLinks(link));
        }
        System.out.println(count+" desktop engine checks passed; OS protection was an explicit test provider.");
    }
}

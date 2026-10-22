package de.familyprojekt.privatebrain.pro;

import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
import org.json.JSONObject;

/** Public desktop client: system browser, PKCE S256, random loopback port and state.
 * Tokens remain in the host's DPAPI store; the app page receives only account metadata. */
final class DesktopOAuth implements MailEngine.OAuthProvider {
    static final String MAIL_SCOPE="https://mail.google.com/", EMAIL_SCOPE="https://www.googleapis.com/auth/userinfo.email";
    interface Browser { void open(String url) throws Exception; }
    interface Exchange { JSONObject post(Map<String,String> fields) throws Exception; }
    interface Identity { String email(String token) throws Exception; }
    private final String client;
    private final EncryptedMailStore store;
    private final Browser browser;
    private final Exchange exchange;
    private final Identity identity;
    private final Map<String,JSONObject> cached=new HashMap<>();
    DesktopOAuth(String client, EncryptedMailStore store, Browser browser) {
        this(client,store,browser,DesktopOAuth::post,new GmailUserInfo()::email);
    }
    DesktopOAuth(String client, EncryptedMailStore store, Browser browser, Exchange exchange, Identity identity) {
        this.client=client;this.store=store;this.browser=browser;this.exchange=exchange;this.identity=identity;
    }
    private void configured() throws MailFailure {
        if(client==null||!client.matches("[0-9]+-[a-zA-Z0-9_-]+\\.apps\\.googleusercontent\\.com"))throw new MailFailure("GMAIL_DESKTOP_CLIENT_REQUIRED");
    }
    private String name(String email)throws Exception {
        return "oauth-"+VaultCrypto.hex(MessageDigest.getInstance("SHA-256").digest(GmailIdentity.key(email).getBytes(StandardCharsets.UTF_8)));
    }
    private static String random(){return java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(VaultCrypto.random(32));}
    static String challenge(String verifier)throws Exception{return java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(MessageDigest.getInstance("SHA-256").digest(verifier.getBytes(StandardCharsets.US_ASCII)));}
    static String form(Map<String,String> fields){
        return fields.entrySet().stream().map(e->URLEncoder.encode(e.getKey(),StandardCharsets.UTF_8)+"="+URLEncoder.encode(e.getValue(),StandardCharsets.UTF_8)).collect(java.util.stream.Collectors.joining("&"));
    }
    private static Map<String,String> query(String value)throws MailFailure {
        Map<String,String> out=new HashMap<>();
        try { for(String item:value.split("&")) {
            String[] kv=item.split("=",2);String k=URLDecoder.decode(kv[0],StandardCharsets.UTF_8),v=kv.length==2?URLDecoder.decode(kv[1],StandardCharsets.UTF_8):"";
            if(out.put(k,v)!=null)throw new IllegalArgumentException();
        }} catch(Exception e){throw new MailFailure("GMAIL_AUTH_REQUIRED");}
        return out;
    }
    synchronized String authorize(String expected)throws Exception {
        configured();AppNetwork.check();
        String verifier=random(), state=random(), path="/oauth/"+random();
        String code=null,redirect;
        try(ServerSocket listener=new ServerSocket(0,4,InetAddress.getByName("127.0.0.1"))){
            listener.setSoTimeout(1000);AppNetwork.track(listener);
            redirect="http://127.0.0.1:"+listener.getLocalPort()+path;
            Map<String,String> fields=new LinkedHashMap<>();
            fields.put("client_id",client);fields.put("redirect_uri",redirect);fields.put("response_type","code");
            fields.put("scope",MAIL_SCOPE+" "+EMAIL_SCOPE);fields.put("state",state);fields.put("code_challenge",challenge(verifier));
            fields.put("code_challenge_method","S256");fields.put("access_type","offline");fields.put("prompt","consent");
            if(expected!=null)fields.put("login_hint",GmailIdentity.checked(expected));
            browser.open("https://accounts.google.com/o/oauth2/v2/auth?"+form(fields));
            long deadline=System.nanoTime()+180_000_000_000L;int attempts=0;
            try {
                while(code==null&&System.nanoTime()<deadline&&attempts<32){
                    AppNetwork.check();Socket socket;
                    try{socket=listener.accept();}catch(SocketTimeoutException again){continue;}
                    attempts++;
                    try(socket){
                        socket.setSoTimeout(3000);ByteArrayOutputStream header=new ByteArrayOutputStream();int next;
                        while(header.size()<8192&&(next=socket.getInputStream().read())!=-1){header.write(next);byte[] b=header.toByteArray();int n=b.length;if(n>=4&&b[n-4]==13&&b[n-3]==10&&b[n-2]==13&&b[n-1]==10)break;}
                        String request=header.toString(StandardCharsets.US_ASCII);String[] lines=request.split("\r\n"),first=lines[0].split(" ");
                        boolean valid=first.length==3&&first[0].equals("GET")&&first[2].equals("HTTP/1.1")&&header.size()<8192;
                        valid &= Arrays.stream(lines).filter(l->l.regionMatches(true,0,"Host:",0,5)).map(l->l.substring(5).trim()).toList().equals(List.of("127.0.0.1:"+listener.getLocalPort()));
                        Map<String,String> values=Map.of();
                        try {URI uri=URI.create(first.length>1?first[1]:"");valid&=uri.getScheme()==null&&uri.getRawPath().equals(path)&&uri.getRawQuery()!=null;values=query(uri.getRawQuery()==null?"":uri.getRawQuery());}
                        catch(Exception invalid){valid=false;}
                        valid &= MessageDigest.isEqual(state.getBytes(StandardCharsets.US_ASCII),values.getOrDefault("state","").getBytes(StandardCharsets.US_ASCII));
                        String response=valid?"Private Brain Pro: Du kannst dieses Fenster jetzt schliessen.":"Diese Anmeldeantwort wurde nicht angenommen.";
                        byte[] body=response.getBytes(StandardCharsets.UTF_8);
                        socket.getOutputStream().write(((valid?"HTTP/1.1 200 OK":"HTTP/1.1 400 Bad Request")+"\r\nContent-Type: text/plain; charset=utf-8\r\nCache-Control: no-store\r\nContent-Security-Policy: default-src 'none'\r\nConnection: close\r\nContent-Length: "+body.length+"\r\n\r\n").getBytes(StandardCharsets.US_ASCII));socket.getOutputStream().write(body);
                        if(valid){if(values.containsKey("error"))throw new MailFailure("CANCELLED");code=values.get("code");if(code==null||code.isEmpty())throw new MailFailure("GMAIL_AUTH_REQUIRED");}
                    }catch(SocketTimeoutException ignored){/* A local probe never consumes the pending authorization. */}
                }
            }finally{AppNetwork.release(listener);}
        }
        if(code==null)throw new MailFailure("CANCELLED");
        JSONObject tokens=exchange.post(Map.of("client_id",client,"code",code,"code_verifier",verifier,"redirect_uri",redirect,"grant_type","authorization_code"));
        requireScopes(tokens.optString("scope"));
        String access=tokens.optString("access_token");if(access.isEmpty())throw new MailFailure("GMAIL_TOKEN_MISSING");
        String email=GmailIdentity.checked(identity.email(access));
        if(expected!=null&&!GmailIdentity.same(expected,email))throw new MailFailure("GMAIL_ACCOUNT_MISMATCH");
        if(tokens.optString("refresh_token").isEmpty())throw new MailFailure("GMAIL_CONSENT_REQUIRED");
        String account=expected==null?email:expected;
        JSONObject record=new JSONObject().put("email",account).put("client",client).put("refresh",tokens.getString("refresh_token"))
            .put("access",access).put("expires",expiry(tokens));
        store.write(name(account),record);cached.put(GmailIdentity.key(account),record);return account;
    }
    private static void requireScopes(String scope)throws MailFailure {
        Set<String> scopes=new HashSet<>(Arrays.asList(scope.split(" ")));
        if(!scopes.contains(MAIL_SCOPE)||!scopes.contains(EMAIL_SCOPE))throw new MailFailure("GMAIL_SCOPE_MISSING");
    }
    private static long expiry(JSONObject tokens)throws MailFailure {
        long seconds=tokens.optLong("expires_in",0);if(seconds<1||seconds>86400)throw new MailFailure("GMAIL_TOKEN_MISSING");
        return System.currentTimeMillis()+seconds*1000-30000;
    }
    @Override public synchronized String token(String email)throws Exception {
        configured();AppNetwork.check();String key=GmailIdentity.key(email);
        JSONObject record=cached.get(key);if(record==null)record=store.read(name(email));
        if(record==null||!client.equals(record.optString("client"))||!GmailIdentity.same(email,record.optString("email")))throw new MailFailure("GMAIL_AUTH_REQUIRED");
        if(record.optLong("expires")<=System.currentTimeMillis()){
            JSONObject tokens=exchange.post(Map.of("client_id",client,"refresh_token",record.getString("refresh"),"grant_type","refresh_token"));
            if(tokens.has("scope"))requireScopes(tokens.getString("scope"));
            String access=tokens.optString("access_token");if(access.isEmpty())throw new MailFailure("GMAIL_TOKEN_MISSING");
            JSONObject next=new JSONObject(record.toString()).put("access",access).put("expires",expiry(tokens));
            if(tokens.has("refresh_token"))next.put("refresh",tokens.getString("refresh_token"));
            store.write(name(email),next);record=next;
        }
        cached.put(key,record);return record.getString("access");
    }
    @Override public synchronized void invalidate(String token){for(JSONObject record:cached.values())if(token.equals(record.optString("access")))record.put("expires",0);}
    private static JSONObject post(Map<String,String> fields)throws Exception {
        AppNetwork.check();HttpURLConnection connection=(HttpURLConnection)new URL("https://oauth2.googleapis.com/token").openConnection();
        AutoCloseable cancellation=AppNetwork.track(connection::disconnect);
        try{
            connection.setInstanceFollowRedirects(false);connection.setUseCaches(false);connection.setConnectTimeout(15000);connection.setReadTimeout(20000);
            connection.setRequestMethod("POST");connection.setDoOutput(true);connection.setRequestProperty("Content-Type","application/x-www-form-urlencoded");
            byte[] body=form(fields).getBytes(StandardCharsets.US_ASCII);connection.setFixedLengthStreamingMode(body.length);
            try(OutputStream out=connection.getOutputStream()){out.write(body);}
            if(connection.getResponseCode()!=200)throw new MailFailure("GMAIL_AUTH_REQUIRED");
            try(InputStream in=connection.getInputStream()){byte[] bytes=in.readNBytes(65537);if(bytes.length>65536)throw new MailFailure("GMAIL_AUTH_REQUIRED");return new JSONObject(new String(bytes,StandardCharsets.UTF_8));}
        }finally{AppNetwork.release(cancellation);connection.disconnect();}
    }
}

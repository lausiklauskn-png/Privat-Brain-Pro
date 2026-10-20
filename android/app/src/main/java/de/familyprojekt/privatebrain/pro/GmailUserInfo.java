package de.familyprojekt.privatebrain.pro;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import javax.net.ssl.HttpsURLConnection;
import org.json.JSONObject;

/** Native-only fallback for a successful grant without legacy GoogleSignInAccount data. */
final class GmailUserInfo {
    static final String ENDPOINT="https://www.googleapis.com/oauth2/v2/userinfo";
    interface Connection { HttpsURLConnection open(URL url)throws Exception; }
    private final Connection connection;
    GmailUserInfo(){this(url->(HttpsURLConnection)url.openConnection());}
    GmailUserInfo(Connection connection){this.connection=connection;}
    String email(String token)throws Exception{
        if(token==null||token.isEmpty()||token.indexOf('\r')>=0||token.indexOf('\n')>=0)throw new MailFailure("GMAIL_TOKEN_MISSING");
        AppNetwork.check();
        HttpsURLConnection request=null;AutoCloseable cancellation=null;
        try{
            request=connection.open(new URL(ENDPOINT));
            HttpsURLConnection active=request;cancellation=AppNetwork.track(active::disconnect);
            request.setInstanceFollowRedirects(false);request.setUseCaches(false);
            request.setConnectTimeout(15000);request.setReadTimeout(20000);request.setRequestMethod("GET");
            request.setRequestProperty("Authorization","Bearer "+token);request.setRequestProperty("Accept","application/json");
            int status=request.getResponseCode();
            if(status==401)throw new MailFailure("GMAIL_TOKEN_REJECTED");
            if(status!=200)throw new MailFailure("GMAIL_ACCOUNT_UNAVAILABLE");
            if(request.getContentLengthLong()>65536)throw new MailFailure("GMAIL_ACCOUNT_UNAVAILABLE");
            ByteArrayOutputStream output=new ByteArrayOutputStream();
            try(InputStream input=request.getInputStream()){
                byte[] buffer=new byte[4096];int count;
                while((count=input.read(buffer))!=-1){if(output.size()+count>65536)throw new MailFailure("GMAIL_ACCOUNT_UNAVAILABLE");output.write(buffer,0,count);}
            }
            JSONObject info=new JSONObject(output.toString(StandardCharsets.UTF_8.name()));
            if(!Boolean.TRUE.equals(info.opt("verified_email")))throw new MailFailure("GMAIL_ACCOUNT_UNAVAILABLE");
            return GmailIdentity.checked(info.optString("email",null));
        }catch(AppNetwork.Blocked failure){throw failure;}
        catch(MailFailure failure){throw failure;}
        catch(Exception failure){throw new MailFailure("GMAIL_ACCOUNT_UNAVAILABLE");}
        finally{if(cancellation!=null)AppNetwork.release(cancellation);if(request!=null)request.disconnect();}
    }
}

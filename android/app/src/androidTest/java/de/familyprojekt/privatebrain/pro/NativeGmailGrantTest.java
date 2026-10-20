package de.familyprojekt.privatebrain.pro;

import android.app.PendingIntent;
import com.google.android.gms.auth.api.identity.AuthorizationResult;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import java.io.*;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.cert.Certificate;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import javax.net.ssl.HttpsURLConnection;
import org.junit.Test;
import org.junit.runner.RunWith;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class NativeGmailGrantTest {
    private AuthorizationResult result(String token,List<String> scopes,GoogleSignInAccount account){return new AuthorizationResult(null,token,null,scopes,account,(PendingIntent)null);}
    private GoogleSignInAccount account(String email){return GoogleSignInAccount.fromAccount(new android.accounts.Account(email,"com.google"));}
    @Test public void validGoogleGrantWithoutLegacyAccountUsesNativeVerifiedIdentity()throws Exception{
        AtomicInteger calls=new AtomicInteger();AuthorizationResult result=result("fixture-token",List.of(GmailAuthorization.MAIL_SCOPE),null);
        assertNull(result.toGoogleSignInAccount());
        GmailGrant grant=GmailGrant.read(result,"fixture@googlemail.com",token->{calls.incrementAndGet();assertEquals("fixture-token",token);return "fixture@gmail.com";});
        assertEquals("fixture@gmail.com",grant.email);assertEquals("fixture-token",grant.token);assertEquals(1,calls.get());
        GmailGrant known=GmailGrant.read(result("fixture-token",List.of(GmailAuthorization.MAIL_SCOPE),account("Fixture@googlemail.com")),"fixture@gmail.com",token->{fail("Unnecessary identity fetch");return null;});
        assertEquals("fixture@gmail.com",known.email);
        GmailTokenCache cache=new GmailTokenCache(()->0);cache.put(known.email,known.token);assertEquals("fixture-token",cache.get("FIXTURE@googlemail.com"));
        assertFalse(GmailIdentity.same("different@gmail.com",known.email));assertFalse(GmailIdentity.same("fixture@custom.example",known.email));assertFalse(GmailIdentity.same("fixture+different@gmail.com",known.email));
    }
    @Test public void incompleteGrantAndDifferentAccountNeverBecomeUsableCredentials()throws Exception{
        AtomicInteger calls=new AtomicInteger();GmailGrant.Identity identity=token->{calls.incrementAndGet();return "fixture@gmail.com";};
        try{GmailGrant.read(result(null,List.of(GmailAuthorization.MAIL_SCOPE),null),null,identity);fail();}catch(MailFailure e){assertEquals("GMAIL_TOKEN_MISSING",e.code);}
        try{GmailGrant.read(result("fixture-token",List.of("openid"),null),null,identity);fail();}catch(MailFailure e){assertEquals("GMAIL_SCOPE_MISSING",e.code);}
        assertEquals(0,calls.get());
        try{GmailGrant.read(result("fixture-token",List.of(GmailAuthorization.MAIL_SCOPE),account("different@gmail.com")),"fixture@gmail.com",identity);fail();}catch(MailFailure e){assertEquals("GMAIL_ACCOUNT_MISMATCH",e.code);}
        for(int language=0;language<4;language++){
            String message=GmailMessages.error("GMAIL_SMTP_AUTH_FAILED",language);assertTrue(message.contains("GMAIL_SMTP_AUTH_FAILED"));assertFalse(message.contains("fixture-token"));
            assertFalse(message.equals(GmailMessages.error("GMAIL_SCOPE_MISSING",language)));
        }
        assertFalse(GmailMessages.error("secret-response fixture-token",0).contains("fixture-token"));
    }
    private static class Response extends HttpsURLConnection {
        final int status;final byte[] body;boolean disconnected;
        Response(URL url,int status,String body){super(url);this.status=status;this.body=body.getBytes(StandardCharsets.UTF_8);}
        public void connect(){}public void disconnect(){disconnected=true;}public boolean usingProxy(){return false;}
        public String getCipherSuite(){return "fixture";}public Certificate[] getLocalCertificates(){return null;}public Certificate[] getServerCertificates(){return null;}
        public int getResponseCode(){return status;}public InputStream getInputStream(){return new ByteArrayInputStream(body);}
    }
    @Test public void identityLookupUsesOnlyFixedHttpsAndRejectsRedirectsUnverifiedAndOversizedReplies()throws Exception{
        Response[] last=new Response[1];
        GmailUserInfo info=new GmailUserInfo(url->{assertEquals(GmailUserInfo.ENDPOINT,url.toString());return last[0]=new Response(url,200,"{\"email\":\"fixture@googlemail.com\",\"verified_email\":true}");});
        assertEquals("fixture@gmail.com",info.email("fixture-token"));assertTrue(last[0].disconnected);
        assertFalse(last[0].getInstanceFollowRedirects());assertFalse(last[0].getUseCaches());assertEquals("Bearer fixture-token",last[0].getRequestProperty("Authorization"));
        assertEquals(15000,last[0].getConnectTimeout());assertEquals(20000,last[0].getReadTimeout());
        for(int status:new int[]{302,401,403,500}){
            GmailUserInfo denied=new GmailUserInfo(url->last[0]=new Response(url,status,"{\"email\":\"fixture@gmail.com\",\"verified_email\":true}"));
            try{denied.email("fixture-token");fail("Unsuccessful HTTPS response accepted");}catch(MailFailure e){assertEquals(status==401?"GMAIL_TOKEN_REJECTED":"GMAIL_ACCOUNT_UNAVAILABLE",e.code);}
            assertTrue(last[0].disconnected);
        }
        for(String body:new String[]{"{}","{\"email\":\"fixture@gmail.com\",\"verified_email\":false}","{\"email\":\"fixture@gmail.com\",\"verified_email\":\"true\"}","{\"email\":\"fixture@gmail.com\\r\\nInjected: value\",\"verified_email\":true}","x".repeat(65537)}){
            GmailUserInfo invalid=new GmailUserInfo(url->new Response(url,200,body));
            try{invalid.email("fixture-token");fail("Unsafe identity accepted");}catch(MailFailure e){assertEquals("GMAIL_ACCOUNT_UNAVAILABLE",e.code);}
        }
    }
}

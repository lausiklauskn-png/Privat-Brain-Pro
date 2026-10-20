package de.familyprojekt.privatebrain.pro;

import android.accounts.Account;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.IntentSenderRequest;
import androidx.activity.result.contract.ActivityResultContracts;
import com.google.android.gms.auth.api.identity.*;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.common.api.Scope;
import com.google.android.gms.tasks.Tasks;
import java.util.Arrays;
import java.util.concurrent.TimeUnit;

/** Google Play services owns refresh tokens. Access tokens never cross the JS bridge. */
final class GmailAuthorization implements MailEngine.OAuthProvider {
    static final String MAIL_SCOPE = "https://mail.google.com/";
    interface Callback { void success(String email); void failure(String code); }
    private final AuthorizationClient client;
    private final ActivityResultLauncher<IntentSenderRequest> launcher;
    private Callback pending;
    private String expected;
    private final GmailTokenCache tokens = new GmailTokenCache();
    private final GmailUserInfo userInfo = new GmailUserInfo();
    private final java.util.concurrent.ExecutorService identityWorker = java.util.concurrent.Executors.newSingleThreadExecutor();
    private final android.os.Handler main = new android.os.Handler(android.os.Looper.getMainLooper());
    GmailAuthorization(MainActivity activity) {
        client = Identity.getAuthorizationClient(activity);
        launcher = activity.registerForActivityResult(new ActivityResultContracts.StartIntentSenderForResult(), result -> {
            if (pending == null) return;
            try {
                if (result.getResultCode() != android.app.Activity.RESULT_OK) { fail("CANCELLED");return; }
                complete(client.getAuthorizationResultFromIntent(result.getData()));
            } catch (Exception error) { fail(code(error)); }
        });
    }
    private AuthorizationRequest request(String email) {
        AuthorizationRequest.Builder builder = AuthorizationRequest.builder().setRequestedScopes(Arrays.asList(
            new Scope(MAIL_SCOPE), new Scope("https://www.googleapis.com/auth/userinfo.email")));
        if (email != null) builder.setAccount(new Account(email, "com.google"));
        return builder.build();
    }
    void consent(String email, Callback callback) {
        if (pending != null) { callback.failure("GMAIL_AUTH_BUSY");return; }
        pending = callback;expected = email;
        client.authorize(request(email)).addOnSuccessListener(result -> {
            if (pending != callback) return;
            try {
                if (result.hasResolution()) launcher.launch(new IntentSenderRequest.Builder(result.getPendingIntent()).build());
                else complete(result);
            } catch (Exception error) { fail(code(error)); }
        }).addOnFailureListener(error -> { if(pending==callback)fail(code(error)); });
    }
    private void complete(AuthorizationResult result) {
        Callback callback=pending;String requested=expected;if(callback==null)return;
        identityWorker.execute(()->{
            try{
                GmailGrant grant=grant(result,requested);
                main.post(()->{
                    if(pending!=callback)return;
                    tokens.put(grant.email,grant.token);pending=null;expected=null;callback.success(grant.email);
                });
            }catch(Exception error){main.post(()->{if(pending==callback)fail(code(error));});}
        });
    }
    private GmailGrant grant(AuthorizationResult result,String requested)throws Exception{
        try{return GmailGrant.read(result,requested,userInfo::email);}
        catch(MailFailure error){
            if(error.code.equals("GMAIL_TOKEN_REJECTED")&&result!=null&&result.getAccessToken()!=null)invalidate(result.getAccessToken());
            throw error;
        }
    }
    private void fail(String code) { Callback callback = pending;pending = null;expected = null;if (callback != null) callback.failure(code); }
    @Override public String token(String email) throws Exception {
        String cached=tokens.get(email);if(cached!=null)return cached;
        try {
            AuthorizationResult result = Tasks.await(client.authorize(request(email)), 20, TimeUnit.SECONDS);
            GmailGrant grant=grant(result,email);tokens.put(grant.email,grant.token);return grant.token;
        } catch (MailFailure error) { throw error; }
        catch (Exception error) { throw new MailFailure(code(error)); }
    }
    @Override public void invalidate(String token) {
        tokens.invalidate(token);
        try { Tasks.await(client.clearToken(ClearTokenRequest.builder().setToken(token).build()), 5, TimeUnit.SECONDS); }
        catch (Exception ignored) { /* Explicit reauthorization remains required; never resend automatically. */ }
    }
    void close() { tokens.clear();fail("CANCELLED");identityWorker.shutdownNow(); }
    static String code(Exception error) {
        if (error instanceof MailFailure) return ((MailFailure) error).code;
        Throwable source = error;while (source.getCause() != null && source.getCause() != source) source = source.getCause();
        if (source instanceof ApiException) {
            int code = ((ApiException) source).getStatusCode();
            if (code == 10) return "GMAIL_CONFIGURATION_REQUIRED";
            if (code == 16 || code == 12501) return "CANCELLED";
            if (code == 7) return "NETWORK_FAILED";
            return "GMAIL_API_"+code;
        }
        if (source instanceof java.util.concurrent.TimeoutException) return "NETWORK_FAILED";
        if (source instanceof java.util.concurrent.CancellationException) return "CANCELLED";
        return "GMAIL_AUTH_REQUIRED";
    }
}

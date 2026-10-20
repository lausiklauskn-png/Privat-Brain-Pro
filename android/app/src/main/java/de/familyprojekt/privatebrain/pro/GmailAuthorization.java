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
            if (pending == null) return;
            try {
                if (result.hasResolution()) launcher.launch(new IntentSenderRequest.Builder(result.getPendingIntent()).build());
                else complete(result);
            } catch (Exception error) { fail(code(error)); }
        }).addOnFailureListener(error -> fail(code(error)));
    }
    private void complete(AuthorizationResult result) throws Exception {
        String email = result.toGoogleSignInAccount().getEmail();
        if (result.getAccessToken() == null || !result.getGrantedScopes().contains(MAIL_SCOPE) || email == null ||
            (expected != null && !expected.equalsIgnoreCase(email))) throw new MailFailure("GMAIL_AUTH_REQUIRED");
        tokens.put(email,result.getAccessToken());
        Callback callback = pending;pending = null;expected = null;
        if (callback != null) callback.success(email);
    }
    private void fail(String code) { Callback callback = pending;pending = null;expected = null;if (callback != null) callback.failure(code); }
    @Override public String token(String email) throws Exception {
        String cached=tokens.get(email);if(cached!=null)return cached;
        try {
            AuthorizationResult result = Tasks.await(client.authorize(request(email)), 20, TimeUnit.SECONDS);
            if (result.hasResolution() || result.getAccessToken() == null || !result.getGrantedScopes().contains(MAIL_SCOPE))
                throw new MailFailure("GMAIL_AUTH_REQUIRED");
            String selected = result.toGoogleSignInAccount().getEmail();
            if (selected == null || !email.equalsIgnoreCase(selected)) throw new MailFailure("GMAIL_AUTH_REQUIRED");
            tokens.put(email,result.getAccessToken());
            return result.getAccessToken();
        } catch (MailFailure error) { throw error; }
        catch (Exception error) { throw new MailFailure(code(error)); }
    }
    @Override public void invalidate(String token) {
        tokens.invalidate(token);
        try { Tasks.await(client.clearToken(ClearTokenRequest.builder().setToken(token).build()), 5, TimeUnit.SECONDS); }
        catch (Exception ignored) { /* Explicit reauthorization remains required; never resend automatically. */ }
    }
    void close() { tokens.clear();fail("CANCELLED"); }
    static String code(Exception error) {
        if (error instanceof MailFailure) return ((MailFailure) error).code;
        Throwable source = error;while (source.getCause() != null && source.getCause() != source) source = source.getCause();
        if (source instanceof ApiException) {
            int code = ((ApiException) source).getStatusCode();
            if (code == 10) return "GMAIL_CONFIGURATION_REQUIRED";
            if (code == 16 || code == 12501) return "CANCELLED";
            if (code == 7) return "NETWORK_FAILED";
        }
        if (source instanceof java.util.concurrent.TimeoutException) return "NETWORK_FAILED";
        if (source instanceof java.util.concurrent.CancellationException) return "CANCELLED";
        return "GMAIL_AUTH_REQUIRED";
    }
}

package de.familyprojekt.privatebrain.pro;

import com.google.android.gms.auth.api.identity.AuthorizationResult;

/** Reject incomplete grants; tolerate the SDK's nullable legacy account and Google domain aliases. */
final class GmailGrant {
    interface Identity { String email(String token)throws Exception; }
    final String email,token;
    private GmailGrant(String email,String token){this.email=email;this.token=token;}
    static GmailGrant read(AuthorizationResult result,String expected,Identity identity)throws Exception{
        if(result==null||result.hasResolution())throw new MailFailure("GMAIL_CONSENT_REQUIRED");
        String token=result.getAccessToken();if(token==null||token.isEmpty())throw new MailFailure("GMAIL_TOKEN_MISSING");
        if(!result.getGrantedScopes().contains(GmailAuthorization.MAIL_SCOPE))throw new MailFailure("GMAIL_SCOPE_MISSING");
        var account=result.toGoogleSignInAccount();String email=account==null?null:account.getEmail();
        if(email==null||email.isEmpty())email=identity.email(token);
        email=GmailIdentity.checked(email);
        if(expected!=null&&!GmailIdentity.same(expected,email))throw new MailFailure("GMAIL_ACCOUNT_MISMATCH");
        return new GmailGrant(email,token);
    }
}

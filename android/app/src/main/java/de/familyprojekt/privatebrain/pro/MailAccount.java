package de.familyprojekt.privatebrain.pro;

import java.net.IDN;
import java.util.Locale;
import java.util.Properties;
import java.util.UUID;
import javax.mail.internet.InternetAddress;
import org.json.JSONObject;

final class MailAccount {
    final String id, provider, email, user, password, imap, smtp, authType;
    MailAccount(JSONObject value) throws Exception {
        provider = value.getString("provider");
        MailProvider preset=MailProvider.find(provider);
        if(!preset.ready())throw new MailFailure("PROVIDER_SETUP_REQUIRED");
        authType = value.optString("authType", "password");
        if (!authType.equals(provider.equals("gmail") ? "oauth2" : "password")) throw new MailFailure("INVALID_INPUT");
        id = value.optString("id", UUID.randomUUID().toString());
        uuid(id);
        email = header(value.getString("email").trim(), 254);
        InternetAddress address = new InternetAddress(email, true);
        address.validate();
        if (!email.equals(address.getAddress()) || !email.contains("@")) throw new MailFailure("INVALID_INPUT");
        user = header(value.optString("user", "").trim().isEmpty() ? email : value.getString("user").trim(), 320);
        if(!preset.customUser()&&!user.equals(email))throw new MailFailure("INVALID_INPUT");
        password = provider.equals("gmail") ? "" : value.getString("password");
        if ((!provider.equals("gmail") && password.isEmpty()) || password.length() > 4096 || password.indexOf('\0') >= 0) throw new MailFailure("INVALID_INPUT");
        imap = host(value.getString("imap"));
        smtp = host(value.getString("smtp"));
        if (!preset.editable && (!imap.equals(preset.imap) || !smtp.equals(preset.smtp)))
            throw new MailFailure("INVALID_INPUT");
        if (provider.equals("gmail") && (!imap.equals("imap.gmail.com") || !smtp.equals("smtp.gmail.com") || !user.equals(email) || value.has("password")))
            throw new MailFailure("INVALID_INPUT");
    }
    static void uuid(String id) throws MailFailure {
        if (id == null || !id.matches("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")) throw new MailFailure("INVALID_INPUT");
    }
    static String header(String value, int limit) throws MailFailure {
        if (value == null || value.length() > limit || value.indexOf('\r') >= 0 || value.indexOf('\n') >= 0 || value.indexOf('\0') >= 0)
            throw new MailFailure("INVALID_INPUT");
        return value;
    }
    static String host(String value) throws MailFailure {
        try {
            String host = IDN.toASCII(value.trim(), IDN.USE_STD3_ASCII_RULES).toLowerCase(Locale.ROOT);
            if (host.length() > 253 || !host.contains(".") || !host.matches("[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?") || host.contains(".."))
                throw new IllegalArgumentException();
            return host;
        } catch (IllegalArgumentException error) { throw new MailFailure("INVALID_INPUT"); }
    }
    JSONObject privateJson() throws Exception {
        JSONObject result = publicJson().put("user", user);
        return provider.equals("gmail") ? result : result.put("password", password);
    }
    JSONObject publicJson() throws Exception {
        return new JSONObject().put("id", id).put("provider", provider).put("email", email).put("imap", imap).put("smtp", smtp).put("authType", authType);
    }
    static Properties properties(String authentication) {
        Properties properties = properties();
        if (authentication.equals("oauth2")) for (String protocol : new String[] {"imaps", "smtps"}) {
            String prefix = "mail." + protocol + ".auth.";
            properties.setProperty(prefix + "mechanisms", "XOAUTH2");properties.setProperty(prefix + "xoauth2.disable", "false");
            properties.setProperty(prefix + "login.disable", "true");properties.setProperty(prefix + "plain.disable", "true");
        }
        return properties;
    }
    static Properties properties() {
        Properties properties = new Properties();
        for (String protocol : new String[] {"imaps", "smtps"}) {
            String p = "mail." + protocol + ".";
            properties.setProperty(p + "ssl.enable", "true");
            properties.setProperty(p + "ssl.checkserveridentity", "true");
            properties.setProperty(p + "ssl.protocols", "TLSv1.2");
            properties.setProperty(p + "connectiontimeout", "15000");
            properties.setProperty(p + "timeout", "20000");
            properties.setProperty(p + "writetimeout", "20000");
        }
        for (String protocol : new String[] {"imaps", "smtps"}) {
            properties.put("mail." + protocol + ".socketFactory", new AppSocketFactory());
            properties.setProperty("mail." + protocol + ".socketFactory.fallback", "false");
        }
        properties.setProperty("mail.imaps.peek", "true");
        properties.setProperty("mail.imaps.fetchsize", "65536");
        properties.setProperty("mail.mime.decodeparameters", "true");
        properties.setProperty("mail.mime.encodefilename", "true");
        properties.setProperty("mail.debug", "false");
        properties.setProperty("mail.debug.auth", "false");
        properties.setProperty("mail.smtps.auth", "true");
        properties.setProperty("mail.smtps.sendpartial", "false");
        return properties;
    }
}

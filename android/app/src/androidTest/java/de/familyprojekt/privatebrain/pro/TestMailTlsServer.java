package de.familyprojekt.privatebrain.pro;

import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.math.BigInteger;
import java.net.InetAddress;
import java.net.Socket;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.cert.X509Certificate;
import java.util.Date;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import javax.net.ssl.KeyManager;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLException;
import javax.net.ssl.SSLServerSocket;
import javax.net.ssl.SSLSocketFactory;
import javax.net.ssl.TrustManagerFactory;
import javax.net.ssl.X509KeyManager;
import javax.security.auth.x500.X500Principal;

/** Test-only localhost servers. Ephemeral keys are generated on the emulator, never committed. */
final class TestMailTlsServer implements AutoCloseable {
    final AtomicInteger authentications = new AtomicInteger(), deliveries = new AtomicInteger();
    final java.util.concurrent.atomic.AtomicBoolean leakedBcc = new java.util.concurrent.atomic.AtomicBoolean(false);
    final SSLSocketFactory trustedClient;
    final int port;
    private final String alias;
    private final SSLServerSocket listener;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final Future<?> task;
    private volatile String state = "accepting";
    private volatile Exception failure;
    private final boolean oauth;
    static final String OAUTH_USER = "fixture@gmail.com", OAUTH_TOKEN = "fixture-token-not-a-real-credential";

    TestMailTlsServer(String alias, boolean smtp, boolean loseAcknowledgement) throws Exception {
        this(alias, smtp, loseAcknowledgement, false);
    }
    TestMailTlsServer(String alias, boolean smtp, boolean loseAcknowledgement, boolean oauth) throws Exception {
        this.oauth = oauth;
        this.alias = alias;
        KeyPairGenerator generator = KeyPairGenerator.getInstance("EC", "AndroidKeyStore");
        generator.initialize(new KeyGenParameterSpec.Builder(alias, KeyProperties.PURPOSE_SIGN | KeyProperties.PURPOSE_VERIFY)
            .setAlgorithmParameterSpec(new java.security.spec.ECGenParameterSpec("secp256r1"))
            .setDigests(KeyProperties.DIGEST_NONE, KeyProperties.DIGEST_SHA256, KeyProperties.DIGEST_SHA384, KeyProperties.DIGEST_SHA512)
            .setCertificateSubject(new X500Principal("CN=localhost"))
            .setCertificateSerialNumber(BigInteger.ONE)
            .setCertificateNotBefore(new Date(System.currentTimeMillis() - 60000))
            .setCertificateNotAfter(new Date(System.currentTimeMillis() + 3600000)).build());
        generator.generateKeyPair();
        KeyStore keys = KeyStore.getInstance("AndroidKeyStore"); keys.load(null);
        PrivateKey key = (PrivateKey) keys.getKey(alias, null);
        X509Certificate certificate = (X509Certificate) keys.getCertificate(alias);
        X509KeyManager manager = new X509KeyManager() {
            public String[] getClientAliases(String type, java.security.Principal[] issuers) { return null; }
            public String chooseClientAlias(String[] types, java.security.Principal[] issuers, Socket socket) { return null; }
            public String[] getServerAliases(String type, java.security.Principal[] issuers) { return type.contains("EC") ? new String[] {"test"} : null; }
            public String chooseServerAlias(String type, java.security.Principal[] issuers, Socket socket) { return type.contains("EC") ? "test" : null; }
            public X509Certificate[] getCertificateChain(String name) { return new X509Certificate[] {certificate}; }
            public PrivateKey getPrivateKey(String name) { return key; }
        };
        SSLContext server = SSLContext.getInstance("TLSv1.2"); server.init(new KeyManager[] {manager}, null, null);
        listener = (SSLServerSocket) server.getServerSocketFactory().createServerSocket(0, 1, InetAddress.getByName("localhost"));
        listener.setEnabledProtocols(new String[] {"TLSv1.2"});
        listener.setEnabledCipherSuites(new String[] {"TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256"});
        listener.setSoTimeout(15000); port = listener.getLocalPort();
        KeyStore anchors = KeyStore.getInstance(KeyStore.getDefaultType()); anchors.load(null);
        anchors.setCertificateEntry("only-this-test-server", certificate);
        TrustManagerFactory trust = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm()); trust.init(anchors);
        SSLContext client = SSLContext.getInstance("TLSv1.2"); client.init(null, trust.getTrustManagers(), null);
        trustedClient = client.getSocketFactory();
        task = executor.submit(() -> {
            try (Socket socket = listener.accept()) {
                state = "accepted";
                socket.setSoTimeout(15000);
                state = "TLS handshake";
                ((javax.net.ssl.SSLSocket) socket).startHandshake();
                state = "greeting";
                BufferedReader reader = new BufferedReader(new InputStreamReader(socket.getInputStream(), java.nio.charset.StandardCharsets.US_ASCII));
                PrintWriter writer = new PrintWriter(new OutputStreamWriter(socket.getOutputStream(), java.nio.charset.StandardCharsets.US_ASCII));
                if (smtp) smtp(reader, writer, loseAcknowledgement); else imap(reader, writer);
            } catch (SSLException error) { failure = error; /* Expected for rejected test certificates. */ }
            catch (java.io.IOException error) { failure = error; /* May be expected for deliberate loss. */ }
        });
    }
    private void line(PrintWriter writer, String text) throws java.io.IOException {
        writer.print(text + "\r\n"); writer.flush();
        if (writer.checkError()) throw new java.io.IOException("Test server write failed at " + state);
    }
    private void imap(BufferedReader reader, PrintWriter writer) throws java.io.IOException {
        line(writer, "* OK localhost test IMAP");
        String value;
        while ((value = reader.readLine()) != null) {
            String[] parts = value.split(" ", 3);
            if (parts.length < 2) return;
            String tag = parts[0], command = parts[1].toUpperCase(java.util.Locale.ROOT);
            state = "IMAP " + command;
            switch (command) {
                case "CAPABILITY": line(writer, "* CAPABILITY IMAP4rev1 AUTH=" + (oauth ? "XOAUTH2" : "PLAIN")); line(writer, tag + " OK capability"); break;
                case "NOOP": line(writer, tag + " OK noop"); break;
                case "AUTHENTICATE":
                    if (oauth) {
                        String[] auth = parts[2].trim().split(" ", 2);
                        if (!auth[0].equalsIgnoreCase("XOAUTH2")) { line(writer, tag + " NO OAuth required");break; }
                        String data = auth.length == 2 ? auth[1] : null;
                        if (data == null) { line(writer, "+ ");data = reader.readLine(); }
                        if (!validOAuth(data)) { line(writer, tag + " NO Invalid OAuth");break; }
                        authentications.incrementAndGet();line(writer, tag + " OK authenticated");break;
                    }
                    if (parts.length < 3 || parts[2].trim().split(" ").length < 2) {
                        line(writer, "+ "); if (reader.readLine() == null) return;
                    }
                    authentications.incrementAndGet(); line(writer, tag + " OK authenticated"); break;
                case "LOGIN": if (oauth) { line(writer, tag + " NO OAuth required");break; } authentications.incrementAndGet(); line(writer, tag + " OK authenticated"); break;
                case "LOGOUT": line(writer, "* BYE"); line(writer, tag + " OK logout"); return;
                default: line(writer, tag + " BAD unsupported test command");
            }
        }
    }
    private void smtp(BufferedReader reader, PrintWriter writer, boolean loseAcknowledgement) throws java.io.IOException {
        line(writer, "220 localhost ESMTP test");
        String value;
        while ((value = reader.readLine()) != null) {
            String command = value.toUpperCase(java.util.Locale.ROOT);
            // Only protocol verbs, never AUTH arguments or message data.
            state = "SMTP " + command.split(" ", 2)[0];
            if (command.startsWith("EHLO") || command.startsWith("HELO")) {
                line(writer, "250-localhost"); line(writer, "250-AUTH " + (oauth ? "XOAUTH2" : "PLAIN LOGIN")); line(writer, "250 SIZE 8388608");
            } else if (command.startsWith("AUTH XOAUTH2") && oauth) {
                String[] auth = value.split(" ", 3);String data = auth.length == 3 ? auth[2] : null;
                if (data == null) { line(writer, "334 ");data = reader.readLine(); }
                if (!validOAuth(data)) { line(writer, "535 Invalid OAuth");continue; }
                authentications.incrementAndGet();line(writer, "235 authenticated");
            } else if (command.startsWith("AUTH ") && oauth) {
                line(writer, "535 OAuth required");
            } else if (command.startsWith("AUTH PLAIN")) {
                if (value.trim().split(" ").length < 3) { line(writer, "334 "); if (reader.readLine() == null) return; }
                authentications.incrementAndGet(); line(writer, "235 authenticated");
            } else if (command.startsWith("AUTH LOGIN")) {
                line(writer, "334 VXNlcm5hbWU6"); if (reader.readLine() == null) return;
                line(writer, "334 UGFzc3dvcmQ6"); if (reader.readLine() == null) return;
                authentications.incrementAndGet(); line(writer, "235 authenticated");
            } else if (command.startsWith("MAIL FROM:") || command.startsWith("RCPT TO:") || command.equals("RSET") || command.equals("NOOP")) {
                line(writer, "250 OK");
            } else if (command.equals("DATA")) {
                line(writer, "354 send message");
                boolean headers = true;
                while ((value = reader.readLine()) != null && !value.equals(".")) {
                    if (value.isEmpty()) headers = false;
                    if (headers && value.toUpperCase(java.util.Locale.ROOT).startsWith("BCC:")) leakedBcc.set(true);
                }
                deliveries.incrementAndGet();
                if (loseAcknowledgement) return;
                line(writer, "250 accepted");
            } else if (command.equals("QUIT")) { line(writer, "221 goodbye"); return; }
            else line(writer, "500 unsupported test command");
        }
    }
    private boolean validOAuth(String data) {
        try {
            String value = new String(android.util.Base64.decode(data, android.util.Base64.NO_WRAP), java.nio.charset.StandardCharsets.UTF_8);
            return value.equals("user=" + OAUTH_USER + "\u0001auth=Bearer " + OAUTH_TOKEN + "\u0001\u0001");
        } catch (Exception error) { return false; }
    }
    void await() throws Exception { task.get(20, TimeUnit.SECONDS); }
    String diagnostics() { return "Local test server state=" + state + "; failure=" + (failure == null ? "none" : failure.toString()); }
    String numericHost() { return listener.getInetAddress().getHostAddress(); }
    public void close() throws Exception {
        listener.close(); executor.shutdownNow();
        KeyStore keys = KeyStore.getInstance("AndroidKeyStore"); keys.load(null); keys.deleteEntry(alias);
    }
}

package de.familyprojekt.privatebrain.pro;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.text.InputType;
import android.view.ContextThemeWrapper;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.widget.ArrayAdapter;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.Spinner;
import android.widget.TextView;
import androidx.appcompat.app.AlertDialog;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import javax.mail.AuthenticationFailedException;
import javax.mail.MessagingException;
import javax.net.ssl.SSLException;
import org.json.JSONObject;

/** Named mail operations only. Credentials are collected by Android, never by the page. */
@CapacitorPlugin(name = "ProMail")
public class ProMailPlugin extends Plugin {
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private MailEngine engine;
    private EncryptedMailStore storage;
    private Vault vault;
    @Override public void load() {
        storage = new EncryptedMailStore(getContext());
        vault = Vault.get(getContext());
        engine = new MailEngine(storage, new MailEngine.OAuthProvider() {
            public String token(String email) throws Exception { return ((MainActivity)getActivity()).google().token(email); }
            public void invalidate(String token) { ((MainActivity)getActivity()).google().invalidate(token); }
        }, vault);
    }
    /** Accounts, drafts and send records follow into the chosen folder; failure never blocks mail. */
    private void backup() {
        worker.execute(() -> {
            try { if (vault.configured() && vault.unlocked()) vault.backupMailStore(storage); }
            catch (Exception ignored) { /* The next change or "Jetzt sichern" writes the snapshot again. */ }
        });
    }
    private interface Work { JSONObject run() throws Exception; }
    private void perform(PluginCall call, Work work) {
        worker.execute(() -> {
            try { call.resolve(JSObject.fromJSONObject(work.run())); }
            catch (Exception error) { call.reject("Mail operation unavailable", code(error)); }
        });
    }
    static String code(Exception error) {
        Throwable current = error;
        for (int i = 0; i < 15 && current != null; i++) {
            if (current instanceof AppNetwork.Blocked) return "APP_OFFLINE";
            if (current instanceof MailFailure) return ((MailFailure) current).code;
            if (current instanceof VaultCrypto.Failure) return current.getMessage();
            if (current instanceof SecurityException) return "VAULT_FOLDER_UNAVAILABLE";
            if (current instanceof SSLException) return "TLS_FAILED";
            if (current instanceof AuthenticationFailedException) return "AUTH_FAILED";
            if (current instanceof java.security.GeneralSecurityException) return "VAULT_UNAVAILABLE";
            if (current instanceof java.io.IOException && "MESSAGE_TOO_LARGE".equals(current.getMessage())) return "MESSAGE_TOO_LARGE";
            if (current instanceof java.io.IOException && current.getMessage() != null && current.getMessage().startsWith("Can't verify identity of server")) return "TLS_FAILED";
            current = current.getCause() != null ? current.getCause() :
                current instanceof MessagingException ? ((MessagingException) current).getNextException() : null;
        }
        if (error instanceof org.json.JSONException || error instanceof IllegalArgumentException) return "INVALID_INPUT";
        if ("MESSAGE_TOO_LARGE".equals(error.getMessage())) return "MESSAGE_TOO_LARGE";
        return "CONNECTION_FAILED";
    }
    private String required(PluginCall call, String field) throws MailFailure {
        String value = call.getString(field);
        if (value == null || value.isEmpty()) throw new MailFailure("INVALID_INPUT");
        return value;
    }
    private MailAccount account(PluginCall call) throws Exception { return engine.account(required(call, "account")); }
    private JSONObject draft(PluginCall call) throws MailFailure {
        JSONObject value = call.getObject("draft");
        if (value == null) throw new MailFailure("INVALID_INPUT");
        return value;
    }
    @PluginMethod public void accounts(PluginCall call) { perform(call, () -> new JSONObject().put("items", engine.accounts())); }
    @PluginMethod public void removeAccount(PluginCall call) { perform(call, () -> { engine.removeAccount(required(call, "account")); return new JSONObject().put("ok", true); }); backup(); }
    @PluginMethod public void folders(PluginCall call) { perform(call, () -> new JSONObject().put("items", engine.folders(account(call)))); }
    @PluginMethod public void createFolder(PluginCall call) { perform(call, () -> { engine.createFolder(account(call), required(call, "name")); return new JSONObject().put("ok", true); }); }
    @PluginMethod public void messages(PluginCall call) { perform(call, () -> engine.messages(account(call), required(call, "folder"), call.getData().optLong("before", 0))); }
    @PluginMethod public void message(PluginCall call) { perform(call, () -> engine.message(account(call), required(call, "folder"), required(call, "validity"), call.getData().optLong("uid", -1))); }
    @PluginMethod public void action(PluginCall call) { perform(call, () -> {
        engine.action(account(call), required(call, "folder"), required(call, "validity"), call.getData().optLong("uid", -1), required(call, "action"), call.getString("target", ""));
        return new JSONObject().put("ok", true);
    }); }
    @PluginMethod public void send(PluginCall call) { perform(call, () -> engine.send(account(call), draft(call))); backup(); }
    @PluginMethod public void saveDraft(PluginCall call) { perform(call, () -> { engine.saveDraft(account(call), draft(call)); return new JSONObject().put("ok", true); }); backup(); }
    @PluginMethod public void forgetMessage(PluginCall call) { perform(call, () -> { engine.forgetMessage(account(call), required(call, "folder"), required(call, "validity"), call.getData().optLong("uid", -1)); return new JSONObject().put("ok", true); }); }
    @PluginMethod public void saved(PluginCall call) { perform(call, () -> new JSONObject().put("items", engine.saved(required(call, "account")))); }
    @PluginMethod public void savedDraft(PluginCall call) { perform(call, () -> engine.savedDraft(required(call, "account"), required(call, "id"))); }

    @PluginMethod public void openOriginal(PluginCall call) {
        perform(call, () -> {
            byte[] bytes = engine.raw(account(call), required(call, "folder"), required(call, "validity"), call.getData().optLong("uid", -1));
            File file = staged(bytes, "mail.eml");
            android.net.Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", file);
            Intent intent = new Intent(Intent.ACTION_SEND).setType("message/rfc822").putExtra(Intent.EXTRA_STREAM, uri)
                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            getActivity().runOnUiThread(() -> {
                try { getActivity().startActivity(Intent.createChooser(intent, "mail.eml")); }
                catch (ActivityNotFoundException ignored) { /* No compatible external app installed. */ }
            });
            return new JSONObject().put("ok", true);
        });
    }
    private File staged(byte[] data, String name) throws Exception {
        File exports = new File(getContext().getCacheDir(), "exports");
        if (!exports.isDirectory() && !exports.mkdirs()) throw new MailFailure("FILE_UNAVAILABLE");
        File[] old = exports.listFiles();
        if (old != null) for (File file : old) if (file.isFile() && file.getName().startsWith("mail-") &&
                System.currentTimeMillis() - file.lastModified() > 24L * 60 * 60 * 1000) file.delete();
        long used = 0;
        File[] remaining = exports.listFiles();
        if (remaining != null) for (File file : remaining) used += file.length();
        if (used + data.length > 32L * 1024 * 1024) throw new MailFailure("FILE_UNAVAILABLE");
        File file = new File(exports, "mail-" + UUID.randomUUID() + "-" + MailMime.filename(name));
        try (FileOutputStream output = new FileOutputStream(file)) { output.write(data); }
        return file;
    }

    @PluginMethod public void openAttachment(PluginCall call) {
        perform(call, () -> {
            JSONObject mail = engine.message(account(call), required(call, "folder"), required(call, "validity"), call.getData().optLong("uid", -1));
            int index = call.getData().optInt("index", -1);
            if (index < 0 || index >= mail.getJSONArray("attachments").length()) throw new MailFailure("INVALID_INPUT");
            JSONObject attachment = mail.getJSONArray("attachments").getJSONObject(index);
            byte[] data = android.util.Base64.decode(attachment.getString("data"), android.util.Base64.NO_WRAP);
            File file = staged(data, attachment.getString("name"));
            android.net.Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", file);
            String name = attachment.getString("name");
            String extension = name.contains(".") ? name.substring(name.lastIndexOf('.') + 1).toLowerCase(java.util.Locale.ROOT) : "";
            String type = android.webkit.MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension);
            Intent intent = new Intent(Intent.ACTION_VIEW).setDataAndType(uri, type == null ? "application/octet-stream" : type)
                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            getActivity().runOnUiThread(() -> {
                try { getActivity().startActivity(Intent.createChooser(intent, attachment.optString("name"))); }
                catch (ActivityNotFoundException ignored) { /* The chooser displays missing compatible apps. */ }
            });
            return new JSONObject().put("ok", true);
        });
    }

    private static final String[][] WORDS = {
        {"Mailkonto verbinden", "E-Mail-Adresse", "Benutzername (leer = E-Mail-Adresse)", "Passwort für E-Mail-Programme", "Verbinden und prüfen", "Abbrechen", "Kontodaten bleiben verschlüsselt auf diesem Gerät. Telekom benötigt ein separates Passwort für E-Mail-Programme. Hetzner: Servernamen beim Anbieter prüfen.", "Anmeldung wird geprüft …", "Anmeldung fehlgeschlagen. E-Mail-Adresse, E-Mail-Passwort und Servernamen prüfen.", "TLS-Zertifikat konnte nicht bestätigt werden. Servernamen prüfen.", "Verbindung nicht möglich. Internet und Servernamen prüfen.", "Sichere Geräteablage nicht verfügbar. Es wurden keine Kontodaten ersetzt."},
        {"Connect mail account", "Email address", "Username (blank = email address)", "Password for email apps", "Connect and verify", "Cancel", "Credentials remain encrypted on this device. Telekom requires a separate email-app password. Hetzner: check server names with your provider.", "Checking login …", "Login failed. Check email address, email-app password and server names.", "Unable to verify TLS certificate. Check server names.", "Unable to connect. Check your internet connection and server names.", "Secure device storage unavailable. No existing account was replaced."},
        {"Подключить почту", "Адрес почты", "Имя пользователя (пусто = адрес почты)", "Пароль для почтовых программ", "Подключить и проверить", "Отмена", "Данные хранятся зашифрованными на устройстве. Для Telekom нужен отдельный пароль для почтовых программ. Серверы Hetzner уточните у провайдера.", "Проверка входа …", "Не удалось войти. Проверьте адрес, почтовый пароль и серверы.", "Не удалось проверить TLS-сертификат. Проверьте серверы.", "Нет подключения. Проверьте интернет и серверы.", "Защищённое хранилище недоступно. Существующие данные не заменены."},
        {"Połącz konto pocztowe", "Adres e-mail", "Użytkownik (puste = adres e-mail)", "Hasło dla programów pocztowych", "Połącz i sprawdź", "Anuluj", "Dane są szyfrowane na urządzeniu. Telekom wymaga osobnego hasła dla programów pocztowych. Serwery Hetzner sprawdź u dostawcy.", "Sprawdzanie logowania …", "Logowanie nieudane. Sprawdź adres, hasło pocztowe i serwery.", "Nie można potwierdzić certyfikatu TLS. Sprawdź serwery.", "Brak połączenia. Sprawdź internet i serwery.", "Bezpieczna pamięć niedostępna. Istniejące dane nie zostały zastąpione."}
    };
    private EditText field(LinearLayout parent, String label, int type) {
        TextView title = new TextView(parent.getContext()); title.setText(label); parent.addView(title);
        EditText input = new EditText(parent.getContext()); input.setSingleLine(true); input.setInputType(type);
        input.setImeOptions(EditorInfo.IME_FLAG_NO_PERSONALIZED_LEARNING); parent.addView(input);
        return input;
    }
    @PluginMethod public void addAccount(PluginCall call) {
        Activity activity = getActivity();
        activity.runOnUiThread(() -> {
            int language = ArraysIndex.language(call.getString("language", "de"));
            String[] t = WORDS[language];
            boolean dark = call.getBoolean("dark", false);
            ContextThemeWrapper context = new ContextThemeWrapper(activity, dark ?
                androidx.appcompat.R.style.Theme_AppCompat_Dialog_Alert : androidx.appcompat.R.style.Theme_AppCompat_Light_Dialog_Alert);
            LinearLayout form = new LinearLayout(context); form.setOrientation(LinearLayout.VERTICAL);
            int padding = Math.round(20 * activity.getResources().getDisplayMetrics().density);
            form.setPadding(padding, padding / 2, padding, padding / 2);
            Spinner provider = new Spinner(context);
            ArrayAdapter<String> choices = new ArrayAdapter<>(context, android.R.layout.simple_spinner_item, java.util.Arrays.stream(MailProvider.values()).map(preset -> preset.label).toArray(String[]::new));
            choices.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item); provider.setAdapter(choices); form.addView(provider);
            EditText email = field(form, t[1], InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS);
            EditText user = field(form, t[2], InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS);
            EditText password = field(form, t[3], InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
            EditText imap = field(form, "IMAP · TLS · 993", InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_URI);
            EditText smtp = field(form, "SMTP · TLS · 465", InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_URI);
            TextView help = new TextView(context); help.setText(t[6]); form.addView(help);
            TextView status = new TextView(context); status.setAccessibilityLiveRegion(View.ACCESSIBILITY_LIVE_REGION_POLITE); form.addView(status);
            ScrollView scroll = new ScrollView(context); scroll.setFillViewport(true); scroll.addView(form);
            AlertDialog dialog = new AlertDialog.Builder(context).setTitle(t[0]).setView(scroll)
                .setPositiveButton(t[4], null).setNegativeButton(t[5], null).create();
            AtomicBoolean finished = new AtomicBoolean(false), testing = new AtomicBoolean(false);
            java.util.function.Consumer<Boolean> formBusy = busy -> {
                provider.setEnabled(!busy);
                for(EditText input:new EditText[]{email,user,password})input.setEnabled(!busy);
                boolean editable=MailProvider.values()[provider.getSelectedItemPosition()].editable;
                imap.setEnabled(!busy&&editable);smtp.setEnabled(!busy&&editable);
            };
            dialog.setOnCancelListener(d -> { password.setText(""); synchronized (finished) { if (finished.compareAndSet(false, true)) call.reject("Account setup cancelled", "CANCELLED"); } });
            dialog.setOnDismissListener(d -> { password.setText(""); synchronized (finished) { if (finished.compareAndSet(false, true)) call.reject("Account setup cancelled", "CANCELLED"); } });
            dialog.setOnShowListener(d -> {
                provider.setOnItemSelectedListener(new android.widget.AdapterView.OnItemSelectedListener() {
                    public void onNothingSelected(android.widget.AdapterView<?> parent) { }
                    public void onItemSelected(android.widget.AdapterView<?> parent, View view, int position, long id) {
                        password.setText("");user.setText("");status.setText("");
                        MailProvider preset=MailProvider.values()[position];boolean gmail=preset==MailProvider.GOOGLE;
                        for (EditText field : new EditText[] {email,user,password,imap,smtp}) showField(field, !gmail&&preset.ready());
                        showField(user,!gmail&&preset.ready()&&preset.customUser());
                        imap.setText(preset.imap);
                        smtp.setText(preset.smtp);
                        imap.setEnabled(preset.editable);smtp.setEnabled(preset.editable);
                        help.setText(preset.help(language));
                        dialog.getButton(AlertDialog.BUTTON_POSITIVE).setText(!preset.ready()?MailProvider.setupLabel(language):gmail?GOOGLE_SIGN_IN[language]:t[4]);
                    }
                });
                GradientDrawable background = new GradientDrawable(); background.setColor(Color.parseColor(dark ? "#171d25" : "#faf6f0"));
                background.setCornerRadius(18 * activity.getResources().getDisplayMetrics().density);
                if (dialog.getWindow() != null) dialog.getWindow().setBackgroundDrawable(background);
                dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v -> {
                    MailProvider preset=MailProvider.values()[provider.getSelectedItemPosition()];
                    if(!preset.ready()){
                        new AlertDialog.Builder(context).setTitle(preset.label).setMessage(MailProvider.microsoftPlan(language))
                            .setPositiveButton(android.R.string.ok,(info,which)->{}).show();
                        return;
                    }
                    if (!testing.compareAndSet(false, true)) return;
                    formBusy.accept(true);
                    if (preset==MailProvider.GOOGLE) {
                        status.setText(t[7]);dialog.getButton(AlertDialog.BUTTON_POSITIVE).setEnabled(false);
                        ((MainActivity)activity).google().consent(null, new GmailAuthorization.Callback() {
                            public void success(String selected) {
                                if (finished.get()) return;
                                try {
                                    JSONObject input = new JSONObject().put("provider", "gmail").put("authType", "oauth2")
                                        .put("email", selected).put("user", selected).put("imap", "imap.gmail.com").put("smtp", "smtp.gmail.com");
                                    verifySetup(call, new MailAccount(input), activity, dialog, status, t, language, testing, finished,()->formBusy.accept(false));
                                } catch (Exception error) { failure("GMAIL_AUTH_REQUIRED"); }
                            }
                            public void failure(String code) {
                                if (finished.get()) return;status.setText(googleError(code, language));
                                testing.set(false);formBusy.accept(false);dialog.getButton(AlertDialog.BUTTON_POSITIVE).setEnabled(true);
                            }
                        });
                        return;
                    }
                    JSONObject input = new JSONObject();
                    try {
                        input.put("provider", preset.id)
                            .put("email", email.getText().toString()).put("user", preset.customUser()?user.getText().toString():email.getText().toString())
                            .put("password", password.getText().toString()).put("imap", imap.getText().toString()).put("smtp", smtp.getText().toString());
                    } catch (Exception error) { testing.set(false);formBusy.accept(false);status.setText(t[8]);return; }
                    status.setText(t[7]); dialog.getButton(AlertDialog.BUTTON_POSITIVE).setEnabled(false);
                    try { verifySetup(call, new MailAccount(input), activity, dialog, status, t, language, testing, finished,()->formBusy.accept(false)); }
                    catch (Exception error) { testing.set(false);formBusy.accept(false);status.setText(t[8]);dialog.getButton(AlertDialog.BUTTON_POSITIVE).setEnabled(true); }
                });
            });
            dialog.show();
        });
    }
    private static final String[] GOOGLE_SIGN_IN = {"Mit Google anmelden", "Sign in with Google", "Войти через Google", "Zaloguj się przez Google"};
    private static String googleError(String code, int language) { return GmailMessages.error(code,language); }
    private static void showField(EditText field, boolean visible) {
        android.view.ViewGroup parent = (android.view.ViewGroup)field.getParent();int index = parent.indexOfChild(field);
        field.setVisibility(visible ? View.VISIBLE : View.GONE);
        if (index > 0) parent.getChildAt(index - 1).setVisibility(visible ? View.VISIBLE : View.GONE);
    }
    private void verifySetup(PluginCall call, MailAccount account, Activity activity, AlertDialog dialog, TextView status,
            String[] t, int language, AtomicBoolean testing, AtomicBoolean finished, Runnable restoreForm) {
        status.setText(t[7]);dialog.getButton(AlertDialog.BUTTON_POSITIVE).setEnabled(false);
        worker.execute(() -> {
            if(finished.get())return;
            try {
                engine.verify(account);
                JSONObject saved;
                synchronized (finished) {
                    if (finished.get()) return;
                    saved = engine.saveAccount(account);finished.set(true);
                }
                backup();
                activity.runOnUiThread(() -> {
                    try { call.resolve(JSObject.fromJSONObject(saved)); }
                    catch (Exception error) { call.reject("Device storage unavailable", "VAULT_UNAVAILABLE"); }
                    dialog.dismiss();
                });
            } catch (Exception error) {
                String code = code(error);
                activity.runOnUiThread(() -> {
                    if (finished.get()) return;
                    status.setText(code.startsWith("GMAIL_") ? googleError(code, language) : t[code.equals("TLS_FAILED") ? 9 : code.equals("VAULT_UNAVAILABLE") ? 11 : code.equals("AUTH_FAILED") || code.equals("INVALID_INPUT") ? 8 : 10]);
                    testing.set(false);restoreForm.run();dialog.getButton(AlertDialog.BUTTON_POSITIVE).setEnabled(true);
                });
            }
        });
    }
    @Override protected void handleOnDestroy() { worker.shutdownNow(); }
    private static final class ArraysIndex {
        static int language(String lang) { int index = java.util.Arrays.asList("de", "en", "ru", "pl").indexOf(lang); return Math.max(index, 0); }
    }
}

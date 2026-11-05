package de.familyprojekt.privatebrain.pro;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.storage.StorageManager;
import android.os.storage.StorageVolume;
import android.provider.DocumentsContract;
import android.text.InputType;
import android.util.Base64;
import android.view.ContextThemeWrapper;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import androidx.activity.result.ActivityResult;
import androidx.appcompat.app.AlertDialog;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import org.json.JSONArray;
import org.json.JSONObject;

/** Storage location and password vault. The password is typed only into Android's own dialog. */
@CapacitorPlugin(name = "ProVault")
public class ProVaultPlugin extends Plugin {
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    // Attachment and catalog transfers must not wait behind a long password derivation.
    private final ExecutorService reader = Executors.newSingleThreadExecutor();
    private final AtomicBoolean choosing = new AtomicBoolean();
    private Vault vault;
    @Override public void load() { vault = Vault.get(getContext()); }
    private interface Work { JSONObject run() throws Exception; }
    private void work(ExecutorService executor, PluginCall call, Work task) {
        try {
            executor.execute(() -> {
                try { call.resolve(JSObject.fromJSONObject(task.run())); }
                catch (Exception error) { String code = vaultCode(error); call.reject(code, code); }
            });
        } catch (java.util.concurrent.RejectedExecutionException closed) { call.reject("NATIVE_ACTIVITY_CLOSED", "NATIVE_ACTIVITY_CLOSED"); }
    }
    private void work(PluginCall call, Work task) { work(worker, call, task); }
    /** Stable codes only; unknown storage problems never pretend to be network failures. */
    static String vaultCode(Exception error) {
        if (error instanceof SecurityException) return "VAULT_FOLDER_UNAVAILABLE";
        String code = ProMailPlugin.code(error);
        return code.equals("CONNECTION_FAILED") ? "VAULT_UNAVAILABLE" : code;
    }

    @PluginMethod public void state(PluginCall call) { work(reader, call, () -> vault.state()); }
    @PluginMethod public void volumes(PluginCall call) {
        work(reader, call, () -> {
            JSONArray items = new JSONArray();
            StorageManager storage = (StorageManager) getContext().getSystemService(Context.STORAGE_SERVICE);
            if (storage != null) for (StorageVolume v : storage.getStorageVolumes()) {
                if (!android.os.Environment.MEDIA_MOUNTED.equals(v.getState())) continue;
                items.put(new JSONObject().put("id", v.isPrimary() ? "primary" : String.valueOf(v.getUuid()))
                    .put("label", v.getDescription(getContext())).put("removable", v.isRemovable()).put("primary", v.isPrimary()));
            }
            return new JSONObject().put("items", items).put("targeted", Build.VERSION.SDK_INT >= 29);
        });
    }
    @PluginMethod public void choose(PluginCall call) {
        if (!choosing.compareAndSet(false, true)) { call.reject("VAULT_BUSY", "VAULT_BUSY"); return; }
        Intent intent = null;
        String volume = call.getString("volume", "");
        if (Build.VERSION.SDK_INT >= 29 && !volume.isEmpty()) {
            StorageManager storage = (StorageManager) getContext().getSystemService(Context.STORAGE_SERVICE);
            for (StorageVolume v : storage.getStorageVolumes())
                if (volume.equals(v.isPrimary() ? "primary" : String.valueOf(v.getUuid()))) intent = v.createOpenDocumentTreeIntent();
        }
        if (intent == null) intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION
            | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION | Intent.FLAG_GRANT_PREFIX_URI_PERMISSION);
        try { startActivityForResult(call, intent, "folderChosen"); }
        catch (Exception error) { choosing.set(false); call.reject("VAULT_FOLDER_UNAVAILABLE", "VAULT_FOLDER_UNAVAILABLE"); }
    }
    @ActivityCallback private void folderChosen(PluginCall call, ActivityResult result) {
        choosing.set(false);
        if (call == null) return;
        Intent data = result.getData();
        if (result.getResultCode() != Activity.RESULT_OK || data == null || data.getData() == null) { call.resolve(new JSObject().put("cancelled", true)); return; }
        Uri tree = data.getData();
        int required = Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION;
        worker.execute(() -> {
            try {
                if (!"content".equals(tree.getScheme()) || (data.getFlags() & required) != required) throw new VaultCrypto.Failure("VAULT_FOLDER_UNAVAILABLE");
                getContext().getContentResolver().takePersistableUriPermission(tree, required);
                // Gemeinsamer Tresor-Plan (Klaus 2026-11-03): Hauptablageordner und „Private Brain“ sind beide richtig
                // (Vault.find nutzt den vorhandenen Unterordner „Private Brain“); Verwaltung und fremde Fächer nie.
                String falsch = OrdnerWahl.speicherortFehler(new de.familyprojekt.tresor.SafAblage(getContext().getContentResolver(), tree), ordnerName(tree));
                if (falsch != null) { freigabeZurueck(tree, "vault-v1", "tree"); throw new VaultCrypto.Failure(falsch); }
                boolean existing = vault.find(tree) != null;
                getActivity().runOnUiThread(() -> passwordDialog(call, existing ? MODE_OPEN : MODE_CREATE, tree));
            } catch (Exception error) { String code = vaultCode(error); call.reject(code, code); }
        });
    }
    /** Anzeigename des gewählten Ordners (Dateien-App), sonst der letzte Teil der Kennung. */
    private String ordnerName(Uri tree) {
        String id = DocumentsContract.getTreeDocumentId(tree);
        try (Cursor c = getContext().getContentResolver().query(DocumentsContract.buildDocumentUriUsingTree(tree, id),
                new String[] {DocumentsContract.Document.COLUMN_DISPLAY_NAME}, null, null, null)) {
            if (c != null && c.moveToFirst() && c.getString(0) != null) return c.getString(0);
        } catch (Exception ignored) { }
        int i = Math.max(id.lastIndexOf('/'), id.indexOf(':'));
        return i >= 0 ? id.substring(i + 1) : id;
    }
    /** Eine abgelehnte Wahl behält keine Android-Freigabe, außer es ist der gerade benutzte Ordner. */
    private void freigabeZurueck(Uri tree, String prefs, String key) {
        if (tree.toString().equals(getContext().getSharedPreferences(prefs, Context.MODE_PRIVATE).getString(key, ""))) return;
        try { getContext().getContentResolver().releasePersistableUriPermission(tree, Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION); } catch (Exception ignored) { }
    }
    @PluginMethod public void unlock(PluginCall call) { getActivity().runOnUiThread(() -> passwordDialog(call, MODE_UNLOCK, null)); }
    @PluginMethod public void lock(PluginCall call) { work(call, () -> vault.lock()); }
    /** „In Dateien öffnen“ (Leitfaden § 5): zeigt die Ablage oder den Tresorordner in der Dateien-App. Nichts wird gelesen oder verändert. */
    @PluginMethod public void ordnerOeffnen(PluginCall call) {
        String[] ablage = "tresor".equals(call.getString("welcher")) ? null : vault.ordnerAdresse();
        Uri uri = "tresor".equals(call.getString("welcher")) ? tresor().ordnerUri()
            : ablage == null ? null : android.provider.DocumentsContract.buildDocumentUriUsingTree(Uri.parse(ablage[0]), ablage[1]);
        if (uri == null) { call.reject("VAULT_NOT_CONFIGURED", "VAULT_NOT_CONFIGURED"); return; }
        Intent intent = new Intent(Intent.ACTION_VIEW).setDataAndType(uri, android.provider.DocumentsContract.Document.MIME_TYPE_DIR)
            .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
        try { getActivity().startActivity(intent); call.resolve(); }
        catch (android.content.ActivityNotFoundException none) { call.reject("KEIN_DATEIEN_PROGRAMM", "KEIN_DATEIEN_PROGRAMM"); }
        catch (SecurityException denied) { call.reject("VAULT_FOLDER_UNAVAILABLE", "VAULT_FOLDER_UNAVAILABLE"); }
    }
    @PluginMethod public void migrate(PluginCall call) {
        work(call, () -> vault.migrate(new OriginalFileStore(getContext()), new EncryptedMailStore(getContext())));
    }
    @PluginMethod public void backupMail(PluginCall call) {
        work(call, () -> { vault.backupMailStore(new EncryptedMailStore(getContext())); return new JSONObject().put("ok", true); });
    }
    @PluginMethod public void attachments(PluginCall call) {
        work(reader, call, () -> {
            vault.requireUnlocked();
            JSONArray items = new JSONArray(), all = vault.attachments();
            for (int i = 0; i < all.length(); i++) {
                JSONObject e = all.getJSONObject(i);
                items.put(new JSONObject().put("id", e.getString("id")).put("name", e.getString("name")).put("type", e.optString("type"))
                    .put("size", e.getLong("size")).put("sha256", e.optString("sha256")).put("from", e.optString("from")).put("subject", e.optString("subject"))
                    .put("date", e.optString("date")).put("account", e.optString("account")).put("stored", e.optLong("stored")));
            }
            return new JSONObject().put("items", items);
        });
    }
    @PluginMethod public void clearAttachments(PluginCall call) { work(call, () -> vault.clearAttachments()); }
    @PluginMethod public void readAttachment(PluginCall call) {
        work(reader, call, () -> new JSONObject().put("data", Base64.encodeToString(
            vault.readAttachment(call.getString("id", ""), call.getData().optLong("offset", -1)), Base64.NO_WRAP)));
    }
    /** Hands a decrypted copy to another app. The page asks the user before calling this. */
    @PluginMethod public void openAttachment(PluginCall call) {
        reader.execute(() -> {
            try {
                File staged = vault.stageAttachment(call.getString("id", ""));
                Intent intent = ProFilesPlugin.fileIntent(getContext(), staged, staged.getName().substring(37), call.getBoolean("share", false));
                getActivity().runOnUiThread(() -> {
                    try { getActivity().startActivity(Intent.createChooser(intent, staged.getName().substring(37))); call.resolve(new JSObject().put("ok", true)); }
                    catch (Exception error) { call.reject("FILE_UNAVAILABLE", "FILE_UNAVAILABLE"); }
                });
            } catch (Exception error) { String code = vaultCode(error); call.reject(code, code); }
        });
    }
    @PluginMethod public void catalogBegin(PluginCall call) { work(reader, call, () -> new JSONObject().put("ticket", vault.catalogBegin())); }
    @PluginMethod public void catalogAppend(PluginCall call) {
        work(reader, call, () -> {
            String data = call.getString("data");
            if (data == null || data.length() > 349528) throw new VaultCrypto.Failure("INVALID_INPUT");
            vault.catalogAppend(call.getString("ticket", ""), call.getData().optLong("offset", -1), Base64.decode(data, Base64.NO_WRAP));
            return new JSONObject().put("ok", true);
        });
    }
    @PluginMethod public void catalogFinish(PluginCall call) { work(reader, call, () -> { vault.catalogFinish(call.getString("ticket", "")); return new JSONObject().put("ok", true); }); }
    @PluginMethod public void catalogAbort(PluginCall call) { work(reader, call, () -> { vault.catalogAbort(call.getString("ticket", "")); return new JSONObject().put("ok", true); }); }
    @PluginMethod public void catalogInfo(PluginCall call) { work(reader, call, () -> vault.catalogInfo()); }
    @PluginMethod public void catalogRead(PluginCall call) {
        work(reader, call, () -> new JSONObject().put("data", Base64.encodeToString(
            vault.catalogRead(call.getData().optLong("version", -1), call.getData().optLong("offset", -1)), Base64.NO_WRAP)));
    }

    // ---------- Native password dialog ----------
    private static final int MODE_CREATE = 0, MODE_OPEN = 1, MODE_UNLOCK = 2;
    static final String[][] WORDS = {
        {"Speicherort verschlüsseln", "Vorhandenen Ordner öffnen", "Ordner entsperren", "Passwort (mindestens 10 Zeichen)", "Passwort wiederholen",
         "Ich habe verstanden: Ohne dieses Passwort sind die Daten im Ordner verloren. Niemand kann es wiederherstellen.",
         "Auf diesem Gerät entsperrt halten (Android-Schlüsselspeicher)", "Einrichten", "Öffnen", "Abbrechen",
         "Das Passwort ist zu kurz (mindestens 10 Zeichen).", "Die beiden Passwörter stimmen nicht überein.", "Bitte bestätige den Hinweis zum Passwort.",
         "Passwort falsch. Es wurde nichts geändert.", "Wird eingerichtet … das dauert einige Sekunden.",
         "Der Ordner ist nicht erreichbar oder nicht beschreibbar. Bitte erneut wählen und die Android-Freigabe prüfen.",
         "Alles, was die App in diesem Ordner ablegt, wird mit deinem Passwort verschlüsselt (AES-256). Das Passwort wird nirgends gespeichert. Auf diesem Gerät kann Android den Ordner zusätzlich entsperrt halten; auf einem neuen Gerät brauchst du immer das Passwort.",
         "Hier liegen bereits verschlüsselte Daten von Private Brain Pro. Mit dem Passwort sind Konten, Entwürfe, Katalog, Originale und Mail-Anhänge wieder verfügbar. Vorhandenes auf diesem Gerät wird nicht überschrieben.",
         "In „Private Brain“ liegen schon andere Dateien. Bitte einen leeren Ordner wählen.", "Passwort wird geprüft … das dauert einige Sekunden.",
         "Gib das Passwort des Ordners ein. Es wird nicht gespeichert.", "Entsperren"},
        {"Encrypt storage location", "Open existing folder", "Unlock folder", "Password (at least 10 characters)", "Repeat password",
         "I understand: without this password the data in the folder is lost. Nobody can recover it.",
         "Keep unlocked on this device (Android keystore)", "Set up", "Open", "Cancel",
         "The password is too short (at least 10 characters).", "The two passwords do not match.", "Please confirm the password notice.",
         "Wrong password. Nothing was changed.", "Setting up … this takes a few seconds.",
         "The folder is unavailable or not writable. Choose it again and check the Android permission.",
         "Everything the app stores in this folder is encrypted with your password (AES-256). The password is not stored anywhere. On this device Android can keep the folder unlocked; on a new device you always need the password.",
         "This folder already contains encrypted Private Brain Pro data. With the password, accounts, drafts, catalog, originals and email attachments become available again. Existing data on this device is not overwritten.",
         "“Private Brain” already contains other files. Please choose an empty folder.", "Checking password … this takes a few seconds.",
         "Enter the folder password. It is not stored.", "Unlock"},
        {"Зашифровать место хранения", "Открыть существующую папку", "Разблокировать папку", "Пароль (не менее 10 символов)", "Повторите пароль",
         "Я понимаю: без этого пароля данные в папке потеряны. Восстановить его невозможно.",
         "Держать разблокированным на этом устройстве (хранилище ключей Android)", "Настроить", "Открыть", "Отмена",
         "Пароль слишком короткий (не менее 10 символов).", "Пароли не совпадают.", "Подтвердите предупреждение о пароле.",
         "Неверный пароль. Ничего не изменено.", "Настройка … это займёт несколько секунд.",
         "Папка недоступна или защищена от записи. Выберите её снова и проверьте разрешение Android.",
         "Всё, что приложение сохраняет в этой папке, шифруется вашим паролем (AES-256). Пароль нигде не хранится. На этом устройстве Android может держать папку разблокированной; на новом устройстве всегда нужен пароль.",
         "В этой папке уже есть зашифрованные данные Private Brain Pro. С паролем снова доступны аккаунты, черновики, каталог, оригиналы и вложения. Данные на этом устройстве не перезаписываются.",
         "В «Private Brain» уже есть другие файлы. Выберите пустую папку.", "Проверка пароля … это займёт несколько секунд.",
         "Введите пароль папки. Он не сохраняется.", "Разблокировать"},
        {"Zaszyfruj miejsce zapisu", "Otwórz istniejący folder", "Odblokuj folder", "Hasło (co najmniej 10 znaków)", "Powtórz hasło",
         "Rozumiem: bez tego hasła dane w folderze są utracone. Nikt nie może go odzyskać.",
         "Pozostaw odblokowane na tym urządzeniu (magazyn kluczy Android)", "Skonfiguruj", "Otwórz", "Anuluj",
         "Hasło jest za krótkie (co najmniej 10 znaków).", "Hasła nie są zgodne.", "Potwierdź informację o haśle.",
         "Błędne hasło. Nic nie zmieniono.", "Konfigurowanie … to potrwa kilka sekund.",
         "Folder jest niedostępny lub tylko do odczytu. Wybierz go ponownie i sprawdź uprawnienia Android.",
         "Wszystko, co aplikacja zapisuje w tym folderze, jest szyfrowane Twoim hasłem (AES-256). Hasło nie jest nigdzie zapisywane. Na tym urządzeniu Android może trzymać folder odblokowany; na nowym urządzeniu zawsze potrzebne jest hasło.",
         "Ten folder zawiera już zaszyfrowane dane Private Brain Pro. Po podaniu hasła konta, szkice, katalog, oryginały i załączniki są znów dostępne. Dane na tym urządzeniu nie są nadpisywane.",
         "W „Private Brain” są już inne pliki. Wybierz pusty folder.", "Sprawdzanie hasła … to potrwa kilka sekund.",
         "Podaj hasło folderu. Nie jest zapisywane.", "Odblokuj"}
    };
    private static int language(String value) { int index = java.util.Arrays.asList("de", "en", "ru", "pl").indexOf(value); return Math.max(index, 0); }
    private static EditText password(Context context, LinearLayout form, String label) {
        TextView title = new TextView(context); title.setText(label); form.addView(title);
        EditText input = new EditText(context); input.setSingleLine(true);
        input.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
        input.setImeOptions(EditorInfo.IME_FLAG_NO_PERSONALIZED_LEARNING); form.addView(input);
        return input;
    }
    private void passwordDialog(PluginCall call, int mode, Uri tree) {
        Activity activity = getActivity();
        String[] t = WORDS[language(call.getString("language", "de"))];
        boolean dark = call.getBoolean("dark", false);
        ContextThemeWrapper context = new ContextThemeWrapper(activity, dark ?
            androidx.appcompat.R.style.Theme_AppCompat_Dialog_Alert : androidx.appcompat.R.style.Theme_AppCompat_Light_Dialog_Alert);
        LinearLayout form = new LinearLayout(context); form.setOrientation(LinearLayout.VERTICAL);
        int padding = Math.round(20 * activity.getResources().getDisplayMetrics().density);
        form.setPadding(padding, padding / 2, padding, padding / 2);
        TextView help = new TextView(context); help.setText(t[mode == MODE_CREATE ? 16 : mode == MODE_OPEN ? 17 : 20]); form.addView(help);
        EditText first = password(context, form, mode == MODE_CREATE ? t[3] : t[3].replaceAll(" \\(.*\\)$", ""));
        EditText second = mode == MODE_CREATE ? password(context, form, t[4]) : null;
        CheckBox understood = null;
        if (mode == MODE_CREATE) { understood = new CheckBox(context); understood.setText(t[5]); form.addView(understood); }
        CheckBox remember = new CheckBox(context); remember.setText(t[6]); remember.setChecked(true); form.addView(remember);
        TextView status = new TextView(context); status.setAccessibilityLiveRegion(View.ACCESSIBILITY_LIVE_REGION_POLITE); form.addView(status);
        ScrollView scroll = new ScrollView(context); scroll.addView(form);
        AlertDialog dialog = new AlertDialog.Builder(context).setTitle(t[mode])
            .setView(scroll).setPositiveButton(t[mode == MODE_CREATE ? 7 : mode == MODE_OPEN ? 8 : 21], null).setNegativeButton(t[9], null).create();
        AtomicBoolean finished = new AtomicBoolean(false), busy = new AtomicBoolean(false);
        Runnable wipe = () -> { first.setText(""); if (second != null) second.setText(""); };
        Runnable cancel = () -> {
            wipe.run();
            if (finished.compareAndSet(false, true)) {
                // A folder chosen and then abandoned keeps no access grant, unless it is the active one.
                if (tree != null && !tree.toString().equals(getContext().getSharedPreferences("vault-v1", Context.MODE_PRIVATE).getString("tree", "")))
                    try { getContext().getContentResolver().releasePersistableUriPermission(tree, Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION); } catch (Exception ignored) { }
                call.resolve(new JSObject().put("cancelled", true));
            }
        };
        dialog.setOnCancelListener(d -> cancel.run());
        dialog.setOnDismissListener(d -> cancel.run());
        CheckBox confirm = understood;
        dialog.setOnShowListener(d -> {
            GradientDrawable background = new GradientDrawable(); background.setColor(Color.parseColor(dark ? "#171d25" : "#faf6f0"));
            background.setCornerRadius(18 * activity.getResources().getDisplayMetrics().density);
            if (dialog.getWindow() != null) dialog.getWindow().setBackgroundDrawable(background);
            dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v -> {
                if (busy.get()) return;
                CharSequence value = first.getText();
                if (mode == MODE_CREATE) {
                    if (value.length() < Vault.MIN_PASSWORD) { status.setText(t[10]); return; }
                    if (!value.toString().equals(second.getText().toString())) { status.setText(t[11]); return; }
                    if (!confirm.isChecked()) { status.setText(t[12]); return; }
                } else if (value.length() == 0) { status.setText(t[13]); return; }
                busy.set(true);
                status.setText(t[mode == MODE_CREATE ? 14 : 19]);
                dialog.getButton(AlertDialog.BUTTON_POSITIVE).setEnabled(false);
                first.setEnabled(false); if (second != null) second.setEnabled(false);
                // Copy for the worker; the fields are cleared as soon as the dialog closes.
                char[] chars = new char[value.length()];
                for (int i = 0; i < chars.length; i++) chars[i] = value.charAt(i);
                boolean keep = remember.isChecked();
                worker.execute(() -> {
                    try {
                        java.nio.CharBuffer password = java.nio.CharBuffer.wrap(chars);
                        JSONObject result;
                        if (mode == MODE_CREATE) result = new JSONObject().put("state", vault.create(tree, password, keep)).put("created", true);
                        else if (mode == MODE_OPEN) {
                            JSONObject state = vault.open(tree, password, keep);
                            result = new JSONObject().put("state", state).put("opened", true)
                                .put("restored", vault.restoreMailStore(new EncryptedMailStore(getContext())));
                        } else result = new JSONObject().put("state", vault.unlock(password, keep)).put("unlocked", true);
                        java.util.Arrays.fill(chars, '\0');
                        activity.runOnUiThread(() -> {
                            if (!finished.compareAndSet(false, true)) return;
                            try { call.resolve(JSObject.fromJSONObject(result)); } catch (Exception error) { call.reject("VAULT_UNAVAILABLE", "VAULT_UNAVAILABLE"); }
                            wipe.run(); dialog.dismiss();
                        });
                    } catch (Exception error) {
                        java.util.Arrays.fill(chars, '\0');
                        String code = vaultCode(error);
                        activity.runOnUiThread(() -> {
                            busy.set(false);
                            status.setText(code.equals("VAULT_PASSWORD_WRONG") ? t[13] : code.equals("VAULT_PASSWORD_SHORT") ? t[10]
                                : code.equals("VAULT_FOLDER_IN_USE") ? t[18] : t[15]);
                            first.setEnabled(true); if (second != null) second.setEnabled(true);
                            dialog.getButton(AlertDialog.BUTTON_POSITIVE).setEnabled(true);
                        });
                    }
                });
            });
        });
        dialog.show();
    }
    // ---------- Gemeinsamer Tresorordner (Schritt D2, Klaus 2026-10-27) ----------
    // Knopf „In den Tresorordner einziehen“ im Kasten „Speicherort und Verschlüsselung“. Gewählt wird die Ebene ÜBER
    // „Private Brain“; sie passt nur, wenn darin genau der entsperrte Tresor liegt (auch als Kopie, für die Probe).
    // Passwort nur im nativen Dialog; der Datenschlüssel verlässt Java nicht (TresorEinzug, ProTresorordner).
    static final String[][] T_WORDS = {
        {"Tresorordner anlegen", "Tresorordner entsperren", "Ein Passwort für alle Pro-Apps (Familienakte Pro, Private Brain Pro, Workflow PDF Pro, BookLedgerPro). Es verlässt das Gerät nie. Mindestens 10 Zeichen.",
         "Das Passwort des Tresorordners (dasselbe wie in den anderen Pro-Apps).", "Passwort vergessen = ohne Ersatzschlüssel kein Zugang. Ich bewahre es sicher auf.",
         "Passwort falsch oder Ordner nicht erreichbar. Nichts wurde verändert.", "Weiter",
         "In diesem Ordner liegt noch kein gemeinsamer Tresor. Wähle den Ordner, in dem „tresorordner.json“ liegt. Gibt es noch keinen: hier neu anlegen.",
         "Ja, hier einen neuen, leeren gemeinsamen Tresor anlegen."},
        {"Create shared vault folder", "Unlock shared vault folder", "One password for all Pro apps (Familienakte Pro, Private Brain Pro, Workflow PDF Pro, BookLedgerPro). It never leaves the device. At least 10 characters.",
         "The shared vault folder password (the same as in the other Pro apps).", "Forgotten password = no access without recovery keys. I will keep it safe.",
         "Wrong password or folder unavailable. Nothing was changed.", "Continue",
         "There is no shared vault in this folder yet. Choose the folder that contains “tresorordner.json”. If there is none yet: create a new one here.",
         "Yes, create a new, empty shared vault here."},
        {"Создать общую папку-хранилище", "Разблокировать общую папку-хранилище", "Один пароль для всех Pro-приложений (Familienakte Pro, Private Brain Pro, Workflow PDF Pro, BookLedgerPro). Он не покидает устройство. Не менее 10 символов.",
         "Пароль общей папки (тот же, что в других Pro-приложениях).", "Забытый пароль = без ключей восстановления доступа нет. Я сохраню его надёжно.",
         "Неверный пароль или папка недоступна. Ничего не изменено.", "Продолжить",
         "В этой папке ещё нет общего сейфа. Выберите папку, в которой лежит «tresorordner.json». Если его ещё нет: создайте новый здесь.",
         "Да, создать здесь новый пустой общий сейф."},
        {"Utwórz wspólny folder sejfu", "Odblokuj wspólny folder sejfu", "Jedno hasło dla wszystkich aplikacji Pro (Familienakte Pro, Private Brain Pro, Workflow PDF Pro, BookLedgerPro). Nigdy nie opuszcza urządzenia. Co najmniej 10 znaków.",
         "Hasło wspólnego folderu (to samo co w innych aplikacjach Pro).", "Zapomniane hasło = bez kluczy zapasowych brak dostępu. Przechowam je bezpiecznie.",
         "Błędne hasło lub folder niedostępny. Nic nie zmieniono.", "Dalej",
         "W tym folderze nie ma jeszcze wspólnego sejfu. Wybierz folder, w którym leży „tresorordner.json”. Jeśli go nie ma: utwórz nowy tutaj.",
         "Tak, utwórz tutaj nowy, pusty wspólny sejf."}
    };
    private final AtomicBoolean tresorBusy = new AtomicBoolean();
    static String tresorCode(Exception error) {
        String m = error.getMessage();
        if (m != null && m.matches("(TRESOR|VAULT)_[A-Z_]+")) return m;
        return vaultCode(error);
    }
    private void tresorWork(PluginCall call, Work task) {
        // Nach handleOnDestroy ist der Arbeits-Thread zu; ein später Aufruf (z. B. Zustand beim Verlassen der App) darf die App
        // nicht abstürzen lassen (CI 2026-10-28: RejectedExecutionException in tresorZustand während eines Activity-Neustarts).
        try {
            worker.execute(() -> {
                try { call.resolve(JSObject.fromJSONObject(task.run())); }
                catch (Exception error) { String code = tresorCode(error); call.reject(code, code); }
            });
        } catch (java.util.concurrent.RejectedExecutionException closed) { call.reject("NATIVE_ACTIVITY_CLOSED", "NATIVE_ACTIVITY_CLOSED"); }
    }
    private ProTresorordner tresor() { return ProTresorordner.get(getContext()); }
    @PluginMethod public void tresorUebergabe(PluginCall call) { tresorWork(call, () -> tresor().uebergabe(call.getData())); }
    @PluginMethod public void tresorZustand(PluginCall call) { tresorWork(call, () -> tresor().zustand(vault)); }
    @PluginMethod public void tresorSperren(PluginCall call) { tresorWork(call, () -> { tresor().sperren(call.getBoolean("vergessen", false)); return tresor().zustand(vault); }); }
    @PluginMethod public void tresorVerzeichnis(PluginCall call) {
        tresorWork(call, () -> {
            JSONArray zeilen = call.getData().optJSONArray("zeilen");
            if (zeilen == null) throw new java.io.IOException("TRESOR_EINTRAG_UNGUELTIG");
            return tresor().verzeichnis(zeilen, vault);
        });
    }
    /** „Überall suchen“: Inhaltsverzeichnis eines Fachs im Tresorordner (alle Pro-Apps) lesen. Nichts wird geschrieben. */
    @PluginMethod public void tresorFach(PluginCall call) { tresorWork(call, () -> tresor().fachLesen(call.getString("fach"))); }
    @PluginMethod public void tresorEinziehen(PluginCall call) {
        if (!tresorBusy.compareAndSet(false, true)) { call.reject("VAULT_BUSY", "VAULT_BUSY"); return; }
        worker.execute(() -> {
            try {
                if (!call.getBoolean("nurVerbinden", false)) { byte[] probe = vault.tresorSchluessel(); java.util.Arrays.fill(probe, (byte) 0); }
                boolean neu = call.getBoolean("neuWaehlen", false) || !tresor().gewaehlt();
                if (!neu && !call.getBoolean("nurVerbinden", false)) { try { neu = !"PASST".equals(tresor().pruefung(vault.tresorId())); } catch (java.io.IOException unerreichbar) { neu = true; } }
                if (neu) { getActivity().runOnUiThread(() -> tresorOrdnerWaehlen(call)); return; }
                tresorWeiter(call);
            } catch (Exception error) { tresorBusy.set(false); String code = tresorCode(error); call.reject(code, code); }
        });
    }
    private void tresorOrdnerWaehlen(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION
            | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION | Intent.FLAG_GRANT_PREFIX_URI_PERMISSION);
        try { startActivityForResult(call, intent, "tresorGewaehlt"); }
        catch (Exception error) { tresorBusy.set(false); call.reject("TRESOR_ORDNER_NICHT_ERREICHBAR", "TRESOR_ORDNER_NICHT_ERREICHBAR"); }
    }
    @ActivityCallback private void tresorGewaehlt(PluginCall call, ActivityResult result) {
        if (call == null) { tresorBusy.set(false); return; }
        Intent data = result.getData();
        if (result.getResultCode() != Activity.RESULT_OK || data == null || data.getData() == null) { tresorBusy.set(false); call.resolve(new JSObject().put("abgebrochen", true)); return; }
        Uri tree = data.getData();
        int required = Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION;
        worker.execute(() -> {
            try {
                if (!"content".equals(tree.getScheme()) || (data.getFlags() & required) != required) throw new VaultCrypto.Failure("VAULT_FOLDER_UNAVAILABLE");
                getContext().getContentResolver().takePersistableUriPermission(tree, required);
                // Gemeinsamer Tresor-Plan: gewählt wird der Ordner mit tresorordner.json. „Tresorordner/“ und Fach-Ordner
                // (auch „Private Brain“) werden abgelehnt, nichts wird dort angelegt.
                String falsch = OrdnerWahl.tresorFehler(OrdnerWahl.einordnen(new de.familyprojekt.tresor.SafAblage(getContext().getContentResolver(), tree), ordnerName(tree)));
                if (falsch != null && !"NEU".equals(falsch)) { freigabeZurueck(tree, "pb-tresorordner-v1", "baum"); throw new java.io.IOException(falsch); }
                if (!call.getBoolean("nurVerbinden", false)) {
                    String pruefung = tresor().pruefen(tree, vault.tresorId());
                    if (!"PASST".equals(pruefung)) throw new java.io.IOException("TRESOR_ORDNER_" + pruefung);
                }
                tresor().baumSetzen(tree);
                tresorWeiter(call);
            } catch (Exception error) { tresorBusy.set(false); String code = tresorCode(error); call.reject(code, code); }
        });
    }
    /** Auf dem Arbeits-Thread: offen oder gemerkt → gleich einziehen, sonst Passwort-Dialog. */
    private void tresorWeiter(PluginCall call) throws Exception {
        tresor().entsperrenGewuenscht();
        if (tresor().istOffen() || tresor().gemerktEntsperren()) {
            if (!call.getBoolean("nurVerbinden", false)) tresor().einziehen(vault);
            JSObject state = JSObject.fromJSONObject(tresor().zustand(vault).put("eingezogenJetzt", !call.getBoolean("nurVerbinden", false)));
            tresorBusy.set(false); call.resolve(state); return;
        }
        boolean anlegen = !tresor().vorhanden();
        getActivity().runOnUiThread(() -> tresorPasswort(call, anlegen));
    }
    private void tresorPasswort(PluginCall call, boolean anlegen) {
        Activity activity = getActivity();
        int lang = language(call.getString("language", "de"));
        String[] t = WORDS[lang], tt = T_WORDS[lang];
        boolean dark = call.getBoolean("dark", false);
        ContextThemeWrapper context = new ContextThemeWrapper(activity, dark ?
            androidx.appcompat.R.style.Theme_AppCompat_Dialog_Alert : androidx.appcompat.R.style.Theme_AppCompat_Light_Dialog_Alert);
        LinearLayout form = new LinearLayout(context); form.setOrientation(LinearLayout.VERTICAL);
        int padding = Math.round(20 * activity.getResources().getDisplayMetrics().density);
        form.setPadding(padding, padding / 2, padding, padding / 2);
        // Kein neuer Tresor ohne ausdrückliche Rückfrage (Klaus 2026-11-03): Hinweissatz und eigener Haken.
        TextView help = new TextView(context); help.setText(anlegen ? tt[7] + "\n\n" + tt[2] : tt[3]); form.addView(help);
        EditText first = password(context, form, anlegen ? t[3] : t[3].replaceAll(" \\(.*\\)$", ""));
        EditText second = anlegen ? password(context, form, t[4]) : null;
        CheckBox notice = null;
        CheckBox neuHier = null;
        if (anlegen) { neuHier = new CheckBox(context); neuHier.setText(tt[8]); form.addView(neuHier); }
        if (anlegen) { notice = new CheckBox(context); notice.setText(tt[4]); form.addView(notice); }
        CheckBox remember = new CheckBox(context); remember.setText(t[6]); remember.setChecked(true); form.addView(remember);
        TextView status = new TextView(context); status.setAccessibilityLiveRegion(View.ACCESSIBILITY_LIVE_REGION_POLITE); form.addView(status);
        ScrollView scroll = new ScrollView(context); scroll.addView(form);
        AlertDialog dialog = new AlertDialog.Builder(context).setTitle(tt[anlegen ? 0 : 1]).setView(scroll)
            .setPositiveButton(tt[6], null).setNegativeButton(t[9], null).create();
        AtomicBoolean finished = new AtomicBoolean(false), busy = new AtomicBoolean(false);
        Runnable wipe = () -> { first.setText(""); if (second != null) second.setText(""); };
        Runnable cancel = () -> { wipe.run(); if (finished.compareAndSet(false, true)) { tresorBusy.set(false); call.resolve(new JSObject().put("abgebrochen", true)); } };
        dialog.setOnCancelListener(d -> cancel.run());
        dialog.setOnDismissListener(d -> cancel.run());
        CheckBox confirm = notice, confirmNeu = neuHier;
        dialog.setOnShowListener(d -> dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v -> {
            if (busy.get()) return;
            CharSequence value = first.getText();
            if (value.length() < Vault.MIN_PASSWORD) { status.setText(t[10]); return; }
            if (anlegen && !value.toString().equals(second.getText().toString())) { status.setText(t[11]); return; }
            if (anlegen && !confirmNeu.isChecked()) { status.setText(tt[7]); return; }
            if (anlegen && !confirm.isChecked()) { status.setText(t[12]); return; }
            busy.set(true); status.setText(t[19]);
            dialog.getButton(AlertDialog.BUTTON_POSITIVE).setEnabled(false);
            char[] chars = new char[value.length()];
            for (int i = 0; i < chars.length; i++) chars[i] = value.charAt(i);
            boolean keep = remember.isChecked();
            worker.execute(() -> {
                try {
                    tresor().mitPasswort(java.nio.CharBuffer.wrap(chars), anlegen, keep, vault, call.getBoolean("nurVerbinden", false));
                    java.util.Arrays.fill(chars, '\0');
                    JSObject state = JSObject.fromJSONObject(tresor().zustand(vault).put("eingezogenJetzt", !call.getBoolean("nurVerbinden", false)).put("angelegt", anlegen));
                    activity.runOnUiThread(() -> {
                        if (!finished.compareAndSet(false, true)) return;
                        tresorBusy.set(false); call.resolve(state); wipe.run(); dialog.dismiss();
                    });
                } catch (Exception error) {
                    java.util.Arrays.fill(chars, '\0');
                    String code = tresorCode(error);
                    boolean nochmal = "TRESOR_PASSWORT_FALSCH".equals(code) || "TRESOR_ORDNER_NICHT_ERREICHBAR".equals(code);
                    activity.runOnUiThread(() -> {
                        if (nochmal) {
                            busy.set(false); status.setText(tt[5]); wipe.run();
                            dialog.getButton(AlertDialog.BUTTON_POSITIVE).setEnabled(true);
                        } else if (finished.compareAndSet(false, true)) {
                            // Belegtes Fach, anderer Ordner: nicht neu versuchen, Meldung in der Seite.
                            tresorBusy.set(false); call.reject(code, code); wipe.run(); dialog.dismiss();
                        }
                    });
                }
            });
        }));
        dialog.show();
    }
    // ---------- „Tresor einrichten – nur Speicher wählen“ (Klaus 2026-11-04) ----------
    // Vorbild Workflow PDF Pro tresorEinrichten, Familienakte #92, BookLedgerPro #454. Der Nutzer wählt nur den Speicher;
    // der Tresor-Hauptordner wird am Inhalt gefunden oder angelegt (Name frei, Vorschlag „Family-Projekt“). EIN Passwort für
    // den gemeinsamen Tresor und die eigene Ablage „Private Brain“ darin. Entscheidung gerätefrei in TresorEinrichtung
    // (JUnit); hier nur Speicherwahl und Fenster. Bis zur Bestätigung im Passwort-Fenster ist nichts geschrieben; ein falsches
    // Tresor-Passwort darf neu versucht werden. Eine schon eingerichtete eigene Ablage an einem anderen Ort zieht nie still um.
    static final String[][] E_WORDS = {
        {"Tresor einrichten", "Tresor öffnen", "Neuer Tresor-Hauptordner", "Im gewählten Speicher entsteht ein Ordner für alle Pro-Apps. Name frei wählbar:",
         "Dieser Name geht nicht (keine Zeichen wie / \\ : * ? \" < > |, nicht der Name eines Fachs). Bitte anderen Namen.",
         "Ein Passwort für den gemeinsamen Tresor und die Ablage von Private Brain Pro darin (Mails, Anhänge, Originale, Katalog). Es verlässt das Gerät nie. Mindestens 10 Zeichen.",
         "Das Passwort des Tresors (dasselbe wie in den anderen Pro-Apps). Die Ablage von Private Brain Pro darin bekommt dasselbe Passwort.",
         "Gefunden: ", "Neu: ", "Weiter", "Passwort falsch. Nichts wurde verändert."},
        {"Set up vault", "Open vault", "New vault main folder", "A folder for all Pro apps is created in the chosen storage. Choose any name:",
         "This name is not allowed (no / \\ : * ? \" < > |, not the name of a compartment). Please choose another.",
         "One password for the shared vault and Private Brain Pro’s storage inside it (emails, attachments, originals, catalog). It never leaves the device. At least 10 characters.",
         "The vault password (the same as in the other Pro apps). Private Brain Pro’s storage inside gets the same password.",
         "Found: ", "New: ", "Continue", "Wrong password. Nothing was changed."},
        {"Настроить сейф", "Открыть сейф", "Новая главная папка сейфа", "В выбранном хранилище будет создана папка для всех Pro-приложений. Имя на выбор:",
         "Это имя недопустимо (без / \\ : * ? \" < > |, не имя отсека). Выберите другое.",
         "Один пароль для общего сейфа и хранилища Private Brain Pro в нём (письма, вложения, оригиналы, каталог). Он не покидает устройство. Не менее 10 символов.",
         "Пароль сейфа (тот же, что в других Pro-приложениях). Хранилище Private Brain Pro в нём получит тот же пароль.",
         "Найдено: ", "Новое: ", "Далее", "Неверный пароль. Ничего не изменено."},
        {"Skonfiguruj sejf", "Otwórz sejf", "Nowy główny folder sejfu", "W wybranej pamięci powstanie folder dla wszystkich aplikacji Pro. Nazwa dowolna:",
         "Ta nazwa jest niedozwolona (bez / \\ : * ? \" < > |, nie nazwa przegródki). Wybierz inną.",
         "Jedno hasło dla wspólnego sejfu i miejsca Private Brain Pro w nim (wiadomości, załączniki, oryginały, katalog). Nigdy nie opuszcza urządzenia. Co najmniej 10 znaków.",
         "Hasło sejfu (to samo co w innych aplikacjach Pro). Miejsce Private Brain Pro w nim dostaje to samo hasło.",
         "Znaleziono: ", "Nowy: ", "Dalej", "Błędne hasło. Nic nie zmieniono."}
    };
    @PluginMethod public void tresorEinrichten(PluginCall call) {
        if (!tresorBusy.compareAndSet(false, true)) { call.reject("VAULT_BUSY", "VAULT_BUSY"); return; }
        Intent intent = null;
        String volume = call.getString("volume", "");
        if (Build.VERSION.SDK_INT >= 29 && !volume.isEmpty()) {
            StorageManager storage = (StorageManager) getContext().getSystemService(Context.STORAGE_SERVICE);
            if (storage != null) for (StorageVolume v : storage.getStorageVolumes())
                if (volume.equals(v.isPrimary() ? "primary" : String.valueOf(v.getUuid()))) intent = v.createOpenDocumentTreeIntent();
        }
        if (intent == null) intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION
            | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION | Intent.FLAG_GRANT_PREFIX_URI_PERMISSION);
        try { startActivityForResult(call, intent, "einrichtenGewaehlt"); }
        catch (Exception error) { tresorBusy.set(false); call.reject("TRESOR_ORDNER_NICHT_ERREICHBAR", "TRESOR_ORDNER_NICHT_ERREICHBAR"); }
    }
    /** Abgebrochen oder abgewiesen: die neue Freigabe nicht behalten, außer Ablage oder Tresor benutzen sie schon. */
    private void einrichtenEnde(PluginCall call, Uri tree, String code) {
        if (tree != null && !tree.toString().equals(getContext().getSharedPreferences("vault-v1", Context.MODE_PRIVATE).getString("tree", "")))
            freigabeZurueck(tree, "pb-tresorordner-v1", "baum");
        tresorBusy.set(false);
        if (code == null) call.resolve(new JSObject().put("abgebrochen", true)); else call.reject(code, code);
    }
    @ActivityCallback private void einrichtenGewaehlt(PluginCall call, ActivityResult result) {
        if (call == null) { tresorBusy.set(false); return; }
        Intent data = result.getData();
        if (result.getResultCode() != Activity.RESULT_OK || data == null || data.getData() == null) { einrichtenEnde(call, null, null); return; }
        Uri tree = data.getData();
        int required = Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION;
        try {
            worker.execute(() -> {
                try {
                    if (!"content".equals(tree.getScheme()) || (data.getFlags() & required) != required) throw new VaultCrypto.Failure("VAULT_FOLDER_UNAVAILABLE");
                    getContext().getContentResolver().takePersistableUriPermission(tree, required);
                    de.familyprojekt.tresor.SafAblage s = new de.familyprojekt.tresor.SafAblage(getContext().getContentResolver(), tree);
                    de.familyprojekt.tresor.Hauptordner.Ergebnis e = TresorEinrichtung.pruefen(s, ordnerName(tree));
                    if (de.familyprojekt.tresor.Hauptordner.ANLEGEN_DARIN.equals(e.art) && !TresorEinrichtung.alteAblageHier(s))
                        getActivity().runOnUiThread(() -> einrichtenName(call, tree, s, e, false));
                    else einrichtenPlanen(call, tree, s, e, null);
                } catch (Exception error) { einrichtenEnde(call, tree, tresorCode(error)); }
            });
        } catch (java.util.concurrent.RejectedExecutionException closed) { einrichtenEnde(call, tree, "NATIVE_ACTIVITY_CLOSED"); }
    }
    private ContextThemeWrapper dialogKontext(PluginCall call) {
        return new ContextThemeWrapper(getActivity(), call.getBoolean("dark", false) ?
            androidx.appcompat.R.style.Theme_AppCompat_Dialog_Alert : androidx.appcompat.R.style.Theme_AppCompat_Light_Dialog_Alert);
    }
    /** Name des neuen Hauptordners (Vorschlag „Family-Projekt“), nur wenn im Speicher schon anderes liegt. UI-Thread. */
    private void einrichtenName(PluginCall call, Uri tree, de.familyprojekt.tresor.SafAblage s, de.familyprojekt.tresor.Hauptordner.Ergebnis e, boolean fehler) {
        Activity activity = getActivity();
        if (activity == null || activity.isFinishing() || activity.isDestroyed()) { einrichtenEnde(call, tree, "NATIVE_ACTIVITY_CLOSED"); return; }
        int lang = language(call.getString("language", "de"));
        String[] t = WORDS[lang], e2 = E_WORDS[lang];
        ContextThemeWrapper context = dialogKontext(call);
        LinearLayout form = new LinearLayout(context); form.setOrientation(LinearLayout.VERTICAL);
        int padding = Math.round(20 * activity.getResources().getDisplayMetrics().density); form.setPadding(padding, padding / 2, padding, padding / 2);
        TextView help = new TextView(context); help.setText(e2[3]); form.addView(help);
        EditText feld = new EditText(context); feld.setSingleLine(true); feld.setText(de.familyprojekt.tresor.Hauptordner.VORSCHLAG); feld.selectAll(); form.addView(feld);
        TextView status = new TextView(context); status.setAccessibilityLiveRegion(View.ACCESSIBILITY_LIVE_REGION_POLITE); if (fehler) status.setText(e2[4]); form.addView(status);
        AlertDialog dialog = new AlertDialog.Builder(context).setTitle(e2[2]).setView(form).setPositiveButton(e2[9], null).setNegativeButton(t[9], null).create();
        AtomicBoolean finished = new AtomicBoolean(false);
        Runnable cancel = () -> { if (finished.compareAndSet(false, true)) einrichtenEnde(call, tree, null); };
        dialog.setOnCancelListener(d -> cancel.run());
        dialog.setOnDismissListener(d -> cancel.run());
        dialog.setOnShowListener(d -> {
            dialog.getButton(AlertDialog.BUTTON_NEGATIVE).setOnClickListener(v -> dialog.dismiss());
            dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v -> {
                String n;
                try { n = de.familyprojekt.tresor.Hauptordner.name(feld.getText().toString()); }
                catch (java.io.IOException falsch) { status.setText(e2[4]); return; }
                if (!finished.compareAndSet(false, true)) return;
                dialog.dismiss();
                try {
                    worker.execute(() -> {
                        try { einrichtenPlanen(call, tree, s, e, n); }
                        catch (Exception error) { einrichtenEnde(call, tree, tresorCode(error)); }
                    });
                } catch (java.util.concurrent.RejectedExecutionException closed) { einrichtenEnde(call, tree, "NATIVE_ACTIVITY_CLOSED"); }
            });
        });
        dialog.show(); feld.requestFocus();
    }
    /** Arbeits-Thread: nur lesend planen, dann das eine Passwort-Fenster. */
    private void einrichtenPlanen(PluginCall call, Uri tree, de.familyprojekt.tresor.SafAblage s, de.familyprojekt.tresor.Hauptordner.Ergebnis e, String name) throws Exception {
        TresorEinrichtung.Plan plan = TresorEinrichtung.planen(s, e, name, vault.configured() ? vault.tresorId() : null);
        String zeige = plan.pfad.isEmpty() ? ordnerName(tree) : plan.pfad;
        getActivity().runOnUiThread(() -> einrichtenPasswort(call, tree, s, plan, zeige));
    }
    private void einrichtenPasswort(PluginCall call, Uri tree, de.familyprojekt.tresor.SafAblage s, TresorEinrichtung.Plan plan, String zeige) {
        Activity activity = getActivity();
        if (activity == null || activity.isFinishing() || activity.isDestroyed()) { einrichtenEnde(call, tree, "NATIVE_ACTIVITY_CLOSED"); return; }
        int lang = language(call.getString("language", "de"));
        String[] t = WORDS[lang], tt = T_WORDS[lang], e2 = E_WORDS[lang];
        boolean anlegen = plan.anlegen();
        ContextThemeWrapper context = dialogKontext(call);
        LinearLayout form = new LinearLayout(context); form.setOrientation(LinearLayout.VERTICAL);
        int padding = Math.round(20 * activity.getResources().getDisplayMetrics().density); form.setPadding(padding, padding / 2, padding, padding / 2);
        TextView ort = new TextView(context); ort.setText(e2[plan.tresorDa ? 7 : 8] + zeige); form.addView(ort);
        TextView help = new TextView(context); help.setText(e2[plan.tresorDa ? 6 : 5]); form.addView(help);
        EditText first = password(context, form, anlegen ? t[3] : t[3].replaceAll(" \\(.*\\)$", ""));
        EditText second = anlegen ? password(context, form, t[4]) : null;
        CheckBox notice = null;
        if (anlegen) { notice = new CheckBox(context); notice.setText(tt[4]); form.addView(notice); }
        CheckBox remember = new CheckBox(context); remember.setText(t[6]); remember.setChecked(true); form.addView(remember);
        TextView status = new TextView(context); status.setAccessibilityLiveRegion(View.ACCESSIBILITY_LIVE_REGION_POLITE); form.addView(status);
        ScrollView scroll = new ScrollView(context); scroll.addView(form);
        AlertDialog dialog = new AlertDialog.Builder(context).setTitle(e2[plan.tresorDa ? 1 : 0]).setView(scroll)
            .setPositiveButton(e2[9], null).setNegativeButton(t[9], null).create();
        AtomicBoolean finished = new AtomicBoolean(false), busy = new AtomicBoolean(false);
        Runnable wipe = () -> { first.setText(""); if (second != null) second.setText(""); };
        Runnable cancel = () -> { wipe.run(); if (!busy.get() && finished.compareAndSet(false, true)) einrichtenEnde(call, tree, null); };
        dialog.setOnCancelListener(d -> cancel.run());
        dialog.setOnDismissListener(d -> cancel.run());
        CheckBox confirm = notice;
        dialog.setOnShowListener(d -> dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v -> {
            if (busy.get()) return;
            CharSequence value = first.getText();
            if (value.length() < Vault.MIN_PASSWORD) { status.setText(t[10]); return; }
            if (anlegen && !value.toString().equals(second.getText().toString())) { status.setText(t[11]); return; }
            if (anlegen && !confirm.isChecked()) { status.setText(t[12]); return; }
            busy.set(true); status.setText(t[anlegen ? 14 : 19]); dialog.setCancelable(false);
            dialog.getButton(AlertDialog.BUTTON_POSITIVE).setEnabled(false); dialog.getButton(AlertDialog.BUTTON_NEGATIVE).setEnabled(false);
            char[] chars = new char[value.length()];
            for (int i = 0; i < chars.length; i++) chars[i] = value.charAt(i);
            boolean keep = remember.isChecked();
            try {
                worker.execute(() -> {
                    try {
                        JSObject state = JSObject.fromJSONObject(einrichtenAusfuehren(tree, s, plan, java.nio.CharBuffer.wrap(chars), keep));
                        java.util.Arrays.fill(chars, '\0');
                        activity.runOnUiThread(() -> {
                            if (!finished.compareAndSet(false, true)) return;
                            tresorBusy.set(false); call.resolve(state); wipe.run(); dialog.dismiss();
                        });
                    } catch (Exception error) {
                        java.util.Arrays.fill(chars, '\0');
                        String code = tresorCode(error);
                        boolean nochmal = "TRESOR_PASSWORT_FALSCH".equals(code) || "TRESOR_PASSWORT".equals(code);
                        activity.runOnUiThread(() -> {
                            if (nochmal) {
                                busy.set(false); status.setText(e2[10]); wipe.run(); dialog.setCancelable(true);
                                dialog.getButton(AlertDialog.BUTTON_POSITIVE).setEnabled(true); dialog.getButton(AlertDialog.BUTTON_NEGATIVE).setEnabled(true);
                            } else if (finished.compareAndSet(false, true)) { busy.set(false); einrichtenEnde(call, tree, code); wipe.run(); dialog.dismiss(); }
                        });
                    }
                });
            } catch (java.util.concurrent.RejectedExecutionException closed) { java.util.Arrays.fill(chars, '\0'); busy.set(false); einrichtenEnde(call, tree, "NATIVE_ACTIVITY_CLOSED"); }
        }));
        dialog.show(); first.requestFocus();
    }
    /** Arbeits-Thread: erst alle Passwörter prüfen, dann Hauptordner, eigene Ablage, Tresor, Einzug, Lies-mich. */
    private JSONObject einrichtenAusfuehren(Uri tree, de.familyprojekt.tresor.SafAblage s, TresorEinrichtung.Plan plan, CharSequence p, boolean keep) throws Exception {
        // 1. Prüfen ohne zu schreiben: falsches Tresor-Passwort → TRESOR_PASSWORT_FALSCH (Fenster bleibt offen).
        TresorEinrichtung.tresorPasswortPruefen(s, plan, p);
        boolean geoeffnet = false;
        if (plan.ablageDa) {
            String w = s.kennung(plan.pfad);
            if (w == null) throw new java.io.IOException("TRESOR_ORDNER_NICHT_ERREICHBAR");
            try {
                // Vault.open schreibt nur die eigenen Einstellungen, und erst nach dem richtigen Passwort.
                if (!vault.configured()) { vault.open(tree, w, p, keep); geoeffnet = true; }
                else if (!vault.unlocked()) vault.unlock(p, keep);
            } catch (Exception falsch) {
                if ("VAULT_PASSWORD_WRONG".equals(tresorCode(falsch))) throw new java.io.IOException("TRESOR_ABLAGE_PASSWORT_ANDERS");
                throw falsch;
            }
        }
        // 2. Schreiben.
        TresorEinrichtung.hauptAnlegen(s, plan);
        String wurzel = s.kennung(plan.pfad);
        if (wurzel == null) throw new java.io.IOException("TRESOR_ORDNER_NICHT_ERREICHBAR");
        if (!plan.ablageDa) vault.create(tree, wurzel, p, keep);
        tresor().baumSetzen(tree, wurzel);
        tresor().mitPasswort(p, !plan.tresorDa, keep, vault, false);
        TresorEinrichtung.liesMich(new de.familyprojekt.tresor.SafAblage(getContext().getContentResolver(), tree, wurzel));
        JSONObject out = tresor().zustand(vault).put("eingezogenJetzt", true).put("angelegt", !plan.tresorDa)
            .put("ablageAngelegt", !plan.ablageDa).put("hauptordner", plan.pfad).put("state", vault.state());
        if (geoeffnet) out.put("restored", vault.restoreMailStore(new EncryptedMailStore(getContext())));
        return out;
    }
    @Override protected void handleOnDestroy() { worker.shutdown(); reader.shutdown(); }
}

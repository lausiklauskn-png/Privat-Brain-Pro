package de.familyprojekt.privatebrain.pro;

import android.app.Activity;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.text.InputType;
import android.view.ContextThemeWrapper;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import androidx.appcompat.app.AlertDialog;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import org.json.JSONArray;
import org.json.JSONObject;

/** Protection lists and fingerprint checks. Access keys are typed only into Android's own dialog. */
@CapacitorPlugin(name = "ProProtect")
public class ProProtectPlugin extends Plugin {
    // Downloads must not hold up lookups while a mail is being shown.
    private final ExecutorService downloads = Executors.newSingleThreadExecutor();
    private final ExecutorService lookups = Executors.newSingleThreadExecutor();
    private Protection protection;
    @Override public void load() { protection = Protection.create(getContext()); }
    private interface Work { JSONObject run() throws Exception; }
    private void work(ExecutorService executor, PluginCall call, Work task) {
        executor.execute(() -> {
            try { call.resolve(JSObject.fromJSONObject(task.run())); }
            catch (Exception error) { String code = ProVaultPlugin.vaultCode(error); call.reject(code, code); }
        });
    }
    @PluginMethod public void state(PluginCall call) { work(lookups, call, () -> protection.state()); }
    @PluginMethod public void update(PluginCall call) { work(downloads, call, () -> protection.update(call.getBoolean("force", false))); }
    @PluginMethod public void setAuto(PluginCall call) {
        work(lookups, call, () -> { protection.setAuto(call.getBoolean("value", true)); return protection.state(); });
    }
    @PluginMethod public void checkHashes(PluginCall call) {
        work(lookups, call, () -> {
            JSONArray items = call.getData().optJSONArray("items");
            if (items == null) throw new VaultCrypto.Failure("INVALID_INPUT");
            return protection.checkHashes(items);
        });
    }
    @PluginMethod public void checkUrls(PluginCall call) {
        work(lookups, call, () -> {
            JSONArray items = call.getData().optJSONArray("items");
            if (items == null) throw new VaultCrypto.Failure("INVALID_INPUT");
            return protection.checkUrls(items);
        });
    }
    @PluginMethod public void virusTotal(PluginCall call) { work(downloads, call, () -> protection.virusTotal(call.getString("sha256", ""))); }
    @PluginMethod public void setKey(PluginCall call) { getActivity().runOnUiThread(() -> keyDialog(call)); }

    // ---------- native dialog for access keys ----------
    static final String[][] WORDS = {
        {"Zugangsschlüssel für abuse.ch", "Zugangsschlüssel für VirusTotal",
         "abuse.ch (MalwareBazaar, URLhaus) gibt seine Listen nur mit einem persönlichen, kostenlosen Schlüssel heraus. Konto anlegen auf auth.abuse.ch, dort „Auth-Key“ erzeugen und hier einfügen. Der Schlüssel liegt verschlüsselt in deinem Speicherort-Ordner und wird nur beim Abruf der Listen an abuse.ch geschickt.",
         "VirusTotal prüft auf Tipp den Fingerabdruck einer Datei (nicht die Datei selbst) bei rund 70 Virenscannern. Kostenloses Konto auf virustotal.com, dort unter „API Key“ kopieren und hier einfügen. Der Schlüssel liegt verschlüsselt in deinem Speicherort-Ordner.",
         "Schlüssel", "Speichern", "Entfernen", "Abbrechen", "Das sieht nicht wie ein Schlüssel aus (20–128 Zeichen: Buchstaben, Ziffern, - und _).",
         "Der Speicherort ist gesperrt oder nicht erreichbar. Erst entsperren."},
        {"Access key for abuse.ch", "Access key for VirusTotal",
         "abuse.ch (MalwareBazaar, URLhaus) provides its lists only with a personal, free key. Create an account at auth.abuse.ch, generate an “Auth-Key” there and paste it here. The key is stored encrypted in your storage folder and is sent to abuse.ch only when the lists are fetched.",
         "On your tap, VirusTotal checks a file's fingerprint (not the file itself) with about 70 virus scanners. Free account at virustotal.com, copy the “API Key” there and paste it here. The key is stored encrypted in your storage folder.",
         "Key", "Save", "Remove", "Cancel", "This does not look like a key (20–128 characters: letters, digits, - and _).",
         "The storage location is locked or unavailable. Unlock it first."},
        {"Ключ доступа abuse.ch", "Ключ доступа VirusTotal",
         "abuse.ch (MalwareBazaar, URLhaus) выдаёт списки только с личным бесплатным ключом. Создайте аккаунт на auth.abuse.ch, получите «Auth-Key» и вставьте его сюда. Ключ хранится зашифрованно в вашей папке и отправляется abuse.ch только при загрузке списков.",
         "По нажатию VirusTotal проверяет отпечаток файла (не сам файл) примерно у 70 антивирусов. Бесплатный аккаунт на virustotal.com, скопируйте «API Key» и вставьте сюда. Ключ хранится зашифрованно в вашей папке.",
         "Ключ", "Сохранить", "Удалить", "Отмена", "Это не похоже на ключ (20–128 символов: буквы, цифры, - и _).",
         "Хранилище заблокировано или недоступно. Сначала разблокируйте."},
        {"Klucz dostępu abuse.ch", "Klucz dostępu VirusTotal",
         "abuse.ch (MalwareBazaar, URLhaus) udostępnia listy tylko z osobistym, bezpłatnym kluczem. Załóż konto na auth.abuse.ch, wygeneruj „Auth-Key” i wklej go tutaj. Klucz jest zaszyfrowany w Twoim folderze i wysyłany do abuse.ch tylko przy pobieraniu list.",
         "Po dotknięciu VirusTotal sprawdza odcisk pliku (nie sam plik) w około 70 skanerach. Bezpłatne konto na virustotal.com, skopiuj „API Key” i wklej tutaj. Klucz jest zaszyfrowany w Twoim folderze.",
         "Klucz", "Zapisz", "Usuń", "Anuluj", "To nie wygląda na klucz (20–128 znaków: litery, cyfry, - i _).",
         "Miejsce zapisu jest zablokowane lub niedostępne. Najpierw odblokuj."}
    };
    private static int language(String value) { return Math.max(0, java.util.Arrays.asList("de", "en", "ru", "pl").indexOf(value)); }
    private void keyDialog(PluginCall call) {
        String service = call.getString("service", "");
        if (!"abusech".equals(service) && !"virustotal".equals(service)) { call.reject("INVALID_INPUT", "INVALID_INPUT"); return; }
        boolean vt = "virustotal".equals(service);
        Activity activity = getActivity();
        String[] t = WORDS[language(call.getString("language", "de"))];
        boolean dark = call.getBoolean("dark", false);
        ContextThemeWrapper context = new ContextThemeWrapper(activity, dark ?
            androidx.appcompat.R.style.Theme_AppCompat_Dialog_Alert : androidx.appcompat.R.style.Theme_AppCompat_Light_Dialog_Alert);
        LinearLayout form = new LinearLayout(context); form.setOrientation(LinearLayout.VERTICAL);
        int padding = Math.round(20 * activity.getResources().getDisplayMetrics().density);
        form.setPadding(padding, padding / 2, padding, padding / 2);
        TextView help = new TextView(context); help.setText(t[vt ? 3 : 2]); form.addView(help);
        TextView label = new TextView(context); label.setText(t[4]); form.addView(label);
        EditText input = new EditText(context); input.setSingleLine(true);
        // Visible password: no suggestions and no learning, but the user can check what was pasted.
        input.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD);
        input.setImeOptions(EditorInfo.IME_FLAG_NO_PERSONALIZED_LEARNING); form.addView(input);
        TextView status = new TextView(context); status.setAccessibilityLiveRegion(View.ACCESSIBILITY_LIVE_REGION_POLITE); form.addView(status);
        ScrollView scroll = new ScrollView(context); scroll.addView(form);
        AlertDialog dialog = new AlertDialog.Builder(context).setTitle(t[vt ? 1 : 0]).setView(scroll)
            .setPositiveButton(t[5], null).setNeutralButton(t[6], null).setNegativeButton(t[7], null).create();
        AtomicBoolean finished = new AtomicBoolean(false), busy = new AtomicBoolean(false);
        Runnable cancel = () -> { input.setText(""); if (finished.compareAndSet(false, true)) call.resolve(new JSObject().put("cancelled", true)); };
        dialog.setOnCancelListener(d -> cancel.run());
        dialog.setOnDismissListener(d -> cancel.run());
        dialog.setOnShowListener(d -> {
            GradientDrawable background = new GradientDrawable(); background.setColor(Color.parseColor(dark ? "#171d25" : "#faf6f0"));
            background.setCornerRadius(18 * activity.getResources().getDisplayMetrics().density);
            if (dialog.getWindow() != null) dialog.getWindow().setBackgroundDrawable(background);
            View.OnClickListener save = v -> {
                if (busy.get()) return;
                boolean remove = v == dialog.getButton(AlertDialog.BUTTON_NEUTRAL);
                String value = remove ? "" : input.getText().toString().trim();
                if (!remove && !Protection.validKey(value)) { status.setText(t[8]); return; }
                busy.set(true);
                downloads.execute(() -> {
                    try {
                        protection.setKey(service, value);
                        JSONObject state = protection.state();
                        activity.runOnUiThread(() -> {
                            if (!finished.compareAndSet(false, true)) return;
                            try { call.resolve(JSObject.fromJSONObject(new JSONObject().put("saved", !remove).put("removed", remove).put("state", state))); }
                            catch (Exception error) { call.reject("VAULT_UNAVAILABLE", "VAULT_UNAVAILABLE"); }
                            input.setText(""); dialog.dismiss();
                        });
                    } catch (Exception error) {
                        activity.runOnUiThread(() -> { busy.set(false); status.setText(t[9]); });
                    }
                });
            };
            dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(save);
            dialog.getButton(AlertDialog.BUTTON_NEUTRAL).setOnClickListener(save);
        });
        dialog.show();
    }
    @Override protected void handleOnDestroy() { downloads.shutdown(); lookups.shutdown(); }
}

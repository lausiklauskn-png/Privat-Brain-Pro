package de.familyprojekt.privatebrain.pro;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.media.AudioDeviceInfo;
import android.media.AudioManager;
import android.os.Build;
import android.speech.RecognizerIntent;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Speech input for the search field (Klaus 2026-10-21: "das Mikrofon nicht verfügbar").
 * The Android WebView has no Web Speech API, so the system's own speech dialog listens.
 * The app gets only the recognized text; it never records audio itself and needs no
 * microphone permission. Offline recognition is preferred while the app is cut off.
 *
 * Klaus 2026-10-27: a microphone can be chosen (device, cable, USB, Bluetooth). The app
 * still records nothing: it only asks Android's audio routing to use that device while
 * the system dialog listens, and restores the routing afterwards. A chosen but missing
 * microphone is reported, never silently replaced.
 */
@CapacitorPlugin(name = "ProSpeech")
public class ProSpeechPlugin extends Plugin {
    private final AtomicBoolean listening = new AtomicBoolean();
    private boolean routedCommunication = false, routedSco = false;

    private static final class Input {
        final String id, name, kind; final AudioDeviceInfo device;
        Input(String id, String name, String kind, AudioDeviceInfo device) { this.id = id; this.name = name; this.kind = kind; this.device = device; }
    }

    private AudioManager audio() { return (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE); }

    static String kindOf(int type) {
        switch (type) {
            case AudioDeviceInfo.TYPE_BUILTIN_MIC: return "builtin";
            case AudioDeviceInfo.TYPE_WIRED_HEADSET: return "wired";
            case AudioDeviceInfo.TYPE_USB_DEVICE: case AudioDeviceInfo.TYPE_USB_HEADSET: case AudioDeviceInfo.TYPE_USB_ACCESSORY: return "usb";
            case AudioDeviceInfo.TYPE_BLUETOOTH_SCO: case 26 /* TYPE_BLE_HEADSET, API 31 */: return "bluetooth";
            case AudioDeviceInfo.TYPE_LINE_ANALOG: case AudioDeviceInfo.TYPE_LINE_DIGITAL: case AudioDeviceInfo.TYPE_DOCK: return "wired";
            default: return null;
        }
    }

    private static String shortHash(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder out = new StringBuilder();
            for (int i = 0; i < 6; i++) out.append(String.format("%02x", digest[i]));
            return out.toString();
        } catch (Exception error) { return Integer.toHexString(value.hashCode()); }
    }

    /** All microphones Android reports; the built-in microphones count as one. */
    private List<Input> inputs() {
        List<Input> out = new ArrayList<>();
        boolean builtin = false;
        for (AudioDeviceInfo device : audio().getDevices(AudioManager.GET_DEVICES_INPUTS)) {
            String kind = kindOf(device.getType());
            if (kind == null) continue;
            if ("builtin".equals(kind)) {
                if (builtin) continue;
                builtin = true; out.add(new Input("builtin", "", kind, device)); continue;
            }
            CharSequence product = device.getProductName();
            String name = product == null ? "" : product.toString().replaceAll("[\\p{Cntrl}]+", " ").trim();
            if (name.length() > 120) name = name.substring(0, 120);
            String address = Build.VERSION.SDK_INT >= 28 ? String.valueOf(device.getAddress()) : "";
            String id = kind + ":" + shortHash(device.getType() + "|" + address + "|" + name);
            boolean known = false;
            for (Input input : out) if (input.id.equals(id)) known = true;
            if (!known && out.size() < 32) out.add(new Input(id, name, kind, device));
        }
        return out;
    }

    @PluginMethod public void inputs(PluginCall call) {
        try {
            JSArray items = new JSArray();
            for (Input input : inputs()) items.put(new JSObject().put("id", input.id).put("name", input.name).put("kind", input.kind).put("default", false));
            call.resolve(new JSObject().put("items", items));
        } catch (Exception error) { call.reject("Speech inputs failed", "SPEECH_UNAVAILABLE"); }
    }

    private Input pick(String id, String name) {
        List<Input> all = inputs();
        if (id != null && !id.isEmpty()) for (Input input : all) if (input.id.equals(id)) return input;
        Input found = null;
        if (name != null && !name.isEmpty()) for (Input input : all) if (input.name.equals(name)) { if (found != null) return null; found = input; }
        return found;
    }

    /** The output Android pairs with this microphone for its communication route. */
    private AudioDeviceInfo communicationPartner(AudioManager manager, Input input) {
        if (Build.VERSION.SDK_INT < 31) return null;
        int type = input.device.getType();
        String address = String.valueOf(input.device.getAddress());
        for (AudioDeviceInfo device : manager.getAvailableCommunicationDevices()) {
            int candidate = device.getType();
            boolean match;
            if ("builtin".equals(input.kind)) match = candidate == AudioDeviceInfo.TYPE_BUILTIN_SPEAKER || candidate == AudioDeviceInfo.TYPE_BUILTIN_EARPIECE;
            else if ("bluetooth".equals(input.kind)) match = (candidate == AudioDeviceInfo.TYPE_BLUETOOTH_SCO || candidate == 26) && address.equals(String.valueOf(device.getAddress()));
            else if (type == AudioDeviceInfo.TYPE_WIRED_HEADSET) match = candidate == AudioDeviceInfo.TYPE_WIRED_HEADSET || candidate == AudioDeviceInfo.TYPE_WIRED_HEADPHONES;
            else if ("usb".equals(input.kind)) match = candidate == AudioDeviceInfo.TYPE_USB_HEADSET || candidate == AudioDeviceInfo.TYPE_USB_DEVICE;
            else match = false;
            if (match) return device;
        }
        return null;
    }

    @SuppressWarnings("deprecation")
    private void route(Input input) {
        AudioManager manager = audio();
        if (Build.VERSION.SDK_INT >= 31) {
            AudioDeviceInfo partner = communicationPartner(manager, input);
            if (partner != null && manager.setCommunicationDevice(partner)) {
                routedCommunication = true;
                for (int i = 0; i < 15; i++) {
                    AudioDeviceInfo current = manager.getCommunicationDevice();
                    if (current != null && current.getId() == partner.getId()) break;
                    try { Thread.sleep(100); } catch (InterruptedException error) { Thread.currentThread().interrupt(); break; }
                }
            }
        } else if ("bluetooth".equals(input.kind)) {
            manager.startBluetoothSco(); manager.setBluetoothScoOn(true); routedSco = true;
            for (int i = 0; i < 15 && !manager.isBluetoothScoOn(); i++) {
                try { Thread.sleep(100); } catch (InterruptedException error) { Thread.currentThread().interrupt(); break; }
            }
        }
    }

    @SuppressWarnings("deprecation")
    private void restore() {
        try {
            AudioManager manager = audio();
            if (routedCommunication && Build.VERSION.SDK_INT >= 31) manager.clearCommunicationDevice();
            if (routedSco) { manager.setBluetoothScoOn(false); manager.stopBluetoothSco(); }
        } catch (Exception ignored) { /* routing is advisory; the dialog result still counts */ }
        routedCommunication = false; routedSco = false;
    }

    @PluginMethod public void listen(PluginCall call) {
        String language = call.getString("language", "de-DE");
        if (language == null || !language.matches("[a-z]{2}-[A-Z]{2}")) { call.reject("Bad language", "SPEECH_BAD_INPUT"); return; }
        String inputId = call.getString("input", ""), inputName = call.getString("inputName", "");
        if ((inputId != null && inputId.length() > 200) || (inputName != null && inputName.length() > 200)) { call.reject("Bad input", "SPEECH_BAD_INPUT"); return; }
        if (!listening.compareAndSet(false, true)) { call.reject("Speech busy", "SPEECH_BUSY"); return; }
        boolean chosen = (inputId != null && !inputId.isEmpty()) || (inputName != null && !inputName.isEmpty());
        if (chosen) {
            Input input;
            try { input = pick(inputId, inputName); } catch (Exception error) { input = null; }
            if (input == null) { listening.set(false); call.reject("Chosen microphone missing", "MICROPHONE_MISSING"); return; }
            try { route(input); } catch (Exception error) { restore(); }
        }
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
            .putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            .putExtra(RecognizerIntent.EXTRA_LANGUAGE, language)
            .putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
            .putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, AppNetwork.isOffline());
        String prompt = call.getString("prompt", "");
        if (prompt != null && !prompt.isEmpty() && prompt.length() <= 120) intent.putExtra(RecognizerIntent.EXTRA_PROMPT, prompt);
        try { startActivityForResult(call, intent, "heard"); }
        catch (ActivityNotFoundException error) { restore(); listening.set(false); call.reject("No speech recognizer", "SPEECH_UNAVAILABLE"); }
        catch (Exception error) { restore(); listening.set(false); call.reject("Speech failed", "SPEECH_FAILED"); }
    }

    @ActivityCallback private void heard(PluginCall call, ActivityResult result) {
        restore();
        listening.set(false);
        if (call == null) return;
        Intent data = result.getData();
        ArrayList<String> found = data == null ? null : data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
        if (result.getResultCode() != Activity.RESULT_OK || found == null || found.isEmpty()) {
            call.resolve(new JSObject().put("cancelled", true).put("text", "")); return;
        }
        String text = found.get(0) == null ? "" : found.get(0).replaceAll("[\\p{Cntrl}]+", " ").trim();
        if (text.length() > 500) text = text.substring(0, 500);
        call.resolve(new JSObject().put("cancelled", false).put("text", text));
    }
}

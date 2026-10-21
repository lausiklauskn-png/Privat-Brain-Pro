package de.familyprojekt.privatebrain.pro;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.speech.RecognizerIntent;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Speech input for the search field (Klaus 2026-10-21: "das Mikrofon nicht verfügbar").
 * The Android WebView has no Web Speech API, so the system's own speech dialog listens.
 * The app gets only the recognized text; it never records audio itself and needs no
 * microphone permission. Offline recognition is preferred while the app is cut off.
 */
@CapacitorPlugin(name = "ProSpeech")
public class ProSpeechPlugin extends Plugin {
    private final AtomicBoolean listening = new AtomicBoolean();

    @PluginMethod public void listen(PluginCall call) {
        String language = call.getString("language", "de-DE");
        if (language == null || !language.matches("[a-z]{2}-[A-Z]{2}")) { call.reject("Bad language", "SPEECH_BAD_INPUT"); return; }
        if (!listening.compareAndSet(false, true)) { call.reject("Speech busy", "SPEECH_BUSY"); return; }
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
            .putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            .putExtra(RecognizerIntent.EXTRA_LANGUAGE, language)
            .putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
            .putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, AppNetwork.isOffline());
        String prompt = call.getString("prompt", "");
        if (prompt != null && !prompt.isEmpty() && prompt.length() <= 120) intent.putExtra(RecognizerIntent.EXTRA_PROMPT, prompt);
        try { startActivityForResult(call, intent, "heard"); }
        catch (ActivityNotFoundException error) { listening.set(false); call.reject("No speech recognizer", "SPEECH_UNAVAILABLE"); }
        catch (Exception error) { listening.set(false); call.reject("Speech failed", "SPEECH_FAILED"); }
    }

    @ActivityCallback private void heard(PluginCall call, ActivityResult result) {
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

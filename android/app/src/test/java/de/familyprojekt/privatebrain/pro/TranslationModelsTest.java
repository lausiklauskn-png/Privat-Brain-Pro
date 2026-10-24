package de.familyprojekt.privatebrain.pro;

import static org.junit.Assert.*;
import java.io.File;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import org.junit.Test;

public class TranslationModelsTest {
    private TranslationModels catalog(SemanticModelTest.Fake web) throws Exception {
        File root = Files.createTempDirectory("translation-test").toFile();
        byte[] data = SemanticModelTest.bytes(200, 4);
        web.bodies.put("https://public.example/lib", data);
        SemanticModel runtime = new SemanticModel(new File(root, "runtime"), Collections.singletonList(
            new SemanticModel.Entry("lib/transformers.min.js", SemanticModelTest.sha(data), data.length,
                Collections.singletonList("https://public.example/lib"))), web::open);
        Map<String, TranslationModels.Definition> defs = new LinkedHashMap<>();
        for (String lang : Arrays.asList("de", "ru", "pl")) for (boolean fromEnglish : Arrays.asList(true, false)) {
            String source = fromEnglish ? "en" : lang, target = fromEnglish ? lang : "en", key = source + "-" + target;
            web.bodies.put("https://public.example/" + key, data);
            SemanticModel model = new SemanticModel(new File(root, key), Collections.singletonList(
                new SemanticModel.Entry("model/config.json", SemanticModelTest.sha(data), data.length,
                    Collections.singletonList("https://public.example/" + key))), web::open);
            defs.put(key, new TranslationModels.Definition(source, target,
                key.equals("en-pl") ? "Xenova/opus-mt-en-mul" : "Xenova/opus-mt-" + key,
                key.equals("en-pl") ? ">>pol<< " : "", model));
        }
        return new TranslationModels(runtime, defs);
    }

    @Test public void nonEnglishDirectionsPivotThroughEnglishAndSameLanguageNeedsNoModel() throws Exception {
        TranslationModels all = catalog(new SemanticModelTest.Fake());
        List<TranslationModels.Definition> route = all.route("ru", "de");
        assertEquals(Arrays.asList("ru-en", "en-de"), Arrays.asList(route.get(0).key, route.get(1).key));
        assertEquals("de-en", all.route("de", "en").get(0).key);
        assertTrue(all.route("pl", "pl").isEmpty());
        assertEquals(">>pol<< ", all.route("en", "pl").get(0).prefix);
        assertEquals("Xenova/opus-mt-en-mul", all.route("en", "pl").get(0).id);
        assertThrows(IllegalArgumentException.class, () -> all.route("fr", "de"));
        assertThrows(IllegalArgumentException.class, () -> all.route(null, "de"));
    }

    @Test public void localAddressesExposeOnlyInstalledAllowlistedFiles() throws Exception {
        SemanticModelTest.Fake web = new SemanticModelTest.Fake();
        TranslationModels all = catalog(web);
        String lib = TranslationModels.BASE + "lib/transformers.min.js";
        String config = TranslationModels.BASE + "models/Xenova/opus-mt-en-de/config.json";
        assertNull(all.file(lib)); assertNull(all.file(config));
        all.library.install((d, t, f, s) -> {});
        all.route("en", "de").get(0).model.install((d, t, f, s) -> {});
        assertNotNull(all.file(lib)); assertNotNull(all.file(config));
        for (String unsafe : Arrays.asList("lib/../installed.txt", "lib/transformers.min.js?remote=1", "lib/%2e%2e/installed.txt",
            "models/Xenova/opus-mt-en-de/../../installed.txt", "models/Xenova/opus-mt-en-de/onnx/unknown.onnx",
            "models/Xenova/opus-mt-en-de/config.json/extra", "models/Xenova/multilingual-e5-small/config.json"))
            assertNull(unsafe, all.file(TranslationModels.BASE + unsafe));
        assertNull(all.file("https://remote.example/pb-translation/lib/transformers.min.js"));
        assertTrue(TranslationModels.covers(TranslationModels.BASE + "missing"));
        assertFalse(TranslationModels.covers("https://localhost.evil/pb-translation/config.json"));
        assertEquals("only runtime and selected direction; no embedding weights", 2, web.asked.size());
    }

    @Test public void translationCancellationBeforeTheNextLegOpensNoTransport() throws Exception {
        SemanticModelTest.Fake web = new SemanticModelTest.Fake();
        TranslationModels all = catalog(web);
        try {
            all.library.install((d, t, f, s) -> {}, () -> true);
            fail("cancelled job");
        } catch (SemanticModel.Failure expected) { assertEquals("CANCELLED", expected.code); }
        assertTrue(web.asked.isEmpty());
        assertFalse(all.library.installed());
    }

    @Test public void cancellingAnActiveTranslationDownloadKeepsItUninstalled() throws Exception {
        SemanticModelTest.Fake web = new SemanticModelTest.Fake();
        byte[] bytes = SemanticModelTest.bytes(240_000, 7);
        web.bodies.put("https://public.example/model", bytes);
        AtomicBoolean cancelled = new AtomicBoolean();
        SemanticModel model = new SemanticModel(Files.createTempDirectory("translation-cancel").toFile(), Collections.singletonList(
            new SemanticModel.Entry("model/onnx/model_quantized.onnx", SemanticModelTest.sha(bytes), bytes.length,
                Collections.singletonList("https://public.example/model"))), web::open);
        try {
            model.install((d, t, f, s) -> cancelled.set(true), cancelled::get);
            fail("active job must stop");
        } catch (SemanticModel.Failure expected) { assertEquals("CANCELLED", expected.code); }
        assertFalse(model.installed());
        assertTrue(model.present() > 0 && model.present() < bytes.length);
        assertEquals(1, web.asked.size());
    }

    @Test public void togglingAppInternetOffAndOnCannotResumeTheOldDownload() throws Exception {
        SemanticModelTest.Fake web = new SemanticModelTest.Fake();
        byte[] bytes = SemanticModelTest.bytes(240_000, 8);
        web.bodies.put("https://public.example/first", bytes);
        web.bodies.put("https://public.example/fallback", bytes);
        java.lang.reflect.Field epoch = AppNetwork.class.getDeclaredField("epoch");
        epoch.setAccessible(true);
        long original = epoch.getLong(null);
        SemanticModel model = new SemanticModel(Files.createTempDirectory("translation-offline").toFile(), Collections.singletonList(
            new SemanticModel.Entry("model/onnx/model_quantized.onnx", SemanticModelTest.sha(bytes), bytes.length,
                Arrays.asList("https://public.example/first", "https://public.example/fallback"))), web::open);
        try {
            model.install((d, t, f, s) -> {
                try { epoch.setLong(null, original + 2); }
                catch (IllegalAccessException error) { throw new AssertionError(error); }
            });
            fail("the network generation changed while loading");
        } catch (SemanticModel.Failure expected) { assertEquals("APP_OFFLINE", expected.code); }
        finally { epoch.setLong(null, original); }
        assertFalse(model.installed());
        assertEquals("no automatic fallback after the internet switch", 1, web.asked.size());
    }
}

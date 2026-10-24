package de.familyprojekt.privatebrain.pro;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.json.JSONArray;
import org.json.JSONObject;

/** Public pinned files only. Mail text never enters the native download interface. */
final class TranslationModels {
    static final String BASE = "https://localhost/pb-translation/";
    static final List<String> LANGUAGES = Collections.unmodifiableList(Arrays.asList("de", "en", "ru", "pl"));
    static final List<String> LIBRARY_FILES = Collections.unmodifiableList(Arrays.asList(
        "transformers.min.js", "ort-wasm-simd.wasm", "ort-wasm.wasm"));

    static final class Definition {
        final String key, source, target, id, prefix;
        final SemanticModel model;
        Definition(String source, String target, String id, String prefix, SemanticModel model) {
            if (!LANGUAGES.contains(source) || !LANGUAGES.contains(target) || source.equals(target)
                || (!source.equals("en") && !target.equals("en"))
                || !id.matches("Xenova/opus-mt-[a-z-]+")) throw new IllegalArgumentException("Invalid translation direction");
            this.source = source; this.target = target; this.key = source + "-" + target;
            this.id = id; this.prefix = prefix; this.model = model;
        }
    }

    final SemanticModel library;
    final Map<String, Definition> models;
    TranslationModels(SemanticModel library, Map<String, Definition> models) {
        this.library = library;
        this.models = Collections.unmodifiableMap(new LinkedHashMap<>(models));
    }

    static TranslationModels parse(File root, JSONObject pins, SemanticModel.Opener opener) throws Exception {
        if (pins.getInt("version") != 1) throw new IOException("Unsupported translation manifest");
        JSONObject lib = pins.getJSONObject("library"), hashes = lib.getJSONObject("files"), sizes = lib.getJSONObject("sizes");
        String version = lib.getString("version");
        if (!version.equals("2.17.2")) throw new IOException("Unreviewed translation runtime");
        JSONArray sources = lib.getJSONArray("sources");
        List<SemanticModel.Entry> runtime = new ArrayList<>();
        for (String file : LIBRARY_FILES) {
            List<String> urls = new ArrayList<>();
            for (int i = 0; i < sources.length(); i++) {
                String url = sources.getString(i).replace("{version}", version).replace("{file}", file);
                if (!url.equals("https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/" + file)
                    && !url.equals("https://unpkg.com/@xenova/transformers@2.17.2/dist/" + file))
                    throw new IOException("Unreviewed translation runtime source");
                urls.add(url);
            }
            runtime.add(new SemanticModel.Entry("lib/" + file, hashes.getString(file), sizes.getLong("lib/" + file), urls));
        }
        Map<String, Definition> definitions = new LinkedHashMap<>();
        JSONObject all = pins.getJSONObject("models");
        for (Iterator<String> keys = all.keys(); keys.hasNext(); ) {
            String key = keys.next();
            JSONObject item = all.getJSONObject(key);
            String source = item.getString("source"), target = item.getString("target"), id = item.getString("id"), revision = item.getString("revision");
            if (!key.equals(source + "-" + target) || !revision.matches("[a-f0-9]{40}")) throw new IOException("Invalid translation revision");
            String license = item.getString("license");
            if (!Arrays.asList("apache-2.0", "cc-by-4.0", "mit").contains(license)) throw new IOException("Unreviewed model license");
            List<SemanticModel.Entry> entries = new ArrayList<>();
            JSONObject files = item.getJSONObject("files");
            for (Iterator<String> names = files.keys(); names.hasNext(); ) {
                String name = names.next();
                if (!allowedModelFile(name)) throw new IOException("Unreviewed translation file");
                JSONObject file = files.getJSONObject(name);
                String url = "https://huggingface.co/" + id + "/resolve/" + revision + "/" + name;
                if (!url.equals(file.getString("url"))) throw new IOException("Unreviewed translation source");
                long size = file.getLong("size");
                if (size <= 0 || size > 256L * 1024 * 1024) throw new IOException("Invalid translation file size");
                entries.add(new SemanticModel.Entry("model/" + name, file.getString("sha256"), size, Collections.singletonList(url)));
            }
            for (String required : Arrays.asList("config.json", "tokenizer.json", "tokenizer_config.json",
                "onnx/encoder_model_quantized.onnx", "onnx/decoder_model_merged_quantized.onnx"))
                if (!files.has(required)) throw new IOException("Incomplete translation direction");
            SemanticModel model = new SemanticModel(new File(root, key), entries, opener);
            Definition def = new Definition(source, target, id, item.optString("prefix", ""), model);
            if (!(def.prefix.isEmpty() || (key.equals("en-pl") && def.prefix.equals(">>pol<< ")))) throw new IOException("Invalid target prefix");
            definitions.put(key, def);
        }
        for (String lang : LANGUAGES) if (!lang.equals("en")) {
            if (!definitions.containsKey(lang + "-en") || !definitions.containsKey("en-" + lang)) throw new IOException("Incomplete language list");
        }
        return new TranslationModels(new SemanticModel(new File(root, "runtime"), runtime, opener), definitions);
    }

    static boolean allowedModelFile(String name) {
        return Arrays.asList("config.json", "tokenizer.json", "tokenizer_config.json", "generation_config.json", "special_tokens_map.json",
            "onnx/encoder_model_quantized.onnx", "onnx/decoder_model_merged_quantized.onnx").contains(name);
    }

    List<Definition> route(String source, String target) {
        if (!LANGUAGES.contains(source) || !LANGUAGES.contains(target)) throw new IllegalArgumentException("UNSUPPORTED_LANGUAGE");
        if (source.equals(target)) return Collections.emptyList();
        List<Definition> path = new ArrayList<>();
        if (source.equals("en") || target.equals("en")) path.add(models.get(source + "-" + target));
        else { path.add(models.get(source + "-en")); path.add(models.get("en-" + target)); }
        if (path.contains(null)) throw new IllegalArgumentException("UNSUPPORTED_LANGUAGE");
        return path;
    }

    static boolean covers(String url) { return url != null && (url.equals(BASE.substring(0, BASE.length() - 1)) || url.startsWith(BASE)); }

    /** Exact private local URLs only. Missing files remain local 404s; no remote fallback. */
    File file(String url) {
        if (!covers(url) || !url.startsWith(BASE)) return null;
        String path = url.substring(BASE.length());
        if (path.startsWith("lib/")) return LIBRARY_FILES.contains(path.substring(4)) ? library.file(path) : null;
        for (Definition def : models.values()) {
            String prefix = "models/" + def.id + "/";
            if (path.startsWith(prefix)) {
                String name = path.substring(prefix.length());
                return allowedModelFile(name) ? def.model.file("model/" + name) : null;
            }
        }
        return null;
    }
}

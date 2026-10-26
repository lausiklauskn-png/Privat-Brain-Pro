package de.familyprojekt.privatebrain.pro;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class BundledLibraryTest {
    private static final String P = BundledLibrary.PREFIX;

    @Test public void bareAddressIsThePackageEntry() {
        assertEquals("transformers.min.js", BundledLibrary.file(P));
        assertEquals("transformers.min.js", BundledLibrary.file(P + "/"));
        assertEquals("transformers.min.js", BundledLibrary.file(P + "/dist/transformers.min.js"));
    }

    @Test public void onlyTheBundledWasmFilesAreServed() {
        assertEquals("ort-wasm-simd.wasm", BundledLibrary.file(P + "/dist/ort-wasm-simd.wasm"));
        assertEquals("ort-wasm.wasm", BundledLibrary.file(P + "/dist/ort-wasm.wasm?x=1"));
        assertNull(BundledLibrary.file(P + "/dist/ort-wasm-threaded.wasm"));
        assertNull(BundledLibrary.file(P + "/dist/../../../index.html"));
        assertNull(BundledLibrary.file(P + "/package.json"));
    }

    @Test public void otherAddressesAreNotCovered() {
        assertFalse(BundledLibrary.covers("https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.3/dist/transformers.min.js"));
        assertFalse(BundledLibrary.covers(P + ".evil.example/x"));
        assertFalse(BundledLibrary.covers("https://huggingface.co/Xenova/multilingual-e5-small"));
        assertFalse(BundledLibrary.covers(null));
        assertTrue(BundledLibrary.covers(P + "/dist/anything"));
    }

    @Test public void modelAddressesMapOnlyToPlainFileNames() {
        String M = BundledLibrary.MODEL_PREFIX;
        assertEquals("model/config.json", BundledLibrary.modelPath(M + "config.json"));
        assertEquals("model/onnx/model_quantized.onnx", BundledLibrary.modelPath(M + "onnx/model_quantized.onnx?download=1"));
        assertNull(BundledLibrary.modelPath(M + "../../index.html"));
        assertNull(BundledLibrary.modelPath(M + "a/b/c.json"));
        assertNull(BundledLibrary.modelPath("https://localhost/models/Xenova/other-model/config.json"));
        assertNull(BundledLibrary.modelPath("https://huggingface.co/Xenova/multilingual-e5-small/resolve/main/config.json"));
    }

    /** Sitzung 4: the image model has its own folder under the same rules; the two folders never answer for each other. */
    @Test public void captionModelAddressesHaveTheirOwnFolder() {
        String C = BundledLibrary.CAPTION_MODEL_PREFIX;
        assertTrue(BundledLibrary.coversCaptionModel(C + "config.json"));
        assertFalse(BundledLibrary.coversModel(C + "config.json"));
        assertFalse(BundledLibrary.coversCaptionModel(BundledLibrary.MODEL_PREFIX + "config.json"));
        assertEquals("model/onnx/encoder_model_quantized.onnx", BundledLibrary.captionModelPath(C + "onnx/encoder_model_quantized.onnx?x=1"));
        assertNull(BundledLibrary.captionModelPath(C + "../multilingual-e5-small/config.json"));
        assertNull(BundledLibrary.captionModelPath(BundledLibrary.MODEL_PREFIX + "config.json"));
        assertTrue(BundledLibrary.remoteModel("https://huggingface.co/Xenova/vit-gpt2-image-captioning/resolve/main/config.json"));
        assertTrue(BundledLibrary.remoteModel("https://huggingface.co/Xenova/multilingual-e5-small/resolve/main/config.json"));
        assertFalse(BundledLibrary.remoteModel("https://huggingface.co/Xenova/other/resolve/main/config.json"));
    }
}

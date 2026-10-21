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
}

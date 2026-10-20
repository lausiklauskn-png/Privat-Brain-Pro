package de.familyprojekt.privatebrain.pro;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.pdf.PdfRenderer;
import android.os.ParcelFileDescriptor;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.util.LinkedHashMap;
import java.util.UUID;
import org.json.JSONObject;

/** Local Android PDF rendering only: one bounded page, no document actions or uploads. */
final class PdfPreviewStore implements AutoCloseable {
    private final LinkedHashMap<String,PdfRenderer> sessions = new LinkedHashMap<>();
    JSONObject open(File file) throws Exception {
        while (sessions.size() >= 2) close(sessions.keySet().iterator().next());
        ParcelFileDescriptor descriptor = ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY);
        PdfRenderer renderer;
        try { renderer = new PdfRenderer(descriptor); } catch (Exception error) { descriptor.close();throw error; }
        int pages = renderer.getPageCount();
        if (pages < 1 || pages > 10000) { renderer.close();throw new IllegalArgumentException(); }
        String id = UUID.randomUUID().toString();sessions.put(id,renderer);
        return new JSONObject().put("id",id).put("pages",pages);
    }
    JSONObject page(String id, int index, int requestedWidth) throws Exception {
        PdfRenderer renderer = sessions.get(id);
        if (renderer == null || index < 0 || index >= renderer.getPageCount()) throw new IllegalArgumentException();
        try (PdfRenderer.Page page = renderer.openPage(index)) {
            double scale = Math.min(Math.min(Math.max(320,Math.min(2048,requestedWidth))/(double)page.getWidth(),2048.0/page.getHeight()),
                Math.sqrt(4_000_000.0/(page.getWidth()*(double)page.getHeight())));
            int width = Math.max(1,(int)Math.round(page.getWidth()*scale)), height = Math.max(1,(int)Math.round(page.getHeight()*scale));
            Bitmap bitmap = Bitmap.createBitmap(width,height,Bitmap.Config.ARGB_8888);
            try {
                new Canvas(bitmap).drawColor(Color.WHITE);
                page.render(bitmap,null,null,PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY);
                ByteArrayOutputStream output = new ByteArrayOutputStream();bitmap.compress(Bitmap.CompressFormat.PNG,100,output);
                return new JSONObject().put("data",android.util.Base64.encodeToString(output.toByteArray(),android.util.Base64.NO_WRAP))
                    .put("width",width).put("height",height);
            } finally { bitmap.recycle(); }
        }
    }
    void close(String id) { PdfRenderer renderer = sessions.remove(id);if (renderer != null) renderer.close(); }
    @Override public void close() { for (PdfRenderer renderer : sessions.values()) renderer.close();sessions.clear(); }
}

package de.familyprojekt.privatebrain.pro;

import android.content.Context;
import android.content.Intent;
import android.graphics.*;
import android.graphics.pdf.PdfDocument;
import android.net.Uri;
import android.provider.OpenableColumns;
import android.util.Base64;
import androidx.test.core.app.ApplicationProvider;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import java.io.*;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class NativePdfTest {
    static File fixture(Context context) throws Exception {
        File directory=new File(context.getCacheDir(),"exports/files");assertTrue(directory.isDirectory()||directory.mkdirs());
        File file=File.createTempFile("scanned-pages-",".pdf",directory);
        PdfDocument document=new PdfDocument();
        try{
            for(int i=0;i<2;i++){
                PdfDocument.Page page=document.startPage(new PdfDocument.PageInfo.Builder(300,400,i+1).create());
                Bitmap scan=Bitmap.createBitmap(64,64,Bitmap.Config.ARGB_8888);scan.eraseColor(i==0?Color.RED:Color.BLUE);
                page.getCanvas().drawBitmap(scan,null,new Rect(0,0,300,400),null);scan.recycle();document.finishPage(page);
            }
            try(FileOutputStream output=new FileOutputStream(file)){document.writeTo(output);}
        }finally{document.close();}
        return file;
    }
    @Test public void scannedPdfRendersBothPagesWithoutChangingOriginal() throws Exception {
        Context context=ApplicationProvider.getApplicationContext();File file=fixture(context);String hash=OriginalFileStore.digest(file);
        try(PdfPreviewStore store=new PdfPreviewStore()){
            JSONObject opened=store.open(file);String id=opened.getString("id");assertEquals(2,opened.getInt("pages"));
            for(int i=0;i<2;i++){
                JSONObject rendered=store.page(id,i,i==0?640:Integer.MAX_VALUE);
                byte[] png=Base64.decode(rendered.getString("data"),Base64.NO_WRAP);
                Bitmap image=BitmapFactory.decodeByteArray(png,0,png.length);assertNotNull(image);
                assertTrue(image.getWidth()<=2048&&image.getHeight()<=2048);assertTrue((long)image.getWidth()*image.getHeight()<=4_000_000);
                int pixel=image.getPixel(image.getWidth()/2,image.getHeight()/2);assertEquals(i==0?Color.RED:Color.BLUE,pixel);image.recycle();
            }
            for(int page:new int[]{-1,2})try{store.page(id,page,640);fail("Invalid PDF page accepted");}catch(IllegalArgumentException expected){}
            store.close(id);try{store.page(id,0,640);fail("Closed PDF session remained usable");}catch(IllegalArgumentException expected){}
            assertEquals(hash,OriginalFileStore.digest(file));
        }finally{file.delete();}
    }
    @Test public void openAndShareOfferReadOnlyPdfWithOriginalNameAndBytes() throws Exception {
        Context context=ApplicationProvider.getApplicationContext();File file=fixture(context);String hash=OriginalFileStore.digest(file);
        try{
            for(boolean share:new boolean[]{false,true}){
                Intent intent=ProFilesPlugin.fileIntent(context,file,"Original scan.pdf",share);
                assertEquals(share?Intent.ACTION_SEND:Intent.ACTION_VIEW,intent.getAction());assertEquals("application/pdf",intent.getType());
                assertEquals(Intent.FLAG_GRANT_READ_URI_PERMISSION,intent.getFlags());
                Uri uri=share?intent.getParcelableExtra(Intent.EXTRA_STREAM):intent.getData();assertNotNull(uri);
                assertEquals("content",uri.getScheme());assertEquals(uri,intent.getClipData().getItemAt(0).getUri());
                try(android.database.Cursor cursor=context.getContentResolver().query(uri,new String[]{OpenableColumns.DISPLAY_NAME},null,null,null)){
                    assertNotNull(cursor);assertTrue(cursor.moveToFirst());assertEquals("Original scan.pdf",cursor.getString(0));
                }
                try(InputStream input=context.getContentResolver().openInputStream(uri)){
                    assertNotNull(input);assertArrayEquals(java.nio.file.Files.readAllBytes(file.toPath()),input.readAllBytes());
                }
                assertEquals(hash,OriginalFileStore.digest(file));
            }
        }finally{file.delete();}
    }
}

package de.familyprojekt.privatebrain.pro;

import android.content.Context;
import android.net.Uri;
import android.provider.DocumentsContract;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.json.*;
import org.junit.Test;
import org.junit.runner.RunWith;
import java.nio.charset.StandardCharsets;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class NativeFoldersTest {
    private Context context(){return InstrumentationRegistry.getInstrumentation().getTargetContext();}
    private String authority(){return context().getPackageName()+".fixture.documents";}
    private Uri tree(String id){return DocumentsContract.buildTreeDocumentUri(authority(),id);}
    private void reset(){context().getContentResolver().call(Uri.parse("content://"+authority()),"fixture-reset",null,null);context().getSharedPreferences("folders-v1",0).edit().clear().commit();}
    @Test public void changingSourceAndLibraryKeepsOriginalsAndCopiesAfterRestart()throws Exception{
        reset();FolderStore folders=new FolderStore(context());
        JSONObject first=folders.source(tree("sourceA")).getJSONArray("items").getJSONObject(0);String id=first.getString("id");
        byte[] a=folders.read(id,0),b=folders.read(id,a.length);assertEquals(262144,a.length);assertEquals(37856,b.length);assertEquals((byte)(262144%251),b[0]);
        FolderStore reopened=new FolderStore(context());assertFalse(reopened.state().getBoolean("enabled"));
        OriginalFileStore originals=new OriginalFileStore(context());byte[] body="folder-copy-sentinel".getBytes(StandardCharsets.UTF_8);
        java.security.MessageDigest digest=java.security.MessageDigest.getInstance("SHA-256");StringBuilder h=new StringBuilder();for(byte v:digest.digest(body))h.append(String.format(java.util.Locale.ROOT,"%02x",v&255));String hash=h.toString();
        JSONObject pending=originals.begin(hash,body.length,"copy.txt","text/plain");if(!pending.optBoolean("stored")){String ticket=pending.getString("ticket");originals.append(ticket,0,body);originals.finish(ticket);}
        folders.library(tree("libraryA"));assertTrue(folders.copy(hash,"copy.txt").getBoolean("copied"));
        assertEquals("copy (1).txt",folders.copy(hash,"copy.txt").getString("name"));
        reopened=new FolderStore(context());assertTrue(reopened.state().getBoolean("enabled"));assertEquals("libraryA",reopened.state().getString("name"));
        reopened.library(tree("libraryB"));reopened.copy(hash,"copy.txt");
        assertEquals(2,new FolderStore(context()).source(tree("libraryA")).getJSONArray("items").length());
        assertEquals(1,new FolderStore(context()).source(tree("libraryB")).getJSONArray("items").length());
        assertArrayEquals(body,originals.read(hash,0));assertEquals(1,folders.source(tree("sourceB")).getJSONArray("items").length());
        try{folders.read(id,0);fail("Old selection token still readable");}catch(java.io.IOException expected){}
        folders.finishSource();folders.pause();assertFalse(new FolderStore(context()).state().getBoolean("enabled"));assertFalse(folders.copy(hash,"copy.txt").getBoolean("copied"));
        reopened=new FolderStore(context());assertEquals("libraryB",reopened.state().getString("name"));assertTrue(reopened.state().getBoolean("configured"));
        assertTrue(reopened.resume().getBoolean("enabled"));assertTrue(new FolderStore(context()).state().getBoolean("enabled"));
        assertEquals("copy (1).txt",reopened.copy(hash,"copy.txt").getString("name"));
        assertEquals(2,reopened.source(tree("libraryB")).getJSONArray("items").length());
        assertEquals(2,reopened.source(tree("libraryA")).getJSONArray("items").length());assertArrayEquals(body,originals.read(hash,0));
        assertEquals(1,folders.source(tree("sourceA")).getJSONArray("items").length());reset();
    }
    @Test public void lostDestinationDoesNotOverwriteExistingFilesOrRemoveOriginal()throws Exception{
        reset();FolderStore folders=new FolderStore(context());OriginalFileStore originals=new OriginalFileStore(context());
        byte[] body="kept on copy failure".getBytes(StandardCharsets.UTF_8);java.io.File tmp=java.io.File.createTempFile("folder",".txt",context().getCacheDir());try(java.io.FileOutputStream output=new java.io.FileOutputStream(tmp)){output.write(body);}String hash=OriginalFileStore.digest(tmp);tmp.delete();
        JSONObject pending=originals.begin(hash,body.length,"keep.txt","text/plain");if(!pending.optBoolean("stored")){String ticket=pending.getString("ticket");originals.append(ticket,0,body);originals.finish(ticket);}
        folders.library(tree("libraryA"));folders.copy(hash,"keep.txt");context().getContentResolver().call(Uri.parse("content://"+authority()),"fixture-broken",null,null);
        try{folders.copy(hash,"keep.txt");fail("Failed destination pretended success");}catch(Exception expected){}
        assertArrayEquals(body,originals.read(hash,0));assertEquals(1,folders.source(tree("libraryA")).getJSONArray("items").length());
        folders.pause();try{new FolderStore(context()).resume();fail("Inaccessible destination was re-enabled");}catch(Exception expected){}
        assertFalse(new FolderStore(context()).state().getBoolean("enabled"));assertEquals("libraryA",new FolderStore(context()).state().getString("name"));
        assertArrayEquals(body,originals.read(hash,0));assertEquals(1,folders.source(tree("libraryA")).getJSONArray("items").length());
        context().getSharedPreferences("folders-v1",0).edit().clear().commit();
        try{new FolderStore(context()).resume();fail("Missing destination was re-enabled");}catch(java.io.IOException expected){}
        assertFalse(new FolderStore(context()).state().getBoolean("enabled"));
        try{folders.read("content://unselected/private",0);fail("Accepted unselected URI");}catch(java.io.IOException expected){}reset();
    }
}

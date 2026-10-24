package de.familyprojekt.privatebrain.pro;

import android.app.Activity;
import android.app.Instrumentation;
import android.content.Context;
import android.content.ContextWrapper;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.provider.DocumentsContract;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.RandomAccessFile;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;
import static org.junit.Assert.*;

/** Physical SAF operations use only the debug provider's temporary fixture files. */
@RunWith(AndroidJUnit4.class)
public class NativeDuplicateCleanupTest {
    private Context context(){return InstrumentationRegistry.getInstrumentation().getTargetContext();}
    private String authority(){return context().getPackageName()+".fixture.documents";}
    private Uri provider(){return Uri.parse("content://"+authority());}
    private Uri tree(){return DocumentsContract.buildTreeDocumentUri(authority(),"libraryA");}
    private Uri document(String id){return DocumentsContract.buildDocumentUriUsingTree(tree(),id);}
    private void reset(){
        context().getContentResolver().call(provider(),"fixture-reset",null,null);
        context().grantUriPermission(context().getPackageName(),tree(),Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_WRITE_URI_PERMISSION|Intent.FLAG_GRANT_PREFIX_URI_PERMISSION);
    }
    private Uri create(String name,byte[] body)throws Exception{
        Uri uri=DocumentsContract.createDocument(context().getContentResolver(),document("libraryA"),"text/plain",name);
        assertNotNull(uri);write(uri,body);return uri;
    }
    private void write(Uri uri,byte[] body)throws Exception{
        try(OutputStream output=context().getContentResolver().openOutputStream(uri,"wt")){
            assertNotNull(output);output.write(body);
        }
    }
    private byte[] read(Uri uri)throws Exception{
        try(InputStream input=context().getContentResolver().openInputStream(uri);ByteArrayOutputStream output=new ByteArrayOutputStream()){
            assertNotNull(input);byte[] bytes=new byte[4096];for(int n;(n=input.read(bytes))!=-1;)output.write(bytes,0,n);return output.toByteArray();
        }
    }
    private boolean exists(Uri uri){
        try(android.database.Cursor rows=context().getContentResolver().query(uri,new String[]{DocumentsContract.Document.COLUMN_DOCUMENT_ID},null,null,null)){
            return rows!=null&&rows.moveToFirst();
        }catch(Exception missing){return false;}
    }
    private JSONObject copy(JSONObject scan,String name)throws Exception{
        JSONArray groups=scan.getJSONArray("groups");
        for(int g=0;g<groups.length();g++){
            JSONArray copies=groups.getJSONObject(g).getJSONArray("copies");
            for(int c=0;c<copies.length();c++)if(name.equals(copies.getJSONObject(c).getString("name")))return copies.getJSONObject(c);
        }
        throw new AssertionError("Missing scanned fixture copy: "+name);
    }
    private String id(JSONObject scan,String name)throws Exception{return copy(scan,name).getString("id");}
    private interface RefusedAction{void run()throws Exception;}
    private void refused(RefusedAction action)throws Exception{
        try{action.run();fail("Unsafe duplicate cleanup was accepted");}catch(IOException expected){}
    }
    private String sha(byte[] body)throws Exception{
        StringBuilder result=new StringBuilder();for(byte b:MessageDigest.getInstance("SHA-256").digest(body))result.append(String.format(Locale.ROOT,"%02x",b&255));return result.toString();
    }
    private byte[] body(){return "temporary duplicate-cleanup native fixture; keep one exact copy".getBytes(StandardCharsets.UTF_8);}
    private byte[] changed(byte[] body){byte[] modified=body.clone();modified[0]^=1;return modified;}

    @Test public void physicalCleanupKeepsVerifiedCopyAndRejectsChangedBytes()throws Exception{
        reset();try{
            byte[] body=body();Uri keep=create("keep.txt",body),a=create("a.txt",body),b=create("b.txt",body);
            OriginalFileStore originals=new OriginalFileStore(context());String hash=sha(body);
            JSONObject pending=originals.begin(hash,body.length,"duplicate-fixture.txt","text/plain");
            if(!pending.optBoolean("stored")){String ticket=pending.getString("ticket");originals.append(ticket,0,body);originals.finish(ticket);}
            DuplicateCleanupStore store=new DuplicateCleanupStore(context());JSONObject scan=store.scan(tree());
            assertFalse(scan.getBoolean("partial"));assertEquals(1,scan.getJSONArray("groups").length());
            assertEquals(3,scan.getJSONArray("groups").getJSONObject(0).getJSONArray("copies").length());
            assertEquals(3,scan.getInt("scannedFiles"));assertEquals(3L*body.length,scan.getLong("scannedBytes"));
            JSONObject result=store.delete(scan.getString("session"),Collections.singletonList(id(scan,"a.txt")));
            assertEquals(1,result.getJSONArray("deleted").length());assertEquals(0,result.getJSONArray("failures").length());
            assertEquals(body.length,result.getLong("deletedBytes"));assertFalse(exists(a));
            assertArrayEquals(body,read(keep));assertArrayEquals(body,read(b));assertArrayEquals(body,originals.read(hash,0));

            JSONObject changedCandidate=store.scan(tree());write(b,changed(body));
            refused(()->store.delete(changedCandidate.getString("session"),Collections.singletonList(id(changedCandidate,"b.txt"))));
            assertArrayEquals(body,read(keep));assertArrayEquals(changed(body),read(b));
            write(b,body);JSONObject changedKeeper=store.scan(tree());write(keep,changed(body));
            refused(()->store.delete(changedKeeper.getString("session"),Collections.singletonList(id(changedKeeper,"b.txt"))));
            assertTrue(exists(b));assertArrayEquals(body,read(b));assertArrayEquals(body,originals.read(hash,0));
        }finally{reset();}
    }

    @Test public void unknownStaleLastCopyAndLostPermissionNeverDelete()throws Exception{
        reset();try{
            byte[] body=body();Uri keep=create("keep.txt",body),a=create("a.txt",body);
            DuplicateCleanupStore store=new DuplicateCleanupStore(context());JSONObject scan=store.scan(tree());
            String session=scan.getString("session"),aId=id(scan,"a.txt"),keepId=id(scan,"keep.txt");
            refused(()->store.delete(session,Arrays.asList(aId,"content://unselected/private.txt")));
            refused(()->store.delete(session,Arrays.asList(aId,keepId)));
            refused(()->store.delete(session,Arrays.asList(aId,aId)));
            refused(()->store.delete(session,Collections.emptyList()));
            JSONObject fresh=store.scan(tree());refused(()->store.delete(session,Collections.singletonList(aId)));
            refused(()->store.delete(fresh.getString("session"),Collections.singletonList(aId)));
            assertArrayEquals(body,read(a));assertArrayEquals(body,read(keep));

            Context noWrite=new ContextWrapper(context()){
                @Override public int checkUriPermission(Uri uri,int pid,int uid,int flags){return PackageManager.PERMISSION_DENIED;}
            };
            DuplicateCleanupStore denied=new DuplicateCleanupStore(noWrite);
            refused(()->denied.scan(tree()));
            assertArrayEquals(body,read(a));assertArrayEquals(body,read(keep));
            // A grant lost after scanning must also fail before the first deletion.
            final boolean[] writable={true};
            Context revocable=new ContextWrapper(context()){
                @Override public int checkUriPermission(Uri uri,int pid,int uid,int flags){return writable[0]?super.checkUriPermission(uri,pid,uid,flags):PackageManager.PERMISSION_DENIED;}
            };
            DuplicateCleanupStore revoked=new DuplicateCleanupStore(revocable);JSONObject beforeRevocation=revoked.scan(tree());writable[0]=false;
            refused(()->revoked.delete(beforeRevocation.getString("session"),Collections.singletonList(id(beforeRevocation,"a.txt"))));
            assertArrayEquals(body,read(a));assertArrayEquals(body,read(keep));

            JSONObject beforeUnsupported=store.scan(tree());
            context().getContentResolver().call(provider(),"fixture-delete-unsupported","libraryA/a.txt",null);
            refused(()->store.delete(beforeUnsupported.getString("session"),Collections.singletonList(id(beforeUnsupported,"a.txt"))));
            assertArrayEquals(body,read(a));assertArrayEquals(body,read(keep));

            reset();Uri single=create("single.txt",body);
            context().getContentResolver().call(provider(),"fixture-repeat-document","libraryA/single.txt",null);
            JSONObject aliases=store.scan(tree());assertEquals("Repeated provider IDs are one physical copy",1,aliases.getInt("scannedFiles"));
            assertEquals("An alias must never be treated as a safe surviving copy",0,aliases.getJSONArray("groups").length());assertArrayEquals(body,read(single));
        }finally{reset();}
    }

    private String evaluate(ActivityScenario<MainActivity> scenario,String script)throws Exception{
        CountDownLatch complete=new CountDownLatch(1);AtomicReference<String> result=new AtomicReference<>();
        scenario.onActivity(activity->activity.getBridge().getWebView().evaluateJavascript(script,value->{result.set(value);complete.countDown();}));
        assertTrue("No genuine WebView bridge response",complete.await(10,TimeUnit.SECONDS));return result.get();
    }
    private void awaitTrue(ActivityScenario<MainActivity> scenario,String script)throws Exception{
        long deadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(30);
        while(System.nanoTime()<deadline){if("true".equals(evaluate(scenario,script)))return;Thread.sleep(100);}
        fail("Native duplicate bridge did not satisfy: "+script);
    }

    @Test public void partialFailureCancellationAndBoundsRemainHonestWithRealChooser()throws Exception{
        reset();try{
            byte[] body=body();Uri keep=create("keep.txt",body),a=create("a.txt",body),b=create("b.txt",body);
            DuplicateCleanupStore store=new DuplicateCleanupStore(context());JSONObject scan=store.scan(tree());
            context().getContentResolver().call(provider(),"fixture-delete-deny","libraryA/b.txt",null);
            JSONObject partial=store.delete(scan.getString("session"),Arrays.asList(id(scan,"a.txt"),id(scan,"b.txt")));
            assertEquals(1,partial.getJSONArray("deleted").length());assertEquals(1,partial.getJSONArray("failures").length());
            assertTrue(partial.getBoolean("partial"));assertEquals(body.length,partial.getLong("deletedBytes"));
            assertFalse(exists(a));assertArrayEquals(body,read(b));assertArrayEquals(body,read(keep));

            reset();keep=create("keep.txt",body);a=create("a.txt",body);b=create("b.txt",body);scan=store.scan(tree());
            Bundle mutation=new Bundle();mutation.putString("afterId","*");mutation.putString("targetId","libraryA/keep.txt");
            context().getContentResolver().call(provider(),"fixture-delete-tamper",null,mutation);
            JSONObject interrupted=store.delete(scan.getString("session"),Arrays.asList(id(scan,"a.txt"),id(scan,"b.txt")));
            assertEquals("Keeper changed after the first delete: stop before deleting another copy",1,interrupted.getJSONArray("deleted").length());
            assertEquals(1,interrupted.getJSONArray("failures").length());assertTrue(interrupted.getBoolean("partial"));
            assertFalse(exists(a));assertTrue(exists(b));assertArrayEquals(body,read(b));assertArrayEquals(changed(body),read(keep));

            // A candidate edited while its keeper is being hashed must not be deleted.
            reset();keep=create("keep.txt",body);a=create("a.txt",body);scan=store.scan(tree());
            Bundle readMutation=new Bundle();readMutation.putString("sourceId","libraryA/keep.txt");readMutation.putString("targetId","libraryA/a.txt");readMutation.putInt("readNumber",2);
            context().getContentResolver().call(provider(),"fixture-read-tamper",null,readMutation);
            JSONObject candidateEdited=store.delete(scan.getString("session"),Collections.singletonList(id(scan,"a.txt")));
            assertEquals(0,candidateEdited.getJSONArray("deleted").length());assertEquals(1,candidateEdited.getJSONArray("failures").length());
            assertArrayEquals(body,read(keep));assertArrayEquals(changed(body),read(a));

            // The keeper may change while the final candidate hash is read, too.
            reset();keep=create("keep.txt",body);a=create("a.txt",body);scan=store.scan(tree());
            readMutation=new Bundle();readMutation.putString("sourceId","libraryA/a.txt");readMutation.putString("targetId","libraryA/keep.txt");readMutation.putInt("readNumber",2);
            context().getContentResolver().call(provider(),"fixture-read-tamper",null,readMutation);
            JSONObject keeperEdited=store.delete(scan.getString("session"),Collections.singletonList(id(scan,"a.txt")));
            assertEquals(0,keeperEdited.getJSONArray("deleted").length());assertEquals(1,keeperEdited.getJSONArray("failures").length());
            assertArrayEquals(changed(body),read(keep));assertArrayEquals(body,read(a));

            // Reserve exactly as the bridge does, then cancel before any worker starts.
            reset();keep=create("keep.txt",body);a=create("a.txt",body);scan=store.scan(tree());
            store.prepareWork();store.cancel();
            JSONObject cancelledBeforeStart=store.delete(scan.getString("session"),Collections.singletonList(id(scan,"a.txt")));
            assertTrue(cancelledBeforeStart.getBoolean("cancelled"));assertTrue(cancelledBeforeStart.getBoolean("partial"));
            assertEquals(0,cancelledBeforeStart.getJSONArray("deleted").length());assertFalse(store.progress().getBoolean("running"));
            assertArrayEquals(body,read(keep));assertArrayEquals(body,read(a));
            store.prepareWork();store.cancel();JSONObject scanCancelledBeforeStart=store.scan(tree());
            assertTrue(scanCancelledBeforeStart.getBoolean("cancelled"));assertEquals("",scanCancelledBeforeStart.getString("session"));
            assertEquals(0,scanCancelledBeforeStart.getJSONArray("groups").length());assertArrayEquals(body,read(a));
            // Explicit retry is a new reservation; a prior cancellation must not poison it.
            store.prepareWork();JSONObject retried=store.scan(tree());assertFalse(retried.getBoolean("cancelled"));assertEquals(1,retried.getJSONArray("groups").length());

            reset();File fixture=new File(context().getCacheDir(),"fixture-documents/libraryA");
            try(RandomAccessFile output=new RandomAccessFile(new File(fixture,"too-large.bin"),"rw")){output.setLength(80L*1024*1024+1);}
            File nested=fixture;for(int depth=0;depth<10;depth++){nested=new File(nested,"level"+depth);assertTrue(nested.mkdir());}
            assertTrue(new File(nested,"too-deep.txt").createNewFile());
            JSONObject limited=store.scan(tree());assertTrue("Skipped size/depth ranges cannot claim a complete scan",limited.getBoolean("partial"));
            assertTrue(limited.getInt("skippedFiles")>0);assertEquals(0,limited.getJSONArray("groups").length());

            reset();fixture=new File(context().getCacheDir(),"fixture-documents/libraryA");
            for(int count=0;count<2001;count++)assertTrue(new File(fixture,"entry-"+count+".txt").createNewFile());
            JSONObject tooMany=store.scan(tree());assertTrue(tooMany.getBoolean("partial"));assertTrue(tooMany.getInt("scannedFiles")<=2000);

            reset();fixture=new File(context().getCacheDir(),"fixture-documents/libraryA");
            try(RandomAccessFile output=new RandomAccessFile(new File(fixture,"cancel-large.bin"),"rw")){output.setLength(64L*1024*1024);}
            ExecutorService executor=Executors.newSingleThreadExecutor();
            try{
                Future<JSONObject> running=executor.submit(()->store.scan(tree()));long deadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(10);
                while(!store.progress().optBoolean("running")&&!running.isDone()&&System.nanoTime()<deadline)Thread.sleep(1);
                assertFalse("Fixture scan must still be active when cancellation is requested",running.isDone());
                store.cancel();JSONObject cancelled=running.get(10,TimeUnit.SECONDS);
                assertTrue(cancelled.getBoolean("cancelled"));assertEquals(0,cancelled.getJSONArray("groups").length());
                assertFalse(store.progress().optBoolean("running"));assertTrue(new File(fixture,"cancel-large.bin").exists());
            }finally{store.cancel();executor.shutdownNow();}
        }finally{reset();}

        Instrumentation instrumentation=InstrumentationRegistry.getInstrumentation();
        Instrumentation.ActivityMonitor monitor=new Instrumentation.ActivityMonitor(new IntentFilter(Intent.ACTION_OPEN_DOCUMENT_TREE),new Instrumentation.ActivityResult(Activity.RESULT_CANCELED,null),true);
        instrumentation.addMonitor(monitor);
        try(ActivityScenario<MainActivity> scenario=ActivityScenario.launch(MainActivity.class)){
            awaitTrue(scenario,"Boolean(window.Capacitor?.Plugins?.ProDuplicates)");
            for(int attempt=1;attempt<=2;attempt++){
                evaluate(scenario,"window.__duplicateChooser=null;Capacitor.Plugins.ProDuplicates.chooseFolder().then(v=>window.__duplicateChooser=v,e=>window.__duplicateChooser={error:String(e)});true");
                awaitTrue(scenario,"window.__duplicateChooser?.cancelled===true");assertEquals(attempt,monitor.getHits());
            }
        }finally{instrumentation.removeMonitor(monitor);}
    }
}

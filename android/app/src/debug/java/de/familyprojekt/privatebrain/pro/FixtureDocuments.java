package de.familyprojekt.privatebrain.pro;

import android.database.*;
import android.os.*;
import android.provider.DocumentsContract.Document;
import android.provider.DocumentsProvider;
import java.io.*;

/** Debug-only, app-private SAF provider for deterministic native file tests. */
public class FixtureDocuments extends DocumentsProvider {
    private File root;private boolean broken;private String deleteDenied,deleteUnsupported,repeatDocument,tamperAfterDelete,tamperTarget,readTamperSource,readTamperTarget;private int readTamperAt,readTamperCount;
    @Override public boolean onCreate(){root=new File(getContext().getCacheDir(),"fixture-documents");root.mkdirs();return true;}
    private File file(String id)throws FileNotFoundException{try{File f=new File(root,id).getCanonicalFile();if(!f.getPath().startsWith(root.getCanonicalPath()+File.separator))throw new IOException();return f;}catch(Exception error){throw new FileNotFoundException();}}
    private static final String[] DEFAULT={Document.COLUMN_DOCUMENT_ID,Document.COLUMN_DISPLAY_NAME,Document.COLUMN_MIME_TYPE,Document.COLUMN_SIZE,Document.COLUMN_FLAGS,Document.COLUMN_LAST_MODIFIED};
    private void row(MatrixCursor c,String id)throws FileNotFoundException{
        File f=file(id);if(!f.exists())throw new FileNotFoundException();MatrixCursor.RowBuilder row=c.newRow();
        for(String col:c.getColumnNames())switch(col){case Document.COLUMN_DOCUMENT_ID:row.add(id);break;case Document.COLUMN_DISPLAY_NAME:row.add(f.getName());break;case Document.COLUMN_MIME_TYPE:row.add(f.isDirectory()?Document.MIME_TYPE_DIR:"text/plain");break;case Document.COLUMN_SIZE:row.add(f.length());break;case Document.COLUMN_LAST_MODIFIED:row.add(f.lastModified());break;case Document.COLUMN_FLAGS:row.add(f.isDirectory()?Document.FLAG_DIR_SUPPORTS_CREATE:Document.FLAG_SUPPORTS_WRITE|(id.equals(deleteUnsupported)?0:Document.FLAG_SUPPORTS_DELETE));break;default:row.add(null);}
    }
    @Override public Cursor queryRoots(String[] projection){return new MatrixCursor(projection==null?new String[]{"root_id"}:projection);}
    @Override public Cursor queryDocument(String id,String[] projection)throws FileNotFoundException{MatrixCursor c=new MatrixCursor(projection==null?DEFAULT:projection);row(c,id);return c;}
    @Override public Cursor queryChildDocuments(String parent,String[] projection,String sort)throws FileNotFoundException{MatrixCursor c=new MatrixCursor(projection==null?DEFAULT:projection);File[] list=file(parent).listFiles();if(list==null)throw new FileNotFoundException();for(File f:list){String id=parent+"/"+f.getName();row(c,id);if(id.equals(repeatDocument))row(c,id);}return c;}
    @Override public ParcelFileDescriptor openDocument(String id,String mode,CancellationSignal signal)throws FileNotFoundException{
        if("r".equals(mode)&&id.equals(readTamperSource)&&++readTamperCount==readTamperAt){
            String target=readTamperTarget;readTamperSource=null;readTamperTarget=null;File changed=file(target);long previous=changed.lastModified();
            try(RandomAccessFile output=new RandomAccessFile(changed,"rw")){int first=output.read();output.seek(0);output.write(first^1);}
            catch(IOException error){throw new FileNotFoundException();}
            // Deterministic even on filesystems whose timestamp resolution is coarse.
            if(!changed.setLastModified(previous+5000))throw new FileNotFoundException();
        }
        return ParcelFileDescriptor.open(file(id),ParcelFileDescriptor.parseMode(mode));
    }
    @Override public String createDocument(String parent,String mime,String name)throws FileNotFoundException{if(broken||name.contains("/")||name.contains("\\"))throw new FileNotFoundException();String id=parent+"/"+name;File f=file(id);try{if(Document.MIME_TYPE_DIR.equals(mime)?!f.mkdir():!f.createNewFile())throw new IOException();}catch(Exception error){throw new FileNotFoundException();}return id;}
    @Override public void deleteDocument(String id)throws FileNotFoundException{
        if(id.equals(deleteDenied)||!file(id).delete())throw new FileNotFoundException();
        if(tamperTarget!=null&&(id.equals(tamperAfterDelete)||"*".equals(tamperAfterDelete))){
            String target=tamperTarget;tamperAfterDelete=null;tamperTarget=null;
            try(RandomAccessFile output=new RandomAccessFile(file(target),"rw")){int first=output.read();output.seek(0);output.write(first^1);}
            catch(IOException error){throw new FileNotFoundException();}
        }
    }
    @Override public boolean isChildDocument(String parent,String child){return child.startsWith(parent+"/");}
    private void clear(File f){File[] children=f.listFiles();if(children!=null)for(File child:children)clear(child);f.delete();}
    @Override public Bundle call(String method,String arg,Bundle extras){
        if(method.equals("fixture-reset")){
            clear(root);root.mkdirs();broken=false;deleteDenied=null;deleteUnsupported=null;repeatDocument=null;tamperAfterDelete=null;tamperTarget=null;readTamperSource=null;readTamperTarget=null;readTamperAt=0;readTamperCount=0;
            try{for(String dir:new String[]{"sourceA","sourceB","libraryA","libraryB","vaultA"})new File(root,dir).mkdirs();
                try(FileOutputStream output=new FileOutputStream(new File(root,"sourceA/one.txt"))){byte[] bytes=new byte[300000];for(int i=0;i<bytes.length;i++)bytes[i]=(byte)(i%251);output.write(bytes);}
                try(FileOutputStream output=new FileOutputStream(new File(root,"sourceB/two.txt"))){output.write("second folder".getBytes(java.nio.charset.StandardCharsets.UTF_8));}
            }catch(Exception error){throw new IllegalStateException(error);}return Bundle.EMPTY;
        }
        if(method.equals("fixture-broken")){broken=true;return Bundle.EMPTY;}
        if(method.equals("fixture-delete-deny")){deleteDenied=arg;return Bundle.EMPTY;}
        if(method.equals("fixture-delete-unsupported")){deleteUnsupported=arg;return Bundle.EMPTY;}
        if(method.equals("fixture-repeat-document")){repeatDocument=arg;return Bundle.EMPTY;}
        if(method.equals("fixture-delete-tamper")){tamperAfterDelete=extras.getString("afterId");tamperTarget=extras.getString("targetId");return Bundle.EMPTY;}
        if(method.equals("fixture-read-tamper")){readTamperSource=extras.getString("sourceId");readTamperTarget=extras.getString("targetId");readTamperAt=extras.getInt("readNumber");readTamperCount=0;return Bundle.EMPTY;}
        return super.call(method,arg,extras);
    }
}

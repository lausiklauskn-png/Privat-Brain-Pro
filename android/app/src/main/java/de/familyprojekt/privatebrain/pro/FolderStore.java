package de.familyprojekt.privatebrain.pro;

import android.content.Context;
import android.content.ContentResolver;
import android.database.Cursor;
import android.net.Uri;
import android.provider.DocumentsContract;
import java.io.*;
import java.util.*;
import org.json.*;

/** Selected SAF trees only. Sources are read; only newly created library copies are written. */
final class FolderStore {
    static final long MAX_FILE=80L*1024*1024, MAX_BATCH=512L*1024*1024;
    private final Context context;
    private final ContentResolver resolver;
    private final Map<String,Uri> sources=new HashMap<>();
    private final Map<String,Long> sizes=new HashMap<>();
    FolderStore(Context context){this.context=context;resolver=context.getContentResolver();}
    private android.content.SharedPreferences prefs(){return context.getSharedPreferences("folders-v1",Context.MODE_PRIVATE);}
    private Uri root(Uri tree){return DocumentsContract.buildDocumentUriUsingTree(tree,DocumentsContract.getTreeDocumentId(tree));}
    private String name(Uri document)throws Exception{
        try(Cursor c=resolver.query(document,new String[]{DocumentsContract.Document.COLUMN_DISPLAY_NAME},null,null,null)){
            if(c==null||!c.moveToFirst())throw new IOException();return c.getString(0);
        }
    }
    synchronized JSONObject state()throws Exception{return new JSONObject().put("enabled",prefs().getBoolean("enabled",false)).put("name",prefs().getString("name",""));}
    synchronized JSONObject library(Uri tree)throws Exception{
        String name=name(root(tree));
        if(!prefs().edit().putString("tree",tree.toString()).putString("name",name).putBoolean("enabled",true).commit())throw new IOException();
        return state();
    }
    synchronized JSONObject pause()throws Exception{if(!prefs().edit().putBoolean("enabled",false).commit())throw new IOException();return state();}
    synchronized JSONObject source(Uri tree)throws Exception{
        sources.clear();sizes.clear();JSONArray items=new JSONArray();long[] total={0};
        String name=name(root(tree));
        try{walk(tree,DocumentsContract.getTreeDocumentId(tree),name,0,items,total);}
        catch(Exception error){sources.clear();sizes.clear();throw error;}
        return new JSONObject().put("name",name).put("items",items);
    }
    private void walk(Uri tree,String parent,String path,int depth,JSONArray out,long[] total)throws Exception{
        if(depth>8)throw new IOException("FOLDER_LIMIT");
        Uri children=DocumentsContract.buildChildDocumentsUriUsingTree(tree,parent);
        String[] projection={DocumentsContract.Document.COLUMN_DOCUMENT_ID,DocumentsContract.Document.COLUMN_DISPLAY_NAME,DocumentsContract.Document.COLUMN_MIME_TYPE,DocumentsContract.Document.COLUMN_SIZE};
        try(Cursor c=resolver.query(children,projection,null,null,null)){
            if(c==null)throw new IOException();
            while(c.moveToNext()){
                String id=c.getString(0),name=c.getString(1),type=c.getString(2);
                if(name==null||name.startsWith("."))continue;
                if(name.contains("/")||name.contains("\\")||name.length()>1024)throw new IOException();
                if(DocumentsContract.Document.MIME_TYPE_DIR.equals(type)){walk(tree,id,path+"/"+name,depth+1,out,total);continue;}
                long size=c.isNull(3)?-1:c.getLong(3);
                if(size<0||size>MAX_FILE||out.length()>=2000||(total[0]+=size)>MAX_BATCH)throw new IOException("FOLDER_LIMIT");
                String ticket=UUID.randomUUID().toString();sources.put(ticket,DocumentsContract.buildDocumentUriUsingTree(tree,id));sizes.put(ticket,size);
                out.put(new JSONObject().put("id",ticket).put("name",name).put("path",path+"/"+name).put("type",type==null?"":type).put("size",size));
            }
        }
    }
    synchronized byte[] read(String id,long offset)throws Exception{
        Uri uri=sources.get(id);Long size=sizes.get(id);
        if(uri==null||size==null||offset<0||offset>size)throw new IOException();
        byte[] bytes=new byte[(int)Math.min(OriginalFileStore.CHUNK,size-offset)];
        try(InputStream input=resolver.openInputStream(uri)){
            if(input==null)throw new IOException();
            long left=offset;while(left>0){long skipped=input.skip(left);if(skipped==0){if(input.read()==-1)throw new EOFException();skipped=1;}left-=skipped;}
            new DataInputStream(input).readFully(bytes);
        }return bytes;
    }
    synchronized void finishSource(){sources.clear();sizes.clear();}
    synchronized JSONObject copy(String hash,String requestedName)throws Exception{
        if(!prefs().getBoolean("enabled",false))return new JSONObject().put("copied",false);
        OriginalFileStore originals=new OriginalFileStore(context);File original=originals.file(hash);
        if(!hash.equals(OriginalFileStore.digest(original)))throw new IOException();
        Uri tree=Uri.parse(prefs().getString("tree",""));String parent=DocumentsContract.getTreeDocumentId(tree);
        Set<String> names=new HashSet<>();
        try(Cursor c=resolver.query(DocumentsContract.buildChildDocumentsUriUsingTree(tree,parent),new String[]{DocumentsContract.Document.COLUMN_DISPLAY_NAME},null,null,null)){
            if(c==null)throw new IOException();while(c.moveToNext())names.add(c.getString(0));
        }
        String safe=MailMime.filename(requestedName);if(safe.isEmpty())safe="file";
        String selected=safe;int dot=safe.lastIndexOf('.');String base=dot>0?safe.substring(0,dot):safe,ext=dot>0?safe.substring(dot):"";
        for(int n=1;names.contains(selected);n++){if(n>10000)throw new IOException();selected=base+" ("+n+")"+ext;}
        String type=originals.info(hash).optString("type","application/octet-stream");if(type.isEmpty())type="application/octet-stream";
        Uri created=DocumentsContract.createDocument(resolver,root(tree),type,selected);if(created==null)throw new IOException();
        try{
            try(InputStream input=new FileInputStream(original);OutputStream output=resolver.openOutputStream(created,"w")){
                if(output==null)throw new IOException();byte[] bytes=new byte[OriginalFileStore.CHUNK];int n;while((n=input.read(bytes))!=-1)output.write(bytes,0,n);
            }
            // A provider can fail after accepting writes. Verify before catalog import succeeds.
            java.security.MessageDigest digest=java.security.MessageDigest.getInstance("SHA-256");
            try(InputStream input=resolver.openInputStream(created)){if(input==null)throw new IOException();byte[] bytes=new byte[OriginalFileStore.CHUNK];int n;while((n=input.read(bytes))!=-1)digest.update(bytes,0,n);}
            StringBuilder actual=new StringBuilder();for(byte b:digest.digest())actual.append(String.format(Locale.ROOT,"%02x",b&255));
            if(!hash.contentEquals(actual))throw new IOException();
        }catch(Exception error){try{DocumentsContract.deleteDocument(resolver,created);}catch(Exception ignored){}throw error;}
        return new JSONObject().put("copied",true).put("name",selected);
    }
}

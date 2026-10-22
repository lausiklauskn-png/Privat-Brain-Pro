package de.familyprojekt.privatebrain.pro;

import java.io.*;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.*;
import org.json.*;

/** Explicit folder grants only. Same limits and transfer contract as Android's FolderStore. */
final class DesktopFolders {
    static final long MAX_FILE=80L*1024*1024,MAX_BATCH=512L*1024*1024;
    private final DesktopState state;private final DesktopState.Preferences prefs;private final OriginalFileStore originals;
    private final Map<String,Source> sources=new HashMap<>();
    private record Source(Path path,long size,java.nio.file.attribute.FileTime modified,Object key){}
    DesktopFolders(DesktopState state){this.state=state;prefs=state.getSharedPreferences("folders-v1",0);originals=new OriginalFileStore(state);}
    synchronized JSONObject state(){return new JSONObject().put("enabled",prefs.getBoolean("enabled",false)).put("name",prefs.getString("name",""));}
    synchronized JSONObject library(String value)throws Exception {
        Path root=Path.of(value).toAbsolutePath().normalize();DesktopFiles.noLinks(root);if(!Files.isDirectory(root))throw new IOException("VAULT_FOLDER_UNAVAILABLE");
        if(!prefs.edit().putString("tree",root.toString()).putString("name",label(root)).putBoolean("enabled",true).commit())throw new IOException("VAULT_UNAVAILABLE");return state();
    }
    synchronized JSONObject pause()throws Exception {if(!prefs.edit().putBoolean("enabled",false).commit())throw new IOException("VAULT_UNAVAILABLE");return state();}
    private static String label(Path path){return path.getFileName()==null?path.toString():path.getFileName().toString();}
    synchronized JSONObject source(String value)throws Exception {
        sources.clear();JSONArray items=new JSONArray();Path root=Path.of(value).toAbsolutePath().normalize();DesktopFiles.noLinks(root);
        try{walk(root,label(root),0,items,new long[]{0});return new JSONObject().put("name",label(root)).put("items",items);}
        catch(Exception error){sources.clear();throw error;}
    }
    private void walk(Path folder,String prefix,int depth,JSONArray items,long[] total)throws Exception {
        if(depth>8)throw new IOException("FOLDER_LIMIT");DesktopFiles.noLinks(folder);
        try(DirectoryStream<Path> children=Files.newDirectoryStream(folder)){
            for(Path file:children){
                String name=file.getFileName().toString();if(name.startsWith(".")||Files.isHidden(file))continue;
                DesktopFiles.noLinks(file);BasicFileAttributes a=Files.readAttributes(file,BasicFileAttributes.class,LinkOption.NOFOLLOW_LINKS);
                if(a.isDirectory()){walk(file,prefix+"/"+name,depth+1,items,total);continue;}
                if(!a.isRegularFile())throw new IOException("VAULT_FOLDER_UNAVAILABLE");
                if(a.size()>MAX_FILE||items.length()>=2000||(total[0]+=a.size())>MAX_BATCH)throw new IOException("FOLDER_LIMIT");
                String id=UUID.randomUUID().toString();sources.put(id,new Source(file,a.size(),a.lastModifiedTime(),a.fileKey()));
                items.put(new JSONObject().put("id",id).put("name",name).put("path",prefix+"/"+name).put("type",Optional.ofNullable(Files.probeContentType(file)).orElse("application/octet-stream")).put("size",a.size()));
            }
        }
    }
    private static void check(Source source)throws Exception {
        DesktopFiles.noLinks(source.path);BasicFileAttributes now=Files.readAttributes(source.path,BasicFileAttributes.class,LinkOption.NOFOLLOW_LINKS);
        if(!now.isRegularFile()||now.size()!=source.size||!now.lastModifiedTime().equals(source.modified)||!Objects.equals(now.fileKey(),source.key))throw new IOException("FILE_CHANGED");
    }
    synchronized byte[] read(String id,long offset)throws Exception {
        Source source=sources.get(id);if(source==null||offset<0||offset>source.size)throw new IOException("INVALID_INPUT");check(source);
        byte[] bytes=new byte[(int)Math.min(OriginalFileStore.CHUNK,source.size-offset)];
        try(FileChannel file=FileChannel.open(source.path,StandardOpenOption.READ)){
            ByteBuffer target=ByteBuffer.wrap(bytes);while(target.hasRemaining()){int read=file.read(target,offset+target.position());if(read<0)throw new EOFException();}
        }check(source);return bytes;
    }
    synchronized void finish(){sources.clear();}
    synchronized JSONObject copy(String hash,String requested)throws Exception {
        if(!prefs.getBoolean("enabled",false))return new JSONObject().put("copied",false);
        File source=originals.file(hash);DesktopFiles.noLinks(source.toPath());if(!hash.equals(OriginalFileStore.digest(source)))throw new IOException("ORIGINAL_HASH_MISMATCH");
        Path root=Path.of(prefs.getString("tree","")).toAbsolutePath().normalize();DesktopFiles.noLinks(root);
        String name=DesktopNames.safe(requested);int dot=name.lastIndexOf('.');String base=dot>0?name.substring(0,dot):name,extension=dot>0?name.substring(dot):"";
        for(int n=0;n<10000;n++){
            String selected=n==0?name:base+" ("+n+")"+extension;Path target=root.resolve(selected);DesktopFiles.noLinks(target);
            FileChannel output;try{output=FileChannel.open(target,StandardOpenOption.CREATE_NEW,StandardOpenOption.WRITE);}catch(FileAlreadyExistsException collision){continue;}
            try{
                try(output;FileChannel input=FileChannel.open(source.toPath(),StandardOpenOption.READ)){
                    ByteBuffer block=ByteBuffer.allocate(OriginalFileStore.CHUNK);while(input.read(block)!=-1){block.flip();while(block.hasRemaining())output.write(block);block.clear();}output.force(true);
                }
                if(!hash.equals(OriginalFileStore.digest(target.toFile())))throw new IOException("ORIGINAL_HASH_MISMATCH");
                return new JSONObject().put("copied",true).put("name",selected);
            }catch(Exception error){Files.deleteIfExists(target);throw error;}
        }throw new IOException("FOLDER_LIMIT");
    }
}

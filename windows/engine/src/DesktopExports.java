package de.familyprojekt.privatebrain.pro;

import java.io.*;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.*;

/** Export copies retain their type; selected sources and stored originals stay read only. */
final class DesktopExports {
    private final Path folder;
    DesktopExports(DesktopState state){folder=state.directory.resolve("cache/exports");}
    synchronized Path stage(File source,String name)throws Exception {
        Path from=source.toPath();DesktopFiles.noLinks(from);DesktopFiles.noLinks(folder);Files.createDirectories(folder);
        BasicFileAttributes before=Files.readAttributes(from,BasicFileAttributes.class,LinkOption.NOFOLLOW_LINKS);
        if(!before.isRegularFile()||before.size()>200L*1024*1024)throw new IOException("FILE_UNAVAILABLE");
        long used=0;
        try(var paths=Files.newDirectoryStream(folder)){
            for(Path path:paths){DesktopFiles.noLinks(path);if(!Files.isRegularFile(path))continue;
                if(System.currentTimeMillis()-Files.getLastModifiedTime(path).toMillis()>86400000)Files.delete(path);else used+=Files.size(path);}
        }
        if(used+before.size()>256L*1024*1024||Files.getFileStore(folder).getUsableSpace()<before.size()+32L*1024*1024)throw new IOException("STORAGE_FULL");
        Path target=folder.resolve(UUID.randomUUID()+"-"+DesktopNames.safe(name));
        try{
            copy(from,target);
            BasicFileAttributes after=Files.readAttributes(from,BasicFileAttributes.class,LinkOption.NOFOLLOW_LINKS);
            if(before.size()!=after.size()||!before.lastModifiedTime().equals(after.lastModifiedTime())||!Objects.equals(before.fileKey(),after.fileKey()))throw new IOException("FILE_CHANGED");
            return target;
        }catch(Exception error){Files.deleteIfExists(target);throw error;}
    }
    static void copy(Path source,Path target)throws Exception {
        DesktopFiles.noLinks(source);DesktopFiles.noLinks(target);
        String expected=OriginalFileStore.digest(source.toFile());
        boolean created=false;
        try{
            FileChannel destination=FileChannel.open(target,StandardOpenOption.CREATE_NEW,StandardOpenOption.WRITE);created=true;
            try(FileChannel output=destination;InputStream input=Files.newInputStream(source)){
                byte[] block=new byte[262144];int size;
                while((size=input.read(block))!=-1){ByteBuffer data=ByteBuffer.wrap(block,0,size);while(data.hasRemaining())output.write(data);}
                output.force(true);
            }
            if(!expected.equals(OriginalFileStore.digest(target.toFile())))throw new IOException("FILE_CHANGED");
        }catch(Exception error){if(created)Files.deleteIfExists(target);throw error;}
    }
}

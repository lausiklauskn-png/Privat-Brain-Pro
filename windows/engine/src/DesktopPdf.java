package de.familyprojekt.privatebrain.pro;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.*;
import org.json.JSONObject;

/** Per-document subprocess prevents a bad PDF from consuming the mail/vault heap. */
final class DesktopPdf implements AutoCloseable {
    private final LinkedHashMap<String,Session> sessions=new LinkedHashMap<>();
    private static final class Session {
        final Process process;final BufferedReader output;final Writer input;int pages;
        Session(Path file)throws Exception {
            boolean win=System.getProperty("os.name").startsWith("Windows");
            ProcessBuilder builder=new ProcessBuilder(Path.of(System.getProperty("java.home"),"bin",win?"javaw.exe":"java").toString(),"-Xmx256m","-Djava.awt.headless=true","-Dfile.encoding=UTF-8","-cp",System.getProperty("java.class.path"),"de.familyprojekt.privatebrain.pro.PdfWorker",file.toString());
            builder.environment().remove("JAVA_TOOL_OPTIONS");builder.environment().remove("_JAVA_OPTIONS");builder.environment().remove("JDK_JAVA_OPTIONS");
            process=builder.redirectError(ProcessBuilder.Redirect.DISCARD).start();
            input=new OutputStreamWriter(process.getOutputStream(),StandardCharsets.UTF_8);output=new BufferedReader(new InputStreamReader(process.getInputStream(),StandardCharsets.UTF_8));
        }
        JSONObject response()throws Exception {
            FutureTask<String> read=new FutureTask<>(()->{
                StringBuilder line=new StringBuilder();int c;
                while((c=output.read())!=-1){if(c=='\n')return line.toString();if(line.length()>24*1024*1024)throw new IOException("PDF_UNAVAILABLE");if(c!='\r')line.append((char)c);}
                throw new EOFException();
            });
            Thread thread=Thread.ofVirtual().start(read);
            try{JSONObject result=new JSONObject(read.get(30,TimeUnit.SECONDS));if(result.has("error"))throw new IOException("PDF_UNAVAILABLE");return result;}
            catch(Exception error){stop();throw new IOException("PDF_UNAVAILABLE");}
            finally{read.cancel(true);thread.interrupt();}
        }
        void stop(){process.destroyForcibly();try{input.close();}catch(Exception ignored){}try{output.close();}catch(Exception ignored){}}
    }
    synchronized JSONObject open(File file)throws Exception {
        while(sessions.size()>=2)close(sessions.keySet().iterator().next());
        DesktopFiles.noLinks(file.toPath());Session session=new Session(file.toPath());
        try{JSONObject result=session.response();session.pages=result.getInt("pages");String id=UUID.randomUUID().toString();sessions.put(id,session);return result.put("id",id);}
        catch(Exception error){session.stop();throw error;}
    }
    JSONObject page(String id,int page,int width)throws Exception {
        Session session;synchronized(this){session=sessions.get(id);}
        if(session==null||page<0||page>=session.pages)throw new IOException("PDF_UNAVAILABLE");
        synchronized(session){session.input.write(new JSONObject().put("page",page).put("width",width).toString()+"\n");session.input.flush();return session.response();}
    }
    synchronized void close(String id){Session session=sessions.remove(id);if(session!=null)session.stop();}
    public synchronized void close(){for(Session session:sessions.values())session.stop();sessions.clear();}
}

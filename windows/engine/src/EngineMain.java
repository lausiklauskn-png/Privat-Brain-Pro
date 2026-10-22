package de.familyprojekt.privatebrain.pro;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.UUID;
import java.util.concurrent.*;
import org.json.JSONObject;

/** Private parent/child protocol over inherited stdio. No network listener or page secret API. */
public final class EngineMain {
    private static final ConcurrentHashMap<String,CompletableFuture<JSONObject>> replies=new ConcurrentHashMap<>();
    private static final ExecutorService workers=Executors.newVirtualThreadPerTaskExecutor();
    private static final PrintWriter output=new PrintWriter(new OutputStreamWriter(System.out,StandardCharsets.UTF_8),true);
    static synchronized void send(JSONObject value){output.println(value.toString());}
    static JSONObject host(String method,JSONObject options)throws Exception {
        String id=UUID.randomUUID().toString();CompletableFuture<JSONObject> response=new CompletableFuture<>();replies.put(id,response);
        try{
            send(new JSONObject().put("host",id).put("method",method).put("options",options));
            JSONObject result=response.get(10,TimeUnit.MINUTES);
            if(result.has("error"))throw new IOException(result.getString("error"));
            return result.getJSONObject("result");
        }finally{replies.remove(id);}
    }
    static void event(String name,JSONObject value){send(new JSONObject().put("event",name).put("data",value));}
    public static void main(String[] args)throws Exception {
        if(args.length!=2)throw new IllegalArgumentException("APP_CONFIGURATION_INVALID");
        CompletableFuture<DesktopService> service=new CompletableFuture<>();
        workers.submit(()->{
            try{
                DesktopState.Protection protection=new DesktopState.Protection(){
                    public byte[] protect(String binding,byte[] plain)throws Exception{return operation("protect",binding,plain);}
                    public byte[] unprotect(String binding,byte[] sealed)throws Exception{return operation("unprotect",binding,sealed);}
                    private byte[] operation(String method,String binding,byte[] bytes)throws Exception{
                        return Base64.decode(host(method,new JSONObject().put("binding",binding).put("data",Base64.encodeToString(bytes,Base64.NO_WRAP))).getString("data"),Base64.NO_WRAP);
                    }
                };
                DesktopState state=new DesktopState(Path.of(args[0]),protection);
                service.complete(new DesktopService(state,Path.of(args[1]),EngineMain::host));
            }catch(Throwable error){service.completeExceptionally(error);}
        });
        try(BufferedReader input=new BufferedReader(new InputStreamReader(System.in,StandardCharsets.UTF_8))){
            String line;
            while((line=limitedLine(input))!=null){
                JSONObject message=new JSONObject(line);
                if(message.has("replyTo")){
                    CompletableFuture<JSONObject> reply=replies.get(message.getString("replyTo"));if(reply!=null)reply.complete(message);continue;
                }
                workers.submit(()->{
                    String id=message.optString("id");
                    try{send(new JSONObject().put("id",id).put("result",service.get().call(message.getString("plugin"),message.getString("method"),message.optJSONObject("options"))));}
                    catch(Throwable error){Throwable cause=error instanceof ExecutionException?error.getCause():error;send(new JSONObject().put("id",id).put("error",DesktopErrors.code(cause)));}
                });
            }
        }finally{workers.shutdownNow();for(var reply:replies.values())reply.completeExceptionally(new EOFException());}
    }
    private static String limitedLine(Reader reader)throws IOException {
        StringBuilder line=new StringBuilder();int c;
        while((c=reader.read())!=-1){if(c=='\n')return line.toString();if(line.length()>=64*1024*1024)throw new IOException("APP_PROTOCOL_LIMIT");if(c!='\r')line.append((char)c);}
        return line.length()==0?null:line.toString();
    }
}

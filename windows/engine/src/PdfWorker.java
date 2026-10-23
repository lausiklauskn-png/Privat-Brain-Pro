package de.familyprojekt.privatebrain.pro;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import org.json.JSONObject;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.*;

/** Isolated, memory/time-bounded rendering process. Never executes document actions. */
public final class PdfWorker {
    public static void main(String[] args)throws Exception {
        if(args.length!=1)throw new IllegalArgumentException();
        Path file=Path.of(args[0]);DesktopFiles.noLinks(file);
        if(!Files.isRegularFile(file)||Files.size(file)>256L*1024*1024)throw new IOException("PDF_UNAVAILABLE");
        try(PDDocument document=Loader.loadPDF(file.toFile());BufferedReader input=new BufferedReader(new InputStreamReader(System.in,StandardCharsets.UTF_8))){
            PrintWriter output=new PrintWriter(new OutputStreamWriter(System.out,StandardCharsets.UTF_8),true);
            int pages=document.getNumberOfPages();if(pages<1||pages>10000)throw new IOException("PDF_UNAVAILABLE");
            output.println(new JSONObject().put("pages",pages));
            PDFRenderer renderer=new PDFRenderer(document);renderer.setSubsamplingAllowed(true);
            String line;
            while((line=input.readLine())!=null){
                if(line.length()>8192)break;
                try{
                    JSONObject request=new JSONObject(line);int index=request.getInt("page"),requested=request.optInt("width",1200);
                    if(index<0||index>=pages)throw new IllegalArgumentException();
                    var page=document.getPage(index);var box=page.getCropBox();double w=box.getWidth(),h=box.getHeight();
                    if(!Double.isFinite(w)||!Double.isFinite(h)||w<=0||h<=0||w>1e7||h>1e7)throw new IllegalArgumentException();
                    if(Math.floorMod(page.getRotation(),180)!=0){double swap=w;w=h;h=swap;}
                    float scale=(float)Math.min(Math.min(Math.max(320,Math.min(2048,requested))/w,2048.0/h),Math.sqrt(4_000_000.0/(w*h)));
                    java.awt.image.BufferedImage image=renderer.renderImage(index,scale,ImageType.RGB);
                    try{
                        if(image.getWidth()>2048||image.getHeight()>2048||(long)image.getWidth()*image.getHeight()>4_000_000)throw new IllegalArgumentException();
                        ByteArrayOutputStream bytes=new ByteArrayOutputStream();javax.imageio.ImageIO.write(image,"png",bytes);
                        output.println(new JSONObject().put("data",Base64.encodeToString(bytes.toByteArray(),Base64.NO_WRAP)).put("width",image.getWidth()).put("height",image.getHeight()));
                    }finally{image.flush();}
                }catch(Exception error){output.println(new JSONObject().put("error","PDF_UNAVAILABLE"));}
            }
        }
    }
}

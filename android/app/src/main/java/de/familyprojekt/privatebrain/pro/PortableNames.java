package de.familyprojekt.privatebrain.pro;

import java.nio.charset.StandardCharsets;
import java.text.Normalizer;

/** One filename policy for Android storage providers, Windows and portable copies. */
final class PortableNames {
    static String safe(String raw) {
        return safe(raw,160,200);
    }
    static String safe(String raw,int unitLimit,int byteLimit) {
        String name=Normalizer.normalize(raw==null?"file":raw,Normalizer.Form.NFC)
            .replaceAll("[\\p{Cntrl}\\p{Cf}<>:\"/\\\\|?*]","_").replaceAll("^[. ]+|[. ]+$","");
        if(name.isEmpty())name="file";
        if(name.matches("(?i)(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\\..*)?"))name="_"+name;
        int dot=name.lastIndexOf('.');String extension=dot>0&&name.substring(dot+1).matches("[A-Za-z0-9]{1,16}")?name.substring(dot):"";
        if(name.length()<=unitLimit&&name.getBytes(StandardCharsets.UTF_8).length<=byteLimit)return name;
        StringBuilder stem=new StringBuilder();int bytes=extension.getBytes(StandardCharsets.UTF_8).length,units=extension.length();
        String base=extension.isEmpty()?name:name.substring(0,dot);
        for(int cp:base.codePoints().toArray()){
            String value=new String(Character.toChars(cp));int next=value.getBytes(StandardCharsets.UTF_8).length;
            if(bytes+next>byteLimit||units+value.length()>unitLimit)break;stem.append(value);bytes+=next;units+=value.length();
        }
        return stem.toString().replaceAll("[. ]+$","")+extension;
    }
}

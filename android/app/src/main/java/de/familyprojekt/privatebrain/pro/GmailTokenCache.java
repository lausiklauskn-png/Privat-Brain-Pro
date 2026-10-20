package de.familyprojekt.privatebrain.pro;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.function.LongSupplier;

/** Briefly reuse a completed grant during IMAP/SMTP setup. No persistence or JS access. */
final class GmailTokenCache {
    static final long LIFETIME_MS = 120_000;
    private final LongSupplier clock;
    private final LinkedHashMap<String,Entry> entries = new LinkedHashMap<>();
    private static final class Entry {
        final String token; final long created;
        Entry(String token,long created){this.token=token;this.created=created;}
    }
    GmailTokenCache(){this(android.os.SystemClock::elapsedRealtime);}
    GmailTokenCache(LongSupplier clock){this.clock=clock;}
    synchronized void put(String email,String token){
        if(email==null||email.isEmpty()||token==null||token.isEmpty())return;
        entries.put(email.toLowerCase(Locale.ROOT),new Entry(token,clock.getAsLong()));
        while(entries.size()>8)entries.remove(entries.keySet().iterator().next());
    }
    synchronized String get(String email){
        if(email==null)return null;String key=email.toLowerCase(Locale.ROOT);Entry entry=entries.get(key);
        if(entry==null)return null;long age=clock.getAsLong()-entry.created;
        if(age<0||age>=LIFETIME_MS){entries.remove(key);return null;}
        return entry.token;
    }
    synchronized void invalidate(String token){entries.values().removeIf(entry->entry.token.equals(token));}
    synchronized void clear(){entries.clear();}
}

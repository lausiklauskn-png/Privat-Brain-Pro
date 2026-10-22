package de.familyprojekt.privatebrain.pro;

/** Parsing only: never executes HTML, resolves URLs or loads remote resources. */
final class DesktopHtml {
    static String text(String html) {
        org.jsoup.nodes.Document doc = org.jsoup.Jsoup.parse(html);
        doc.select("script,style,template,noscript").remove();
        return doc.wholeText();
    }
}

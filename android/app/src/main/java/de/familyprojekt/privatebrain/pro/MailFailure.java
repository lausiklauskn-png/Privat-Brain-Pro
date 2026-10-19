package de.familyprojekt.privatebrain.pro;

/** Stable error codes only: never expose provider exceptions or credentials. */
final class MailFailure extends Exception {
    final String code;
    MailFailure(String code) { super(code); this.code = code; }
}

    /** DPAPI is applied by the host; copied device state never unlocks a vault. */
    private boolean remembered() {
        if (dataKey != null) return true;
        String stored = prefs().getString("remember", null), id = prefs().getString("id", null);
        if (stored == null || id == null) return false;
        try {
            byte[] key = context.protection.unprotect("pbv1-device|" + id, Base64.decode(stored, Base64.NO_WRAP));
            if (key.length != VaultCrypto.KEY) return false;
            install(key, id); return true;
        } catch (Exception error) { return false; }
    }
    private void remember(boolean value) throws Exception {
        DesktopState.Preferences.Editor edit = prefs().edit().remove("remember");
        if (value) edit.putString("remember", Base64.encodeToString(
            context.protection.protect("pbv1-device|" + vaultId, dataKey), Base64.NO_WRAP));
        if (!edit.commit()) throw fail("VAULT_UNAVAILABLE");
    }


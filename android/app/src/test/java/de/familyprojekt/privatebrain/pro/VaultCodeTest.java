package de.familyprojekt.privatebrain.pro;

import static org.junit.Assert.assertEquals;

import java.io.IOException;
import org.junit.Test;

/** The storage plugin must answer every failure with a stable code instead of failing itself. */
public class VaultCodeTest {
    @Test public void vaultFailuresKeepTheirCode() {
        assertEquals("VAULT_PASSWORD_WRONG", ProVaultPlugin.vaultCode(new VaultCrypto.Failure("VAULT_PASSWORD_WRONG")));
        assertEquals("VAULT_LOCKED", ProVaultPlugin.vaultCode(new IOException(new VaultCrypto.Failure("VAULT_LOCKED"))));
    }
    @Test public void folderPermissionLossIsNamed() {
        assertEquals("VAULT_FOLDER_UNAVAILABLE", ProVaultPlugin.vaultCode(new SecurityException("revoked")));
    }
    @Test public void unknownProblemsAreNotNetworkFailures() {
        assertEquals("VAULT_UNAVAILABLE", ProVaultPlugin.vaultCode(new IOException("disk")));
    }
}

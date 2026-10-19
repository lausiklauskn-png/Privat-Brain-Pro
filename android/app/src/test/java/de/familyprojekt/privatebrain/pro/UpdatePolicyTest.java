package de.familyprojekt.privatebrain.pro;

import org.junit.Test;
import static org.junit.Assert.*;

public class UpdatePolicyTest {
    @Test public void numericVersionOrderingPreventsDowngrades() {
        assertTrue(UpdatePolicy.newer("v0.1.0-preview.10", "v0.1.0-preview.2", true));
        assertTrue(UpdatePolicy.newer("v0.2.0-preview.1", "v0.1.0-preview.10", true));
        assertFalse(UpdatePolicy.newer("v0.1.0-preview.2", "v0.1.0-preview.10", true));
        assertFalse(UpdatePolicy.newer("v0.1.0-preview.2", "v0.1.0-preview.2", true));
        assertTrue(UpdatePolicy.newer("v1.10.0", "v1.9.9", false));
    }

    @Test public void previewAndStableAreSeparateInstallations() {
        assertFalse(UpdatePolicy.newer("v9.0.0", "v0.1.0-preview.2", true));
        assertFalse(UpdatePolicy.newer("v9.0.0-preview.2", "v1.0.0", false));
        assertNull(UpdatePolicy.version("v1.0.0-beta.1", true));
        assertNull(UpdatePolicy.version("v01.0.0", false));
        assertNull(UpdatePolicy.version("v999999999999999999999.0.0", false));
    }

    @Test public void onlyExpectedApksFromTheFixedRepositoryCanOpen() {
        String expected = "https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v0.1.0-preview.3/";
        assertEquals(expected + "Private-Brain-Pro.apk", UpdatePolicy.downloadUrl("v0.1.0-preview.3", "Private-Brain-Pro.apk", true));
        assertEquals(expected + "Private-Brain-Pro-0.1.0-preview.3.apk", UpdatePolicy.downloadUrl("v0.1.0-preview.3", "Private-Brain-Pro-0.1.0-preview.3.apk", true));
        for (String name : new String[] {"../Private-Brain-Pro.apk", "https://example.com/app.apk", "other.apk", "Private-Brain-Pro-0.1.0-preview.2.apk"}) {
            try {
                UpdatePolicy.downloadUrl("v0.1.0-preview.3", name, true);
                fail("Unexpected file accepted: " + name);
            } catch (IllegalArgumentException expectedError) { }
        }
    }
}

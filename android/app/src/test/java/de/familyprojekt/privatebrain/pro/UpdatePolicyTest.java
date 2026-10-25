package de.familyprojekt.privatebrain.pro;

import org.junit.Test;
import java.util.HashMap;
import java.util.Map;
import static org.junit.Assert.*;

public class UpdatePolicyTest {
    @Test public void numericVersionOrderingPreventsDowngrades() {
        assertTrue(UpdatePolicy.newer("v0.1.0-preview.10", "v0.1.0-preview.2", true));
        assertTrue(UpdatePolicy.newer("v0.2.0-preview.1", "v0.1.0-preview.10", true));
        assertFalse(UpdatePolicy.newer("v0.1.0-preview.2", "v0.1.0-preview.10", true));
        assertFalse(UpdatePolicy.newer("v0.1.0-preview.2", "v0.1.0-preview.2", true));
        assertTrue(UpdatePolicy.newer("v1.10.0", "v1.9.9", false));
    }

    @Test public void aPermanentInstallationCanGraduateButNeverReturnToPreviews() {
        assertTrue(UpdatePolicy.newer("v1.0.36", "v1.0.0-preview.35", true));
        assertTrue(UpdatePolicy.newer("v1.0.0", "v1.0.0-preview.35", true));
        assertTrue(UpdatePolicy.newer("v1.0.37", "v1.0.36", true));
        assertTrue(UpdatePolicy.newer("v2.0.0", "v1.0.36", false));
        assertFalse(UpdatePolicy.newer("v1.0.35", "v1.0.36", true));
        assertFalse(UpdatePolicy.newer("v9.0.0-preview.99", "v1.0.36", true));
        assertFalse(UpdatePolicy.newer("v9.0.0-preview.2", "v1.0.0", false));
        assertFalse(UpdatePolicy.newer("v1.0.36", "v1.0.0-preview.35", false));
        assertNull(UpdatePolicy.version("v1.0.0-beta.1", true));
        assertNull(UpdatePolicy.version("v01.0.0", false));
        assertNull(UpdatePolicy.version("v999999999999999999999.0.0", false));
    }

    @Test public void publicationFlagsMustMatchCanonicalTags() {
        assertTrue(UpdatePolicy.releaseAllowed("v1.0.36", false, true));
        assertTrue(UpdatePolicy.releaseAllowed("v1.0.36", false, false));
        assertTrue(UpdatePolicy.releaseAllowed("v1.0.0-preview.35", true, true));
        assertFalse(UpdatePolicy.releaseAllowed("v1.0.36", true, true));
        assertFalse(UpdatePolicy.releaseAllowed("v1.0.0-preview.35", false, true));
        assertFalse(UpdatePolicy.releaseAllowed("v1.0.0-preview.35", true, false));
        assertFalse(UpdatePolicy.releaseAllowed("windows-v1.0.36", false, true));
    }

    @Test public void identityAssetRedirectsStayOnDedicatedHttpsGithubAssetHosts() {
        assertTrue(UpdatePolicy.assetRedirectAllowed("https://release-assets.githubusercontent.com/github-production-release-asset/identity?token=public-signed-query"));
        assertTrue(UpdatePolicy.assetRedirectAllowed("https://objects.githubusercontent.com:443/github-production-release-asset/identity"));
        for (String value : new String[] {"http://release-assets.githubusercontent.com/identity", "https://example.org/identity",
                "https://release-assets.githubusercontent.com.example.org/identity", "https://user@release-assets.githubusercontent.com/identity",
                "https://release-assets.githubusercontent.com:444/identity", "https://objects.githubusercontent.com/identity#fragment",
                "https://127.0.0.1/identity", "file:///identity", "//objects.githubusercontent.com/identity"})
            assertFalse(value, UpdatePolicy.assetRedirectAllowed(value));
    }

    private static Map<String, Object> identity() {
        Map<String, Object> value = new HashMap<>();
        value.put("schema", 1); value.put("channel", "public");
        value.put("applicationId", "de.familyprojekt.privatebrain.pro.preview");
        value.put("certificateSha256", "a".repeat(64)); value.put("sourceCommit", "b".repeat(40));
        value.put("tag", "v1.0.36"); value.put("versionName", "1.0.36"); value.put("versionCode", 36);
        value.put("apk", "Private-Brain-Pro-1.0.36.apk"); value.put("apkSha256", "c".repeat(64));
        return value;
    }
    private static boolean publicIdentity(Map<String, Object> value) {
        return UpdatePolicy.releaseIdentity(value, "v1.0.36", "de.familyprojekt.privatebrain.pro.preview",
            "a".repeat(64), 35, "Private-Brain-Pro-1.0.36.apk");
    }

    @Test public void publicIdentityKeepsTheExistingPackageAndSignerSeparateFromProduction() {
        assertTrue(publicIdentity(identity()));
        assertFalse(UpdatePolicy.releaseIdentity(identity(), "v1.0.36", "de.familyprojekt.privatebrain.pro", "a".repeat(64), 35, "Private-Brain-Pro-1.0.36.apk"));
        Map<String, Object> production = identity(); production.put("channel", "stable"); production.put("applicationId", "de.familyprojekt.privatebrain.pro");
        assertTrue(UpdatePolicy.releaseIdentity(production, "v1.0.36", "de.familyprojekt.privatebrain.pro", "a".repeat(64), 35, "Private-Brain-Pro-1.0.36.apk"));
        assertFalse(publicIdentity(production));
        assertFalse(UpdatePolicy.releaseIdentity(identity(), "v1.0.36", "de.familyprojekt.privatebrain.pro.preview", "d".repeat(64), 35, "Private-Brain-Pro-1.0.36.apk"));
    }

    @Test public void stableIdentityRequiresCompleteConsistentMetadataAndANewerExplicitCode() {
        for (String key : identity().keySet()) {
            Map<String, Object> value = identity(); value.remove(key);
            assertFalse("Missing identity field: " + key, publicIdentity(value));
        }
        for (Object[] change : new Object[][] {{"schema", 2}, {"channel", "test"}, {"versionName", "1.0.35"},
                {"versionCode", 35}, {"versionCode", 0}, {"versionCode", 2147483648L}, {"versionCode", 36.0},
                {"tag", "v1.0.0-preview.36"}, {"sourceCommit", "../source"}, {"apkSha256", "short"},
                {"apk", "../Private-Brain-Pro-1.0.36.apk"}, {"certificateSha256", "d".repeat(64)}}) {
            Map<String, Object> value = identity(); value.put((String)change[0], change[1]);
            assertFalse("Inconsistent identity field: " + change[0] + "=" + change[1], publicIdentity(value));
        }
    }

    @Test public void onlyExpectedApksFromTheFixedRepositoryCanOpen() {
        String expected = "https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v0.1.0-preview.3/";
        assertEquals(expected + "Private-Brain-Pro.apk", UpdatePolicy.downloadUrl("v0.1.0-preview.3", "Private-Brain-Pro.apk", true));
        assertEquals(expected + "Private-Brain-Pro-0.1.0-preview.3.apk", UpdatePolicy.downloadUrl("v0.1.0-preview.3", "Private-Brain-Pro-0.1.0-preview.3.apk", true));
        assertEquals("https://github.com/lausiklauskn-png/Privat-Brain-Pro/releases/download/v1.0.36/Private-Brain-Pro-1.0.36.apk",
            UpdatePolicy.downloadUrl("v1.0.36", "Private-Brain-Pro-1.0.36.apk", true));
        for (String name : new String[] {"../Private-Brain-Pro.apk", "https://example.com/app.apk", "other.apk", "Private-Brain-Pro-0.1.0-preview.2.apk"}) {
            try {
                UpdatePolicy.downloadUrl("v0.1.0-preview.3", name, true);
                fail("Unexpected file accepted: " + name);
            } catch (IllegalArgumentException expectedError) { }
        }
    }
}

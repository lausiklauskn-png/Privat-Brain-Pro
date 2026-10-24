#!/usr/bin/env python3
"""Reject missing, skipped or failed Android smoke tests before release."""
from pathlib import Path
import sys
import xml.etree.ElementTree as ET

report_root = Path(sys.argv[1] if len(sys.argv) > 1 else
                   'android/app/build/outputs/androidTest-results/connected')
reports = list(report_root.rglob('TEST-*.xml'))
if not reports:
    raise SystemExit('Android smoke result missing: no current JUnit XML reports')
cases = []
for path in reports:
    suite = ET.parse(path).getroot()
    if any(node.tag in ('failure', 'error', 'skipped') for node in suite.iter()):
        raise SystemExit('Android smoke test failed or was skipped')
    for node in suite.iter('testsuite'):
        if any(int(node.get(key, '0')) for key in ('failures', 'errors', 'skipped')):
            raise SystemExit('Android JUnit suite reports a failure or skipped test')
    cases.extend(suite.iter('testcase'))
expected = [case for case in cases
            if case.get('classname') == 'de.familyprojekt.privatebrain.pro.NativeStartupTest'
            and case.get('name') == 'bundledSearchAndNativeBridgeWork']
if len(expected) != 1:
    raise SystemExit('Expected exactly one executed native startup test')
navigation = [case for case in cases
              if case.get('classname') == 'de.familyprojekt.privatebrain.pro.NativeStartupTest'
              and case.get('name') == 'fileViewerAndTwelveAndroidBackStepsKeepAppAlive']
if len(navigation) != 1:
    raise SystemExit('Expected exactly one executed native file/back-navigation test')
rotation = [case for case in cases
            if case.get('classname') == 'de.familyprojekt.privatebrain.pro.NativeStartupTest'
            and case.get('name') == 'portraitAndLandscapeKeepTheSameWebViewAndSearch']
if len(rotation) != 1:
    raise SystemExit('Expected exactly one executed adaptive orientation test')
for name in ('mailLinkGestureOpensExternalBrowserWithoutLeavingMail', 'googleChoiceUsesConsentAndHidesPasswordFields', 'googleAccountPickerCancellationCanRetryWithoutChangingAccounts', 'providerChoicesClearPasswordsUseFixedServersAndKeepMicrosoftOutOfPasswordLogin', 'pdfPagesAndAndroidBackUseRealNativeBridge', 'nativeFolderChooserCanBeCancelledAndRetriedWithHiddenExplanation', 'recoveryKeysRequireACompletedDocumentSaveAndCanRecoverTheVault'):
    matching=[case for case in cases if case.get('classname')=='de.familyprojekt.privatebrain.pro.NativeStartupTest' and case.get('name')==name]
    if len(matching)!=1:raise SystemExit(f'Expected exactly one executed native link/OAuth form test: {name}')
for name in ('originalsSurviveStoreReopeningAndProviderSharesExactBytes', 'incompleteOrWrongHashImportsNeverPublishAndAbortKeepsCompleteCopies', 'browserPolicyRejectsActiveLocalAndCredentialUrls', 'gmailAddsNoPasswordAndOldAccountFormatStillLoads', 'googleGrantReuseExpiresAndInvalidationKeepsOtherAccountsIsolated'):
    matching=[case for case in cases if case.get('classname')=='de.familyprojekt.privatebrain.pro.NativeOriginalsTest' and case.get('name')==name]
    if len(matching)!=1:raise SystemExit(f'Expected exactly one executed native originals/OAuth test: {name}')
for name in ('scannedPdfRendersBothPagesWithoutChangingOriginal', 'openAndShareOfferReadOnlyPdfWithOriginalNameAndBytes'):
    matching=[case for case in cases if case.get('classname')=='de.familyprojekt.privatebrain.pro.NativePdfTest' and case.get('name')==name]
    if len(matching)!=1:raise SystemExit(f'Expected exactly one executed native PDF test: {name}')
for name in ('silentGoogleCancellationRequiresConsentWithoutPretendingUserCancelledSetup', 'validGoogleGrantWithoutLegacyAccountUsesNativeVerifiedIdentity', 'incompleteGrantAndDifferentAccountNeverBecomeUsableCredentials', 'identityLookupUsesOnlyFixedHttpsAndRejectsRedirectsUnverifiedAndOversizedReplies'):
    matching=[case for case in cases if case.get('classname')=='de.familyprojekt.privatebrain.pro.NativeGmailGrantTest' and case.get('name')==name]
    if len(matching)!=1:raise SystemExit(f'Expected exactly one executed native Google grant test: {name}')
for name in ('allSevenTemplatesSurviveEncryptedReopeningWithoutChangingExistingAccountsOrDrafts', 'fixedProviderServersCannotBeRedirectedAndMicrosoftNeverFallsBackToPassword'):
    matching=[case for case in cases if case.get('classname')=='de.familyprojekt.privatebrain.pro.NativeProviderTest' and case.get('name')==name]
    if len(matching)!=1:raise SystemExit(f'Expected exactly one executed native provider test: {name}')
for name in ('offlineClosesExistingMailSocketAndBlocksNewTransportBeforeConnect', 'offlineKeepsAccountsAndDraftsAndDoesNotResendInterruptedSubmission', 'nativeSwitchSurvivesRestartKeepsLocalAssetsAndCanBeEnabledAgain'):
    matching=[case for case in cases if case.get('classname')=='de.familyprojekt.privatebrain.pro.NativeNetworkTest' and case.get('name')==name]
    if len(matching)!=1:raise SystemExit(f'Expected exactly one executed app-only network test: {name}')
for name in ('changingSourceAndLibraryKeepsOriginalsAndCopiesAfterRestart', 'lostDestinationDoesNotOverwriteExistingFilesOrRemoveOriginal'):
    matching=[case for case in cases if case.get('classname')=='de.familyprojekt.privatebrain.pro.NativeFoldersTest' and case.get('name')==name]
    if len(matching)!=1:raise SystemExit(f'Expected exactly one executed native folder test: {name}')
for name in ('passwordFolderRestoresOnNewDeviceAndRejectsWrongPassword', 'largeAttachmentStreamsIntoFolderAndClearingMarksMailDeleted', 'damagedNewestCatalogFallsBackToThePreviousBackup'):
    matching=[case for case in cases if case.get('classname')=='de.familyprojekt.privatebrain.pro.NativeVaultTest' and case.get('name')==name]
    if len(matching)!=1:raise SystemExit(f'Expected exactly one executed native vault test: {name}')
for name in ('listsAreFetchedWithTheKeyAndStoredOnlyInTheChosenFolder', 'linkListsNameExactAddressesAndServers', 'automaticUpdatesRespectSwitchScheduleWifiAndRetry', 'lockedFolderAndDamagedListAreNeverTakenAsEmpty', 'virusTotalReceivesOnlyTheFingerprint'):
    matching=[case for case in cases if case.get('classname')=='de.familyprojekt.privatebrain.pro.NativeProtectTest' and case.get('name')==name]
    if len(matching)!=1:raise SystemExit(f'Expected exactly one executed native protection test: {name}')
mail_tests = {
    'gmailXoauth2AuthenticatesImapAndSmtpWithoutPasswordFallback',
    'gmailReauthorizationPreservesExistingAccountsAndDrafts',
    'vaultEncryptsAndTamperingCannotResetAccounts',
    'lostKeystoreKeyDoesNotCreateReplacementData',
    'mimeRoundTripPreservesBinaryAndRejectsHeaderInjection',
    'originalHtmlAndCidSurviveMimeParsing',
    'defaultTrustRejectsUntrustedTlsBeforeAuthentication',
    'trustedTestCertificateStillRequiresMatchingHostname',
    'imapLibraryAuthenticatesOverVerifiedTls',
    'confirmedSmtpSendIsNotRepeatedAfterReopeningVault',
    'connectionLossAfterDataDoesNotResend',
}
for name in mail_tests:
    matching = [case for case in cases
                if case.get('classname') == 'de.familyprojekt.privatebrain.pro.NativeMailTest'
                and case.get('name') == name]
    if len(matching) != 1:
        raise SystemExit(f'Expected exactly one executed native mail test: {name}')
semantic=[case for case in cases if case.get('classname')=='de.familyprojekt.privatebrain.pro.NativeSemanticTest' and case.get('name')=='modelLoadedWithTheSwitchRunsOfflineFromAppStorage']
if len(semantic)!=1:raise SystemExit('Expected exactly one executed meaning-model test (download with the switch, offline start)')
for name in ('selectedPublicModelTranslatesBelowOriginalWithoutNetworkOrAiKey', 'staleCompletionAndDownloadCannotClearTheInferenceCrashGuard'):
    matching=[case for case in cases if case.get('classname')=='de.familyprojekt.privatebrain.pro.NativeTranslationTest' and case.get('name')==name]
    if len(matching)!=1:raise SystemExit(f'Expected exactly one executed native local translation test: {name}')
ocr=[case for case in cases if case.get('classname')=='de.familyprojekt.privatebrain.pro.NativeOcrTest' and case.get('name')=='bundledWasmReadsMultilingualPixelsAndScannedPdfWithBothNetworkGatesBlocked']
if len(ocr)!=1:raise SystemExit('Expected exactly one executed native offline OCR test (real WASM, four languages, scanned PDF and search)')
handoff=[case for case in cases if case.get('classname')=='de.familyprojekt.privatebrain.pro.NativeFileHandoffTest' and case.get('name')=='shareBypassesBusyPdfQueueAndStillRejectsChangedOriginalBytes']
if len(handoff)!=1:raise SystemExit('Expected exactly one executed independent share-queue and original-integrity test')
launcher=[case for case in cases if case.get('classname')=='de.familyprojekt.privatebrain.pro.NativeToolLauncherTest' and case.get('name')=='onlyKnownProToolCanBeRequestedAndMissingAppKeepsBrainOpen']
if len(launcher)!=1:raise SystemExit('Expected exactly one executed allowlisted companion-app launcher test (real bridge, missing app and rejected package/intent input)')
for name in ('physicalCleanupKeepsVerifiedCopyAndRejectsChangedBytes', 'unknownStaleLastCopyAndLostPermissionNeverDelete', 'partialFailureCancellationAndBoundsRemainHonestWithRealChooser'):
    matching=[case for case in cases if case.get('classname')=='de.familyprojekt.privatebrain.pro.NativeDuplicateCleanupTest' and case.get('name')==name]
    if len(matching)!=1:raise SystemExit(f'Expected exactly one executed physical SAF duplicate-cleanup test: {name}')
print(f'Android startup and mail tests passed; {len(cases)} test case(s), no failures/skips.')

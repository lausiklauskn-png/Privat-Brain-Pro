// CI-only launcher for the unchanged production installers. WebView2 >= 150
// ignores its browser-argument environment override in an elevated host.
// Use a verified Medium token of this account; never change the app or its profile.
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Runtime.InteropServices;
using System.Security.Principal;
using System.Security.AccessControl;
using System.Text;

public sealed class UpgradeProbeLaunchResult
{
    public Process Process { get; private set; }
    public int ProcessId { get; private set; }
    public int CurrentIntegrityRid { get; private set; }
    public int CurrentElevationType { get; private set; }
    public bool CurrentElevated { get; private set; }
    public int TargetIntegrityRid { get; private set; }
    public int TargetElevationType { get; private set; }
    public bool TargetElevated { get; private set; }
    public bool SameUserSid { get; private set; }

    internal UpgradeProbeLaunchResult(Process process, int currentRid, int currentType,
        bool currentElevated, int targetRid, int targetType, bool targetElevated)
    {
        Process = process;
        ProcessId = process.Id;
        CurrentIntegrityRid = currentRid;
        CurrentElevationType = currentType;
        CurrentElevated = currentElevated;
        TargetIntegrityRid = targetRid;
        TargetElevationType = targetType;
        TargetElevated = targetElevated;
        SameUserSid = true;
    }
}

public static class UpgradeProbeLauncher
{
    private const string BrowserArguments = "--remote-debugging-port=9224 --remote-debugging-address=127.0.0.1";
    private const int MediumRid = 8192;
    private const int HighRid = 12288;
    private const int FullElevation = 2;
    private const int DefaultElevation = 1;
    private const uint TokenAssignPrimary = 0x0001;
    private const uint TokenDuplicate = 0x0002;
    private const uint TokenQuery = 0x0008;
    private const uint TokenAdjustDefault = 0x0080;
    private const uint DisableMaxPrivilege = 0x0001;
    private const uint LuaToken = 0x0004;
    private const uint CreateSuspended = 0x00000004;
    private const uint CreateUnicodeEnvironment = 0x00000400;
    private const uint ExtendedStartupInfoPresent = 0x00080000;
    private const uint LogonWithProfile = 0x00000001;
    private const uint InvalidResume = 0xffffffff;

    private sealed class TokenEvidence
    {
        internal string Sid;
        internal int Rid;
        internal int ElevationType;
        internal bool Elevated;
        internal int Session;
        internal int Type;
        internal bool AdminMember;
        internal bool AdminDenyOnly;
        internal int OtherPrivileges;
        internal int EnabledOtherPrivileges;
    }

    private sealed class DesktopContext { internal string Station, Name; internal string FullName { get { return Station + "\\" + Name; } } }

    // Run immediately after Add-Type, before building or installing the app.
    // Exercise the same token queries/selection as Start without creating a process.
    public static void Preflight()
    {
        RequireRunner();
        IntPtr currentToken = IntPtr.Zero;
        IntPtr ownedSourceToken = IntPtr.Zero;
        try
        {
            AssertNoThreadToken("preflight-caller");
            if (!OpenProcessToken(GetCurrentProcess(), TokenQuery | TokenDuplicate | TokenAssignPrimary | TokenAdjustDefault, out currentToken))
                throw Win32Failure("OPEN_CURRENT_TOKEN");
            TokenEvidence current = ReadToken(currentToken);
            WriteParentEvidence(current);
            WriteCallerPrivileges(currentToken);
            DesktopContext desktop = WriteDesktopEvidence(current.Session);
            IntPtr sourceToken = MediumSourceToken(currentToken, current, out ownedSourceToken);
            TokenEvidence source = ReadToken(sourceToken);
            ProbeDesktopAccess(sourceToken, desktop);
            ProbeDefaultCreatorAccess(sourceToken);
            Console.WriteLine("WINDOWS_UPGRADE_TOKEN_PREFLIGHT {\"targetIntegrityRid\":"
                + source.Rid.ToString(CultureInfo.InvariantCulture)
                + ",\"targetElevationType\":" + source.ElevationType.ToString(CultureInfo.InvariantCulture)
                + ",\"targetElevated\":" + (source.Elevated ? "true" : "false")
                + ",\"adminMember\":" + (source.AdminMember ? "true" : "false")
                + ",\"adminDenyOnly\":" + (source.AdminDenyOnly ? "true" : "false")
                + ",\"otherPrivileges\":" + source.OtherPrivileges.ToString(CultureInfo.InvariantCulture)
                + ",\"sameUserSid\":true}");
        }
        finally { Close(ownedSourceToken); Close(currentToken); }
    }

    public static UpgradeProbeLaunchResult Start(string exe, string cwd,
        string expectedLocalAppData, string expectedUserProfile, string requestedArgs, string captureDirectory)
    {
        RequireRunner();
        Require(String.Equals(requestedArgs, BrowserArguments, StringComparison.Ordinal), "EXACT_LOOPBACK_ARGUMENTS_REQUIRED");
        Require(Environment.GetEnvironmentVariable("WEBVIEW2_USER_DATA_FOLDER") == null
            && Environment.GetEnvironmentVariable("WEBVIEW2_BROWSER_EXECUTABLE_FOLDER") == null, "PROFILE_OR_RUNTIME_OVERRIDE_DENIED");

        exe = FullPath(exe);
        cwd = FullPath(cwd);
        Require(File.Exists(exe) && Directory.Exists(cwd), "EXACT_EXECUTABLE_AND_WORKING_DIRECTORY_REQUIRED");
        Require(SamePath(cwd, Path.GetDirectoryName(exe)), "INSTALLED_APP_WORKING_DIRECTORY_REQUIRED");
        captureDirectory = FullPath(captureDirectory);
        string runnerTemp = FullPath(Environment.GetEnvironmentVariable("RUNNER_TEMP")).TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;
        Require(captureDirectory.StartsWith(runnerTemp, StringComparison.OrdinalIgnoreCase)
            && Directory.Exists(captureDirectory)
            && (File.GetAttributes(captureDirectory) & FileAttributes.ReparsePoint) == 0, "FRESH_RUNNER_CAPTURE_DIRECTORY_REQUIRED");
        Require(SamePath(Environment.GetEnvironmentVariable("LOCALAPPDATA"), expectedLocalAppData)
            && SamePath(Environment.GetEnvironmentVariable("USERPROFILE"), expectedUserProfile), "PARENT_PROFILE_PATH_MISMATCH");

        IntPtr currentToken = IntPtr.Zero;
        IntPtr ownedSourceToken = IntPtr.Zero;
        IntPtr primaryToken = IntPtr.Zero;
        IntPtr targetToken = IntPtr.Zero;
        IntPtr nativeEnvironment = IntPtr.Zero;
        IntPtr launchEnvironment = IntPtr.Zero;
        IntPtr desktopName = IntPtr.Zero;
        IntPtr stdin = IntPtr.Zero, stdout = IntPtr.Zero, stderr = IntPtr.Zero;
        IntPtr attributes = IntPtr.Zero, handleList = IntPtr.Zero, security = IntPtr.Zero;
        bool attributesInitialized = false;
        int launchEnvironmentChars = 0;
        Process managedProcess = null;
        ProcessInformation child = new ProcessInformation();
        bool resumed = false;
        try
        {
            AssertNoThreadToken("launch-caller");
            if (!OpenProcessToken(GetCurrentProcess(), TokenQuery | TokenDuplicate | TokenAssignPrimary | TokenAdjustDefault, out currentToken))
                throw Win32Failure("OPEN_CURRENT_TOKEN");
            TokenEvidence current = ReadToken(currentToken);
            // Preserve the parent evidence even when the linked-token query fails.
            WriteParentEvidence(current);
            WriteCallerPrivileges(currentToken);
            DesktopContext desktop = WriteDesktopEvidence(current.Session);
            IntPtr sourceToken = MediumSourceToken(currentToken, current, out ownedSourceToken);
            bool duplicated = IsDefaultHigh(current)
                ? DuplicateHandle(GetCurrentProcess(), sourceToken, GetCurrentProcess(), out primaryToken,
                    TokenQuery | TokenDuplicate | TokenAssignPrimary, false, 0)
                : DuplicateTokenEx(sourceToken, TokenQuery | TokenDuplicate | TokenAssignPrimary,
                    IntPtr.Zero, 2, 1, out primaryToken);
            if (!duplicated)
                throw Win32Failure("DUPLICATE_MEDIUM_PRIMARY_TOKEN");
            TokenEvidence primary = ReadToken(primaryToken);
            Require(primary.Sid == current.Sid && primary.Session == current.Session
                && primary.Type == 1 && primary.Rid == MediumRid && !primary.Elevated, "DUPLICATED_TOKEN_MISMATCH");
            RequireNoAdminAuthority(primary, IsDefaultHigh(current));

            // Do not inherit the elevated runner's environment or test switches.
            if (!CreateEnvironmentBlock(out nativeEnvironment, primaryToken, false))
                throw Win32Failure("CREATE_SAME_USER_ENVIRONMENT");
            SortedDictionary<string, string> variables = ReadEnvironment(nativeEnvironment);
            Require(!variables.ContainsKey("WEBVIEW2_USER_DATA_FOLDER")
                && !variables.ContainsKey("WEBVIEW2_BROWSER_EXECUTABLE_FOLDER"), "USER_PROFILE_OR_RUNTIME_OVERRIDE_DENIED");
            Require(variables.ContainsKey("LOCALAPPDATA") && variables.ContainsKey("USERPROFILE")
                && SamePath(variables["LOCALAPPDATA"], expectedLocalAppData)
                && SamePath(variables["USERPROFILE"], expectedUserProfile), "SAME_USER_ENVIRONMENT_PROFILE_MISMATCH");
            variables["WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS"] = BrowserArguments;
            variables["RUST_BACKTRACE"] = "1";
            StringBuilder environment = new StringBuilder();
            foreach (KeyValuePair<string, string> variable in variables)
                environment.Append(variable.Key).Append('=').Append(variable.Value).Append('\0');
            environment.Append('\0');
            launchEnvironmentChars = environment.Length + 1;
            launchEnvironment = Marshal.StringToHGlobalUni(environment.ToString());
            environment.Clear();
            variables.Clear();

            StartupInformation startup = new StartupInformation();
            startup.cb = Marshal.SizeOf(typeof(StartupInformation));
            // Bind to the measured, existing caller context after verifying
            // target access. Do not create a desktop or modify any ACL.
            ProbeTargetAccess(primaryToken, current.Sid, exe, cwd, expectedLocalAppData, expectedUserProfile, desktop);
            desktopName = Marshal.StringToHGlobalUni(desktop.FullName);
            startup.lpDesktop = desktopName;
            StringBuilder command = new StringBuilder("\"" + exe + "\"");
            if (IsDefaultHigh(current))
            {
                // Microsoft's documented path for a restricted copy of our
                // own primary token. The same user's profile is already loaded.
                Console.WriteLine("WINDOWS_UPGRADE_PROCESS_API CreateProcessAsUserW-own-restricted");
                SecurityAttributes sa = new SecurityAttributes { Length = Marshal.SizeOf(typeof(SecurityAttributes)), Inherit = 1 };
                security = Marshal.AllocHGlobal(sa.Length);
                Marshal.StructureToPtr(sa, security, false);
                stdin = CreateFile("NUL", 0x80000000, 3, security, 3, 0x80, IntPtr.Zero);
                RequireValidFileHandle(stdin, "OPEN_CAPTURE_STDIN");
                stdout = CreateFile(Path.Combine(captureDirectory, "stdout.txt"), 0x40000000, 1, security, 1, 0x80, IntPtr.Zero);
                RequireValidFileHandle(stdout, "CREATE_NATIVE_STDOUT");
                stderr = CreateFile(Path.Combine(captureDirectory, "stderr.txt"), 0x40000000, 1, security, 1, 0x80, IntPtr.Zero);
                RequireValidFileHandle(stderr, "CREATE_NATIVE_STDERR");
                IntPtr bytes = IntPtr.Zero;
                bool sized = InitializeProcThreadAttributeList(IntPtr.Zero, 1, 0, ref bytes);
                int sizeError = Marshal.GetLastWin32Error();
                Require(!sized && sizeError == 122 && bytes.ToInt64() > 0 && bytes.ToInt64() <= 65536, "HANDLE_ATTRIBUTE_SIZE_QUERY_FAILED");
                attributes = Marshal.AllocHGlobal(bytes);
                if (!InitializeProcThreadAttributeList(attributes, 1, 0, ref bytes)) throw Win32Failure("INITIALIZE_HANDLE_ATTRIBUTE_LIST");
                attributesInitialized = true;
                handleList = Marshal.AllocHGlobal(IntPtr.Size * 3);
                Marshal.WriteIntPtr(handleList, 0, stdin);
                Marshal.WriteIntPtr(handleList, IntPtr.Size, stdout);
                Marshal.WriteIntPtr(handleList, IntPtr.Size * 2, stderr);
                if (!UpdateProcThreadAttribute(attributes, 0, new IntPtr(0x20002), handleList,
                    new IntPtr(IntPtr.Size * 3), IntPtr.Zero, IntPtr.Zero)) throw Win32Failure("SET_EXACT_STD_HANDLE_LIST");
                StartupInformationEx extended = new StartupInformationEx();
                extended.Startup = startup;
                extended.Startup.cb = Marshal.SizeOf(typeof(StartupInformationEx));
                extended.Startup.dwFlags = 0x100; // STARTF_USESTDHANDLES.
                extended.Startup.hStdInput = stdin;
                extended.Startup.hStdOutput = stdout;
                extended.Startup.hStdError = stderr;
                extended.Attributes = attributes;
                Console.WriteLine("WINDOWS_UPGRADE_NATIVE_CAPTURE {\"handles\":3,\"explicitHandleList\":true,\"rustBacktrace\":true}");
                if (!CreateProcessAsUserW(primaryToken, exe, command, IntPtr.Zero, IntPtr.Zero, true,
                    CreateSuspended | CreateUnicodeEnvironment | ExtendedStartupInfoPresent, launchEnvironment, cwd, ref extended, out child))
                    throw Win32Failure("CREATE_AS_USER_SUSPENDED_PRODUCTION_PROCESS");
            }
            else if (!CreateProcessWithTokenW(primaryToken, LogonWithProfile, exe, command,
                CreateSuspended | CreateUnicodeEnvironment, launchEnvironment, cwd, ref startup, out child))
                throw Win32Failure("CREATE_WITH_TOKEN_SUSPENDED_PRODUCTION_PROCESS");
            // Check the actual created process, not merely the token we supplied.
            if (!OpenProcessToken(child.hProcess, TokenQuery, out targetToken))
                throw Win32Failure("OPEN_CREATED_PROCESS_TOKEN");
            TokenEvidence target = ReadToken(targetToken);
            Require(target.Sid == current.Sid && target.Session == current.Session
                && target.Type == 1 && target.Rid == MediumRid && !target.Elevated, "CREATED_PROCESS_TOKEN_MISMATCH");
            RequireNoAdminAuthority(target, IsDefaultHigh(current));
            Console.WriteLine("WINDOWS_UPGRADE_ACTUAL_CHILD_TOKEN {\"integrityRid\":8192,\"elevated\":false,\"adminMember\":false,\"adminDenyOnly\":"
                + (target.AdminDenyOnly ? "true" : "false") + ",\"otherPrivileges\":"
                + target.OtherPrivileges.ToString(CultureInfo.InvariantCulture) + ",\"sameUserSid\":true}");
            Require(child.dwProcessId <= Int32.MaxValue, "PROCESS_ID_OUT_OF_RANGE");
            managedProcess = Process.GetProcessById((int)child.dwProcessId);
            Require(managedProcess.Handle != IntPtr.Zero, "RETAIN_CREATED_PROCESS_HANDLE");
            uint priorSuspendCount = ResumeThread(child.hThread);
            if (priorSuspendCount == InvalidResume) throw Win32Failure("RESUME_VALIDATED_PRODUCTION_PROCESS");
            Require(priorSuspendCount == 1, "UNEXPECTED_PRIMARY_THREAD_SUSPEND_COUNT");
            UpgradeProbeLaunchResult result = new UpgradeProbeLaunchResult(managedProcess,
                current.Rid, current.ElevationType, current.Elevated,
                target.Rid, target.ElevationType, target.Elevated);
            resumed = true;
            return result;
        }
        finally
        {
            if (!resumed && child.hProcess != IntPtr.Zero)
            {
                // Only ever terminate the exact process created by this call.
                TerminateProcess(child.hProcess, 1);
                WaitForSingleObject(child.hProcess, 5000);
            }
            if (!resumed && managedProcess != null) managedProcess.Dispose();
            Close(targetToken);
            Close(child.hThread);
            Close(child.hProcess);
            if (desktopName != IntPtr.Zero) Marshal.FreeHGlobal(desktopName);
            if (attributesInitialized) DeleteProcThreadAttributeList(attributes);
            if (handleList != IntPtr.Zero) Marshal.FreeHGlobal(handleList);
            if (attributes != IntPtr.Zero) Marshal.FreeHGlobal(attributes);
            if (security != IntPtr.Zero) Marshal.FreeHGlobal(security);
            CloseFile(stdin); CloseFile(stdout); CloseFile(stderr);
            if (launchEnvironment != IntPtr.Zero)
            {
                for (int i = 0; i < launchEnvironmentChars; i++) Marshal.WriteInt16(launchEnvironment, i * 2, 0);
                Marshal.FreeHGlobal(launchEnvironment);
            }
            if (nativeEnvironment != IntPtr.Zero) DestroyEnvironmentBlock(nativeEnvironment);
            Close(primaryToken);
            Close(ownedSourceToken);
            Close(currentToken);
        }
    }

    private static void RequireRunner()
    {
        Require(String.Equals(Environment.GetEnvironmentVariable("GITHUB_ACTIONS"), "true", StringComparison.Ordinal)
            && String.Equals(Environment.GetEnvironmentVariable("RUNNER_OS"), "Windows", StringComparison.Ordinal), "ISOLATED_WINDOWS_CI_REQUIRED");
        Require(Environment.OSVersion.Platform == PlatformID.Win32NT, "WINDOWS_REQUIRED");
    }

    private static void WriteParentEvidence(TokenEvidence current)
    {
        Console.WriteLine("WINDOWS_UPGRADE_PARENT_TOKEN {\"currentIntegrityRid\":"
            + current.Rid.ToString(CultureInfo.InvariantCulture)
            + ",\"currentElevationType\":" + current.ElevationType.ToString(CultureInfo.InvariantCulture)
            + ",\"currentElevated\":" + (current.Elevated ? "true" : "false") + "}");
    }

    private static IntPtr MediumSourceToken(IntPtr currentToken, TokenEvidence current, out IntPtr ownedSourceToken)
    {
        Require(current.Type == 1, "CALLER_PROCESS_PRIMARY_TOKEN_REQUIRED");
        ownedSourceToken = IntPtr.Zero;
        IntPtr sourceToken = currentToken;
        if (current.Rid != MediumRid || current.Elevated)
        {
            if (IsDefaultHigh(current))
            {
                // This exact runner state was measured in the early preflight.
                // Only reduce its authority; never manufacture another user/profile.
                ownedSourceToken = RestrictedMediumToken(currentToken, current);
            }
            else
            {
                Require(current.Rid == HighRid && current.Elevated && current.ElevationType == FullElevation,
                    "FULL_HIGH_DEFAULT_HIGH_OR_MEDIUM_TOKEN_REQUIRED");
                ownedSourceToken = LinkedToken(currentToken);
            }
            sourceToken = ownedSourceToken;
        }
        TokenEvidence source = ReadToken(sourceToken);
        Require(source.Sid == current.Sid && source.Session == current.Session,
            "LINKED_TOKEN_USER_OR_SESSION_MISMATCH");
        Require(source.Type == 1 && source.Rid == MediumRid && !source.Elevated, "EXACT_MEDIUM_UNELEVATED_TOKEN_REQUIRED");
        RequireNoAdminAuthority(source, IsDefaultHigh(current));
        return sourceToken;
    }

    private static bool IsDefaultHigh(TokenEvidence current)
    {
        return current.Rid == HighRid && current.Elevated && current.ElevationType == DefaultElevation;
    }

    private static DesktopContext WriteDesktopEvidence(int session)
    {
        string station = UserObjectName(GetProcessWindowStation());
        string desktop = UserObjectName(GetThreadDesktop(GetCurrentThreadId()));
        Console.WriteLine("WINDOWS_UPGRADE_DESKTOP {\"session\":" + session.ToString(CultureInfo.InvariantCulture)
            + ",\"station\":\"" + JsonEscape(station) + "\",\"desktop\":\"" + JsonEscape(desktop) + "\",\"explicitMeasuredContext\":true}");
        Require(station.Length > 0 && desktop.Length > 0 && !station.Contains("\\") && !desktop.Contains("\\"), "MEASURED_DESKTOP_NAME_REQUIRED");
        return new DesktopContext { Station = station, Name = desktop };
    }

    private static string UserObjectName(IntPtr handle)
    {
        if (handle == IntPtr.Zero) throw Win32Failure("GET_PARENT_DESKTOP_CONTEXT");
        uint length;
        GetUserObjectInformation(handle, 2, null, 0, out length);
        Require(length >= 2 && length <= 4096, "PARENT_DESKTOP_NAME_BOUNDS");
        StringBuilder name = new StringBuilder((int)(length / 2));
        if (!GetUserObjectInformation(handle, 2, name, length, out length)) throw Win32Failure("READ_PARENT_DESKTOP_NAME");
        return name.ToString();
    }

    private static string JsonEscape(string value) { return value.Replace("\\", "\\\\").Replace("\"", "\\\""); }

    private static void ProbeTargetAccess(IntPtr token, string expectedSid, string exe, string cwd,
        string localAppData, string userProfile, DesktopContext desktop)
    {
        if (!ImpersonateLoggedOnUser(token)) throw Win32Failure("IMPERSONATE_SAME_USER_ACCESS_PROBE");
        bool allowed = false;
        try
        {
            bool executable = ReadAccess("installed-executable", exe, false);
            bool directory = ReadAccess("installed-working-directory", cwd, true);
            bool data = ReadAccess("default-local-app-data", localAppData, true);
            bool profile = ReadAccess("default-user-profile", userProfile, true);
            bool desktopAllowed = ReadDesktopAccess(desktop);
            bool hive;
            using (Microsoft.Win32.RegistryKey key = Microsoft.Win32.Registry.Users.OpenSubKey(expectedSid, false))
                hive = key != null;
            Console.WriteLine("WINDOWS_UPGRADE_TARGET_ACCESS {\"label\":\"same-user-loaded-profile-hive\",\"allowed\":" + (hive ? "true" : "false") + "}");
            allowed = executable && directory && data && profile && hive && desktopAllowed;
        }
        finally
        {
            // Never run the launcher or continue the PowerShell host while
            // accidentally retaining a thread impersonation context.
            if (!RevertToSelf()) Environment.FailFast("UPGRADE_LAUNCH_REVERT_ACCESS_PROBE_FAILED");
        }
        AssertNoThreadToken("after-access-revert");
        Require(allowed, "TARGET_ACCESS_OR_LOADED_PROFILE_DENIED");
    }

    private static void ProbeDesktopAccess(IntPtr token, DesktopContext desktop)
    {
        if (!ImpersonateLoggedOnUser(token)) throw Win32Failure("IMPERSONATE_DESKTOP_ACCESS_PROBE");
        bool allowed;
        try { allowed = ReadDesktopAccess(desktop); }
        finally { if (!RevertToSelf()) Environment.FailFast("UPGRADE_LAUNCH_REVERT_DESKTOP_PROBE_FAILED"); }
        AssertNoThreadToken("after-desktop-revert");
        Require(allowed, "TARGET_MEASURED_DESKTOP_ACCESS_DENIED");
    }

    private static bool ReadDesktopAccess(DesktopContext desktop)
    {
        IntPtr station = IntPtr.Zero, target = IntPtr.Zero;
        try
        {
            Require(UserObjectName(GetProcessWindowStation()) == desktop.Station, "CALLER_WINDOW_STATION_CHANGED");
            station = OpenWindowStation(desktop.Station, false, 0x37F);
            int stationError = station == IntPtr.Zero ? Marshal.GetLastWin32Error() : 0;
            target = OpenDesktop(desktop.Name, 0, false, 0x1FF);
            int desktopError = target == IntPtr.Zero ? Marshal.GetLastWin32Error() : 0;
            bool allowed = station != IntPtr.Zero && target != IntPtr.Zero;
            Console.WriteLine("WINDOWS_UPGRADE_DESKTOP_ACCESS {\"allowed\":" + (allowed ? "true" : "false")
                + ",\"stationAccessMask\":\"0x37F\",\"desktopAccessMask\":\"0x1FF\""
                + ",\"stationWin32\":" + stationError.ToString(CultureInfo.InvariantCulture)
                + ",\"desktopWin32\":" + desktopError.ToString(CultureInfo.InvariantCulture) + "}");
            return allowed;
        }
        finally
        {
            if (target != IntPtr.Zero) CloseDesktop(target);
            if (station != IntPtr.Zero) CloseWindowStation(station);
        }
    }

    private static void ProbeDefaultCreatorAccess(IntPtr token)
    {
        if (!ImpersonateLoggedOnUser(token)) throw Win32Failure("IMPERSONATE_CREATOR_ACCESS_PROBE");
        IntPtr read, write;
        bool created = false;
        try
        {
            created = CreatePipe(out read, out write, IntPtr.Zero, 0);
            int error = created ? 0 : Marshal.GetLastWin32Error();
            try
            {
                Console.WriteLine("WINDOWS_UPGRADE_DEFAULT_PIPE_ACCESS {\"success\":" + (created ? "true" : "false")
                    + ",\"win32\":" + error.ToString(CultureInfo.InvariantCulture) + "}");
                Require(created, "TARGET_DEFAULT_PIPE_CREATION_DENIED");
            }
            finally { if (created) { Close(read); Close(write); } }
        }
        finally { if (!RevertToSelf()) Environment.FailFast("UPGRADE_LAUNCH_REVERT_CREATOR_PROBE_FAILED"); }
        AssertNoThreadToken("after-creator-revert");
    }

    private static bool ReadAccess(string label, string path, bool directory)
    {
        IntPtr handle = CreateFile(path, directory ? 0xA0u : 0xA0000000u, 7, IntPtr.Zero, 3,
            directory ? 0x02000000u : 0x80u, IntPtr.Zero);
        bool allowed = handle != new IntPtr(-1);
        int error = allowed ? 0 : Marshal.GetLastWin32Error();
        if (allowed) Close(handle);
        Console.WriteLine("WINDOWS_UPGRADE_TARGET_ACCESS {\"label\":\"" + label + "\",\"allowed\":"
            + (allowed ? "true" : "false") + ",\"win32\":" + error.ToString(CultureInfo.InvariantCulture) + "}");
        return allowed;
    }

    private static void RequireNoAdminAuthority(TokenEvidence value, bool reduced)
    {
        Require(!value.AdminMember && value.EnabledOtherPrivileges == 0, "ADMIN_AUTHORITY_NOT_REMOVED");
        if (reduced) Require(value.AdminDenyOnly && value.OtherPrivileges == 0, "RESTRICTED_TOKEN_AUTHORITY_MISMATCH");
    }

    private static IntPtr RestrictedMediumToken(IntPtr currentToken, TokenEvidence current)
    {
        byte[] originalDefaultAcl = ReadDefaultAcl(currentToken);
        IntPtr restricted = IntPtr.Zero, adminSid = IntPtr.Zero;
        IntPtr disabledGroup = IntPtr.Zero, label = IntPtr.Zero;
        bool returned = false;
        try
        {
            adminSid = SidBuffer("S-1-5-32-544");
            disabledGroup = Marshal.AllocHGlobal(Marshal.SizeOf(typeof(SidAndAttributes)));
            Marshal.StructureToPtr(new SidAndAttributes { Sid = adminSid, Attributes = 0 }, disabledGroup, false);
            // Neither SANDBOX_INERT nor any policy-bypassing flag is used.
            // Restrict the actual caller primary directly. Opening its handle
            // with adjustment rights does not modify that original token.
            if (!CreateRestrictedToken(currentToken, DisableMaxPrivilege | LuaToken, 1, disabledGroup,
                0, IntPtr.Zero, 0, IntPtr.Zero, out restricted)) throw Win32Failure("CREATE_REDUCED_SAME_USER_TOKEN");
            SecurityIdentifier mediumSid = new SecurityIdentifier("S-1-16-8192");
            byte[] sidBytes = new byte[mediumSid.BinaryLength];
            mediumSid.GetBinaryForm(sidBytes, 0);
            int structureSize = Marshal.SizeOf(typeof(SidAndAttributes));
            int labelSize = checked(structureSize + sidBytes.Length);
            label = Marshal.AllocHGlobal(labelSize);
            IntPtr sidInLabel = IntPtr.Add(label, structureSize);
            Marshal.Copy(sidBytes, 0, sidInLabel, sidBytes.Length);
            Marshal.StructureToPtr(new SidAndAttributes { Sid = sidInLabel, Attributes = 0x20 }, label, false);
            if (!SetTokenInformation(restricted, 25, label, labelSize)) throw Win32Failure("SET_REDUCED_MEDIUM_INTEGRITY");
            TokenEvidence reduced = ReadToken(restricted);
            Require(reduced.Sid == current.Sid && reduced.Session == current.Session && reduced.Type == 1
                && reduced.Rid == MediumRid && !reduced.Elevated, "DEFAULT_DACL_TARGET_IDENTITY_MISMATCH");
            RequireNoAdminAuthority(reduced, true);
            AddSameUserDefaultDacl(restricted, current.Sid);
            bool originalUnchanged = EqualBytes(originalDefaultAcl, ReadDefaultAcl(currentToken));
            Console.WriteLine("WINDOWS_UPGRADE_DEFAULT_DACL {\"sameUserCreatorAccess\":true,\"existingAcesPreserved\":true,\"originalTokenUnchanged\":"
                + (originalUnchanged ? "true" : "false") + "}");
            Require(originalUnchanged, "ORIGINAL_TOKEN_DEFAULT_DACL_CHANGED");
            Console.WriteLine("WINDOWS_UPGRADE_TOKEN_REDUCTION {\"flags\":5,\"sameUser\":true,\"requestedIntegrityRid\":8192}");
            returned = true;
            return restricted;
        }
        finally
        {
            if (label != IntPtr.Zero) Marshal.FreeHGlobal(label);
            if (disabledGroup != IntPtr.Zero) Marshal.FreeHGlobal(disabledGroup);
            if (adminSid != IntPtr.Zero) Marshal.FreeHGlobal(adminSid);
            if (!returned) Close(restricted);
        }
    }

    private static byte[] ReadDefaultAcl(IntPtr token)
    {
        int length;
        IntPtr information = TokenInformation(token, 6, out length);
        try
        {
            Require(length >= IntPtr.Size, "DEFAULT_DACL_HEADER_BOUNDS");
            IntPtr acl = Marshal.ReadIntPtr(information);
            Require(acl != IntPtr.Zero, "NON_NULL_DEFAULT_DACL_REQUIRED");
            long offset = acl.ToInt64() - information.ToInt64();
            Require(offset >= IntPtr.Size && offset + 8 <= length, "DEFAULT_DACL_POINTER_BOUNDS");
            int size = unchecked((ushort)Marshal.ReadInt16(acl, 2));
            Require(size >= 8 && size <= UInt16.MaxValue && offset + size <= length, "DEFAULT_DACL_BOUNDS");
            byte[] bytes = new byte[size];
            Marshal.Copy(acl, bytes, 0, size);
            return bytes;
        }
        finally { Marshal.FreeHGlobal(information); }
    }

    private static void AddSameUserDefaultDacl(IntPtr restricted, string validatedUserSid)
    {
        RawAcl previous = new RawAcl(ReadDefaultAcl(restricted), 0);
        Require(previous.Count < 4096, "DEFAULT_DACL_ACE_COUNT_BOUNDS");
        RawAcl changed = new RawAcl(previous.Revision, previous.Count + 1);
        for (int i = 0; i < previous.Count; i++) changed.InsertAce(changed.Count, previous[i]);
        changed.InsertAce(changed.Count, new CommonAce(AceFlags.None, AceQualifier.AccessAllowed,
            0x10000000, new SecurityIdentifier(validatedUserSid), false, null));
        Require(changed.BinaryLength <= UInt16.MaxValue, "NEW_DEFAULT_DACL_SIZE_BOUNDS");
        byte[] bytes = new byte[changed.BinaryLength];
        changed.GetBinaryForm(bytes, 0);
        IntPtr acl = IntPtr.Zero, header = IntPtr.Zero;
        try
        {
            acl = Marshal.AllocHGlobal(bytes.Length);
            Marshal.Copy(bytes, 0, acl, bytes.Length);
            header = Marshal.AllocHGlobal(IntPtr.Size);
            Marshal.WriteIntPtr(header, acl);
            if (!SetTokenInformation(restricted, 6, header, IntPtr.Size)) throw Win32Failure("SET_NEW_RESTRICTED_TOKEN_DEFAULT_DACL");
        }
        finally
        {
            if (header != IntPtr.Zero) Marshal.FreeHGlobal(header);
            if (acl != IntPtr.Zero) Marshal.FreeHGlobal(acl);
        }
        RawAcl actual = new RawAcl(ReadDefaultAcl(restricted), 0);
        Require(actual.Revision == previous.Revision && actual.Count == previous.Count + 1, "ACTUAL_DEFAULT_DACL_STRUCTURE_MISMATCH");
        for (int i = 0; i < previous.Count; i++)
        {
            byte[] before = new byte[previous[i].BinaryLength], after = new byte[actual[i].BinaryLength];
            previous[i].GetBinaryForm(before, 0); actual[i].GetBinaryForm(after, 0);
            Require(EqualBytes(before, after), "EXISTING_DEFAULT_DACL_ACE_CHANGED");
        }
        CommonAce added = actual[actual.Count - 1] as CommonAce;
        Require(added != null && added.AceFlags == AceFlags.None && added.AceQualifier == AceQualifier.AccessAllowed
            && added.AccessMask == 0x10000000 && added.SecurityIdentifier.Value == validatedUserSid,
            "SAME_USER_DEFAULT_DACL_ACE_MISMATCH");
    }

    private static bool EqualBytes(byte[] a, byte[] b)
    {
        if (a.Length != b.Length) return false;
        for (int i = 0; i < a.Length; i++) if (a[i] != b[i]) return false;
        return true;
    }

    private static IntPtr SidBuffer(string value)
    {
        SecurityIdentifier sid = new SecurityIdentifier(value);
        byte[] bytes = new byte[sid.BinaryLength];
        sid.GetBinaryForm(bytes, 0);
        IntPtr data = Marshal.AllocHGlobal(bytes.Length);
        Marshal.Copy(bytes, 0, data, bytes.Length);
        return data;
    }

    private static TokenEvidence ReadToken(IntPtr token)
    {
        IntPtr user = IntPtr.Zero;
        IntPtr integrity = IntPtr.Zero;
        try
        {
            user = TokenInformation(token, 1); // TokenUser -> SID_AND_ATTRIBUTES.
            integrity = TokenInformation(token, 25); // TokenIntegrityLevel.
            IntPtr userSid = Marshal.ReadIntPtr(user);
            IntPtr integritySid = Marshal.ReadIntPtr(integrity);
            Require(IsValidSid(userSid) && IsValidSid(integritySid), "INVALID_TOKEN_SID");
            byte count = Marshal.ReadByte(GetSidSubAuthorityCount(integritySid));
            Require(count > 0, "MISSING_TOKEN_INTEGRITY_RID");
            TokenEvidence result = new TokenEvidence {
                Sid = new SecurityIdentifier(userSid).Value,
                Rid = Marshal.ReadInt32(GetSidSubAuthority(integritySid, (uint)(count - 1))),
                ElevationType = TokenInt(token, 18),
                Elevated = TokenInt(token, 20) != 0,
                Session = TokenInt(token, 12),
                Type = TokenInt(token, 8)
            };
            ReadAuthority(token, result);
            return result;
        }
        finally
        {
            if (integrity != IntPtr.Zero) Marshal.FreeHGlobal(integrity);
            if (user != IntPtr.Zero) Marshal.FreeHGlobal(user);
        }
    }

    private static void ReadAuthority(IntPtr token, TokenEvidence evidence)
    {
        IntPtr groups = IntPtr.Zero, privileges = IntPtr.Zero;
        try
        {
            int length;
            groups = TokenInformation(token, 2, out length);
            int count = Marshal.ReadInt32(groups);
            int offset = Marshal.OffsetOf(typeof(TokenGroupsLayout), "First").ToInt32();
            int stride = Marshal.SizeOf(typeof(SidAndAttributes));
            Require(count >= 0 && count <= 4096 && (long)offset + (long)count * stride <= length, "TOKEN_GROUPS_BOUNDS");
            for (int i = 0; i < count; i++)
            {
                SidAndAttributes group = (SidAndAttributes)Marshal.PtrToStructure(IntPtr.Add(groups, offset + i * stride), typeof(SidAndAttributes));
                Require(IsValidSid(group.Sid), "INVALID_GROUP_SID");
                if (new SecurityIdentifier(group.Sid).Value != "S-1-5-32-544") continue;
                evidence.AdminMember = (group.Attributes & 0x4) != 0;
                evidence.AdminDenyOnly = (group.Attributes & 0x10) != 0 && !evidence.AdminMember;
            }
            privileges = TokenInformation(token, 3, out length);
            count = Marshal.ReadInt32(privileges);
            offset = Marshal.OffsetOf(typeof(TokenPrivilegesLayout), "First").ToInt32();
            stride = Marshal.SizeOf(typeof(LuidAndAttributes));
            Require(count >= 0 && count <= 4096 && (long)offset + (long)count * stride <= length, "TOKEN_PRIVILEGES_BOUNDS");
            Luid notify;
            if (!LookupPrivilegeValue(null, "SeChangeNotifyPrivilege", out notify)) throw Win32Failure("LOOKUP_NORMAL_USER_PRIVILEGE");
            for (int i = 0; i < count; i++)
            {
                LuidAndAttributes privilege = (LuidAndAttributes)Marshal.PtrToStructure(IntPtr.Add(privileges, offset + i * stride), typeof(LuidAndAttributes));
                if (privilege.Value.LowPart == notify.LowPart && privilege.Value.HighPart == notify.HighPart) continue;
                evidence.OtherPrivileges++;
                if ((privilege.Attributes & 0x2) != 0) evidence.EnabledOtherPrivileges++;
            }
        }
        finally
        {
            if (privileges != IntPtr.Zero) Marshal.FreeHGlobal(privileges);
            if (groups != IntPtr.Zero) Marshal.FreeHGlobal(groups);
        }
    }

    private static int TokenInt(IntPtr token, int informationClass)
    {
        Require(informationClass == 8 || informationClass == 12 || informationClass == 18 || informationClass == 20,
            "FIXED_DWORD_TOKEN_CLASS_REQUIRED");
        IntPtr data = FixedTokenInformation(token, informationClass, sizeof(int));
        try { return Marshal.ReadInt32(data); }
        finally { Marshal.FreeHGlobal(data); }
    }

    private static void AssertNoThreadToken(string stage)
    {
        IntPtr token;
        bool present = OpenThreadToken(GetCurrentThread(), TokenQuery, true, out token);
        int error = present ? 0 : Marshal.GetLastWin32Error();
        try
        {
            Console.WriteLine("WINDOWS_UPGRADE_THREAD_CONTEXT {\"stage\":\"" + stage
                + "\",\"threadTokenPresent\":" + (present ? "true" : "false")
                + ",\"win32\":" + error.ToString(CultureInfo.InvariantCulture) + "}");
            Require(!present && error == 1008, "CALLER_THREAD_CONTEXT_NOT_RESTORED");
        }
        finally { if (present) Close(token); }
    }

    private static void WriteCallerPrivileges(IntPtr token)
    {
        int length;
        IntPtr data = TokenInformation(token, 3, out length);
        try
        {
            int count = Marshal.ReadInt32(data);
            int offset = Marshal.OffsetOf(typeof(TokenPrivilegesLayout), "First").ToInt32();
            int stride = Marshal.SizeOf(typeof(LuidAndAttributes));
            Require(count >= 0 && count <= 4096 && (long)offset + (long)count * stride <= length, "CALLER_PRIVILEGES_BOUNDS");
            foreach (string name in new string[] { "SeIncreaseQuotaPrivilege", "SeAssignPrimaryTokenPrivilege", "SeImpersonatePrivilege" })
            {
                Luid id;
                if (!LookupPrivilegeValue(null, name, out id)) throw Win32Failure("LOOKUP_CALLER_PRIVILEGE");
                bool present = false, enabled = false;
                for (int i = 0; i < count; i++)
                {
                    LuidAndAttributes privilege = (LuidAndAttributes)Marshal.PtrToStructure(IntPtr.Add(data, offset + i * stride), typeof(LuidAndAttributes));
                    if (privilege.Value.LowPart != id.LowPart || privilege.Value.HighPart != id.HighPart) continue;
                    present = true; enabled = (privilege.Attributes & 2) != 0;
                }
                Console.WriteLine("WINDOWS_UPGRADE_CALLER_PRIVILEGE {\"name\":\"" + name
                    + "\",\"present\":" + (present ? "true" : "false") + ",\"enabled\":" + (enabled ? "true" : "false") + "}");
            }
        }
        finally { Marshal.FreeHGlobal(data); }
    }

    private static IntPtr LinkedToken(IntPtr token)
    {
        IntPtr data = FixedTokenInformation(token, 19, IntPtr.Size);
        try
        {
            IntPtr linked = Marshal.ReadIntPtr(data);
            Require(linked != IntPtr.Zero, "LINKED_TOKEN_UNAVAILABLE");
            return linked;
        }
        finally { Marshal.FreeHGlobal(data); }
    }

    private static IntPtr FixedTokenInformation(IntPtr token, int informationClass, int size)
    {
        IntPtr data = Marshal.AllocHGlobal(size);
        bool returned = false;
        try
        {
            int length;
            if (!GetTokenInformation(token, informationClass, data, size, out length))
                throw Win32Failure("QUERY_FIXED_TOKEN_INFORMATION_" + informationClass.ToString(CultureInfo.InvariantCulture));
            Require(length == size, "FIXED_TOKEN_INFORMATION_LENGTH_MISMATCH");
            returned = true;
            return data;
        }
        finally { if (!returned) Marshal.FreeHGlobal(data); }
    }

    private static IntPtr TokenInformation(IntPtr token, int informationClass)
    {
        int length;
        return TokenInformation(token, informationClass, out length);
    }

    private static IntPtr TokenInformation(IntPtr token, int informationClass, out int length)
    {
        Require(informationClass == 1 || informationClass == 2 || informationClass == 3 || informationClass == 6 || informationClass == 25, "VARIABLE_TOKEN_CLASS_REQUIRED");
        bool sized = GetTokenInformation(token, informationClass, IntPtr.Zero, 0, out length);
        int sizeError = Marshal.GetLastWin32Error();
        if (!sized && sizeError != 122) // ERROR_INSUFFICIENT_BUFFER is the expected size query.
            throw new InvalidOperationException("UPGRADE_LAUNCH_SIZE_TOKEN_INFORMATION_"
                + informationClass.ToString(CultureInfo.InvariantCulture) + " (Win32 "
                + sizeError.ToString(CultureInfo.InvariantCulture) + ")");
        Require(length > 0 && length <= 65536, "TOKEN_INFORMATION_UNAVAILABLE_" + informationClass.ToString(CultureInfo.InvariantCulture));
        IntPtr data = Marshal.AllocHGlobal(length);
        if (!GetTokenInformation(token, informationClass, data, length, out length))
        {
            Exception error = Win32Failure("QUERY_TOKEN_INFORMATION_" + informationClass.ToString(CultureInfo.InvariantCulture));
            Marshal.FreeHGlobal(data);
            throw error;
        }
        return data;
    }

    private static SortedDictionary<string, string> ReadEnvironment(IntPtr block)
    {
        SortedDictionary<string, string> variables = new SortedDictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        IntPtr cursor = block;
        int totalChars = 0;
        for (int count = 0; count < 4096; count++)
        {
            string entry = Marshal.PtrToStringUni(cursor);
            if (String.IsNullOrEmpty(entry)) return variables;
            totalChars = checked(totalChars + entry.Length + 1);
            Require(totalChars <= 1048576, "USER_ENVIRONMENT_TOO_LARGE");
            int separator = entry.IndexOf('=', entry[0] == '=' ? 1 : 0);
            Require(separator > 0, "INVALID_USER_ENVIRONMENT_ENTRY");
            variables.Add(entry.Substring(0, separator), entry.Substring(separator + 1));
            cursor = IntPtr.Add(cursor, checked((entry.Length + 1) * 2));
        }
        throw new InvalidOperationException("UPGRADE_LAUNCH_USER_ENVIRONMENT_TOO_MANY_ENTRIES");
    }

    private static string FullPath(string value)
    {
        Require(!String.IsNullOrEmpty(value) && value.IndexOf('"') < 0 && value.IndexOf('\0') < 0, "VALID_ABSOLUTE_PATH_REQUIRED");
        try
        {
            Require(Path.IsPathRooted(value), "ABSOLUTE_PATH_REQUIRED");
            return Path.GetFullPath(value);
        }
        catch { throw new InvalidOperationException("UPGRADE_LAUNCH_INVALID_PATH"); }
    }

    private static bool SamePath(string a, string b)
    {
        return String.Equals(FullPath(a).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar),
            FullPath(b).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar), StringComparison.OrdinalIgnoreCase);
    }

    private static void Require(bool condition, string reason)
    {
        if (!condition) throw new InvalidOperationException("UPGRADE_LAUNCH_" + reason);
    }

    private static Exception Win32Failure(string reason)
    {
        int code = Marshal.GetLastWin32Error();
        return new InvalidOperationException("UPGRADE_LAUNCH_" + reason + " (Win32 " + code.ToString(CultureInfo.InvariantCulture) + ")");
    }

    private static void Close(IntPtr handle) { if (handle != IntPtr.Zero) CloseHandle(handle); }
    private static void CloseFile(IntPtr handle) { if (handle != IntPtr.Zero && handle != new IntPtr(-1)) CloseHandle(handle); }
    private static void RequireValidFileHandle(IntPtr handle, string reason)
    {
        if (handle == IntPtr.Zero || handle == new IntPtr(-1)) throw Win32Failure(reason);
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct SecurityAttributes { internal int Length; internal IntPtr Descriptor; internal int Inherit; }

    [StructLayout(LayoutKind.Sequential)]
    private struct StartupInformationEx { internal StartupInformation Startup; internal IntPtr Attributes; }

    [StructLayout(LayoutKind.Sequential)]
    private struct SidAndAttributes { internal IntPtr Sid; internal uint Attributes; }
    [StructLayout(LayoutKind.Sequential)]
    private struct TokenGroupsLayout { internal uint Count; internal SidAndAttributes First; }
    [StructLayout(LayoutKind.Sequential)]
    private struct Luid { internal uint LowPart; internal int HighPart; }
    [StructLayout(LayoutKind.Sequential)]
    private struct LuidAndAttributes { internal Luid Value; internal uint Attributes; }
    [StructLayout(LayoutKind.Sequential)]
    private struct TokenPrivilegesLayout { internal uint Count; internal LuidAndAttributes First; }

    [StructLayout(LayoutKind.Sequential)]
    private struct StartupInformation
    {
        internal int cb;
        internal IntPtr lpReserved, lpDesktop, lpTitle;
        internal uint dwX, dwY, dwXSize, dwYSize, dwXCountChars, dwYCountChars, dwFillAttribute, dwFlags;
        internal ushort wShowWindow, cbReserved2;
        internal IntPtr lpReserved2, hStdInput, hStdOutput, hStdError;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct ProcessInformation
    {
        internal IntPtr hProcess, hThread;
        internal uint dwProcessId, dwThreadId;
    }

    [DllImport("kernel32.dll")] private static extern IntPtr GetCurrentProcess();
    [DllImport("kernel32.dll")] private static extern IntPtr GetCurrentThread();
    [DllImport("kernel32.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool DuplicateHandle(IntPtr sourceProcess, IntPtr source, IntPtr targetProcess,
        out IntPtr target, uint access, [MarshalAs(UnmanagedType.Bool)] bool inherit, uint options);
    [DllImport("kernel32.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool CreatePipe(out IntPtr read, out IntPtr write, IntPtr security, uint size);
    [DllImport("kernel32.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool InitializeProcThreadAttributeList(IntPtr list, int count, uint flags, ref IntPtr size);
    [DllImport("kernel32.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool UpdateProcThreadAttribute(IntPtr list, uint flags, IntPtr attribute,
        IntPtr value, IntPtr size, IntPtr previous, IntPtr returnedSize);
    [DllImport("kernel32.dll")] private static extern void DeleteProcThreadAttributeList(IntPtr list);
    [DllImport("kernel32.dll")] private static extern uint GetCurrentThreadId();
    [DllImport("user32.dll", SetLastError = true)] private static extern IntPtr GetProcessWindowStation();
    [DllImport("user32.dll", SetLastError = true)] private static extern IntPtr GetThreadDesktop(uint thread);
    [DllImport("user32.dll", EntryPoint = "OpenWindowStationW", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern IntPtr OpenWindowStation(string name, [MarshalAs(UnmanagedType.Bool)] bool inherit, uint access);
    [DllImport("user32.dll", EntryPoint = "OpenDesktopW", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern IntPtr OpenDesktop(string name, uint flags, [MarshalAs(UnmanagedType.Bool)] bool inherit, uint access);
    [DllImport("user32.dll")] [return: MarshalAs(UnmanagedType.Bool)] private static extern bool CloseWindowStation(IntPtr station);
    [DllImport("user32.dll")] [return: MarshalAs(UnmanagedType.Bool)] private static extern bool CloseDesktop(IntPtr desktop);
    [DllImport("user32.dll", EntryPoint = "GetUserObjectInformationW", CharSet = CharSet.Unicode, SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool GetUserObjectInformation(IntPtr handle, int index, StringBuilder buffer, uint length, out uint needed);
    [DllImport("kernel32.dll", EntryPoint = "CreateFileW", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern IntPtr CreateFile(string path, uint access, uint share, IntPtr security, uint disposition, uint flags, IntPtr template);
    [DllImport("kernel32.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool CloseHandle(IntPtr handle);
    [DllImport("kernel32.dll", SetLastError = true)] private static extern uint ResumeThread(IntPtr thread);
    [DllImport("kernel32.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool TerminateProcess(IntPtr process, uint exitCode);
    [DllImport("kernel32.dll", SetLastError = true)] private static extern uint WaitForSingleObject(IntPtr handle, uint milliseconds);
    [DllImport("advapi32.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool OpenProcessToken(IntPtr process, uint access, out IntPtr token);
    [DllImport("advapi32.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool OpenThreadToken(IntPtr thread, uint access, [MarshalAs(UnmanagedType.Bool)] bool asSelf, out IntPtr token);
    [DllImport("advapi32.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool ImpersonateLoggedOnUser(IntPtr token);
    [DllImport("advapi32.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool RevertToSelf();
    [DllImport("advapi32.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool GetTokenInformation(IntPtr token, int informationClass, IntPtr information, int size, out int requiredSize);
    [DllImport("advapi32.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool SetTokenInformation(IntPtr token, int informationClass, IntPtr information, int size);
    [DllImport("advapi32.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool CreateRestrictedToken(IntPtr existing, uint flags, uint disabledSidCount,
        IntPtr disabledSids, uint deletePrivilegeCount, IntPtr deletedPrivileges,
        uint restrictedSidCount, IntPtr restrictedSids, out IntPtr restricted);
    [DllImport("advapi32.dll", EntryPoint = "LookupPrivilegeValueW", CharSet = CharSet.Unicode, SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool LookupPrivilegeValue(string system, string name, out Luid value);
    [DllImport("advapi32.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool DuplicateTokenEx(IntPtr token, uint access, IntPtr attributes, int impersonationLevel, int tokenType, out IntPtr duplicated);
    [DllImport("advapi32.dll")] [return: MarshalAs(UnmanagedType.Bool)] private static extern bool IsValidSid(IntPtr sid);
    [DllImport("advapi32.dll")] private static extern IntPtr GetSidSubAuthorityCount(IntPtr sid);
    [DllImport("advapi32.dll")] private static extern IntPtr GetSidSubAuthority(IntPtr sid, uint index);
    [DllImport("userenv.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool CreateEnvironmentBlock(out IntPtr environment, IntPtr token, [MarshalAs(UnmanagedType.Bool)] bool inherit);
    [DllImport("userenv.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool DestroyEnvironmentBlock(IntPtr environment);
    [DllImport("advapi32.dll", CharSet = CharSet.Unicode, SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool CreateProcessWithTokenW(IntPtr token, uint logonFlags, string applicationName,
        StringBuilder commandLine, uint creationFlags, IntPtr environment, string currentDirectory,
        ref StartupInformation startup, out ProcessInformation process);
    [DllImport("advapi32.dll", CharSet = CharSet.Unicode, SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool CreateProcessAsUserW(IntPtr token, string applicationName, StringBuilder commandLine,
        IntPtr processAttributes, IntPtr threadAttributes, [MarshalAs(UnmanagedType.Bool)] bool inheritHandles,
        uint creationFlags, IntPtr environment, string currentDirectory,
        ref StartupInformationEx startup, out ProcessInformation process);
}

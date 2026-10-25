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
    private const uint LogonWithProfile = 0x00000001;
    private const uint InvalidResume = 0xffffffff;

    private sealed class TokenEvidence
    {
        internal string Sid;
        internal int Rid;
        internal int ElevationType;
        internal bool Elevated;
        internal int Session;
        internal bool AdminMember;
        internal bool AdminDenyOnly;
        internal int OtherPrivileges;
        internal int EnabledOtherPrivileges;
    }

    // Run immediately after Add-Type, before building or installing the app.
    // Exercise the same token queries/selection as Start without creating a process.
    public static void Preflight()
    {
        RequireRunner();
        IntPtr currentToken = IntPtr.Zero;
        IntPtr ownedSourceToken = IntPtr.Zero;
        try
        {
            if (!OpenProcessToken(GetCurrentProcess(), TokenQuery | TokenDuplicate, out currentToken))
                throw Win32Failure("OPEN_CURRENT_TOKEN");
            TokenEvidence current = ReadToken(currentToken);
            WriteParentEvidence(current);
            WriteDesktopEvidence(current.Session);
            IntPtr sourceToken = MediumSourceToken(currentToken, current, out ownedSourceToken);
            TokenEvidence source = ReadToken(sourceToken);
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
        string expectedLocalAppData, string expectedUserProfile, string requestedArgs)
    {
        RequireRunner();
        Require(String.Equals(requestedArgs, BrowserArguments, StringComparison.Ordinal), "EXACT_LOOPBACK_ARGUMENTS_REQUIRED");
        Require(Environment.GetEnvironmentVariable("WEBVIEW2_USER_DATA_FOLDER") == null
            && Environment.GetEnvironmentVariable("WEBVIEW2_BROWSER_EXECUTABLE_FOLDER") == null, "PROFILE_OR_RUNTIME_OVERRIDE_DENIED");

        exe = FullPath(exe);
        cwd = FullPath(cwd);
        Require(File.Exists(exe) && Directory.Exists(cwd), "EXACT_EXECUTABLE_AND_WORKING_DIRECTORY_REQUIRED");
        Require(SamePath(cwd, Path.GetDirectoryName(exe)), "INSTALLED_APP_WORKING_DIRECTORY_REQUIRED");
        Require(SamePath(Environment.GetEnvironmentVariable("LOCALAPPDATA"), expectedLocalAppData)
            && SamePath(Environment.GetEnvironmentVariable("USERPROFILE"), expectedUserProfile), "PARENT_PROFILE_PATH_MISMATCH");

        IntPtr currentToken = IntPtr.Zero;
        IntPtr ownedSourceToken = IntPtr.Zero;
        IntPtr primaryToken = IntPtr.Zero;
        IntPtr targetToken = IntPtr.Zero;
        IntPtr nativeEnvironment = IntPtr.Zero;
        IntPtr launchEnvironment = IntPtr.Zero;
        int launchEnvironmentChars = 0;
        Process managedProcess = null;
        ProcessInformation child = new ProcessInformation();
        bool resumed = false;
        try
        {
            if (!OpenProcessToken(GetCurrentProcess(), TokenQuery | TokenDuplicate, out currentToken))
                throw Win32Failure("OPEN_CURRENT_TOKEN");
            TokenEvidence current = ReadToken(currentToken);
            // Preserve the parent evidence even when the linked-token query fails.
            WriteParentEvidence(current);
            WriteDesktopEvidence(current.Session);
            IntPtr sourceToken = MediumSourceToken(currentToken, current, out ownedSourceToken);
            if (!DuplicateTokenEx(sourceToken, TokenQuery | TokenDuplicate | TokenAssignPrimary,
                IntPtr.Zero, 2, 1, out primaryToken))
                throw Win32Failure("DUPLICATE_MEDIUM_PRIMARY_TOKEN");
            TokenEvidence primary = ReadToken(primaryToken);
            Require(primary.Sid == current.Sid && primary.Session == current.Session
                && primary.Rid == MediumRid && !primary.Elevated, "DUPLICATED_TOKEN_MISMATCH");
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
            // NULL inherits the caller's actual desktop/window station. Do not
            // invent an interactive desktop or alter any access-control list.
            Require(startup.lpDesktop == IntPtr.Zero, "INHERITED_DESKTOP_REQUIRED");
            ProbeTargetAccess(primaryToken, current.Sid, exe, cwd, expectedLocalAppData, expectedUserProfile);
            StringBuilder command = new StringBuilder("\"" + exe + "\"");
            if (IsDefaultHigh(current))
            {
                // Microsoft's documented path for a restricted copy of our
                // own primary token. The same user's profile is already loaded.
                Console.WriteLine("WINDOWS_UPGRADE_PROCESS_API CreateProcessAsUserW-own-restricted");
                if (!CreateProcessAsUserW(primaryToken, exe, command, IntPtr.Zero, IntPtr.Zero, false,
                    CreateSuspended | CreateUnicodeEnvironment, launchEnvironment, cwd, ref startup, out child))
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
                && target.Rid == MediumRid && !target.Elevated, "CREATED_PROCESS_TOKEN_MISMATCH");
            RequireNoAdminAuthority(target, IsDefaultHigh(current));
            Console.WriteLine("WINDOWS_UPGRADE_ACTUAL_CHILD_TOKEN {\"integrityRid\":8192,\"elevated\":false,\"adminMember\":false,\"adminDenyOnly\":"
                + (target.AdminDenyOnly ? "true" : "false") + ",\"otherPrivileges\":"
                + target.OtherPrivileges.ToString(CultureInfo.InvariantCulture) + ",\"sameUserSid\":true}");
            Require(child.dwProcessId <= Int32.MaxValue, "PROCESS_ID_OUT_OF_RANGE");
            managedProcess = Process.GetProcessById((int)child.dwProcessId);
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
        ownedSourceToken = IntPtr.Zero;
        IntPtr sourceToken = currentToken;
        if (current.Rid != MediumRid || current.Elevated)
        {
            if (IsDefaultHigh(current))
            {
                // This exact runner state was measured in the early preflight.
                // Only reduce its authority; never manufacture another user/profile.
                ownedSourceToken = RestrictedMediumToken(currentToken);
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
        Require(source.Rid == MediumRid && !source.Elevated, "EXACT_MEDIUM_UNELEVATED_TOKEN_REQUIRED");
        RequireNoAdminAuthority(source, IsDefaultHigh(current));
        return sourceToken;
    }

    private static bool IsDefaultHigh(TokenEvidence current)
    {
        return current.Rid == HighRid && current.Elevated && current.ElevationType == DefaultElevation;
    }

    private static void WriteDesktopEvidence(int session)
    {
        string station = UserObjectName(GetProcessWindowStation());
        string desktop = UserObjectName(GetThreadDesktop(GetCurrentThreadId()));
        Console.WriteLine("WINDOWS_UPGRADE_DESKTOP {\"session\":" + session.ToString(CultureInfo.InvariantCulture)
            + ",\"station\":\"" + JsonEscape(station) + "\",\"desktop\":\"" + JsonEscape(desktop) + "\",\"inherit\":true}");
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
        string localAppData, string userProfile)
    {
        if (!ImpersonateLoggedOnUser(token)) throw Win32Failure("IMPERSONATE_SAME_USER_ACCESS_PROBE");
        bool allowed = false;
        try
        {
            bool executable = ReadAccess("installed-executable", exe, false);
            bool directory = ReadAccess("installed-working-directory", cwd, true);
            bool data = ReadAccess("default-local-app-data", localAppData, true);
            bool profile = ReadAccess("default-user-profile", userProfile, true);
            bool hive;
            using (Microsoft.Win32.RegistryKey key = Microsoft.Win32.Registry.Users.OpenSubKey(expectedSid, false))
                hive = key != null;
            Console.WriteLine("WINDOWS_UPGRADE_TARGET_ACCESS {\"label\":\"same-user-loaded-profile-hive\",\"allowed\":" + (hive ? "true" : "false") + "}");
            allowed = executable && directory && data && profile && hive;
        }
        finally
        {
            // Never run the launcher or continue the PowerShell host while
            // accidentally retaining a thread impersonation context.
            if (!RevertToSelf()) Environment.FailFast("UPGRADE_LAUNCH_REVERT_ACCESS_PROBE_FAILED");
        }
        Require(allowed, "TARGET_ACCESS_OR_LOADED_PROFILE_DENIED");
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

    private static IntPtr RestrictedMediumToken(IntPtr currentToken)
    {
        IntPtr adjustable = IntPtr.Zero, restricted = IntPtr.Zero, adminSid = IntPtr.Zero;
        IntPtr disabledGroup = IntPtr.Zero, label = IntPtr.Zero;
        bool returned = false;
        try
        {
            if (!DuplicateTokenEx(currentToken, TokenQuery | TokenDuplicate | TokenAssignPrimary | TokenAdjustDefault,
                IntPtr.Zero, 2, 1, out adjustable)) throw Win32Failure("DUPLICATE_RESTRICTION_SOURCE");
            adminSid = SidBuffer("S-1-5-32-544");
            disabledGroup = Marshal.AllocHGlobal(Marshal.SizeOf(typeof(SidAndAttributes)));
            Marshal.StructureToPtr(new SidAndAttributes { Sid = adminSid, Attributes = 0 }, disabledGroup, false);
            // Neither SANDBOX_INERT nor any policy-bypassing flag is used.
            if (!CreateRestrictedToken(adjustable, DisableMaxPrivilege | LuaToken, 1, disabledGroup,
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
            Close(adjustable);
        }
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
                Session = TokenInt(token, 12)
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
        Require(informationClass == 12 || informationClass == 18 || informationClass == 20,
            "FIXED_DWORD_TOKEN_CLASS_REQUIRED");
        IntPtr data = FixedTokenInformation(token, informationClass, sizeof(int));
        try { return Marshal.ReadInt32(data); }
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
        Require(informationClass == 1 || informationClass == 2 || informationClass == 3 || informationClass == 25, "VARIABLE_TOKEN_CLASS_REQUIRED");
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
    [DllImport("kernel32.dll")] private static extern uint GetCurrentThreadId();
    [DllImport("user32.dll", SetLastError = true)] private static extern IntPtr GetProcessWindowStation();
    [DllImport("user32.dll", SetLastError = true)] private static extern IntPtr GetThreadDesktop(uint thread);
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
        ref StartupInformation startup, out ProcessInformation process);
}

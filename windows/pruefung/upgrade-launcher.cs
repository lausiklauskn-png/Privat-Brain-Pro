// CI-only launcher for the unchanged production installers. WebView2 >= 150
// ignores its browser-argument environment override in an elevated host.
// Use this account's existing medium token; never change the app or its profile.
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
    private const uint TokenAssignPrimary = 0x0001;
    private const uint TokenDuplicate = 0x0002;
    private const uint TokenQuery = 0x0008;
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
    }

    public static UpgradeProbeLaunchResult Start(string exe, string cwd,
        string expectedLocalAppData, string expectedUserProfile, string requestedArgs)
    {
        Require(String.Equals(Environment.GetEnvironmentVariable("GITHUB_ACTIONS"), "true", StringComparison.Ordinal)
            && String.Equals(Environment.GetEnvironmentVariable("RUNNER_OS"), "Windows", StringComparison.Ordinal), "ISOLATED_WINDOWS_CI_REQUIRED");
        Require(Environment.OSVersion.Platform == PlatformID.Win32NT, "WINDOWS_REQUIRED");
        Require(String.Equals(requestedArgs, BrowserArguments, StringComparison.Ordinal), "EXACT_LOOPBACK_ARGUMENTS_REQUIRED");
        Require(Environment.GetEnvironmentVariable("WEBVIEW2_USER_DATA_FOLDER") == null
            && Environment.GetEnvironmentVariable("WEBVIEW2_BROWSER_EXECUTABLE_FOLDER") == null, "PROFILE_OR_RUNTIME_OVERRIDE_DENIED");

        exe = FullPath(exe);
        cwd = FullPath(cwd);
        Require(File.Exists(exe) && Directory.Exists(cwd), "EXACT_EXECUTABLE_AND_WORKING_DIRECTORY_REQUIRED");
        Require(SamePath(Environment.GetEnvironmentVariable("LOCALAPPDATA"), expectedLocalAppData)
            && SamePath(Environment.GetEnvironmentVariable("USERPROFILE"), expectedUserProfile), "PARENT_PROFILE_PATH_MISMATCH");

        IntPtr currentToken = IntPtr.Zero;
        IntPtr linkedToken = IntPtr.Zero;
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
            Console.WriteLine("WINDOWS_UPGRADE_PARENT_TOKEN {\"currentIntegrityRid\":"
                + current.Rid.ToString(CultureInfo.InvariantCulture)
                + ",\"currentElevationType\":" + current.ElevationType.ToString(CultureInfo.InvariantCulture)
                + ",\"currentElevated\":" + (current.Elevated ? "true" : "false") + "}");

            IntPtr sourceToken;
            if (current.Rid == MediumRid && !current.Elevated)
            {
                sourceToken = currentToken;
            }
            else
            {
                Require(current.Rid == HighRid && current.Elevated && current.ElevationType == FullElevation,
                    "FULL_HIGH_OR_MEDIUM_TOKEN_REQUIRED");
                linkedToken = LinkedToken(currentToken);
                sourceToken = linkedToken;
            }
            TokenEvidence source = ReadToken(sourceToken);
            Require(source.Sid == current.Sid && source.Session == current.Session,
                "LINKED_TOKEN_USER_OR_SESSION_MISMATCH");
            Require(source.Rid == MediumRid && !source.Elevated, "EXACT_MEDIUM_UNELEVATED_TOKEN_REQUIRED");
            if (!DuplicateTokenEx(sourceToken, TokenQuery | TokenDuplicate | TokenAssignPrimary,
                IntPtr.Zero, 2, 1, out primaryToken))
                throw Win32Failure("DUPLICATE_MEDIUM_PRIMARY_TOKEN");
            TokenEvidence primary = ReadToken(primaryToken);
            Require(primary.Sid == current.Sid && primary.Session == current.Session
                && primary.Rid == MediumRid && !primary.Elevated, "DUPLICATED_TOKEN_MISMATCH");

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
            StringBuilder command = new StringBuilder("\"" + exe + "\"");
            if (!CreateProcessWithTokenW(primaryToken, LogonWithProfile, exe, command,
                CreateSuspended | CreateUnicodeEnvironment, launchEnvironment, cwd, ref startup, out child))
                throw Win32Failure("CREATE_SUSPENDED_PRODUCTION_PROCESS");
            // Check the actual created process, not merely the token we supplied.
            if (!OpenProcessToken(child.hProcess, TokenQuery, out targetToken))
                throw Win32Failure("OPEN_CREATED_PROCESS_TOKEN");
            TokenEvidence target = ReadToken(targetToken);
            Require(target.Sid == current.Sid && target.Session == current.Session
                && target.Rid == MediumRid && !target.Elevated, "CREATED_PROCESS_TOKEN_MISMATCH");
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
            Close(linkedToken);
            Close(currentToken);
        }
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
            return new TokenEvidence {
                Sid = new SecurityIdentifier(userSid).Value,
                Rid = Marshal.ReadInt32(GetSidSubAuthority(integritySid, (uint)(count - 1))),
                ElevationType = TokenInt(token, 18),
                Elevated = TokenInt(token, 20) != 0,
                Session = TokenInt(token, 12)
            };
        }
        finally
        {
            if (integrity != IntPtr.Zero) Marshal.FreeHGlobal(integrity);
            if (user != IntPtr.Zero) Marshal.FreeHGlobal(user);
        }
    }

    private static int TokenInt(IntPtr token, int informationClass)
    {
        IntPtr data = TokenInformation(token, informationClass);
        try { return Marshal.ReadInt32(data); }
        finally { Marshal.FreeHGlobal(data); }
    }

    private static IntPtr LinkedToken(IntPtr token)
    {
        IntPtr data = TokenInformation(token, 19);
        try
        {
            IntPtr linked = Marshal.ReadIntPtr(data);
            Require(linked != IntPtr.Zero, "LINKED_TOKEN_UNAVAILABLE");
            return linked;
        }
        finally { Marshal.FreeHGlobal(data); }
    }

    private static IntPtr TokenInformation(IntPtr token, int informationClass)
    {
        int length;
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
    [DllImport("kernel32.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool CloseHandle(IntPtr handle);
    [DllImport("kernel32.dll", SetLastError = true)] private static extern uint ResumeThread(IntPtr thread);
    [DllImport("kernel32.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool TerminateProcess(IntPtr process, uint exitCode);
    [DllImport("kernel32.dll", SetLastError = true)] private static extern uint WaitForSingleObject(IntPtr handle, uint milliseconds);
    [DllImport("advapi32.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool OpenProcessToken(IntPtr process, uint access, out IntPtr token);
    [DllImport("advapi32.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool GetTokenInformation(IntPtr token, int informationClass, IntPtr information, int size, out int requiredSize);
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
}

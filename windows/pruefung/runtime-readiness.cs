// CI-only diagnostic executable, launched by UpgradeProbeLauncher under the
// same actual Medium primary token as the unchanged production app.
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Security.AccessControl;
using System.Security.Principal;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Web.Script.Serialization;

public static class RuntimeReadiness
{
    private const int ByteLimit = 65536;
    private static readonly JavaScriptSerializer Json = new JavaScriptSerializer { MaxJsonLength = ByteLimit, RecursionLimit = 24 };
    private static string Stage = "identity";
    private static bool JreReadExecuteAllowed, PipeSetupAllowed;
    private static void Emit(string operation, params object[] pairs)
    {
        Dictionary<string, object> value = new Dictionary<string, object>();
        value["operation"] = operation;
        for (int i = 0; i < pairs.Length; i += 2) value[(string)pairs[i]] = pairs[i + 1];
        Console.WriteLine("WINDOWS_RUNTIME_READINESS " + Json.Serialize(value));
    }
    private static void Need(bool condition, string reason)
    {
        if (!condition) throw new InvalidOperationException(reason);
    }
    private static Win32Exception NativeFailure(string operation)
    {
        int error = Marshal.GetLastWin32Error();
        Emit(operation, "success", false, "win32", error);
        return new Win32Exception(error);
    }

    public static int Main(string[] args)
    {
        try
        {
            Need(args.Length == 0 && Environment.OSVersion.Platform == PlatformID.Win32NT, "WINDOWS_DIAGNOSTIC_WITHOUT_ARGUMENTS_REQUIRED");
            using (WindowsIdentity identity = WindowsIdentity.GetCurrent())
            {
                bool admin = new WindowsPrincipal(identity).IsInRole(WindowsBuiltInRole.Administrator);
                int rid = Integrity(identity.Token);
                int elevated = TokenDword(identity.Token, 20);
                Emit("actual-helper-token", "session", Process.GetCurrentProcess().SessionId,
                    "integrityRid", rid, "adminMember", admin, "elevated", elevated != 0,
                    "primary", TokenDword(identity.Token, 8) == 1);
                Need(rid == 8192 && elevated == 0 && !admin && TokenDword(identity.Token, 8) == 1,
                    "ACTUAL_MEDIUM_UNELEVATED_PRIMARY_REQUIRED");
            }
            Stage = "caller-job";
            bool inJob;
            bool membership = IsProcessInJob(GetCurrentProcess(), IntPtr.Zero, out inJob);
            int membershipError = membership ? 0 : Marshal.GetLastWin32Error();
            Emit("IsProcessInJob", "label", "helper", "success", membership, "win32", membershipError,
                "inAnyJob", membership ? (object)inJob : null);
            if (membership && inJob)
            {
                uint length, restrictions = 0;
                bool ui = QueryJobUi(IntPtr.Zero, 4, ref restrictions, 4, out length);
                int uiError = ui ? 0 : Marshal.GetLastWin32Error();
                Emit("caller-immediate-job-ui", "success", ui, "win32", uiError, "restrictions", restrictions);
                ExtendedLimits limits = new ExtendedLimits();
                bool queried = QueryJobLimits(IntPtr.Zero, 9, ref limits, (uint)Marshal.SizeOf(typeof(ExtendedLimits)), out length);
                int limitsError = queried ? 0 : Marshal.GetLastWin32Error();
                Emit("caller-immediate-job-limits", "success", queried, "win32", limitsError,
                    "limitFlags", limits.Basic.LimitFlags, "activeProcessLimit", limits.Basic.ActiveProcessLimit);
            }
            Stage = "bcrypt";
            byte[] random = new byte[32];
            try
            {
                int status = BCryptGenRandom(IntPtr.Zero, random, random.Length, 2);
                Emit("BCryptGenRandom-32", "success", status == 0, "ntstatus", "0x" + unchecked((uint)status).ToString("X8"));
                Need(status == 0, "SYSTEM_RANDOM_UNAVAILABLE");
            }
            finally { Array.Clear(random, 0, random.Length); }
            Stage = "installed-runtime";
            string local = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            Need(!String.IsNullOrEmpty(local), "DEFAULT_LOCAL_APP_DATA_REQUIRED");
            string runtime = Path.Combine(local, "Private Brain Pro", "runtime");
            string java = Path.Combine(runtime, "jre", "bin", "java.exe");
            string data = Path.Combine(local, "de.familyprojekt.privatebrain.pro");
            Need(File.Exists(java) && Directory.Exists(Path.Combine(runtime, "engine", "classes")), "EXACT_INSTALLED_RUNTIME_REQUIRED");
            Stage = "read-only-access-diagnostics";
            DiagnoseAccess(java, runtime);
            Stage = "java-version";
            CheckVersion(java, runtime);
            Stage = "engine-device-readiness";
            CheckEngine(java, runtime, data);
            Emit("complete", "success", true);
            return 0;
        }
        catch (Exception error)
        {
            Win32Exception native = error as Win32Exception;
            string reason = error is InvalidOperationException && Regex.IsMatch(error.Message, "^[A-Z0-9_]{1,100}$") ? error.Message : null;
            Emit("failed", "stage", Stage, "exceptionType", error.GetType().FullName,
                "win32", native == null ? (object)null : native.NativeErrorCode, "safeReason", reason);
            return 1;
        }
    }

    private static Process StartJava(string java, string runtime, string arguments)
    {
        ProcessStartInfo start = new ProcessStartInfo(java, arguments);
        start.UseShellExecute = false;
        start.CreateNoWindow = true;
        start.WorkingDirectory = runtime;
        start.RedirectStandardInput = true;
        start.RedirectStandardOutput = true;
        start.RedirectStandardError = true;
        foreach (string name in new string[] { "JAVA_TOOL_OPTIONS", "_JAVA_OPTIONS", "JDK_JAVA_OPTIONS" })
            start.EnvironmentVariables.Remove(name);
        Process process = new Process { StartInfo = start };
        bool started = false;
        string previousStage = Stage, operation = "java-Process.Start";
        try
        {
            Emit("java-Process.Start", "state", "calling");
            if (!process.Start()) throw new InvalidOperationException("JAVA_PROCESS_NOT_STARTED");
            started = true;
            Emit("java-Process.Start", "state", "returned", "processId", process.Id);
            operation = "java-process-handle";
            Stage = "java-process-handle";
            Need(process.Handle != IntPtr.Zero, "JAVA_PROCESS_HANDLE_REQUIRED");
            Emit("java-process-handle", "success", true);
            Stage = previousStage;
            Emit("java-spawn", "success", true, "processId", process.Id);
            return process;
        }
        catch (Win32Exception error)
        {
            Emit(operation, "success", false, "win32", error.NativeErrorCode);
            if (!started && error.NativeErrorCode == 5 && JreReadExecuteAllowed && PipeSetupAllowed)
                ReportOwnedExecutionEvents(java);
            try { if (started) StopJava(process); } finally { process.Dispose(); }
            throw;
        }
        catch { try { if (started) StopJava(process); } finally { process.Dispose(); } throw; }
    }

    private static void DiagnoseAccess(string java, string runtime)
    {
        IntPtr read = IntPtr.Zero, write = IntPtr.Zero, duplicate = IntPtr.Zero, nul = IntPtr.Zero;
        bool pipe = false, copied = false;
        try
        {
            pipe = CreatePipe(out read, out write, IntPtr.Zero, 0);
            int error = pipe ? 0 : Marshal.GetLastWin32Error();
            Emit("CreatePipe-default-security", "success", pipe, "win32", error);
            nul = OpenFile("NUL", 0x80000000, 3, IntPtr.Zero, 3, 0x80, IntPtr.Zero);
            if (nul != new IntPtr(-1) && nul != IntPtr.Zero)
            {
                copied = DuplicateHandle(GetCurrentProcess(), nul, GetCurrentProcess(), out duplicate, 0, false, 2);
                error = copied ? 0 : Marshal.GetLastWin32Error();
                Emit("DuplicateHandle-own-NUL", "success", copied, "win32", error);
            }
            else Emit("open-own-NUL", "success", false, "win32", Marshal.GetLastWin32Error());
        }
        finally { if (pipe) { CloseValid(read); CloseValid(write); } if (copied) CloseValid(duplicate); CloseValid(nul); }
        PipeSetupAllowed = pipe && copied;
        JreReadExecuteAllowed = ReadPathAccess("installed-JRE-executable", java, false);
        ReadPathAccess("installed-runtime-cwd", runtime, true);
        uint pid = unchecked((uint)Process.GetCurrentProcess().Id);
        foreach (uint mask in new uint[] { 0x40, 0x80, 0x400, 0x20000 })
        {
            IntPtr opened = OpenProcess(mask, false, pid);
            int error = opened == IntPtr.Zero ? Marshal.GetLastWin32Error() : 0;
            Emit("OpenProcess-self", "accessMask", "0x" + mask.ToString("X"), "success", opened != IntPtr.Zero, "win32", error);
            CloseValid(opened);
        }
        using (WindowsIdentity identity = WindowsIdentity.GetCurrent())
        {
            string self = identity.User.Value;
            try
            {
                uint length;
                GetTokenBuffer(identity.Token, 6, IntPtr.Zero, 0, out length);
                Need(length >= IntPtr.Size && length <= ByteLimit, "DEFAULT_DACL_QUERY_BOUNDS");
                IntPtr info = Marshal.AllocHGlobal((int)length);
                try
                {
                    if (!GetTokenBuffer(identity.Token, 6, info, length, out length)) throw NativeFailure("TokenDefaultDacl-query");
                    ReportAcl("TokenDefaultDacl", Marshal.ReadIntPtr(info), self);
                }
                finally { Marshal.FreeHGlobal(info); }
            }
            catch (Exception error) { Emit("TokenDefaultDacl-unavailable", "exceptionType", error.GetType().FullName); }
            IntPtr owner, group, dacl, sacl, descriptor;
            uint status = GetSecurityInfo(GetCurrentProcess(), 6, 5, out owner, out group, out dacl, out sacl, out descriptor);
            Emit("self-process-security", "success", status == 0, "win32", status);
            if (status == 0)
            {
                try
                {
                    Emit("self-process-owner", "sidClass", SidClass(new SecurityIdentifier(owner).Value, self));
                    ReportAcl("self-process-DACL", dacl, self);
                }
                catch (Exception error) { Emit("self-process-ACL-unavailable", "exceptionType", error.GetType().FullName); }
                finally { if (descriptor != IntPtr.Zero) LocalFree(descriptor); }
            }
            try { ReportFileAcl(java, false, self); }
            catch (Exception error) { Emit("JRE-ACL-unavailable", "exceptionType", error.GetType().FullName); }
            try { ReportFileAcl(runtime, true, self); }
            catch (Exception error) { Emit("runtime-cwd-ACL-unavailable", "exceptionType", error.GetType().FullName); }
        }
    }

    private static bool ReadPathAccess(string label, string path, bool directory)
    {
        IntPtr handle = OpenFile(path, directory ? 0xA0u : 0xA0000000u, 7, IntPtr.Zero, 3, directory ? 0x02000000u : 0x80u, IntPtr.Zero);
        bool allowed = handle != IntPtr.Zero && handle != new IntPtr(-1);
        int error = allowed ? 0 : Marshal.GetLastWin32Error();
        Emit("path-access-probe", "label", label, "success", allowed, "win32", error);
        CloseValid(handle);
        return allowed;
    }

    private static void ReportOwnedExecutionEvents(string java)
    {
        foreach (string channel in new string[] { "Microsoft-Windows-AppLocker/EXE and DLL", "Microsoft-Windows-CodeIntegrity/Operational" })
        {
            int matched = 0;
            try
            {
                System.Diagnostics.Eventing.Reader.EventLogQuery query = new System.Diagnostics.Eventing.Reader.EventLogQuery(channel,
                    System.Diagnostics.Eventing.Reader.PathType.LogName, "*[System[TimeCreated[timediff(@SystemTime) <= 300000]]]");
                query.ReverseDirection = true;
                using (System.Diagnostics.Eventing.Reader.EventLogReader reader = new System.Diagnostics.Eventing.Reader.EventLogReader(query))
                {
                    for (int i = 0; i < 8; i++)
                    {
                        using (System.Diagnostics.Eventing.Reader.EventRecord record = reader.ReadEvent(TimeSpan.FromMilliseconds(200)))
                        {
                            if (record == null) break;
                            string xml = record.ToXml();
                            if (xml.Length > 32768 || xml.IndexOf(java, StringComparison.OrdinalIgnoreCase) < 0) continue;
                            matched++;
                            Emit("owned-JRE-execution-event", "channel", channel, "eventId", record.Id);
                        }
                    }
                }
                Emit("owned-JRE-event-scan", "channel", channel, "matched", matched, "maximumRecords", 8);
            }
            catch (Exception error) { Emit("owned-JRE-event-scan-unavailable", "channel", channel, "exceptionType", error.GetType().FullName); }
        }
    }

    private static string SidClass(string sid, string self)
    {
        return sid == self ? "same-user" : sid == "S-1-5-32-544" ? "builtin-admin" : sid == "S-1-5-18" ? "system" : "other";
    }

    private static void ReportAcl(string label, IntPtr acl, string self)
    {
        if (acl == IntPtr.Zero) { Emit("acl-metadata", "label", label, "nullDacl", true); return; }
        int size = unchecked((ushort)Marshal.ReadInt16(acl, 2));
        Need(size >= 8 && size <= ByteLimit, "ACL_SIZE_BOUNDS");
        byte[] bytes = new byte[size]; Marshal.Copy(acl, bytes, 0, size);
        RawAcl parsed = new RawAcl(bytes, 0);
        Emit("acl-metadata", "label", label, "nullDacl", false, "aceCount", parsed.Count);
        for (int i = 0; i < Math.Min(parsed.Count, 32); i++)
        {
            KnownAce known = parsed[i] as KnownAce;
            Emit("acl-ace", "label", label, "type", parsed[i].AceType.ToString(), "flags", parsed[i].AceFlags.ToString(),
                "mask", known == null ? null : "0x" + unchecked((uint)known.AccessMask).ToString("X8"),
                "sidClass", known == null ? "unavailable" : SidClass(known.SecurityIdentifier.Value, self));
        }
    }

    private static void ReportFileAcl(string path, bool directory, string self)
    {
        FileSystemSecurity security = directory ? (FileSystemSecurity)Directory.GetAccessControl(path, AccessControlSections.Access | AccessControlSections.Owner)
            : File.GetAccessControl(path, AccessControlSections.Access | AccessControlSections.Owner);
        string label = directory ? "runtime-cwd" : "installed-JRE";
        Emit("file-owner", "label", label, "sidClass", SidClass(security.GetOwner(typeof(SecurityIdentifier)).Value, self));
        int count = 0;
        foreach (FileSystemAccessRule rule in security.GetAccessRules(true, true, typeof(SecurityIdentifier)))
        {
            if (count++ >= 32) break;
            Emit("file-ace", "label", label, "type", rule.AccessControlType.ToString(), "inherited", rule.IsInherited,
                "mask", "0x" + unchecked((uint)rule.FileSystemRights).ToString("X8"), "sidClass", SidClass(rule.IdentityReference.Value, self));
        }
    }

    private static void CloseValid(IntPtr handle) { if (handle != IntPtr.Zero && handle != new IntPtr(-1)) CloseHandle(handle); }

    private static void CheckVersion(string java, string runtime)
    {
        Process child = null;
        Capture output = null, error = null;
        try
        {
            child = StartJava(java, runtime, "-version");
            output = new Capture(child.StandardOutput.BaseStream, false);
            error = new Capture(child.StandardError.BaseStream, false);
            child.StandardInput.Close();
            DateTime deadline = DateTime.UtcNow.AddSeconds(10);
            while (!child.WaitForExit(50))
            {
                Need(DateTime.UtcNow < deadline, "JAVA_VERSION_TIMEOUT");
                Need(!output.Exceeded && !error.Exceeded, "JAVA_VERSION_OUTPUT_LIMIT");
            }
            Need(output.Join() && error.Join(), "JAVA_VERSION_READERS_DID_NOT_FINISH");
            Need(!output.Exceeded && !error.Exceeded, "JAVA_VERSION_OUTPUT_LIMIT");
            Emit("java-version-exit", "success", child.ExitCode == 0, "exitCode", child.ExitCode);
            Need(child.ExitCode == 0, "JAVA_VERSION_FAILED");
        }
        finally
        {
            try { StopJava(child); }
            finally
            {
                try
                {
                    if (output != null) { output.Join(); PrintCapture("java-version-stdout", output); }
                    if (error != null) { error.Join(); PrintCapture("java-version-stderr", error); }
                }
                finally { if (child != null) child.Dispose(); }
            }
        }
    }

    private static string Quote(string value)
    {
        Need(value.IndexOf('"') < 0 && value.IndexOf('\0') < 0 && !value.EndsWith("\\"), "BOUNDED_RUNTIME_ARGUMENT_REQUIRED");
        return "\"" + value + "\"";
    }

    private static void CheckEngine(string java, string runtime, string data)
    {
        Process child = null;
        Capture output = null, error = null;
        StreamWriter input = null;
        IntPtr job = IntPtr.Zero;
        bool ready = false;
        try
        {
            string arguments = "-Xmx512m -Dfile.encoding=UTF-8 -cp \"engine/classes;engine/lib/*\" de.familyprojekt.privatebrain.pro.EngineMain "
                + Quote(data) + " " + Quote(runtime);
            child = StartJava(java, runtime, arguments);
            output = new Capture(child.StandardOutput.BaseStream, true);
            error = new Capture(child.StandardError.BaseStream, false);
            ReportJob(child.Handle, "java-before-own-job");
            job = CreateJobObject(IntPtr.Zero, null);
            if (job == IntPtr.Zero) throw NativeFailure("CreateJobObjectW");
            Emit("CreateJobObjectW", "success", true);
            ExtendedLimits limits = new ExtendedLimits();
            limits.Basic.LimitFlags = 0x2000; // Same KILL_ON_JOB_CLOSE as published .29.
            if (!SetJobLimits(job, 9, ref limits, (uint)Marshal.SizeOf(typeof(ExtendedLimits))))
                throw NativeFailure("SetInformationJobObject-KILL_ON_JOB_CLOSE");
            Emit("SetInformationJobObject-KILL_ON_JOB_CLOSE", "success", true);
            bool assigned = AssignProcessToJobObject(job, child.Handle);
            int assignError = assigned ? 0 : Marshal.GetLastWin32Error();
            child.Refresh();
            Emit("AssignProcessToJobObject", "success", assigned, "win32", assignError, "childAlive", !child.HasExited);
            if (!assigned) throw new Win32Exception(assignError);
            ReportJob(child.Handle, "java-after-own-job");
            input = new StreamWriter(child.StandardInput.BaseStream, new UTF8Encoding(false));
            input.AutoFlush = true;
            input.WriteLine("{\"id\":\"legacy-ready\",\"plugin\":\"ProDevice\",\"method\":\"getInfo\",\"options\":{}}");
            DateTime deadline = DateTime.UtcNow.AddSeconds(15);
            while (DateTime.UtcNow < deadline)
            {
                Need(!output.Exceeded && !error.Exceeded, "ENGINE_OUTPUT_LIMIT");
                string line;
                while (output.Take(out line))
                {
                    Dictionary<string, object> message = Json.DeserializeObject(line) as Dictionary<string, object>;
                    Need(message != null, "ENGINE_JSON_OBJECT_REQUIRED");
                    if (message.ContainsKey("host")) { ReplyToHost(input, message); continue; }
                    if (message.ContainsKey("event"))
                    {
                        if (Convert.ToString(message["event"]) == "Desktop:startupFailure")
                        {
                            Dictionary<string, object> detail = message["data"] as Dictionary<string, object>;
                            object[] types = detail != null && detail.ContainsKey("types") ? detail["types"] as object[] : null;
                            if (types != null) foreach (object type in types)
                            {
                                string name = Convert.ToString(type);
                                if (name.Length <= 200 && Regex.IsMatch(name, "^[A-Za-z0-9_.$/]+$")) Emit("java-startup-exception-type", "type", name);
                            }
                            throw new InvalidOperationException("ENGINE_STARTUP_FAILURE");
                        }
                        continue;
                    }
                    if (!message.ContainsKey("id") || Convert.ToString(message["id"]) != "legacy-ready") continue;
                    if (message.ContainsKey("error"))
                    {
                        string code = Convert.ToString(message["error"]);
                        if (Regex.IsMatch(code, "^[A-Z0-9_]{1,100}$")) Emit("ProDevice-getInfo-error", "code", code);
                        throw new InvalidOperationException("LEGACY_DEVICE_OPERATION_FAILED");
                    }
                    Dictionary<string, object> result = message.ContainsKey("result") ? message["result"] as Dictionary<string, object> : null;
                    ready = result != null && Convert.ToString(result["platform"]) == "windows"
                        && Convert.ToString(result["versionName"]) == "1.0.0-preview.29" && Convert.ToInt32(result["versionCode"]) == 29;
                    Emit("ProDevice-getInfo", "success", ready, "expectedVersion", "1.0.0-preview.29");
                    Need(ready, "EXACT_LEGACY_DEVICE_REPLY_REQUIRED");
                    break;
                }
                if (ready) break;
                if (child.HasExited) { Emit("engine-early-exit", "exitCode", child.ExitCode); break; }
                Thread.Sleep(20);
            }
            Need(ready, "ENGINE_DEVICE_READINESS_TIMEOUT_OR_EXIT");
            input.Close(); input = null;
            Need(child.WaitForExit(2000), "ENGINE_EOF_SHUTDOWN_TIMEOUT");
            Need(output.Join() && error.Join(), "ENGINE_READERS_DID_NOT_FINISH");
            Need(!output.Exceeded && !error.Exceeded, "ENGINE_OUTPUT_LIMIT");
            Emit("engine-after-EOF", "success", child.ExitCode == 0, "exitCode", child.ExitCode);
            Need(child.ExitCode == 0, "ENGINE_EXIT_FAILED");
        }
        finally
        {
            try
            {
                if (input != null)
                {
                    try { input.Dispose(); }
                    catch (Exception closeError) { Emit("engine-input-close", "success", false, "exceptionType", closeError.GetType().FullName); }
                }
            }
            finally
            {
                try { StopJava(child); }
                finally
                {
                    if (job != IntPtr.Zero) CloseHandle(job);
                    try
                    {
                        if (output != null) output.Join(); // Never print protocol payloads.
                        if (error != null) { error.Join(); PrintCapture("engine-stderr", error); }
                    }
                    finally { if (child != null) child.Dispose(); }
                }
            }
        }
    }

    private static void ReplyToHost(StreamWriter input, Dictionary<string, object> message)
    {
        string method = Convert.ToString(message["method"]);
        Dictionary<string, object> options = message.ContainsKey("options") ? message["options"] as Dictionary<string, object> : null;
        Dictionary<string, object> result = new Dictionary<string, object>();
        if (method == "metered")
        {
            Emit("host-callback", "method", "metered", "classification", "unsupported-inconclusive");
            throw new InvalidOperationException("UNSUPPORTED_HOST_CALLBACK");
        }
        else
        {
            if (method != "protect" && method != "unprotect")
            {
                Emit("host-callback", "method", Regex.IsMatch(method, "^[A-Za-z]{1,32}$") ? method : "unrecognized",
                    "classification", "unsupported-inconclusive");
                throw new InvalidOperationException("UNSUPPORTED_HOST_CALLBACK");
            }
            Need(options != null, "HOST_CALLBACK_OPTIONS_REQUIRED");
            string encoded = Convert.ToString(options["data"]), binding = Convert.ToString(options["binding"]);
            Need(encoded.Length <= 16384 && binding.Length <= 4096, "HOST_CALLBACK_SIZE_LIMIT");
            byte[] bytes = Convert.FromBase64String(encoded);
            byte[] entropy = Encoding.UTF8.GetBytes("private-brain-pro-windows|" + binding);
            byte[] transformed = null;
            try
            {
                transformed = method == "protect" ? ProtectedData.Protect(bytes, entropy, DataProtectionScope.CurrentUser)
                    : ProtectedData.Unprotect(bytes, entropy, DataProtectionScope.CurrentUser);
                result["data"] = Convert.ToBase64String(transformed);
                Emit("host-DPAPI", "success", true, "method", method, "scope", "CurrentUser");
            }
            finally
            {
                Array.Clear(bytes, 0, bytes.Length); Array.Clear(entropy, 0, entropy.Length);
                if (transformed != null) Array.Clear(transformed, 0, transformed.Length);
            }
        }
        input.WriteLine(Json.Serialize(new Dictionary<string, object> { { "replyTo", message["host"] }, { "result", result } }));
    }

    private static void ReportJob(IntPtr process, string label)
    {
        bool member;
        bool success = IsProcessInJob(process, IntPtr.Zero, out member);
        int error = success ? 0 : Marshal.GetLastWin32Error();
        Emit("IsProcessInJob", "label", label, "success", success, "win32", error, "inAnyJob", success ? (object)member : null);
    }

    private static void StopJava(Process child)
    {
        if (child == null) return;
        try { child.StandardInput.Close(); } catch { }
        if (!child.HasExited && !child.WaitForExit(500))
        {
            child.Kill();
            Need(child.WaitForExit(2000), "OWN_JAVA_PROCESS_DID_NOT_STOP");
        }
    }

    private static void PrintCapture(string label, Capture capture)
    {
        string text = capture.Text();
        if (text.Length > 4096) text = text.Substring(text.Length - 4096);
        Emit("bounded-native-output", "label", label, "observedBytes", capture.Observed, "overflow", capture.Exceeded,
            "text", text);
    }

    private sealed class Capture
    {
        private readonly Stream Source;
        private readonly Thread Reader;
        private readonly bool Lines;
        private readonly MemoryStream Kept = new MemoryStream();
        private readonly Queue<string> Pending = new Queue<string>();
        private readonly object Gate = new object();
        internal volatile bool Exceeded;
        internal int Observed;
        internal Capture(Stream source, bool lines)
        {
            Source = source; Lines = lines;
            Reader = new Thread(Read); Reader.IsBackground = true; Reader.Start();
        }
        private void Read()
        {
            try
            {
                byte[] buffer = new byte[1024];
                MemoryStream line = new MemoryStream();
                for (int n; (n = Source.Read(buffer, 0, buffer.Length)) > 0; )
                {
                    lock (Gate)
                    {
                        Observed = checked(Observed + n);
                        if (Observed > ByteLimit) { Exceeded = true; break; }
                        Kept.Write(buffer, 0, n);
                        if (Lines) for (int i = 0; i < n; i++)
                        {
                            if (buffer[i] == 10)
                            {
                                Pending.Enqueue(Encoding.UTF8.GetString(line.ToArray()).TrimEnd('\r'));
                                line.SetLength(0);
                            }
                            else line.WriteByte(buffer[i]);
                        }
                    }
                }
                line.Dispose();
            }
            catch (Exception) { Exceeded = true; }
        }
        internal bool Take(out string value)
        {
            lock (Gate) { value = Pending.Count > 0 ? Pending.Dequeue() : null; return value != null; }
        }
        internal bool Join() { return Reader.Join(500); }
        internal string Text() { lock (Gate) return Encoding.UTF8.GetString(Kept.ToArray()); }
    }

    private static int TokenDword(IntPtr token, int type)
    {
        uint value, length;
        if (!GetTokenDword(token, type, out value, 4, out length)) throw NativeFailure("GetTokenInformation-fixed");
        Need(length == 4, "TOKEN_DWORD_LENGTH"); return unchecked((int)value);
    }
    private static int Integrity(IntPtr token)
    {
        uint length;
        GetTokenBuffer(token, 25, IntPtr.Zero, 0, out length);
        Need(length > 0 && length <= ByteLimit, "TOKEN_INTEGRITY_BOUNDS");
        IntPtr data = Marshal.AllocHGlobal((int)length);
        try
        {
            if (!GetTokenBuffer(token, 25, data, length, out length)) throw NativeFailure("GetTokenInformation-integrity");
            IntPtr sid = Marshal.ReadIntPtr(data);
            Need(IsValidSid(sid), "VALID_INTEGRITY_SID_REQUIRED");
            byte count = Marshal.ReadByte(GetSidSubAuthorityCount(sid));
            Need(count > 0, "INTEGRITY_RID_REQUIRED");
            return Marshal.ReadInt32(GetSidSubAuthority(sid, (uint)(count - 1)));
        }
        finally { Marshal.FreeHGlobal(data); }
    }

    [StructLayout(LayoutKind.Sequential)] private struct BasicLimits
    {
        internal long PerProcessUserTimeLimit, PerJobUserTimeLimit;
        internal uint LimitFlags;
        internal UIntPtr MinimumWorkingSetSize, MaximumWorkingSetSize;
        internal uint ActiveProcessLimit;
        internal UIntPtr Affinity;
        internal uint PriorityClass, SchedulingClass;
    }
    [StructLayout(LayoutKind.Sequential)] private struct IoCounters
    {
        internal ulong ReadOperationCount, WriteOperationCount, OtherOperationCount;
        internal ulong ReadTransferCount, WriteTransferCount, OtherTransferCount;
    }
    [StructLayout(LayoutKind.Sequential)] private struct ExtendedLimits
    {
        internal BasicLimits Basic;
        internal IoCounters Io;
        internal UIntPtr ProcessMemoryLimit, JobMemoryLimit, PeakProcessMemoryUsed, PeakJobMemoryUsed;
    }
    [DllImport("kernel32.dll")] private static extern IntPtr GetCurrentProcess();
    [DllImport("kernel32.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool CreatePipe(out IntPtr read, out IntPtr write, IntPtr security, uint size);
    [DllImport("kernel32.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool DuplicateHandle(IntPtr sourceProcess, IntPtr source, IntPtr targetProcess,
        out IntPtr target, uint access, [MarshalAs(UnmanagedType.Bool)] bool inherit, uint options);
    [DllImport("kernel32.dll", EntryPoint = "CreateFileW", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern IntPtr OpenFile(string path, uint access, uint share, IntPtr security, uint disposition, uint flags, IntPtr template);
    [DllImport("kernel32.dll", SetLastError = true)] private static extern IntPtr OpenProcess(uint access, [MarshalAs(UnmanagedType.Bool)] bool inherit, uint processId);
    [DllImport("advapi32.dll", SetLastError = true)] private static extern uint GetSecurityInfo(IntPtr handle, int type, uint information,
        out IntPtr owner, out IntPtr group, out IntPtr dacl, out IntPtr sacl, out IntPtr descriptor);
    [DllImport("kernel32.dll")] private static extern IntPtr LocalFree(IntPtr memory);
    [DllImport("kernel32.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool IsProcessInJob(IntPtr process, IntPtr job, [MarshalAs(UnmanagedType.Bool)] out bool result);
    [DllImport("kernel32.dll", EntryPoint = "QueryInformationJobObject", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool QueryJobUi(IntPtr job, int type, ref uint value, uint size, out uint length);
    [DllImport("kernel32.dll", EntryPoint = "QueryInformationJobObject", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool QueryJobLimits(IntPtr job, int type, ref ExtendedLimits value, uint size, out uint length);
    [DllImport("kernel32.dll", EntryPoint = "CreateJobObjectW", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern IntPtr CreateJobObject(IntPtr security, string name);
    [DllImport("kernel32.dll", EntryPoint = "SetInformationJobObject", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool SetJobLimits(IntPtr job, int type, ref ExtendedLimits value, uint size);
    [DllImport("kernel32.dll", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool AssignProcessToJobObject(IntPtr job, IntPtr process);
    [DllImport("kernel32.dll")] [return: MarshalAs(UnmanagedType.Bool)] private static extern bool CloseHandle(IntPtr handle);
    [DllImport("bcrypt.dll")] private static extern int BCryptGenRandom(IntPtr algorithm, byte[] buffer, int count, uint flags);
    [DllImport("advapi32.dll", EntryPoint = "GetTokenInformation", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool GetTokenDword(IntPtr token, int type, out uint value, uint size, out uint length);
    [DllImport("advapi32.dll", EntryPoint = "GetTokenInformation", SetLastError = true)] [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool GetTokenBuffer(IntPtr token, int type, IntPtr value, uint size, out uint length);
    [DllImport("advapi32.dll")] [return: MarshalAs(UnmanagedType.Bool)] private static extern bool IsValidSid(IntPtr sid);
    [DllImport("advapi32.dll")] private static extern IntPtr GetSidSubAuthorityCount(IntPtr sid);
    [DllImport("advapi32.dll")] private static extern IntPtr GetSidSubAuthority(IntPtr sid, uint index);
}

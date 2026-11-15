Add-Type -TypeDefinition @'
using System; using System.Collections.Generic; using System.Runtime.InteropServices; using System.Text;
[Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAudioEndpointVolume { int f(); int g(); int h(); int i();
 int SetMasterVolumeLevelScalar(float level, Guid ctx); int j(); int GetMasterVolumeLevelScalar(out float level);
 int k(); int l(); int m(); int n(); int SetMute([MarshalAs(UnmanagedType.Bool)] bool mute, Guid ctx); int GetMute(out bool mute); }
[StructLayout(LayoutKind.Sequential)] struct PropKey { public Guid fmtid; public int pid; }
[StructLayout(LayoutKind.Sequential)] struct PropVariant { public ushort vt; public ushort r1, r2, r3; public IntPtr p; public IntPtr p2; }
[Guid("886d8eeb-8cf2-4446-8d02-cdba1dbdcf99"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IPropertyStore { int GetCount(out int c); int GetAt(int i, out PropKey k); int GetValue(ref PropKey k, out PropVariant v); }
[Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDevice { int Activate(ref Guid id, int ctx, IntPtr p, [MarshalAs(UnmanagedType.IUnknown)] out object o);
 int OpenPropertyStore(int a, out IPropertyStore s); int GetId([MarshalAs(UnmanagedType.LPWStr)] out string id); }
[Guid("0BD7A1BE-7A1A-44DB-8397-CC5392387B5E"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDeviceCollection { int GetCount(out int n); int Item(int i, out IMMDevice d); }
[Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDeviceEnumerator { int EnumAudioEndpoints(int flow, int mask, out IMMDeviceCollection c); int GetDefaultAudioEndpoint(int flow, int role, out IMMDevice dev); }
[Guid("77AA99A0-1BD6-484F-8BC7-2C654C9A9B6F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAudioSessionManager2 { int f(); int g(); int GetSessionEnumerator(out IAudioSessionEnumerator e); }
[Guid("E2F5BB11-0570-40CA-ACDD-3AA01277DEE8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAudioSessionEnumerator { int GetCount(out int n); int GetSession(int i, out IAudioSessionControl2 s); }
[Guid("bfb7ff88-7239-4fc9-8fa2-07c950be9c6d"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAudioSessionControl2 { int GetState(out int s); int a(); int b(); int c(); int d(); int e(); int f(); int g(); int h();
 int GetSessionIdentifier(out IntPtr s); int GetSessionInstanceIdentifier(out IntPtr s); int GetProcessId(out uint pid); }
[Guid("87CE5498-68D6-44E5-9215-6DA47EF883D8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface ISimpleAudioVolume { int SetMasterVolume(float level, ref Guid ctx); int GetMasterVolume(out float level);
 int SetMute([MarshalAs(UnmanagedType.Bool)] bool mute, ref Guid ctx); int GetMute([MarshalAs(UnmanagedType.Bool)] out bool mute); }
// Undocumented but stable since Windows 7: the only way to change the default device.
[Guid("F8679F50-850A-41CF-9C72-430F290290C8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IPolicyConfig { int a(); int b(); int c(); int d(); int e(); int f(); int g(); int h(); int i(); int j();
 int SetDefaultEndpoint([MarshalAs(UnmanagedType.LPWStr)] string id, int role); }
[ComImport, Guid("870AF99C-171D-4F9E-AF0D-E63DF40C2BC9")] class PolicyConfigClient { }
[ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")] class MMDeviceEnumerator { }
public static class LDAudio {
 [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
 [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
 [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
 [DllImport("ole32.dll")] static extern int PropVariantClear(ref PropVariant v);

 static string Esc(string s) { if (s == null) return ""; var b = new StringBuilder();
  foreach (var ch in s) { if (ch == '"' || ch == '\\') b.Append('\\').Append(ch); else if (ch < ' ') b.Append(' '); else b.Append(ch); }
  return b.ToString(); }
 static string Fail(Exception ex) { return "{\"ok\":false,\"error\":\"" + Esc(ex.Message) + "\"}"; }

 static IAudioEndpointVolume Ep(int flow) {
  var e = (IMMDeviceEnumerator)(new MMDeviceEnumerator()); IMMDevice d;
  Marshal.ThrowExceptionForHR(e.GetDefaultAudioEndpoint(flow, 0, out d));
  return Act(d); }
 public static string State(int flow) { try { var ep = Ep(flow); float v; bool m; ep.GetMasterVolumeLevelScalar(out v); ep.GetMute(out m);
  foreach (var other in Defaults(flow)) { bool om; other.GetMute(out om); m = m && om; }
  return "{\"ok\":true,\"level\":" + Math.Round(v*100) + ",\"muted\":" + (m ? "true" : "false") + "}"; } catch (Exception ex) { return Fail(ex); } }
 static IAudioEndpointVolume Act(IMMDevice d) { var id = typeof(IAudioEndpointVolume).GUID; object o;
  Marshal.ThrowExceptionForHR(d.Activate(ref id, 23, IntPtr.Zero, out o)); return (IAudioEndpointVolume)o; }
 // Every device Windows calls default for this flow: console, multimedia and
 // communications can be three different ones (e.g. the interface for games,
 // Voicemod for Discord). Muting only one of them lets the others through.
 static List<IAudioEndpointVolume> Defaults(int flow) {
  var e = (IMMDeviceEnumerator)(new MMDeviceEnumerator()); var seen = new HashSet<string>();
  var list = new List<IAudioEndpointVolume>();
  for (int role = 0; role < 3; role++) { IMMDevice d; if (e.GetDefaultAudioEndpoint(flow, role, out d) != 0 || d == null) continue;
   string id; d.GetId(out id); if (id == null || !seen.Add(id)) continue; list.Add(Act(d)); }
  return list; }
 public static string ToggleMute(int flow) {
  var all = Defaults(flow); if (all.Count == 0) return State(flow);
  // Mute everything unless everything already is; then unmute everything.
  bool allMuted = true; foreach (var ep in all) { bool m; ep.GetMute(out m); if (!m) allMuted = false; }
  foreach (var ep in all) ep.SetMute(!allMuted, Guid.Empty);
  return State(flow); }
 public static string Step(int flow, float delta) { var ep = Ep(flow); float v; ep.GetMasterVolumeLevelScalar(out v); ep.SetMasterVolumeLevelScalar(Math.Max(0f, Math.Min(1f, v + delta)), Guid.Empty); return State(flow); }

 // ---------------------------------------------------------------- devices

 static string Name(IMMDevice d) {
  IPropertyStore s; if (d.OpenPropertyStore(0, out s) != 0 || s == null) return "";
  var key = new PropKey { fmtid = new Guid("a45c254e-df1c-4efd-8020-67d146a850e0"), pid = 14 }; PropVariant v;
  if (s.GetValue(ref key, out v) != 0) return "";
  string name = v.vt == 31 ? Marshal.PtrToStringUni(v.p) : ""; PropVariantClear(ref v); return name; }
 /** Every active device of this flow: [{id, name, default}]. */
 public static string Devices(int flow) {
  try { var e = (IMMDeviceEnumerator)(new MMDeviceEnumerator()); IMMDevice def; string defId = "";
   if (e.GetDefaultAudioEndpoint(flow, 0, out def) == 0 && def != null) def.GetId(out defId);
   IMMDeviceCollection c; Marshal.ThrowExceptionForHR(e.EnumAudioEndpoints(flow, 1, out c)); int n; c.GetCount(out n);
   var b = new StringBuilder("{\"ok\":true,\"devices\":[");
   for (int i = 0; i < n; i++) { IMMDevice d; if (c.Item(i, out d) != 0) continue; string id; d.GetId(out id);
    if (b[b.Length - 1] != '[') b.Append(',');
    b.Append("{\"id\":\"").Append(Esc(id)).Append("\",\"name\":\"").Append(Esc(Name(d))).Append("\",\"default\":").Append(id == defId ? "true" : "false").Append('}'); }
   return b.Append("]}").ToString(); } catch (Exception ex) { return Fail(ex); } }
 /** Makes a device the default for every role (console, multimedia, communications). */
 public static string SetDefault(string id) {
  try { var p = (IPolicyConfig)(new PolicyConfigClient()); for (int role = 0; role < 3; role++) Marshal.ThrowExceptionForHR(p.SetDefaultEndpoint(id, role));
   return "{\"ok\":true}"; } catch (Exception ex) { return Fail(ex); } }

 // ---------------------------------------------------------------- apps

 // An app's own audio sessions, on every active device of this flow. An app
 // like Discord records from whatever device is picked inside it (not
 // necessarily a Windows default), and muting its session there silences
 // just that app. `processes` is a comma list of process names; "@fg" means
 // whatever app is in front (usually the game), and `name` then says which.
 static List<ISimpleAudioVolume> Sessions(string processes, int flow, out string name) {
  var list = new List<ISimpleAudioVolume>(); var names = new Dictionary<uint, string>(); name = "";
  var wanted = new HashSet<string>(StringComparer.OrdinalIgnoreCase); uint fgPid = 0;
  foreach (var p in processes.Split(',')) if (p.Trim().Length > 0) wanted.Add(p.Trim());
  if (wanted.Contains("@fg")) { var h = GetForegroundWindow(); GetWindowThreadProcessId(h, out fgPid);
   var t = new StringBuilder(256); GetWindowText(h, t, 256); name = t.ToString(); }
  var e = (IMMDeviceEnumerator)(new MMDeviceEnumerator()); IMMDeviceCollection c;
  if (e.EnumAudioEndpoints(flow, 1, out c) != 0) return list; int n; c.GetCount(out n);
  for (int i = 0; i < n; i++) { IMMDevice d; if (c.Item(i, out d) != 0) continue;
   var g = typeof(IAudioSessionManager2).GUID; object o; if (d.Activate(ref g, 23, IntPtr.Zero, out o) != 0) continue;
   IAudioSessionEnumerator se; if (((IAudioSessionManager2)o).GetSessionEnumerator(out se) != 0) continue; int k; se.GetCount(out k);
   for (int j = 0; j < k; j++) { IAudioSessionControl2 s; if (se.GetSession(j, out s) != 0) continue; uint pid; s.GetProcessId(out pid);
    if (pid == 0) continue; string pname;
    if (!names.TryGetValue(pid, out pname)) { try { pname = System.Diagnostics.Process.GetProcessById((int)pid).ProcessName; } catch { pname = ""; } names[pid] = pname; }
    if (wanted.Contains(pname) || (fgPid != 0 && pid == fgPid)) list.Add((ISimpleAudioVolume)s); } }
  return list; }
 static bool AllMuted(List<ISimpleAudioVolume> all) { if (all.Count == 0) return false; foreach (var s in all) { bool m; s.GetMute(out m); if (!m) return false; } return true; }
 static string AppJson(List<ISimpleAudioVolume> all, string name) {
  float level = 0; foreach (var s in all) { float v; s.GetMasterVolume(out v); level = Math.Max(level, v); }
  return "{\"ok\":true,\"found\":" + (all.Count > 0 ? "true" : "false") + ",\"muted\":" + (AllMuted(all) ? "true" : "false") +
   ",\"level\":" + Math.Round(level * 100) + ",\"name\":\"" + Esc(name) + "\"}"; }
 /** The app's sessions in this flow (0 = sound, 1 = microphone): found, all muted, level. */
 public static string AppState(string processes, int flow) {
  try { string name; var all = Sessions(processes, flow, out name); return AppJson(all, name); } catch (Exception ex) { return Fail(ex); } }
 /** Mutes the app's sessions in the given flows unless all of the first flow already are; then unmutes them. */
 public static string AppToggle(string processes, int flow, bool both) {
  try { string name; var first = Sessions(processes, flow, out name); if (first.Count == 0) return AppJson(first, name);
   bool mute = !AllMuted(first); var all = new List<ISimpleAudioVolume>(first); string other; if (both) all.AddRange(Sessions(processes, 1 - flow, out other));
   var ctx = Guid.Empty; foreach (var s in all) s.SetMute(mute, ref ctx);
   return AppJson(first, name); } catch (Exception ex) { return Fail(ex); } }
 /** Moves the app's volume by `delta` (-1…1); turning it up also unmutes. */
 public static string AppStep(string processes, float delta) {
  try { string name; var all = Sessions(processes, 0, out name); if (all.Count == 0) return AppJson(all, name);
   float level = 0; foreach (var s in all) { float v; s.GetMasterVolume(out v); level = Math.Max(level, v); }
   float next = Math.Max(0f, Math.Min(1f, level + delta)); var ctx = Guid.Empty;
   foreach (var s in all) { s.SetMasterVolume(next, ref ctx); if (delta > 0) s.SetMute(false, ref ctx); }
   return AppJson(all, name); } catch (Exception ex) { return Fail(ex); } }
}
'@

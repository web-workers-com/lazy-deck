# Screen brightness: DDC/CI for external monitors (what Twinkle Tray uses),
# WMI for laptop panels. Both are slow (up to ~0.5 s per monitor), so callers
# step in bigger chunks and do not poll often.
Add-Type -TypeDefinition @'
using System; using System.Collections.Generic; using System.Runtime.InteropServices;
public static class LDDisplay {
 [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)] struct PM { public IntPtr h; [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 128)] public string d; }
 delegate bool MonEnum(IntPtr m, IntPtr dc, IntPtr r, IntPtr p);
 [DllImport("user32.dll")] static extern bool EnumDisplayMonitors(IntPtr dc, IntPtr clip, MonEnum f, IntPtr p);
 [DllImport("dxva2.dll")] static extern bool GetNumberOfPhysicalMonitorsFromHMONITOR(IntPtr m, out uint n);
 [DllImport("dxva2.dll")] static extern bool GetPhysicalMonitorsFromHMONITOR(IntPtr m, uint n, [Out] PM[] a);
 [DllImport("dxva2.dll")] static extern bool DestroyPhysicalMonitors(uint n, PM[] a);
 [DllImport("dxva2.dll")] static extern bool GetMonitorBrightness(IntPtr h, out uint min, out uint cur, out uint max);
 [DllImport("dxva2.dll")] static extern bool SetMonitorBrightness(IntPtr h, uint v);
 /** Reads every DDC monitor and, with `delta` != 0, moves it. Returns [count, average percent]. */
 public static int[] Step(int delta) {
  var mons = new List<IntPtr>();
  EnumDisplayMonitors(IntPtr.Zero, IntPtr.Zero, (m, dc, r, p) => { mons.Add(m); return true; }, IntPtr.Zero);
  int count = 0, sum = 0;
  foreach (var m in mons) { uint n; if (!GetNumberOfPhysicalMonitorsFromHMONITOR(m, out n) || n == 0) continue;
   var a = new PM[n]; if (!GetPhysicalMonitorsFromHMONITOR(m, n, a)) continue;
   foreach (var pm in a) { uint min, cur, max; if (!GetMonitorBrightness(pm.h, out min, out cur, out max) || max <= min) continue;
    int pct = (int)Math.Round((cur - min) * 100.0 / (max - min));
    if (delta != 0) { pct = Math.Max(0, Math.Min(100, pct + delta)); SetMonitorBrightness(pm.h, (uint)(min + Math.Round((max - min) * pct / 100.0))); }
    count++; sum += pct; }
   DestroyPhysicalMonitors(n, a); }
  return new int[] { count, count > 0 ? sum / count : -1 }; }
}
'@
function LDBrightness([int]$delta) {
 $r = [LDDisplay]::Step($delta); $count = $r[0]; $level = $r[1]
 try {
  $w = Get-CimInstance -Namespace root/WMI -ClassName WmiMonitorBrightness -ErrorAction Stop | Select-Object -First 1
  if ($w) {
   $p = [int]$w.CurrentBrightness
   if ($delta -ne 0) { $p = [Math]::Max(0, [Math]::Min(100, $p + $delta)); Get-CimInstance -Namespace root/WMI -ClassName WmiMonitorBrightnessMethods | Invoke-CimMethod -MethodName WmiSetBrightness -Arguments @{ Timeout = 1; Brightness = [byte]$p } | Out-Null }
   if ($count -eq 0) { $level = $p } else { $level = [int](($level * $count + $p) / ($count + 1)) }; $count++
  }
 } catch {}
 '{"ok":' + $(if ($count -gt 0) { 'true' } else { 'false' }) + ',"level":' + $level + ',"count":' + $count + '}'
}

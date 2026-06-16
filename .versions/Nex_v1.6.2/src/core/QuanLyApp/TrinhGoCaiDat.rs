#![allow(non_snake_case)]
#![allow(non_camel_case_types)]
use serde::Serialize;
use crate::HeThong::HUY_TIEN_TRINH;
use std::sync::atomic::Ordering;
use crate::LayThongTin::encode_ps_command;

#[derive(Serialize, Clone)]
pub struct ThongTinCapNhat {
    name: String,
    id: String,
    current: String,
    available: String,
}

#[tauri::command]
pub async fn KiemTraCapNhat() -> Vec<ThongTinCapNhat> {
    use std::process::Command;
    use std::os::windows::process::CommandExt;

    let output = Command::new("winget")
        .args(["upgrade", "--source", "winget", "--accept-source-agreements"])
        .creation_flags(0x08000000)
        .output();

    let output = match output {
        Ok(o) => o,
        Err(_) => return vec![],
    };

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    parse_winget_upgrade_output(&stdout)
}

fn parse_winget_upgrade_output(stdout: &str) -> Vec<ThongTinCapNhat> {
    let mut results = Vec::new();
    let cleaned = stdout
        .replace('\r', "\n")
        .chars()
        .map(|c| if c.is_ascii_graphic() || c == ' ' || c == '\n' || c == '\t' { c } else { ' ' })
        .collect::<String>();
    
    let lines: Vec<&str> = cleaned.split('\n').filter(|l| !l.trim().is_empty()).collect();
    
    let mut start_parsing = false;
    let mut col_positions: Option<(usize, usize, usize, usize)> = None; 

    for line in &lines {
        let trimmed = line.trim();
        
        if col_positions.is_none() {
            if let (Some(id_pos), Some(avail_pos)) = (line.find("Id"), line.find("Available")) {
                let ver_pos = line.find("Version").unwrap_or(id_pos + 2);
                col_positions = Some((id_pos, id_pos, ver_pos, avail_pos));
                continue;
            }
        }
        
        if col_positions.is_some() && !start_parsing
            && trimmed.chars().all(|c| c == '-' || c == ' ') && trimmed.contains('-') {
                start_parsing = true;
                continue;
            }
        
        if !start_parsing { continue; }
        
        if trimmed.contains("upgrades available") || trimmed.contains("nâng cấp") { continue; }
        
        if let Some((name_end, _id_start, ver_start, avail_start)) = col_positions {
            if line.len() > avail_start {
                let name = line[..name_end.min(line.len())].trim().to_string();
                let id = line[name_end..ver_start.min(line.len())].trim().to_string();
                let current = line[ver_start..avail_start.min(line.len())].trim().to_string();
                let available = line[avail_start..].trim().to_string();
                let available = available.split_whitespace().next().unwrap_or("").to_string();
                
                if !name.is_empty() && id.contains('.') && !available.is_empty() {
                    results.push(ThongTinCapNhat { name, id, current, available });
                }
            }
        }
    }
    
    results
}

#[tauri::command]
pub async fn LayPhanMemDaCai() -> Result<serde_json::Value, String> {
    use std::os::windows::process::CommandExt;
    
    let PsScript = r#"
        $ErrorActionPreference = 'SilentlyContinue'
        $apps = @()

        $paths = @(
            "HKLM:\Software\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*",
            "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*",
            "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*"
        )
        Get-ItemProperty $paths | Where-Object { $_.DisplayName -and $_.SystemComponent -ne 1 -and $_.ParentKeyName -eq $null } | ForEach-Object {
            $apps += [PSCustomObject]@{
                name = $_.DisplayName
                version = $_.DisplayVersion
                publisher = $_.Publisher
                installDate = $_.InstallDate
                size = [int]$_.EstimatedSize
                installLocation = $_.InstallLocation
                uninstallString = $_.UninstallString
                quietUninstallString = $_.QuietUninstallString
                registryKey = $_.PSPath
                appType = "win32"
            }
        }

        Get-AppxPackage -AllUsers | Where-Object { $_.SignatureKind -ne 'System' -and $_.IsFramework -eq $false } | ForEach-Object {
            $apps += [PSCustomObject]@{
                name = $_.Name
                version = $_.Version
                publisher = $_.Publisher
                installDate = ""
                size = 0
                installLocation = $_.InstallLocation
                uninstallString = $_.PackageFullName
                quietUninstallString = ""
                registryKey = ""
                appType = "uwp"
            }
        }

        $apps | ConvertTo-Json -Compress -Depth 2
    "#;
    let EncodedScript = encode_ps_command(PsScript);

    let Output = std::process::Command::new("powershell")
        .args(["-NoProfile", "-ExecutionPolicy", "Bypass", "-EncodedCommand", &EncodedScript])
        .creation_flags(0x08000000)
        .output()
        .map_err(|e| e.to_string())?;

    if Output.status.success() {
        let Stdout = String::from_utf8_lossy(&Output.stdout);
        if let Ok(mut JsonData) = serde_json::from_str::<serde_json::Value>(&Stdout) {
            if let Some(MangUngDung) = JsonData.as_array_mut() {
                let mut KetQua = Vec::new();
                for UngDung in MangUngDung.iter() {
                    let Ten = UngDung.get("name").and_then(|v| v.as_str()).unwrap_or("Unknown");
                    let PhienBan = UngDung.get("version").and_then(|v| v.as_str()).unwrap_or("");
                    let NhaPhatHanh = UngDung.get("publisher").and_then(|v| v.as_str()).unwrap_or("");
                    let NgayCai = UngDung.get("installDate").and_then(|v| v.as_str()).unwrap_or("");
                    let DungLuongKB = UngDung.get("size").and_then(|v| v.as_i64()).unwrap_or(0);
                    let ViTri = UngDung.get("installLocation").and_then(|v| v.as_str()).unwrap_or("");
                    
                    let UninstallStr = UngDung.get("uninstallString").and_then(|v| v.as_str()).unwrap_or("");
                    let QuietUninstallStr = UngDung.get("quietUninstallString").and_then(|v| v.as_str()).unwrap_or("");
                    let RegistryKey = UngDung.get("registryKey").and_then(|v| v.as_str()).unwrap_or("");
                    let AppType = UngDung.get("appType").and_then(|v| v.as_str()).unwrap_or("win32");

                    KetQua.push(serde_json::json!({
                        "name": Ten,
                        "version": PhienBan,
                        "publisher": NhaPhatHanh,
                        "installDate": NgayCai,
                        "size": DungLuongKB * 1024,
                        "installLocation": ViTri,
                        "uninstallString": UninstallStr,
                        "quietUninstallString": QuietUninstallStr,
                        "registryKey": RegistryKey,
                        "appType": AppType
                    }));
                }
                return Ok(serde_json::Value::Array(KetQua));
            } else {
                return Ok(serde_json::json!([]));
            }
        }
    }
    Ok(serde_json::json!([]))
}

#[tauri::command]
pub async fn TienHanhGoCaiDat(AppHandle: tauri::AppHandle, DanhSachApp: Vec<serde_json::Value>, TuyChon: serde_json::Value) -> Result<Vec<serde_json::Value>, String> {
    use tauri::Emitter;
    use std::process::Command;
    use std::os::windows::process::CommandExt;
    
    HUY_TIEN_TRINH.store(false, Ordering::Relaxed);
    let mut results = Vec::new();
    let show_progress = TuyChon.get("showProgress").and_then(|v| v.as_bool()).unwrap_or(false);

    for app in DanhSachApp {
        if HUY_TIEN_TRINH.load(Ordering::Relaxed) { break; }
        
        let app_name = app.get("name").and_then(|v| v.as_str()).unwrap_or("Unknown").to_string();
        let app_type = app.get("appType").and_then(|v| v.as_str()).unwrap_or("win32").to_string();
        let uninstall_string = app.get("uninstallString").and_then(|v| v.as_str()).unwrap_or("").to_string();
        let quiet_uninstall_string = app.get("quietUninstallString").and_then(|v| v.as_str()).unwrap_or("").to_string();
        let registry_key = app.get("registryKey").and_then(|v| v.as_str()).unwrap_or("").to_string();
        let silent = TuyChon.get("silent").and_then(|v| v.as_bool()).unwrap_or(true);

        if show_progress {
            let _ = AppHandle.emit("tien-trinh-go-cai-dat", serde_json::json!({
                "name": app_name,
                "status": "uninstalling",
                "percent": 50
            }));
        }

        let mut success = false;
        let mut error_msg = String::new();
        let mut is_missing = false;

        let child_res = if app_type == "uwp" {
            let mut cmd = Command::new("powershell");
            cmd.args(["-ExecutionPolicy", "Bypass", "-NoProfile", "-Command", &format!("Remove-AppxPackage -Package '{}' -AllUsers", uninstall_string)]);
            cmd.creation_flags(0x08000000);
            cmd.spawn()
        } else {
            let mut final_cmd = String::new();
            if silent && !quiet_uninstall_string.is_empty() {
                if quiet_uninstall_string.to_lowercase().contains(".exe") {
                    let mut parts = quiet_uninstall_string.split(".exe");
                    let base = format!("{}.exe", parts.next().unwrap_or("")).replace("\"", "");
                    if !std::path::Path::new(&base).exists() {
                        is_missing = true;
                    }
                }
                final_cmd = quiet_uninstall_string.clone();
            } else if !uninstall_string.is_empty() {
                let u_lower = uninstall_string.to_lowercase();
                if u_lower.contains("msiexec") {
                    if silent {
                        final_cmd = format!("{} /qn /norestart", uninstall_string);
                    } else {
                        final_cmd = uninstall_string.clone();
                    }
                } else {
                    let (base_cmd_clean, args) = if u_lower.contains(".exe") {
                        let mut parts = uninstall_string.split(".exe");
                        let b = format!("{}.exe", parts.next().unwrap_or(""));
                        let p = b.replace("\"", "");
                        if !std::path::Path::new(&p).exists() {
                            is_missing = true;
                        }
                        let a = parts.next().unwrap_or("").trim().to_string();
                        (p, a)
                    } else {
                        (uninstall_string.replace("\"", ""), String::new())
                    };
                    
                    if silent {
                        final_cmd = format!("\"{}\" /S /silent /verysilent /quiet /norestart {}", base_cmd_clean, args);
                    } else {
                        final_cmd = format!("\"{}\" {}", base_cmd_clean, args);
                    }
                }
            }

            if is_missing {
                Err(std::io::Error::new(std::io::ErrorKind::NotFound, "Uninstaller not found"))
            } else if !final_cmd.is_empty() {
                use std::os::windows::process::CommandExt;
                let temp_bat = std::env::temp_dir().join(format!("nex_uninst_{}.bat", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_millis()));
                let _ = std::fs::write(&temp_bat, format!("@echo off\r\n{}\r\nexit %errorlevel%", final_cmd));
                let ps_script = format!(
                    "$proc = Start-Process -FilePath '{}' -Wait -WindowStyle Hidden -PassThru -Verb RunAs; Remove-Item -Path '{}' -Force -ErrorAction SilentlyContinue; if ($proc) {{ exit $proc.ExitCode }} else {{ exit 1 }}",
                    temp_bat.to_string_lossy().replace("'", "''"), temp_bat.to_string_lossy().replace("'", "''")
                );
                let mut cmd = Command::new("powershell");
                cmd.args(["-ExecutionPolicy", "Bypass", "-NoProfile", "-Command", &ps_script]);
                cmd.creation_flags(0x08000000);
                cmd.spawn()
            } else {
                let mut cmd = Command::new("winget");
                cmd.args(["uninstall", "--name", &app_name, "--accept-source-agreements", "--disable-interactivity"]);
                if silent { cmd.arg("--silent"); } else { cmd.arg("--interactive"); }
                cmd.creation_flags(0x08000000);
                cmd.spawn()
            }
        };

        if is_missing {
            if !registry_key.is_empty() {
                let clean_script = format!(
                    "Remove-Item -Path '{}' -Recurse -Force -ErrorAction SilentlyContinue",
                    registry_key.replace("'", "''")
                );
                let _ = Command::new("powershell")
                    .args(["-ExecutionPolicy", "Bypass", "-NoProfile", "-Command", &clean_script])
                    .creation_flags(0x08000000)
                    .output();
            }
            success = true;
            error_msg = "Uninstaller not found. Cleaned up dead registry entry automatically.".to_string();
        } else if let Ok(mut child) = child_res {
            let mut ticks = 0;
            loop {
                if HUY_TIEN_TRINH.load(Ordering::Relaxed) {
                    let _ = child.kill();
                    error_msg = "Cancelled by user".to_string();
                    break;
                }
                if let Ok(Some(status)) = child.try_wait() {
                    let mut still_exists = false;
                    if app_type != "uwp" && !registry_key.is_empty() {
                        let mut wait_ticks = 0;
                        loop {
                            if HUY_TIEN_TRINH.load(Ordering::Relaxed) {
                                error_msg = "Người dùng đã bỏ qua hoặc huỷ gỡ cài đặt".to_string();
                                still_exists = true;
                                break;
                            }
                            
                            let check_script = format!("if (Test-Path '{}') {{ exit 1 }} else {{ exit 0 }}", registry_key.replace("'", "''"));
                            if let Ok(check_status) = Command::new("powershell").args(["-NoProfile", "-Command", &check_script]).creation_flags(0x08000000).status() {
                                if check_status.success() {
                                    still_exists = false;
                                    break;
                                }
                            }
                            
                            // Timeout after 15 minutes (15 * 60 = 900 seconds)
                            if wait_ticks >= 900 {
                                still_exists = true;
                                error_msg = "Hết thời gian chờ trình gỡ cài đặt".to_string();
                                break;
                            }
                            
                            std::thread::sleep(std::time::Duration::from_millis(1000));
                            wait_ticks += 1;
                            
                            if show_progress && wait_ticks % 2 == 0 {
                                let _ = AppHandle.emit("tien-trinh-go-cai-dat", serde_json::json!({
                                    "name": &app_name,
                                    "status": "waiting for uninstaller...",
                                    "percent": 95
                                }));
                            }
                        }
                    }

                    if still_exists {                        
                        success = false;
                        if error_msg.is_empty() {
                            error_msg = "Người dùng đã bỏ qua hoặc huỷ gỡ cài đặt".to_string();
                        }
                    } else {
                        success = true;
                    }
                    
                    if !success && error_msg.is_empty() { error_msg = format!("Exit code: {:?}", status.code()); }
                    break;
                }
                std::thread::sleep(std::time::Duration::from_millis(500));
                ticks += 1;
                if show_progress && ticks % 2 == 0 {
                    let fake_percent = std::cmp::min(95, 50 + ticks / 4);
                    let _ = AppHandle.emit("tien-trinh-go-cai-dat", serde_json::json!({
                        "name": &app_name,
                        "status": "uninstalling",
                        "percent": fake_percent
                    }));
                }
            }
        } else {
            error_msg = format!("Failed to start uninstaller: {:?}", child_res.err());
        }

        if show_progress {
            let status = if success { "done" } else { "error" };
            let _ = AppHandle.emit("tien-trinh-go-cai-dat", serde_json::json!({
                "name": app_name,
                "status": status,
                "percent": 100
            }));
        }

        results.push(serde_json::json!({
            "name": app_name,
            "success": success,
            "error": error_msg
        }));
    }

    Ok(results)
}

#[tauri::command]
pub async fn TienHanhCapNhat(AppHandle: tauri::AppHandle, DanhSachApp: Vec<serde_json::Value>, TuyChon: serde_json::Value) -> Result<Vec<serde_json::Value>, String> {
    use tauri::Emitter;
    use std::process::Command;
    use std::os::windows::process::CommandExt;
    
    HUY_TIEN_TRINH.store(false, Ordering::Relaxed);
    let mut results = Vec::new();
    let show_progress = TuyChon.get("showProgress").and_then(|v| v.as_bool()).unwrap_or(false);

    for app in DanhSachApp {
        if HUY_TIEN_TRINH.load(Ordering::Relaxed) { break; }
        
        let name = app.get("name").and_then(|v| v.as_str()).unwrap_or("Unknown").to_string();
        let id = app.get("id").and_then(|v| v.as_str()).unwrap_or(&name);

        if show_progress {
            let _ = AppHandle.emit("tien-trinh-cai-dat", serde_json::json!({
                "name": name,
                "status": "downloading",
                "percent": 50
            }));
        }

        let mut cmd = Command::new("winget");
        cmd.args(["upgrade", "--id", id, "--accept-package-agreements", "--accept-source-agreements"]);
        
        let silent = TuyChon.get("silent").and_then(|v| v.as_bool()).unwrap_or(true);
        if silent {
            cmd.args(["--silent", "--disable-interactivity"]);
        }

        cmd.creation_flags(0x08000000);
        let child_res = cmd.spawn();
        
        let mut success = false;
        let mut error_msg = String::new();

        if let Ok(mut child) = child_res {
            let mut ticks = 0;
            loop {
                if HUY_TIEN_TRINH.load(Ordering::Relaxed) {
                    let _ = child.kill();
                    error_msg = "Cancelled by user".to_string();
                    break;
                }
                if let Ok(Some(status)) = child.try_wait() {
                    if status.code() == Some(-1978335212) {
                        let mut fb_cmd = Command::new("winget");
                        fb_cmd.args(["install", "--id", id, "--accept-package-agreements", "--accept-source-agreements", "--force"]);
                        if silent { fb_cmd.args(["--silent", "--disable-interactivity"]); }
                        fb_cmd.creation_flags(0x08000000);
                        if let Ok(mut fb_child) = fb_cmd.spawn() {
                            loop {
                                if HUY_TIEN_TRINH.load(Ordering::Relaxed) {
                                    let _ = fb_child.kill();
                                    error_msg = "Cancelled by user".to_string();
                                    break;
                                }
                                if let Ok(Some(fb_status)) = fb_child.try_wait() {
                                    success = fb_status.success() || fb_status.code() == Some(-1978334975) || fb_status.code() == Some(3010);
                                    if !success { error_msg = format!("Exit code: {:?}", fb_status.code()); }
                                    break;
                                }
                                std::thread::sleep(std::time::Duration::from_millis(500));
                                ticks += 1;
                                if show_progress && ticks % 2 == 0 {
                                    let fake_percent = std::cmp::min(95, 50 + ticks / 4);
                                    let _ = AppHandle.emit("tien-trinh-cai-dat", serde_json::json!({
                                        "name": &name,
                                        "status": "installing (fallback)",
                                        "percent": fake_percent
                                    }));
                                }
                            }
                        } else {
                            error_msg = "Fallback start failed".to_string();
                        }
                    } else {
                        success = status.success() || status.code() == Some(-1978334975) || status.code() == Some(3010);
                        if !success { error_msg = format!("Exit code: {:?}", status.code()); }
                    }
                    break;
                }
                std::thread::sleep(std::time::Duration::from_millis(500));
                ticks += 1;
                if show_progress && ticks % 2 == 0 {
                    let fake_percent = std::cmp::min(95, 50 + ticks / 4);
                    let _ = AppHandle.emit("tien-trinh-cai-dat", serde_json::json!({
                        "name": &name,
                        "status": "downloading",
                        "percent": fake_percent
                    }));
                }
            }
        } else {
            error_msg = format!("Failed to start updater: {:?}", child_res.err());
        }

        if show_progress {
            let status = if success { "done" } else { "error" };
            let _ = AppHandle.emit("tien-trinh-cai-dat", serde_json::json!({
                "name": name,
                "status": status,
                "percent": 100
            }));
        }

        results.push(serde_json::json!({
            "name": name,
            "success": success,
            "error": error_msg
        }));
    }

    Ok(results)
}

#[tauri::command]
pub async fn QuetTanDuPhanMem(DanhSachApp: Vec<serde_json::Value>) -> Result<Vec<serde_json::Value>, String> {
    use std::process::Command;
    use std::os::windows::process::CommandExt;
    
    let mut ps_array = String::from("@(");
    for app in &DanhSachApp {
        let name = app.get("name").and_then(|v| v.as_str()).unwrap_or("").replace("'", "''");
        if !name.is_empty() && name.len() > 2 {
            ps_array.push_str(&format!("'{}',", name));
        }
    }
    if ps_array.ends_with(",") {
        ps_array.pop();
    }
    ps_array.push_str(")");

    let script = format!(r#"
        $ErrorActionPreference = 'SilentlyContinue'
        $appNames = {}
        $leftovers = @()

        foreach ($name in $appNames) {{
            if ([string]::IsNullOrWhiteSpace($name) -or $name.Length -le 3 -or $name -match "^(Microsoft|Windows|Update)$") {{ continue }}
            
            $safeNameMatch = "(?i)" + [regex]::Escape($name)

            $regPaths = @("HKCU:\Software", "HKLM:\Software", "HKLM:\Software\WOW6432Node")
            foreach ($path in $regPaths) {{
                Get-ChildItem -Path $path -ErrorAction SilentlyContinue | Where-Object {{ $_.PSChildName -match $safeNameMatch }} | ForEach-Object {{
                    $leftovers += [PSCustomObject]@{{ type = "registry"; path = $_.PSPath; appName = $name }}
                }}
            }}
            
            $folderPaths = @(
                $env:APPDATA, $env:LOCALAPPDATA, $env:ProgramFiles, ${{env:ProgramFiles(x86)}}, $env:ProgramData,
                [Environment]::GetFolderPath('Desktop'), [Environment]::GetFolderPath('MyDocuments')
            )
            foreach ($f in $folderPaths) {{
                if ([string]::IsNullOrWhiteSpace($f)) {{ continue }}
                Get-ChildItem -Path $f -Directory -ErrorAction SilentlyContinue | Where-Object {{ $_.Name -match $safeNameMatch }} | ForEach-Object {{
                    $leftovers += [PSCustomObject]@{{ type = "folder"; path = $_.FullName; appName = $name }}
                }}
            }}
        }}

        if ($leftovers.Length -eq 0) {{
            "[]"
        }} else {{
            $leftovers | Select-Object -Unique -Property path, type, appName | ConvertTo-Json -Compress -Depth 2
        }}
    "#, ps_array);

    let encoded_script = crate::LayThongTin::encode_ps_command(&script);
    let output = Command::new("powershell")
        .args(["-NoProfile", "-ExecutionPolicy", "Bypass", "-EncodedCommand", &encoded_script])
        .creation_flags(0x08000000)
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        if let Ok(json_val) = serde_json::from_str::<serde_json::Value>(&stdout) {
            if let Some(arr) = json_val.as_array() {
                return Ok(arr.clone());
            } else {
                return Ok(vec![json_val]); 
            }
        }
    }
    Ok(vec![])
}

#[tauri::command]
pub async fn XoaTanDuThucSu(DanhSachTanDu: Vec<serde_json::Value>) -> Result<bool, String> {
    use std::process::Command;
    use std::os::windows::process::CommandExt;

    let mut script = String::from("$ErrorActionPreference = 'SilentlyContinue';\n");
    for item in DanhSachTanDu {
        let p_type = item.get("type").and_then(|v| v.as_str()).unwrap_or("");
        let p_path = item.get("path").and_then(|v| v.as_str()).unwrap_or("").replace("'", "''");
        if p_path.is_empty() { continue; }

        if p_type == "registry" {
            script.push_str(&format!("Remove-Item -Path '{}' -Recurse -Force;\n", p_path));
        } else {
            script.push_str(&format!("Remove-Item -Path '{}' -Recurse -Force;\n", p_path));
        }
    }

    let encoded = crate::LayThongTin::encode_ps_command(&script);
    let _ = Command::new("powershell")
        .args(["-NoProfile", "-ExecutionPolicy", "Bypass", "-EncodedCommand", &encoded])
        .creation_flags(0x08000000)
        .output();

    Ok(true)
}

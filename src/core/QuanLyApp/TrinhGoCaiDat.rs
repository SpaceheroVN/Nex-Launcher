#![allow(non_snake_case)]
#![allow(non_camel_case_types)]
use serde::Serialize;
use crate::HeThong::HUY_TIEN_TRINH;
use std::sync::atomic::Ordering;


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
    let _guard = crate::HeThong::bat_uu_tien_cpu();
    
    use winreg::enums::*;
    use winreg::RegKey;
    use std::os::windows::process::CommandExt;

    let mut apps = Vec::new();

    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);

    let reg_paths = vec![
        (&hklm, r"Software\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall"),
        (&hklm, r"Software\Microsoft\Windows\CurrentVersion\Uninstall"),
        (&hkcu, r"Software\Microsoft\Windows\CurrentVersion\Uninstall"),
    ];

    for (root_key, path) in reg_paths {
        if let Ok(uninstall_key) = root_key.open_subkey(path) {
            for key_name in uninstall_key.enum_keys().filter_map(|k| k.ok()) {
                if let Ok(app_key) = uninstall_key.open_subkey(&key_name) {
                    let display_name: String = app_key.get_value("DisplayName").unwrap_or_default();
                    if display_name.is_empty() { continue; }

                    let system_component: u32 = app_key.get_value("SystemComponent").unwrap_or(0);
                    if system_component == 1 { continue; }

                    let parent_key: String = app_key.get_value("ParentKeyName").unwrap_or_default();
                    if !parent_key.is_empty() { continue; }

                    let version: String = app_key.get_value("DisplayVersion").unwrap_or_default();
                    let publisher: String = app_key.get_value("Publisher").unwrap_or_default();
                    let install_date: String = app_key.get_value("InstallDate").unwrap_or_default();
                    let size: u32 = app_key.get_value("EstimatedSize").unwrap_or(0);
                    let install_location: String = app_key.get_value("InstallLocation").unwrap_or_default();
                    let uninstall_string: String = app_key.get_value("UninstallString").unwrap_or_default();
                    let quiet_uninstall_string: String = app_key.get_value("QuietUninstallString").unwrap_or_default();
                    let display_icon: String = app_key.get_value("DisplayIcon").unwrap_or_default();
                    
                    let mut registry_key = String::new();
                    if root_key.raw_handle() == HKEY_LOCAL_MACHINE {
                        registry_key = format!(r"HKLM\{}\{}", path, key_name);
                    } else if root_key.raw_handle() == HKEY_CURRENT_USER {
                        registry_key = format!(r"HKCU\{}\{}", path, key_name);
                    }

                    apps.push(serde_json::json!({
                        "name": display_name,
                        "version": version,
                        "publisher": publisher,
                        "installDate": install_date,
                        "size": (size as u64) * 1024,
                        "installLocation": install_location,
                        "uninstallString": uninstall_string,
                        "quietUninstallString": quiet_uninstall_string,
                        "registryKey": registry_key,
                        "displayIcon": display_icon,
                        "appType": "win32"
                    }));
                }
            }
        }
    }

    
    let ps_script = r#"
        $ErrorActionPreference = 'SilentlyContinue'
        $apps = @()
        Get-AppxPackage -AllUsers | Where-Object { $_.SignatureKind -ne 'System' -and $_.IsFramework -eq $false } | ForEach-Object {
            $apps += [PSCustomObject]@{
                name = $_.Name
                version = $_.Version
                publisher = $_.Publisher
                installLocation = $_.InstallLocation
                uninstallString = $_.PackageFullName
            }
        }
        $apps | ConvertTo-Json -Compress
    "#;
    let encoded_script = crate::LayThongTin::encode_ps_command(ps_script);
    if let Ok(output) = std::process::Command::new("powershell")
        .args(["-NoProfile", "-ExecutionPolicy", "Bypass", "-EncodedCommand", &encoded_script])
        .creation_flags(0x08000000)
        .output() {
        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            if let Ok(json_data) = serde_json::from_str::<serde_json::Value>(&stdout) {
                if let Some(arr) = json_data.as_array() {
                    for app in arr {
                        let ten = app.get("name").and_then(|v| v.as_str()).unwrap_or("Unknown");
                        let phien_ban = app.get("version").and_then(|v| v.as_str()).unwrap_or("");
                        let nha_phat_hanh = app.get("publisher").and_then(|v| v.as_str()).unwrap_or("");
                        let vi_tri = app.get("installLocation").and_then(|v| v.as_str()).unwrap_or("");
                        let uninstall_str = app.get("uninstallString").and_then(|v| v.as_str()).unwrap_or("");

                        apps.push(serde_json::json!({
                            "name": ten,
                            "version": phien_ban,
                            "publisher": nha_phat_hanh,
                            "installDate": "",
                            "size": 0,
                            "installLocation": vi_tri,
                            "uninstallString": uninstall_str,
                            "quietUninstallString": "",
                            "registryKey": "",
                            "appType": "uwp"
                        }));
                    }
                } else if json_data.is_object() {
                    
                    let ten = json_data.get("name").and_then(|v| v.as_str()).unwrap_or("Unknown");
                    let phien_ban = json_data.get("version").and_then(|v| v.as_str()).unwrap_or("");
                    let nha_phat_hanh = json_data.get("publisher").and_then(|v| v.as_str()).unwrap_or("");
                    let vi_tri = json_data.get("installLocation").and_then(|v| v.as_str()).unwrap_or("");
                    let uninstall_str = json_data.get("uninstallString").and_then(|v| v.as_str()).unwrap_or("");

                    apps.push(serde_json::json!({
                        "name": ten,
                        "version": phien_ban,
                        "publisher": nha_phat_hanh,
                        "installDate": "",
                        "size": 0,
                        "installLocation": vi_tri,
                        "uninstallString": uninstall_str,
                        "quietUninstallString": "",
                        "registryKey": "",
                        "appType": "uwp"
                    }));
                }
            }
        }
    }

    Ok(serde_json::Value::Array(apps))
}

#[tauri::command]
pub async fn TienHanhGoCaiDat(AppHandle: tauri::AppHandle, DanhSachApp: Vec<serde_json::Value>, TuyChon: serde_json::Value) -> Result<Vec<serde_json::Value>, String> {
    use tauri::Emitter;
    use std::process::Command;
    use std::os::windows::process::CommandExt;
    
    let _guard = crate::HeThong::bat_uu_tien_cpu();
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

        let mut success;
        let mut error_msg;
        let mut is_missing;
        
        let mut force_interactive = false;
        let mut retry_count = 0;
        
        loop {
            let current_silent = if force_interactive { false } else { silent };
            is_missing = false;
            success = false;
            error_msg = String::new();

        let child_res = if app_type == "uwp" {
            let mut cmd = Command::new("powershell");
            cmd.args(["-ExecutionPolicy", "Bypass", "-NoProfile", "-Command", &format!("Remove-AppxPackage -Package '{}' -AllUsers", uninstall_string)]);
            cmd.creation_flags(0x08000000);
            cmd.spawn()
        } else {
            let mut final_cmd = String::new();
            if current_silent && !quiet_uninstall_string.is_empty() {
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
                    if current_silent {
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
                    
                    if current_silent {
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
                let app_id = app.get("id").and_then(|v| v.as_str()).unwrap_or(&app_name);
                let mut cmd = Command::new("winget");
                cmd.args(["uninstall", "--id", app_id, "--exact", "--accept-source-agreements", "--disable-interactivity"]);
                if current_silent { cmd.arg("--silent"); } else { cmd.arg("--interactive"); }
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
                    let pid = child.id();
                    let _ = Command::new("taskkill")
                        .args(["/F", "/T", "/PID", &pid.to_string()])
                        .creation_flags(0x08000000)
                        .output();
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
        
            if !success && current_silent && retry_count < 1 {
                force_interactive = true;
                retry_count += 1;
                continue;
            }
            break;
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
pub async fn QuetTanDuPhanMem(DanhSachApp: Vec<serde_json::Value>) -> Result<Vec<serde_json::Value>, String> {
    let _guard = crate::HeThong::bat_uu_tien_cpu();
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
    ps_array.push(')');

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
    let _guard = crate::HeThong::bat_uu_tien_cpu();
    use std::process::Command;
    use std::os::windows::process::CommandExt;

    let mut script = String::from("$ErrorActionPreference = 'SilentlyContinue';\n");
    for item in DanhSachTanDu {
        let p_path = item.get("path").and_then(|v| v.as_str()).unwrap_or("").replace("'", "''");
        if p_path.is_empty() { continue; }

        script.push_str(&format!("Remove-Item -Path '{}' -Recurse -Force;\n", p_path));
    }

    let encoded = crate::LayThongTin::encode_ps_command(&script);
    let _ = Command::new("powershell")
        .args(["-NoProfile", "-ExecutionPolicy", "Bypass", "-EncodedCommand", &encoded])
        .creation_flags(0x08000000)
        .output();

    Ok(true)
}

#[tauri::command]
pub async fn XoaDiemKhoiPhuc(sequenceNumber: u32) -> Result<bool, String> {
    use std::process::Command;
    use std::os::windows::process::CommandExt;

    let script = format!(
        "Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public class RestorePointHelper {{ [DllImport(\"Srclient.dll\")] public static extern int SRRemoveRestorePoint(int dwRPNum); }}' -Language CSharp; $r = [RestorePointHelper]::SRRemoveRestorePoint({}); if ($r -eq 0) {{ exit 0 }} else {{ exit 1 }}",
        sequenceNumber
    );
    let encoded = crate::LayThongTin::encode_ps_command(&script);
    let output = Command::new("powershell")
        .args(["-NoProfile", "-ExecutionPolicy", "Bypass", "-EncodedCommand", &encoded])
        .creation_flags(0x08000000)
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(true)
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        if stderr.is_empty() {
            Err("Không tìm thấy điểm khôi phục hoặc không đủ quyền".to_string())
        } else {
            Err(stderr)
        }
    }
}

#[tauri::command]
pub async fn LayDanhSachDiemKhoiPhuc() -> Result<Vec<serde_json::Value>, String> {
    use std::process::Command;
    use std::os::windows::process::CommandExt;

    let script = "Get-ComputerRestorePoint | Select-Object Description, CreationTime, SequenceNumber | ConvertTo-Json -Compress";
    let encoded = crate::LayThongTin::encode_ps_command(script);
    let output = Command::new("powershell")
        .args(["-NoProfile", "-ExecutionPolicy", "Bypass", "-EncodedCommand", &encoded])
        .creation_flags(0x08000000)
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if stdout.is_empty() {
            return Ok(vec![]);
        }
        let parsed: serde_json::Value = serde_json::from_str(&stdout).unwrap_or_else(|_| serde_json::json!([]));
        if let Some(arr) = parsed.as_array() {
            Ok(arr.clone())
        } else if parsed.is_object() {
            Ok(vec![parsed])
        } else {
            Ok(vec![])
        }
    } else {
        Err("Không có quyền Administrator hoặc tính năng Khôi phục hệ thống bị tắt.".to_string())
    }
}

#[tauri::command]
pub async fn TaoDiemKhoiPhuc(description: String) -> Result<bool, String> {
    use std::process::Command;
    use std::os::windows::process::CommandExt;

    let ps_cmd = format!("Checkpoint-Computer -Description '{}' -RestorePointType 'MODIFY_SETTINGS' -ErrorAction Stop", description.replace("'", "''"));
    let ps_encoded = crate::LayThongTin::encode_ps_command(&ps_cmd);
    let script = format!(
        "$proc = Start-Process powershell -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', '{}' -WindowStyle Hidden -PassThru -Verb RunAs -Wait; if ($proc -and $proc.ExitCode -ne 0) {{ exit $proc.ExitCode }}",
        ps_encoded
    );
    let encoded = crate::LayThongTin::encode_ps_command(&script);
    let output = Command::new("powershell")
        .args(["-NoProfile", "-ExecutionPolicy", "Bypass", "-EncodedCommand", &encoded])
        .creation_flags(0x08000000)
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(true)
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

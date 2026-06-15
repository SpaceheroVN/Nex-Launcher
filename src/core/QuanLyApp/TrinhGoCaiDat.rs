#![allow(non_snake_case)]
#![allow(non_camel_case_types)]
use serde::Serialize;
use crate::HeThong::HUY_TIEN_TRINH;
use std::sync::atomic::Ordering;
use crate::TienIch::encode_ps_command;

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
    let mut col_positions: Option<(usize, usize, usize, usize)> = None; // name_end, id_start, ver_start, avail_start

    for line in &lines {
        let trimmed = line.trim();
        
        // Tìm header line chứa "Id" và "Available"
        if col_positions.is_none() {
            if let (Some(id_pos), Some(avail_pos)) = (line.find("Id"), line.find("Available")) {
                let ver_pos = line.find("Version").unwrap_or(id_pos + 2);
                col_positions = Some((id_pos, id_pos, ver_pos, avail_pos));
                continue;
            }
        }
        
        // Tìm dòng separator (-----)
        if col_positions.is_some() && !start_parsing
            && trimmed.chars().all(|c| c == '-' || c == ' ') && trimmed.contains('-') {
                start_parsing = true;
                continue;
            }
        
        if !start_parsing { continue; }
        
        // Bỏ qua dòng summary cuối
        if trimmed.contains("upgrades available") || trimmed.contains("nâng cấp") { continue; }
        
        if let Some((name_end, _id_start, ver_start, avail_start)) = col_positions {
            if line.len() > avail_start {
                let name = line[..name_end.min(line.len())].trim().to_string();
                let id = line[name_end..ver_start.min(line.len())].trim().to_string();
                let current = line[ver_start..avail_start.min(line.len())].trim().to_string();
                let available = line[avail_start..].trim().to_string();
                // Filter: phải có "." trong id
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

        if app_type == "uwp" {
            let mut cmd = Command::new("powershell");
            cmd.args(["-ExecutionPolicy", "Bypass", "-NoProfile", "-Command", &format!("Remove-AppxPackage -Package '{}' -AllUsers", uninstall_string)]);
            cmd.creation_flags(0x08000000);
            if let Ok(output) = cmd.output() {
                success = output.status.success();
                if !success { error_msg = format!("UWP Remove failed: {:?}", output.status.code()); }
            }
        } else {
            let mut final_cmd = String::new();
            if silent && !quiet_uninstall_string.is_empty() {
                final_cmd = quiet_uninstall_string;
            } else if !uninstall_string.is_empty() {
                if silent {
                    let u_lower = uninstall_string.to_lowercase();
                    if u_lower.contains("msiexec") {
                        final_cmd = format!("{} /qn /norestart", uninstall_string);
                    } else {
                        let base_cmd = if u_lower.contains(".exe") {
                            let mut parts = uninstall_string.split(".exe");
                            format!("{}.exe", parts.next().unwrap_or(""))
                        } else {
                            uninstall_string.clone()
                        };
                        let base_cmd = base_cmd.replace("\"", "");
                        final_cmd = format!("\"{}\" /S /silent /verysilent /quiet /norestart", base_cmd);
                    }
                } else {
                    final_cmd = uninstall_string;
                }
            }

            if !final_cmd.is_empty() {
                let mut cmd = Command::new("cmd");
                cmd.args(["/C", &final_cmd]);
                cmd.creation_flags(0x08000000);
                if let Ok(output) = cmd.output() {
                    success = output.status.success() || output.status.code() == Some(-1978334975) || output.status.code() == Some(3010) || output.status.code() == Some(1641);
                    if !success { error_msg = format!("Native uninstall failed: {:?}", output.status.code()); }
                }
            } else {
                // Fallback to winget
                let mut cmd = Command::new("winget");
                cmd.args(["uninstall", "--name", &app_name, "--accept-source-agreements", "--disable-interactivity"]);
                if silent { cmd.arg("--silent"); } else { cmd.arg("--interactive"); }
                cmd.creation_flags(0x08000000);
                if let Ok(output) = cmd.output() {
                    success = output.status.success() || output.status.code() == Some(-1978334975) || output.status.code() == Some(3010) || output.status.code() == Some(1641);
                    if !success { error_msg = format!("Winget exit code: {:?}", output.status.code()); }
                }
            }
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
        let output = cmd.output().map_err(|e| e.to_string())?;
        
        let success = output.status.success() || output.status.code() == Some(-1978334975) || output.status.code() == Some(3010);
        let error_msg = if !success {
            format!("Winget exit code: {:?}", output.status.code())
        } else {
            String::new()
        };

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

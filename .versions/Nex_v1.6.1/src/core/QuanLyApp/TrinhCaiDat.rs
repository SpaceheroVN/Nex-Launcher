#![allow(non_snake_case)]
#![allow(non_camel_case_types)]
use crate::HeThong::HUY_TIEN_TRINH;
use std::sync::atomic::Ordering;

#[tauri::command]
pub async fn TienHanhCaiDat(AppHandle: tauri::AppHandle, DanhSachApp: Vec<serde_json::Value>, TuyChon: serde_json::Value) -> Result<Vec<serde_json::Value>, String> {
    use tauri::Emitter;
    use std::process::Command;
    use std::os::windows::process::CommandExt;
    
    HUY_TIEN_TRINH.store(false, Ordering::Relaxed);
    let mut results = Vec::new();
    let show_progress = TuyChon.get("showProgress").and_then(|v| v.as_bool()).unwrap_or(false);

    for app in DanhSachApp {
        if HUY_TIEN_TRINH.load(Ordering::Relaxed) { break; }
        
        let name = app.get("name").and_then(|v| v.as_str()).unwrap_or("Unknown").to_string();
        
        let source_obj = app.get("source");
        let source_type = source_obj.and_then(|s| s.get("type")).and_then(|v| v.as_str()).unwrap_or("Winget").to_string();
        let source_value = source_obj.and_then(|s| s.get("value")).and_then(|v| v.as_str()).unwrap_or(&name).to_string();
        let silent_args = source_obj.and_then(|s| s.get("silent_args")).and_then(|v| v.as_str()).unwrap_or("").to_string();
        let post_install_cmd = source_obj.and_then(|s| s.get("post_install_cmd")).and_then(|v| v.as_str()).unwrap_or("").to_string();
        
        if show_progress {
            let _ = AppHandle.emit("tien-trinh-cai-dat", serde_json::json!({
                "name": name,
                "status": "installing",
                "percent": 50
            }));
        }

        let silent = TuyChon.get("silent").and_then(|v| v.as_bool()).unwrap_or(true);
        let mut success = false;
        let mut error_msg = String::new();

        let child_res = if source_type == "Winget" {
            let mut cmd = Command::new("winget");
            cmd.args(["install", "--id", &source_value, "--accept-package-agreements", "--accept-source-agreements"]);
            if silent { cmd.arg("--silent"); }
            if !silent_args.is_empty() {
                cmd.args(silent_args.split_whitespace());
            }
            cmd.creation_flags(0x08000000);
            cmd.spawn()
        } else if source_type == "Package" {
            use std::os::windows::process::CommandExt;
            let mut cmd = Command::new("cmd");
            cmd.raw_arg("/C");
            cmd.raw_arg(format!("start /wait \"\" \"{}\" {}", source_value.replace("\"", ""), silent_args));
            cmd.creation_flags(0x08000000);
            cmd.spawn()
        } else if source_type == "Link" {
            let ps_script = format!(
                "$ErrorActionPreference = 'Stop'; \
                 $temp_file = Join-Path $env:TEMP 'nex_installer_{}_{}.exe'; \
                 Invoke-WebRequest -Uri '{}' -OutFile $temp_file; \
                 $proc = Start-Process -FilePath $temp_file -ArgumentList '{}' -Wait -PassThru -Verb RunAs; \
                 Remove-Item -Path $temp_file -Force -ErrorAction SilentlyContinue; \
                 if ($proc) {{ exit $proc.ExitCode }} else {{ exit 1 }}",
                name.replace(" ", "_").replace(|c: char| !c.is_alphanumeric() && c != '_', ""),
                std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_millis(),
                source_value.replace("'", "''"),
                silent_args.replace("'", "''")
            );
            
            let mut cmd = Command::new("powershell");
            cmd.args(["-ExecutionPolicy", "Bypass", "-NoProfile", "-Command", &ps_script]);
            cmd.creation_flags(0x08000000);
            cmd.spawn()
        } else {
            Err(std::io::Error::new(std::io::ErrorKind::Other, "Unknown source type"))
        };

        if let Ok(mut child) = child_res {
            let mut ticks = 0;
            loop {
                if HUY_TIEN_TRINH.load(Ordering::Relaxed) {
                    let _ = child.kill();
                    error_msg = "Cancelled by user".to_string();
                    break;
                }
                if let Ok(Some(status)) = child.try_wait() {
                    success = status.success() || status.code() == Some(-1978334975) || status.code() == Some(-1978335189) || status.code() == Some(3010) || status.code() == Some(1638);
                    if !success { error_msg = format!("Exit code: {:?}", status.code()); }
                    break;
                }
                std::thread::sleep(std::time::Duration::from_millis(500));
                ticks += 1;
                if show_progress && ticks % 2 == 0 {
                    let fake_percent = std::cmp::min(95, 50 + ticks / 4);
                    let _ = AppHandle.emit("tien-trinh-cai-dat", serde_json::json!({
                        "name": &name,
                        "status": "installing",
                        "percent": fake_percent
                    }));
                }
            }

            if success && !post_install_cmd.is_empty() {
                let _ = Command::new("powershell")
                    .args(["-ExecutionPolicy", "Bypass", "-NoProfile", "-Command", &post_install_cmd])
                    .creation_flags(0x08000000)
                    .spawn()
                    .and_then(|mut c| c.wait());
            }
        } else {
            error_msg = child_res.err().map(|e| e.to_string()).unwrap_or_else(|| "Unknown start error".to_string());
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
pub async fn TimKiemWinget(TuKhoa: String) -> Vec<serde_json::Value> {
    use std::process::Command;
    use std::os::windows::process::CommandExt;
    
    let output = Command::new("winget")
        .args(["search", &TuKhoa, "--source", "winget", "--accept-source-agreements"])
        .creation_flags(0x08000000)
        .output();
    
    let output = match output {
        Ok(o) => o,
        Err(_) => return vec![],
    };
    
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let cleaned = stdout
        .replace('\r', "\n")
        .chars()
        .map(|c| if c.is_ascii_graphic() || c == ' ' || c == '\n' || c == '\t' { c } else { ' ' })
        .collect::<String>();
    
    let lines: Vec<&str> = cleaned.split('\n').filter(|l| !l.trim().is_empty()).collect();
    let mut results = Vec::new();
    let mut start_parsing = false;
    let mut col_positions: Option<(usize, usize)> = None; 
    
    for line in &lines {
        let trimmed = line.trim();
        
        if col_positions.is_none() {
            if let Some(id_pos) = line.find("Id") {
                let ver_pos = line.find("Version").unwrap_or(line.len());
                col_positions = Some((id_pos, ver_pos));
                continue;
            }
        }
        
        if col_positions.is_some() && !start_parsing
            && trimmed.chars().all(|c| c == '-' || c == ' ') && trimmed.contains('-') {
                start_parsing = true;
                continue;
            }
        
        if !start_parsing { continue; }
        
        if let Some((id_start, _ver_start)) = col_positions {
            if line.len() > id_start {
                let name = line[..id_start.min(line.len())].trim().to_string();
                let rest = line[id_start..].trim().to_string();
                let id = rest.split_whitespace().next().unwrap_or("").to_string();
                
                if !name.is_empty() && !id.is_empty() && id != "winget" && id.contains('.') {
                    results.push(serde_json::json!({
                        "name": name,
                        "id": id
                    }));
                }
            }
        }
        
        if results.len() >= 10 { break; }
    }
    
    results
}

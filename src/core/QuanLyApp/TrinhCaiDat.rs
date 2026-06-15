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

        if source_type == "Winget" {
            let mut cmd = Command::new("winget");
            cmd.args(["install", "--id", &source_value, "--accept-package-agreements", "--accept-source-agreements"]);
            if silent { cmd.arg("--silent"); }
            cmd.creation_flags(0x08000000);
            
            if let Ok(output) = cmd.output() {
                success = output.status.success() || output.status.code() == Some(-1978334975) || output.status.code() == Some(3010);
                if !success { error_msg = format!("Winget exit code: {:?}", output.status.code()); }
            }
        } else if source_type == "Package" {
            let mut cmd = Command::new("cmd");
            cmd.args(["/C", &format!("\"{}\" {}", source_value.replace("\"", ""), silent_args)]);
            cmd.creation_flags(0x08000000);
            
            if let Ok(output) = cmd.output() {
                success = output.status.success() || output.status.code() == Some(3010);
                if !success { error_msg = format!("Package execution failed: {:?}", output.status.code()); }
            }
        } else if source_type == "Link" {
            let ps_script = format!(
                "$ErrorActionPreference = 'Stop'; \
                 $temp_file = Join-Path $env:TEMP 'nex_installer_{}.exe'; \
                 Invoke-WebRequest -Uri '{}' -OutFile $temp_file; \
                 $proc = Start-Process -FilePath $temp_file -ArgumentList '{}' -Wait -NoNewWindow -PassThru; \
                 exit $proc.ExitCode",
                name.replace(" ", "_").replace(|c: char| !c.is_alphanumeric() && c != '_', ""),
                source_value.replace("'", "''"),
                silent_args.replace("'", "''")
            );
            
            let mut cmd = Command::new("powershell");
            cmd.args(["-ExecutionPolicy", "Bypass", "-NoProfile", "-Command", &ps_script]);
            cmd.creation_flags(0x08000000);
            
            if let Ok(output) = cmd.output() {
                success = output.status.success() || output.status.code() == Some(3010);
                if !success { error_msg = format!("Link installation failed: {:?}", output.status.code()); }
            }
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
        .args(["search", &format!("\"{}\"", TuKhoa.replace('"', "\"\"")), "--source", "winget", "--accept-source-agreements"])
        .creation_flags(0x08000000)
        .output();
    
    let output = match output {
        Ok(o) => o,
        Err(_) => return vec![],
    };
    
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let cleaned = stdout
        .replace('\r', "")
        .chars()
        .map(|c| if c.is_ascii_graphic() || c == ' ' || c == '\n' || c == '\t' { c } else { ' ' })
        .collect::<String>();
    
    let lines: Vec<&str> = cleaned.split('\n').filter(|l| !l.trim().is_empty()).collect();
    let mut results = Vec::new();
    let mut start_parsing = false;
    let mut col_positions: Option<(usize, usize)> = None; // (id_start, ver_start)
    
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

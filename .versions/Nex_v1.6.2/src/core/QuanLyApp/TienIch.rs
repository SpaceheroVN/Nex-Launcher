#![allow(non_snake_case)]
#![allow(non_camel_case_types)]



#[tauri::command]
pub async fn XoaTanDu(DanhSachDuongDan: Vec<serde_json::Value>) -> Result<serde_json::Value, String> {
    use std::fs;
    use std::process::Command;
    use std::os::windows::process::CommandExt;

    let mut success_count = 0;
    let mut failed_count = 0;

    for p in DanhSachDuongDan {
        let p_type = p.get("type").and_then(|v| v.as_str()).unwrap_or("");
        let path = p.get("path").and_then(|v| v.as_str()).unwrap_or("");

        if p_type == "folder" {
            if fs::remove_dir_all(path).is_ok() {
                success_count += 1;
            } else {
                failed_count += 1;
            }
        } else if p_type == "registry" {
            let mut cmd = Command::new("reg");
            cmd.args(["delete", path, "/f"]);
            cmd.creation_flags(0x08000000);
            if let Ok(output) = cmd.output() {
                if output.status.success() {
                    success_count += 1;
                } else {
                    failed_count += 1;
                }
            } else {
                failed_count += 1;
            }
        }
    }

    Ok(serde_json::json!({
        "success": success_count,
        "failed": failed_count
    }))
}

#[tauri::command]
pub fn SuaPhanMemKhac(_ThongTinApp: serde_json::Value) {}

#[tauri::command]
pub fn PhaHuyDuLieu(DuongDanTarget: String, TuyChon: serde_json::Value) -> serde_json::Value {
    use std::fs;
    use std::io::{Write, Seek, SeekFrom};
    use std::path::Path;

    let passes = TuyChon.get("passes").and_then(|v| v.as_u64()).unwrap_or(3);
    let path = Path::new(&DuongDanTarget);

    if !path.exists() {
        return serde_json::json!({"success": false, "error": "Đường dẫn không tồn tại"});
    }

    fn wipe_file(file_path: &std::path::Path, passes: u64) -> Result<(), String> {
        let meta = fs::metadata(file_path).map_err(|e| e.to_string())?;
        let size = meta.len();
        if size == 0 {
            fs::remove_file(file_path).map_err(|e| e.to_string())?;
            return Ok(());
        }

        let mut file = fs::OpenOptions::new().write(true).open(file_path).map_err(|e| e.to_string())?;
        let max_buf_size: usize = 4 * 1024 * 1024;
        let buf_size = std::cmp::min(size as usize, max_buf_size);
        let mut buf = vec![0u8; buf_size];

        for pass in 0..passes {
            let mut remaining = size;
            file.seek(SeekFrom::Start(0)).map_err(|e| e.to_string())?;
            while remaining > 0 {
                let chunk = std::cmp::min(buf_size as u64, remaining) as usize;
                if pass % 2 == 0 {
                    buf[..chunk].fill(0xFF);
                } else {
                    buf[..chunk].fill(0x00);
                }
                file.write_all(&buf[..chunk]).map_err(|e| e.to_string())?;
                remaining -= chunk as u64;
            }
            file.sync_all().map_err(|e| e.to_string())?;
        }
        drop(file);
        fs::remove_file(file_path).map_err(|e| e.to_string())?;
        Ok(())
    }

    if path.is_file() {
        if let Err(e) = wipe_file(path, passes) {
            return serde_json::json!({"success": false, "error": e});
        }
    } else if path.is_dir() {
        let mut dirs_to_rm = Vec::new();
        let mut queue = vec![path.to_path_buf()];

        while let Some(current_dir) = queue.pop() {
            dirs_to_rm.push(current_dir.clone());
            if let Ok(entries) = fs::read_dir(&current_dir) {
                for entry in entries.flatten() {
                    let full = entry.path();
                    if full.is_dir() {
                        queue.push(full);
                    } else {
                        let _ = wipe_file(&full, passes);
                    }
                }
            }
        }
        for dir in dirs_to_rm.into_iter().rev() {
            let _ = fs::remove_dir(dir);
        }
    }

    serde_json::json!({"success": true})
}

#[tauri::command]
pub fn KiemTraThuMucNhayCam(DuongDan: String) -> i32 {
    let p = DuongDan.to_lowercase();

    if p == "c:\\" || p == "c:\\windows" || p == "c:\\windows\\system32" || p.contains("system32") {
        return 3;
    }
    if p.contains("program files") || p.contains("users") {
        return 2;
    }
    1
}

#[tauri::command]
pub async fn ChonDuongDanPhaHuy(_Loai: String) -> Option<String> {
    None
}

#[tauri::command]
pub async fn TienHanhKhoiPhuc(AppHandle: tauri::AppHandle, DuongDanO: String, ThuMucXuat: String) -> serde_json::Value {
    use tauri::Emitter;

    let _ = AppHandle.emit("tien-trinh-khoi-phuc", serde_json::json!({
        "percent": 0,
        "status": "starting",
        "message": "Đang chuẩn bị quét..."
    }));

    let drive_path = DuongDanO.trim().to_uppercase();
    if drive_path.is_empty() || ThuMucXuat.is_empty() {
        return serde_json::json!({"success": false, "error": "Thiếu đường dẫn ổ đĩa hoặc thư mục xuất"});
    }

    let _ = AppHandle.emit("tien-trinh-khoi-phuc", serde_json::json!({
        "percent": 100,
        "status": "done",
        "message": "Tính năng khôi phục dữ liệu đang được phát triển"
    }));

    serde_json::json!({"success": true, "message": "Tính năng đang được phát triển"})
}

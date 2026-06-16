#![allow(non_snake_case)]
#![allow(non_camel_case_types)]
use tauri::{Manager, Window};
use sysinfo::System;
use std::sync::Mutex;
use std::sync::atomic::{AtomicBool, Ordering};
use serde::Serialize;

pub struct SysState(pub Mutex<System>);

pub static THU_NHO_KHI_DONG: AtomicBool = AtomicBool::new(true);

pub static HUY_TIEN_TRINH: AtomicBool = AtomicBool::new(false);


pub fn lay_trang_thai_huy() -> bool {
    HUY_TIEN_TRINH.load(Ordering::Relaxed)
}


#[tauri::command]
pub fn LayChuDeHeThong(Window: Window) -> String {
    match Window.theme() {
        Ok(tauri::Theme::Dark) => "Dark".to_string(),
        _ => "Light".to_string(),
    }
}

#[tauri::command]
pub fn DatThuNhoKhay(GiaTri: bool) {
    THU_NHO_KHI_DONG.store(GiaTri, Ordering::Relaxed);
}

#[derive(Serialize)]
pub struct ThongTinTaiNguyen {
    totalRAM: u64,
    freeRAM: u64,
    cpus: u32,
    cpuUsage: u32,
}

#[tauri::command]
pub fn KiemTraTaiNguyen(state: tauri::State<SysState>) -> ThongTinTaiNguyen {
    let mut sys = state.0.lock().unwrap();
    sys.refresh_cpu_usage();
    sys.refresh_memory();
    
    ThongTinTaiNguyen {
        totalRAM: sys.total_memory(),
        freeRAM: sys.free_memory(),
        cpus: sys.cpus().len() as u32,
        cpuUsage: sys.global_cpu_usage() as u32,
    }
}

#[derive(Serialize)]
pub struct KetQuaDonDep {
    TongXoa: u32,
    TongLoi: u32,
}

#[tauri::command]
pub fn DonDepHeThong(CheDo: String) -> KetQuaDonDep {
    use std::fs;

    let mut TongXoa = 0;
    let mut TongLoi = 0;

    let local_app_data = std::env::var("LOCALAPPDATA").unwrap_or_default();
    let app_data = std::env::var("APPDATA").unwrap_or_default();
    let temp_dir = std::env::temp_dir().to_string_lossy().to_string();

    let mut paths = vec![
        temp_dir,
        "C:\\Windows\\Temp".to_string(),
        format!("{}\\Temp", local_app_data),
    ];

    if CheDo == "thong_minh" || CheDo == "tat_ca" {
        paths.push("C:\\Windows\\Prefetch".to_string());
        paths.push(format!("{}\\Microsoft\\Windows\\Explorer", local_app_data));
        paths.push(format!("{}\\Microsoft\\Windows\\Recent", app_data));
    }

    if CheDo == "tat_ca" {
        paths.push("C:\\Windows\\SoftwareDistribution\\Download".to_string());
        paths.push(format!("{}\\Microsoft\\Windows\\INetCache", local_app_data));
    }

    let mut xoa_thu_muc = |dir: &str| {
        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    if fs::remove_dir_all(&path).is_ok() {
                        TongXoa += 1;
                    } else {
                        TongLoi += 1;
                    }
                } else {
                    if fs::remove_file(&path).is_ok() {
                        TongXoa += 1;
                    } else {
                        TongLoi += 1;
                    }
                }
            }
        } else {
            TongLoi += 1;
        }
    };

    for path in &paths {
        if !path.is_empty() {
            xoa_thu_muc(path);
        }
    }

    if CheDo == "tat_ca" {
        let _ = std::process::Command::new("cleanmgr")
            .arg("/sagerun:1")
            .spawn();
    }

    KetQuaDonDep { TongXoa, TongLoi }
}

#[tauri::command]
pub fn HuyTienTrinh() {
    HUY_TIEN_TRINH.store(true, Ordering::Relaxed);
}

#[tauri::command]
pub fn DatTienTrinh(AppHandle: tauri::AppHandle, PhanTram: f64, _NoiDung: String) {
    if let Some(window) = AppHandle.get_webview_window("main") {
        if !(0.0..100.0).contains(&PhanTram) {
            let _ = window.set_progress_bar(tauri::window::ProgressBarState {
                status: Some(tauri::window::ProgressBarStatus::None),
                progress: None,
            });
        } else {
            let _ = window.set_progress_bar(tauri::window::ProgressBarState {
                status: Some(tauri::window::ProgressBarStatus::Normal),
                progress: Some(PhanTram as u64),
            });
        }
    }
}

#[tauri::command]
pub fn KiemTraDevMode() -> bool {
    cfg!(debug_assertions)
}

#[tauri::command]
pub fn LayPhienBan() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
pub async fn TaiVaCaiDatCapNhat(AppHandle: tauri::AppHandle, Url: String, FileName: String) -> Result<bool, String> {
    use std::io::Write;
    use std::process::Command;
    use std::os::windows::process::CommandExt;
    use tauri::Emitter;
    use futures_util::StreamExt;
    
    let temp_dir = std::env::temp_dir();
    let file_path = temp_dir.join(&FileName);
    
    let response = reqwest::get(&Url).await.map_err(|e| format!("Lỗi kết nối: {}", e))?;
    
    if !response.status().is_success() {
        return Err(format!("Download failed: HTTP {}", response.status()));
    }
    
    let total_size = response.content_length().unwrap_or(0);
    let mut file = std::fs::File::create(&file_path).map_err(|e| format!("Lỗi tạo file: {}", e))?;
    
    let mut downloaded: u64 = 0;
    let mut stream = response.bytes_stream();
    let mut last_emit = std::time::Instant::now();
    
    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| format!("Lỗi đọc dữ liệu: {}", e))?;
        file.write_all(&chunk).map_err(|e| format!("Lỗi ghi file: {}", e))?;
        downloaded += chunk.len() as u64;
        
        if total_size > 0 && last_emit.elapsed().as_millis() > 200 {
            let percent = (downloaded as f64 / total_size as f64) * 100.0;
            let _ = AppHandle.emit("tien-trinh-cap-nhat-app", serde_json::json!({
                "percent": percent,
                "downloaded": downloaded,
                "total": total_size
            }));
            last_emit = std::time::Instant::now();
        }
    }
    
    file.sync_all().map_err(|e| format!("Lỗi đồng bộ file: {}", e))?;
    
    Command::new(&file_path)
        .arg("/S")
        .creation_flags(0x08000000)
        .spawn()
        .map_err(|e| format!("Lỗi khởi chạy bộ cài: {}", e))?;
        
    let _ = AppHandle.emit("tien-trinh-cap-nhat-app", serde_json::json!({
        "percent": 100.0,
        "downloaded": total_size,
        "total": total_size
    }));
    
    std::thread::sleep(std::time::Duration::from_millis(300));
    std::process::exit(0);
}


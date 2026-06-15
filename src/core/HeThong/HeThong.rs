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


// Helper function for winget to access HUY_TIEN_TRINH
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
    // Tauri v2 hỗ trợ set progress bar trên taskbar
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

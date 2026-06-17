#![allow(non_snake_case)]
#![allow(non_camel_case_types)]
use tauri::{Manager, Window};
use serde::Serialize;

#[tauri::command]
pub fn DieuKhienCuaSo(Window: Window, HanhDong: &str) {
    match HanhDong {
        "thu-nho" => { Window.minimize().unwrap(); }
        "phong-to" => {
            if Window.is_maximized().unwrap_or(false) {
                Window.unmaximize().unwrap();
            } else {
                Window.maximize().unwrap();
            }
        }
        "dong" => { Window.close().unwrap(); }
        "an-cua-so" => { Window.hide().unwrap(); }
        "hien-cua-so" => { 
            Window.show().unwrap(); 
            Window.set_focus().unwrap();
        }
        _ => {}
    }
}

#[tauri::command]
pub fn MoLienKet(LienKet: String) {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        let _ = std::process::Command::new("cmd")
            .args(["/C", "start", "", &LienKet])
            .creation_flags(0x08000000)
            .spawn();
    }
    #[cfg(target_os = "macos")]
    {
        let _ = std::process::Command::new("open")
            .arg(&LienKet)
            .spawn();
    }
    #[cfg(target_os = "linux")]
    {
        let _ = std::process::Command::new("xdg-open")
            .arg(&LienKet)
            .spawn();
    }
}

#[derive(Serialize)]
pub struct TrangThaiCuaSo {
    DaPhongTo: bool,
    DaThuNho: bool,
}

#[tauri::command]
pub fn LayTrangThaiCuaSo(Window: Window) -> TrangThaiCuaSo {
    TrangThaiCuaSo {
        DaPhongTo: Window.is_maximized().unwrap_or(false),
        DaThuNho: Window.is_minimized().unwrap_or(false),
    }
}

#[tauri::command]
pub fn DatLuonTrenCung(Window: Window, GiaTri: bool) {
    Window.set_always_on_top(GiaTri).unwrap();
}

#[tauri::command]
pub async fn MoCuaSoTienTrinh(AppHandle: tauri::AppHandle, TieuDe: String, DanhSachApp: serde_json::Value, ChuDe: Option<String>, DaLuong: Option<bool>) {
    use tauri::Emitter;
    use tauri::{WebviewWindowBuilder, WebviewUrl};
    
    let chu_de_str = ChuDe.unwrap_or_else(|| "dark".to_string());
    let da_luong_val = DaLuong.unwrap_or(false);
    
    if let Some(existing) = AppHandle.get_webview_window("tien-trinh") {
        let _ = existing.set_focus();
        let _ = AppHandle.emit_to("tien-trinh", "khoi-tao-tien-trinh", serde_json::json!({
            "tieuDe": TieuDe,
            "danhSachApp": DanhSachApp,
            "chuDe": chu_de_str,
            "daLuong": da_luong_val
        }));
        return;
    }
    
    let window = WebviewWindowBuilder::new(
        &AppHandle,
        "tien-trinh",
        WebviewUrl::App("TienTrinh.html".into()),
    )
    .title("Tiến trình")
    .inner_size(550.0, 400.0)
    .decorations(false)
    .transparent(true)
    .resizable(false)
    .always_on_top(true)
    .center()
    .visible(false)
    .build();
    
    if let Ok(win) = window {
        let _app_handle = AppHandle.clone();
        let tieu_de = TieuDe.clone();
        let ds_app = DanhSachApp.clone();
        
        win.on_window_event(move |_event| {
        });
        
        let _ = win.show();
        
        use tauri::Listener;
        let app_for_emit = AppHandle.clone();
        let app_for_emit_inner = app_for_emit.clone();
        app_for_emit.once_any("tien-trinh-ready", move |_event| {
            let _ = app_for_emit_inner.emit_to("tien-trinh", "khoi-tao-tien-trinh", serde_json::json!({
                "tieuDe": tieu_de,
                "danhSachApp": ds_app,
                "chuDe": chu_de_str,
                "daLuong": da_luong_val
            }));
        });
    }
}

#[tauri::command]
pub fn DongCuaSoTienTrinh(AppHandle: tauri::AppHandle) {
    if let Some(window) = AppHandle.get_webview_window("tien-trinh") {
        let _ = window.close();
    }
}

#[tauri::command]
pub fn CapNhatCuaSoTienTrinh(AppHandle: tauri::AppHandle, DuLieu: serde_json::Value) {
    use tauri::Emitter;
    let _ = AppHandle.emit_to("tien-trinh", "cap-nhat-tien-trinh", DuLieu);
}

#[tauri::command]
pub fn HoanTatCuaSoTienTrinh(AppHandle: tauri::AppHandle, KetQua: serde_json::Value) {
    use tauri::Emitter;
    let _ = AppHandle.emit_to("tien-trinh", "hoan-tat-tien-trinh", KetQua);
}

#[tauri::command]
pub fn CapNhatTrayMenu(
    app: tauri::AppHandle,
    hien_thi: String,
    cai_dat: String,
    go_cai_dat: String,
    thoat: String
) {
    if let Some(tray) = app.tray_by_id("main_tray") {
        if let Ok(show_i) = tauri::menu::MenuItem::with_id(&app, "show", &hien_thi, true, None::<&str>) {
        if let Ok(installer_i) = tauri::menu::MenuItem::with_id(&app, "installer", &cai_dat, true, None::<&str>) {
        if let Ok(uninstaller_i) = tauri::menu::MenuItem::with_id(&app, "uninstaller", &go_cai_dat, true, None::<&str>) {
        if let Ok(quit_i) = tauri::menu::MenuItem::with_id(&app, "quit", &thoat, true, None::<&str>) {
        if let Ok(sep1) = tauri::menu::PredefinedMenuItem::separator(&app) {
        if let Ok(sep2) = tauri::menu::PredefinedMenuItem::separator(&app) {
        if let Ok(menu) = tauri::menu::Menu::with_items(&app, &[&show_i, &sep1, &installer_i, &uninstaller_i, &sep2, &quit_i]) {
            let _ = tray.set_menu(Some(menu));
        }}}}}}}
    }
}

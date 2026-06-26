#![allow(non_snake_case)]
#![allow(non_camel_case_types)]
use tauri::Window;
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

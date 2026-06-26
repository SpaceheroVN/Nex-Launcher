#![allow(non_snake_case)]
#[path = "GiaoDien/CuaSo.rs"]
pub mod CuaSo;

#[path = "HeThong/HeThong.rs"]
pub mod HeThong;

#[path = "HeThong/DuLieu.rs"]
pub mod DuLieu;

#[path = "HeThong/LayThongTin.rs"]
pub mod LayThongTin;

#[path = "QuanLyApp/TrinhCaiDat.rs"]
pub mod TrinhCaiDat;

#[path = "QuanLyApp/TrinhGoCaiDat.rs"]
pub mod TrinhGoCaiDat;

#[path = "QuanLyApp/TienIch.rs"]
pub mod TienIch;


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .manage(HeThong::SysState(std::sync::Mutex::new(sysinfo::System::new_all())))
    .manage(crate::LayThongTin::IconCacheState {
        cache: std::sync::Mutex::new(std::collections::HashMap::new()),
    })
    .setup(|app| {
      use tauri::Manager;
      use tauri::Emitter;
      
      let quit_i = tauri::menu::MenuItem::with_id(app, "quit", "Thoát", true, None::<&str>)?;
      let show_i = tauri::menu::MenuItem::with_id(app, "show", "Hiển thị", true, None::<&str>)?;
      let installer_i = tauri::menu::MenuItem::with_id(app, "installer", "Trình cài đặt", true, None::<&str>)?;
      let uninstaller_i = tauri::menu::MenuItem::with_id(app, "uninstaller", "Trình gỡ cài đặt", true, None::<&str>)?;
      let sep1 = tauri::menu::PredefinedMenuItem::separator(app)?;
      let sep2 = tauri::menu::PredefinedMenuItem::separator(app)?;
      let menu = tauri::menu::Menu::with_items(app, &[&show_i, &sep1, &installer_i, &uninstaller_i, &sep2, &quit_i])?;
      
      let _tray = tauri::tray::TrayIconBuilder::with_id("main_tray")
          .tooltip("Nex Launcher v1.6")
          .icon(app.default_window_icon().cloned().unwrap())
          .menu(&menu)
          .on_menu_event(|app, event| {
              match event.id.as_ref() {
                  "quit" => {
                      std::process::exit(0);
                  }
                  "show" => {
                      if let Some(window) = app.get_webview_window("main") {
                          let _ = window.show();
                          let _ = window.set_focus();
                      }
                  }
                  "installer" => {
                      if let Some(window) = app.get_webview_window("main") {
                          let _ = window.show();
                          let _ = window.set_focus();
                          let _ = window.emit("chuyen-trang", "installer");
                      }
                  }
                  "uninstaller" => {
                      if let Some(window) = app.get_webview_window("main") {
                          let _ = window.show();
                          let _ = window.set_focus();
                          let _ = window.emit("chuyen-trang", "uninstaller");
                      }
                  }
                  _ => {}
              }
          })
          .on_tray_icon_event(|tray, event| {
              if let tauri::tray::TrayIconEvent::DoubleClick { .. } = event {
                  if let Some(window) = tray.app_handle().get_webview_window("main") {
                      let _ = window.show();
                      let _ = window.set_focus();
                  }
              }
          })
          .build(app)?;
      
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
        CuaSo::DieuKhienCuaSo,
        CuaSo::MoLienKet,
        CuaSo::LayTrangThaiCuaSo,
        CuaSo::CapNhatTrayMenu,
        HeThong::LayChuDeHeThong,
        CuaSo::DatLuonTrenCung,
        HeThong::DatThuNhoKhay,
        TrinhGoCaiDat::KiemTraCapNhat,
        LayThongTin::LayIconApp,
        LayThongTin::LayIconDebug,
        LayThongTin::LayThongTinThem,
        HeThong::KiemTraTaiNguyen,
        HeThong::DonDepHeThong,
        HeThong::KiemTraDevMode,
        DuLieu::LayDanhSachUngDung,
        DuLieu::KiemTraCapNhatBasic,
        DuLieu::ThucHienCapNhatBasic,
        TrinhGoCaiDat::LayPhanMemDaCai,
        TrinhCaiDat::TienHanhCaiDat,
        TrinhGoCaiDat::TienHanhGoCaiDat,
        TrinhGoCaiDat::QuetTanDuPhanMem,
        TrinhGoCaiDat::XoaTanDuThucSu,
        TrinhGoCaiDat::XoaDiemKhoiPhuc,
        TrinhGoCaiDat::LayDanhSachDiemKhoiPhuc,
        TrinhGoCaiDat::TaoDiemKhoiPhuc,
        HeThong::HuyTienTrinh,
        DuLieu::ThemUngDungInstaller,
        DuLieu::SuaUngDungInstaller,
        DuLieu::XoaUngDungInstaller,
        DuLieu::DatLaiDanhSachUngDung,
        TrinhCaiDat::TimKiemWinget,
        TienIch::PhaHuyDuLieu,
        TienIch::KiemTraThuMucNhayCam,
        TienIch::ChonDuongDanPhaHuy,
        TienIch::TienHanhKhoiPhuc,
        HeThong::DatTienTrinh,
        CuaSo::CapNhatTrayMenu,
        HeThong::LayPhienBan,
        HeThong::TaiVaCaiDatCapNhat,
        HeThong::ThayDoiUuTienCPU
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

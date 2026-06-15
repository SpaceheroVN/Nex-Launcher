#![allow(non_snake_case)]
#![allow(non_camel_case_types)]
use tauri::{Manager, Window};
use serde::Serialize;
use std::sync::Mutex;
use std::sync::atomic::{AtomicBool, Ordering};
use sysinfo::System;

// ─── State ───────────────────────────────────────────

pub struct SysState(pub Mutex<System>);

static THU_NHO_KHI_DONG: AtomicBool = AtomicBool::new(true);
static HUY_TIEN_TRINH: AtomicBool = AtomicBool::new(false);

// ─── Window Control ──────────────────────────────────

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
pub fn LayChuDeHeThong(Window: Window) -> String {
    match Window.theme() {
        Ok(tauri::Theme::Dark) => "Dark".to_string(),
        _ => "Light".to_string(),
    }
}

#[tauri::command]
pub fn DatLuonTrenCung(Window: Window, GiaTri: bool) {
    Window.set_always_on_top(GiaTri).unwrap();
}

#[tauri::command]
pub fn DatThuNhoKhay(GiaTri: bool) {
    THU_NHO_KHI_DONG.store(GiaTri, Ordering::Relaxed);
}

// ─── Winget: Kiểm tra cập nhật ──────────────────────

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
        .replace('\r', "")
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
        if col_positions.is_some() && !start_parsing {
            if trimmed.chars().all(|c| c == '-' || c == ' ') && trimmed.contains('-') {
                start_parsing = true;
                continue;
            }
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

// ─── Icon App ────────────────────────────────────────

#[tauri::command]
pub async fn LayIconApp(AppHandle: tauri::AppHandle, TenApp: String) -> Option<String> {
    use std::fs;
    
    // Kiểm tra cache trước
    let cache_dir = AppHandle.path().app_data_dir().ok()?.join("IconCache");
    let safe_name = format!("{:x}.txt", md5_hash(&TenApp));
    let cached_file = cache_dir.join(&safe_name);
    
    if cached_file.exists() {
        if let Ok(data) = fs::read_to_string(&cached_file) {
            if !data.is_empty() { return Some(data); }
        }
    }
    
    // Tìm icon qua registry DisplayIcon
    let icon = tim_icon_tu_registry(&TenApp).await
        .or_else(|| tim_icon_tu_program_files(&TenApp));
    
    // Lưu cache
    if let Some(ref icon_data) = icon {
        let _ = fs::create_dir_all(&cache_dir);
        let _ = fs::write(&cached_file, icon_data);
    }
    
    icon
}

fn md5_hash(input: &str) -> u64 {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    let mut hasher = DefaultHasher::new();
    input.hash(&mut hasher);
    hasher.finish()
}

async fn tim_icon_tu_registry(app_name: &str) -> Option<String> {
    use std::process::Command;
    use std::os::windows::process::CommandExt;
    use std::path::Path;
    use std::fs;
    
    // Dùng PowerShell để lấy DisplayIcon từ registry
    let ps_script = format!(r#"
        $paths = @(
            "HKLM:\Software\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*",
            "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*",
            "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*"
        )
        $app = Get-ItemProperty $paths -ErrorAction SilentlyContinue |
            Where-Object {{ $_.DisplayName -eq '{}' }} |
            Select-Object -First 1 DisplayIcon, InstallLocation
        if ($app.DisplayIcon) {{ Write-Output $app.DisplayIcon }}
        elseif ($app.InstallLocation) {{ Write-Output $app.InstallLocation }}
    "#, app_name.replace('\'', "''"));
    
    let encoded = encode_ps_command(&ps_script);
    let output = Command::new("powershell")
        .args(["-NoProfile", "-ExecutionPolicy", "Bypass", "-EncodedCommand", &encoded])
        .creation_flags(0x08000000)
        .output()
        .ok()?;
    
    let icon_path = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if icon_path.is_empty() { return None; }
    
    // Xử lý path
    let mut clean_path = icon_path.trim_matches('"').to_string();
    if let Some(comma_pos) = clean_path.find(',') {
        clean_path = clean_path[..comma_pos].to_string();
    }
    // Cắt bỏ phần sau .exe hoặc .ico
    let lower = clean_path.to_lowercase();
    if let Some(pos) = lower.find(".exe") {
        clean_path = clean_path[..pos + 4].to_string();
    } else if let Some(pos) = lower.find(".ico") {
        clean_path = clean_path[..pos + 4].to_string();
    }
    clean_path = clean_path.trim().to_string();
    
    let path = Path::new(&clean_path);
    if !path.exists() { return None; }
    
    // Nếu là .ico, đọc trực tiếp
    if lower.ends_with(".ico") {
        if let Ok(bytes) = fs::read(path) {
            return Some(format!("data:image/x-icon;base64,{}", base64_encode(&bytes)));
        }
    }
    
    // Nếu là .png
    if lower.ends_with(".png") {
        if let Ok(bytes) = fs::read(path) {
            return Some(format!("data:image/png;base64,{}", base64_encode(&bytes)));
        }
    }
    
    // Nếu là thư mục, tìm .ico bên trong
    if path.is_dir() {
        return tim_icon_trong_thu_muc(path);
    }
    
    // Nếu là .exe, tìm .ico trong cùng thư mục hoặc thư mục cha
    if let Some(parent) = path.parent() {
        if let Some(icon) = tim_icon_trong_thu_muc(parent) {
            return Some(icon);
        }
        if let Some(grandparent) = parent.parent() {
            return tim_icon_trong_thu_muc(grandparent);
        }
    }
    
    None
}

fn tim_icon_trong_thu_muc(dir: &std::path::Path) -> Option<String> {
    use std::fs;
    
    if !dir.exists() || !dir.is_dir() { return None; }
    
    let entries = fs::read_dir(dir).ok()?;
    for entry in entries.flatten() {
        let path = entry.path();
        let name = path.file_name()?.to_string_lossy().to_lowercase();
        if name.ends_with(".ico") && name != "app.ico" {
            if let Ok(bytes) = fs::read(&path) {
                return Some(format!("data:image/x-icon;base64,{}", base64_encode(&bytes)));
            }
        }
    }
    None
}

fn tim_icon_tu_program_files(app_name: &str) -> Option<String> {
    use std::fs;
    
    let search_name: String = app_name.to_lowercase().chars().filter(|c| c.is_alphanumeric()).collect();
    if search_name.len() < 3 { return None; }
    
    let common_dirs: Vec<String> = [
        std::env::var("ProgramFiles").ok(),
        std::env::var("ProgramFiles(x86)").ok(),
        std::env::var("LOCALAPPDATA").ok(),
        std::env::var("APPDATA").ok(),
    ].into_iter().flatten().collect();
    
    for base_dir in &common_dirs {
        let base = std::path::Path::new(base_dir);
        if !base.exists() { continue; }
        if let Ok(entries) = fs::read_dir(base) {
            for entry in entries.flatten() {
                let entry_name: String = entry.file_name().to_string_lossy().to_lowercase()
                    .chars().filter(|c| c.is_alphanumeric()).collect();
                if entry_name.contains(&search_name[..search_name.len().min(5)]) {
                    let full_path = entry.path();
                    if full_path.is_dir() {
                        if let Some(icon) = tim_icon_trong_thu_muc(&full_path) {
                            return Some(icon);
                        }
                    }
                }
            }
        }
    }
    None
}

fn base64_encode(data: &[u8]) -> String {
    use base64::{Engine as _, engine::general_purpose};
    general_purpose::STANDARD.encode(data)
}

fn encode_ps_command(script: &str) -> String {
    use base64::{Engine as _, engine::general_purpose};
    general_purpose::STANDARD.encode(
        script.encode_utf16().flat_map(|c| c.to_le_bytes()).collect::<Vec<u8>>()
    )
}

// ─── Thông tin thêm ──────────────────────────────────

#[derive(Serialize)]
pub struct ThongTinThem {
    date: String,
    size: String,
}

#[tauri::command]
pub async fn LayThongTinThem(TenApp: String, ViTriCaiDat: Option<String>) -> ThongTinThem {
    use std::process::Command;
    use std::os::windows::process::CommandExt;
    use std::fs;
    use std::path::Path;
    
    let mut install_loc = ViTriCaiDat.unwrap_or_default();
    
    // Nếu chưa có vị trí, thử tìm từ Program Files
    if install_loc.is_empty() {
        let search_name: String = TenApp.to_lowercase().chars().filter(|c| c.is_alphanumeric()).collect();
        if search_name.len() >= 5 {
            let common_dirs: Vec<String> = [
                std::env::var("ProgramFiles").ok(),
                std::env::var("ProgramFiles(x86)").ok(),
                std::env::var("LOCALAPPDATA").ok(),
            ].into_iter().flatten().collect();
            
            for base in &common_dirs {
                if let Ok(entries) = fs::read_dir(base) {
                    for entry in entries.flatten() {
                        let dir_name: String = entry.file_name().to_string_lossy().to_lowercase()
                            .chars().filter(|c| c.is_alphanumeric()).collect();
                        if dir_name == search_name || (dir_name.len() >= 6 && search_name.starts_with(&dir_name)) {
                            if entry.path().is_dir() {
                                install_loc = entry.path().to_string_lossy().to_string();
                                break;
                            }
                        }
                    }
                }
                if !install_loc.is_empty() { break; }
            }
        }
    }
    
    if install_loc.is_empty() {
        return ThongTinThem { date: String::new(), size: "0".to_string() };
    }
    
    install_loc = install_loc.trim_matches('"').trim().to_string();
    let path = Path::new(&install_loc);
    
    // Lấy ngày tạo
    let mut date_str = String::new();
    if let Ok(meta) = fs::metadata(path) {
        if let Ok(created) = meta.created() {
            let duration = created.duration_since(std::time::UNIX_EPOCH).unwrap_or_default();
            let secs = duration.as_secs() as i64;
            // Tính ngày đơn giản
            let days = secs / 86400;
            let mut y = 1970i64;
            let mut remaining_days = days;
            loop {
                let days_in_year = if (y % 4 == 0 && y % 100 != 0) || (y % 400 == 0) { 366 } else { 365 };
                if remaining_days < days_in_year { break; }
                remaining_days -= days_in_year;
                y += 1;
            }
            let days_in_months = if (y % 4 == 0 && y % 100 != 0) || (y % 400 == 0) {
                [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
            } else {
                [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
            };
            let mut m = 0u32;
            for (i, &dm) in days_in_months.iter().enumerate() {
                if remaining_days < dm { m = i as u32 + 1; break; }
                remaining_days -= dm;
            }
            let d = remaining_days + 1;
            date_str = format!("{}{:02}{:02}", y, m, d);
        }
    }
    
    // Lấy dung lượng bằng PowerShell (nhanh hơn traverse manual)
    let ps = format!(
        "$loc = '{}'\nif (Test-Path -LiteralPath $loc) {{\n  $size = 0\n  try {{ $fso = New-Object -ComObject Scripting.FileSystemObject; $size = $fso.GetFolder($loc).Size }} catch {{}}\n  Write-Output \"$size\"\n}}",
        install_loc.replace('\'', "''")
    );
    let encoded = encode_ps_command(&ps);
    let size_str = match Command::new("powershell")
        .args(["-NoProfile", "-ExecutionPolicy", "Bypass", "-EncodedCommand", &encoded])
        .creation_flags(0x08000000)
        .output() 
    {
        Ok(o) => {
            let s = String::from_utf8_lossy(&o.stdout).trim().to_string();
            let parsed: u64 = s.parse().unwrap_or(0);
            if parsed > 0 { parsed.to_string() } else {
                // Fallback: traverse manual
                tinh_dung_luong_thu_muc(path).to_string()
            }
        },
        Err(_) => tinh_dung_luong_thu_muc(path).to_string(),
    };
    
    ThongTinThem { date: date_str, size: size_str }
}

fn tinh_dung_luong_thu_muc(dir: &std::path::Path) -> u64 {
    use std::fs;
    let mut size = 0u64;
    let mut queue = vec![dir.to_path_buf()];
    while let Some(current) = queue.pop() {
        if let Ok(entries) = fs::read_dir(&current) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    queue.push(path);
                } else if path.is_file() {
                    if let Ok(meta) = fs::metadata(&path) {
                        size += meta.len();
                    }
                }
            }
        }
    }
    size
}

// ─── Tài nguyên hệ thống ────────────────────────────

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

// ─── Dọn dẹp hệ thống ──────────────────────────────

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

// ─── Danh sách ứng dụng (Basic.json) ────────────────

fn basic_json_path(app: &tauri::AppHandle) -> std::path::PathBuf {
    // Tìm relative path "../Basic.json" từ src-tauri
    let resource_dir = app.path().resource_dir().unwrap_or_default();
    let mut p = resource_dir.join("Basic.json");
    if !p.exists() {
        // Fallback: thử path tương đối khi dev
        p = std::path::PathBuf::from("../Basic.json");
    }
    if !p.exists() {
        // Fallback 2: thử từ CWD
        if let Ok(cwd) = std::env::current_dir() {
            p = cwd.join("Basic.json");
        }
    }
    p
}

#[tauri::command]
pub fn LayDanhSachUngDung(AppHandle: tauri::AppHandle) -> serde_json::Value {
    let p = basic_json_path(&AppHandle);
    if let Ok(content) = std::fs::read_to_string(&p) {
        if let Ok(data) = serde_json::from_str(&content) {
            return data;
        }
    }
    serde_json::json!([])
}

#[tauri::command]
pub fn ThemUngDungInstaller(AppHandle: tauri::AppHandle, ThongTinApp: serde_json::Value) -> bool {
    let p = basic_json_path(&AppHandle);
    let mut data: Vec<serde_json::Value> = match std::fs::read_to_string(&p) {
        Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
        Err(_) => vec![],
    };
    data.push(ThongTinApp);
    match std::fs::write(&p, serde_json::to_string_pretty(&data).unwrap_or_default()) {
        Ok(_) => true,
        Err(_) => false,
    }
}

#[tauri::command]
pub fn SuaUngDungInstaller(AppHandle: tauri::AppHandle, TenCu: String, ThongTinMoi: serde_json::Value) -> bool {
    let p = basic_json_path(&AppHandle);
    let mut data: Vec<serde_json::Value> = match std::fs::read_to_string(&p) {
        Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
        Err(_) => return false,
    };
    if let Some(idx) = data.iter().position(|a| a.get("name").and_then(|v| v.as_str()) == Some(&TenCu)) {
        data[idx] = ThongTinMoi;
        return std::fs::write(&p, serde_json::to_string_pretty(&data).unwrap_or_default()).is_ok();
    }
    false
}

#[tauri::command]
pub fn XoaUngDungInstaller(AppHandle: tauri::AppHandle, TenApp: serde_json::Value) -> bool {
    let p = basic_json_path(&AppHandle);
    let mut data: Vec<serde_json::Value> = match std::fs::read_to_string(&p) {
        Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
        Err(_) => return false,
    };
    
    // TenApp có thể là array hoặc string
    let names_to_remove: Vec<String> = if let Some(arr) = TenApp.as_array() {
        arr.iter().filter_map(|v| v.as_str().map(|s| s.to_string())).collect()
    } else if let Some(s) = TenApp.as_str() {
        vec![s.to_string()]
    } else {
        return false;
    };
    
    let original_len = data.len();
    data.retain(|item| {
        if let Some(name) = item.get("name").and_then(|v| v.as_str()) {
            !names_to_remove.contains(&name.to_string())
        } else {
            true
        }
    });
    
    if data.len() != original_len {
        return std::fs::write(&p, serde_json::to_string_pretty(&data).unwrap_or_default()).is_ok();
    }
    false
}

// ─── Phần mềm đã cài ────────────────────────────────

#[tauri::command]
pub async fn LayPhanMemDaCai() -> Result<serde_json::Value, String> {
    let PsScript = r#"
        $paths = @(
            "HKLM:\Software\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*",
            "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*",
            "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*"
        )
        $apps = Get-ItemProperty $paths -ErrorAction SilentlyContinue |
            Where-Object { 
                $_.DisplayName -and 
                $_.SystemComponent -ne 1 -and 
                -not $_.ParentKeyName 
            } |
            Select-Object DisplayName, DisplayVersion, Publisher, InstallDate, EstimatedSize, DisplayIcon, InstallLocation |
            Sort-Object DisplayName -Unique
        ConvertTo-Json $apps -Compress
    "#;

    use std::os::windows::process::CommandExt;
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
                    let Ten = UngDung.get("DisplayName").and_then(|v| v.as_str()).unwrap_or("Unknown");
                    let PhienBan = UngDung.get("DisplayVersion").and_then(|v| v.as_str()).unwrap_or("");
                    let NhaPhatHanh = UngDung.get("Publisher").and_then(|v| v.as_str()).unwrap_or("");
                    let NgayCai = UngDung.get("InstallDate").and_then(|v| v.as_str()).unwrap_or("");
                    let DungLuongKB = UngDung.get("EstimatedSize").and_then(|v| v.as_i64()).unwrap_or(0);
                    let ViTri = UngDung.get("InstallLocation").and_then(|v| v.as_str()).unwrap_or("");
                    
                    KetQua.push(serde_json::json!({
                        "name": Ten,
                        "version": PhienBan,
                        "publisher": NhaPhatHanh,
                        "installDate": NgayCai,
                        "size": DungLuongKB * 1024,
                        "installLocation": ViTri
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

// ─── Cài đặt / Gỡ cài đặt / Cập nhật ──────────────

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
        let id = app.get("source").and_then(|v| v.get("value")).and_then(|v| v.as_str()).unwrap_or(&name);

        if show_progress {
            let _ = AppHandle.emit("tien-trinh-cai-dat", serde_json::json!({
                "name": name,
                "status": "installing",
                "percent": 50
            }));
        }

        let mut cmd = Command::new("winget");
        cmd.args(["install", "--id", id, "--accept-package-agreements", "--accept-source-agreements"]);
        
        let silent = TuyChon.get("silent").and_then(|v| v.as_bool()).unwrap_or(true);
        if silent {
            cmd.arg("--silent");
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
        
        let app_name = if let Some(n) = app.get("name").and_then(|v| v.as_str()) {
            n.to_string()
        } else if let Some(n) = app.as_str() {
            n.to_string()
        } else {
            "Unknown".to_string()
        };

        if show_progress {
            let _ = AppHandle.emit("tien-trinh-go-cai-dat", serde_json::json!({
                "name": app_name,
                "status": "uninstalling",
                "percent": 50
            }));
        }

        let mut cmd = Command::new("winget");
        cmd.args(["uninstall", "--name", &app_name, "--accept-source-agreements", "--disable-interactivity"]);
        
        let silent = TuyChon.get("silent").and_then(|v| v.as_bool()).unwrap_or(true);
        if silent {
            cmd.arg("--silent");
        } else {
            cmd.arg("--interactive");
        }

        cmd.creation_flags(0x08000000);
        let output = cmd.output().map_err(|e| e.to_string())?;
        
        let success = output.status.success() || output.status.code() == Some(-1978334975) || output.status.code() == Some(3010) || output.status.code() == Some(1641);
        
        let error_msg = if !success {
            format!("Winget exit code: {:?}", output.status.code())
        } else {
            String::new()
        };

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

// ─── Xóa tàn dư ─────────────────────────────────────

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

// ─── Hủy tiến trình ─────────────────────────────────

#[tauri::command]
pub fn HuyTienTrinh() {
    HUY_TIEN_TRINH.store(true, Ordering::Relaxed);
}

#[tauri::command]
pub fn SuaPhanMemKhac(_ThongTinApp: serde_json::Value) {}

// ─── Tìm kiếm Winget ────────────────────────────────

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
        
        if col_positions.is_some() && !start_parsing {
            if trimmed.chars().all(|c| c == '-' || c == ' ') && trimmed.contains('-') {
                start_parsing = true;
                continue;
            }
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

// ─── Phá hủy dữ liệu ───────────────────────────────

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
    // Đã xử lý bên frontend qua tauri-plugin-dialog
    // Hàm này giữ để backward compat, frontend gọi trực tiếp dialog API
    None
}

// ─── Khôi phục dữ liệu ──────────────────────────────

#[tauri::command]
pub async fn TienHanhKhoiPhuc(AppHandle: tauri::AppHandle, DuongDanO: String, ThuMucXuat: String) -> serde_json::Value {
    use tauri::Emitter;
    
    // File carving cơ bản - quét raw sectors tìm file signatures
    // Đây là tính năng phức tạp, implement cơ bản
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

// ─── Progress / Taskbar ──────────────────────────────

#[tauri::command]
pub fn DatTienTrinh(AppHandle: tauri::AppHandle, PhanTram: f64, _NoiDung: String) {
    // Tauri v2 hỗ trợ set progress bar trên taskbar
    if let Some(window) = AppHandle.get_webview_window("main") {
        if PhanTram < 0.0 || PhanTram >= 100.0 {
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

// ─── Cửa sổ tiến trình ──────────────────────────────

#[tauri::command]
pub async fn MoCuaSoTienTrinh(AppHandle: tauri::AppHandle, TieuDe: String, DanhSachApp: serde_json::Value) {
    use tauri::Emitter;
    use tauri::{WebviewWindowBuilder, WebviewUrl};
    
    // Kiểm tra xem cửa sổ đã tồn tại chưa
    if let Some(existing) = AppHandle.get_webview_window("tien-trinh") {
        let _ = existing.set_focus();
        let _ = AppHandle.emit_to("tien-trinh", "khoi-tao-tien-trinh", serde_json::json!({
            "tieuDe": TieuDe,
            "danhSachApp": DanhSachApp
        }));
        return;
    }
    
    // Tạo cửa sổ mới
    let window = WebviewWindowBuilder::new(
        &AppHandle,
        "tien-trinh",
        WebviewUrl::App("TienTrinh.html".into()),
    )
    .title("Tiến trình")
    .inner_size(600.0, 400.0)
    .decorations(false)
    .transparent(true)
    .resizable(false)
    .always_on_top(true)
    .visible(false)
    .build();
    
    if let Ok(win) = window {
        let _app_handle = AppHandle.clone();
        let tieu_de = TieuDe.clone();
        let ds_app = DanhSachApp.clone();
        
        win.on_window_event(move |_event| {
            // Xử lý khi cửa sổ đóng
        });
        
        // Chờ window ready rồi gửi data
        let _ = win.show();
        
        // Gửi data sau khi window đã load
        let app_for_emit = AppHandle.clone();
        std::thread::spawn(move || {
            std::thread::sleep(std::time::Duration::from_millis(500));
            let _ = app_for_emit.emit_to("tien-trinh", "khoi-tao-tien-trinh", serde_json::json!({
                "tieuDe": tieu_de,
                "danhSachApp": ds_app
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

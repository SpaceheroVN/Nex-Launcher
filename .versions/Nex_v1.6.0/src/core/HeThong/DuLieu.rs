#![allow(non_snake_case)]
#![allow(non_camel_case_types)]
use tauri::Manager;

fn basic_json_path(app: &tauri::AppHandle) -> std::path::PathBuf {
    let resource_dir = app.path().resource_dir().unwrap_or_default();
    let mut p = resource_dir.join("Basic.json");
    if !p.exists() {
        p = std::path::PathBuf::from("../Basic.json");
    }
    if !p.exists() {
        if let Ok(cwd) = std::env::current_dir() {
            p = cwd.join("Basic.json");
        }
    }
    p
}

#[tauri::command]
pub async fn LayDanhSachUngDung(AppHandle: tauri::AppHandle) -> serde_json::Value {
    let p = basic_json_path(&AppHandle);
    
    // Thử tải dữ liệu mới nhất từ GitHub
    let url = "https://raw.githubusercontent.com/SpaceheroVN/Nex-Launcher/main/Basic.json";
    if let Ok(response) = reqwest::get(url).await {
        if response.status().is_success() {
            if let Ok(text) = response.text().await {
                if let Ok(data) = serde_json::from_str::<serde_json::Value>(&text) {
                    // Cập nhật lại file local để dùng khi offline
                    let _ = std::fs::write(&p, &text);
                    return data;
                }
            }
        }
    }
    
    // Fallback: Đọc từ file local nếu không có kết nối hoặc lỗi mạng
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
    std::fs::write(&p, serde_json::to_string_pretty(&data).unwrap_or_default()).is_ok()
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

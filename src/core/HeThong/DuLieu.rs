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
    if let Ok(content) = std::fs::read_to_string(&p) {
        if let Ok(data) = serde_json::from_str(&content) {
            return data;
        }
    }
    serde_json::json!([])
}

#[tauri::command]
pub async fn KiemTraCapNhatBasic(AppHandle: tauri::AppHandle) -> serde_json::Value {
    let p = basic_json_path(&AppHandle);
    let url = "https://raw.githubusercontent.com/SpaceheroVN/Nex-Launcher/main/Basic.json";
    
    let local_content = std::fs::read_to_string(&p).unwrap_or_default();
    
    if let Ok(response) = reqwest::get(url).await {
        if response.status().is_success() {
            if let Ok(text) = response.text().await {
                if let Ok(remote_data) = serde_json::from_str::<serde_json::Value>(&text) {
                    if remote_data.is_array() {
                        if local_content == text {
                            return serde_json::json!({"status": "same"});
                        }
                        if let Ok(local_data) = serde_json::from_str::<serde_json::Value>(&local_content) {
                            if local_data == remote_data {
                                return serde_json::json!({"status": "same"});
                            }
                        }
                        return serde_json::json!({"status": "different"});
                    } else {
                        return serde_json::json!({"status": "invalid"});
                    }
                } else {
                    return serde_json::json!({"status": "invalid"});
                }
            }
        }
    }
    serde_json::json!({"status": "error"})
}

#[tauri::command]
pub async fn ThucHienCapNhatBasic(AppHandle: tauri::AppHandle) -> bool {
    let p = basic_json_path(&AppHandle);
    let url = "https://raw.githubusercontent.com/SpaceheroVN/Nex-Launcher/main/Basic.json";
    if let Ok(response) = reqwest::get(url).await {
        if response.status().is_success() {
            if let Ok(text) = response.text().await {
                if serde_json::from_str::<serde_json::Value>(&text).is_ok() {
                    return std::fs::write(&p, &text).is_ok();
                }
            }
        }
    }
    false
}

#[tauri::command]
pub fn ThemUngDungInstaller(AppHandle: tauri::AppHandle, ThongTinApp: serde_json::Value) -> bool {
    let p = basic_json_path(&AppHandle);
    let mut data: Vec<serde_json::Value> = match std::fs::read_to_string(&p) {
        Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
        Err(_) => vec![],
    };
    let mut ThongTinAppMoi = ThongTinApp;
    if let Some(obj) = ThongTinAppMoi.as_object_mut() {
        obj.insert("edit".to_string(), serde_json::json!(true));
    }
    data.push(ThongTinAppMoi);
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
        let mut ThongTinSua = ThongTinMoi;
        if let Some(obj) = ThongTinSua.as_object_mut() {
            obj.insert("edit".to_string(), serde_json::json!(true));
        }
        data[idx] = ThongTinSua;
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
    
    let mut changed = false;
    for item in data.iter_mut() {
        if let Some(name) = item.get("name").and_then(|v| v.as_str()) {
            if names_to_remove.contains(&name.to_string()) {
                if let Some(obj) = item.as_object_mut() {
                    obj.insert("delete".to_string(), serde_json::json!(true));
                    changed = true;
                }
            }
        }
    }
    
    if changed {
        return std::fs::write(&p, serde_json::to_string_pretty(&data).unwrap_or_default()).is_ok();
    }
    false
}

#[tauri::command]
pub fn DatLaiDanhSachUngDung(AppHandle: tauri::AppHandle) -> bool {
    let p = basic_json_path(&AppHandle);
    let mut data: Vec<serde_json::Value> = match std::fs::read_to_string(&p) {
        Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
        Err(_) => return false,
    };

    let original_len = data.len();
    data.retain(|item| {
        !item.get("edit").and_then(|v| v.as_bool()).unwrap_or(false)
    });

    let mut changed = data.len() != original_len;
    for item in data.iter_mut() {
        if let Some(obj) = item.as_object_mut() {
            if obj.contains_key("delete") {
                obj.remove("delete");
                changed = true;
            }
            if obj.contains_key("edit") {
                obj.remove("edit");
                changed = true;
            }
        }
    }

    if changed {
        return std::fs::write(&p, serde_json::to_string_pretty(&data).unwrap_or_default()).is_ok();
    }
    true
}

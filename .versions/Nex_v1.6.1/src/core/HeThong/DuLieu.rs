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
    
    let url = "https://raw.githubusercontent.com/SpaceheroVN/Nex-Launcher/main/Basic.json";
    if let Ok(response) = reqwest::get(url).await {
        if response.status().is_success() {
            if let Ok(text) = response.text().await {
                if let Ok(remote_data) = serde_json::from_str::<serde_json::Value>(&text) {
                    let mut local_data: Vec<serde_json::Value> = vec![];
                    if let Ok(content) = std::fs::read_to_string(&p) {
                        if let Ok(parsed) = serde_json::from_str::<Vec<serde_json::Value>>(&content) {
                            local_data = parsed;
                        }
                    }
                    
                    if local_data.is_empty() {
                        let _ = std::fs::write(&p, &text);
                        return remote_data;
                    }
                    
                    let mut merged_data = vec![];
                    if let Some(remote_arr) = remote_data.as_array() {
                        for remote_item in remote_arr {
                            if let Some(name) = remote_item.get("name").and_then(|v| v.as_str()) {
                                if let Some(local_item) = local_data.iter().find(|i| i.get("name").and_then(|v| v.as_str()) == Some(name)) {
                                    if local_item.get("delete").and_then(|v| v.as_bool()).unwrap_or(false) {
                                        let mut merged_item = remote_item.clone();
                                        if let Some(obj) = merged_item.as_object_mut() {
                                            obj.insert("delete".to_string(), serde_json::json!(true));
                                        }
                                        merged_data.push(merged_item);
                                    } else if local_item.get("edit").and_then(|v| v.as_bool()).unwrap_or(false) {
                                        merged_data.push(local_item.clone());
                                    } else {
                                        let mut merged_item = remote_item.clone();
                                        if let Some(rec) = local_item.get("recommended") {
                                            if let Some(obj) = merged_item.as_object_mut() {
                                                obj.insert("recommended".to_string(), rec.clone());
                                            }
                                        }
                                        merged_data.push(merged_item);
                                    }
                                } else {
                                    merged_data.push(remote_item.clone());
                                }
                            }
                        }
                    }
                    
                    for local_item in local_data {
                        if local_item.get("edit").and_then(|v| v.as_bool()).unwrap_or(false) {
                            if let Some(name) = local_item.get("name").and_then(|v| v.as_str()) {
                                if !merged_data.iter().any(|i| i.get("name").and_then(|v| v.as_str()) == Some(name)) {
                                    merged_data.push(local_item);
                                }
                            }
                        }
                    }
                    
                    let final_json = serde_json::to_value(&merged_data).unwrap_or(serde_json::json!([]));
                    let _ = std::fs::write(&p, serde_json::to_string_pretty(&merged_data).unwrap_or_default());
                    return final_json;
                }
            }
        }
    }
    
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

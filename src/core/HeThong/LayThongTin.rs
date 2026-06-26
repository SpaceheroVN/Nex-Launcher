#![allow(non_snake_case)]
#![allow(non_camel_case_types)]
use serde::Serialize;

pub struct IconCacheState {
    pub cache: std::sync::Mutex<std::collections::HashMap<String, String>>,
}

#[tauri::command]
pub async fn LayIconApp(
    TenApp: String,
    isDeep: Option<bool>,
    State: tauri::State<'_, IconCacheState>
) -> Result<Option<String>, String> {
    {
        let cache = State.cache.lock().unwrap();
        if let Some(icon) = cache.get(&TenApp) {
            return Ok(Some(icon.clone()));
        }
    }

    let is_deep = isDeep.unwrap_or(false);
    let mut icon = tim_icon_tu_registry(&TenApp).await;

    if is_deep && icon.is_none() {
        icon = tim_icon_tu_start_menu(&TenApp).await;
        let icon = icon
            .or_else(|| tim_icon_tu_where(&TenApp))
            .or_else(|| tim_icon_tu_program_files(&TenApp));

        if let Some(ref icon_data) = icon {
            let mut cache = State.cache.lock().unwrap();
            cache.insert(TenApp.clone(), icon_data.clone());
        }
        return Ok(icon);
    }

    if let Some(ref icon_data) = icon {
        let mut cache = State.cache.lock().unwrap();
        cache.insert(TenApp.clone(), icon_data.clone());
    }

    Ok(icon)
}

async fn tim_icon_tu_registry(app_name: &str) -> Option<String> {
    use winreg::enums::*;
    use winreg::RegKey;

    const UPDATER_NAMES: &[&str] = &["update.exe", "squirrel.exe", "uninstall.exe", "unins000.exe", "uninst.exe", "uninstaller.exe"];

    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);

    let reg_paths = vec![
        (&hklm, r"Software\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall"),
        (&hklm, r"Software\Microsoft\Windows\CurrentVersion\Uninstall"),
        (&hkcu, r"Software\Microsoft\Windows\CurrentVersion\Uninstall"),
    ];

    let mut target_path = String::new();
    let mut install_location = String::new();

    for (root_key, path) in reg_paths {
        if let Ok(uninstall_key) = root_key.open_subkey(path) {
            for key_name in uninstall_key.enum_keys().filter_map(|k| k.ok()) {
                if let Ok(app_key) = uninstall_key.open_subkey(&key_name) {
                    let display_name: String = app_key.get_value("DisplayName").unwrap_or_default();
                    if display_name == app_name {
                        if let Ok(icon) = app_key.get_value::<String, _>("DisplayIcon") {
                            target_path = icon.replace('"', "");
                            if let Some(idx) = target_path.find(',') {
                                target_path = target_path[..idx].to_string();
                            }
                            target_path = target_path.trim().to_string();
                        }
                        if let Ok(loc) = app_key.get_value::<String, _>("InstallLocation") {
                            install_location = loc;
                        }
                        break;
                    }
                }
            }
        }
        if !target_path.is_empty() || !install_location.is_empty() {
            break;
        }
    }

    let mut install_loc: Option<std::path::PathBuf> = None;
    let mut icon_path: Option<std::path::PathBuf> = None;
    let mut is_dir = false;

    if !install_location.is_empty() {
        let p = std::path::PathBuf::from(&install_location);
        if p.exists() { install_loc = Some(p); }
    }

    if !target_path.is_empty() {
        let p = std::path::PathBuf::from(&target_path);
        if p.exists() {
            if p.is_dir() {
                icon_path = Some(p);
                is_dir = true;
            } else {
                icon_path = Some(p);
                is_dir = false;
            }
        }
    }

    if let Some(ref exe_path) = icon_path {
        if !is_dir {
            let exe_name = exe_path.file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .to_lowercase();

            if UPDATER_NAMES.contains(&exe_name.as_str()) {
                let search_dir = install_loc
                    .as_deref()
                    .filter(|p| p.exists())
                    .unwrap_or_else(|| exe_path.parent().unwrap_or(exe_path));

                if let Some(icon) = tim_icon_tu_start_menu_cho_path(search_dir) {
                    return Some(icon);
                }

                if let Ok(entries) = std::fs::read_dir(search_dir) {
                    let mut subdirs: Vec<std::path::PathBuf> = entries.flatten()
                        .filter(|e| e.path().is_dir())
                        .map(|e| e.path())
                        .collect();
                    subdirs.sort_by(|a, b| {
                        let score = |p: &std::path::Path| -> u8 {
                            let n = p.file_name().unwrap_or_default().to_string_lossy().to_lowercase();
                            if n == "current" { 0 } else if n.starts_with("app-") { 1 } else if n == "app" { 2 } else { 3 }
                        };
                        score(a).cmp(&score(b))
                    });
                    for sub in &subdirs {
                        if let Some(icon) = tim_icon_trong_thu_muc(sub) {
                            return Some(icon);
                        }
                    }
                }

                if let Some(icon) = tim_icon_trong_thu_muc(search_dir) {
                    return Some(icon);
                }

                return Box::pin(tim_icon_tu_start_menu(app_name)).await;
            }

            if exe_name.ends_with(".ico") {
                let ico_stem = exe_path.file_stem()
                    .unwrap_or_default().to_string_lossy().to_lowercase();
                let is_uninstaller_ico = ico_stem.contains("uninstall") || ico_stem.contains("uninst");

                let app_clean: String = app_name.chars().filter(|c| c.is_alphanumeric()).collect::<String>().to_lowercase();
                
                let is_hex_hash = ico_stem.len() >= 8 
                    && ico_stem.chars().all(|c| c.is_ascii_hexdigit());
                
                let ico_not_app = if is_hex_hash || app_clean.is_empty() || ico_stem.is_empty() { 
                    false
                } else {
                    !ico_stem.contains(&app_clean[..app_clean.len().min(5)])
                    && !app_clean.contains(&ico_stem[..ico_stem.len().min(5)])
                };

                if !is_uninstaller_ico && !ico_not_app {
                    if let Ok(bytes) = std::fs::read(exe_path) {
                        if bytes.len() > 20 {
                            return Some(format!("data:image/x-icon;base64,{}", base64_encode(&bytes)));
                        }
                    }
                }
                if let (Some(ref loc), true) = (&install_loc, install_loc.is_some()) {
                    if let Some(icon) = tim_icon_tu_start_menu_cho_path(loc) {
                        return Some(icon);
                    }
                }
                if let Some(icon) = Box::pin(tim_icon_tu_start_menu(app_name)).await {
                    return Some(icon);
                }
                if let Some(ref loc) = install_loc {
                    return tim_icon_trong_thu_muc(loc);
                }
                return None;
            }

            let exe_name_stem: String = exe_path.file_stem()
                .unwrap_or_default().to_string_lossy().to_lowercase()
                .chars().filter(|c| c.is_alphanumeric()).collect();

            if let Some(ref loc) = install_loc {
                let dir_stem: String = loc.file_name()
                    .unwrap_or_default().to_string_lossy().to_lowercase()
                    .chars().filter(|c| c.is_alphanumeric()).collect();

                if !dir_stem.is_empty() && !exe_name_stem.contains(&dir_stem[..dir_stem.len().min(5)]) {
                    if let Some(icon) = tim_icon_trong_thu_muc(loc) {
                        return Some(icon);
                    }
                }
            }

            if let Some(icon) = get_icon_from_exe(exe_path) {
                return Some(icon);
            }

            if let Some(parent) = exe_path.parent() {
                return tim_icon_trong_thu_muc(parent);
            }
        }
    }

    if let Some(dir_path) = icon_path.filter(|_| is_dir) {
        return tim_icon_trong_thu_muc(&dir_path);
    }

    if let Some(loc) = install_loc {
        return tim_icon_trong_thu_muc(&loc);
    }

    None
}

fn tim_icon_tu_where(app_name: &str) -> Option<String> {
    use std::process::Command;
    use std::os::windows::process::CommandExt;

    let kw: String = app_name.to_lowercase().chars().filter(|c| c.is_alphanumeric()).collect();
    let first_word: String = app_name.split_whitespace().next().unwrap_or("").to_lowercase().chars().filter(|c| c.is_alphanumeric()).collect();

    let mut search_keywords = vec![];
    if kw.len() >= 2 { search_keywords.push(kw.clone()); }
    if first_word.len() >= 2 && first_word != kw { search_keywords.push(first_word); }

    if kw.contains("java") { search_keywords.push("java".to_string()); search_keywords.push("javaw".to_string()); }
    if kw.contains("node") { search_keywords.push("node".to_string()); }
    if kw.contains("python") { search_keywords.push("python".to_string()); }

    if kw.contains("rustup") {
        let cargo_bin = std::env::var("USERPROFILE")
            .map(|h| std::path::PathBuf::from(h).join(".cargo").join("bin").join("rustup.exe"))
            .ok()
            .filter(|p| p.exists());
        if let Some(p) = cargo_bin {
            if let Some(icon) = get_icon_from_exe(&p) {
                return Some(icon);
            }
        }
    }

    for k in search_keywords {
        if k.len() < 3 { continue; }
        if let Ok(out) = Command::new("where.exe").arg(&k).creation_flags(0x08000000).output() {
            let stdout = String::from_utf8_lossy(&out.stdout);
            for line in stdout.lines() {
                let p = line.trim();
                if p.to_lowercase().ends_with(".exe") && std::path::Path::new(p).exists() {
                    if let Some(icon) = get_icon_from_exe(std::path::Path::new(p)) {
                        return Some(icon);
                    }
                }
            }
        }
    }
    None
}

async fn tim_icon_tu_start_menu(app_name: &str) -> Option<String> {
    use std::process::Command;
    use std::os::windows::process::CommandExt;

    let ps_script = format!(r#"
        $ErrorActionPreference = 'SilentlyContinue'
        $cleanQuery = ('{app}' -replace '[^a-zA-Z0-9]','').ToLower()
        $shell = New-Object -ComObject WScript.Shell
        $dirs = @(
            [Environment]::GetFolderPath('CommonPrograms'),
            [Environment]::GetFolderPath('Programs')
        )
        $bestScore = 0; $bestTarget = ''; $bestIcon = ''
        foreach ($dir in $dirs) {{
            Get-ChildItem $dir -Recurse -Filter '*.lnk' -EA SilentlyContinue | ForEach-Object {{
                $n = ($_.BaseName -replace '[^a-zA-Z0-9]','').ToLower()
                $score = 0
                if ($n -eq $cleanQuery)                              {{ $score = 3 }}
                elseif ($n -like "*$cleanQuery*" -or $cleanQuery -like "*$n*") {{ $score = 2 }}
                elseif ($n.Length -ge 4 -and $cleanQuery -like "$($n.Substring(0,[Math]::Min(5,$n.Length)))*") {{ $score = 1 }}
                if ($score -gt $bestScore) {{
                    try {{
                        $sc = $shell.CreateShortcut($_.FullName)
                        if ($sc.TargetPath) {{ $bestScore=$score; $bestTarget=$sc.TargetPath; $bestIcon=$sc.IconLocation }}
                    }} catch {{}}
                }}
            }}
        }}
        if ($bestScore -gt 0) {{
            if ($bestIcon -and $bestIcon -notmatch '^\s*,') {{
                $p = $bestIcon.Split(',')[0].Trim('"').Trim()
                $idx = if ($bestIcon -match ',\s*(-?\d+)$') {{ $matches[1] }} else {{ '0' }}
                if (Test-Path $p) {{ Write-Output "ICON:$p,$idx"; return }}
            }}
            if ($bestTarget -and (Test-Path $bestTarget)) {{ Write-Output "TARGET:$bestTarget" }}
        }}
    "#, app = app_name.replace('\'', "''"));

    let encoded = encode_ps_command(&ps_script);
    let out = Command::new("powershell")
        .args(["-NoProfile", "-ExecutionPolicy", "Bypass", "-EncodedCommand", &encoded])
        .creation_flags(0x08000000)
        .output().ok()?;

    let stdout = String::from_utf8_lossy(&out.stdout).to_string();

    for line in stdout.lines() {
        let line = line.trim();
        if let Some(info) = line.strip_prefix("ICON:") {
            let mut parts = info.splitn(2, ',');
            let file = parts.next().unwrap_or("").trim();
            let _idx: i32 = parts.next().and_then(|s| s.trim().parse().ok()).unwrap_or(0);
            let p = std::path::Path::new(file);
            if !p.exists() { continue; }
            let ext = p.extension().map(|e| e.to_string_lossy().to_lowercase());
            if ext.as_deref() == Some("ico") {
                if let Ok(bytes) = std::fs::read(p) {
                    return Some(format!("data:image/x-icon;base64,{}", base64_encode(&bytes)));
                }
            }
            return get_icon_from_exe(p);
        } else if let Some(target) = line.strip_prefix("TARGET:") {
            let p = std::path::Path::new(target);
            if p.exists() { return get_icon_from_exe(p); }
        }
    }
    None
}

fn tim_icon_tu_start_menu_cho_path(install_dir: &std::path::Path) -> Option<String> {
    use std::process::Command;
    use std::os::windows::process::CommandExt;

    let install_dir_str = install_dir.to_string_lossy().replace('\'', "''");

    let ps_script = format!(r#"
        $ErrorActionPreference = 'SilentlyContinue'
        $installDir = '{dir}'
        $shell = New-Object -ComObject WScript.Shell
        $dirs = @(
            [Environment]::GetFolderPath('CommonPrograms'),
            [Environment]::GetFolderPath('Programs')
        )
        foreach ($d in $dirs) {{
            Get-ChildItem $d -Recurse -Filter '*.lnk' -EA SilentlyContinue | ForEach-Object {{
                try {{
                    $sc = $shell.CreateShortcut($_.FullName)
                    if ($sc.TargetPath -and $sc.TargetPath.StartsWith($installDir, [StringComparison]::OrdinalIgnoreCase)) {{
                        if ($sc.IconLocation -and $sc.IconLocation -notmatch '^\s*,') {{
                            $p = $sc.IconLocation.Split(',')[0].Trim('"').Trim()
                            if (Test-Path $p) {{ Write-Output "ICON:$p"; return }}
                        }}
                        if (Test-Path $sc.TargetPath) {{ Write-Output "TARGET:$($sc.TargetPath)"; return }}
                    }}
                }} catch {{}}
            }}
        }}
    "#, dir = install_dir_str);

    let encoded = encode_ps_command(&ps_script);
    let out = Command::new("powershell")
        .args(["-NoProfile", "-ExecutionPolicy", "Bypass", "-EncodedCommand", &encoded])
        .creation_flags(0x08000000)
        .output().ok()?;

    let stdout = String::from_utf8_lossy(&out.stdout).to_string();
    for line in stdout.lines() {
        let line = line.trim();
        if let Some(ico) = line.strip_prefix("ICON:") {
            let p = std::path::Path::new(ico);
            if p.exists() {
                if p.extension().map(|e| e.to_string_lossy().to_lowercase()).as_deref() == Some("ico") {
                    if let Ok(bytes) = std::fs::read(p) {
                        return Some(format!("data:image/x-icon;base64,{}", base64_encode(&bytes)));
                    }
                }
                return get_icon_from_exe(p);
            }
        } else if let Some(target) = line.strip_prefix("TARGET:") {
            let p = std::path::Path::new(target);
            if p.exists() { return get_icon_from_exe(p); }
        }
    }
    None
}

fn tim_icon_tu_program_files(app_name: &str) -> Option<String> {
    use std::fs;
    use std::path::Path;

    let search_name: String = app_name.to_lowercase().chars().filter(|c| c.is_alphanumeric()).collect();
    if search_name.len() < 3 { return None; }

    let common_dirs: Vec<String> = [
        std::env::var("ProgramFiles").ok(),
        std::env::var("ProgramFiles(x86)").ok(),
        std::env::var("LOCALAPPDATA").ok(),
        std::env::var("APPDATA").ok(),
    ].into_iter().flatten().collect();

    for base_dir in &common_dirs {
        let base = Path::new(base_dir);
        if !base.exists() { continue; }
        if let Ok(entries) = fs::read_dir(base) {
            for entry in entries.flatten() {
                let entry_name: String = entry.file_name().to_string_lossy().to_lowercase()
                    .chars().filter(|c| c.is_alphanumeric()).collect();

                if entry_name.contains(&search_name[..std::cmp::min(5, search_name.len())]) {
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

fn tim_icon_trong_thu_muc(dir: &std::path::Path) -> Option<String> {
    tim_icon_trong_thu_muc_impl(dir, 0)
}

fn tim_icon_trong_thu_muc_impl(dir: &std::path::Path, depth: u32) -> Option<String> {
    use std::fs;

    if depth > 3 { return None; }
    if !dir.exists() || !dir.is_dir() { return None; }

    let dir_name: String = dir.file_name()
        .unwrap_or_default()
        .to_string_lossy()
        .to_lowercase();
    let dir_name_clean: String = dir_name.chars().filter(|c| c.is_alphanumeric()).collect();

    let mut exes: Vec<(std::path::PathBuf, u64)> = vec![];
    let mut subdirs: Vec<std::path::PathBuf> = vec![];
    let mut best_ico: Option<std::path::PathBuf> = None;

    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            let name = path.file_name().unwrap_or_default().to_string_lossy().to_lowercase();

            if path.is_dir() {
                subdirs.push(path.clone());
            } else {
                if name.ends_with(".ico") {
                    let ico_stem: String = path.file_stem()
                        .unwrap_or_default()
                        .to_string_lossy()
                        .to_lowercase()
                        .chars()
                        .filter(|c| c.is_alphanumeric())
                        .collect();
                    if !dir_name_clean.is_empty() &&
                       (ico_stem == dir_name_clean || ico_stem.contains(&dir_name_clean) || dir_name_clean.contains(&ico_stem)) {
                        if let Ok(bytes) = fs::read(&path) {
                            return Some(format!("data:image/x-icon;base64,{}", base64_encode(&bytes)));
                        }
                    }
                    let is_generic_subdir = matches!(
                        dir_name.as_str(),
                        "resources" | "assets" | "icons" | "images" | "img"
                    );
                    if name == "app.ico" && is_generic_subdir {
                    } else if best_ico.is_none() {
                        best_ico = Some(path.clone());
                    }
                }

                if name.ends_with(".exe") {
                    let is_updater = matches!(
                        name.as_str(),
                        "update.exe" | "squirrel.exe" | "uninstall.exe" | "unins000.exe"
                        | "uninst.exe" | "setup.exe" | "installer.exe" | "crashhandler.exe"
                        | "crashpad_handler.exe" | "elevate.exe" | "notification_helper.exe"
                        | "uninstaller.exe"
                    ) || name.contains("uninstall") || name.contains("uninst")
                      || name.starts_with("applicator.");
                    if !is_updater {
                        if let Ok(meta) = fs::metadata(&path) {
                            exes.push((path, meta.len()));
                        }
                    }
                }
            }
        }
    }

    let max_exe_size = exes.iter().map(|(_, s)| *s).max().unwrap_or(0);

    if let Some((matched_exe, matched_size)) = exes.iter().find(|(p, _)| {
        let exe_name: String = p.file_stem()
            .unwrap_or_default()
            .to_string_lossy()
            .to_lowercase()
            .chars()
            .filter(|c| c.is_alphanumeric())
            .collect();
        exe_name == dir_name_clean || dir_name_clean.starts_with(&exe_name) || exe_name.starts_with(&dir_name_clean)
    }) {
        let is_overshadowed = max_exe_size > 0 && *matched_size > 0
            && *matched_size * 10 < max_exe_size;

        if !is_overshadowed {
            if let Some(resources_dir) = subdirs.iter().find(|p| {
                p.file_name().unwrap_or_default().to_string_lossy().to_lowercase() == "resources"
            }) {
                if let Some(icon) = tim_ico_trong_resources(resources_dir, &dir_name_clean) {
                    return Some(icon);
                }
            }
            if let Some(icon) = get_icon_from_exe(matched_exe) {
                return Some(icon);
            }
        }
    }

    let mut app_version_dirs: Vec<&std::path::PathBuf> = subdirs.iter()
        .filter(|p| {
            let n = p.file_name().unwrap_or_default().to_string_lossy().to_lowercase();
            n.starts_with("app-") || n == "current"
        })
        .collect();
    app_version_dirs.sort_by(|a, b| b.file_name().cmp(&a.file_name()));

    for app_dir in app_version_dirs {
        if let Some(icon) = tim_icon_trong_thu_muc_impl(app_dir, depth + 1) {
            return Some(icon);
        }
    }

    exes.sort_by_key(|k| k.1);
    if let Some((largest_exe, _)) = exes.last() {
        if let Some(resources_dir) = subdirs.iter().find(|p| {
            p.file_name().unwrap_or_default().to_string_lossy().to_lowercase() == "resources"
        }) {
            if let Some(icon) = tim_ico_trong_resources(resources_dir, &dir_name_clean) {
                return Some(icon);
            }
        }
        if let Some(icon) = get_icon_from_exe(largest_exe) {
            return Some(icon);
        }
    }

    if let Some(ico_path) = best_ico {
        if let Ok(bytes) = std::fs::read(&ico_path) {
            return Some(format!("data:image/x-icon;base64,{}", base64_encode(&bytes)));
        }
    }

    let known_subdirs = ["bin", "client", "resources", "app"];
    for known in &known_subdirs {
        if let Some(sub) = subdirs.iter().find(|p| {
            p.file_name().unwrap_or_default().to_string_lossy().to_lowercase() == *known
        }) {
            if let Some(icon) = tim_icon_trong_thu_muc_impl(sub, depth + 1) {
                return Some(icon);
            }
        }
    }

    None
}

fn tim_ico_trong_resources(resources_dir: &std::path::Path, app_name_hint: &str) -> Option<String> {
    use std::fs;

    if !resources_dir.exists() { return None; }

    let Ok(entries) = fs::read_dir(resources_dir) else { return None; };

    let mut best_ico: Option<std::path::PathBuf> = None;

    for entry in entries.flatten() {
        let path = entry.path();
        let name = path.file_name().unwrap_or_default().to_string_lossy().to_lowercase();

        if name.ends_with(".ico") {
            let stem: String = path.file_stem()
                .unwrap_or_default()
                .to_string_lossy()
                .to_lowercase()
                .chars()
                .filter(|c| c.is_alphanumeric())
                .collect();

            if !app_name_hint.is_empty() &&
               (stem == app_name_hint || stem.contains(app_name_hint) || app_name_hint.contains(&stem)) {
                if let Ok(bytes) = fs::read(&path) {
                    return Some(format!("data:image/x-icon;base64,{}", base64_encode(&bytes)));
                }
            }
            if best_ico.is_none() {
                best_ico = Some(path.clone());
            }
        }

        if path.is_dir() {
            let dname = name.as_str();
            if dname == "app" || dname == "electron.asar.unpacked" {
                if let Ok(sub_entries) = fs::read_dir(&path) {
                    for sub_entry in sub_entries.flatten() {
                        let sub_path = sub_entry.path();
                        let sub_name = sub_path.file_name().unwrap_or_default().to_string_lossy().to_lowercase();
                        if sub_name.ends_with(".ico") && best_ico.is_none() {
                            best_ico = Some(sub_path);
                        }
                    }
                }
            }
        }
    }

    if let Some(ico_path) = best_ico {
        if let Ok(bytes) = fs::read(&ico_path) {
            return Some(format!("data:image/x-icon;base64,{}", base64_encode(&bytes)));
        }
    }

    None
}

fn get_icon_from_exe(path: &std::path::Path) -> Option<String> {
    use std::process::Command;
    use std::os::windows::process::CommandExt;

    if !path.exists() { return None; }
    let path_str = path.to_string_lossy().to_string();

    if let Some(parent) = path.parent() {
        if let Some(stem) = path.file_stem() {
            let ico_path = parent.join(format!("{}.ico", stem.to_string_lossy()));
            if ico_path.exists() {
                if let Ok(bytes) = std::fs::read(&ico_path) {
                    return Some(format!("data:image/x-icon;base64,{}", base64_encode(&bytes)));
                }
            }
        }
    }

    let ps_script = format!(r#"
        $ErrorActionPreference = 'SilentlyContinue'
        Add-Type -AssemblyName System.Drawing
        try {{
            $icons = $null
            try {{
                $stream = [System.IO.File]::OpenRead('{0}')
                $icons = New-Object System.Drawing.Icon($stream, 256, 256)
                $stream.Close()
            }} catch {{}}
            $icon = if ($icons -and $icons.Width -gt 32) {{ $icons }} else {{ [System.Drawing.Icon]::ExtractAssociatedIcon('{0}') }}
            if ($icon -and $icon.Width -gt 1) {{
                $bmp = $icon.ToBitmap()
                # Upscale lên 64x64 để UI không bị mờ (nhất là Google Play Games 32x32)
                $bmp64 = New-Object System.Drawing.Bitmap(64, 64)
                $g = [System.Drawing.Graphics]::FromImage($bmp64)
                $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
                $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
                $g.DrawImage($bmp, 0, 0, 64, 64)
                $g.Dispose(); $bmp.Dispose()
                $ms = New-Object System.IO.MemoryStream
                $bmp64.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
                $b64 = [Convert]::ToBase64String($ms.ToArray())
                $ms.Close(); $icon.Dispose(); $bmp64.Dispose()
                Write-Output "data:image/png;base64,$b64"
            }}
        }} catch {{ }}
    "#, path_str.replace('\'', "''"));

    let encoded = encode_ps_command(&ps_script);
    let output = Command::new("powershell")
        .args(["-NoProfile", "-ExecutionPolicy", "Bypass", "-EncodedCommand", &encoded])
        .creation_flags(0x08000000)
        .output()
        .ok()?;

    let icon_data = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if icon_data.starts_with("data:image/") {
        Some(icon_data)
    } else {
        None
    }
}

fn base64_encode(data: &[u8]) -> String {
    use base64::{Engine as _, engine::general_purpose};
    general_purpose::STANDARD.encode(data)
}

pub(crate) fn encode_ps_command(script: &str) -> String {
    use base64::{Engine as _, engine::general_purpose};
    general_purpose::STANDARD.encode(
        script.encode_utf16().flat_map(|c| c.to_le_bytes()).collect::<Vec<u8>>()
    )
}

#[derive(Serialize)]
pub struct ThongTinThem {
    date: String,
    size: String,
}

#[tauri::command]
pub async fn LayThongTinThem(TenApp: String, ViTriCaiDat: Option<String>, NgayCaiRegistry: Option<String>) -> ThongTinThem {
    use std::fs;
    use std::path::Path;

    let mut install_loc = ViTriCaiDat.unwrap_or_default();

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
                        if (dir_name == search_name || (dir_name.len() >= 6 && search_name.starts_with(&dir_name)))
                            && entry.path().is_dir() {
                                install_loc = entry.path().to_string_lossy().to_string();
                                break;
                            }
                    }
                }
                if !install_loc.is_empty() { break; }
            }
        }
    }

    if install_loc.is_empty() {
        let search_name: String = TenApp.to_lowercase().chars().filter(|c| c.is_alphanumeric()).collect();
        let appdata_dirs: Vec<String> = [
            std::env::var("APPDATA").ok(),
            std::env::var("LOCALAPPDATA").ok(),
            std::env::var("USERPROFILE").ok().map(|h| format!("{}\\.rustup", h)),
            std::env::var("USERPROFILE").ok().map(|h| format!("{}\\AppData\\Roaming", h)),
        ].into_iter().flatten().collect();

        for base in &appdata_dirs {
            if let Ok(entries) = fs::read_dir(base) {
                for entry in entries.flatten() {
                    let dir_name: String = entry.file_name().to_string_lossy().to_lowercase()
                        .chars().filter(|c| c.is_alphanumeric()).collect();
                    if (dir_name == search_name || (dir_name.len() >= 4 && search_name.starts_with(&dir_name[..dir_name.len().min(6)])))
                        && entry.path().is_dir() {
                        install_loc = entry.path().to_string_lossy().to_string();
                        break;
                    }
                }
            }
            if !install_loc.is_empty() { break; }
        }
    }

    if install_loc.is_empty() && TenApp.to_lowercase().contains("rustup") {
        if let Ok(home) = std::env::var("USERPROFILE") {
            let rustup_path = std::path::PathBuf::from(&home).join(".rustup");
            if rustup_path.exists() {
                install_loc = rustup_path.to_string_lossy().to_string();
            }
        }
    }

    if install_loc.is_empty() {
        return ThongTinThem { date: String::new(), size: "0".to_string() };
    }

    install_loc = install_loc.trim_matches('"').trim().to_string();
    let path = Path::new(&install_loc);

    let mut date_str = String::new();
    if let Some(ref reg_date) = NgayCaiRegistry {
        let rd = reg_date.trim();
        if rd.len() == 8 {
            if let (Ok(y), Ok(m), Ok(d)) = (
                rd[0..4].parse::<u32>(),
                rd[4..6].parse::<u32>(),
                rd[6..8].parse::<u32>(),
            ) {
                if (2000..=2100).contains(&y) && (1..=12).contains(&m) && (1..=31).contains(&d) {
                    date_str = format!("{}{:02}{:02}", y, m, d);
                }
            }
        }
    }

    if date_str.is_empty() {
        if let Ok(meta) = fs::metadata(path) {
        if let Ok(created) = meta.created() {
            let duration = created.duration_since(std::time::UNIX_EPOCH).unwrap_or_default();
            let secs = duration.as_secs() as i64;
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
    }
    let size_str = tinh_dung_luong_thu_muc(path).to_string();

    ThongTinThem { date: date_str, size: size_str }
}

fn tinh_dung_luong_thu_muc(dir: &std::path::Path) -> u64 {
    use std::fs;
    use std::sync::atomic::{AtomicU64, Ordering};
    use std::sync::Arc;

    let total = Arc::new(AtomicU64::new(0));
    let mut queue = vec![dir.to_path_buf()];

    while let Some(current) = queue.pop() {
        if let Ok(entries) = fs::read_dir(&current) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    queue.push(path);
                } else {
                    if let Ok(meta) = entry.metadata() {
                        total.fetch_add(meta.len(), Ordering::Relaxed);
                    }
                }
            }
        }
    }
    total.load(Ordering::Relaxed)
}
#[tauri::command]
pub async fn LayIconDebug(TenApp: String) -> serde_json::Value {
    use std::process::Command;
    use std::os::windows::process::CommandExt;
    use std::fs;

    let mut log: Vec<String> = vec![];
    log.push(format!("=== Debug icon cho: '{}' ===", TenApp));

    log.push(format!("[StartMenu] searching shortcut cho: {}", TenApp));
    let start_menu_res = tim_icon_tu_start_menu(&TenApp).await;
    log.push(format!("[StartMenu] result: {}", if start_menu_res.is_some() { "GOT ICON" } else { "NONE" }));

    let ps_script = format!(r#"
        $ErrorActionPreference = 'SilentlyContinue'
        $appName = '{}'
        $paths = @(
            "HKLM:\Software\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*",
            "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*",
            "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*"
        )
        $app = Get-ItemProperty $paths | Where-Object {{ $_.DisplayName -eq $appName }} | Select-Object -First 1
        if ($app) {{
            Write-Output "FOUND:1"
            Write-Output "DisplayIcon:$($app.DisplayIcon)"
            Write-Output "InstallLocation:$($app.InstallLocation)"
            Write-Output "UninstallString:$($app.UninstallString)"
        }} else {{
            Write-Output "FOUND:0"
        }}
    "#, TenApp.replace('\'', "''"));

    let encoded = encode_ps_command(&ps_script);
    let ps_out = Command::new("powershell")
        .args(["-NoProfile", "-ExecutionPolicy", "Bypass", "-EncodedCommand", &encoded])
        .creation_flags(0x08000000)
        .output();

    let mut registry_found = false;
    let mut display_icon = String::new();
    let mut install_location = String::new();

    match ps_out {
        Err(e) => { log.push(format!("[Registry] PowerShell error: {}", e)); }
        Ok(out) => {
            let stdout = String::from_utf8_lossy(&out.stdout).to_string();
            let stderr = String::from_utf8_lossy(&out.stderr).to_string();
            log.push(format!("[Registry] stdout: {:?}", stdout.trim()));
            if !stderr.trim().is_empty() {
                log.push(format!("[Registry] stderr: {:?}", stderr.trim()));
            }
            for line in stdout.lines() {
                let line = line.trim();
                if line == "FOUND:1" { registry_found = true; }
                if let Some(v) = line.strip_prefix("DisplayIcon:") { display_icon = v.to_string(); }
                if let Some(v) = line.strip_prefix("InstallLocation:") { install_location = v.to_string(); }
            }
        }
    }

    log.push(format!("[Registry] found={}, DisplayIcon={:?}, InstallLocation={:?}",
        registry_found, display_icon, install_location));

    if !display_icon.is_empty() {
        let mut icon_path = display_icon.replace('"', "");
        if icon_path.contains(',') { icon_path = icon_path.split(',').next().unwrap_or("").to_string(); }
        icon_path = icon_path.trim().to_string();

        let p = std::path::Path::new(&icon_path);
        let exists = p.exists();
        let is_dir = p.is_dir();
        let file_name = p.file_name().unwrap_or_default().to_string_lossy().to_lowercase();

        log.push(format!("[DisplayIcon] parsed={:?}, exists={}, is_dir={}, filename={:?}",
            icon_path, exists, is_dir, file_name));

        const UPDATER_NAMES: &[&str] = &["update.exe","squirrel.exe","uninstall.exe","unins000.exe","uninst.exe"];
        if UPDATER_NAMES.contains(&file_name.as_str()) {
            log.push("[DisplayIcon] ⚠ Phát hiện updater exe! → sẽ tìm trong thư mục cha".to_string());
            let search = if !install_location.is_empty() && std::path::Path::new(&install_location).exists() {
                install_location.clone()
            } else {
                p.parent().unwrap_or(p).to_string_lossy().to_string()
            };
            log.push(format!("[DisplayIcon] → search_dir={:?}", search));
            let search_p = std::path::Path::new(&search);
            if let Ok(entries) = fs::read_dir(search_p) {
                let names: Vec<String> = entries.flatten()
                    .map(|e| e.file_name().to_string_lossy().to_string())
                    .collect();
                log.push(format!("[DisplayIcon] → contents: {:?}", names));
            }
        }
    }

    let kw: String = TenApp.to_lowercase().chars().filter(|c| c.is_alphanumeric()).collect();
    log.push(format!("[Where] keyword={:?}", kw));
    if kw.len() >= 3 {
        match Command::new("where.exe").arg(&kw).creation_flags(0x08000000).output() {
            Ok(out) => {
                let s = String::from_utf8_lossy(&out.stdout);
                log.push(format!("[Where] result: {:?}", s.trim()));
            }
            Err(e) => { log.push(format!("[Where] error: {}", e)); }
        }
    }

    let search_name: String = TenApp.to_lowercase().chars().filter(|c| c.is_alphanumeric()).collect();
    let prefix = &search_name[..std::cmp::min(5, search_name.len())];
    log.push(format!("[ProgramFiles] searching prefix={:?}", prefix));

    let common_dirs: Vec<String> = [
        std::env::var("ProgramFiles").ok(),
        std::env::var("ProgramFiles(x86)").ok(),
        std::env::var("LOCALAPPDATA").ok(),
        std::env::var("APPDATA").ok(),
    ].into_iter().flatten().collect();

    for base_dir in &common_dirs {
        if let Ok(entries) = fs::read_dir(base_dir) {
            let matches: Vec<String> = entries.flatten()
                .filter(|e| {
                    let n: String = e.file_name().to_string_lossy().to_lowercase()
                        .chars().filter(|c| c.is_alphanumeric()).collect();
                    n.contains(prefix)
                })
                .map(|e| e.path().to_string_lossy().to_string())
                .collect();
            if !matches.is_empty() {
                log.push(format!("[ProgramFiles] {} → matches: {:?}", base_dir, matches));
                for matched_dir in &matches {
                    log.push(format!("[PFDir] scanning: {}", matched_dir));
                    if let Ok(dir_entries) = std::fs::read_dir(matched_dir) {
                        for entry in dir_entries.flatten() {
                            let name = entry.file_name().to_string_lossy().to_lowercase();
                            if name.ends_with(".exe") || name.ends_with(".ico") || entry.path().is_dir() {
                                log.push(format!("[PFDir]   found: {}", entry.path().display()));
                            }
                        }
                    }
                    let icon_result = tim_icon_trong_thu_muc(std::path::Path::new(matched_dir));
                    log.push(format!("[PFDir] icon result: {}", if icon_result.is_some() { "GOT ICON" } else { "NONE" }));
                }
            }
        }
    }

    log.push("=== End debug ===".to_string());
    serde_json::json!({ "log": log })
}

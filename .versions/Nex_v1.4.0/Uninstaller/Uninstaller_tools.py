# Uninstaller/Uninstaller_tools.py
import winreg
from pathlib import Path
from PyQt6.QtCore import Qt, QThread, pyqtSignal
from PyQt6.QtWidgets import (QCheckBox, QHBoxLayout, QLabel, QWidget)
from PyQt6.QtGui import QIcon, QPixmap, QPainter
import win32gui
import win32api
import win32con
import os
import shlex
from datetime import datetime
import ctypes
from ctypes import wintypes
import json
import subprocess
import pythoncom
from win32com.client import Dispatch

MsiGetProductInfo = ctypes.windll.msi.MsiGetProductInfoW
MsiGetProductInfo.argtypes = [wintypes.LPCWSTR, wintypes.LPCWSTR, wintypes.LPWSTR, ctypes.POINTER(wintypes.DWORD)]
MsiGetProductInfo.restype = wintypes.UINT

def get_msi_property(product_code, property_name):
    buffer_size = wintypes.DWORD(256)
    buffer = ctypes.create_unicode_buffer(buffer_size.value)
    if MsiGetProductInfo(product_code, property_name, buffer, ctypes.byref(buffer_size)) == 0:
        return buffer.value
    return None

def get_folder_creation_date(folder_path: str) -> str | None:
    if not folder_path or not os.path.isdir(folder_path): return None
    try:
        timestamp = os.path.getctime(folder_path)
        return datetime.fromtimestamp(timestamp).strftime('%Y%m%d')
    except OSError: return None

def get_folder_size(folder_path: str) -> int | None:
    if not folder_path or not os.path.isdir(folder_path): return None
    total_size = 0
    try:
        for dirpath, _, filenames in os.walk(folder_path):
            for f in filenames:
                fp = os.path.join(dirpath, f)
                if not os.path.islink(fp):
                    try: total_size += os.path.getsize(fp)
                    except OSError: pass
    except OSError: return None
    return total_size // 1024

def format_install_date(date_str: str, language: str) -> str:
    if not date_str or not isinstance(date_str, str) or len(date_str) != 8: return "N/A"
    try:
        date_obj = datetime.strptime(date_str, '%Y%m%d')
        if language == 'VN': return date_obj.strftime('%d/%m/%Y')
        else: return date_obj.strftime('%m/%d/%Y')
    except ValueError: return "N/A"

def format_size(size_kb):
    if size_kb is None or size_kb == -1: return "N/A"
    try:
        size_kb = int(size_kb)
        if size_kb == 0: return "N/A"
        if size_kb < 1024: return f"{size_kb} KB"
        elif size_kb < 1024 * 1024: return f"{size_kb / 1024:.1f} MB"
        else: return f"{size_kb / (1024 * 1024):.1f} GB"
    except (ValueError, TypeError): return "N/A"

def get_icon_path_from_uninstall_string(uninstall_string: str) -> str:
    if not uninstall_string: return ""
    try:
        parts = shlex.split(uninstall_string)
        path = parts[0]
        if os.path.exists(path) and (path.lower().endswith('.exe') or path.lower().endswith('.dll')):
            return path
    except Exception: pass
    return ""

def get_app_icon(icon_string: str) -> QIcon:
    if not icon_string:
        return QIcon()

    try:
        path_part = icon_string.split(',')[0].strip('"').strip()
        index_str = '0'
        if ',' in icon_string:
            try:
                index_str = icon_string.split(',')[1]
                int(index_str)
            except (ValueError, IndexError):
                index_str = '0'

        path = win32api.ExpandEnvironmentStrings(path_part)
        
        if not path or not os.path.exists(path):
            return QIcon()

        index = int(index_str)
        
        if any(path.lower().endswith(ext) for ext in ['.ico', '.png', '.jpg', '.bmp']):
            pixmap = QPixmap(path)
            return QIcon() if pixmap.isNull() else QIcon(pixmap)

        large, small = win32gui.ExtractIconEx(path, index, 1)
        all_icons = large + small
        hicon = None
        pixmap = QPixmap()

        try:
            if all_icons:
                hicon = all_icons[0]
            
            if not hicon:
                return QIcon()

            pixmap = QPixmap(32, 32)
            pixmap.fill(Qt.GlobalColor.transparent)
            
            painter = QPainter()
            try:
                if painter.begin(pixmap):
                    hdc = int(painter.device().paintEngine().hDC())
                    win32gui.DrawIconEx(hdc, 0, 0, hicon, 32, 32, 0, 0, win32con.DI_NORMAL)
            finally:
                if painter.isActive():
                    painter.end()

            return QIcon(pixmap)

        finally:
            for i in all_icons:
                if i:
                    try:
                        win32gui.DestroyIcon(i)
                    except Exception:
                        pass
    except Exception:
        return QIcon()
    
    return QIcon()

def scan_start_menu_shortcuts():
    icon_map = {}
    start_menu_paths = [
        os.path.join(os.environ['PROGRAMDATA'], 'Microsoft', 'Windows', 'Start Menu', 'Programs'),
        os.path.join(os.environ['APPDATA'], 'Microsoft', 'Windows', 'Start Menu', 'Programs')
    ]
    try:
        pythoncom.CoInitialize()
        shell = Dispatch("WScript.Shell")
        for path in start_menu_paths:
            if not os.path.isdir(path): continue
            for root, _, files in os.walk(path):
                for file in files:
                    if file.lower().endswith('.lnk'):
                        try:
                            shortcut_path = os.path.join(root, file)
                            shortcut = shell.CreateShortcut(shortcut_path)
                            target_path = shortcut.TargetPath
                            icon_path = shortcut.IconLocation
                            if target_path and os.path.exists(target_path):
                                app_name = os.path.splitext(file)[0]
                                icon_to_use = icon_path.split(',')[0] if icon_path else target_path
                                if icon_to_use:
                                    icon_map[app_name.lower()] = icon_to_use
                        except Exception:
                            continue
    finally:
        pythoncom.CoUninitialize()
    return icon_map

def scan_uwp_apps(language):
    command = """
    Get-AppxPackage -AllUsers | 
    Where-Object {$_.SignatureKind -ne 'System' -and $_.IsFramework -eq $false} | 
    Select-Object Name, Publisher, Version, InstallLocation, @{Name='Logo'; Expression={$_.InstallLocation + '\\' + (Get-AppxPackageManifest $_).Package.Logo}}, PackageFullName | 
    ConvertTo-Json
    """
    try:
        proc = subprocess.Popen(
            ['powershell.exe', '-ExecutionPolicy', 'Bypass', '-NoProfile', '-Command', command],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, creationflags=subprocess.CREATE_NO_WINDOW
        )
        stdout, _ = proc.communicate(timeout=60)
        if not stdout: return []
        
        json_str = f"[{','.join(stdout.strip().split('}\\n{'))}]"
        uwp_apps_data = json.loads(json_str)
        uwp_apps_list = []
        for app in uwp_apps_data:
            publisher_name = app['Publisher']
            if publisher_name.startswith("CN="):
                publisher_name = publisher_name.split('CN=')[1].split(',')[0]

            install_loc = app.get('InstallLocation')
            install_date_raw = get_folder_creation_date(install_loc)
            size_kb = get_folder_size(install_loc)

            uwp_apps_list.append({
                "name": app['Name'], "app_type": "uwp",
                "uninstall_string": app['PackageFullName'], "publisher": publisher_name,
                "install_date": install_date_raw, "install_date_str": format_install_date(install_date_raw, language),
                "date_is_estimate": True, "size_kb": size_kb, "size_str": format_size(size_kb),
                "size_is_estimate": True, "icon": get_app_icon(app.get('Logo')),
            })
        return uwp_apps_list
    except Exception:
        return []

class AppScannerWorker(QThread):
    finished = pyqtSignal(list)
    def __init__(self, language='EN'):
        super().__init__()
        self.language = language

    def run(self):
        shortcut_icon_map = scan_start_menu_shortcuts()
        win32_apps = self._scan_win32_apps(shortcut_icon_map)
        uwp_apps = scan_uwp_apps(self.language)
        
        all_apps = win32_apps
        win32_ids = {app['id'] for app in win32_apps}
        for uwp_app in uwp_apps:
            uwp_id = f"{uwp_app['name']}|{uwp_app['publisher']}"
            if uwp_id.lower() not in win32_ids:
                all_apps.append(uwp_app)

        for app in all_apps:
            app.pop('id', None)

        self.finished.emit(all_apps)

    def _get_reg_value(self, key, subkey_name, value_name):
        try:
            with winreg.OpenKey(key, subkey_name) as subkey:
                value, _ = winreg.QueryValueEx(subkey, value_name)
                return value
        except (FileNotFoundError, OSError): return None

    def _scan_win32_apps(self, shortcut_icon_map):
        apps = []
        scan_locations = [
            (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall"),
            (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall"),
            (winreg.HKEY_CURRENT_USER, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall"),
        ]
        
        processed_apps = set()

        for root_key, path in scan_locations:
            try:
                key = winreg.OpenKey(root_key, path)
                for i in range(winreg.QueryInfoKey(key)[0]):
                    subkey_name = winreg.EnumKey(key, i)
                    
                    display_name = self._get_reg_value(key, subkey_name, "DisplayName")
                    uninstall_string = self._get_reg_value(key, subkey_name, "UninstallString")
                    
                    if not display_name or not uninstall_string:
                        continue
                    
                    display_name = display_name.strip()
                    publisher = (self._get_reg_value(key, subkey_name, "Publisher") or "N/A").strip()

                    if self._get_reg_value(key, subkey_name, "SystemComponent") == 1:
                        continue
                    if self._get_reg_value(key, subkey_name, "NoRemove") == 1:
                        continue
                    if self._get_reg_value(key, subkey_name, "ParentKeyName"):
                        continue
                    release_type = (self._get_reg_value(key, subkey_name, "ReleaseType") or "").lower()
                    if "update" in release_type or "hotfix" in release_type:
                        continue

                    app_identifier = f"{display_name.lower()}|{publisher.lower()}"
                    if app_identifier in processed_apps:
                        continue
                    
                    install_location = self._get_reg_value(key, subkey_name, "InstallLocation")
                    
                    display_icon_str = self._get_reg_value(key, subkey_name, "DisplayIcon")
                    if not display_icon_str:
                        display_icon_str = get_icon_path_from_uninstall_string(uninstall_string)
                    if not display_icon_str:
                        display_icon_str = shortcut_icon_map.get(display_name.lower())
                    app_icon = get_app_icon(display_icon_str)
                    
                    size_kb = self._get_reg_value(key, subkey_name, "EstimatedSize")
                    size_is_estimate = False
                    if not isinstance(size_kb, int):
                        if install_location and os.path.isdir(install_location):
                            size_from_folder = get_folder_size(install_location)
                            if size_from_folder:
                                size_kb = size_from_folder
                                size_is_estimate = True
                        else:
                             size_kb = -1
                    
                    install_date_raw = self._get_reg_value(key, subkey_name, "InstallDate")
                    date_is_estimate = False
                    if not install_date_raw and install_location and os.path.isdir(install_location):
                        install_date_raw = get_folder_creation_date(install_location)
                        date_is_estimate = True
                    
                    apps.append({
                        "id": app_identifier,
                        "name": display_name, "app_type": "win32",
                        "uninstall_string": uninstall_string,
                        "quiet_uninstall_string": self._get_reg_value(key, subkey_name, "QuietUninstallString"),
                        "publisher": publisher,
                        "install_date": install_date_raw, "install_date_str": format_install_date(install_date_raw, self.language),
                        "date_is_estimate": date_is_estimate, 
                        "size_kb": size_kb, "size_str": format_size(size_kb), 
                        "size_is_estimate": size_is_estimate,
                        "icon": app_icon if not app_icon.isNull() else QIcon()
                    })
                    processed_apps.add(app_identifier)
            except FileNotFoundError:
                continue
            finally:
                if 'key' in locals() and key:
                    winreg.CloseKey(key)
        return apps

def create_app_row_widget(app_data, fallback_icon, t):
    row_container = QWidget(objectName="rowContainer")
    row_layout = QHBoxLayout(row_container)
    row_layout.setContentsMargins(10, 5, 10, 5)
    row_layout.setSpacing(10)

    checkbox = QCheckBox()
    checkbox.setObjectName("rowCheckbox")
    checkbox.setProperty("app_data", app_data)
    checkbox.setFixedSize(20, 20)
    row_layout.addWidget(checkbox, 0, Qt.AlignmentFlag.AlignVCenter)

    icon_label = QLabel()
    icon_label.setObjectName("appIconLabel")
    icon_label.setFixedSize(32, 32)
    icon_label.setScaledContents(True)

    app_icon = app_data.get("icon")
    if app_icon and not app_icon.isNull():
        icon_label.setPixmap(app_icon.pixmap(32, 32))
    else:
        icon_label.setPixmap(fallback_icon.pixmap(32, 32))

    row_layout.addWidget(icon_label, 0, Qt.AlignmentFlag.AlignVCenter)

    name_label = QLabel(app_data['name'])
    name_label.setObjectName("nameLabel")
    name_label.setWordWrap(True)
    row_layout.addWidget(name_label, 5)

    publisher_label = QLabel(app_data.get('publisher', 'N/A'))
    publisher_label.setObjectName("publisherLabel")
    row_layout.addWidget(publisher_label, 3)

    date_label = QLabel(app_data.get('install_date_str', 'N/A'))
    date_label.setObjectName("dateLabel")
    date_label.setMinimumWidth(80)
    date_label.setAlignment(Qt.AlignmentFlag.AlignCenter)

    if app_data.get("date_is_estimate", False):
        date_label.setProperty("is_estimate", True)
        date_label.setToolTip(t['estimated_date_tooltip'])

    row_layout.addWidget(date_label, 1)

    size_label = QLabel(app_data.get('size_str', 'N/A'))
    size_label.setObjectName("sizeLabel")
    size_label.setMinimumWidth(80)
    size_label.setAlignment(Qt.AlignmentFlag.AlignCenter)

    if app_data.get("size_is_estimate", False):
        size_label.setProperty("is_estimate", True)
        size_label.setToolTip(t['estimated_size_tooltip'])

    row_layout.addWidget(size_label, 1)

    return row_container
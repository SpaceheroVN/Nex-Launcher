# Uninstaller/Uninstaller_tools.py
import winreg
from pathlib import Path
from PyQt6.QtCore import Qt, QThread, pyqtSignal
from PyQt6.QtWidgets import (QCheckBox, QHBoxLayout, QLabel, QWidget)
from PyQt6.QtGui import QIcon, QPixmap, QImage, QPainter
import win32gui
import win32api
import win32con
import os
import shlex

def format_size(size_kb):
    if size_kb is None: return "N/A"
    try:
        size_kb = int(size_kb)
        if size_kb < 1024: return f"{size_kb} KB"
        elif size_kb < 1024 * 1024: return f"{size_kb / 1024:.1f} MB"
        else: return f"{size_kb / (1024 * 1024):.1f} GB"
    except (ValueError, TypeError): return "N/A"

def get_icon_path_from_uninstall_string(uninstall_string: str) -> str:
    if not uninstall_string:
        return ""
    try:
        parts = shlex.split(uninstall_string)
        path = parts[0]
        if os.path.exists(path) and (path.lower().endswith('.exe') or path.lower().endswith('.dll')):
            return path
    except Exception:
        pass
    return ""

def get_app_icon(icon_string: str) -> QIcon:
    if not icon_string:
        return QIcon()

    try:
        path_part = icon_string.split(',')[0].strip('"')
        index_str = '0'
        if ',' in icon_string:
            index_str = icon_string.split(',')[1]

        path = win32api.ExpandEnvironmentStrings(path_part)
        index = int(index_str)

        if not os.path.exists(path):
            return QIcon()

        # Xử lý các định dạng ảnh trực tiếp mà QIcon hỗ trợ (ico, png, v.v.)
        if any(path.lower().endswith(ext) for ext in ['.ico', '.png', '.jpg', '.bmp']):
            return QIcon(path)

        # Trích xuất HICON từ file exe/dll
        large, small = win32gui.ExtractIconEx(path, index, 1)
        hicon = 0
        all_icons = (large or []) + (small or [])

        try:
            if large and large[0] != 0:
                hicon = large[0]
            elif small and small[0] != 0:
                hicon = small[0]
            else:
                return QIcon()

            # Lấy thông tin và kích thước của icon
            icon_info = win32gui.GetIconInfo(hicon)
            bmp = win32api.GetObject(icon_info[3])
            width, height = bmp.bmWidth, bmp.bmHeight

            # Tạo một QPixmap trống và trong suốt
            pixmap = QPixmap(width, height)
            pixmap.fill(Qt.GlobalColor.transparent)

            # Vẽ HICON của Windows lên QPixmap của Qt
            painter = QPainter(pixmap)
            hdc = int(painter.device().paintEngine().hDC())
            win32gui.DrawIconEx(hdc, 0, 0, hicon, width, height, 0, 0, win32con.DI_NORMAL)
            painter.end()
            
            # Dọn dẹp các đối tượng GDI
            win32api.DeleteObject(icon_info[3])
            win32api.DeleteObject(icon_info[4])

            return QIcon(pixmap)
        finally:
            # Đảm bảo tất cả các icon handles được giải phóng
            for i in all_icons:
                if i:
                    win32gui.DestroyIcon(i)

    except Exception:
        return QIcon()

class AppScannerWorker(QThread):
    finished = pyqtSignal(list)

    def run(self):
        apps = self._scan_installed_apps()
        self.finished.emit(apps)

    def _get_reg_value(self, key, subkey_name, value_name):
        try:
            with winreg.OpenKey(key, subkey_name) as subkey:
                value, reg_type = winreg.QueryValueEx(subkey, value_name)
                return value
        except (FileNotFoundError, OSError): return None

    def _scan_installed_apps(self):
        apps = []
        scan_locations = [
            (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall"),
            (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall"),
            (winreg.HKEY_CURRENT_USER, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall"),
            (winreg.HKEY_CURRENT_USER, r"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall"),
        ]
        
        processed_apps = set()

        for root_key, path in scan_locations:
            try:
                key = winreg.OpenKey(root_key, path)
                for i in range(winreg.QueryInfoKey(key)[0]):
                    subkey_name = winreg.EnumKey(key, i)
                    display_name = self._get_reg_value(key, subkey_name, "DisplayName")
                    uninstall_string = self._get_reg_value(key, subkey_name, "UninstallString")
                    
                    if not display_name or not uninstall_string: continue
                    
                    app_identifier = display_name.strip().lower()
                    if app_identifier in processed_apps:
                        continue

                    if "Windows" in display_name and ("Update" in display_name or "Hotfix" in display_name): continue
                    if "Security Update" in display_name or "Service Pack" in display_name: continue
                    if self._get_reg_value(key, subkey_name, "SystemComponent") == 1: continue
                    if self._get_reg_value(key, subkey_name, "ParentKeyName"): continue

                    quiet_uninstall_string = self._get_reg_value(key, subkey_name, "QuietUninstallString")
                    publisher = self._get_reg_value(key, subkey_name, "Publisher")
                    install_date = self._get_reg_value(key, subkey_name, "InstallDate")
                    estimated_size = self._get_reg_value(key, subkey_name, "EstimatedSize")
                    
                    display_icon_str = self._get_reg_value(key, subkey_name, "DisplayIcon")
                    if not display_icon_str:
                        icon_path = get_icon_path_from_uninstall_string(uninstall_string)
                        if icon_path:
                            display_icon_str = icon_path
                    
                    app_icon = get_app_icon(display_icon_str)
                    
                    apps.append({
                        "name": display_name.strip(),
                        "uninstall_string": uninstall_string,
                        "quiet_uninstall_string": quiet_uninstall_string,
                        "publisher": publisher.strip() if publisher else "N/A",
                        "install_date": install_date if install_date else "N/A",
                        "size_kb": estimated_size,
                        "size_str": format_size(estimated_size),
                        "icon": app_icon if not app_icon.isNull() else QIcon()
                    })
                    processed_apps.add(app_identifier)
            except FileNotFoundError: continue
            finally:
                if 'key' in locals() and key: winreg.CloseKey(key)

        return apps

def create_app_row_widget(app_data, fallback_icon):
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

    date_label = QLabel(app_data.get('install_date', 'N/A'))
    date_label.setObjectName("dateLabel")
    date_label.setMinimumWidth(80)
    date_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
    row_layout.addWidget(date_label, 1)

    size_label = QLabel(app_data.get('size_str', 'N/A'))
    size_label.setObjectName("sizeLabel")
    size_label.setMinimumWidth(80)
    size_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
    row_layout.addWidget(size_label, 1)
    
    return row_container
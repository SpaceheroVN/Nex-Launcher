# nex.py
import sys
import ctypes
import json
import locale
import os
import winreg
from pathlib import Path

from PyQt6.QtCore import Qt, QPoint
from PyQt6.QtGui import QIcon
from PyQt6.QtWidgets import (QApplication, QComboBox, QHBoxLayout, QLabel,
                             QMainWindow, QMessageBox, QPushButton, QVBoxLayout,
                             QWidget)

from Installer.Installer_main import InstallerWindow
from language import TRANSLATIONS
from style import get_launcher_style

def detect_system_theme() -> str:
    try:
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r'Software\Microsoft\Windows\CurrentVersion\Themes\Personalize')
        value, _ = winreg.QueryValueEx(key, 'AppsUseLightTheme')
        winreg.CloseKey(key)
        return 'Light' if value > 0 else 'Dark'
    except Exception:
        return 'Light'

def detect_system_language() -> str:
    try:
        lang_code, _ = locale.getdefaultlocale()
        if lang_code and lang_code.lower().startswith('vi'):
            return 'VN'
    except Exception:
        pass
    return 'EN'

class NEXLauncher(QMainWindow):
    def __init__(self):
        super().__init__()
        
        self.app_data_path = Path(os.getenv('APPDATA')) / "NEX"
        self.app_data_path.mkdir(parents=True, exist_ok=True)
        self.config_file = self.app_data_path / "config.json"
        self.installer_data_file = self.app_data_path / "installer_data.json"
        self.uninstaller_data_file = self.app_data_path / "uninstaller_data.json"

        if not self.uninstaller_data_file.exists():
            self.uninstaller_data_file.write_text('{}', encoding='utf-8')

        self.config = {}
        self.load_config_or_set_defaults()

        self.installer_window = None
        self.uninstaller_window = None
        self.initial_pos: QPoint | None = None

        self.setWindowIcon(QIcon("icons/logo.png"))

        self.setup_ui()
        self.apply_initial_settings()
        self.setFixedSize(500, 350)
        self.center_on_screen()
        self.initial_pos = self.pos()

    def load_config_or_set_defaults(self):
        if self.config_file.exists() and self.config_file.stat().st_size > 0:
            try:
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    self.config = json.load(f)
            except json.JSONDecodeError:
                self.create_default_config()
        else:
            self.create_default_config()

    def create_default_config(self):
        self.config = {
            'language': detect_system_language(),
            'theme': 'System'
        }
        self.save_config()

    def save_config(self):
        try:
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(self.config, f, indent=4)
        except IOError as e:
            print(f"Error saving config file: {e}")

    def apply_initial_settings(self):
        lang = self.config.get('language', 'EN')
        if lang == 'EN':
            self.btn_eng.setChecked(True)
        else:
            self.btn_vn.setChecked(True)
        self.retranslate_ui()

        self.theme_combo.blockSignals(True)
        self.theme_combo.setCurrentText(self.config.get('theme', 'System'))
        self.theme_combo.blockSignals(False)
        self.apply_styles()

    def setup_ui(self):
        main_widget = QWidget()
        main_layout = QVBoxLayout(main_widget)
        main_layout.setContentsMargins(30, 20, 30, 20)
        main_layout.setSpacing(15)

        self.title_label = QLabel()
        self.title_label.setObjectName("titleLabel")
        self.title_label.setAlignment(Qt.AlignmentFlag.AlignCenter)

        self.subtitle_label = QLabel()
        self.subtitle_label.setObjectName("subtitleLabel")
        self.subtitle_label.setAlignment(Qt.AlignmentFlag.AlignCenter)

        button_layout = QHBoxLayout()
        button_layout.setSpacing(20)

        self.btn_installer = QPushButton()
        self.btn_installer.setObjectName("launcherButton")
        self.btn_installer.setMinimumSize(160, 70)
        self.btn_installer.clicked.connect(self.launch_installer)

        self.btn_uninstaller = QPushButton()
        self.btn_uninstaller.setObjectName("launcherButton")
        self.btn_uninstaller.setMinimumSize(160, 70)
        self.btn_uninstaller.clicked.connect(self.show_coming_soon_message)

        button_layout.addWidget(self.btn_installer)
        button_layout.addWidget(self.btn_uninstaller)

        bottom_layout = QHBoxLayout()
        bottom_layout.setContentsMargins(0, 0, 0, 0)

        self.btn_eng = QPushButton("EN")
        self.btn_eng.setObjectName("langButton")
        self.btn_eng.setCheckable(True)
        self.btn_eng.clicked.connect(lambda: self.set_language('EN'))

        self.btn_vn = QPushButton("VN")
        self.btn_vn.setObjectName("langButton")
        self.btn_vn.setCheckable(True)
        self.btn_vn.clicked.connect(lambda: self.set_language('VN'))
        
        lang_button_layout = QHBoxLayout()
        lang_button_layout.setSpacing(5)
        lang_button_layout.addWidget(self.btn_eng)
        lang_button_layout.addWidget(self.btn_vn)

        self.theme_combo = QComboBox()
        self.theme_combo.setObjectName("themeCombo")
        self.theme_combo.addItems(["System", "Light", "Dark"])
        self.theme_combo.currentTextChanged.connect(self.set_theme)

        bottom_layout.addLayout(lang_button_layout)
        bottom_layout.addStretch(1)
        bottom_layout.addWidget(QLabel("Theme:"))
        bottom_layout.addWidget(self.theme_combo)

        main_layout.addStretch(1)
        main_layout.addWidget(self.title_label)
        main_layout.addWidget(self.subtitle_label)
        main_layout.addStretch(2)
        main_layout.addLayout(button_layout)
        main_layout.addStretch(2)
        main_layout.addLayout(bottom_layout)

        self.setCentralWidget(main_widget)

    def set_language(self, lang):
        if self.config.get('language') == lang:
            return
        self.config['language'] = lang
        
        if lang == 'EN':
            self.btn_eng.setChecked(True)
            self.btn_vn.setChecked(False)
        else:
            self.btn_eng.setChecked(False)
            self.btn_vn.setChecked(True)
        
        self.retranslate_ui()
        self.save_config()

    def retranslate_ui(self):
        lang = self.config.get('language', 'EN')
        t = TRANSLATIONS['NEX_Launcher'][lang]
        self.setWindowTitle(t['window_title'])
        self.title_label.setText(t['welcome'])
        self.subtitle_label.setText(t['subtitle'])
        self.btn_installer.setText(t['installer_btn'])
        self.btn_uninstaller.setText(t['uninstaller_btn'])
    
    def get_current_theme(self) -> str:
        theme_setting = self.config.get('theme', 'System')
        if theme_setting == 'System':
            return detect_system_theme()
        return theme_setting

    def set_theme(self, theme: str):
        if self.config.get('theme') == theme:
            return
        self.config['theme'] = theme
        self.apply_styles()
        self.save_config()
        
    def apply_styles(self):
        theme = self.get_current_theme()
        self.setStyleSheet(get_launcher_style(theme))

    def launch_installer(self):
        self.hide()
        
        download_repo = False
        if not self.installer_data_file.exists():
            lang = self.config.get('language', 'EN')
            t = TRANSLATIONS['Installer'][lang]
            
            msg_box = QMessageBox(self)
            msg_box.setWindowFlags(msg_box.windowFlags() | Qt.WindowType.WindowStaysOnTopHint)
            msg_box.setWindowTitle(t['repo_ask_title'])
            msg_box.setText(t['repo_ask_body'])
            msg_box.setWindowIcon(self.windowIcon())
            msg_box.setIcon(QMessageBox.Icon.Question)
            yes_button = msg_box.addButton(QMessageBox.StandardButton.Yes)
            yes_button.setObjectName("acceptButton")
            no_button = msg_box.addButton(QMessageBox.StandardButton.No)
            no_button.setObjectName("cancelButton")
            msg_box.setDefaultButton(yes_button)

            if msg_box.exec() == QMessageBox.StandardButton.Yes:
                download_repo = True

        self.installer_window = InstallerWindow(
            app_instance=self.app,
            launcher_instance=self,
            language=self.config.get('language', 'EN'),
            theme=self.get_current_theme(),
            installer_data_file=self.installer_data_file,
            download_repo=download_repo
        )
        self.installer_window.show()

    def show_coming_soon_message(self):
        """Hiển thị thông báo tính năng đang phát triển sử dụng style toàn cục."""
        msg_box = QMessageBox(self)
        msg_box.setWindowTitle("Tính năng sắp ra mắt")
        msg_box.setText("Trình gỡ cài đặt đang được phát triển, sớm thôi!!")
        msg_box.setIcon(QMessageBox.Icon.Information)
        ok_button = msg_box.addButton(QMessageBox.StandardButton.Ok)
        ok_button.setObjectName("acceptButton") # Sử dụng objectName
        
        msg_box.exec()

    def show_launcher(self):
        self.show()
        if self.initial_pos:
            self.move(self.initial_pos)

    def center_on_screen(self):
        if screen := self.screen():
            self.move(screen.availableGeometry().center() - self.frameGeometry().center())

if __name__ == "__main__":
    def is_admin():
        try:
            return ctypes.windll.shell32.IsUserAnAdmin()
        except:
            return False

    if is_admin():
        app = QApplication(sys.argv)
        app.setQuitOnLastWindowClosed(False)
        win = NEXLauncher()
        win.app = app
        win.show()
        sys.exit(app.exec())
    else:
        ctypes.windll.shell32.ShellExecuteW(None, "runas", sys.executable, " ".join(sys.argv), None, 1)
# nex.py
import sys
import ctypes
import json
import locale
import os
import winreg
from pathlib import Path

from PyQt6.QtCore import Qt, QPoint, QSize, QTimer
from PyQt6.QtGui import QIcon, QFont
from PyQt6.QtWidgets import (QApplication, QComboBox, QHBoxLayout, QLabel,
                             QMainWindow, QPushButton, QVBoxLayout,
                             QWidget, QDialog, QDialogButtonBox, QMessageBox)

from Installer.Installer_main import InstallerWindow
from Uninstaller.Uninstaller_main import UninstallerWindow as UninstallerApp
from config import TRANSLATIONS, get_launcher_style, get_theme_colors

class AboutDialog(QDialog):
    def __init__(self, parent=None, lang='EN', theme='Light'):
        super().__init__(parent)
        self.setWindowIcon(QIcon("icons/logo.ico"))
        
        colors = get_theme_colors(theme)
        self.setStyleSheet(get_launcher_style(theme))

        t = TRANSLATIONS['NEX_Launcher']['About'][lang]
        self.setWindowTitle(t.get('title', "About NEX Launcher"))
        self.setFixedSize(380, 220)
        
        layout = QVBoxLayout(self)
        layout.setAlignment(Qt.AlignmentFlag.AlignCenter)

        title_label = QLabel(t.get('title', "About NEX Launcher"))
        new_font = QFont(self.font().family(), 16, QFont.Weight.Bold)
        title_label.setFont(new_font)
        
        version_label = QLabel(t.get('version', "Version 1.3"))
        author_label = QLabel(t.get('author', "Author: SpaceheroVN"))
        
        link_template = t.get('github', '<a href="https://github.com/SpaceheroVN/NEX/releases/">Source Code on GitHub</a>')
        link_color = colors['primary_color']
        github_link = QLabel(link_template.format(link_color=link_color))
        github_link.setOpenExternalLinks(True)
        
        layout.addWidget(title_label, alignment=Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(version_label, alignment=Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(author_label, alignment=Qt.AlignmentFlag.AlignCenter)
        layout.addStretch()
        layout.addWidget(github_link, alignment=Qt.AlignmentFlag.AlignCenter)
        
        buttons = QDialogButtonBox(QDialogButtonBox.StandardButton.Ok)
        ok_button = buttons.button(QDialogButtonBox.StandardButton.Ok)
        ok_button.setObjectName("acceptButton")
        buttons.accepted.connect(self.accept)
        layout.addWidget(buttons, alignment=Qt.AlignmentFlag.AlignCenter)

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
        
        self.center_pos = None

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

        self.setWindowIcon(QIcon("icons/logo.ico"))        

        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        self.setWindowFlags(Qt.WindowType.FramelessWindowHint)

        self.setup_ui()
        self.apply_initial_settings()
        self.setFixedSize(500, 400)
        self.center_on_screen()
        
    def mousePressEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton:
            self.initial_pos = event.globalPosition().toPoint() - self.frameGeometry().topLeft()
            event.accept()

    def mouseMoveEvent(self, event):
        if self.initial_pos:
            self.move(event.globalPosition().toPoint() - self.initial_pos)
            event.accept()

    def mouseReleaseEvent(self, event):
        self.initial_pos = None
        event.accept()

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
        self.central_widget = QWidget()
        self.central_widget.setObjectName("centralWidget")
        self.setCentralWidget(self.central_widget)

        main_layout = QVBoxLayout(self.central_widget)
        main_layout.setContentsMargins(30, 20, 30, 20)
        main_layout.setSpacing(15)
        
        top_bar_layout = QHBoxLayout()
        self.btn_about = QPushButton("?")
        self.btn_about.setObjectName("helpButton")
        self.btn_about.setFixedSize(28, 28)
        self.btn_about.setToolTip("About")
        self.btn_about.clicked.connect(self.show_about_dialog)
        
        self.btn_close = QPushButton("X")
        self.btn_close.setObjectName("closeButton") 
        self.btn_close.setFixedSize(28, 28)
        self.btn_close.setToolTip("Close")
        self.btn_close.clicked.connect(self.close)
        
        top_bar_layout.addWidget(self.btn_about)
        top_bar_layout.addStretch()
        top_bar_layout.addWidget(self.btn_close)
        
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
        self.btn_installer.setMinimumHeight(80)
        self.btn_installer.setIcon(QIcon("icons/installer.png"))
        self.btn_installer.setIconSize(QSize(32, 32))
        self.btn_installer.clicked.connect(self.launch_installer)

        self.btn_uninstaller = QPushButton()
        self.btn_uninstaller.setObjectName("launcherButton")
        self.btn_uninstaller.setMinimumHeight(80)
        self.btn_uninstaller.setIcon(QIcon("icons/uninstaller.png"))
        self.btn_uninstaller.setIconSize(QSize(32, 32))
        self.btn_uninstaller.clicked.connect(self.launch_uninstaller)

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
        
        self.btn_always_on_top = QPushButton()
        self.btn_always_on_top.setObjectName("alwaysOnTopButton")
        self.btn_always_on_top.setCheckable(True)
        self.btn_always_on_top.setMinimumSize(130, 28)
        self.btn_always_on_top.toggled.connect(self.toggle_always_on_top)

        bottom_layout.addLayout(lang_button_layout)
        bottom_layout.addStretch(1)
        bottom_layout.addWidget(self.btn_always_on_top)
        bottom_layout.addStretch(1)
        
        theme_label = QLabel("Theme:")
        bottom_layout.addWidget(theme_label)
        bottom_layout.addWidget(self.theme_combo)

        main_layout.addLayout(top_bar_layout)
        main_layout.addStretch(1)
        main_layout.addWidget(self.title_label)
        main_layout.addWidget(self.subtitle_label)
        main_layout.addStretch(2)
        main_layout.addLayout(button_layout)
        main_layout.addStretch(2)
        main_layout.addLayout(bottom_layout)
        
    def toggle_always_on_top(self, checked):
        if checked:
            self.setWindowFlags(self.windowFlags() | Qt.WindowType.WindowStaysOnTopHint)
        else:
            self.setWindowFlags(self.windowFlags() & ~Qt.WindowType.WindowStaysOnTopHint)
        self.show()

    def set_language(self, lang):
        if self.config.get('language') != lang:
            self.config['language'] = lang
            self.save_config()

        if lang == 'EN':
            self.btn_eng.setChecked(True)
            self.btn_vn.setChecked(False)
        else:
            self.btn_eng.setChecked(False)
            self.btn_vn.setChecked(True)
        
        self.retranslate_ui()

    def retranslate_ui(self):
        lang = self.config.get('language', 'EN')
        t = TRANSLATIONS['NEX_Launcher'][lang]
        self.setWindowTitle(t['window_title'])
        self.title_label.setText(t['welcome'])
        self.subtitle_label.setText(t['subtitle'])
        self.btn_installer.setText(f"  {t['installer_btn']}")
        self.btn_uninstaller.setText(f"  {t['uninstaller_btn']}")
        self.btn_always_on_top.setText(t['always_on_top_btn'])
    
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
        style = get_launcher_style(theme)
        self.setStyleSheet(style)
        
        if self.installer_window and self.installer_window.isVisible():
            self.installer_window.update_theme(theme)
        if self.uninstaller_window and self.uninstaller_window.isVisible():
            self.uninstaller_window.update_theme(theme)

    def launch_installer(self):
        self.hide()
        
        download_repo_flag = False
        if not self.installer_data_file.exists() or self.installer_data_file.stat().st_size == 0:
            lang = self.config.get('language', 'EN')
            t = TRANSLATIONS['Installer'][lang]
            reply = QMessageBox.question(self, 
                                         t.get('repo_ask_title', 'Welcome!'),
                                         t.get('repo_ask_body', 'First time running. Download a basic software list?'),
                                         QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No,
                                         QMessageBox.StandardButton.Yes)
            
            if reply == QMessageBox.StandardButton.Yes:
                download_repo_flag = True
                
        is_always_on_top = self.btn_always_on_top.isChecked()

        self.installer_window = InstallerWindow(
            app_instance=self.app,
            launcher_instance=self,
            language=self.config.get('language', 'EN'),
            theme=self.get_current_theme(),
            installer_data_file=self.installer_data_file,
            download_repo=download_repo_flag,
            always_on_top=is_always_on_top
        )
        self.installer_window.show()

    def launch_uninstaller(self):
        self.hide()
        
        is_always_on_top = self.btn_always_on_top.isChecked()

        self.uninstaller_window = UninstallerApp(
            app_instance=self.app,
            launcher_instance=self,
            language=self.config.get('language', 'EN'),
            theme=self.get_current_theme(),
            always_on_top=is_always_on_top
        )
        self.uninstaller_window.show()

    def show_about_dialog(self):
        lang = self.config.get('language', 'EN')
        theme = self.get_current_theme()
        AboutDialog(self, lang=lang, theme=theme).exec()

    def show_launcher(self):
        self.show()
        QTimer.singleShot(0, self.center_on_screen)

    def center_on_screen(self):
        if self.center_pos is None:
            if screen := self.screen():
                self.center_pos = screen.availableGeometry().center() - self.frameGeometry().center()
        
        if self.center_pos:
            self.move(self.center_pos)

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
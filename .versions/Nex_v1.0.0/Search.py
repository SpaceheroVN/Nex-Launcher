# Search.py (Phiên bản hoàn chỉnh)

from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit, QPushButton,
    QDialogButtonBox, QFileDialog, QMessageBox, QWidget, QComboBox, QCheckBox,
    QProgressBar
)
from PyQt6.QtCore import Qt, QUrl
from PyQt6.QtGui import QFont
from language import TRANSLATIONS

class ProgressDialog(QDialog):
    """Một hộp thoại để hiển thị tiến trình cài đặt."""
    def __init__(self, max_value, parent=None, lang='EN'):
        super().__init__(parent)
        t = TRANSLATIONS[lang]
        self.setWindowTitle(t.get('progress_title', "Installation Progress"))
        self.setMinimumWidth(400); self.setModal(True)
        layout = QVBoxLayout(self)
        self.status_label = QLabel(t.get('progress_starting', "Starting installation..."))
        self.status_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(self.status_label)
        self.progress_bar = QProgressBar(self)
        self.progress_bar.setMaximum(max_value); self.progress_bar.setValue(0)
        self.progress_bar.setTextVisible(True)
        layout.addWidget(self.progress_bar)

    def update_progress(self, value, text):
        self.progress_bar.setValue(value); self.status_label.setText(text)

class AboutDialog(QDialog):
    """Hộp thoại hiển thị thông tin 'Giới thiệu' về ứng dụng."""
    def __init__(self, parent=None, lang='EN'):
        super().__init__(parent)
        t = TRANSLATIONS[lang]
        self.setWindowTitle(t.get('about_title', "About Application Installer"))
        self.setFixedSize(380, 220)

        layout = QVBoxLayout(self)
        layout.setAlignment(Qt.AlignmentFlag.AlignCenter)

        title_label = QLabel(t.get('window_title', "Application Installer"))
        title_label.setFont(QFont("Segoe UI", 16, QFont.Weight.Bold))
        
        version_label = QLabel(t.get('about_version', "Version 1.0"))
        author_label = QLabel(t.get('about_author', "Author: SpaceheroVN"))
        
        # Thay thế 'your-repo' bằng link đến kho lưu trữ GitHub của bạn
        github_link = QLabel(t.get('about_github', '<a href="https://github.com/SpaceheroVN/Installer">Source Code on GitHub</a>'))
        github_link.setOpenExternalLinks(True)

        layout.addWidget(title_label, alignment=Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(version_label, alignment=Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(author_label, alignment=Qt.AlignmentFlag.AlignCenter)
        layout.addStretch()
        layout.addWidget(github_link, alignment=Qt.AlignmentFlag.AlignCenter)
        
        buttons = QDialogButtonBox(QDialogButtonBox.StandardButton.Ok)
        buttons.accepted.connect(self.accept)
        layout.addWidget(buttons, alignment=Qt.AlignmentFlag.AlignCenter)

class SettingsDialog(QDialog):
    """Hộp thoại Cài đặt cho ứng dụng."""
    def __init__(self, current_settings, parent=None):
        super().__init__(parent)
        self.lang = current_settings.get('language', 'EN'); t = TRANSLATIONS[self.lang]
        self.setWindowTitle(t['settings_title']); self.setMinimumWidth(350)
        layout = QVBoxLayout(self)
        
        # Các phần cài đặt
        theme_layout = QHBoxLayout(); theme_layout.addWidget(QLabel(t['theme_label']))
        self.theme_combo = QComboBox(); self.theme_combo.addItems(["Light", "Dark"])
        self.theme_combo.setCurrentText(current_settings.get("theme", "Light"))
        theme_layout.addWidget(self.theme_combo); layout.addLayout(theme_layout)
        
        lang_layout = QHBoxLayout(); lang_layout.addWidget(QLabel(t['language_label']))
        self.lang_combo = QComboBox(); self.lang_combo.addItems(["EN", "VN"])
        self.lang_combo.setCurrentText(self.lang)
        lang_layout.addWidget(self.lang_combo); layout.addLayout(lang_layout)
        
        self.progress_check = QCheckBox(t['show_progress_check']); self.progress_check.setChecked(current_settings.get("show_progress", True))
        layout.addWidget(self.progress_check)
        self.autoselect_check = QCheckBox(t['auto_select_check']); self.autoselect_check.setChecked(current_settings.get("auto_select_add", False))
        layout.addWidget(self.autoselect_check)
        self.minimize_check = QCheckBox(t['auto_minimize_tray_check']); self.minimize_check.setChecked(current_settings.get("auto_minimize_tray", True))
        layout.addWidget(self.minimize_check)
        
        layout.addStretch()
        
        # Bố cục cho các nút ở dưới cùng
        bottom_button_layout = QHBoxLayout()
        about_button = QPushButton(t.get('about_btn', "About..."))
        about_button.clicked.connect(self.show_about_dialog)
        bottom_button_layout.addWidget(about_button)
        bottom_button_layout.addStretch()
        
        dialog_buttons = QDialogButtonBox(QDialogButtonBox.StandardButton.Ok | QDialogButtonBox.StandardButton.Cancel)
        dialog_buttons.button(QDialogButtonBox.StandardButton.Ok).setObjectName("acceptButton")
        dialog_buttons.button(QDialogButtonBox.StandardButton.Cancel).setObjectName("cancelButton")
        dialog_buttons.accepted.connect(self.accept); dialog_buttons.rejected.connect(self.reject)
        bottom_button_layout.addWidget(dialog_buttons)
        
        layout.addLayout(bottom_button_layout)

    def show_about_dialog(self):
        """Mở hộp thoại Giới thiệu."""
        dialog = AboutDialog(self, lang=self.lang)
        dialog.exec()

    def get_settings(self):
        return {"theme": self.theme_combo.currentText(), "language": self.lang_combo.currentText(), "show_progress": self.progress_check.isChecked(),
                "auto_select_add": self.autoselect_check.isChecked(), "auto_minimize_tray": self.minimize_check.isChecked()}

class AddSoftwareDialog(QDialog):
    """Hộp thoại để thêm một phần mềm hoặc trò chơi mới."""
    def __init__(self, parent=None, lang='EN'):
        super().__init__(parent)
        self.lang = lang; t = TRANSLATIONS[self.lang]; self.setWindowTitle(t['add_item_title'])
        layout = QVBoxLayout(self); layout.addWidget(QLabel(t['item_name_label']))
        self.name_edit = QLineEdit(self); self.name_edit.setPlaceholderText(t['item_name_placeholder'])
        layout.addWidget(self.name_edit); layout.addWidget(QLabel(t['item_type_label']))
        self.type_combo = QComboBox(self); self.type_combo.addItems([t['item_type_app'], t['item_type_game']])
        layout.addWidget(self.type_combo); layout.addStretch()
        buttons = QDialogButtonBox(QDialogButtonBox.StandardButton.Ok | QDialogButtonBox.StandardButton.Cancel)
        buttons.button(QDialogButtonBox.StandardButton.Ok).setObjectName("acceptButton")
        buttons.button(QDialogButtonBox.StandardButton.Cancel).setObjectName("cancelButton")
        buttons.accepted.connect(self.accept); buttons.rejected.connect(self.reject); layout.addWidget(buttons)

    def get_data(self):
        t = TRANSLATIONS[self.lang]; name = self.name_edit.text().strip()
        if not name:
            QMessageBox.warning(self, t.get('msg_input_error_title', 'Input Error'), t.get('msg_name_empty_body', "Item name cannot be empty."))
            return None, None
        item_type = "app" if self.type_combo.currentText() == t['item_type_app'] else "game"
        return name, item_type

class SilentArgsDialog(QDialog):
    """Một hộp thoại để người dùng chọn các tham số im lặng phổ biến."""
    def __init__(self, current_args="", parent=None, lang='EN'):
        super().__init__(parent)
        t = TRANSLATIONS[lang]
        self.setWindowTitle(t.get('silent_args_dialog_title', "Select Silent Arguments"))
        self.setMinimumWidth(350)
        self.common_args = {
            '/quiet': t.get('arg_quiet', 'Quiet mode (very few prompts)'),
            '/passive': t.get('arg_passive', 'Passive mode (progress bar only, no interaction)'),
            '/qn': t.get('arg_qn', 'Quiet with no UI (for MSI packages)'),
            '/S': t.get('arg_S_case', 'Silent install (case-sensitive, for NSIS)'),
            '/VERYSILENT': t.get('arg_verysilent', 'Very silent (for Inno Setup)'),
            '/norestart': t.get('arg_norestart', 'Do not restart after installation')
        }
        layout = QVBoxLayout(self)
        self.checkboxes = []
        current_args_list = current_args.split()
        for arg, description in self.common_args.items():
            checkbox = QCheckBox(f"{arg} ({description})")
            if arg in current_args_list:
                checkbox.setChecked(True)
            self.checkboxes.append((arg, checkbox))
            layout.addWidget(checkbox)
        layout.addStretch()
        buttons = QDialogButtonBox(QDialogButtonBox.StandardButton.Ok | QDialogButtonBox.StandardButton.Cancel)
        buttons.accepted.connect(self.accept); buttons.rejected.connect(self.reject)
        layout.addWidget(buttons)

    def get_selected_args(self) -> str:
        selected = [arg for arg, checkbox in self.checkboxes if checkbox.isChecked()]
        return " ".join(selected)

class PackageDialog(QDialog):
    """Hộp thoại để chọn tệp cài đặt từ máy tính."""
    def __init__(self, parent=None, lang='EN', current_path="", current_args=""):
        super().__init__(parent)
        self.lang = lang; t = TRANSLATIONS[lang]
        self.setWindowTitle(t.get('package_title', "Select Package File")); self.setMinimumSize(450, 200)
        layout = QVBoxLayout(self)
        layout.addWidget(QLabel(t.get('package_label', "Select the installer package:")))
        self.path_edit = QLineEdit(self); self.path_edit.setText(current_path)
        self.path_edit.setPlaceholderText(t.get('package_placeholder', "Path to installer file..."))
        browse_button = QPushButton(t.get('package_browse_btn', "Browse...")); browse_button.setObjectName("browseButton")
        browse_button.clicked.connect(self.browse_file)
        path_layout = QHBoxLayout(); path_layout.addWidget(self.path_edit); path_layout.addWidget(browse_button)
        layout.addLayout(path_layout)
        layout.addWidget(QLabel(t.get('silent_args_label', "Silent Install Arguments:")))
        args_layout = QHBoxLayout()
        self.args_edit = QLineEdit(self); self.args_edit.setText(current_args)
        self.args_edit.setPlaceholderText(t.get('silent_args_placeholder', "e.g., /quiet /norestart"))
        select_args_button = QPushButton(t.get('silent_args_select_btn', "Select..."))
        select_args_button.clicked.connect(self.open_args_selector)
        args_layout.addWidget(self.args_edit); args_layout.addWidget(select_args_button)
        layout.addLayout(args_layout)
        layout.addStretch()
        buttons = QDialogButtonBox(QDialogButtonBox.StandardButton.Ok | QDialogButtonBox.StandardButton.Cancel)
        buttons.accepted.connect(self.accept); buttons.rejected.connect(self.reject)
        layout.addWidget(buttons)

    def open_args_selector(self):
        dialog = SilentArgsDialog(current_args=self.args_edit.text(), parent=self, lang=self.lang)
        if dialog.exec():
            self.args_edit.setText(dialog.get_selected_args())

    def browse_file(self):
        file_path, _ = QFileDialog.getOpenFileName(self, "Select Installer", "", "Installers (*.exe *.msi *.bat);;All Files (*)")
        if file_path:
            self.path_edit.setText(file_path)
            if file_path.lower().endswith('.msi'):
                self.args_edit.setText('/qn /norestart')

    def get_data(self): 
        return self.path_edit.text(), self.args_edit.text()

class LinkDialog(QDialog):
    """Hộp thoại để nhập liên kết tải xuống."""
    def __init__(self, parent=None, lang='EN', current_link="", current_args=""):
        super().__init__(parent)
        self.lang = lang; t = TRANSLATIONS[lang]
        self.setWindowTitle(t.get('link_title', "Enter Download Link")); self.setMinimumSize(450, 180)
        layout = QVBoxLayout(self)
        layout.addWidget(QLabel(t.get('link_label', "Enter the direct download link:")))
        self.link_edit = QLineEdit(self); self.link_edit.setText(current_link)
        self.link_edit.setPlaceholderText(t.get('link_placeholder', "https://example.com/installer.exe"))
        layout.addWidget(self.link_edit)
        layout.addWidget(QLabel(t.get('silent_args_label', "Silent Install Arguments:")))
        args_layout = QHBoxLayout()
        self.args_edit = QLineEdit(self); self.args_edit.setText(current_args)
        self.args_edit.setPlaceholderText(t.get('silent_args_placeholder', "e.g., /quiet /norestart"))
        select_args_button = QPushButton(t.get('silent_args_select_btn', "Select..."))
        select_args_button.clicked.connect(self.open_args_selector)
        args_layout.addWidget(self.args_edit); args_layout.addWidget(select_args_button)
        layout.addLayout(args_layout)
        layout.addStretch()
        buttons = QDialogButtonBox(QDialogButtonBox.StandardButton.Ok | QDialogButtonBox.StandardButton.Cancel)
        buttons.accepted.connect(self.accept); buttons.rejected.connect(self.reject)
        layout.addWidget(buttons)

    def open_args_selector(self):
        dialog = SilentArgsDialog(current_args=self.args_edit.text(), parent=self, lang=self.lang)
        if dialog.exec():
            self.args_edit.setText(dialog.get_selected_args())

    def get_data(self):
        url = QUrl(self.link_edit.text())
        if url.isValid() and url.scheme() in ['http', 'https']:
            return url.toString(), self.args_edit.text()
        return None, self.args_edit.text()

def open_source_dialog(source_type, app_name, parent_window, lang='EN', current_value=None, current_args=None):
    """Mở hộp thoại nguồn tương ứng (Package hoặc Link)."""
    t = TRANSLATIONS[lang]
    current_value = "" if current_value is None else current_value
    current_args = "" if current_args is None else current_args
    if source_type == "Package":
        dialog = PackageDialog(parent_window, lang=lang, current_path=current_value, current_args=current_args)
        if dialog.exec(): return dialog.get_data()
    elif source_type == "Link":
        dialog = LinkDialog(parent_window, lang=lang, current_link=current_value, current_args=current_args)
        if dialog.exec():
            path, args = dialog.get_data()
            if path is None:
                QMessageBox.warning(parent_window, t.get('msg_invalid_link_title', "Invalid Link"), t.get('msg_invalid_link_body', "The provided URL is not valid."))
                return None, args
            return path, args
    return None, None
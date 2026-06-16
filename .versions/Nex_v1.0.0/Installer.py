# Installer.py (Phiên bản hoàn chỉnh cuối cùng)

import sys, json, time, os, subprocess, tempfile, traceback, ctypes
from pathlib import Path
import requests

from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QTabBar, QStackedWidget, QVBoxLayout,
    QHBoxLayout, QLabel, QGraphicsOpacityEffect, QComboBox, QPushButton,
    QLineEdit, QMessageBox, QCheckBox, QFileDialog, QDialog, QFrame,
    QProgressBar, QSystemTrayIcon, QMenu
)
from PyQt6.QtCore import Qt, QPropertyAnimation, QSize, QTimer, QEvent
from PyQt6.QtGui import QFont, QIcon, QCloseEvent, QAction
from subprocess import CREATE_NO_WINDOW

from language import TRANSLATIONS
from Theme import get_theme_qss
from Function import create_software_list_page, add_new_software, remove_software_items, filter_list_by_name
from Search import open_source_dialog, AddSoftwareDialog, SettingsDialog, ProgressDialog

# URL đến kho lưu trữ JSON trên GitHub của bạn
BASIC_JSON_URL = "https://raw.githubusercontent.com/SpaceheroVN/Installer/main/Basic.json"


class MiniProgressDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowFlags(Qt.WindowType.FramelessWindowHint | Qt.WindowType.WindowStaysOnTopHint | Qt.WindowType.Tool)
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        self.setFixedSize(250, 70)
        container = QFrame(self)
        container.setObjectName("miniProgressContainer")
        container.setStyleSheet("#miniProgressContainer { background-color: #333333; border: 1px solid #555555; border-radius: 8px; }")
        layout = QVBoxLayout(container)
        layout.setContentsMargins(10, 10, 10, 10)
        self.status_label = QLabel("Waiting...")
        self.status_label.setStyleSheet("color: #e0e0e0; font-size: 10pt;")
        self.progress_bar = QProgressBar()
        self.progress_bar.setTextVisible(False)
        self.progress_bar.setFixedHeight(15)
        layout.addWidget(self.status_label)
        layout.addWidget(self.progress_bar)
        main_layout = QVBoxLayout(self)
        main_layout.addWidget(container)
        main_layout.setContentsMargins(0,0,0,0)
        self.timer = QTimer(self)
        self.timer.setInterval(5000)
        self.timer.timeout.connect(self.hide)

    def update_progress(self, value, max_value, text):
        self.progress_bar.setMaximum(max_value)
        self.progress_bar.setValue(value)
        self.status_label.setText(text)
        self.timer.start()

    def showEvent(self, event):
        self.timer.start()
        super().showEvent(event)

    def hideEvent(self, event):
        self.timer.stop()
        super().hideEvent(event)

class InstallerUI(QMainWindow):
    def __init__(self, app_instance):
        super().__init__()
        self.app = app_instance
        app_data_path = Path(os.getenv('APPDATA')) / "Installer"
        app_data_path.mkdir(parents=True, exist_ok=True)
        self.config_file = app_data_path / "installer_data.json"
        
        # Cho phép cửa sổ nhận thao tác kéo-thả
        self.setAcceptDrops(True)
        
        self.load_data()

        self.icon_dir = Path(__file__).parent / "icons"
        logo_path = self.icon_dir / "logo.png"
        if logo_path.exists(): self.setWindowIcon(QIcon(str(logo_path)))

        self._init_ui_elements()
        self._setup_layout()

        self.setFixedSize(900, 600)
        self.center_on_screen()
        self._prev = 0
        self.is_installing = False

        self._setup_tray_icon(logo_path)
        self.mini_progress = MiniProgressDialog(self)

        self.retranslate_ui()
        self.apply_theme()
        self.refresh_all_pages()

    def dragEnterEvent(self, event: QEvent):
        """Sự kiện khi có một đối tượng được kéo vào cửa sổ."""
        if event.mimeData().hasUrls():
            event.acceptProposedAction()

    def dragMoveEvent(self, event: QEvent):
        """Sự kiện khi đối tượng được kéo di chuyển trong cửa sổ."""
        if event.mimeData().hasUrls():
            event.acceptProposedAction()

    def dropEvent(self, event: QEvent):
        """Sự kiện khi đối tượng được thả vào cửa sổ."""
        urls = event.mimeData().urls()
        if not urls:
            return

        file_path = urls[0].toLocalFile()
        valid_extensions = ['.exe', '.msi', '.bat']
        if not any(file_path.lower().endswith(ext) for ext in valid_extensions):
            QMessageBox.warning(self, "Tệp không hợp lệ", "Chỉ hỗ trợ kéo-thả các tệp .exe, .msi, và .bat.")
            return

        add_dialog = AddSoftwareDialog(self, lang=self.settings.get('language', 'EN'))
        if add_dialog.exec():
            name, item_type = add_dialog.get_data()
            if name and item_type:
                new_item = {
                    'name': name, 'type': item_type,
                    'source': {'type': 'Package', 'value': file_path, 'silent_args': ''}
                }
                self.software_database.append(new_item)
                self.refresh_all_pages()
                QMessageBox.information(self, "Thành công", f"Đã thêm '{name}' từ tệp được thả vào.")

    def _init_ui_elements(self):
        self.search_label = QLabel()
        self.install_from_label = QLabel()
        self.btn_export = QPushButton()
        self.btn_import = QPushButton()
        self.btn_install = QPushButton()
        self.show_action = QAction(self)
        self.quit_action = QAction(self)
        self.tabs = QTabBar(objectName="tabBar", movable=False)
        self.tabs.setIconSize(QSize(22, 22))
        self.tabs.currentChanged.connect(self.switch_tab)
        self.stack = QStackedWidget()
        settings_icon_path = self.icon_dir / "settings.png"
        self.btn_settings = QPushButton(icon=QIcon(str(settings_icon_path)) if settings_icon_path.exists() else QIcon())
        self.btn_settings.setObjectName("settingsButton"); self.btn_settings.setFixedSize(40, 40); self.btn_settings.setIconSize(QSize(24, 24)); self.btn_settings.clicked.connect(self.open_settings_dialog)
        self.btn_add_item = QPushButton("+", objectName="actionButton", clicked=self.add_new_item)
        self.btn_remove_item = QPushButton("-", objectName="actionButton", clicked=self.remove_selected_items)
        self.search_edit = QLineEdit(maximumWidth=250, textChanged=self.filter_current_view)
        self.install_from_combo = QComboBox(minimumWidth=140)
        self.btn_export.setObjectName("exportBtn"); self.btn_export.clicked.connect(self.export_data)
        self.btn_import.setObjectName("importBtn"); self.btn_import.clicked.connect(self.import_data)
        self.btn_install.setObjectName("installBtn"); self.btn_install.clicked.connect(self._do_install)
        for b in (self.btn_export, self.btn_import, self.btn_install): b.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold)); b.setFixedSize(110, 40)

    def _setup_layout(self):
        bottom_layout = QHBoxLayout()
        bottom_layout.addWidget(self.btn_settings); bottom_layout.addSpacing(10)
        bottom_layout.addWidget(self.btn_add_item); bottom_layout.addWidget(self.btn_remove_item); bottom_layout.addSpacing(20)
        bottom_layout.addWidget(self.search_label); bottom_layout.addWidget(self.search_edit); bottom_layout.addStretch(1)
        bottom_layout.addWidget(self.install_from_label); bottom_layout.addWidget(self.install_from_combo); bottom_layout.addSpacing(10)
        bottom_layout.addWidget(self.btn_export); bottom_layout.addWidget(self.btn_import); bottom_layout.addWidget(self.btn_install)
        main_layout = QVBoxLayout()
        main_layout.addWidget(self.tabs); main_layout.addWidget(self.stack); main_layout.addLayout(bottom_layout)
        main_layout.setContentsMargins(10, 0, 10, 10)
        container = QWidget(); container.setLayout(main_layout); self.setCentralWidget(container)

    def _setup_tray_icon(self, icon_path):
        self.tray_icon = QSystemTrayIcon(self)
        if icon_path.exists(): self.tray_icon.setIcon(QIcon(str(icon_path)))
        tray_menu = QMenu(self)
        self.show_action.triggered.connect(self.show_window)
        self.quit_action.triggered.connect(self.proper_quit)
        tray_menu.addAction(self.show_action)
        tray_menu.addAction(self.quit_action)
        self.tray_icon.setContextMenu(tray_menu)
        self.tray_icon.activated.connect(self.tray_icon_activated)
        self.tray_icon.show()
    
    def retranslate_ui(self):
        lang = self.settings.get('language', 'EN')
        t = TRANSLATIONS[lang]
        self.setWindowTitle(t['window_title'])
        if self.tabs.count() > 0:
            self.tabs.setTabText(0, t['tab_all']); self.tabs.setTabText(1, t['tab_apps']); self.tabs.setTabText(2, t['tab_games'])
        else:
            self.tabs.addTab(t['tab_all']); self.tabs.addTab(t['tab_apps']); self.tabs.addTab(t['tab_games'])
            for i, name in enumerate(("all.png", "apps.png", "games.png")):
                p = self.icon_dir / name
                if p.exists(): self.tabs.setTabIcon(i, QIcon(str(p)))
        self.search_label.setText(t['search_label'])
        self.search_edit.setPlaceholderText(t['search_placeholder'])
        self.install_from_label.setText(t['install_from_label'])
        self.btn_export.setText(t['export_btn']); self.btn_import.setText(t['import_btn']); self.btn_install.setText(t['install_btn'])
        current_selection = self.install_from_combo.currentText()
        self.install_from_combo.clear()
        combo_items = [t['install_from_combo_current'], t['install_from_combo_all'], t['install_from_combo_apps'], t['install_from_combo_games']]
        self.install_from_combo.addItems(combo_items)
        if current_selection in combo_items: self.install_from_combo.setCurrentText(current_selection)
        self.tray_icon.setToolTip(t['tray_tooltip'])
        self.show_action.setText(t['tray_main_screen'])
        self.quit_action.setText(t['tray_escape'])
        self.refresh_all_pages()

    def changeEvent(self, event):
        if self.settings.get("auto_minimize_tray", True) and event.type() == QEvent.Type.WindowStateChange and self.isMinimized():
            QTimer.singleShot(100, self._hide_to_tray)
            event.ignore()
            return
        super().changeEvent(event)
    
    def closeEvent(self, event: QCloseEvent):
        self.proper_quit()
        event.accept()

    def _hide_to_tray(self):
        self.hide()
        lang = self.settings.get('language', 'EN')
        t = TRANSLATIONS[lang]
        self.tray_icon.showMessage(t['tray_running_title'], t['tray_running_msg'], QSystemTrayIcon.MessageIcon.Information, 2000)

    def proper_quit(self):
        self.save_data()
        self.app.quit()
    
    def tray_icon_activated(self, reason):
        if reason == QSystemTrayIcon.ActivationReason.DoubleClick: self.show_window()
        elif reason == QSystemTrayIcon.ActivationReason.Trigger and self.is_installing: self.show_mini_progress()

    def show_mini_progress(self):
        geom = self.tray_icon.geometry()
        self.mini_progress.move(geom.x() - self.mini_progress.width() + geom.width(), geom.y() - self.mini_progress.height())
        self.mini_progress.show()

    def show_window(self):
        self.showNormal()
        self.activateWindow()

    def load_data(self):
        self.settings = {"theme": "Light", "show_progress": True, "auto_select_add": False, "language": "EN", "auto_minimize_tray": True}
        has_data = False
        if self.config_file.exists():
            try:
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    db = data.get("database", [])
                    if db:
                        for item in db:
                            source = item.get('source', {})
                            if 'silent_args' not in source: source['silent_args'] = ""
                            item['source'] = source
                        self.software_database = db
                        self.settings.update(data.get("settings", {}))
                        has_data = True
            except Exception:
                has_data = False

        if not has_data:
            self.software_database = []
            lang = self.settings.get('language', 'EN'); t = TRANSLATIONS[lang]
            reply = QMessageBox.question(self, t.get('repo_ask_title', "Welcome!"),
                                         t.get('repo_ask_body', "This seems to be your first time running the application.\nWould you like to download a basic list of common software from the online repository?"),
                                         QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No, QMessageBox.StandardButton.Yes)
            if reply == QMessageBox.StandardButton.Yes:
                try:
                    response = requests.get(BASIC_JSON_URL, timeout=10)
                    response.raise_for_status()
                    imported_data = response.json()
                    if isinstance(imported_data, list):
                        self.software_database = imported_data
                        QMessageBox.information(self, t.get('repo_ok_title', "Success"), t.get('repo_ok_body', f"Successfully downloaded and added {len(imported_data)} items."))
                except requests.exceptions.RequestException as e:
                    QMessageBox.critical(self, t.get('repo_err_title', "Network Error"), t.get('repo_err_net_body', f"Could not connect to the online repository.\nPlease check your internet connection.\nError: {e}"))
                except json.JSONDecodeError:
                    QMessageBox.critical(self, t.get('repo_err_title', "Data Error"), t.get('repo_err_json_body', "Data from the online repository is corrupted or incorrectly formatted."))

    def save_data(self):
        try:
            with open(self.config_file, 'w', encoding='utf-8') as f: json.dump({"settings": self.settings, "database": self.software_database}, f, indent=4, ensure_ascii=False)
        except IOError as e: print(f"Could not save data file: {e}")

    def add_new_item(self):
        lang = self.settings.get('language', 'EN')
        dialog = AddSoftwareDialog(self, lang=lang)
        if dialog.exec():
            name, item_type = dialog.get_data()
            if name and item_type:
                new_item = add_new_software(self.software_database, name, item_type)
                self.refresh_all_pages()
                if self.settings["auto_select_add"]:
                    current_page = self.stack.currentWidget()
                    if current_page:
                        for cb in current_page.findChildren(QCheckBox):
                            cb_data = cb.property("software_data")
                            if cb_data and cb_data.get('name') == new_item.get('name'):
                                cb.setChecked(True); break
    
    def export_data(self):
        if not self.software_database:
            QMessageBox.warning(self, "Không có dữ liệu", "Danh sách phần mềm trống, không có gì để xuất.")
            return
        filePath, _ = QFileDialog.getSaveFileName(self, "Xuất danh sách", "", "JSON Files (*.json);;All Files (*)")
        if filePath:
            try:
                with open(filePath, 'w', encoding='utf-8') as f:
                    json.dump(self.software_database, f, indent=4, ensure_ascii=False)
                QMessageBox.information(self, "Thành công", f"Đã xuất thành công danh sách ra tệp:\n{filePath}")
            except Exception as e:
                QMessageBox.critical(self, "Lỗi", f"Không thể xuất tệp. Lỗi: {e}")

    def import_data(self):
        filePath, _ = QFileDialog.getOpenFileName(self, "Nhập danh sách", "", "JSON Files (*.json);;All Files (*)")
        if filePath:
            try:
                with open(filePath, 'r', encoding='utf-8') as f:
                    imported_data = json.load(f)
                if not isinstance(imported_data, list):
                    QMessageBox.critical(self, "Lỗi Định Dạng", "Tệp được chọn không chứa dữ liệu hợp lệ (không phải là một danh sách).")
                    return
                existing_names = {item['name'] for item in self.software_database}
                items_added_count = 0
                for item in imported_data:
                    if isinstance(item, dict) and 'name' in item and item['name'] not in existing_names:
                        self.software_database.append(item)
                        existing_names.add(item['name'])
                        items_added_count += 1
                if items_added_count > 0:
                    QMessageBox.information(self, "Hoàn tất", f"Đã nhập và thêm mới thành công {items_added_count} mục.")
                    self.refresh_all_pages()
                else:
                    QMessageBox.information(self, "Không có thay đổi", "Không có mục nào mới được thêm vào. Tất cả đã tồn tại trong danh sách.")
            except json.JSONDecodeError:
                QMessageBox.critical(self, "Lỗi Tệp JSON", "Tệp bị lỗi hoặc không đúng định dạng JSON.")
            except Exception as e:
                QMessageBox.critical(self, "Lỗi", f"Không thể nhập tệp. Lỗi: {e}")

    def open_settings_dialog(self):
        dialog = SettingsDialog(self.settings, self)
        if dialog.exec():
            old_lang = self.settings.get('language')
            self.settings.update(dialog.get_settings())
            self.apply_theme()
            if old_lang != self.settings.get('language'):
                self.retranslate_ui()

    def remove_selected_items(self):
        lang = self.settings.get('language', 'EN'); t = TRANSLATIONS[lang]
        items_to_remove_raw = []
        for i in range(self.stack.count()):
            page = self.stack.widget(i)
            if page:
                items_to_remove_raw.extend([cb.property("software_data") for cb in page.findChildren(QCheckBox) if cb.isChecked() and cb.property("software_data")])
        unique_items_to_remove, seen_names = [], set()
        for item in items_to_remove_raw:
            name = item.get('name')
            if name and name not in seen_names:
                unique_items_to_remove.append(item); seen_names.add(name)
        if not unique_items_to_remove:
            QMessageBox.warning(self, t['msg_no_selection_title'], t['msg_no_selection_body']); return
        reply = QMessageBox.question(self, t['msg_confirm_delete_title'], t['msg_confirm_delete_body'].format(count=len(unique_items_to_remove)))
        if reply == QMessageBox.StandardButton.Yes:
            self.software_database = remove_software_items(self.software_database, unique_items_to_remove)
            self.refresh_all_pages()

    def filter_current_view(self):
        if current_widget := self.stack.currentWidget():
            filter_list_by_name(current_widget, self.search_edit.text())

    def refresh_all_pages(self):
        current_tab_index = self.tabs.currentIndex()
        while self.stack.count() > 0:
            widget = self.stack.widget(0); self.stack.removeWidget(widget); widget.deleteLater()
        self.page_all = create_software_list_page(self.software_database, 'all', self.handle_source_edit)
        self.page_apps = create_software_list_page(self.software_database, 'app', self.handle_source_edit)
        self.page_games = create_software_list_page(self.software_database, 'game', self.handle_source_edit)
        self.stack.addWidget(self.page_all)
        self.stack.addWidget(self.page_apps)
        self.stack.addWidget(self.page_games)
        self.stack.setCurrentIndex(current_tab_index if 0 <= current_tab_index < self.stack.count() else 0)

    def handle_source_edit(self, source_button, software_data_ref):
        new_source_type = source_button.text()
        current_source = software_data_ref.get('source', {})
        lang = self.settings.get('language', 'EN')
        result_path, result_args = open_source_dialog(
            new_source_type, software_data_ref.get('name', ''), self, lang=lang,
            current_value=current_source.get('value'),
            current_args=current_source.get('silent_args', "")
        )
        if result_path is not None:
            current_source.update({'type': new_source_type, 'value': result_path, 'silent_args': result_args})
            software_data_ref['source'] = current_source
        source_button.setText(current_source.get('type', 'Unknown'))

    def switch_tab(self, idx: int):
        if self.stack.count() == 0 or idx == self._prev or idx >= self.stack.count(): return
        self.stack.setCurrentIndex(idx)
        w = self.stack.widget(idx)
        if w:
            fx = QGraphicsOpacityEffect(w); w.setGraphicsEffect(fx)
            self.animation = QPropertyAnimation(fx, b"opacity", self); self.animation.setDuration(250)
            self.animation.setStartValue(0.0); self.animation.setEndValue(1.0); self.animation.start()
        self._prev = idx; self.filter_current_view()
        
    def apply_theme(self):
        self.app.setStyleSheet(get_theme_qss(self.settings.get("theme", "Light")))
        
    def _do_install(self):
        lang = self.settings.get('language', 'EN'); t = TRANSLATIONS[lang]
        items_to_check = []
        install_scope = self.install_from_combo.currentText()
        all_pages = [self.stack.widget(i) for i in range(self.stack.count())]
        scope_map = {
            t['install_from_combo_current']: [self.stack.currentWidget()],
            t['install_from_combo_all']: all_pages,
            t['install_from_combo_apps']: [all_pages[1]] if len(all_pages) > 1 else [],
            t['install_from_combo_games']: [all_pages[2]] if len(all_pages) > 2 else []
        }
        for page in scope_map.get(install_scope, []):
            if page: items_to_check.extend(page.findChildren(QCheckBox))
        selected_items_raw = [
            cb.property("software_data") for cb in items_to_check if cb.isChecked() and cb.parentWidget().isVisible() and
            (data := cb.property("software_data")) and data.get('source', {}).get('type') != 'Unknown' and data.get('source', {}).get('value')
        ]
        selected_items, seen_names = [], set()
        for item in selected_items_raw:
            if (name := item.get('name')) and name not in seen_names:
                selected_items.append(item); seen_names.add(name)
        if not selected_items:
            QMessageBox.warning(self, t['msg_no_selection_title'], t['msg_no_selection_body']); return
        self.is_installing = True
        total_items = len(selected_items)
        progress_dialog = ProgressDialog(total_items, self, lang=lang) if self.settings.get("show_progress", True) else None
        if progress_dialog: progress_dialog.show()
        with tempfile.TemporaryDirectory() as temp_dir:
            for i, item in enumerate(selected_items):
                name = item.get('name', 'Unknown'); source = item.get('source', {})
                task_text = lambda T: f"({i+1}/{total_items}) {T} {name}..."
                def update_status(text):
                    if progress_dialog: progress_dialog.update_progress(i, text); QApplication.processEvents()
                    self.mini_progress.update_progress(i, total_items, text)
                update_status(task_text("Processing"))
                try:
                    installer_path = None
                    if source.get('type') == 'Link':
                        update_status(task_text("Downloading"))
                        response = requests.get(source['value'], stream=True); response.raise_for_status()
                        installer_path = Path(temp_dir) / source['value'].split('/')[-1]
                        with open(installer_path, 'wb') as f:
                            for chunk in response.iter_content(chunk_size=8192): f.write(chunk)
                    elif source.get('type') == 'Package':
                        installer_path = Path(source['value'])
                        if not installer_path.exists(): raise FileNotFoundError(f"Package not found: {installer_path}")
                    if installer_path:
                        update_status(task_text("Installing"))
                        command_str = f'"{str(installer_path)}"'
                        if silent_args := source.get("silent_args"):
                            command_str += f" {silent_args}"
                        subprocess.run(command_str, check=True, shell=True, creationflags=CREATE_NO_WINDOW)
                    finished_text = f"({i+1}/{total_items}) Finished {name}."
                    if progress_dialog: progress_dialog.update_progress(i + 1, finished_text)
                    self.mini_progress.update_progress(i + 1, total_items, finished_text)
                except Exception as e:
                    if progress_dialog: progress_dialog.close()
                    QMessageBox.critical(self, t['msg_error_title'], t['msg_error_body'].format(name=name, error=e))
                    self.is_installing = False; self.mini_progress.hide(); return
        if progress_dialog: progress_dialog.close()
        self.tray_icon.showMessage(t['msg_install_complete_title'], t['msg_install_complete_body'].format(count=total_items), QSystemTrayIcon.MessageIcon.Information, 3000)
        self.is_installing = False
        QTimer.singleShot(3000, self.mini_progress.hide)

    def center_on_screen(self):
        if screen := self.screen(): self.move(screen.availableGeometry().center() - self.frameGeometry().center())

if __name__ == "__main__":
    def is_admin():
        try: return ctypes.windll.shell32.IsUserAnAdmin()
        except: return False
    if is_admin():
        try:
            app = QApplication(sys.argv)
            app.setQuitOnLastWindowClosed(False)
            win = InstallerUI(app)
            win.show()
            sys.exit(app.exec())
        except Exception:
            with open("crash_log.txt", "w", encoding='utf-8') as f:
                f.write("Application crashed. Error:\n"); f.write(traceback.format_exc())
    else:
        ctypes.windll.shell32.ShellExecuteW(None, "runas", sys.executable, " ".join(sys.argv), None, 1)
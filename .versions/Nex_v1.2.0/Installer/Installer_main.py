# Installer/Installer_main.py
import sys, json, time, os, subprocess, tempfile, traceback, ctypes, re
from pathlib import Path
import requests
from concurrent.futures import ThreadPoolExecutor

from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QTabBar, QStackedWidget, QVBoxLayout,
    QHBoxLayout, QLabel, QGraphicsOpacityEffect, QComboBox, QPushButton,
    QLineEdit, QMessageBox, QCheckBox, QFileDialog, QDialog, QFrame,
    QProgressBar, QSystemTrayIcon, QMenu
)
from PyQt6.QtCore import Qt, QPropertyAnimation, QSize, QTimer, QEvent, QObject, pyqtSignal
from PyQt6.QtGui import QFont, QIcon, QCloseEvent, QAction
from subprocess import CREATE_NO_WINDOW

from language import TRANSLATIONS
from style import get_installer_style

from .tools import create_software_list_page, add_new_software, remove_software_items, create_search_results_page

BASIC_JSON_URL = "https://raw.githubusercontent.com/SpaceheroVN/NEX/main/Basic.json"

class InstallerWorker(QObject):
    finished = pyqtSignal()
    progress = pyqtSignal(str, str, str)

    def __init__(self, item, temp_dir):
        super().__init__()
        self.item = item
        self.temp_dir = temp_dir

    def run(self):
        name = self.item.get('name', 'Unknown')
        source = self.item.get('source', {})
        source_type = source.get('type')
        
        try:
            if source_type == 'Winget':
                self.progress.emit(name, "installing", f"Installing {name} via Winget...")
                package_id = source.get('value')
                if not package_id:
                    raise ValueError("Winget package ID is missing.")
                
                command = [
                    'winget', 'install', '--id', package_id, 
                    '--silent', '--accept-source-agreements', '--accept-package-agreements'
                ]
                subprocess.run(command, check=True, creationflags=CREATE_NO_WINDOW)

            elif source_type == 'Link':
                self.progress.emit(name, "downloading", f"Downloading {name}...")
                response = requests.get(source['value'], stream=True, headers={'User-Agent': 'Mozilla/5.0'}, allow_redirects=True)
                response.raise_for_status()
                filename = (re.findall('filename="?([^"]+)"?', response.headers.get('content-disposition', '')) or [source['value'].split('/')[-1].split('?')[0]])[0]
                installer_path = Path(self.temp_dir) / filename
                with open(installer_path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192): f.write(chunk)
                
                self.progress.emit(name, "installing", f"Installing {name}...")
                command_str = f'"{str(installer_path)}" {source.get("silent_args", "")}'
                subprocess.run(command_str, check=True, shell=True, creationflags=CREATE_NO_WINDOW)

            elif source_type == 'Package':
                installer_path = Path(source['value'])
                if not installer_path.exists():
                    raise FileNotFoundError(f"Package not found: {installer_path}")
                
                self.progress.emit(name, "installing", f"Installing {name}...")
                command_str = f'"{str(installer_path)}" {source.get("silent_args", "")}'
                subprocess.run(command_str, check=True, shell=True, creationflags=CREATE_NO_WINDOW)

            else:
                raise ValueError(f"Unknown or unsupported source type: {source_type}")

            self.progress.emit(name, "completed", "Installation successful.")
        except Exception as e:
            error_details = traceback.format_exc()
            self.progress.emit(name, "failed", f"Error: {e}\n{error_details}")
        finally:
            self.finished.emit()

class InstallerWindow(QMainWindow):
    def __init__(self, app_instance, launcher_instance, language, theme, installer_data_file, download_repo):
        super().__init__()
        self.app = app_instance
        self.launcher = launcher_instance
        self.language = language
        self.theme = theme
        self.installer_data_file = installer_data_file
        self.download_repo = download_repo
        
        self.last_search_text = ""
        self.keep_search_text_session = True
        self.is_searching = False
        
        self.setAttribute(Qt.WidgetAttribute.WA_DeleteOnClose)
        self.setAcceptDrops(True)
        
        self.load_installer_data()

        self.icon_dir = Path(__file__).parent.parent / "icons"
        logo_path = self.icon_dir / "logo.png"
        if logo_path.exists(): self.setWindowIcon(QIcon(str(logo_path)))

        self._init_ui_elements()
        self._setup_layout()

        self.setFixedSize(900, 600)
        self.center_on_screen()
        self._prev = 0
        self.is_installing = False

        self._setup_tray_icon(logo_path)

        self.apply_theme()
        self.retranslate_ui()
        self.refresh_all_pages()

    def handle_source_edit(self, source_button, software_data_ref, new_source_type):
        from .dialogs import SourceEditDialog, WingetSearchDialog

        current_source = software_data_ref.get('source', {})
        
        if new_source_type == 'Winget':
            dialog = WingetSearchDialog(software_data_ref['name'], self, lang=self.language)
            if dialog.exec():
                package_id = dialog.get_data()
                if package_id:
                    software_data_ref['source'].update({'type': 'Winget', 'value': package_id, 'silent_args': ''})
                    source_button.setText('Winget')
                    return True
            return False
            
        elif new_source_type == 'Unknown':
            software_data_ref['source'] = {'type': 'Unknown', 'value': None, 'silent_args': ''}
            source_button.setText(new_source_type)
            return True

        dialog = SourceEditDialog(
            source_type=new_source_type,
            current_value=current_source.get('value', '') if current_source.get('type') == new_source_type else "",
            current_args=current_source.get('silent_args', ''),
            placeholder_text=current_source.get('value', ''),
            parent=self,
            lang=self.language
        )

        if dialog.exec():
            new_value, new_args = dialog.get_data()
            software_data_ref['source'].update({'type': new_source_type, 'value': new_value, 'silent_args': new_args})
            source_button.setText(new_source_type)
            return True
        return False
        
    def open_search_dialog(self):
        from .dialogs import SearchDialog
        dialog = SearchDialog(self, 
                            lang=self.language, 
                            current_text=self.last_search_text)

        keep_text_checkbox = dialog.findChild(QCheckBox)
        if keep_text_checkbox:
            keep_text_checkbox.setChecked(self.keep_search_text_session)

        text_edit = dialog.findChild(QLineEdit)
        if text_edit:
            text_edit.textChanged.connect(self.filter_current_view)
        
        result = dialog.exec()
        
        search_text, keep_text = dialog.get_data()
        self.keep_search_text_session = keep_text
        
        if keep_text:
            self.last_search_text = search_text
        else:
            self.last_search_text = ""

        if not self.last_search_text and self.is_searching:
            self.filter_current_view("")

    def closeEvent(self, event: QCloseEvent):
        self.save_installer_data()
        self.tray_icon.hide()
        self.launcher.show_launcher()
        event.accept()
        
    def dragEnterEvent(self, event: QEvent):
        if event.mimeData().hasUrls():
            event.acceptProposedAction()

    def dragMoveEvent(self, event: QEvent):
        if event.mimeData().hasUrls():
            event.acceptProposedAction()

    def dropEvent(self, event: QEvent):
        from .dialogs import AddSoftwareDialog
        urls = event.mimeData().urls()
        if not urls: return
        file_path = urls[0].toLocalFile()
        valid_extensions = ['.exe', '.msi', '.bat']
        if not any(file_path.lower().endswith(ext) for ext in valid_extensions):
            QMessageBox.warning(self, "Invalid File", "Only .exe, .msi, and .bat files are supported for drag-and-drop.")
            return

        add_dialog = AddSoftwareDialog(self, lang=self.language, settings=self.settings)
        if add_dialog.exec():
            name, item_type, category, source = add_dialog.get_data()
            if name and item_type and source:
                new_item = {'name': name, 'type': item_type, 'category': category, 'source': source}
                self.software_database.append(new_item)
                self.refresh_all_pages()
                QMessageBox.information(self, "Success", f"Added '{name}' from the dropped file.")
                
    def _init_ui_elements(self):
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
        
        self.btn_search = QPushButton()
        self.btn_search.setObjectName("searchButton") # Added object name
        self.btn_search.clicked.connect(self.open_search_dialog)
        
        self.install_from_combo = QComboBox(minimumWidth=140)
        self.btn_export.setObjectName("exportBtn"); self.btn_export.clicked.connect(self.export_data)
        self.btn_import.setObjectName("importBtn"); self.btn_import.clicked.connect(self.import_data)
        self.btn_install.setObjectName("installBtn"); self.btn_install.clicked.connect(self._do_install)
        
        for b in (self.btn_search, self.btn_export, self.btn_import, self.btn_install):
            b.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
            b.setMinimumHeight(40)
        
    def _setup_layout(self):
        bottom_layout = QHBoxLayout()
        bottom_layout.addWidget(self.btn_settings); bottom_layout.addSpacing(10)
        bottom_layout.addWidget(self.btn_add_item); bottom_layout.addWidget(self.btn_remove_item); bottom_layout.addSpacing(20)
        bottom_layout.addWidget(self.btn_search)
        bottom_layout.addStretch(1)
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
        lang = self.language
        t = TRANSLATIONS['Installer'][lang]
        
        self.setWindowTitle(t['window_title'])
        if self.tabs.count() == 0:
            self.tabs.addTab(t['tab_all']); self.tabs.addTab(t['tab_apps']); self.tabs.addTab(t['tab_games'])
            for i, name in enumerate(("all.png", "apps.png", "games.png")):
                p = self.icon_dir / name
                if p.exists(): self.tabs.setTabIcon(i, QIcon(str(p)))
        else:
            self.tabs.setTabText(0, t['tab_all']); self.tabs.setTabText(1, t['tab_apps']); self.tabs.setTabText(2, t['tab_games'])

        self.btn_search.setText(t['search_btn'])
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

    def changeEvent(self, event):
        if self.settings.get("auto_minimize_tray", True) and event.type() == QEvent.Type.WindowStateChange and self.isMinimized():
            QTimer.singleShot(100, self._hide_to_tray)
            event.ignore()
            return
        super().changeEvent(event)

    def _hide_to_tray(self):
        self.hide()
        if self.settings.get("show_system_notifications", True):
            t = TRANSLATIONS['Installer'][self.language]
            self.tray_icon.showMessage(t['tray_running_title'], t['tray_running_msg'], QSystemTrayIcon.MessageIcon.Information, 2000)

    def proper_quit(self):
        self.save_installer_data()
        self.app.quit()
    
    def tray_icon_activated(self, reason):
        if reason == QSystemTrayIcon.ActivationReason.DoubleClick: self.show_window()

    def show_window(self):
        self.showNormal()
        self.activateWindow()

    def load_installer_data(self):
        self.settings = {"show_progress": True, "auto_select_add": False, "auto_minimize_tray": True, "show_system_notifications": True, "use_detailed_categories": False}
        if self.installer_data_file.exists() and self.installer_data_file.stat().st_size > 0:
            try:
                with open(self.installer_data_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                self.software_database = data.get("database", [])
                self.settings.update(data.get("settings", {}))
                for item in self.software_database:
                    if 'source' not in item: item['source'] = {}
                    if 'silent_args' not in item['source']: item['source']['silent_args'] = ""
                    if 'category' not in item: item['category'] = None
            except Exception as e:
                print(f"Error loading installer_data.json: {e}")
                self.software_database = []
        else:
            self.software_database = []
            if self.download_repo:
                self.fetch_online_repo()
            self.save_installer_data()

    def fetch_online_repo(self):
        t = TRANSLATIONS['Installer'][self.language]
        try:
            response = requests.get(BASIC_JSON_URL, timeout=10)
            response.raise_for_status()
            self.software_database = response.json()
            if not isinstance(self.software_database, list): self.software_database = []
        except requests.exceptions.RequestException as e:
            QMessageBox.critical(self, t['repo_err_title'], t['repo_err_net_body'].format(e=e))
        except json.JSONDecodeError:
            QMessageBox.critical(self, t['repo_err_title'], t['repo_err_json_body'])

    def save_installer_data(self):
        try:
            with open(self.installer_data_file, 'w', encoding='utf-8') as f:
                json.dump({"settings": self.settings, "database": self.software_database}, f, indent=4, ensure_ascii=False)
        except IOError as e:
            print(f"Could not save installer data file: {e}")

    def add_new_item(self):
        from .dialogs import AddSoftwareDialog
        dialog = AddSoftwareDialog(self, lang=self.language, settings=self.settings)
        if dialog.exec():
            name, item_type, category, source = dialog.get_data()
            if name and item_type and source:
                new_item = {
                    'name': name, 'type': item_type, 
                    'category': category, 'source': source
                }
                self.software_database.append(new_item)
                self.refresh_all_pages()
                if self.settings["auto_select_add"]:
                    QTimer.singleShot(50, lambda: self.find_and_check_item(new_item['name']))

    def find_and_check_item(self, item_name):
        for i in range(self.stack.count()):
            page = self.stack.widget(i)
            if page:
                for cb in page.findChildren(QCheckBox):
                    cb_data = cb.property("software_data")
                    if cb_data and cb_data.get('name') == item_name:
                        cb.setChecked(True)
                        return
    
    def export_data(self):
        if not self.software_database:
            QMessageBox.warning(self, "No Data", "Software list is empty, nothing to export.")
            return
        filePath, _ = QFileDialog.getSaveFileName(self, "Export List", "", "JSON Files (*.json)")
        if filePath:
            try:
                with open(filePath, 'w', encoding='utf-8') as f:
                    json.dump(self.software_database, f, indent=4, ensure_ascii=False)
                QMessageBox.information(self, "Success", f"Successfully exported the list to:\n{filePath}")
            except Exception as e:
                QMessageBox.critical(self, "Error", f"Could not export file. Error: {e}")

    def import_data(self):
        filePath, _ = QFileDialog.getOpenFileName(self, "Import List", "", "JSON Files (*.json)")
        if filePath:
            try:
                with open(filePath, 'r', encoding='utf-8') as f:
                    imported_data = json.load(f)
                if not isinstance(imported_data, list):
                    QMessageBox.critical(self, "Format Error", "The selected file does not contain valid data (not a list).")
                    return
                existing_names = {item['name'] for item in self.software_database}
                items_added = [item for item in imported_data if isinstance(item, dict) and 'name' in item and item['name'] not in existing_names]
                for item in items_added:
                    if 'category' not in item: item['category'] = None
                    self.software_database.append(item)
                if items_added:
                    QMessageBox.information(self, "Complete", f"Successfully imported and added {len(items_added)} new items.")
                    self.refresh_all_pages()
                else:
                    QMessageBox.information(self, "No Changes", "No new items were added. All items already exist in the list.")
            except Exception as e:
                QMessageBox.critical(self, "Error", f"Could not import file. Error: {e}")

    def open_settings_dialog(self):
        from .dialogs import SettingsDialog
        dialog = SettingsDialog(self.settings, self, lang=self.language)
        if dialog.exec():
            old_detailed = self.settings.get('use_detailed_categories')
            self.settings.update(dialog.get_settings())
            if old_detailed != self.settings.get('use_detailed_categories'):
                self.retranslate_ui()
                self.refresh_all_pages()

    def remove_selected_items(self):
        t = TRANSLATIONS['Installer'][self.language]
        all_checkboxes = [cb for i in range(self.stack.count()) if (page := self.stack.widget(i)) for cb in page.findChildren(QCheckBox)]
        items_to_remove_raw = [cb.property("software_data") for cb in all_checkboxes if cb.isChecked() and cb.property("software_data")]
        unique_items_to_remove = list({item['name']: item for item in items_to_remove_raw}.values())
        if not unique_items_to_remove:
            QMessageBox.warning(self, t['msg_no_selection_title'], t['msg_no_selection_body']); return
        if QMessageBox.question(self, t['msg_confirm_delete_title'], t['msg_confirm_delete_body'].format(count=len(unique_items_to_remove))) == QMessageBox.StandardButton.Yes:
            self.software_database = remove_software_items(self.software_database, unique_items_to_remove)
            self.refresh_all_pages()
            self.filter_current_view(self.last_search_text)

    def filter_current_view(self, search_text=""):
        search_text = search_text.strip().lower()
        self.last_search_text = search_text

        if not search_text:
            if self.is_searching:
                self.is_searching = False
                self.refresh_all_pages()
            return
        
        self.is_searching = True
        current_tab_name = self.tabs.tabText(self.tabs.currentIndex())
        t = TRANSLATIONS['Installer'][self.language]
        
        filter_map = { t['tab_all']: 'all', t['tab_apps']: 'app', t['tab_games']: 'game' }
        current_filter_type = filter_map.get(current_tab_name, 'all')

        matching_items = [
            item for item in self.software_database 
            if search_text in item['name'].lower() and (current_filter_type == 'all' or item['type'] == current_filter_type)
        ]
        matching_items.sort(key=lambda x: x['name'])
        
        results_widget = create_search_results_page(matching_items, self.handle_source_edit, self.handle_toggle_all_selection, self.language)
        current_page_scroll_area = self.stack.currentWidget()
        if current_page_scroll_area:
            current_page_scroll_area.setWidget(results_widget)
    
    def handle_toggle_all_selection(self, container_widget, button):
        if not container_widget: return
        t = TRANSLATIONS['Installer'][self.language]
        visible_checkboxes = [cb for cb in container_widget.findChildren(QCheckBox) if cb.isVisible()]
        if not visible_checkboxes: return
        new_state = not all(cb.isChecked() for cb in visible_checkboxes)
        for cb in visible_checkboxes: cb.setChecked(new_state)
        button.setText(t['deselect_all_btn'] if new_state else t['select_all_btn'])

    def refresh_all_pages(self):
        current_tab_index = self.tabs.currentIndex()
        while self.stack.count() > 0:
            widget = self.stack.widget(0)
            self.stack.removeWidget(widget)
            widget.deleteLater()
        
        lang = self.language
        common_args = (self.handle_source_edit, self.handle_toggle_all_selection, self.settings, lang)
        self.stack.addWidget(create_software_list_page(self.software_database, 'all', *common_args))
        self.stack.addWidget(create_software_list_page(self.software_database, 'app', *common_args))
        self.stack.addWidget(create_software_list_page(self.software_database, 'game', *common_args))
        
        self.stack.setCurrentIndex(current_tab_index if 0 <= current_tab_index < self.stack.count() else 0)

    def switch_tab(self, idx: int):
        if self.stack.count() == 0 or idx >= self.stack.count(): return
        if self.is_searching:
            self.filter_current_view(self.last_search_text)
        
        if self._prev == idx: return

        self.stack.setCurrentIndex(idx)
        if w := self.stack.widget(idx):
            fx = QGraphicsOpacityEffect(w)
            w.setGraphicsEffect(fx)
            anim = QPropertyAnimation(fx, b"opacity", self)
            anim.setDuration(250); anim.setStartValue(0.0); anim.setEndValue(1.0); anim.start()
        
        self._prev = idx
        
    def apply_theme(self):
        self.app.setStyleSheet(get_installer_style(self.theme))
        
    def _do_install(self):
        lang = self.language
        t = TRANSLATIONS['Installer'][lang]
        scope_text = self.install_from_combo.currentText()
        
        all_checkboxes = []
        for i in range(self.stack.count()):
            page = self.stack.widget(i)
            if page and page.widget():
                 all_checkboxes.extend(page.widget().findChildren(QCheckBox))
        
        selected_items_raw = [cb.property("software_data") for cb in all_checkboxes if cb.isChecked() and cb.property("software_data")]
        
        if self.is_searching:
            visible_items = selected_items_raw
        else:
            scope_map = { t['install_from_combo_current']: [self.tabs.currentIndex()], t['install_from_combo_all']: [0, 1, 2], t['install_from_combo_apps']: [1], t['install_from_combo_games']: [2] }
            type_map = {0: 'all', 1: 'app', 2: 'game'}
            allowed_types = {type_map[i] for i in scope_map.get(scope_text, [])}
            visible_items = [item for item in selected_items_raw if item['type'] in allowed_types or 'all' in allowed_types]

        selected_items = list({item['name']: item for item in visible_items if item.get('source', {}).get('value')}.values())

        if not selected_items:
            QMessageBox.warning(self, t['msg_no_selection_title'], t['msg_no_selection_body']); return
        
        self.is_installing = True
        self.btn_install.setEnabled(False)
        original_install_text = self.btn_install.text()
        
        self.temp_dir = tempfile.TemporaryDirectory()
        self.completed_count = 0
        total_items = len(selected_items)

        if self.settings.get("show_progress", True):
            from .dialogs import ProgressDialog
            self.progress_dialog = ProgressDialog(total_items, self, lang=lang)
            self.progress_dialog.setup_items(selected_items)
            self.hide()
            self.progress_dialog.show()

        with ThreadPoolExecutor(max_workers=5) as executor:
            for item in selected_items:
                worker = InstallerWorker(item, self.temp_dir.name)
                if self.settings.get("show_progress", True):
                    worker.progress.connect(self.progress_dialog.update_item_status)
                worker.finished.connect(lambda: self._on_install_task_finished(total_items, original_install_text))
                executor.submit(worker.run)

    def _on_install_task_finished(self, total_items, original_text):
        lang = self.language
        t = TRANSLATIONS['Installer'][lang]
        self.completed_count += 1
        
        if self.settings.get("show_progress", True):
            self.progress_dialog.update_overall_progress(self.completed_count)
        else:
            self.btn_install.setText(f"{self.completed_count}/{total_items}")

        if self.completed_count == total_items:
            self.is_installing = False
            self.btn_install.setEnabled(True)
            self.btn_install.setText(original_text)
            self.temp_dir.cleanup()
            
            if self.settings.get("show_progress", True) and self.progress_dialog.isVisible():
                self.progress_dialog.all_done()
            else:
                self.show_window()

            if self.settings.get("show_system_notifications", True):
                self.tray_icon.showMessage(t['msg_install_complete_title'], t['msg_install_complete_body'].format(count=total_items), QSystemTrayIcon.MessageIcon.Information, 3000)

    def center_on_screen(self):
        if screen := self.screen(): self.move(screen.availableGeometry().center() - self.frameGeometry().center())
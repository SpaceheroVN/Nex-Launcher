# Installer/Installer_dialogs.py
from urllib.parse import urlparse
from functools import partial
import subprocess
import re

from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit, QPushButton,
    QDialogButtonBox, QFileDialog, QMessageBox, QWidget, QComboBox, QCheckBox,
    QProgressBar, QGridLayout, QScrollArea, QTableWidget, QTableWidgetItem, QHeaderView,
    QSizePolicy
)
from PyQt6.QtCore import Qt, QUrl, QPoint, pyqtSignal, QThread, QTimer
from PyQt6.QtGui import QFont, QIcon, QCloseEvent
from .Installer_config import TRANSLATIONS

class HelpDialog(QDialog):
    def __init__(self, help_text, parent=None):
        super().__init__(parent)
        self.setWindowFlags(Qt.WindowType.Tool | Qt.WindowType.FramelessWindowHint)
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground, True)
        self.setFocusPolicy(Qt.FocusPolicy.NoFocus)
        self.setFixedSize(300, 350)
        container = QWidget(self)
        container.setObjectName("helpContainer")
        layout = QVBoxLayout(container)
        scroll_area = QScrollArea()
        scroll_area.setWidgetResizable(True)
        scroll_area.setObjectName("helpScrollArea")
        scroll_area.setStyleSheet("background: transparent; border: none;")
        self.label = QLabel(help_text)
        self.label.setWordWrap(True)
        self.label.setTextFormat(Qt.TextFormat.RichText)
        self.label.setOpenExternalLinks(True)
        scroll_area.setWidget(self.label)
        layout.addWidget(scroll_area)
        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(0,0,0,0)
        main_layout.addWidget(container)

class SourceEditDialog(QDialog):
    def __init__(self, source_type, current_value, current_args, placeholder_text, parent=None, lang='EN'):
        super().__init__(parent)
        self.lang = lang
        self.source_type = source_type
        self.help_dialog = None
        t = TRANSLATIONS['Installer'][lang]
        self.setWindowTitle(t['edit_source_title'].format(source_type=source_type))
        main_layout = QVBoxLayout(self)
        main_layout.addWidget(QLabel(t['source_value_label']))
        value_layout = QHBoxLayout()
        self.value_edit = QLineEdit(current_value)
        if not current_value and placeholder_text:
            self.value_edit.setPlaceholderText(placeholder_text)
        value_layout.addWidget(self.value_edit)
        if self.source_type == 'Package':
            browse_btn = QPushButton(t['package_browse_btn'])
            browse_btn.setObjectName("browseButton")
            browse_btn.clicked.connect(self.browse_file)
            value_layout.addWidget(browse_btn)
        main_layout.addLayout(value_layout)
        args_label_layout = QHBoxLayout()
        args_label_layout.addWidget(QLabel(t['silent_args_label']))
        args_label_layout.addStretch()
        self.help_btn = QPushButton("?")
        self.help_btn.setObjectName("helpButton")
        self.help_btn.setFixedSize(25, 25)
        self.help_btn.setCheckable(True)
        self.help_btn.toggled.connect(self.toggle_help_dialog)
        args_label_layout.addWidget(self.help_btn)
        main_layout.addLayout(args_label_layout)
        args_input_layout = QHBoxLayout()
        self.args_edit = QLineEdit(current_args or "")
        self.args_edit.setPlaceholderText(t['silent_args_placeholder'])
        args_input_layout.addWidget(self.args_edit)
        self.options_btn = QPushButton(t['silent_args_select_btn'])
        self.options_btn.setCheckable(True)
        self.options_btn.toggled.connect(self.toggle_options_panel)
        args_input_layout.addWidget(self.options_btn)
        main_layout.addLayout(args_input_layout)
        self.create_options_panel()
        main_layout.addWidget(self.checkbox_panel)
        buttons = QDialogButtonBox(QDialogButtonBox.StandardButton.Ok | QDialogButtonBox.StandardButton.Cancel)
        buttons.button(QDialogButtonBox.StandardButton.Ok).setObjectName("acceptButton")
        buttons.button(QDialogButtonBox.StandardButton.Cancel).setObjectName("cancelButton")
        buttons.accepted.connect(self.accept)
        buttons.rejected.connect(self.reject)
        main_layout.addWidget(buttons)
        self.adjustSize()

    def create_options_panel(self):
        self.checkbox_panel = QWidget()
        layout = QGridLayout(self.checkbox_panel)
        layout.setSpacing(10)
        self.arg_map = {
            '/S':"force", '/s':"force", '/Silent':"force", '/silent':"force", '/verysilent':"force",
            '/q':"force", '/qn':"force", '/quiet':"force", '/passive':"force",
            '/SP-':"add", '/SUPPRESSMSGBOXES':"add", '/norestart':"add"
        }
        self.checkboxes = {}
        row, col = 0, 0
        for arg_text in self.arg_map.keys():
            checkbox = QCheckBox(arg_text)
            checkbox.toggled.connect(partial(self.on_checkbox_toggled, arg_text))
            self.checkboxes[arg_text] = checkbox
            layout.addWidget(checkbox, row, col)
            col += 1
            if col > 2:
                col = 0
                row += 1
        self.checkbox_panel.hide()
        self.update_checkboxes_from_text()

    def on_checkbox_toggled(self, toggled_arg, is_checked):
        arg_type = self.arg_map.get(toggled_arg)
        current_args_list = self.args_edit.text().split()
        new_args_list = [arg for arg in current_args_list if arg]
        if is_checked:
            if arg_type == "force":
                for arg, type_of_arg in self.arg_map.items():
                    if type_of_arg == "force" and arg != toggled_arg:
                        if arg in new_args_list:
                            new_args_list.remove(arg)
            if toggled_arg not in new_args_list:
                new_args_list.append(toggled_arg)
        else:
            if toggled_arg in new_args_list:
                new_args_list.remove(toggled_arg)
        self.args_edit.setText(" ".join(new_args_list))
        self.update_checkboxes_from_text()

    def update_checkboxes_from_text(self):
        current_args = self.args_edit.text().split()
        for arg_text, checkbox in self.checkboxes.items():
            checkbox.blockSignals(True)
            checkbox.setChecked(arg_text in current_args)
            checkbox.blockSignals(False)

    def toggle_options_panel(self, checked):
        if checked:
            self.checkbox_panel.show()
        else:
            self.checkbox_panel.hide()
            if self.help_dialog and self.help_dialog.isVisible():
                self.help_dialog.hide()
                self.help_btn.setChecked(False)
        self.adjustSize()
        self.position_help_dialog()

    def toggle_help_dialog(self, checked):
        if checked:
            if not self.help_dialog:
                t = TRANSLATIONS['Installer'][self.lang]
                self.help_dialog = HelpDialog(t['silent_args_help_body_rich'], self)
            self.help_dialog.show()
            QTimer.singleShot(1, self.position_help_dialog)
        else:
            if self.help_dialog:
                self.help_dialog.hide()

    def position_help_dialog(self):
        if self.help_dialog and self.help_dialog.isVisible():
            parent_geo = self.geometry()
            self.help_dialog.move(parent_geo.x() + parent_geo.width() + 10, parent_geo.y() - 30)

    def moveEvent(self, event):
        super().moveEvent(event)
        self.position_help_dialog()

    def closeEvent(self, event: QCloseEvent):
        if self.help_dialog:
            self.help_dialog.close()
        super().closeEvent(event)

    def showEvent(self, event):
        super().showEvent(event)
        if self.help_dialog and self.help_dialog.isVisible():
            self.position_help_dialog()

    def browse_file(self):
        file_path, _ = QFileDialog.getOpenFileName(
            self, "Select Installer", "", "Installers (*.exe *.msi *.bat);;All Files (*)"
        )
        if file_path:
            self.value_edit.setText(file_path)

    def accept(self):
        t = TRANSLATIONS['Installer'][self.lang]
        if self.source_type == 'Link':
            url = self.value_edit.text().strip()
            if not url:
                super().accept()
                return
            try:
                result = urlparse(url)
                if not all([result.scheme, result.netloc]) or result.scheme not in ['http', 'https']:
                    QMessageBox.warning(self, t['msg_invalid_link_title'], t['msg_invalid_link_body'])
                    return
            except Exception:
                QMessageBox.warning(self, t['msg_invalid_link_title'], t['msg_invalid_link_body'])
                return
        super().accept()

    def get_data(self):
        return self.value_edit.text(), self.args_edit.text()

class SearchDialog(QDialog):
    def __init__(self, parent=None, lang='EN', current_text="", realtime_filter_slot=None):
        super().__init__(parent)
        t = TRANSLATIONS['Installer'][lang]
        self.setWindowTitle(t['search_dialog_title'])
        self.setMinimumWidth(350)
        layout = QVBoxLayout(self)
        self.search_edit = QLineEdit(self)
        self.search_edit.setPlaceholderText(t['search_placeholder'])
        self.search_edit.setText(current_text)
        if realtime_filter_slot:
            self.search_edit.textChanged.connect(realtime_filter_slot)
        layout.addWidget(self.search_edit)
        self.keep_text_check = QCheckBox(t['keep_text_check'])
        self.keep_text_check.setChecked(True)
        layout.addWidget(self.keep_text_check)
        buttons = QDialogButtonBox(QDialogButtonBox.StandardButton.Ok | QDialogButtonBox.StandardButton.Cancel)
        buttons.button(QDialogButtonBox.StandardButton.Ok).setObjectName("acceptButton")
        buttons.button(QDialogButtonBox.StandardButton.Cancel).setObjectName("cancelButton")
        buttons.accepted.connect(self.accept)
        buttons.rejected.connect(self.reject)
        layout.addWidget(buttons)

    def get_data(self):
        return self.search_edit.text(), self.keep_text_check.isChecked()

class ProgressDialog(QDialog):
    def __init__(self, max_value, parent=None, lang='EN'):
        super().__init__(parent)
        self.lang = lang
        self.t = TRANSLATIONS['Installer'][self.lang]
        self.setWindowTitle(self.t.get('progress_title', "Installation Progress"))
        self.setModal(True)
        self.setWindowFlags(self.windowFlags() | Qt.WindowType.WindowStaysOnTopHint)
        self.item_labels = {}
        self.setMinimumWidth(600)
        self.setSizePolicy(QSizePolicy.Policy.Preferred, QSizePolicy.Policy.MinimumExpanding)
        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(10, 10, 10, 10)
        main_layout.setSpacing(10)
        scroll_area = QScrollArea()
        scroll_area.setWidgetResizable(True)
        scroll_area.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        container = QWidget()
        self.grid_layout = QGridLayout(container)
        self.grid_layout.setColumnStretch(0, 1)
        self.grid_layout.setSpacing(5)
        scroll_area.setWidget(container)
        main_layout.addWidget(scroll_area)
        bottom_layout = QHBoxLayout()
        self.overall_progress = QProgressBar()
        self.overall_progress.setMaximum(max_value)
        self.overall_progress.setValue(0)
        self.overall_progress.setTextVisible(True)
        self.overall_progress.setFormat(f"%v/%m - {self.t.get('progress_overall_text', 'Overall Progress')}")
        bottom_layout.addWidget(self.overall_progress)
        self.close_button = QPushButton(self.t.get('close_btn', "Close"))
        self.close_button.setObjectName("acceptButton")
        self.close_button.clicked.connect(self.accept)
        self.close_button.setEnabled(False)
        bottom_layout.addWidget(self.close_button)
        main_layout.addLayout(bottom_layout)

    def setup_items(self, items):
        num_items = len(items)
        for i, item in enumerate(items):
            name = item.get('name', 'Unknown')
            name_label = QLabel(name)
            status_label = QLabel(self.t.get('progress_status_waiting', "Waiting..."))
            status_label.setProperty("status", "waiting")
            self.grid_layout.addWidget(name_label, i, 0)
            self.grid_layout.addWidget(status_label, i, 1, Qt.AlignmentFlag.AlignRight)
            self.item_labels[name] = status_label
        num_rows_to_display = min(num_items, 5)
        row_height = 35
        base_height = 100
        target_height = base_height + (num_rows_to_display * row_height)
        self.setFixedSize(self.width(), target_height)

    def update_item_status(self, item_name, status, details):
        if item_name not in self.item_labels:
            return
        status_label = self.item_labels[item_name]
        status_label.setProperty("status", status)
        status_label.setToolTip("")
        
        status_text_map = {
            "installing": self.t.get('progress_status_installing', "Installing..."),
            "completed": self.t.get('progress_status_completed', "Completed"),
            "failed": self.t.get('progress_status_failed', "Failed"),
            "waiting": self.t.get('progress_status_waiting', "Waiting..."),
            "final_failure": self.t.get('progress_status_final_failure', "Failure"),
        }

        if status == "downloading":
            percent = details.get('percent', 0)
            status_text = self.t.get('progress_status_downloading', "Downloading ({percent}%)").format(percent=percent)
        elif status == "retrying":
            attempt = details.get('attempt', 1)
            status_text = self.t.get('progress_status_retrying', "Retrying (attempt {attempt})...").format(attempt=attempt)
        elif status == "failed":
            status_text = status_text_map.get(status)
            if error_msg := details.get('error'):
                status_label.setToolTip(error_msg)
        elif status == "final_failure":
            status_text = status_text_map.get(status)
            status_label.setProperty("status", "failed")
            if count := details.get('count'):
                status_label.setToolTip(self.t.get('msg_final_failure_tooltip', "").format(count=count))
        else:
            status_text = status_text_map.get(status, "Unknown")
            
        status_label.setText(status_text)
        status_label.style().unpolish(status_label)
        status_label.style().polish(status_label)

    def update_overall_progress(self, value):
        self.overall_progress.setValue(value)

    def all_done(self):
        self.setWindowTitle(self.t.get('progress_title_done', "Installation Finished"))
        self.close_button.setEnabled(True)
        self.close_button.setFocus()

    def accept(self):
        if self.parent():
            self.parent().show_window()
        super().accept()
        
# ... (Phần còn lại của file không thay đổi)
class SettingsDialog(QDialog):
    def __init__(self, current_settings, parent=None, lang='EN'):
        super().__init__(parent)
        self.lang = lang
        t = TRANSLATIONS['Installer'][self.lang]
        self.setWindowTitle(t['settings_title']); self.setMinimumWidth(400)
        layout = QVBoxLayout(self)
        self.progress_check = QCheckBox(t['show_progress_check']); self.progress_check.setChecked(current_settings.get("show_progress", True))
        layout.addWidget(self.progress_check)
        self.notification_check = QCheckBox(t['show_system_notifications_check']); self.notification_check.setChecked(current_settings.get("show_system_notifications", True))
        layout.addWidget(self.notification_check)
        self.autoselect_check = QCheckBox(t['auto_select_check']); self.autoselect_check.setChecked(current_settings.get("auto_select_add", False))
        layout.addWidget(self.autoselect_check)
        self.minimize_check = QCheckBox(t['auto_minimize_tray_check']); self.minimize_check.setChecked(current_settings.get("auto_minimize_tray", True))
        layout.addWidget(self.minimize_check)
        self.detailed_categories_check = QCheckBox(t['detailed_categories_check']); self.detailed_categories_check.setChecked(current_settings.get("use_detailed_categories", False))
        layout.addWidget(self.detailed_categories_check)
        layout.addStretch()
        bottom_button_layout = QHBoxLayout()
        bottom_button_layout.addStretch()
        dialog_buttons = QDialogButtonBox(QDialogButtonBox.StandardButton.Ok | QDialogButtonBox.StandardButton.Cancel)
        dialog_buttons.button(QDialogButtonBox.StandardButton.Ok).setObjectName("acceptButton")
        dialog_buttons.button(QDialogButtonBox.StandardButton.Cancel).setObjectName("cancelButton")
        dialog_buttons.accepted.connect(self.accept); dialog_buttons.rejected.connect(self.reject)
        bottom_button_layout.addWidget(dialog_buttons)
        layout.addLayout(bottom_button_layout)

    def get_settings(self):
        return {
            "show_progress": self.progress_check.isChecked(),
            "auto_select_add": self.autoselect_check.isChecked(),
            "auto_minimize_tray": self.minimize_check.isChecked(),
            "show_system_notifications": self.notification_check.isChecked(),
            "use_detailed_categories": self.detailed_categories_check.isChecked()
        }

class AddSoftwareDialog(QDialog):
    def __init__(self, parent=None, lang='EN', settings=None):
        super().__init__(parent)
        self.lang = lang
        self.settings = settings if settings is not None else {}
        t = TRANSLATIONS['Installer'][lang]
        self.setWindowTitle(t['add_item_title'])
        self.setMinimumWidth(450)
        layout = QVBoxLayout(self)
        layout.addWidget(QLabel(t['item_name_label']))
        self.name_edit = QLineEdit(self)
        self.name_edit.setPlaceholderText(t['item_name_placeholder'])
        layout.addWidget(self.name_edit)
        use_detailed = self.settings.get("use_detailed_categories", False)
        layout.addWidget(QLabel(t['item_category_label'] if use_detailed else t['item_type_label']))
        self.type_combo = QComboBox(self)
        if use_detailed:
            self.categories = TRANSLATIONS['Installer_Categories'][self.lang]
            self.type_combo.addItems(self.categories.keys())
        else:
            self.type_combo.addItems([t['item_type_app'], t['item_type_game']])
        layout.addWidget(self.type_combo)
        layout.addWidget(QLabel(t.get('source_type_label', 'Source Type:')))
        self.source_type_combo = QComboBox()
        self.source_type_combo.addItems(["Package", "Link", "Winget"])
        self.source_type_combo.currentTextChanged.connect(self.on_source_type_changed)
        layout.addWidget(self.source_type_combo)
        self.source_value_widget = QWidget()
        source_layout = QHBoxLayout(self.source_value_widget)
        source_layout.setContentsMargins(0,0,0,0)
        self.source_value_edit = QLineEdit()
        self.browse_button = QPushButton(t.get('package_browse_btn', 'Browse...'))
        self.browse_button.setObjectName("browseButton")
        self.browse_button.clicked.connect(self.browse_file)
        source_layout.addWidget(self.source_value_edit)
        source_layout.addWidget(self.browse_button)
        layout.addWidget(self.source_value_widget)
        layout.addStretch()
        buttons = QDialogButtonBox(QDialogButtonBox.StandardButton.Ok | QDialogButtonBox.StandardButton.Cancel)
        buttons.button(QDialogButtonBox.StandardButton.Ok).setObjectName("acceptButton")
        buttons.button(QDialogButtonBox.StandardButton.Cancel).setObjectName("cancelButton")
        buttons.accepted.connect(self.accept)
        buttons.rejected.connect(self.reject)
        layout.addWidget(buttons)
        self.on_source_type_changed(self.source_type_combo.currentText())

    def on_source_type_changed(self, source_type):
        if source_type == "Package":
            self.source_value_edit.setPlaceholderText("Path to .exe or .msi file...")
            self.browse_button.show()
        elif source_type == "Link":
            self.source_value_edit.setPlaceholderText("https://... download link")
            self.browse_button.hide()
        elif source_type == "Winget":
            self.source_value_edit.setPlaceholderText("Winget Package ID (e.g., Microsoft.VisualStudioCode)")
            self.browse_button.hide()

    def browse_file(self):
        file_path, _ = QFileDialog.getOpenFileName(self, "Select Installer", "", "Installers (*.exe *.msi *.bat);;All Files (*)")
        if file_path:
            self.source_value_edit.setText(file_path)

    def get_data(self):
        t = TRANSLATIONS['Installer'][self.lang]
        name = self.name_edit.text().strip()
        if not name:
            QMessageBox.warning(self, t.get('msg_input_error_title', 'Input Error'), t.get('msg_name_empty_body', "Item name cannot be empty."))
            return None, None, None, None
        selected_text = self.type_combo.currentText()
        en_category = None
        if self.settings.get("use_detailed_categories", False):
            category_map_lang = TRANSLATIONS['Installer_Categories'][self.lang]
            category_map_en = TRANSLATIONS['Installer_Categories']['EN']
            en_category = next((en_cat for en_cat, lang_cat in zip(category_map_en.keys(), category_map_lang.keys()) if lang_cat == selected_text), "Utilities")
            item_type = category_map_en.get(en_category, 'app')
        else:
            item_type = "app" if selected_text == t['item_type_app'] else "game"
        source_type = self.source_type_combo.currentText()
        source_value = self.source_value_edit.text().strip()
        if not source_value:
             QMessageBox.warning(self, t.get('msg_input_error_title', 'Input Error'), t.get('source_value_empty', "Source value cannot be empty."))
             return None, None, None, None
        source = {'type': source_type, 'value': source_value, 'silent_args': ''}
        return name, item_type, en_category, source

class WingetSearchWorker(QThread):
    search_complete = pyqtSignal(list)
    def __init__(self, search_term):
        super().__init__()
        self.search_term = search_term

    def run(self):
        results = []
        try:
            command = ['winget', 'search', self.search_term]
            proc = subprocess.run(
                command,
                capture_output=True,
                text=True,
                encoding='utf-8',
                errors='ignore',
                creationflags=subprocess.CREATE_NO_WINDOW
            )
            output = proc.stdout
            lines = output.splitlines()
            if len(lines) > 2:
                header_index = -1
                for i, line in enumerate(lines):
                    if line.strip().startswith('---'):
                        header_index = i - 1
                        break
                if header_index != -1:
                    header_line = lines[header_index]
                    id_pos = header_line.find('Id')
                    version_pos = header_line.find('Version')
                    for line in lines[header_index + 2:]:
                        if not line.strip() or id_pos == -1 or version_pos == -1:
                            continue
                        name = line[:id_pos].strip()
                        app_id = line[id_pos:version_pos].strip()
                        if name and app_id:
                            results.append({'name': name, 'id': app_id})
        except FileNotFoundError:
            print("Error: 'winget' command not found. Please ensure Winget is installed and in your PATH.")
        except Exception as e:
            print(f"Error during Winget search: {e}")
        self.search_complete.emit(results)

class WingetSearchDialog(QDialog):
    def __init__(self, software_name, parent=None, lang='EN'):
        super().__init__(parent)
        t = TRANSLATIONS['Installer'][lang]
        self.setWindowTitle(t.get('winget_title', "Search Winget Packages"))
        self.setMinimumSize(700, 500)
        self.selected_id = None
        layout = QVBoxLayout(self)
        search_layout = QHBoxLayout()
        self.search_edit = QLineEdit(software_name)
        self.search_button = QPushButton(t.get('search_btn', "Search..."))
        self.search_button.setObjectName("searchButton")
        self.search_button.clicked.connect(self.start_search)
        search_layout.addWidget(self.search_edit)
        search_layout.addWidget(self.search_button)
        layout.addLayout(search_layout)
        self.results_table = QTableWidget()
        self.results_table.setColumnCount(2)
        self.results_table.setHorizontalHeaderLabels(["Name", "Package ID"])
        self.results_table.horizontalHeader().setSectionResizeMode(0, QHeaderView.ResizeMode.Stretch)
        self.results_table.horizontalHeader().setSectionResizeMode(1, QHeaderView.ResizeMode.Stretch)
        self.results_table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        self.results_table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        self.results_table.itemClicked.connect(self.on_item_selected)
        layout.addWidget(self.results_table)
        self.progress_bar = QProgressBar()
        self.progress_bar.setRange(0, 0)
        self.progress_bar.hide()
        layout.addWidget(self.progress_bar)
        self.button_box = QDialogButtonBox(QDialogButtonBox.StandardButton.Ok | QDialogButtonBox.StandardButton.Cancel)
        self.button_box.button(QDialogButtonBox.StandardButton.Ok).setObjectName("acceptButton")
        self.button_box.button(QDialogButtonBox.StandardButton.Cancel).setObjectName("cancelButton")
        self.button_box.accepted.connect(self.accept)
        self.button_box.rejected.connect(self.reject)
        self.button_box.button(QDialogButtonBox.StandardButton.Ok).setEnabled(False)
        layout.addWidget(self.button_box)

    def start_search(self):
        search_term = self.search_edit.text().strip()
        if not search_term: return
        self.search_button.setEnabled(False)
        self.results_table.setRowCount(0)
        self.button_box.button(QDialogButtonBox.StandardButton.Ok).setEnabled(False)
        self.progress_bar.show()
        self.search_worker = WingetSearchWorker(search_term)
        self.search_worker.search_complete.connect(self.on_search_complete)
        self.search_worker.start()

    def on_search_complete(self, results):
        self.progress_bar.hide()
        self.search_button.setEnabled(True)
        self.results_table.setRowCount(len(results))
        for row, item in enumerate(results):
            self.results_table.setItem(row, 0, QTableWidgetItem(item['name']))
            self.results_table.setItem(row, 1, QTableWidgetItem(item['id']))

    def on_item_selected(self, item):
        self.selected_id = self.results_table.item(item.row(), 1).text()
        self.button_box.button(QDialogButtonBox.StandardButton.Ok).setEnabled(True)

    def get_data(self):
        return self.selected_id
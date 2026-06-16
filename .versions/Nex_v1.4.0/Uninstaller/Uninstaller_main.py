# Uninstaller/Uninstaller_main.py
import subprocess
import json
from pathlib import Path
from functools import partial

from PyQt6.QtCore import Qt, QSize
from PyQt6.QtGui import QIcon, QKeySequence, QShortcut, QAction, QCloseEvent, QMouseEvent
from PyQt6.QtWidgets import (QApplication, QCheckBox, QHBoxLayout, QLabel,
                             QMainWindow, QMessageBox, QPushButton, QScrollArea,
                             QVBoxLayout, QWidget, QLineEdit, QSystemTrayIcon, QMenu, QFrame)

from .Uninstaller_config import TRANSLATIONS, get_uninstaller_style
from .Uninstaller_tools import AppScannerWorker, create_app_row_widget
from .Uninstaller_dialogs import (SettingsDialog, ConfirmUninstallDialog,
                                  UninstallProgressDialog, UninstallWorker)

class ClickableHeader(QWidget):
    def __init__(self, key, text, parent_window):
        super().__init__()
        self.key = key
        self.parent_window = parent_window
        self.setObjectName("headerWidget")

        layout = QHBoxLayout(self)
        layout.setContentsMargins(5, 0, 5, 0)
        layout.setSpacing(5)

        self.label = QLabel(text)
        self.label.setObjectName("headerLabel")

        self.indicator = QLabel()
        self.indicator.setObjectName("sortIndicator")
        self.indicator.setFixedSize(12, 12)
        self.indicator.hide()

        layout.addWidget(self.label)
        layout.addWidget(self.indicator)
        layout.addStretch()

    def mousePressEvent(self, event: QMouseEvent):
        self.parent_window.on_header_clicked(self.key)

class UninstallerWindow(QMainWindow):
    def __init__(self, app_instance, launcher_instance, language, theme, always_on_top=False):
        super().__init__()
        self.app = app_instance
        self.launcher = launcher_instance
        self.language = language
        self.theme = theme
        self.t = TRANSLATIONS['Uninstaller'][self.language]
        self.all_apps = []
        self.is_installing = False
        self.sort_key = "name"
        self.sort_order = Qt.SortOrder.AscendingOrder
        self.last_clicked_index = -1
        self.config_path = self.launcher.app_data_path / "uninstaller_config.json"
        self.icon_dir = Path(__file__).parent.parent / "icons"
        self.fallback_icon = QIcon(str(self.icon_dir / "what_app.ico"))

        if always_on_top:
            self.setWindowFlags(self.windowFlags() | Qt.WindowType.WindowStaysOnTopHint)

        self.load_config()
        self.setWindowTitle(self.t['window_title'])
        self.setMinimumSize(950, 700)
        logo_path = self.icon_dir / "logo.ico"
        if logo_path.exists(): self.setWindowIcon(QIcon(str(logo_path)))
        self._setup_ui()
        self._setup_tray_icon(logo_path)
        self.apply_theme()
        self.start_scan()

    def load_config(self):
        default_config = {
            "silent_uninstall": True, "show_confirmation": True, "show_progress_dialog": True,
            "show_notification": True, "minimize_on_close": True
        }
        if self.config_path.exists():
            try:
                with open(self.config_path, 'r', encoding='utf-8') as f: self.config = json.load(f)
            except (json.JSONDecodeError, IOError): self.config = default_config
        else: self.config = default_config
        for key, value in default_config.items(): self.config.setdefault(key, value)
        self.save_config()

    def save_config(self):
        try:
            with open(self.config_path, 'w', encoding='utf-8') as f: json.dump(self.config, f, indent=4)
        except IOError as e: print(f"Lỗi khi lưu cấu hình: {e}")

    def _setup_ui(self):
        main_widget = QWidget()
        main_layout = QVBoxLayout(main_widget); main_layout.setContentsMargins(15, 15, 15, 15); main_layout.setSpacing(10)
        top_layout = QHBoxLayout()
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText(self.t.get('search_placeholder', "Tìm kiếm..."))
        self.search_input.setObjectName("searchInput")
        self.search_input.textChanged.connect(self.filter_app_list)
        top_layout.addWidget(self.search_input, 1)
        self.refresh_button = QPushButton(self.t['refresh_btn'])
        self.refresh_button.clicked.connect(self.start_scan)
        top_layout.addWidget(self.refresh_button)
        main_layout.addLayout(top_layout)
        header_widget = self._create_list_header()
        main_layout.addWidget(header_widget)
        self.scroll_area = QScrollArea()
        self.scroll_area.setWidgetResizable(True)
        self.scroll_area.setObjectName("contentScroll")
        self.list_container = QWidget(objectName="list_container")
        self.list_layout = QVBoxLayout(self.list_container)
        self.list_layout.setContentsMargins(0, 0, 0, 0); self.list_layout.setSpacing(0); self.list_layout.addStretch()
        self.scroll_area.setWidget(self.list_container)
        main_layout.addWidget(self.scroll_area)

        separator = QFrame()
        separator.setObjectName("bottomSeparatorLine")
        separator.setFrameShape(QFrame.Shape.HLine)
        separator.setFrameShadow(QFrame.Shadow.Sunken)
        main_layout.addWidget(separator)

        bottom_layout = QHBoxLayout()
        settings_icon_path = self.icon_dir / "settings.ico"
        self.settings_button = QPushButton(icon=QIcon(str(settings_icon_path)))
        self.settings_button.setObjectName("settingsButton")
        self.settings_button.setFixedSize(40, 40)
        self.settings_button.setIconSize(QSize(24, 24))
        self.settings_button.clicked.connect(self.show_settings_dialog)
        bottom_layout.addWidget(self.settings_button)
        self.status_label = QLabel("")
        self.status_label.setObjectName("statusLabel")
        bottom_layout.addWidget(self.status_label, 1, Qt.AlignmentFlag.AlignLeft)
        self.uninstall_button = QPushButton(self.t['uninstall_btn'])
        self.uninstall_button.setObjectName("uninstallButton")
        self.uninstall_button.setMinimumSize(150, 40)
        self.uninstall_button.clicked.connect(self.uninstall_selected)
        bottom_layout.addWidget(self.uninstall_button)
        main_layout.addLayout(bottom_layout)
        self.setCentralWidget(main_widget)
        shortcut_select_all = QShortcut(QKeySequence("Ctrl+A"), self)
        shortcut_select_all.activated.connect(lambda: self.select_all_header_check.setChecked(True))

    def _create_list_header(self):
        header_container = QWidget(objectName="headerContainer")
        header_layout = QHBoxLayout(header_container)
        header_layout.setContentsMargins(0, 5, 10, 5); header_layout.setSpacing(10)
        self.select_all_header_check = QCheckBox()
        self.select_all_header_check.setObjectName("selectAllHeaderCheckbox")
        self.select_all_header_check.setToolTip(self.t['header_select_all_tooltip'])
        self.select_all_header_check.toggled.connect(self.toggle_all_visible)
        header_layout.addWidget(self.select_all_header_check)
        header_layout.addSpacing(42)
        self.header_buttons = {}
        header_data = {"name": (self.t['header_name'], 5), "publisher": (self.t['header_publisher'], 3), "install_date": (self.t['header_date'], 1), "size_kb": (self.t['header_size'], 1)}
        for key, (text, stretch) in header_data.items():
            header_item = ClickableHeader(key, text, self)
            header_layout.addWidget(header_item, stretch)
            self.header_buttons[key] = header_item
        return header_container

    def clear_list(self):
        while self.list_layout.count() > 1:
            child = self.list_layout.takeAt(0)
            if child and child.widget(): child.widget().deleteLater()

    def start_scan(self):
        self.clear_list(); self.all_apps = []
        self.loading_label = QLabel(self.t['loading_text']); self.loading_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.list_layout.insertWidget(0, self.loading_label)
        self.set_controls_enabled(False)
        self.scanner = AppScannerWorker(language=self.language)
        self.scanner.finished.connect(self.populate_app_list)
        self.scanner.start()

    def populate_app_list(self, apps):
        if hasattr(self, 'loading_label') and self.loading_label:
            self.loading_label.deleteLater()
            delattr(self, 'loading_label')
        self.all_apps = apps
        self.search_input.clear()
        self.set_controls_enabled(True)
        self.clear_list()
        if not apps:
            no_apps_label = QLabel(self.t['no_apps_found_body'])
            no_apps_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
            self.list_layout.insertWidget(0, no_apps_label)
        else:
            self.sort_and_redisplay_apps()
        self.update_status_label()

    def on_header_clicked(self, key):
        if self.sort_key == key: self.sort_order = Qt.SortOrder.DescendingOrder if self.sort_order == Qt.SortOrder.AscendingOrder else Qt.SortOrder.AscendingOrder
        else: self.sort_key, self.sort_order = key, Qt.SortOrder.AscendingOrder
        self.sort_and_redisplay_apps()

    def update_header_indicators(self):
        for key, header_item in self.header_buttons.items():
            header_item.indicator.hide()
            header_item.setProperty("active", False)
            header_item.style().unpolish(header_item)
            header_item.style().polish(header_item)

        if self.sort_key in self.header_buttons:
            active_item = self.header_buttons[self.sort_key]
            active_item.indicator.show()
            active_item.setProperty("active", True)

            order = "asc" if self.sort_order == Qt.SortOrder.AscendingOrder else "desc"
            active_item.indicator.setProperty("sort_order", order)

            active_item.style().unpolish(active_item)
            active_item.style().polish(active_item)
            active_item.indicator.style().unpolish(active_item.indicator)
            active_item.indicator.style().polish(active_item.indicator)

    def sort_and_redisplay_apps(self):
        if not self.all_apps: return
        reverse = (self.sort_order == Qt.SortOrder.DescendingOrder)
        def sort_key_func(app):
            val = app.get(self.sort_key)
            if self.sort_key == "size_kb": return val if val is not None else -1
            if self.sort_key == "install_date": return val if val else "0"
            return str(val or "").lower()

        self.all_apps.sort(key=sort_key_func, reverse=reverse)

        self.clear_list()
        for i, app_data in enumerate(self.all_apps):
            row_widget = create_app_row_widget(app_data, self.fallback_icon, self.t)
            row_widget.setProperty("rowType", "even" if i % 2 == 0 else "odd")
            if checkbox := row_widget.findChild(QCheckBox): checkbox.toggled.connect(partial(self.on_checkbox_toggled, i))
            self.list_layout.insertWidget(self.list_layout.count() - 1, row_widget)

        self.filter_app_list(self.search_input.text())
        self.update_header_indicators()
        self.last_clicked_index = -1

    def on_checkbox_toggled(self, index, state):
        modifiers = QApplication.keyboardModifiers()
        all_widgets = self.get_all_row_widgets()

        if modifiers == Qt.KeyboardModifier.ShiftModifier and self.last_clicked_index != -1:
            start, end = min(index, self.last_clicked_index), max(index, self.last_clicked_index)
            for i in range(start, end + 1):
                if cb := all_widgets[i].findChild(QCheckBox):
                    cb.blockSignals(True)
                    cb.setChecked(state)
                    cb.blockSignals(False)
        elif modifiers == Qt.KeyboardModifier.ControlModifier:
            pass
        else:
            for i, widget in enumerate(all_widgets):
                if i != index:
                    if cb := widget.findChild(QCheckBox):
                        cb.blockSignals(True)
                        cb.setChecked(False)
                        cb.blockSignals(False)

        self.last_clicked_index = index
        self.update_status_label()

    def filter_app_list(self, text):
        search_term = text.lower()
        for widget in self.get_all_row_widgets():
            app_data = widget.findChild(QCheckBox).property("app_data")
            widget.setVisible(search_term in app_data['name'].lower() or search_term in app_data.get('publisher', '').lower())
        self.update_status_label()

    def update_status_label(self):
        visible_widgets = self.get_all_row_widgets(visible_only=True)
        selected_count = len(self.get_selected_apps_data())
        self.status_label.setText(self.t['status_text'].format(selected=selected_count, total=len(visible_widgets)))
        self.select_all_header_check.blockSignals(True)
        self.select_all_header_check.setChecked(len(visible_widgets) > 0 and selected_count == len(visible_widgets))
        self.select_all_header_check.blockSignals(False)

    def toggle_all_visible(self, checked):
        for widget in self.get_all_row_widgets(visible_only=True):
            if checkbox := widget.findChild(QCheckBox):
                checkbox.blockSignals(True)
                checkbox.setChecked(checked)
                checkbox.blockSignals(False)
        self.update_status_label()

    def get_all_row_widgets(self, visible_only=False):
        widgets = []
        for i in range(self.list_layout.count() - 1):
            widget = self.list_layout.itemAt(i).widget()
            if widget and widget.objectName() == "rowContainer":
                if not visible_only or (visible_only and widget.isVisible()):
                    widgets.append(widget)
        return widgets

    def get_selected_apps_data(self):
        return [w.findChild(QCheckBox).property("app_data") for w in self.get_all_row_widgets(visible_only=True) if (cb := w.findChild(QCheckBox)) and cb.isChecked()]

    def show_settings_dialog(self):
        dialog = SettingsDialog(self.config, self, lang=self.language, t=self.t)
        if dialog.exec(): self.config = dialog.get_settings(); self.save_config()

    def uninstall_selected(self):
        selected_apps = self.get_selected_apps_data()
        if not selected_apps: QMessageBox.warning(self, self.t['no_selection_title'], self.t['no_selection_body']); return
        if self.config.get("show_confirmation", True):
            if not ConfirmUninstallDialog(selected_apps, self, lang=self.language, t=self.t).exec(): return
        if self.config.get("silent_uninstall", True):
            if self.config.get("show_progress_dialog", True): self.run_silent_uninstall_dialog(selected_apps)
            else: self.run_silent_uninstall_button(selected_apps)
        else: self.run_interactive_uninstall(selected_apps)

    def run_silent_uninstall_dialog(self, apps):
        self.set_controls_enabled(False)
        self.progress_dialog = UninstallProgressDialog(apps, self, lang=self.language, t=self.t)
        self.uninstall_worker = UninstallWorker(apps)
        self.uninstall_worker.progress_updated.connect(self.progress_dialog.update_item_status)
        self.uninstall_worker.all_finished.connect(self.on_uninstall_finished)
        self.uninstall_worker.start()
        self.hide()
        self.progress_dialog.exec()

    def run_silent_uninstall_button(self, apps):
        self.set_controls_enabled(False)
        self.apps_to_uninstall, self.uninstalled_count, self.total_to_uninstall = apps, 0, len(apps)
        self.uninstall_worker = UninstallWorker(apps)
        self.uninstall_worker.progress_updated.connect(self.update_uninstall_button_progress)
        self.uninstall_worker.all_finished.connect(self.on_button_uninstall_finished)
        self.uninstall_worker.start()
        self.uninstall_button.setText(self.t['uninstall_progress_text'].format(done=0, total=self.total_to_uninstall))

    def update_uninstall_button_progress(self, item_name, status):
        if status in ["completed", "failed"]:
            self.uninstalled_count += 1
            self.uninstall_button.setText(self.t['uninstall_progress_text'].format(done=self.uninstalled_count, total=self.total_to_uninstall))

    def on_button_uninstall_finished(self):
        if self.config.get("show_notification", True): self.show_completion_notification(self.total_to_uninstall)
        self.set_controls_enabled(True)
        self.uninstall_button.setText(self.t['uninstall_btn'])
        self.start_scan()

    def run_interactive_uninstall(self, apps):
        for app in apps:
            try: subprocess.Popen(app['uninstall_string'], shell=True)
            except Exception as e: QMessageBox.critical(self, "Execution Error", f"Failed to run: {e}")
        self.start_scan()

    def on_uninstall_finished(self):
        if self.config.get("show_notification", True): self.show_completion_notification(len(self.progress_dialog.item_labels))
        self.set_controls_enabled(True)
        if hasattr(self, 'progress_dialog'):
            self.progress_dialog.all_done()
        self.start_scan()

    def set_controls_enabled(self, enabled):
        self.is_installing = not enabled
        self.search_input.setEnabled(enabled); self.settings_button.setEnabled(enabled); self.refresh_button.setEnabled(enabled)
        self.uninstall_button.setEnabled(enabled)
        if hasattr(self, 'header_buttons'):
            for btn in self.header_buttons.values():
                btn.setEnabled(enabled)
        if hasattr(self, 'select_all_header_check'):
            self.select_all_header_check.setEnabled(enabled)

    def apply_theme(self): self.setStyleSheet(get_uninstaller_style(self.theme))

    def _setup_tray_icon(self, icon_path):
        self.tray_icon = QSystemTrayIcon(self)
        if icon_path.exists(): self.tray_icon.setIcon(QIcon(str(icon_path)))
        tray_menu = QMenu(self)
        show_action = QAction("Show", self, triggered=self.show_window)
        quit_action = QAction("Quit", self, triggered=self.proper_quit)
        tray_menu.addAction(show_action); tray_menu.addAction(quit_action)
        self.tray_icon.setContextMenu(tray_menu); self.tray_icon.activated.connect(self.tray_icon_activated); self.tray_icon.show()

    def show_window(self): self.showNormal(); self.activateWindow()
    def tray_icon_activated(self, reason):
        if reason == QSystemTrayIcon.ActivationReason.DoubleClick: self.show_window()

    def show_completion_notification(self, count):
        self.tray_icon.showMessage(self.t['tray_uninstall_complete_title'], self.t['tray_uninstall_complete_body'].format(count=count), QSystemTrayIcon.MessageIcon.Information, 3000)

    def proper_quit(self):
        self.config['minimize_on_close'] = False
        self.close()

    def closeEvent(self, event: QCloseEvent):
        if self.is_installing:
            QMessageBox.warning(self, "Warning", "Cannot close while uninstalling.")
            event.ignore(); return

        self.tray_icon.hide()
        if self.launcher:
            self.launcher.show_launcher()
            self.launcher.uninstaller_window = None
        event.accept()
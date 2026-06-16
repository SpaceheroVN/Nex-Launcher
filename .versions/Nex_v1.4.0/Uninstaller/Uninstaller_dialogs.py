# Uninstaller/Uninstaller_dialogs.py
import subprocess
from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QPushButton, QDialogButtonBox,
    QCheckBox, QProgressBar, QGridLayout, QScrollArea, QWidget, QListWidget,
    QSizePolicy
)
from PyQt6.QtCore import Qt, QThread, pyqtSignal

class SettingsDialog(QDialog):
    def __init__(self, current_settings, parent=None, lang='EN', t=None):
        super().__init__(parent)
        self.t = t
        self.setWindowTitle(self.t['settings_title'])
        self.setMinimumWidth(400)

        layout = QVBoxLayout(self)

        self.silent_uninstall_check = QCheckBox(self.t['setting_silent_uninstall'])
        self.silent_uninstall_check.setChecked(current_settings.get("silent_uninstall", True))
        self.silent_uninstall_check.setToolTip(self.t['setting_silent_uninstall_tooltip'])
        layout.addWidget(self.silent_uninstall_check)

        self.show_confirmation_check = QCheckBox(self.t['setting_show_confirmation'])
        self.show_confirmation_check.setChecked(current_settings.get("show_confirmation", True))
        layout.addWidget(self.show_confirmation_check)

        self.show_progress_check = QCheckBox(self.t['setting_show_progress_dialog'])
        self.show_progress_check.setChecked(current_settings.get("show_progress_dialog", True))
        layout.addWidget(self.show_progress_check)

        self.notification_check = QCheckBox(self.t['setting_show_notification'])
        self.notification_check.setChecked(current_settings.get("show_notification", True))
        layout.addWidget(self.notification_check)

        self.minimize_on_close_check = QCheckBox(self.t['setting_minimize_on_close'])
        self.minimize_on_close_check.setChecked(current_settings.get("minimize_on_close", True))
        layout.addWidget(self.minimize_on_close_check)

        layout.addStretch()

        button_layout = QHBoxLayout()
        button_layout.addStretch()
        buttons = QDialogButtonBox(QDialogButtonBox.StandardButton.Ok | QDialogButtonBox.StandardButton.Cancel)
        buttons.button(QDialogButtonBox.StandardButton.Ok).setObjectName("acceptButton")
        buttons.button(QDialogButtonBox.StandardButton.Cancel).setObjectName("cancelButton")
        buttons.accepted.connect(self.accept)
        buttons.rejected.connect(self.reject)
        button_layout.addWidget(buttons)
        layout.addLayout(button_layout)

    def get_settings(self):
        return {
            "silent_uninstall": self.silent_uninstall_check.isChecked(),
            "show_confirmation": self.show_confirmation_check.isChecked(),
            "show_progress_dialog": self.show_progress_check.isChecked(),
            "show_notification": self.notification_check.isChecked(),
            "minimize_on_close": self.minimize_on_close_check.isChecked(),
        }

class ConfirmUninstallDialog(QDialog):
    def __init__(self, app_list, parent=None, lang='EN', t=None):
        super().__init__(parent)
        self.t = t
        self.setWindowTitle(self.t['confirm_uninstall_title'])
        self.setMinimumSize(450, 300)
        layout = QVBoxLayout(self)
        label = QLabel(self.t['confirm_uninstall_body_list'].format(count=len(app_list)))
        layout.addWidget(label)
        self.list_widget = QListWidget()
        for app in app_list: self.list_widget.addItem(app['name'])
        layout.addWidget(self.list_widget)
        buttons = QDialogButtonBox(QDialogButtonBox.StandardButton.Yes | QDialogButtonBox.StandardButton.No)
        yes_button = buttons.button(QDialogButtonBox.StandardButton.Yes)
        yes_button.setText(self.t['yes_btn']); yes_button.setObjectName("uninstallButton")
        no_button = buttons.button(QDialogButtonBox.StandardButton.No)
        no_button.setText(self.t['no_btn']); no_button.setObjectName("cancelButton")
        buttons.accepted.connect(self.accept); buttons.rejected.connect(self.reject)
        layout.addWidget(buttons)

class UninstallWorker(QThread):
    progress_updated = pyqtSignal(str, str)
    all_finished = pyqtSignal()

    def __init__(self, apps_to_uninstall):
        super().__init__()
        self.apps = apps_to_uninstall
        self.is_cancelled = False

    def run(self):
        for app in self.apps:
            if self.is_cancelled: break
            name = app['name']
            final_cmd = ""

            if app.get("app_type") == "uwp":
                package_full_name = app.get("uninstall_string")
                final_cmd = f'powershell.exe -ExecutionPolicy Bypass -NoProfile -Command "Remove-AppxPackage -Package \'{package_full_name}\' -AllUsers"'
            else:
                if app.get('quiet_uninstall_string'):
                    final_cmd = app['quiet_uninstall_string']
                else:
                    uninstall_cmd = app['uninstall_string']
                    if 'msiexec' in uninstall_cmd.lower():
                        final_cmd = uninstall_cmd + ' /qn /norestart'
                    else:
                        base_cmd = uninstall_cmd.split('.exe')[0] + '.exe' if '.exe' in uninstall_cmd else uninstall_cmd
                        final_cmd = f'"{base_cmd.strip()}" /S /silent /verysilent /quiet /norestart'

            try:
                self.progress_updated.emit(name, "uninstalling")
                process = subprocess.Popen(final_cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, creationflags=subprocess.CREATE_NO_WINDOW)
                stdout, stderr = process.communicate(timeout=600)

                if process.returncode in [0, 3010]:
                    self.progress_updated.emit(name, "completed")
                else:
                    self.progress_updated.emit(name, "failed")
            except Exception:
                self.progress_updated.emit(name, "failed")
        self.all_finished.emit()

    def cancel(self): self.is_cancelled = True

class UninstallProgressDialog(QDialog):
    def __init__(self, items, parent=None, lang='EN', t=None):
        super().__init__(parent)
        self.t = t
        self.setWindowTitle(self.t['progress_title'])
        self.setModal(True)
        self.setWindowFlags(self.windowFlags() | Qt.WindowType.WindowStaysOnTopHint)
        self.item_labels = {}
        self.setMinimumWidth(600)
        self.setSizePolicy(QSizePolicy.Policy.Preferred, QSizePolicy.Policy.MinimumExpanding)
        main_layout = QVBoxLayout(self); main_layout.setContentsMargins(10, 10, 10, 10); main_layout.setSpacing(10)
        scroll_area = QScrollArea(); scroll_area.setWidgetResizable(True); scroll_area.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        container = QWidget(); self.grid_layout = QGridLayout(container); self.grid_layout.setColumnStretch(0, 1); self.grid_layout.setSpacing(5)
        scroll_area.setWidget(container); main_layout.addWidget(scroll_area)
        bottom_layout = QHBoxLayout()
        self.overall_progress = QProgressBar(); self.overall_progress.setMaximum(len(items)); self.overall_progress.setValue(0); self.overall_progress.setTextVisible(True)
        self.overall_progress.setFormat(f"%v/%m - {self.t['progress_overall_text']}")
        bottom_layout.addWidget(self.overall_progress)
        self.close_button = QPushButton(self.t['close_btn']); self.close_button.setObjectName("acceptButton"); self.close_button.clicked.connect(self.accept)
        self.close_button.setEnabled(False); bottom_layout.addWidget(self.close_button)
        main_layout.addLayout(bottom_layout)
        self.setup_items(items)

    def setup_items(self, items):
        num_items = len(items)
        for i, item in enumerate(items):
            name, status_label = item.get('name', 'Unknown'), QLabel(self.t['progress_status_waiting'])
            status_label.setProperty("status", "waiting")
            self.grid_layout.addWidget(QLabel(name), i, 0)
            self.grid_layout.addWidget(status_label, i, 1, Qt.AlignmentFlag.AlignRight)
            self.item_labels[name] = status_label
        self.setFixedSize(self.width(), 100 + (min(num_items, 5) * 35))

    def update_item_status(self, item_name, status):
        if item_name not in self.item_labels: return
        status_label = self.item_labels[item_name]
        status_label.setProperty("status", status)
        status_text_map = {"uninstalling": self.t['progress_status_uninstalling'], "completed": self.t['progress_status_completed'], "failed": self.t['progress_status_failed']}
        status_label.setText(status_text_map.get(status, "Unknown"))
        status_label.style().unpolish(status_label); status_label.style().polish(status_label)
        if status in ["completed", "failed"]: self.update_overall_progress(self.overall_progress.value() + 1)

    def update_overall_progress(self, value): self.overall_progress.setValue(value)

    def all_done(self):
        self.setWindowTitle(self.t['progress_title_done'])
        self.close_button.setEnabled(True); self.close_button.setFocus()

    def accept(self):
        if self.parent(): self.parent().show_window()
        super().accept()
# Uninstaller/Uninstaller_config.py
TRANSLATIONS = {
    'Uninstaller': {
        'VN': {
            'window_title': "NEX - Trình Gỡ Cài Đặt",
            'refresh_btn': "Làm mới",
            'uninstall_btn': "Gỡ Cài Đặt",
            'no_apps_found_body': "Không tìm thấy ứng dụng nào.",
            'loading_text': "Đang quét các phần mềm đã cài đặt, vui lòng đợi...",
            'search_placeholder': "Tìm kiếm theo tên hoặc nhà phát hành...",
            'header_name': "Tên ứng dụng",
            'header_publisher': "Nhà phát hành",
            'header_date': "Ngày cài đặt",
            'header_size': "Kích thước",
            'header_select_all_tooltip': "Chọn/Bỏ chọn tất cả các mục đang hiển thị",
            'status_text': "{selected} / {total} đã chọn",
            'no_selection_title': "Chưa chọn mục",
            'no_selection_body': "Vui lòng chọn ít nhất một phần mềm để gỡ.",
            'confirm_uninstall_title': "Xác nhận Gỡ Cài đặt",
            'confirm_uninstall_body_list': "Bạn có chắc chắn muốn gỡ {count} phần mềm sau đây không?",
            'yes_btn': "Gỡ bỏ",
            'no_btn': "Hủy",
            'settings_title': "Cài đặt Trình gỡ bỏ",
            'setting_silent_uninstall': "Sử dụng chế độ gỡ cài đặt ẩn",
            'setting_silent_uninstall_tooltip': "Tự động gỡ cài đặt mà không cần tương tác.",
            'setting_show_confirmation': "Hiển thị hộp thoại xác nhận trước khi gỡ",
            'setting_show_progress_dialog': "Hiển thị hộp thoại tiến trình chi tiết",
            'setting_show_notification': "Hiển thị thông báo hệ thống sau khi hoàn tất",
            'setting_minimize_on_close': "Thu nhỏ về khay hệ thống khi đóng",
            'progress_title': "Tiến trình Gỡ Cài đặt",
            'progress_title_done': "Gỡ Cài đặt Hoàn tất",
            'progress_overall_text': "Tiến độ Tổng thể",
            'progress_status_waiting': "Đang chờ...",
            'progress_status_uninstalling': "Đang gỡ cài đặt...",
            'progress_status_completed': "Hoàn thành",
            'progress_status_failed': "Thất bại",
            'close_btn': "Đóng",
            'uninstall_progress_text': "Đang gỡ: {done}/{total}...",
            'tray_uninstall_complete_title': "Gỡ Cài đặt Hoàn tất",
            'tray_uninstall_complete_body': "Đã xử lý xong {count} ứng dụng.",
        },
        'EN': {
            'window_title': "NEX - Uninstaller",
            'refresh_btn': "Refresh",
            'uninstall_btn': "Uninstall",
            'no_apps_found_body': "No applications found.",
            'loading_text': "Scanning for installed applications, please wait...",
            'search_placeholder': "Search by name or publisher...",
            'header_name': "Application Name",
            'header_publisher': "Publisher",
            'header_date': "Install Date",
            'header_size': "Size",
            'header_select_all_tooltip': "Select/Deselect all visible items",
            'status_text': "{selected} / {total} selected",
            'no_selection_title': "No Selection",
            'no_selection_body': "Please select at least one software to uninstall.",
            'confirm_uninstall_title': "Confirm Uninstall",
            'confirm_uninstall_body_list': "Are you sure you want to uninstall the following {count} applications?",
            'yes_btn': "Uninstall",
            'no_btn': "Cancel",
            'settings_title': "Uninstaller Settings",
            'setting_silent_uninstall': "Use silent uninstall mode",
            'setting_silent_uninstall_tooltip': "Automatically uninstall without user interaction.",
            'setting_show_confirmation': "Show confirmation dialog before uninstalling",
            'setting_show_progress_dialog': "Show detailed progress dialog",
            'setting_show_notification': "Show system notification upon completion",
            'setting_minimize_on_close': "Minimize to system tray on close",
            'progress_title': "Uninstallation Progress",
            'progress_title_done': "Uninstallation Finished",
            'progress_overall_text': "Overall Progress",
            'progress_status_waiting': "Waiting...",
            'progress_status_uninstalling': "Uninstalling...",
            'progress_status_completed': "Completed",
            'progress_status_failed': "Failed",
            'close_btn': "Close",
            'uninstall_progress_text': "Uninstalling: {done}/{total}...",
            'tray_uninstall_complete_title': "Uninstallation Complete",
            'tray_uninstall_complete_body': "Finished processing {count} application(s).",
        }
    }
}

def get_theme_colors(theme_name: str) -> dict:
    if theme_name == "Light":
        return {
            "window_bg": "#f3f3f3", "text_color": "#000000", "primary_color": "#c9302c",
            "primary_hover_bg": "#ac2925",
            "primary_text": "#ffffff", "hover_bg": "#e5f1fb",
            "border_color": "#cccccc", "input_bg": "#ffffff", "container_bg": "#ffffff",
            "container_border": "#dcdcdc", "header_bg": "#f0f0f0", "button_bg": "#e1e1e1",
            "button_border": "#adadad", "scroll_bg": "#f0f0f0", "scroll_handle": "#cccccc",
            "scroll_handle_hover": "#bbbbbb", "row_hover_bg": "#f5e7e6", "row_hover_border": "#c9302c",
            "status_uninstalling": "#0078d7", "status_completed": "#28a745",
            "status_failed": "#c9302c", "status_waiting": "#888888", "header_text": "#333333",
            "header_hover_bg": "#e0e0e0"
        }
    else: # Dark
        return {
            "window_bg": "#202020", "text_color": "#e0e0e0", "primary_color": "#e06c75",
            "primary_hover_bg": "#be5046",
            "primary_text": "#ffffff", "hover_bg": "#4a4a4a",
            "border_color": "#5a5a5a", "input_bg": "#2d2d2d", "container_bg": "#282c34",
            "container_border": "#3c3c3c", "header_bg": "#2c313a", "button_bg": "#383838",
            "button_border": "#5a5a5a", "scroll_bg": "#202020", "scroll_handle": "#4a4a4a",
            "scroll_handle_hover": "#5a5a5a", "row_hover_bg": "#4b3a3a", "row_hover_border": "#e06c75",
            "status_uninstalling": "#61afef", "status_completed": "#5cb85c",
            "status_failed": "#e06c75", "status_waiting": "#888888", "header_text": "#d0d0d0",
            "header_hover_bg": "#3a3f4b"
        }

def get_base_style() -> str:
    return """
        * { outline: none; }
        QCheckBox { spacing: 5px; padding-top: 2px;}
        QCheckBox::indicator { width: 15px; height: 15px; border-radius: 4px; }
        QScrollArea { border: none; }
    """

def get_scrollbar_style(c: dict) -> str:
    return f"""
        QScrollBar:vertical {{
            border: none; background: {c['scroll_bg']}; width: 12px; margin: 0px;
        }}
        QScrollBar::handle:vertical {{
            background: {c['scroll_handle']}; min-height: 25px; border-radius: 6px;
        }}
        QScrollBar::handle:vertical:hover {{ background: {c['scroll_handle_hover']}; }}
        QScrollBar::handle:vertical:pressed {{ background: {c['primary_hover_bg']}; }}
    """

def get_uninstaller_style(theme_name: str) -> str:
    c = get_theme_colors(theme_name)
    base_style = get_base_style()
    scrollbar_style = get_scrollbar_style(c)
    fix_style = "QWidget#rowContainer > QLabel, QWidget#headerContainer > QPushButton { background-color: transparent; }"

    specific_styles = f"""
        QLabel, QPushButton {{ background-color: transparent; }}
        QLabel#appIconLabel {{ min-width: 32px; max-width: 32px; }}
        QLabel#nameLabel {{ font-weight: bold; font-size: 11pt; color: {c['text_color']}; }}
        QLabel#publisherLabel, QLabel#dateLabel, QLabel#sizeLabel, QLabel#statusLabel {{ font-size: 10pt; color: {'#555' if theme_name == 'Light' else '#a0a0a0'}; }}
        
        QWidget#headerContainer {{ background-color: {c['header_bg']}; border-bottom: 2px solid {c['container_border']}; }}
        QPushButton#headerButton {{ 
            font-weight: bold; color: {c['header_text']}; padding: 8px 5px; 
            border: none; text-align: left;
        }}
        QPushButton#headerButton:hover {{ background-color: {c['header_hover_bg']}; }}
        
        QCheckBox#selectAllHeaderCheckbox {{ padding-left: 13px; }}
        QCheckBox#rowCheckbox {{ margin-left: 2px; }}

        QLineEdit#searchInput {{
            min-height: 32px; padding-left: 10px; background: {c['input_bg']}; color: {c['text_color']};
            border: 1px solid {c['border_color']}; border-radius: 5px; font-size: 10pt;
        }}
        QPushButton#settingsButton {{ 
            padding: 0; 
            border: 1px solid {c['button_border']}; 
            background-color: {c['button_bg']};
            border-radius: 5px;
        }}
        QPushButton#settingsButton:hover {{
            background-color: {c['hover_bg']}; 
            border-color: {c['border_color']};
        }}
        
        QLabel[status="waiting"] {{ color: {c['status_waiting']}; }}
        QLabel[status="uninstalling"] {{ color: {c['status_uninstalling']}; font-weight: bold; }}
        QLabel[status="completed"] {{ color: {c['status_completed']}; font-weight: bold; }}
        QLabel[status="failed"] {{ color: {c['status_failed']}; font-weight: bold; }}
    """

    return f"""
        {base_style} {scrollbar_style} {fix_style} {specific_styles}
        QMainWindow, QWidget, QDialog {{ background-color: {c['window_bg']}; color: {c['text_color']}; }}
        QScrollArea#contentScroll {{ border: 1px solid {c['container_border']}; background-color: {c['container_bg']}; border-radius: 8px; }}
        QWidget#list_container {{ background-color: {c['container_bg']}; }}
        QPushButton {{
            border-radius: 5px; border: 1px solid {c['button_border']}; background-color: {c['button_bg']};
            color: {c['text_color']}; padding: 8px 20px; font-size: 10pt; font-weight: bold;
        }}
        QPushButton:hover {{ background-color: {c['hover_bg']}; border: 1px solid {c['border_color']};}}
        QPushButton:disabled {{
            background-color: {'#e0e0e0' if theme_name == 'Light' else '#383838'}; color: {'#a0a0a0' if theme_name == 'Light' else '#888'};
            border-color: {'#c0c0c0' if theme_name == 'Light' else '#505050'};
        }}
        #uninstallButton, #acceptButton, QPushButton#yesButton {{ 
            background-color: {c['primary_color']}; 
            border-color: {c['primary_color']}; 
            color: {c['primary_text']}; 
        }}
        #uninstallButton:hover, #acceptButton:hover, QPushButton#yesButton:hover {{ background-color: {c['primary_hover_bg']}; }}
        QWidget#rowContainer {{ border-left: 3px solid transparent; padding: 2px 0; }}
        QWidget[rowType="odd"] {{ background-color: {c['container_bg']}; }}
        QWidget[rowType="even"] {{ background-color: {c['scroll_bg']}; }}
        QWidget#rowContainer:hover {{ background-color: {c['row_hover_bg']}; border-left: 3px solid {c['row_hover_border']}; }}
        QCheckBox::indicator {{ background: {c['input_bg']}; border: 1px solid {c['button_border']}; }}
        QCheckBox::indicator:hover {{ border-color: {c['primary_color']}; }}
        QCheckBox::indicator:checked {{ background: {c['primary_color']}; border: 1px solid {c['primary_hover_bg']}; }}
        QProgressBar {{ border: 1px solid {c['border_color']}; border-radius: 5px; text-align: center; color: {c['text_color']}; }}
        QProgressBar::chunk {{ background-color: {c['primary_color']}; border-radius: 4px; }}
        
        QPushButton#cancelButton {{
            background-color: {c['button_bg']}; border-color: {c['button_border']};
            min-width: 80px; min-height: 28px; padding: 5px 10px; font-weight: normal;
        }}
        QPushButton#cancelButton:hover {{ background-color: {c['hover_bg']}; }}
    """
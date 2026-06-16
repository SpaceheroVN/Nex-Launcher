# Installer/Installer_config.py
TRANSLATIONS = {
    'Installer_Categories': {
        'EN': {
            "Web Browsers": "app", "Compression": "app", "Developer Tools": "app",
            "Messaging": "app", "Imaging": "app", "Media": "app", "Security": "app",
            "Utilities": "app", "VC++ Redistributables": "app", ".NET": "app",
            "Games": "game"
        },
        'VN': {
            "Trình duyệt Web": "app", "Nén & Giải nén": "app", "Công cụ Lập trình": "app",
            "Nhắn tin": "app", "Xử lý Ảnh": "app", "Nghe nhạc & Xem phim": "app", "Bảo mật": "app",
            "Tiện ích": "app", "VC++ Redistributables": "app", ".NET": "app",
            "Trò chơi": "game"
        }
    },
    'Installer': {
        'EN': {
            'window_title': "NEX - Application Installer",
            'repo_ask_title': "Welcome!", 'repo_ask_body': "This seems to be your first time running the application.\nWould you like to download a basic list of common software?",
            'repo_ok_title': "Success", 'repo_ok_body': "Successfully downloaded and added {count} items.",
            'repo_err_title': "Error", 'repo_err_net_body': "Could not connect to the online repository.\nPlease check your internet connection.\nError: {e}",
            'repo_err_json_body': "Data from the online repository is corrupted or incorrectly formatted.",
            'tab_all': "All", 'tab_apps': "Apps", 'tab_games': "Games",
            'search_placeholder': "Enter name to search...",
            'search_btn': "Search...", 'search_dialog_title': "Search Software", 'keep_text_check': "Keep text after searching",
            'install_from_label': "Install from:",
            'install_from_combo_current': "Current Tab", 'install_from_combo_all': "All", 'install_from_combo_apps': "Apps", 'install_from_combo_games': "Games",
            'export_btn': "Export", 'import_btn': "Import", 'install_btn': "Install",
            'tray_tooltip': "NEX Installer", 'tray_main_screen': "Main screen", 'tray_escape': "Quit NEX",
            'tray_running_title': "Running in background", 'tray_running_msg': "NEX Installer is still running. Click the tray icon to reopen.",
            'settings_title': "Settings", 'theme_label': "Theme:", 'language_label': "Language:",
            'show_progress_check': "Show installation progress dialog", 'auto_select_check': "Auto-select item upon creation",
            'auto_minimize_tray_check': "Automatically minimize to system tray", 'add_item_title': "Add New Item",
            'item_name_label': "Item Name:", 'item_name_placeholder': "e.g., Google Chrome", 'item_type_label': "Item Type:",
            'item_type_app': "Application", 'item_type_game': "Game", 'msg_no_selection_title': "No Selection",
            'msg_no_selection_body': "Please select items to install/remove.", 'msg_confirm_delete_title': "Confirm Deletion",
            'msg_confirm_delete_body': "Are you sure you want to remove {count} selected item(s)?",
            'msg_install_complete_title': "Installation Complete", 'msg_install_complete_body': "Successfully processed {count} application(s).",
            'msg_error_title': "Error", 'msg_error_body': "An error occurred with {name}.\nError: {error}",
            'source_value_label': "Path / Link:", 'silent_args_label': "Silent Install Arguments:", 'silent_args_placeholder': "e.g., /quiet /norestart",
            'package_browse_btn': "Browse...",
            'edit_source_title': "Edit {source_type} Source",
            'silent_args_select_btn': "Options...", 'silent_args_help_title': "Silent Argument Help",
            'silent_args_help_body_rich': """
<h3>Installer Types</h3>
<p>Different installers use different commands for silent installation.</p>
<h4><b>MSI (Windows Installer)</b></h4>
<p><i>(e.g., Python, .NET Runtimes)</i></p>
<ul>
  <li><code>/quiet</code>, <code>/qn</code> : Completely silent installation.</li>
  <li><code>/passive</code> : Shows a progress bar but no user interaction.</li>
</ul>
<h4><b>Inno Setup</b></h4>
<p><i>(e.g., GIMP, OBS Studio, VS Code)</i></p>
<ul>
  <li><code>/silent</code>, <code>/verysilent</code> : Standard silent installation.</li>
  <li><code>/SP-</code> : Disables the "This will install... Do you wish to continue?" prompt at the beginning of the setup.</li>
</ul>
<h4><b>NSIS (Nullsoft)</b></h4>
<p><i>(e.g., FileZilla, Winamp, most portable apps)</i></p>
<ul>
  <li><code>/S</code> : (<b>Case-sensitive</b> 'S') for silent install.</li>
  <li><code>/s</code> : (Lowercase 's') may also work on some installers.</li>
</ul>
<h4><b>Common Modifiers</b></h4>
<p>These can often be combined with the main commands.</p>
<ul>
  <li><code>/norestart</code> : Prevents the computer from restarting after installation.</li>
  <li><code>/SUPPRESSMSGBOXES</code> : Suppresses most pop-up message boxes during installation.</li>
</ul>
<p><i><b>Tip:</b> Always check the software's official documentation for the most accurate arguments.</i></p>
            """,
            'msg_invalid_link_title': "Invalid Link", 'msg_invalid_link_body': "The provided URL is not valid. Please ensure it starts with http:// or https://",
            'select_all_btn': "Select All", 'deselect_all_btn': "Deselect All",
            'show_system_notifications_check': "Show all system notifications (tray icon)",
            'detailed_categories_check': "Use detailed categories for applications", 'item_category_label': "Item Category:",
            'progress_title': "Installation Progress", 'progress_title_done': "Installation Finished",
            'progress_overall_text': "Overall Progress", 'progress_status_waiting': "Waiting...",
            'progress_status_downloading': "Downloading ({percent}%)",
            'progress_status_installing': "Installing...",
            'progress_status_completed': "Completed", 'progress_status_failed': "Failed",
            'progress_status_retrying': "Retrying (attempt {attempt})...",
            'progress_status_final_failure': "Failure",
            'msg_final_failure_tooltip': "Failed after {count} retries. Please try installing this item individually.",
            'close_btn': "Close",
            'winget_title': "Search Winget Packages", 'source_type_label': 'Source Type:',
            'msg_input_error_title': 'Input Error', 'msg_name_empty_body': "Item name cannot be empty.",
            'source_value_empty': "Source value cannot be empty.", 'about_btn': "About...",
            'about_title': "About Application Installer", 'about_version': "1.5",
            'about_author': "Author: SpaceheroVN",
            'about_github': '<a style="color: #0078d7;" href="https://github.com/SpaceheroVN/NEX/releases/">Source Code on GitHub</a>',
        },
        'VN': {
            'window_title': "NEX - Trình Cài Đặt Ứng Dụng",
            'repo_ask_title': "Chào mừng!", 'repo_ask_body': "Đây có vẻ là lần đầu bạn chạy ứng dụng.\nBạn có muốn tải về danh sách các phần mềm thông dụng không?",
            'repo_ok_title': "Thành công", 'repo_ok_body': "Đã tải về và thêm thành công {count} mục.",
            'repo_err_title': "Lỗi", 'repo_err_net_body': "Không thể kết nối tới kho lưu trữ trực tuyến.\nVui lòng kiểm tra kết nối mạng.\nLỗi: {e}",
            'repo_err_json_body': "Dữ liệu từ kho lưu trữ bị lỗi hoặc sai định dạng.",
            'tab_all': "Tất Cả", 'tab_apps': "Ứng Dụng", 'tab_games': "Trò Chơi",
            'search_placeholder': "Nhập tên để tìm...",
            'search_btn': "Tìm kiếm...", 'search_dialog_title': "Tìm kiếm Phần mềm", 'keep_text_check': "Giữ văn bản sau tìm",
            'install_from_label': "Cài đặt từ:",
            'install_from_combo_current': "Tab hiện tại", 'install_from_combo_all': "Tất cả các tab", 'install_from_combo_apps': "Chỉ ứng dụng", 'install_from_combo_games': "Chỉ trò chơi",
            'export_btn': "Xuất...", 'import_btn': "Nhập...", 'install_btn': "Cài Đặt",
            'tray_tooltip': "NEX Installer", 'tray_main_screen': "Hiển thị cửa sổ chính", 'tray_escape': "Thoát NEX",
            'tray_running_title': "Đang chạy nền", 'tray_running_msg': "NEX Installer vẫn đang chạy. Nhấn vào biểu tượng để mở lại.",
            'settings_title': "Cài Đặt", 'theme_label': "Giao diện:", 'language_label': "Ngôn ngữ:",
            'show_progress_check': "Hiển thị hộp thoại tiến trình cài đặt", 'auto_select_check': "Tự động chọn mục vừa tạo",
            'auto_minimize_tray_check': "Thu về khay hệ thống khi đóng", 'add_item_title': "Thêm Mục Mới",
            'item_name_label': "Tên mục:", 'item_name_placeholder': "Ví dụ: Google Chrome",
            'item_type_label': "Loại mục:", 'item_type_app': "Ứng dụng", 'item_type_game': "Trò chơi",
            'source_value_label': "Đường dẫn / Link:", 'silent_args_label': "Tham số cài đặt ẩn:", 'silent_args_placeholder': "Ví dụ: /quiet /norestart",
            'package_browse_btn': "Duyệt...",
            'edit_source_title': "Chỉnh sửa Nguồn {source_type}",
            'silent_args_select_btn': "Tùy chọn...", 'silent_args_help_title': "Trợ giúp Tham số Ẩn",
            'silent_args_help_body_rich': """
<h3>Các loại trình cài đặt</h3>
<p>Những trình cài đặt khác nhau sẽ sử dụng các câu lệnh khác nhau để cài đặt ẩn.</p>
<h4><b>MSI (Windows Installer)</b></h4>
<p><i>(VD: Python, .NET Runtimes)</i></p>
<ul>
  <li><code>/quiet</code>, <code>/qn</code> : Cài đặt hoàn toàn yên lặng.</li>
  <li><code>/passive</code> : Chỉ hiển thị thanh tiến trình, không cần tương tác.</li>
</ul>
<h4><b>Inno Setup</b></h4>
<p><i>(VD: GIMP, OBS Studio, VS Code)</i></p>
<ul>
  <li><code>/silent</code>, <code>/verysilent</code> : Cài đặt ẩn tiêu chuẩn.</li>
  <li><code>/SP-</code> : Tắt hộp thoại hỏi "Bạn có muốn tiếp tục?" lúc bắt đầu.</li>
</ul>
<h4><b>NSIS (Nullsoft)</b></h4>
<p><i>(VD: FileZilla, Winamp, hầu hết ứng dụng portable)</i></p>
<ul>
  <li><code>/S</code> : (Chữ 'S' <b>phân biệt hoa/thường</b>) để cài đặt ẩn.</li>
  <li><code>/s</code> : (Chữ 's' thường) cũng có thể hoạt động trên một số trình cài đặt.</li>
</ul>
<h4><b>Các tham số bổ sung</b></h4>
<p>Thường có thể được kết hợp với các lệnh chính.</p>
<ul>
  <li><code>/norestart</code> : Ngăn máy tính khởi động lại sau khi cài.</li>
  <li><code>/SUPPRESSMSGBOXES</code> : Tắt hầu hết các hộp thoại thông báo.</li>
</ul>
<p><i><b>Mẹo:</b> Luôn kiểm tra tài liệu chính thức của phần mềm để có tham số chính xác nhất.</i></p>
            """,
            'msg_invalid_link_title': "Link không hợp lệ", 'msg_invalid_link_body': "URL bạn cung cấp không hợp lệ. Vui lòng đảm bảo nó bắt đầu bằng http:// hoặc https://",
            'msg_no_selection_title': "Chưa chọn mục", 'msg_no_selection_body': "Vui lòng chọn ít nhất một mục để thực hiện.",
            'msg_confirm_delete_title': "Xác nhận Xóa", 'msg_confirm_delete_body': "Bạn có chắc chắn muốn xóa {count} mục đã chọn?",
            'msg_install_complete_title': "Cài đặt Hoàn tất", 'msg_install_complete_body': "Đã xử lý thành công {count} mục.",
            'msg_error_title': "Đã xảy ra lỗi", 'msg_error_body': "Có lỗi xảy ra với mục '{name}'.\nChi tiết: {error}",
            'select_all_btn': "Chọn Tất Cả", 'deselect_all_btn': "Bỏ Chọn Tất Cả",
            'show_system_notifications_check': "Hiển thị tất cả thông báo hệ thống (khay)",
            'detailed_categories_check': "Sử dụng danh mục chi tiết cho ứng dụng", 'item_category_label': "Danh mục:",
            'progress_title': "Tiến trình Cài đặt", 'progress_title_done': "Cài đặt Hoàn tất",
            'progress_overall_text': "Tiến độ Tổng thể", 'progress_status_waiting': "Đang chờ...",
            'progress_status_downloading': "Đang tải ({percent}%)",
            'progress_status_installing': "Đang cài đặt...",
            'progress_status_completed': "Hoàn thành", 'progress_status_failed': "Thất bại",
            'progress_status_retrying': "Đang thử lại (lần {attempt})...",
            'progress_status_final_failure': "Thất bại",
            'msg_final_failure_tooltip': "Thất bại sau {count} lần thử lại. Vui lòng cài đặt riêng mục này.",
            'close_btn': "Đóng",
            'winget_title': "Tìm gói trên Winget", 'source_type_label': 'Loại nguồn:',
            'msg_input_error_title': 'Lỗi Nhập liệu', 'msg_name_empty_body': "Tên mục không được để trống.",
            'source_value_empty': "Giá trị nguồn không được để trống.", 'about_btn': "Giới thiệu...",
            'about_title': "Giới thiệu Trình Cài Đặt", 'about_version': "1.5",
            'about_author': "Tác giả: SpaceheroVN",
            'about_github': '<a style="color: #0078d7;" href="https://github.com/SpaceheroVN/NEX/releases/">Mã nguồn trên GitHub</a>',
        }
    }
}
def get_theme_colors(theme_name: str) -> dict:
    if theme_name == "Light":
        return {
            "window_bg": "#f3f3f3", "text_color": "#000000", "primary_color": "#0078d7",
            "primary_hover_bg": "#108ee9",
            "primary_text": "#ffffff", "colored_button_text": "#ffffff", "hover_bg": "#e5f1fb",
            "border_color": "#cccccc", "input_bg": "#ffffff", "container_bg": "#ffffff",
            "container_border": "#dcdcdc", "header_color": "#0078d7", "button_bg": "#e1e1e1",
            "button_border": "#adadad", "scroll_bg": "#f0f0f0", "scroll_handle": "#cccccc",
            "scroll_handle_hover": "#bbbbbb", "row_hover_bg": "#ddeeff", "row_hover_border": "#0078d7",
            "grid_item_bg": "#ffffff", "grid_item_border": "#dcdcdc", "grid_item_hover_bg": "#eaf3fc",
            "grid_item_hover_border": "#0078d7", "help_button_bg": "#eaf3fc", "help_button_text": "#005a9e",
            "help_button_hover_bg": "#0078d7", "help_button_hover_text": "#ffffff",
            "status_downloading": "#e69b00", "status_installing": "#0078d7", "status_completed": "#28a745",
            "status_failed": "#d9534f", "status_waiting": "#888888",
        }
    else:
        return {
            "window_bg": "#202020", "text_color": "#e0e0e0", "primary_color": "#0078d7",
            "primary_hover_bg": "#108ee9",
            "primary_text": "#ffffff", "colored_button_text": "#ffffff", "hover_bg": "#4a4a4a",
            "border_color": "#5a5a5a", "input_bg": "#2d2d2d", "container_bg": "#282c34",
            "container_border": "#3c3c3c", "header_color": "#0078d7", "button_bg": "#383838",
            "button_border": "#5a5a5a", "scroll_bg": "#202020", "scroll_handle": "#4a4a4a",
            "scroll_handle_hover": "#5a5a5a", "row_hover_bg": "#3a3f4b", "row_hover_border": "#0078d7",
            "grid_item_bg": "#2c313a", "grid_item_border": "#4a515e", "grid_item_hover_bg": "#3a3f4b",
            "grid_item_hover_border": "#0078d7", "help_button_bg": "#3a3f4b", "help_button_text": "#005a9e",
            "help_button_hover_bg": "#0078d7", "help_button_hover_text": "#282c34",
            "status_downloading": "#f0ad4e", "status_installing": "#0078d7", "status_completed": "#5cb85c",
            "status_failed": "#e06c75", "status_waiting": "#888888",
        }

def get_base_style() -> str:
    return """
        * { outline: none; }
        QPushButton::menu-indicator, QComboBox::down-arrow { image: none; width: 0px; }
        QComboBox::drop-down { border: none; }
        QCheckBox { spacing: 5px; }
        QCheckBox::indicator { width: 15px; height: 15px; border-radius: 4px; }
        QScrollArea { border: none; }
        QFrame#separatorLine { background-color: #e0e0e0; }
        QDialog QFrame#separatorLine { background-color: #dcdcdc; }
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
        QScrollBar::handle:vertical:pressed {{ background: {c['primary_color']}; }}
        QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {{ height: 0px; }}
        QScrollBar::add-page:vertical, QScrollBar::sub-page:vertical {{ background: none; }}
    """

def get_installer_style(theme_name: str) -> str:
    c = get_theme_colors(theme_name)
    base_style = get_base_style()
    scrollbar_style = get_scrollbar_style(c)
    dark_specific = "QFrame#separatorLine { background-color: #3c3c3c; }" if theme_name == "Dark" else ""
    fix_style = "QWidget#rowContainer > *, QWidget#gridItem > * { background-color: transparent; }"

    return f"""
        {base_style} {scrollbar_style} {fix_style} {dark_specific}
        QMainWindow, QWidget, QDialog {{ background-color: {c['window_bg']}; }}
        QLabel, QCheckBox, QTabBar::tab {{ color: {c['text_color']}; }}
        QPushButton#installBtn, QPushButton#acceptButton {{
            background-color: {c['primary_color']};
            color: {c['primary_text']};
            border: 1px solid {c['primary_color']};
            border-radius: 5px;
            font-weight: bold;
        }}
        QPushButton#installBtn:hover, QPushButton#acceptButton:hover {{
            background-color: {c['primary_hover_bg']};
            border-color: {c['primary_color']};
        }}
        QPushButton#installBtn {{ padding: 8px 20px; }}
        QPushButton#acceptButton {{ min-width: 80px; min-height: 28px; padding: 5px 10px; }}
        QLineEdit, QComboBox {{
            min-height: 30px; padding-left: 5px; background: {c['input_bg']};
            color: {c['text_color']}; border: 1px solid {c['border_color']}; border-radius: 5px;
        }}
        QComboBox QAbstractItemView {{
            background-color: {c['input_bg']}; color: {c['text_color']};
            selection-background-color: {c['primary_color']}; border: 1px solid {c['border_color']};
        }}
        QPushButton {{
            border-radius: 5px; border: 1px solid {c['button_border']}; background-color: {c['button_bg']};
            color: {c['text_color']}; padding: 8px 15px; font-weight: bold;
        }}
        QPushButton:hover {{ background-color: {c['hover_bg']}; border: 1px solid {c['primary_color']}; }}
        QPushButton#exportBtn, QPushButton#importBtn {{
            color: {c['colored_button_text']}; border: none; font-weight: bold; padding: 8px 20px;
        }}
        QPushButton#exportBtn {{ background: #c05000; }} QPushButton#exportBtn:hover {{ background: #d06000; }}
        QPushButton#importBtn {{ background: #008040; }} QPushButton#importBtn:hover {{ background: #009050; }}
        QPushButton#settingsButton {{ padding: 0; }}
        QPushButton#actionButton {{ font-size: 15px; font-weight: bold; min-width: 10px; min-height: 10px; }}
        QPushButton#browseButton, QPushButton#searchButton {{ min-height: 10px; }}
        QPushButton#cancelButton {{
            min-width: 80px; min-height: 28px; font-weight: normal;
            background-color: {c['button_bg']}; border: 1px solid {c['button_border']};
        }}
        QPushButton#cancelButton:hover {{ background-color: {c['hover_bg']}; border: 1px solid {c['border_color']}; }}
        QTabBar#tabBar::tab {{
            min-width: 120px; min-height: 40px; font-size: 14pt; padding: 4px 4px 4px 32px;
            background: {c['button_bg']}; border: 1px solid {c['container_border']};
        }}
        QTabBar#tabBar {{ border-bottom: 1px solid {c['container_border']}; }}
        QTabBar#tabBar::tab:selected {{
            background: {c['window_bg']}; color: {c['text_color']};
            border-bottom-color: {c['primary_color']}; border-bottom-width: 2px;
        }}
        QLabel.ListHeader {{ color: {c['header_color']}; font-size: 16pt; padding: 10px 0 5px 0; }}
        QWidget#rowContainer:hover {{ background-color: {c['row_hover_bg']}; border-left: 3px solid {c['row_hover_border']}; }}
        QWidget#gridItem {{
            background-color: {c['grid_item_bg']}; border: 1px solid {c['grid_item_border']}; border-radius: 5px;
        }}
        QWidget#gridItem:hover {{ border-color: {c['grid_item_hover_border']}; background-color: {c['grid_item_hover_bg']}; }}
        QCheckBox::indicator {{ background: {c['input_bg']}; border: 1px solid {c['button_border']}; }}
        QCheckBox::indicator:checked {{ background: {c['primary_color']}; border: 1px solid #006bbd; }}
        QCheckBox::indicator:hover {{ border-color: {c['primary_color']}; }}
        QMenu {{ background-color: {c['input_bg']}; border: 1px solid {c['border_color']}; color: {c['text_color']};}}
        QMenu::item {{ padding: 8px 25px; }}
        QMenu::item:selected {{ background-color: {c['primary_color']}; color: {c['primary_text']}; }}
        QProgressBar {{ border: 1px solid {c['border_color']}; border-radius: 5px; text-align: center; color: {c['text_color']}; }}
        QProgressBar::chunk {{ background-color: {c['primary_color']}; border-radius: 5px; }}
        QPushButton#helpButton {{
            font-weight: bold; border-radius: 12px; padding: 0;
            background-color: {c['help_button_bg']}; color: {c['help_button_text']};
        }}
        QPushButton#helpButton:hover {{ background-color: {c['help_button_hover_bg']}; color: {c['help_button_hover_text']}; }}
        QWidget#helpContainer {{ background-color: {c['button_bg']}; border: 1px solid {c['border_color']}; border-radius: 8px; padding: 10px; }}
        QWidget#helpContainer QLabel {{ color: {c['text_color']}; font-size: 10pt; }}
        QLabel[status="waiting"] {{ color: {c['status_waiting']}; }}
        QLabel[status="downloading"] {{ color: {c['status_downloading']}; }}
        QLabel[status="installing"] {{ color: {c['status_installing']}; font-weight: bold; }}
        QLabel[status="completed"] {{ color: {c['status_completed']}; font-weight: bold; }}
        QLabel[status="failed"] {{ color: {c['status_failed']}; font-weight: bold; }}
        QLabel[status="retrying"] {{ color: {c['status_downloading']}; }}
    """
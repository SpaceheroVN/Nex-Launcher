# style.py

def get_theme_colors(theme_name: str) -> dict:
    """Trả về một từ điển chứa các mã màu cho giao diện được chỉ định."""
    if theme_name == "Light":
        return {
            "window_bg": "#f3f3f3",
            "text_color": "#000000",
            "primary_color": "#0078d7",
            "primary_text": "#ffffff",
            "colored_button_text": "#ffffff",
            "hover_bg": "#e5f1fb",
            "border_color": "#cccccc",
            "input_bg": "#ffffff",
            "container_bg": "#ffffff",
            "container_border": "#dcdcdc",
            "header_color": "#0078d7",
            "button_bg": "#e1e1e1",
            "button_border": "#adadad",
            "scroll_bg": "#f0f0f0",
            "scroll_handle": "#cccccc",
            "scroll_handle_hover": "#bbbbbb",
            "row_hover_bg": "#ddeeff",
            "row_hover_border": "#0078d7",
            "grid_item_bg": "#ffffff",
            "grid_item_border": "#dcdcdc",
            "grid_item_hover_bg": "#eaf3fc",
            "grid_item_hover_border": "#0078d7",
            "help_button_bg": "#eaf3fc",
            "help_button_text": "#005a9e",
            "help_button_hover_bg": "#0078d7",
            "help_button_hover_text": "#ffffff",
            "uninstall_btn_bg": "#d32f2f",
            "uninstall_btn_border": "#c62828",
            "uninstall_btn_hover": "#b71c1c",
            "status_downloading": "#e69b00",
            "status_installing": "#0078d7",
            "status_completed": "#28a745",
            "status_failed": "#d9534f",
            "status_waiting": "#888888",
        }
    else: # Dark
        return {
            "window_bg": "#202020",
            "text_color": "#e0e0e0",
            "primary_color": "#61afef",
            "primary_text": "#ffffff",
            "colored_button_text": "#ffffff", 
            "hover_bg": "#4a4a4a",
            "border_color": "#5a5a5a",
            "input_bg": "#2d2d2d",
            "container_bg": "#282c34",
            "container_border": "#3c3c3c",
            "header_color": "#4dabf7",
            "button_bg": "#383838",
            "button_border": "#5a5a5a",
            "scroll_bg": "#202020",
            "scroll_handle": "#4a4a4a",
            "scroll_handle_hover": "#5a5a5a",
            "row_hover_bg": "#3a3f4b",
            "row_hover_border": "#61afef",
            "grid_item_bg": "#2c313a",
            "grid_item_border": "#4a515e",
            "grid_item_hover_bg": "#3a3f4b",
            "grid_item_hover_border": "#61afef",
            "help_button_bg": "#3a3f4b",
            "help_button_text": "#61afef",
            "help_button_hover_bg": "#61afef",
            "help_button_hover_text": "#282c34",
            "uninstall_btn_bg": "#e06c75",
            "uninstall_btn_border": "#e06c75",
            "uninstall_btn_hover": "#be5046",
            "status_downloading": "#f0ad4e",
            "status_installing": "#61afef",
            "status_completed": "#5cb85c",
            "status_failed": "#e06c75",
            "status_waiting": "#888888",
        }

def get_base_style() -> str:
    """Trả về các quy tắc QSS cơ bản được chia sẻ trên toàn bộ ứng dụng."""
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
    """Tạo kiểu cho thanh cuộn dựa trên màu sắc của giao diện."""
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

    fix_style = """
        QWidget#rowContainer > *, QWidget#gridItem > * {
            background-color: transparent;
        }
    """

    return f"""
        {base_style} {scrollbar_style} {fix_style} {dark_specific}

        /* Base Window/Widget Styles */
        QMainWindow, QWidget, QDialog {{ background-color: {c['window_bg']}; }}
        QLabel, QCheckBox, QTabBar::tab {{ color: {c['text_color']}; }}

        /* --- NÚT HÀNH ĐỘNG CHÍNH (THỐNG NHẤT) --- */
        QPushButton#installBtn, QPushButton#acceptButton {{
            background-color: #0078d7;
            color: #ffffff;
            border: 1px solid #006bbd;
            border-radius: 5px;
            font-weight: bold;
        }}
        QPushButton#installBtn:hover, QPushButton#acceptButton:hover {{
            background-color: #108ee9;
            border-color: #0078d7;
        }}
        QPushButton#installBtn {{ padding: 8px 20px; }}
        QPushButton#acceptButton {{
            min-width: 80px;
            min-height: 28px;
            padding: 5px 10px;
        }}
        
        /* --- CÁC NÚT CÒN LẠI --- */
        /* Input Fields & Combos */
        QLineEdit, QComboBox {{ 
            min-height: 30px; padding-left: 5px; background: {c['input_bg']}; 
            color: {c['text_color']}; border: 1px solid {c['border_color']}; border-radius: 5px; 
        }}
        QComboBox QAbstractItemView {{
            background-color: {c['input_bg']}; color: {c['text_color']}; 
            selection-background-color: {c['primary_color']}; border: 1px solid {c['border_color']};
        }}

        /* Nút thông thường */
        QPushButton {{ 
            border-radius: 5px; border: 1px solid {c['button_border']}; 
            background-color: {c['button_bg']}; color: {c['text_color']}; 
            padding: 8px 15px; font-weight: bold; 
        }}
        QPushButton:hover {{ background-color: {c['hover_bg']}; border: 1px solid {c['primary_color']}; }}

        /* Nút Export / Import */
        QPushButton#exportBtn, QPushButton#importBtn {{
            color: {c['colored_button_text']};
            border: none; font-weight: bold; padding: 8px 20px;
        }}
        QPushButton#exportBtn {{ background: #c05000; }}
        QPushButton#exportBtn:hover {{ background: #d06000; }}
        QPushButton#importBtn {{ background: #008040; }}
        QPushButton#importBtn:hover {{ background: #009050; }}

        /* Các nút đặc biệt khác */
        QPushButton#settingsButton {{ padding: 0; }}
        QPushButton#actionButton {{ font-size: 15px; font-weight: bold; min-width: 10px; min-height: 10px; }}
        QPushButton#browseButton, QPushButton#searchButton {{ min-height: 10px; }}
        QPushButton#cancelButton {{ min-width: 80px; min-height: 28px; font-weight: normal; }}

        /* Tab Bar */
        QTabBar#tabBar::tab {{ 
            min-width: 120px; min-height: 40px; font-size: 14pt; padding: 4px 4px 4px 32px;
            background: {c['button_bg']}; border: 1px solid {c['container_border']};
        }}
        QTabBar#tabBar {{ border-bottom: 1px solid {c['container_border']}; }}
        QTabBar#tabBar::tab:selected {{ 
            background: {c['window_bg']}; color: {c['text_color']}; border-bottom-color: #0078d7; border-bottom-width: 2px;
        }}

        /* List & Grid View */
        QLabel.ListHeader {{ color: {c['header_color']}; font-size: 16pt; padding: 10px 0 5px 0; }}
        QWidget#rowContainer:hover {{ background-color: {c['row_hover_bg']}; border-left: 3px solid {c['row_hover_border']}; }}
        
        QWidget#gridItem {{ 
            background-color: {c['grid_item_bg']}; border: 1px solid {c['grid_item_border']}; border-radius: 5px; 
        }}
        QWidget#gridItem:hover {{ border-color: {c['grid_item_hover_border']}; background-color: {c['grid_item_hover_bg']}; }}

        /* Checkbox */
        QCheckBox::indicator {{ background: {c['input_bg']}; border: 1px solid {c['button_border']}; }}
        QCheckBox::indicator:checked {{ background: #0078d7; border: 1px solid #006bbd; }}
        QCheckBox::indicator:hover {{ border-color: #0078d7; }}

        /* Menu */
        QMenu {{ background-color: {c['input_bg']}; border: 1px solid {c['border_color']}; color: {c['text_color']};}}
        QMenu::item {{ padding: 8px 25px; }}
        QMenu::item:selected {{ background-color: {c['primary_color']}; color: {c['primary_text']}; }}
        
        /* Progress Bar */
        QProgressBar {{ border: 1px solid {c['border_color']}; border-radius: 5px; text-align: center; color: {c['text_color']}; }}
        QProgressBar::chunk {{ background-color: #0078d7; border-radius: 5px; }}
        
        /* Help Button & Dialog */
        QPushButton#helpButton {{ 
            font-weight: bold; border-radius: 12px; padding: 0;
            background-color: {c['help_button_bg']}; color: {c['help_button_text']};
        }}
        QPushButton#helpButton:hover {{ background-color: {c['help_button_hover_bg']}; color: {c['help_button_hover_text']}; }}
        QWidget#helpContainer {{ background-color: {c['button_bg']}; border: 1px solid {c['border_color']}; border-radius: 8px; padding: 10px; }}
        QWidget#helpContainer QLabel {{ color: {c['text_color']}; font-size: 10pt; }}
        
        /* Progress Dialog Status Labels */
        QLabel[status="waiting"] {{ color: {c['status_waiting']}; }}
        QLabel[status="downloading"] {{ color: {c['status_downloading']}; }}
        QLabel[status="installing"] {{ color: {c['status_installing']}; font-weight: bold; }}
        QLabel[status="completed"] {{ color: {c['status_completed']}; font-weight: bold; }}
        QLabel[status="failed"] {{ color: {c['status_failed']}; font-weight: bold; }}
    """

def get_launcher_style(theme_name: str) -> str:
    c = get_theme_colors(theme_name)
    base_style = get_base_style()
    
    title_color = "#005a9e" if theme_name == 'Light' else c['primary_color']
    subtitle_color = "#333333" if theme_name == 'Light' else "#abb2bf"
    launcher_button_border = "#0078d7" if theme_name == 'Light' else c['primary_color']

    return f"""
        {base_style}
        QMainWindow, QWidget {{ background-color: {c['window_bg']}; }}
        QLabel {{ color: {c['text_color']}; }}

        #titleLabel {{ font-size: 32px; font-weight: bold; color: {title_color}; padding-bottom: 5px; }}
        #subtitleLabel {{ font-size: 16px; color: {subtitle_color}; }}
        
        #launcherButton {{
            background-color: {c['button_bg']}; color: {c['text_color']};
            border: 1px solid {launcher_button_border}; border-radius: 10px;
            font-size: 20px; font-weight: bold; padding: 10px 20px;
        }}
        #launcherButton:hover {{ background-color: {c['hover_bg']}; }}
        #launcherButton:disabled {{ background-color: {c['button_bg']}; color: #aaaaaa; border: 1px solid {c['border_color']}; }}
        
        #themeCombo {{ 
            color: {c['text_color']}; background-color: {c['input_bg']}; 
            border: 1px solid {c['border_color']}; border-radius: 5px; padding: 1px 5px; 
        }}
        
        #langButton {{
            font-size: 13px; font-weight: bold; border-radius: 5px;
            min-width: 40px; max-width: 40px; min-height: 25px;
            border: 2px solid {launcher_button_border};
            background-color: transparent;
        }}
        #langButton:checked {{ 
            color: {'#ffffff' if theme_name == 'Light' else c['primary_text']};
            background-color: {launcher_button_border};
        }}
        #langButton:!checked {{ color: {launcher_button_border}; }}

        QComboBox QAbstractItemView {{
            background-color: {c['input_bg']}; color: {c['text_color']};
            selection-background-color: {c['primary_color']}; selection-color: {c['primary_text']};
            border: 1px solid {c['border_color']}; padding: 2px;
        }}
        
        QMessageBox QPushButton {{
             min-width: 80px; min-height: 25px; border-radius: 5px;
             font-weight: bold; padding: 5px 10px;
        }}
    """
        
def get_uninstaller_style(theme_name: str) -> str:
    c = get_theme_colors(theme_name)
    base_style = get_base_style()
    scrollbar_style = get_scrollbar_style(c)
    
    light_specific = """
        QFrame { border: none; background-color: #e0e0e0; }
        QLabel#nameLabel { font-weight: bold; font-size: 14px; color: #000; }
        QLabel#publisherLabel { font-size: 12px; color: #555; }
        QLabel#versionLabel { font-size: 13px; color: #333; }
        QLabel#sizeLabel, QLabel#dateLabel { font-size: 11px; color: #777; }
        QPushButton#sortButton { color: #444; }
        QPushButton#sortButton:hover { color: #0078d7; }
    """
    dark_specific = """
        QFrame { border: none; background-color: #3c3c3c; }
        QLabel#nameLabel { font-weight: bold; font-size: 14px; color: #e0e6f0; }
        QLabel#publisherLabel { font-size: 12px; color: #9e9e9e; }
        QLabel#versionLabel { font-size: 13px; color: #a9b7c6; }
        QLabel#sizeLabel, QLabel#dateLabel { font-size: 11px; color: #888; }
        QPushButton#sortButton { color: #ccc; }
        QPushButton#sortButton:hover { color: #61afef; }
    """

    return f"""
        {base_style} {scrollbar_style}
        {light_specific if theme_name == 'Light' else dark_specific}
        
        QMainWindow, QWidget {{ background-color: {c['window_bg']}; color: {c['text_color']}; }}
        QLabel {{ font-size: 14px; }}
        QLineEdit {{ 
            min-height: 30px; padding-left: 5px; background: {c['input_bg']}; 
            color: {c['text_color']}; border: 1px solid {c['border_color']}; border-radius: 5px;
        }}
        QScrollArea#contentScroll {{ 
            border: 1px solid {c['container_border']}; 
            background-color: {c['container_bg']};
            border-radius: 8px; 
        }}
        QWidget#list_container {{ background-color: {c['container_bg']}; }}
        
        QPushButton {{ 
            border-radius: 5px; border: 1px solid {c['button_border']}; background-color: {c['button_bg']}; 
            color: {c['text_color']}; padding: 8px 20px; font-size: 14px;
        }}
        QPushButton:hover {{ background-color: {c['button_bg']}; border: 1px solid {c['button_border']}; }}
        
        #uninstallButton {{ 
            background-color: {c['uninstall_btn_bg']}; border-color: {c['uninstall_btn_border']}; 
            color: {c['colored_button_text']}; font-weight: bold; 
        }}
        #uninstallButton:hover {{ background-color: {c['uninstall_btn_hover']}; }}
        
        QWidget#rowContainer {{
            border: 3px solid transparent;
            background-color: {c['container_bg']};
        }}
        QWidget#rowContainer:hover {{ 
            background-color: {c['row_hover_bg']}; 
            border-left: 3px solid {c['row_hover_border']};
        }}
        
        QLabel#iconLabel {{ min-width: 32px; max-width: 32px; }}
        
        QPushButton#sortButton {{
            background-color: transparent; border: none;
            font-weight: bold; padding: 5px; text-align: left;
        }}
        
        QCheckBox::indicator {{ background: {c['input_bg']}; border: 1px solid {c['button_border']}; }}
        QCheckBox::indicator:checked {{ background: #0078d7; border: 1px solid #006bbd; }}
    """
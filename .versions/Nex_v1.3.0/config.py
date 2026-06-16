# config.py
TRANSLATIONS = {
    'NEX_Launcher': {
        'EN': {
            'window_title': "NEX - Advanced Utility Tool",
            'welcome': "Welcome to NEX",
            'subtitle': "Choose a tool to get started",
            'installer_btn': "Installer",
            'uninstaller_btn': "Uninstaller",
        },
        'VN': {
            'window_title': "NEX - Công cụ tiện ích tiên tiến",
            'welcome': "Chào mừng đến với NEX",
            'subtitle': "Chọn một công cụ để bắt đầu",
            'installer_btn': "Trình Cài Đặt",
            'uninstaller_btn': "Trình Gỡ Cài Đặt",
        },
        'About': {
            'EN': {
                'title': "About NEX Launcher",
                'version': "Version 1.3",
                'author': "Author: SpaceheroVN",
                'github': '<a style="color: {link_color};" href="https://github.com/SpaceheroVN/NEX/releases/">Source Code on GitHub</a>'
            },
            'VN': {
                'title': "Giới thiệu NEX Launcher",
                'version': "Phiên bản 1.3",
                'author': "Tác giả: SpaceheroVN",
                'github': '<a style="color: {link_color};" href="https://github.com/SpaceheroVN/NEX/releases/">Mã nguồn trên GitHub</a>'
            }
        }
    },
    'Installer': {
        'EN': {
            'repo_ask_title': 'Welcome!',
            'repo_ask_body': 'This appears to be your first time. Would you like to download a basic software repository to get started?'
        },
        'VN': {
            'repo_ask_title': 'Chào mừng!',
            'repo_ask_body': 'Đây có vẻ là lần đầu bạn sử dụng. Bạn có muốn tải về một danh sách phần mềm cơ bản để bắt đầu không?'
        }
    }
}

def get_theme_colors(theme_name: str) -> dict:
    if theme_name == "Light":
        return {
            "window_bg": "#f0f2f5",
            "text_color": "#1c1e21",
            "primary_color": "#0078d4",
            "primary_text": "#ffffff",
            "button_bg": "#e4e6eb",
            "button_text": "#050505",
            "hover_bg": "#d8dade",
            "border_color": "#ced0d4",
            "input_bg": "#ffffff",
            "help_button_bg": "#e4e6eb",
            "help_button_text": "#050505",
            "help_button_hover_bg": "#d8dade",
            "help_button_hover_text": "#050505",
            "launcher_button_hover_bg": "#ffffff",
            "launcher_button_border": "#d1d1d1"
        }
    else:
        return {
            "window_bg": "#18191a",
            "text_color": "#e4e6eb",
            "primary_color": "#2d88ff",
            "primary_text": "#e4e6eb",
            "button_bg": "#3a3b3c",
            "button_text": "#e4e6eb",
            "hover_bg": "#4e4f50",
            "border_color": "#393a3b",
            "input_bg": "#242526",
            "help_button_bg": "#3a3b3c",
            "help_button_text": "#e4e6eb",
            "help_button_hover_bg": "#4e4f50",
            "help_button_hover_text": "#e4e6eb",
            "launcher_button_hover_bg": "#2c2d2e",
            "launcher_button_border": "#393a3b"
        }

def get_base_style() -> str:
    return """
        * { outline: none; }
        QPushButton::menu-indicator, QComboBox::down-arrow { image: none; width: 0px; }
        QComboBox::drop-down { border: none; }
    """

def get_launcher_style(theme_name: str) -> str:
    c = get_theme_colors(theme_name)
    base_style = get_base_style()

    title_color = c['primary_color']
    subtitle_color = "#606770" if theme_name == 'Light' else "#b0b3b8"

    return f"""
        {base_style}

        #centralWidget {{
            background-color: {c['window_bg']};
            border-radius: 15px;
        }}
        QDialog {{
            background-color: {c['window_bg']};
        }}
        
        #centralWidget QWidget {{
            background-color: transparent;
        }}
        
        QLabel {{ color: {c['text_color']}; }}
        #titleLabel {{ font-size: 32px; font-weight: bold; color: {title_color}; padding-bottom: 5px; }}
        #subtitleLabel {{ font-size: 16px; color: {subtitle_color}; }}
        
        #launcherButton {{
            background-color: {c['window_bg']};
            color: {c['text_color']};
            border: 1px solid {c['launcher_button_border']};
            border-radius: 8px;
            font-size: 18px;
            font-weight: bold;
            padding: 20px;
            text-align: center;
        }}
        #launcherButton:hover {{ 
            background-color: {c['launcher_button_hover_bg']}; 
        }}
        
        #themeCombo {{ 
            color: {c['text_color']}; background-color: {c['input_bg']}; 
            border: 1px solid {c['border_color']}; border-radius: 5px; padding: 4px 8px; 
        }}
        
        #langButton {{
            font-size: 13px; font-weight: bold; border-radius: 5px; min-width: 40px;
            max-width: 40px; min-height: 28px; border: 2px solid {c['primary_color']};
            background-color: transparent;
        }}
        #langButton:checked {{ 
            color: {c['primary_text']};
            background-color: {c['primary_color']};
        }}
        #langButton:!checked {{ color: {c['primary_color']}; }}
        
        QPushButton#helpButton {{
            font-size: 14px; font-weight: bold; border-radius: 14px; padding: 0;
            background-color: {c['help_button_bg']}; color: {c['help_button_text']};
        }}
        QPushButton#helpButton:hover {{
             background-color: {c['help_button_hover_bg']}; color: {c['help_button_hover_text']};
        }}

        QPushButton#closeButton {{
            font-size: 16px; font-weight: bold; border-radius: 14px; padding: 0;
            background-color: transparent;
            color: {c['text_color']};
            border: none;
        }}
        QPushButton#closeButton:hover {{
             background-color: #e81123;
             color: #ffffff;
        }}
        
        QComboBox#themeCombo QAbstractItemView {{
            background-color: {c['input_bg']}; color: {c['text_color']};
            selection-background-color: {c['primary_color']}; selection-color: {c['primary_text']};
            border: 1px solid {c['border_color']}; padding: 4px;
        }}
        
        QPushButton#acceptButton, QMessageBox QPushButton {{
            background-color: {c['primary_color']}; color: {c['primary_text']};
            border: none;
            border-radius: 5px; font-weight: bold; min-width: 80px;
            min-height: 28px; padding: 5px 10px;
        }}
        QPushButton#acceptButton:hover, QMessageBox QPushButton:hover {{
            background-color: {c['hover_bg']};
        }}
    """
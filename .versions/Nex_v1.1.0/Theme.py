# Theme.py

def get_theme_qss(theme_name: str) -> str:
    """Returns the QSS string for the specified theme ('Light' or 'Dark')."""
    
    checkbox_style = """
        QCheckBox {
            spacing: 5px;
        }
        QCheckBox::indicator {
            width: 15px;
            height: 15px;
            border-radius: 4px;
        }
    """
    
    scrollbar_style = """
        QScrollBar:vertical {
            border: none;
            background: transparent;
            width: 10px;
            margin: 0px 0px 0px 0px;
        }
        QScrollBar::handle:vertical {
            background: #c0c0c0;
            min-height: 20px;
            border-radius: 5px;
        }
        QScrollBar::handle:vertical:hover {
            background: #a0a0a0;
        }
        QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {
            border: none;
            background: none;
            height: 0px;
        }
    """
    
    global_style = """
        * { outline: none; }
        QPushButton::menu-indicator, QComboBox::down-arrow {
            image: none;
            width: 0px;
        }
        QComboBox::drop-down {
            border: none;
        }
    """

    if theme_name == "Light":
        return f'''
        /* --- LIGHT THEME --- */
        {global_style}
        {scrollbar_style}
        QMainWindow, QWidget, QDialog {{ background-color: #f3f3f3; }}
        QLabel, QCheckBox {{ color: #000000; }}
        QTabBar::tab {{ color: #555555; }}
        QScrollArea {{ border: none; }}
        QMenu {{ background-color: #ffffff; border: 1px solid #d0d0d0; color: #000000; }}
        QMenu::item {{ padding: 8px 25px; }}
        QMenu::item:selected {{ background-color: #0078d7; color: #ffffff; }}

        QLineEdit, QComboBox {{ 
            min-height: 30px;
            padding-left: 5px;
            background: #ffffff; color: #000000; border: 1px solid #cccccc;
            border-radius: 5px;
        }}
        
        QProgressBar {{
            border: 1px solid #cccccc;
            border-radius: 5px;
            text-align: center;
            color: black;
        }}
        QProgressBar::chunk {{
            background-color: #0078d7;
            border-radius: 5px;
        }}

        QLabel[class="ListHeader"] {{ color: #0078d7; font-size: 16pt; padding: 10px 0 5px 0; }}

        {checkbox_style}
        QCheckBox::indicator {{ background: #ffffff; border: 1px solid #767676; }}
        QCheckBox::indicator:checked {{ background: #0078d7; border: 1px solid #005a9e; }}
        QCheckBox::indicator:hover {{ border-color: #0078d7; }}

        QTabBar#tabBar::tab {{
            min-width: 120px; min-height: 40px; font-size: 14pt; padding: 4px 4px 4px 32px;
        }}
        QTabBar#tabBar {{ border-bottom: 1px solid #dcdcdc; }}
        QTabBar#tabBar::tab:selected {{ background: #f3f3f3; color: #000000; border: 1px solid #dcdcdc; border-bottom: 2px solid #0078d7; }}
        QTabBar#tabBar::tab:!selected {{ background: #e0e0e0; border: 1px solid #dcdcdc; }}

        QComboBox QAbstractItemView {{ background-color: #ffffff; color: #000000; selection-background-color: #0078d7; border: 1px solid #dcdcdc; }}
        
        QPushButton {{ border-radius: 5px; border: 1px solid #adadad; background-color: #e1e1e1; color: #000000; padding: 5px; }}
        QPushButton:hover {{ background-color: #e5f1fb; border: 1px solid #0078d7; }}
        
        QPushButton#installBtn, QPushButton#exportBtn, QPushButton#importBtn {{ color: #ffffff; border: none; font-weight: bold; }}
        QPushButton#installBtn {{ background: #0078d7; }}
        QPushButton#installBtn:hover {{ background: #108ee9; }}
        QPushButton#exportBtn {{ background: #c05000; }}
        QPushButton#exportBtn:hover {{ background: #d06000; }}
        QPushButton#importBtn {{ background: #008040; }}
        QPushButton#importBtn:hover {{ background: #009050; }}

        QPushButton#settingsButton {{ padding: 0; }}
        QPushButton#actionButton {{ font-weight: bold; min-width: 40px; min-height: 30px; }}
        QPushButton#browseButton {{ min-width: 90px; min-height: 30px;}}

        QPushButton#acceptButton, QMessageBox QPushButton {{
            background: #0078d7; color: #ffffff; border: none; font-weight: bold; min-width: 80px; min-height: 28px;
        }}
        QPushButton#acceptButton:hover, QMessageBox QPushButton:hover {{ background: #108ee9; }}
        
        QPushButton#cancelButton {{ min-width: 80px; min-height: 28px; font-weight: normal; }}
        '''
    else: # Dark Theme
        dark_scrollbar = scrollbar_style.replace("#c0c0c0", "#5a5a5a").replace("#a0a0a0", "#6a6a6a")
        return f'''
        /* --- DARK THEME --- */
        {global_style}
        {dark_scrollbar}
        QMainWindow, QWidget, QDialog {{ background-color: #202020; }}
        QLabel, QTabBar::tab, QCheckBox {{ color: #e0e0e0; }}
        QLineEdit, QComboBox {{ 
            min-height: 30px; padding-left: 5px; background-color: #2d2d2d; 
            border: 1px solid #5a5a5a; color: #ffffff; border-radius: 5px;
        }}
        QScrollArea {{ border: none; }}
        QMenu {{ background-color: #2d2d2d; border: 1px solid #505050; color: #e0e0e0;}}
        QMenu::item {{ padding: 8px 25px; }}
        QMenu::item:selected {{ background-color: #0078d7; color: #ffffff; }}

        QProgressBar {{
            border: 1px solid #5a5a5a;
            border-radius: 5px;
            text-align: center;
            color: #e0e0e0;
        }}
        QProgressBar::chunk {{
            background-color: #0078d7;
            border-radius: 5px;
        }}

        QLabel[class="ListHeader"] {{ color: #4dabf7; font-size: 16pt; padding: 10px 0 5px 0; }}
        
        {checkbox_style}
        QCheckBox::indicator {{ background: #3c3c3c; border: 1px solid #8c8c8c; }}
        QCheckBox::indicator:checked {{ background: #0078d7; border: 1px solid #005a9e; }}
        QCheckBox::indicator:hover {{ border-color: #4dabf7; }}

        QTabBar#tabBar::tab {{ min-width: 120px; min-height: 40px; font-size: 14pt; padding: 4px 4px 4px 32px; }}
        QTabBar#tabBar {{ border-bottom: 1px solid #3c3c3c; }}
        QTabBar#tabBar::tab:selected {{ background: #2d2d2d; color: #ffffff; border: 1px solid #3c3c3c; border-bottom: 2px solid #0078d7; }}
        QTabBar#tabBar::tab:!selected {{ background: #252525; border: 1px solid #3c3c3c; }}

        QComboBox QAbstractItemView {{ background-color: #2d2d2d; color: #ffffff; selection-background-color: #0078d7; border: 1px solid #5a5a5a; }}
        
        QPushButton {{ border-radius: 5px; border: 1px solid #5a5a5a; background-color: #383838; color: #e0e0e0; padding: 5px; }}
        QPushButton:hover {{ background-color: #4a4a4a; border: 1px solid #4dabf7; }}
        
        QPushButton#installBtn, QPushButton#exportBtn, QPushButton#importBtn {{ color: #ffffff; border: none; font-weight: bold; }}
        QPushButton#installBtn {{ background: #0078d7; }}
        QPushButton#installBtn:hover {{ background: #0088e8; }}
        QPushButton#exportBtn {{ background: #c05000; }}
        QPushButton#exportBtn:hover {{ background: #d06000; }}
        QPushButton#importBtn {{ background: #008040; }}
        QPushButton#importBtn:hover {{ background: #009050; }}
        
        QPushButton#settingsButton {{ padding: 0; }}
        QPushButton#actionButton {{ font-weight: bold; min-width: 40px; min-height: 30px; }}
        QPushButton#browseButton {{ min-width: 90px; min-height: 30px; }}

        QPushButton#acceptButton, QMessageBox QPushButton {{
            background: #0078d7; color: #ffffff; border: none; font-weight: bold; min-width: 80px; min-height: 28px;
        }}
        QPushButton#acceptButton:hover, QMessageBox QPushButton:hover {{ background: #0088e8; }}

        QPushButton#cancelButton {{ min-width: 80px; min-height: 28px; font-weight: normal; }}
        '''
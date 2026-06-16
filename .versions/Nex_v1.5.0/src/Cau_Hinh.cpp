#include "Cau_Hinh.h"
#include <QJsonDocument>
#include <QJsonObject>
#include <QJsonValue>

QMap<QString, QMap<QString, QMap<QString, QString>>> Cau_Hinh::translationsCache;
bool Cau_Hinh::isLoaded = false;

void Cau_Hinh::loadTranslations() {
    if (isLoaded) return;
    
    QString jsonStr = R"JSON({
        "Launcher": {
            "EN": {
                "window_title": "Nex-Launcher - Advanced Utility Tool",
                "welcome": "Welcome to Nex-Launcher",
                "subtitle": "Choose a tool to get started",
                "installer_btn": "Installer",
                "uninstaller_btn": "Uninstaller",
                "always_on_top_btn": "Always on Top",
                "minimize_tray_btn": "Minimize to Tray",
                "about_btn": "About",
                "update_btn": "Check for Updates",
                "tray_show": "Show Nex Launcher",
                "tray_exit": "Exit",
                "menu_settings": "Settings",
                "menu_theme": "Theme",
                "menu_language": "Language",
                "menu_system": "System Default",
                "menu_light": "Light",
                "menu_dark": "Dark"
            },
            "VN": {
                "window_title": "Nex-Launcher - Công cụ tiện ích tiên tiến",
                "welcome": "Chào mừng đến với Nex-Launcher",
                "subtitle": "Chọn một công cụ để bắt đầu",
                "installer_btn": "Trình Cài Đặt",
                "uninstaller_btn": "Trình Gỡ Cài Đặt",
                "always_on_top_btn": "Luôn ở trên cùng",
                "minimize_tray_btn": "Thu nhỏ xuống khay",
                "about_btn": "Giới thiệu",
                "update_btn": "Kiểm tra cập nhật",
                "tray_show": "Hiển thị Nex Launcher",
                "tray_exit": "Thoát",
                "menu_settings": "Cài đặt",
                "menu_theme": "Giao diện",
                "menu_language": "Ngôn ngữ",
                "menu_system": "Hệ thống",
                "menu_light": "Sáng",
                "menu_dark": "Tối"
            }
        },
        "About": {
            "EN": {
                "title": "Nex Launcher",
                "version": "Version 1.5",
                "author": "Author: SpaceheroVN",
                "github": "<a style=\"color: {link_color};\" href=\"https://github.com/SpaceheroVN/Nex-Launcher/releases/\">Source Code on GitHub</a>"
            },
            "VN": {
                "title": "Nex Launcher",
                "version": "Phiên bản 1.5",
                "author": "Tác giả: SpaceheroVN",
                "github": "<a style=\"color: {link_color};\" href=\"https://github.com/SpaceheroVN/Nex-Launcher/releases/\">Mã nguồn trên GitHub</a>"
            }
        },
        "InstallerHelp": {
            "EN": {
                "repo_ask_title": "Welcome!",
                "repo_ask_body": "This appears to be your first time. Would you like to download a basic software repository to get started?"
            },
            "VN": {
                "repo_ask_title": "Chào mừng!",
                "repo_ask_body": "Đây có vẻ là lần đầu bạn sử dụng. Bạn có muốn tải về một danh sách phần mềm cơ bản để bắt đầu không?"
            }
        },
        "Installer": {
            "EN": {
                "window_title": "Nex-Launcher - Installer",
                "tab_all": "All",
                "tab_apps": "Apps",
                "tab_games": "Games",
                "install_from_label": "Install from:",
                "search_btn": "Search",
                "export_btn": "Export",
                "import_btn": "Import",
                "install_btn": "Install",
                "select_all_btn": "Select All",
                "search_dialog_title": "Search Software",
                "search_placeholder": "Search...",
                "keep_text_check": "Keep temp files",
                "progress_title": "Installation Progress",
                "close_btn": "Close",
                "progress_status_waiting": "Waiting...",
                "progress_status_installing": "Installing...",
                "progress_status_completed": "Completed",
                "add_item_title": "Add Custom Item",
                "item_name_label": "Name:",
                "item_name_placeholder": "Enter name",
                "item_type_label": "Type:",
                "item_type_app": "App",
                "item_type_game": "Game",
                "settings_title": "Installer Settings",
                "multithread_install_check": "Enable multi-thread installation",
                "auto_select_check": "Auto-select after adding",
                "minimize_tray_check": "Minimize to tray during install",
                "use_detailed_categories_check": "Use detailed categories",
                "show_progress_check": "Show progress dialog",
                "hide_unsupported_check": "Hide unsupported OS apps",
                "show_completion_check": "Show completion dialog",
                "source_type_label": "Source Type:",
                "source_type_unknown": "Unknown",
                "source_type_package": "Package",
                "source_type_link": "Link",
                "source_type_winget": "Winget",
                "browse_btn": "Browse...",
                "header_name": "Name",
                "header_category": "Category",
                "header_source": "Source",
                "edit_source_title": "Edit Source",
                "source_value": "Source Value:",
                "silent_args": "Silent Arguments:",
                "options_btn": "Options",
                "ok_btn": "OK",
                "cancel_btn": "Cancel"
            },
            "VN": {
                "window_title": "Nex-Launcher - Trình Cài Đặt",
                "tab_all": "Tất cả",
                "tab_apps": "Phần mềm",
                "tab_games": "Trò chơi",
                "install_from_label": "Cài đặt từ:",
                "search_btn": "Tìm kiếm",
                "export_btn": "Xuất",
                "import_btn": "Nhập",
                "install_btn": "Cài đặt",
                "select_all_btn": "Chọn tất cả",
                "search_dialog_title": "Tìm kiếm phần mềm",
                "search_placeholder": "Tìm kiếm...",
                "keep_text_check": "Giữ lại file tạm",
                "progress_title": "Tiến trình cài đặt",
                "close_btn": "Đóng",
                "progress_status_waiting": "Đang chờ...",
                "progress_status_installing": "Đang cài đặt...",
                "progress_status_completed": "Hoàn tất",
                "add_item_title": "Thêm ứng dụng tùy chỉnh",
                "item_name_label": "Tên:",
                "item_name_placeholder": "Nhập tên",
                "item_type_label": "Loại:",
                "item_type_app": "Phần mềm",
                "item_type_game": "Trò chơi",
                "settings_title": "Cài đặt Trình Cài Đặt",
                "multithread_install_check": "Bật cài đặt đa luồng",
                "auto_select_check": "Tự động chọn sau khi thêm",
                "minimize_tray_check": "Thu nhỏ xuống khay khi cài đặt",
                "use_detailed_categories_check": "Sử dụng danh mục chi tiết",
                "show_progress_check": "Hiển thị tiến trình",
                "hide_unsupported_check": "Ẩn ứng dụng không hỗ trợ",
                "show_completion_check": "Hiển thị thông báo hoàn tất",
                "source_type_label": "Nguồn tải:",
                "source_type_unknown": "Không rõ",
                "source_type_package": "Bộ cài đặt",
                "source_type_link": "Đường dẫn",
                "source_type_winget": "Winget",
                "browse_btn": "Duyệt...",
                "header_name": "Tên phần mềm",
                "header_category": "Thể loại",
                "header_source": "Nguồn cài đặt",
                "edit_source_title": "Chỉnh sửa nguồn",
                "source_value": "Đường dẫn nguồn:",
                "silent_args": "Tham số cài đặt ngầm:",
                "options_btn": "Tuỳ chọn",
                "ok_btn": "Lưu",
                "cancel_btn": "Hủy"
            }
        },
        "Uninstaller": {
            "EN": {
                "window_title": "Nex-Launcher - Uninstaller",
                "search_placeholder": "Search software...",
                "refresh_btn": "Refresh",
                "header_name": "Name",
                "header_publisher": "Publisher",
                "header_date": "Install Date",
                "header_size": "Size",
                "header_select_all_tooltip": "Select/Deselect all visible apps",
                "uninstall_btn": "Uninstall",
                "loading_text": "Scanning installed applications. Please wait...",
                "no_apps_found_body": "No applications found or an error occurred during scanning.",
                "status_selected": "Selected %1 app(s)",
                "confirm_uninstall_title": "Confirm Uninstall",
                "confirm_uninstall_body": "Are you sure you want to uninstall the selected applications?",
                "settings_title": "Uninstaller Settings",
                "silent_uninstall_check": "Silent Uninstall (if supported)",
                "show_confirmation_check": "Show confirmation before uninstalling",
                "show_progress_check": "Show progress dialog",
                "show_notification_check": "Show system notification on completion",
                "minimize_on_close_check": "Minimize to tray instead of closing",
                "progress_title": "Uninstall Progress",
                "progress_overall": "Overall Progress",
                "close_btn": "Close",
                "status_waiting": "Waiting...",
                "status_uninstalling": "Uninstalling...",
                "status_completed": "Completed",
                "status_failed": "Failed",
                "leftover_title": "Leftover Files Found",
                "leftover_desc": "The following leftover files and registry keys were found. Please select the items you wish to permanently delete:",
                "delete_btn": "Delete Selected",
                "cancel_btn": "Cancel",
                "create_restore_point_check": "Create a system restore point before uninstalling",
                "auto_cleanup_check": "Automatically remove residual files"
            },
            "VN": {
                "window_title": "Nex-Launcher - Công cụ Gỡ cài đặt",
                "search_placeholder": "Tìm kiếm phần mềm...",
                "refresh_btn": "Làm mới",
                "header_name": "Tên phần mềm",
                "header_publisher": "Nhà phát hành",
                "header_date": "Ngày cài đặt",
                "header_size": "Dung lượng",
                "header_select_all_tooltip": "Chọn/Bỏ chọn tất cả phần mềm hiển thị",
                "uninstall_btn": "Gỡ cài đặt",
                "loading_text": "Đang quét các phần mềm được cài đặt. Vui lòng đợi...",
                "no_apps_found_body": "Không tìm thấy phần mềm nào hoặc đã xảy ra lỗi trong quá trình quét.",
                "status_selected": "Đã chọn %1 phần mềm",
                "confirm_uninstall_title": "Xác nhận gỡ cài đặt",
                "confirm_uninstall_body": "Bạn có chắc chắn muốn gỡ cài đặt các phần mềm đã chọn?",
                "settings_title": "Cài đặt Gỡ cài đặt",
                "silent_uninstall_check": "Gỡ cài đặt ngầm (nếu hỗ trợ)",
                "show_confirmation_check": "Hiển thị xác nhận trước khi gỡ",
                "show_progress_check": "Hiển thị tiến trình",
                "show_notification_check": "Hiển thị thông báo khi hoàn tất",
                "minimize_on_close_check": "Thu nhỏ xuống khay thay vì đóng",
                "progress_title": "Tiến trình gỡ cài đặt",
                "progress_overall": "Tiến độ tổng thể",
                "close_btn": "Đóng",
                "status_waiting": "Đang chờ...",
                "status_uninstalling": "Đang gỡ cài đặt...",
                "status_completed": "Hoàn tất",
                "status_failed": "Thất bại",
                "leftover_title": "Phát hiện tệp rác",
                "leftover_desc": "Tìm thấy các tệp rác và khóa registry còn sót lại sau khi gỡ cài đặt. Vui lòng chọn những tệp bạn muốn xóa vĩnh viễn:",
                "delete_btn": "Xóa mục đã chọn",
                "cancel_btn": "Hủy",
                "create_restore_point_check": "Tạo điểm khôi phục hệ thống trước khi gỡ cài đặt",
                "auto_cleanup_check": "Tự động loại bỏ các tệp tin thừa"
            }
        }
    })JSON";

    QJsonDocument doc = QJsonDocument::fromJson(jsonStr.toUtf8());
    if (doc.isObject()) {
        QJsonObject root = doc.object();
        for (const QString& section : root.keys()) {
            QJsonObject sectionObj = root[section].toObject();
            for (const QString& lang : sectionObj.keys()) {
                QJsonObject langObj = sectionObj[lang].toObject();
                for (const QString& key : langObj.keys()) {
                    translationsCache[section][lang][key] = langObj[key].toString();
                }
            }
        }
    }
    isLoaded = true;
}

QString Cau_Hinh::getTranslation(const QString& section, const QString& lang, const QString& key) {
    loadTranslations();
    if (translationsCache.contains(section) && translationsCache[section].contains(lang)) {
        return translationsCache[section][lang].value(key, key);
    }
    return key;
}

QMap<QString, QString> Cau_Hinh::getLauncherTranslations(const QString& lang) {
    loadTranslations();
    return translationsCache["Launcher"][lang];
}

QMap<QString, QString> Cau_Hinh::getAboutTranslations(const QString& lang) {
    loadTranslations();
    return translationsCache["About"][lang];
}

QMap<QString, QString> Cau_Hinh::getInstallerTranslations(const QString& lang) {
    loadTranslations();
    return translationsCache["InstallerHelp"][lang];
}

QMap<QString, QString> Cau_Hinh::getThemeColors(const QString& theme_name) {
    QMap<QString, QString> c;
    if (theme_name == "Light") {
        c["window_bg"] = "#E0E0E0";
        c["bg_tier0"] = "#FFFFFF";
        c["bg_tier1"] = "#F0F2F5";
        c["bg_tier2"] = "#E4E6EB";
        c["text_color"] = "#1c1e21";
        c["primary_color"] = "#0078d4";
        c["primary_hover"] = "#106ebe";
        c["primary_hover_bg"] = c["primary_hover"];
        c["primary_text"] = "#ffffff";
        c["button_bg"] = "#e4e6eb";
        c["button_text"] = "#050505";
        c["hover_bg"] = "#d8dade";
        c["border_color"] = "#ced0d4";
        c["button_border"] = c["border_color"];
        c["input_bg"] = "#ffffff";
        c["help_button_bg"] = "#e4e6eb";
        c["help_button_text"] = "#050505";
        c["help_button_hover_bg"] = "#d8dade";
        c["help_button_hover_text"] = "#050505";
        c["launcher_button_hover_bg"] = "#ffffff";
        c["launcher_button_border"] = "#d1d1d1";
        c["danger_color"] = "#E53935";
    } else {
        c["window_bg"] = "#121212";
        c["bg_tier0"] = "#000000";
        c["bg_tier1"] = "#18191A";
        c["bg_tier2"] = "#242526";
        c["text_color"] = "#e4e6eb";
        c["primary_color"] = "#2d88ff";
        c["primary_hover"] = "#1877f2";
        c["primary_text"] = "#e4e6eb";
        c["button_bg"] = "#3a3b3c";
        c["button_text"] = "#e4e6eb";
        c["hover_bg"] = "#4e4f50";
        c["border_color"] = "#393a3b";
        c["input_bg"] = "#242526";
        c["help_button_bg"] = "#3a3b3c";
        c["help_button_text"] = "#e4e6eb";
        c["help_button_hover_bg"] = "#4e4f50";
        c["help_button_hover_text"] = "#e4e6eb";
        c["launcher_button_hover_bg"] = "#2c2d2e";
        c["launcher_button_border"] = "#393a3b";
        c["danger_color"] = "#EF4444";
    }
    c["tab_bg"] = (theme_name == "Light") ? "#e4e6eb" : "#3a3b3c";
    return c;
}

QString Cau_Hinh::getBaseStyle() {
    return "* { outline: none; }\n"
           "QPushButton::menu-indicator, QComboBox::down-arrow { image: none; width: 0px; }\n"
           "QComboBox::drop-down { border: none; }\n";
}

QString Cau_Hinh::getLauncherStyle(const QString& theme_name, int radius) {
    QMap<QString, QString> c = getThemeColors(theme_name);
    QString base_style = getBaseStyle();

    QString title_color = c["primary_color"];
    QString subtitle_color = (theme_name == "Light") ? "#606770" : "#b0b3b8";
    
    QString br4 = radius > 0 ? "4" : "0";
    QString br5 = radius > 0 ? "5" : "0";
    QString br6 = radius > 0 ? "6" : "0";
    QString br8 = radius > 0 ? "8" : "0";
    QString br12 = radius > 0 ? "12" : "0";
    QString br15 = radius > 0 ? "15" : "0";

    return base_style + R"(
        #centralWidget {
            background-color: )" + c["window_bg"] + R"(;
        }
        #centralWidget[isMaximized="false"] {
            border-radius: )" + QString::number(radius) + R"(px;
        }
        #centralWidget[isMaximized="true"] {
            border-radius: 0px;
        }
        QDialog {
            background-color: )" + c["window_bg"] + R"(;
        }
        #centralWidget QWidget {
            background-color: transparent;
        }
        QLabel, QCheckBox { color: )" + c["text_color"] + R"(; }
        #titleLabel { font-size: 24px; font-weight: bold; color: )" + title_color + R"(; padding-bottom: 5px; }
        #subtitleLabel { font-size: 16px; color: )" + subtitle_color + R"(; }
        
        #launcherButton {
            background-color: )" + c["window_bg"] + R"(;
            color: )" + c["text_color"] + R"(;
            border: 1px solid )" + c["launcher_button_border"] + R"(;
            border-radius: )" + br8 + R"(px;
            font-size: 18px;
            font-weight: bold;
            padding: 20px;
            text-align: center;
        }
        QTabBar::tab {
            color: )" + c["text_color"] + R"(;
            background-color: )" + c["tab_bg"] + R"(;
            border: none;
            padding: 15px 30px;
            font-size: 18px;
            font-weight: bold;
            border-radius: 0px;
        }
        QTabBar::tab:hover {
            background-color: )" + c["hover_bg"] + R"(;
        }
        QTabBar::tab:selected {
            background-color: transparent;
            color: )" + c["primary_color"] + R"(;
            border-bottom: 3px solid )" + c["primary_color"] + R"(;
        }
        #launcherButton:hover { 
            background-color: )" + c["launcher_button_hover_bg"] + R"(; 
        }
        
        #hop_chon_chu_de { 
            color: )" + c["text_color"] + R"(; background-color: )" + c["input_bg"] + R"(; 
            border: 1px solid )" + c["border_color"] + R"(; border-radius: )" + br5 + R"(px; padding: 4px 8px; 
            min-width: 80px;
        }
        
        #langButton {
            font-size: 13px; font-weight: bold; border-radius: )" + br5 + R"(px; min-width: 40px;
            max-width: 40px; min-height: 28px; border: 2px solid )" + c["primary_color"] + R"(;
            background-color: transparent;
        }
        #langButton:checked { 
            color: )" + c["primary_text"] + R"(;
            background-color: )" + c["primary_color"] + R"(;
        }
        #langButton:!checked { color: )" + c["primary_color"] + R"(; }
        
        QCheckBox::indicator { width: 20px; height: 20px; border-radius: )" + br4 + R"(px; border: 1px solid )" + c["border_color"] + R"(; background-color: )" + c["input_bg"] + R"(; }
        QCheckBox::indicator:checked { background-color: )" + c["primary_color"] + R"(; border: 1px solid )" + c["primary_color"] + R"(; image: url(:/icons/tick.svg); }
        QCheckBox::indicator:hover { border: 1px solid )" + c["primary_color"] + R"(; }
        QPushButton#helpButton {
            font-size: 14px; font-weight: bold; border-radius: )" + br12 + R"(px; padding: 0;
            background-color: )" + c["help_button_bg"] + R"(; color: )" + c["help_button_text"] + R"(;
            border: none;
        }
        QPushButton#helpButton:hover {
             background-color: )" + c["help_button_hover_bg"] + R"(; color: )" + c["help_button_hover_text"] + R"(;
        }
        
        QPushButton#sidebarTab, QPushButton#sidebarTabUninstall {
            background-color: transparent;
            color: )" + c["text_color"] + R"(;
            border: none;
            border-radius: )" + br6 + R"(px;
            margin: 0px 8px;
            font-size: 15px;
            font-weight: bold;
            text-align: left;
            padding-left: 8px;
        }
        QPushButton#sidebarTab:hover, QPushButton#sidebarTabUninstall:hover {
            background-color: )" + c["hover_bg"] + R"(;
        }
        QPushButton#sidebarTab:checked {
            background-color: )" + c["primary_color"] + R"(;
            color: )" + c["primary_text"] + R"(;
        }
        QPushButton#sidebarTabUninstall:checked {
            background-color: )" + c["danger_color"] + R"(;
            color: )" + c["primary_text"] + R"(;
        }
        
        QPushButton#settingsButton, QPushButton#addButton, QPushButton#removeButton {
            background-color: transparent;
            border: none;
            border-radius: )" + br15 + R"(px;
        }
        QPushButton#settingsButton:hover, QPushButton#addButton:hover, QPushButton#removeButton:hover {
            background-color: rgba(128, 128, 128, 0.2);
            border-radius: )" + br15 + R"(px;
        }
        QPushButton#sidebarButton {
            background-color: transparent;
            border: none;
        }
        
        QFrame#bottomSeparator, QFrame#sidebarSeparator {
            background-color: )" + c["border_color"] + R"(;
            border: none;
            max-height: 2px;
        }

        QPushButton#winCtrlButton, QPushButton#closeButton {
            font-size: 16px; font-weight: bold; border-radius: )" + br8 + R"(px; padding: 0;
            background-color: transparent;
            color: )" + c["text_color"] + R"(;
            border: 1px solid transparent;
        }
        QPushButton#winCtrlButton:hover {
             background-color: )" + c["border_color"] + R"(;
             border-radius: )" + br8 + R"(px;
        }
        QPushButton#closeButton:hover {
             background-color: #E81123;
             color: #ffffff;
             border-radius: )" + br8 + R"(px;
        }
        
        QComboBox#hop_chon_chu_de QAbstractItemView {
            background-color: )" + c["input_bg"] + R"(; color: )" + c["text_color"] + R"(;
            selection-background-color: )" + c["primary_color"] + R"(; selection-color: )" + c["primary_text"] + R"(;
            border: 1px solid )" + c["border_color"] + R"(; padding: 4px;
        }
        
        QPushButton#acceptButton, NexMessageBox QPushButton {
            background-color: )" + c["primary_color"] + R"(; color: )" + c["primary_text"] + R"(;
            border: none;
            border-radius: )" + br5 + R"(px; font-weight: bold; min-width: 80px;
            min-height: 28px; padding: 5px 10px;
        }
        QPushButton#acceptButton:hover, NexMessageBox QPushButton:hover {
            background-color: )" + c["hover_bg"] + R"(;
        }
        
        QPushButton#cancelButton, QPushButton#resetButton {
            background-color: transparent; color: )" + c["text_color"] + R"(;
            border: 1px solid )" + c["border_color"] + R"(;
            border-radius: )" + br5 + R"(px; font-weight: bold; min-width: 80px;
            min-height: 28px; padding: 5px 10px;
        }
        QPushButton#cancelButton:hover, QPushButton#resetButton:hover {
            background-color: )" + c["button_bg"] + R"(;
        }
        QPushButton#alwaysOnTopButton {
            font-weight: bold;
            color: #ffffff;
            border-radius: )" + br5 + R"(px;
            font-size: 9pt;
            padding: 5px 10px;
        }
        QPushButton#alwaysOnTopButton:checked {
            background-color: #28a745;
            border: 1px solid #218838;
        }
        QPushButton#alwaysOnTopButton:!checked {
            background-color: #dc3545;
            border: 1px solid #c82333;
        }
        QPushButton#alwaysOnTopButton:checked:hover {
            background-color: #218838;
        }
        QPushButton#alwaysOnTopButton:!checked:hover {
            background-color: #c82333;
        }
        
        QMenu {
            background-color: )" + c["input_bg"] + R"(;
            color: )" + c["text_color"] + R"(;
            border: 1px solid )" + c["border_color"] + R"(;
            border-radius: )" + br6 + R"(px;
            padding: 4px;
        }
        QMenu::item {
            background-color: transparent;
            padding: 6px 24px 6px 20px;
            border-radius: )" + br4 + R"(px;
            margin: 2px 0px;
        }
        QMenu::item:selected {
            background-color: )" + c["primary_color"] + R"(;
            color: )" + c["primary_text"] + R"(;
        }
        QMenu::separator {
            height: 1px;
            background-color: )" + c["border_color"] + R"(;
            margin: 4px 10px;
        }
        
        QSlider::groove:horizontal {
            border: 1px solid )" + c["border_color"] + R"(;
            height: 6px;
            background: )" + c["button_bg"] + R"(;
            border-radius: )" + (radius > 0 ? "3" : "0") + R"(px;
        }
        QSlider::sub-page:horizontal {
            background: )" + c["primary_color"] + R"(;
            border-radius: )" + (radius > 0 ? "3" : "0") + R"(px;
        }
        QSlider::handle:horizontal {
            background: )" + c["primary_color"] + R"(;
            width: 14px;
            margin: -4px 0;
            border-radius: )" + (radius > 0 ? "7" : "0") + R"(px;
        }
        QSlider::handle:horizontal:hover {
            background: )" + c["primary_hover"] + R"(;
        }
    )";
}

#include "Cau_Hinh_Cai_Dat.h"
#include "../Cau_Hinh.h"

QString Cau_Hinh_Cai_Dat::getTranslation(const QString& section, const QString& lang, const QString& key) {
    return Cau_Hinh::getTranslation(section, lang, key);
}

QMap<QString, QString> Cau_Hinh_Cai_Dat::getThemeColors(const QString& themeName) {
    QMap<QString, QString> c;
    if (themeName == "Light") {
        c["window_bg"] = "#f3f3f3"; c["text_color"] = "#000000"; c["primary_color"] = "#0078d7";
        c["primary_hover_bg"] = "#108ee9"; c["primary_text"] = "#ffffff"; c["colored_button_text"] = "#ffffff";
        c["hover_bg"] = "#e5f1fb"; c["border_color"] = "#cccccc"; c["input_bg"] = "#ffffff";
        c["container_bg"] = "#ffffff"; c["container_border"] = "#dcdcdc"; c["header_color"] = "#0078d7";
        c["button_bg"] = "#e1e1e1"; c["button_border"] = "#adadad"; c["scroll_bg"] = "#f0f0f0";
        c["scroll_handle"] = "#cccccc"; c["scroll_handle_hover"] = "#bbbbbb"; c["row_hover_bg"] = "#ddeeff";
        c["row_hover_border"] = "#0078d7"; c["grid_item_bg"] = "#ffffff"; c["grid_item_border"] = "#dcdcdc";
        c["grid_item_hover_bg"] = "#eaf3fc"; c["grid_item_hover_border"] = "#0078d7";
        c["status_downloading"] = "#e69b00"; c["status_installing"] = "#0078d7"; c["status_completed"] = "#28a745";
        c["bg_tier1"] = "#FFFFFF"; c["bg_tier2"] = "#F5F5F5"; c["bg_tier3"] = "#E0E0E0";
    } else {
        c["window_bg"] = "#202020"; c["text_color"] = "#e0e0e0"; c["primary_color"] = "#0078d7";
        c["primary_hover_bg"] = "#108ee9"; c["primary_text"] = "#ffffff"; c["colored_button_text"] = "#ffffff";
        c["hover_bg"] = "#4a4a4a"; c["border_color"] = "#5a5a5a"; c["input_bg"] = "#2d2d2d";
        c["container_bg"] = "#282c34"; c["container_border"] = "#3c3c3c"; c["header_color"] = "#0078d7";
        c["button_bg"] = "#383838"; c["button_border"] = "#5a5a5a"; c["scroll_bg"] = "#202020";
        c["scroll_handle"] = "#4a4a4a"; c["scroll_handle_hover"] = "#5a5a5a"; c["row_hover_bg"] = "#3a3f4b";
        c["row_hover_border"] = "#0078d7"; c["grid_item_bg"] = "#2c313a"; c["grid_item_border"] = "#4a515e";
        c["grid_item_hover_bg"] = "#3a3f4b"; c["grid_item_hover_border"] = "#0078d7";
        c["status_downloading"] = "#f0ad4e"; c["status_installing"] = "#0078d7"; c["status_completed"] = "#5cb85c";
        c["bg_tier1"] = "#2D2D30"; c["bg_tier2"] = "#1E1E1E"; c["bg_tier3"] = "#121212";
    }
    return c;
}

QString Cau_Hinh_Cai_Dat::getBaseStyle(int radius) {
    return R"(
        * { outline: none; }
        QPushButton::menu-indicator, QComboBox::down-arrow { image: none; width: 0px; }
        QComboBox::drop-down { border: none; }
        QCheckBox { spacing: 5px; }
        QScrollArea { border: none; }
        QFrame#separatorLine { background-color: #e0e0e0; }
        QDialog QFrame#separatorLine { background-color: #dcdcdc; }
        QPushButton#selectAllButton { background-color: %tier2; color: %text_color; border: 1px solid %border_color; border-radius: 4px; padding: 8px; }
        QPushButton#selectAllButton:hover { background-color: %hover_bg; }
    )";
}

QString Cau_Hinh_Cai_Dat::getScrollbarStyle(const QMap<QString, QString>& c, int radius) {
    return QString(R"(
        QScrollBar:vertical { border: none; background: %1; width: 14px; margin: 0px; }
        QScrollBar::handle:vertical { background: %2; min-height: 25px; border-radius: 4px; margin: 3px; }
        QScrollBar::handle:vertical:hover { background: %3; }
        QScrollBar::handle:vertical:pressed { background: %4; }
        QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical { height: 0px; border: none; background: none; }
        QScrollBar::add-page:vertical, QScrollBar::sub-page:vertical { background: %1; }
    )").arg(c["bg_tier1"], c["scroll_handle"], c["scroll_handle_hover"], c["border_color"], QString::number(radius > 0 ? 4 : 0));
}

QString Cau_Hinh_Cai_Dat::getInstallerStyle(const QString& themeName, int radius) {
    QMap<QString, QString> c = getThemeColors(themeName);
    QString baseStyle = getBaseStyle(radius);
    QString scrollbarStyle = getScrollbarStyle(c, radius);
    
    QString br4 = radius > 0 ? "4" : "0";
    QString br5 = radius > 0 ? "5" : "0";
    QString br6 = radius > 0 ? "6" : "0";
    QString br8 = radius > 0 ? "8" : "0";
    
    QString style = baseStyle + scrollbarStyle + QString(R"(
        QWidget#rowContainer > *, QWidget#gridItem > * { background-color: transparent; }
        QWidget#headerContainer { background-color: %tier2; border-radius: %br6px; }
        QWidget#rowContainer { background-color: %tier1; border-bottom: 1px solid %separator_color; border-radius: 0px; margin: 0px; }
        QWidget#rowContainer:hover { background-color: %hover_bg; }
        QWidget#gridItem { background-color: %tier1; border-bottom: 1px solid %separator_color; border-radius: 0px; margin: 0px; }
        QWidget#gridItem:hover { background-color: %hover_bg; }
        QWidget#bottomBarWidget { background-color: %tier1; border-radius: %br8px; }
        QLabel.ListHeader { background-color: %tier2; color: %text_color; font-weight: bold; padding: 8px 10px; border-radius: %br4px; border-bottom-left-radius: 0px; border-bottom-right-radius: 0px; }
        Trinh_Cai_Dat, QDialog { background-color: transparent; }
        QLabel, QCheckBox, QTabBar::tab { color: %text_color; background: transparent; }
        QCheckBox { spacing: 5px; }
        QCheckBox::indicator { width: 16px; height: 16px; border: 1px solid %border_color; background: %tier2; border-radius: %br4px; }
        QCheckBox::indicator:hover { border: 1px solid %primary_color; }
        QCheckBox::indicator:checked { background: %primary_color; border: 1px solid %primary_color; }
        QPushButton#installBtn {
            background-color: %primary_color; color: %primary_text; border: 1px solid %primary_color;
            border-radius: %br5px; font-weight: bold; padding: 8px 20px;
        }
        QPushButton#installBtn:hover { background-color: %primary_hover_bg; }
        QLineEdit, QComboBox {
            min-height: 30px; padding-left: 5px; background: %input_bg;
            color: %text_color; border: 1px solid %border_color; border-radius: %br5px;
        }
        QComboBox::drop-down { border: none; }
        QComboBox QAbstractItemView {
            background-color: %input_bg;
            color: %text_color;
            border: 1px solid %border_color;
            border-radius: %br5px;
            outline: none;
        }
        QComboBox QAbstractItemView::item {
            border-bottom: 1px solid %separator_color;
            padding: 6px 10px;
            min-height: 25px;
        }
        QComboBox QAbstractItemView::item:selected {
            background-color: %primary_color;
            color: %primary_text;
        }
        QPushButton {
            background-color: %button_bg; color: %text_color; border: 1px solid %button_border;
            border-radius: %br5px; padding: 6px 12px;
        }
        QPushButton:hover { background-color: %hover_bg; }
        QPushButton#primaryBtn {
            background-color: %primary_color; color: %primary_text; border: none;
            border-radius: %br5px; padding: 6px 12px;
        }
        QPushButton#primaryBtn:hover { background-color: %primary_hover_bg; }
        QPushButton#settingsButton, QPushButton#addButton, QPushButton#removeButton, QPushButton#helpButton {
            background-color: transparent; border: 1px solid transparent; padding: 0px; border-radius: 18px;
        }
        QPushButton#settingsButton:hover, QPushButton#addButton:hover, QPushButton#removeButton:hover, QPushButton#helpButton:hover {
            background-color: rgba(128, 128, 128, 0.2); border: 1px solid transparent; border-radius: 18px;
        }
        QPushButton#acceptButton {
            background-color: %primary_color; color: %primary_text; border: none; border-radius: 5px; font-weight: bold; min-width: 80px; min-height: 28px; padding: 5px 10px;
        }
        QPushButton#acceptButton:hover { background-color: %primary_hover_bg; }
        QPushButton#cancelButton {
            background-color: %input_bg; color: %text_color; border: 1px solid %border_color; border-radius: 5px; font-weight: bold; min-width: 80px; min-height: 28px; padding: 5px 10px;
        }
        QPushButton#cancelButton:hover { background-color: %hover_bg; }
        QListWidget#sidebar {
            background-color: transparent; border: none; outline: none; padding-top: 10px;
        }
        QListWidget#sidebar::item {
            padding: 12px 15px; border-radius: %br8px; margin: 2px 10px; font-size: 11pt; font-weight: 500;
        }
        QListWidget#sidebar::item:hover {
            background-color: %hover_bg;
        }
        QListWidget#sidebar::item:selected {
            background-color: %primary_color; color: %primary_text;
        }
    )");

    style.replace("%window_bg", c["window_bg"])
       .replace("%text_color", c["text_color"])
       .replace("%primary_color", c["primary_color"])
       .replace("%primary_text", c["primary_text"])
       .replace("%primary_hover_bg", c["primary_hover_bg"])
       .replace("%input_bg", c["input_bg"])
       .replace("%border_color", c["border_color"])
       .replace("%button_border", c["button_border"])
       .replace("%button_bg", c["button_bg"])
       .replace("%hover_bg", c["hover_bg"])
       .replace("%container_border", c["container_border"])
       .replace("%separator_color", themeName == "Light" ? "#A0A0A0" : "#555555")
       .replace("%tier1", c["bg_tier1"])
       .replace("%tier2", c["bg_tier2"])
       .replace("%tier3", c["bg_tier3"])
       .replace("%br4px", br4 + "px")
       .replace("%br5px", br5 + "px")
       .replace("%br6px", br6 + "px")
       .replace("%br8px", br8 + "px");

    return style;
}

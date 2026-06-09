#include "Cau_Hinh_Go_Cai_Dat.h"
#include "../Cau_Hinh.h"

QString Cau_Hinh_Go_Cai_Dat::getTranslation(const QString& category, const QString& lang, const QString& key) {
    return Cau_Hinh::getTranslation("Uninstaller", lang, key);
}

QString Cau_Hinh_Go_Cai_Dat::getUninstallerStyle(const QString& themeName, int radius) {
    QMap<QString, QString> c = Cau_Hinh::getThemeColors(themeName);
    QString br4 = radius > 0 ? "4" : "0";
    QString br5 = radius > 0 ? "5" : "0";
    QString br6 = radius > 0 ? "6" : "0";
    QString br8 = radius > 0 ? "8" : "0";
    QString br20 = radius > 0 ? "20" : "0";

    QString tier1, tier2, tier3;
    if (themeName == "Dark") {
        tier1 = "#2A2A2A";
        tier2 = "#333333";
        tier3 = "#1E1E1E";
    } else {
        tier1 = "#F0F2F5";
        tier2 = "#E4E6EB";
        tier3 = "#FFFFFF";
    }
    QString textColor = c["text_color"];
    QString btnBg = c["primary_color"];
    QString btnHover = c["primary_hover_bg"];
    QString btnText = c["primary_text"];
    QString inputBg = c["input_bg"];
    QString borderColor = c["border_color"];

    QString style = QString(R"(
        Trinh_Go_Cai_Dat {
            background-color: transparent;
            color: %textColor; }
        QToolTip { background-color: %tier1; color: %textColor; border: 1px solid %borderColor; border-radius: %br4px; padding: 4px; }
        QLabel, QCheckBox { color: %textColor; background: transparent; }
        QScrollArea { background-color: transparent; border: none; }
        QScrollBar:vertical { border: none; background: %tier1; width: 14px; margin: 0px; }
        QScrollBar::handle:vertical { background: %borderColor; min-height: 25px; border-radius: %br4px; margin: 3px; }
        QScrollBar::handle:vertical:hover { background: %btnHover; }
        QScrollBar::handle:vertical:pressed { background: %btnBg; }
        QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical { height: 0px; border: none; background: none; }
        QScrollBar::add-page:vertical, QScrollBar::sub-page:vertical { background: %tier1; }
        #list_container { background-color: %tier1; border-bottom-left-radius: %br5px; border-bottom-right-radius: %br5px; }
        QLineEdit { background-color: %inputBg; color: %textColor; border: 1px solid %borderColor; border-radius: %br5px; padding: 5px; }
        QPushButton { background-color: %btnBg; color: %btnText; border: none; border-radius: %br5px; padding: 5px 15px; }
        QPushButton:hover { background-color: %btnHover; }
        QPushButton:disabled { background-color: %borderColor; color: #888888; }
        QCheckBox { spacing: 5px; }
        QCheckBox::indicator { width: 16px; height: 16px; border: 1px solid %borderColor; background: %inputBg; border-radius: %br4px; }
        QCheckBox::indicator:hover { border: 1px solid %btnBg; }
        QCheckBox::indicator:checked { background: %btnBg; border: 1px solid %btnBg; }
        #searchWidget { background-color: %tier1; border-radius: %br5px; }
        #bottomBarWidget { background-color: %tier2; border-radius: %br5px; }
        #headerContainer { background-color: %tier2; border-top-left-radius: %br4px; border-top-right-radius: %br4px; border-bottom-left-radius: 0px; border-bottom-right-radius: 0px; padding: 5px; }
        #headerContainer[active="true"] { background-color: %borderColor; }
        #appRow { background-color: transparent; border-bottom: 1px solid %borderColor; }
        #appRow:hover { background-color: %tier3; }
        #statusLabel { color: %textColor; }
        #scanningLabel { color: #F59E0B; font-style: italic; }
        #settingsButton { background-color: transparent; border-radius: %br6px; }
        #settingsButton:hover { background-color: %borderColor; }
        QListWidget#sidebar { background-color: transparent; border: none; outline: none; padding-top: 10px; }
        QListWidget#sidebar::item { padding: 12px 15px; border-radius: %br5px; margin: 2px 10px; font-size: 11pt; font-weight: 500; }
        QListWidget#sidebar::item:hover { background-color: %tier3; }
        QListWidget#sidebar::item:selected { background-color: %btnBg; color: %btnText; }
    )");

    return style.replace("%tier1", tier1).replace("%tier2", tier2).replace("%tier3", tier3)
                .replace("%textColor", textColor).replace("%btnBg", btnBg)
                .replace("%btnHover", btnHover).replace("%btnText", btnText)
                .replace("%inputBg", inputBg).replace("%borderColor", borderColor)
                .replace("%br4", br4).replace("%br5", br5)
                .replace("%br6", br6).replace("%br8", br8).replace("%br20", br20);
}

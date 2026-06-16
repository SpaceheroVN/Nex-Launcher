#pragma once

#include <QString>
#include <QMap>

class Cau_Hinh_Cai_Dat {
public:
    // Retrieve translated strings
    static QString getTranslation(const QString& section, const QString& lang, const QString& key);
    
    // Retrieve styles
    static QString getInstallerStyle(const QString& themeName, int radius = 0);
    
private:
    static QString getBaseStyle(int radius);
    static QString getScrollbarStyle(const QMap<QString, QString>& c, int radius);
    static QMap<QString, QString> getThemeColors(const QString& themeName);
    
};

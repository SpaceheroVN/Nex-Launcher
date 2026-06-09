#pragma once

#include <QString>
#include <QVariantMap>

class Cau_Hinh_Go_Cai_Dat {
public:
    static QString getTranslation(const QString& category, const QString& lang, const QString& key);
    static QString getUninstallerStyle(const QString& theme, int radius = 0);
};

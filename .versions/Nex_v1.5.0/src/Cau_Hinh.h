#ifndef CONFIG_H
#define CONFIG_H

#include <QString>
#include <QMap>

class Cau_Hinh {
public:
    static void loadTranslations();
    static QString getTranslation(const QString& section, const QString& lang, const QString& key);

    static QMap<QString, QString> getLauncherTranslations(const QString& lang);
    static QMap<QString, QString> getAboutTranslations(const QString& lang);
    static QMap<QString, QString> getInstallerTranslations(const QString& lang);
    static QMap<QString, QString> getThemeColors(const QString& theme_name);
    static QString getBaseStyle();
    static QString getLauncherStyle(const QString& theme_name, int radius = 15);

private:
    static QMap<QString, QMap<QString, QMap<QString, QString>>> translationsCache;
    static bool isLoaded;
};

#endif // CONFIG_H

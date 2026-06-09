#include "Cong_Cu_Go_Cai_Dat.h"
#include <Windows.h>
#include <QHBoxLayout>
#include <QLabel>
#include <QCheckBox>
#include <QIcon>
#include <QFileIconProvider>
#include <QFileInfo>
#include <QSet>
#include <QDateTime>
#include <QMouseEvent>
#include <QPushButton>
#include <QComboBox>
#include <QDirIterator>
#include <QTimer>

class ElidedLabel : public QLabel {
public:
    explicit ElidedLabel(const QString& text, QWidget* parent = nullptr) : QLabel(parent), m_text(text) {
        setToolTip(text);
        QLabel::setText(text);
        setMinimumWidth(10);
        setSizePolicy(QSizePolicy::Ignored, QSizePolicy::Preferred);
    }
    void setText(const QString& text) { m_text = text; setToolTip(text); QLabel::setText(text); }
protected:
    void resizeEvent(QResizeEvent* event) override {
        QLabel::setText(fontMetrics().elidedText(m_text, Qt::ElideRight, contentsRect().width()));
        QLabel::resizeEvent(event);
    }
private:
    QString m_text;
};

class UninstallerRowClickFilter : public QObject {
public:
    UninstallerRowClickFilter(QCheckBox* cb, QObject* parent) : QObject(parent), checkbox(cb) {}
protected:
    bool eventFilter(QObject* obj, QEvent* event) override {
        if (event->type() == QEvent::MouseButtonRelease) {
            QMouseEvent* mouseEvent = static_cast<QMouseEvent*>(event);
            if (mouseEvent->button() == Qt::LeftButton) {
                QWidget* widget = static_cast<QWidget*>(obj);
                QWidget* child = widget->childAt(mouseEvent->pos());
                if (!child || (!qobject_cast<QPushButton*>(child) && !qobject_cast<QComboBox*>(child) && !qobject_cast<QCheckBox*>(child))) {
                    checkbox->toggle();
                    return true;
                }
            }
        }
        return QObject::eventFilter(obj, event);
    }
private:
    QCheckBox* checkbox;
};

AppScannerWorker::AppScannerWorker(const QString& language, QObject *parent) 
    : QThread(parent), m_ngon_ngu(language) {}

void AppScannerWorker::scanRegistryKey(void* hKeyRoot, const QString& subKeyPath, QList<QVariantMap>& apps, QSet<QString>& seenNames) {
    HKEY hKey;
    if (RegOpenKeyExW((HKEY)hKeyRoot, (LPCWSTR)subKeyPath.utf16(), 0, KEY_READ, &hKey) == ERROR_SUCCESS) {
        DWORD subKeys = 0;
        DWORD maxSubKeyLen = 0;
        if (RegQueryInfoKeyW(hKey, NULL, NULL, NULL, &subKeys, &maxSubKeyLen, NULL, NULL, NULL, NULL, NULL, NULL) == ERROR_SUCCESS) {
            for (DWORD i = 0; i < subKeys; ++i) {
                wchar_t* subKeyName = new wchar_t[maxSubKeyLen + 1];
                DWORD nameLen = maxSubKeyLen + 1;
                if (RegEnumKeyExW(hKey, i, subKeyName, &nameLen, NULL, NULL, NULL, NULL) == ERROR_SUCCESS) {
                    HKEY hSubKey;
                    if (RegOpenKeyExW(hKey, subKeyName, 0, KEY_READ, &hSubKey) == ERROR_SUCCESS) {
                        wchar_t buf[2048];
                        DWORD bufSize = sizeof(buf);
                        QString displayName, uninstallString, publisher, installDate, displayIcon;
                        DWORD estimatedSize = 0;

                        if (RegQueryValueExW(hSubKey, L"DisplayName", NULL, NULL, (LPBYTE)buf, &bufSize) == ERROR_SUCCESS) {
                            displayName = QString::fromWCharArray(buf);
                        }
                        
                        bufSize = sizeof(buf);
                        if (RegQueryValueExW(hSubKey, L"UninstallString", NULL, NULL, (LPBYTE)buf, &bufSize) == ERROR_SUCCESS) {
                            WCHAR expandedBuf[MAX_PATH];
                            ExpandEnvironmentStringsW((LPCWSTR)buf, expandedBuf, MAX_PATH);
                            uninstallString = QString::fromWCharArray(expandedBuf);
                        }
                        
                        QString installLocation;
                        bufSize = sizeof(buf);
                        if (RegQueryValueExW(hSubKey, L"InstallLocation", NULL, NULL, (LPBYTE)buf, &bufSize) == ERROR_SUCCESS) {
                            installLocation = QString::fromWCharArray(buf);
                        }

                        // We need both a name and an uninstall string
                        if (!displayName.isEmpty() && !uninstallString.isEmpty() && !seenNames.contains(displayName)) {
                            seenNames.insert(displayName);
                            
                            bufSize = sizeof(buf);
                            if (RegQueryValueExW(hSubKey, L"Publisher", NULL, NULL, (LPBYTE)buf, &bufSize) == ERROR_SUCCESS) {
                                publisher = QString::fromWCharArray(buf);
                            }
                            
                            bufSize = sizeof(buf);
                            if (RegQueryValueExW(hSubKey, L"InstallLocation", NULL, NULL, (LPBYTE)buf, &bufSize) == ERROR_SUCCESS) {
                                WCHAR expandedBuf[MAX_PATH];
                                ExpandEnvironmentStringsW((LPCWSTR)buf, expandedBuf, MAX_PATH);
                                installLocation = QString::fromWCharArray(expandedBuf);
                            }

                            bufSize = sizeof(buf);
                            if (RegQueryValueExW(hSubKey, L"InstallDate", NULL, NULL, (LPBYTE)buf, &bufSize) == ERROR_SUCCESS) {
                                installDate = QString::fromWCharArray(buf);
                                // Format is usually YYYYMMDD
                                if (installDate.length() == 8) {
                                    int year = installDate.mid(0, 4).toInt();
                                    int month = installDate.mid(4, 2).toInt();
                                    int day = installDate.mid(6, 2).toInt();
                                    if (QDate(year, month, day).isValid()) {
                                        installDate = QString("%1-%2-%3").arg(installDate.mid(0,4), installDate.mid(4,2), installDate.mid(6,2));
                                    } else {
                                        installDate = ""; // Invalid date, fallback to file time
                                    }
                                }
                            }
                            
                            bufSize = sizeof(buf) - sizeof(WCHAR);
                            if (RegQueryValueExW(hSubKey, L"DisplayIcon", NULL, NULL, (LPBYTE)buf, &bufSize) == ERROR_SUCCESS) {
                                buf[bufSize / sizeof(WCHAR)] = L'\0';
                                WCHAR expandedBuf[1024];
                                ExpandEnvironmentStringsW((LPCWSTR)buf, expandedBuf, 1024);
                                displayIcon = QString::fromWCharArray(expandedBuf);
                                displayIcon.remove("\"");
                                int commaIdx = displayIcon.lastIndexOf(',');
                                if (commaIdx != -1) {
                                    // Make sure we only strip the comma if what follows is just numbers (the icon index)
                                    QString afterComma = displayIcon.mid(commaIdx + 1).trimmed();
                                    bool isNum = false;
                                    afterComma.toInt(&isNum);
                                    if (afterComma.isEmpty() || isNum || afterComma.startsWith("-")) {
                                        displayIcon = displayIcon.left(commaIdx);
                                    }
                                }
                                displayIcon = displayIcon.trimmed();
                            }
                            
                            // Fallback if empty or not exist
                            if (displayIcon.isEmpty() || !QFileInfo::exists(displayIcon)) {
                                QString uninstStr = uninstallString;
                                uninstStr.remove("\"");
                                int exeIdx = uninstStr.indexOf(".exe", 0, Qt::CaseInsensitive);
                                if (exeIdx != -1) {
                                    QString possibleExe = uninstStr.left(exeIdx + 4);
                                    if (QFileInfo::exists(possibleExe)) {
                                        displayIcon = possibleExe;
                                    }
                                }
                            }
                            
                            bufSize = sizeof(estimatedSize);
                            RegQueryValueExW(hSubKey, L"EstimatedSize", NULL, NULL, (LPBYTE)&estimatedSize, &bufSize);

                            DWORD systemComponent = 0;
                            bufSize = sizeof(systemComponent);
                            if (RegQueryValueExW(hSubKey, L"SystemComponent", NULL, NULL, (LPBYTE)&systemComponent, &bufSize) == ERROR_SUCCESS) {
                                if (systemComponent == 1) {
                                    RegCloseKey(hSubKey);
                                    continue;
                                }
                            }
                            
                            bool isEstimatedDate = false;
                            bool isEstimatedSize = false;
                            
                            QString dateSourcePath = installLocation;
                            QString sizeSourcePath = installLocation;

                            if (installLocation.isEmpty() || !QFileInfo::exists(installLocation)) {
                                QString possiblePath;
                                // Try uninstallString
                                QString uninstStr = uninstallString;
                                if (uninstStr.startsWith("\"")) {
                                    int endQuote = uninstStr.indexOf("\"", 1);
                                    if (endQuote != -1) {
                                        possiblePath = uninstStr.mid(1, endQuote - 1);
                                    }
                                } else {
                                    int exeIdx = uninstStr.indexOf(".exe", 0, Qt::CaseInsensitive);
                                    if (exeIdx != -1) {
                                        possiblePath = uninstStr.left(exeIdx + 4);
                                    }
                                }
                                
                                QFileInfo uninstInfo(possiblePath);
                                if (uninstInfo.exists() && uninstInfo.isFile()) {
                                    QString absPath = uninstInfo.absolutePath();
                                    dateSourcePath = absPath;
                                    // Don't use Package Cache or Temp folders for size estimation, as they are just installers
                                    if (!absPath.contains("Package Cache", Qt::CaseInsensitive) && !absPath.contains("Temp", Qt::CaseInsensitive)) {
                                        sizeSourcePath = absPath;
                                    }
                                }
                                
                                // Try displayIcon if still empty
                                if ((dateSourcePath.isEmpty() || !QFileInfo::exists(dateSourcePath)) && !displayIcon.isEmpty()) {
                                    QFileInfo iconInfo(displayIcon);
                                    if (iconInfo.exists() && iconInfo.isFile()) {
                                        QString absPath = iconInfo.absolutePath();
                                        dateSourcePath = absPath;
                                        if (!absPath.contains("Package Cache", Qt::CaseInsensitive) && !absPath.contains("Temp", Qt::CaseInsensitive)) {
                                            sizeSourcePath = absPath;
                                        }
                                    }
                                }
                            }

                            if ((installDate.isEmpty() || installDate.length() > 10) && !dateSourcePath.isEmpty() && QFileInfo::exists(dateSourcePath)) {
                                QFileInfo fi(dateSourcePath);
                                installDate = fi.birthTime().toString("yyyy-MM-dd");
                                isEstimatedDate = true;
                            }
                            
                            if (estimatedSize == 0 && !sizeSourcePath.isEmpty() && QFileInfo::exists(sizeSourcePath)) {
                                qulonglong size = 0;
                                QDirIterator it(sizeSourcePath, QDir::Files | QDir::NoSymLinks | QDir::Hidden | QDir::System, QDirIterator::Subdirectories);
                                while (it.hasNext()) {
                                    it.next();
                                    size += it.fileInfo().size();
                                }
                                estimatedSize = size / 1024; // convert to KB
                                isEstimatedSize = true;
                            }

                            bool isMicrosoftApp = publisher.contains("Microsoft", Qt::CaseInsensitive) || 
                                                  publisher.contains("Windows", Qt::CaseInsensitive);

                            QVariantMap app;
                            app["name"] = displayName;
                            app["uninstall_string"] = uninstallString;
                            app["publisher"] = publisher;
                            app["install_date"] = installDate;
                            app["size_kb"] = static_cast<qulonglong>(estimatedSize);
                            app["display_icon"] = displayIcon;
                            app["est_date"] = isEstimatedDate;
                            app["est_size"] = isEstimatedSize;
                            app["system_component"] = isMicrosoftApp;
                            apps.append(app);
                        }
                        RegCloseKey(hSubKey);
                    }
                }
                delete[] subKeyName;
            }
        }
        RegCloseKey(hKey);
    }
}

void AppScannerWorker::run() {
    QList<QVariantMap> apps;
    QSet<QString> seenNames;
    
    // HKLM 64-bit
    scanRegistryKey(HKEY_LOCAL_MACHINE, "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall", apps, seenNames);
    // HKLM 32-bit
    scanRegistryKey(HKEY_LOCAL_MACHINE, "Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall", apps, seenNames);
    // HKCU
    scanRegistryKey(HKEY_CURRENT_USER, "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall", apps, seenNames);
    
    emit finished(apps);
}

QWidget* Cong_Cu_Go_Cai_Dat::createAppRowWidget(const QVariantMap& appData, const QString& language, const QString& theme, QWidget* parent) {
    QWidget* rowWidget = new QWidget(parent);
    rowWidget->setObjectName("appRow");
    rowWidget->setProperty("isAppRow", true);
    rowWidget->setProperty("appName", appData.value("name").toString());
    rowWidget->setProperty("appInstallDate", appData.value("install_date").toString());
    rowWidget->setProperty("appSizeKb", appData.value("size_kb").toLongLong());
    rowWidget->setProperty("appSystemComponent", appData.value("system_component").toBool());
    
    QHBoxLayout* layout = new QHBoxLayout(rowWidget);
    layout->setContentsMargins(10, 5, 10, 5);
    layout->setSpacing(10);
    
    QCheckBox* cb = new QCheckBox(rowWidget);
    layout->addWidget(cb);
    
    QWidget* nameContainer = new QWidget(rowWidget);
    QHBoxLayout* nameLayout = new QHBoxLayout(nameContainer);
    nameLayout->setContentsMargins(0, 0, 0, 0);
    nameLayout->setSpacing(10);
    
    QLabel* iconLabel = new QLabel(nameContainer);
    iconLabel->setFixedSize(32, 32);
    
    QString iconPath = appData.value("display_icon").toString();
    iconLabel->setScaledContents(true);
    
    // Set placeholder first
    iconLabel->setPixmap(QIcon(":/icons/what_app.svg").pixmap(32, 32));
    nameLayout->addWidget(iconLabel);
    
    // Lazy load the real icon to prevent UI thread freezing
    static int loadCounter = 0;
    int delayMs = 10 + (loadCounter++ % 200) * 5;
    QTimer::singleShot(delayMs, iconLabel, [iconLabel, iconPath]() {
        QIcon appIcon;
        QString cleanPath = iconPath;
        if (cleanPath.startsWith("\"")) {
            int endQuote = cleanPath.indexOf("\"", 1);
            if (endQuote != -1) {
                cleanPath = cleanPath.mid(1, endQuote - 1);
            }
        } else {
            int exeIndex = cleanPath.indexOf(".exe", 0, Qt::CaseInsensitive);
            if (exeIndex != -1) {
                cleanPath = cleanPath.left(exeIndex + 4);
            }
        }
        
        if (!cleanPath.isEmpty() && QFileInfo::exists(cleanPath)) {
            if (cleanPath.endsWith(".ico", Qt::CaseInsensitive) || cleanPath.endsWith(".png", Qt::CaseInsensitive)) {
                appIcon = QIcon(cleanPath);
            } else {
                QFileIconProvider provider;
                appIcon = provider.icon(QFileInfo(cleanPath));
            }
        }
        
        if (!appIcon.isNull()) {
            QPixmap pix = appIcon.pixmap(32, 32);
            iconLabel->setPixmap(pix);
        }
    });
    
    ElidedLabel* nameLabel = new ElidedLabel(appData.value("name").toString(), nameContainer);
    nameLayout->addWidget(nameLabel, 1);
    
    layout->addWidget(nameContainer, 5);
    
    ElidedLabel* publisherLabel = new ElidedLabel(appData.value("publisher").toString(), rowWidget);
    publisherLabel->setContentsMargins(16, 0, 0, 0);
    layout->addWidget(publisherLabel, 3);
    
    QString warningColor = (theme == "Light") ? "#D97706" : "#FFC107";
    
    QLabel* dateLabel = new QLabel(appData.value("install_date").toString(), rowWidget);
    dateLabel->setContentsMargins(16, 0, 0, 0);
    if (appData.value("est_date").toBool()) {
        dateLabel->setStyleSheet(QString("color: %1;").arg(warningColor));
        dateLabel->setToolTip(language == "VN" ? "Ngày ước tính từ thư mục cài đặt" : "Estimated date from install folder");
    }
    layout->addWidget(dateLabel, 1);
    
    qint64 sizeKb = appData.value("size_kb").toLongLong();
    QString sizeStr = "";
    if (sizeKb > 0) {
        if (sizeKb > 1024) sizeStr = QString::number(sizeKb / 1024) + " MB";
        else sizeStr = QString::number(sizeKb) + " KB";
    }
    QLabel* sizeLabel = new QLabel(sizeStr, rowWidget);
    if (appData.value("est_size").toBool()) {
        sizeLabel->setStyleSheet(QString("color: %1;").arg(warningColor));
        sizeLabel->setToolTip(language == "VN" ? "Dung lượng ước lượng từ thư mục cài đặt" : "Estimated size from install folder");
    }
    sizeLabel->setAlignment(Qt::AlignRight | Qt::AlignVCenter);
    layout->addWidget(sizeLabel, 2);
    
    rowWidget->installEventFilter(new UninstallerRowClickFilter(cb, rowWidget));
    
    return rowWidget;
}

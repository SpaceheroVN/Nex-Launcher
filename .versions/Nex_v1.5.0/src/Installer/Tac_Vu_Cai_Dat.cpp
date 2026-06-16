#include "Tac_Vu_Cai_Dat.h"
#include <QProcess>
#include <QNetworkRequest>
#include <QNetworkAccessManager>
#include <QNetworkReply>
#include <QEventLoop>
#include <QFile>
#include <QFileInfo>
#include <QDir>
#include <QUrl>
#include <QRegularExpression>
#include <Windows.h>

Tac_Vu_Cai_Dat::Tac_Vu_Cai_Dat(const QVariantMap& item, const QString& tempDir, bool isUpdate, QObject *parent)
    : QObject(parent), m_item(item), m_thu_muc_tam(tempDir), m_isUpdate(isUpdate)
{
    m_name = m_item.value("name", "Unknown").toString();
}

bool Tac_Vu_Cai_Dat::isAppInstalled(const QString& appName) {
    QString lowerName = appName.toLower();
    
    struct RegPath {
        HKEY hive;
        LPCWSTR path;
    };
    
    RegPath paths[] = {
        {HKEY_LOCAL_MACHINE, L"Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall"},
        {HKEY_LOCAL_MACHINE, L"Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall"},
        {HKEY_CURRENT_USER, L"Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall"}
    };

    for (const auto& rp : paths) {
        HKEY hKey;
        if (RegOpenKeyExW(rp.hive, rp.path, 0, KEY_READ, &hKey) == ERROR_SUCCESS) {
            DWORD subKeys = 0;
            DWORD maxSubKeyLen = 0;
            if (RegQueryInfoKeyW(hKey, NULL, NULL, NULL, &subKeys, &maxSubKeyLen, NULL, NULL, NULL, NULL, NULL, NULL) == ERROR_SUCCESS) {
                for (DWORD i = 0; i < subKeys; ++i) {
                    wchar_t* subKeyName = new wchar_t[maxSubKeyLen + 1];
                    DWORD nameLen = maxSubKeyLen + 1;
                    if (RegEnumKeyExW(hKey, i, subKeyName, &nameLen, NULL, NULL, NULL, NULL) == ERROR_SUCCESS) {
                        HKEY hSubKey;
                        if (RegOpenKeyExW(hKey, subKeyName, 0, KEY_READ, &hSubKey) == ERROR_SUCCESS) {
                            wchar_t displayName[1024];
                            DWORD dataSize = sizeof(displayName);
                            if (RegQueryValueExW(hSubKey, L"DisplayName", NULL, NULL, (LPBYTE)displayName, &dataSize) == ERROR_SUCCESS) {
                                QString nameStr = QString::fromWCharArray(displayName);
                                if (nameStr.toLower().contains(lowerName)) {
                                    RegCloseKey(hSubKey);
                                    delete[] subKeyName;
                                    RegCloseKey(hKey);
                                    return true;
                                }
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
    return false;
}

void Tac_Vu_Cai_Dat::run() {
    if (!m_isUpdate && isAppInstalled(m_name)) {
        emit progress(m_name, "installed", QVariantMap());
        emit finished(m_name, true, false);
        return;
    }

    QVariantMap source = m_item.value("source").toMap();
    QString sourceType = source.value("type").toString();
    QString silentArgs = source.value("silent_args").toString();

    try {
        if (sourceType == "Winget") {
            emit progress(m_name, m_isUpdate ? "updating" : "installing", QVariantMap());
            QString packageId = source.value("value").toString();
            if (packageId.isEmpty()) throw std::runtime_error("Winget package ID is missing.");
            
            QProcess process;
            QStringList args;
            if (m_isUpdate) {
                args << "/c" << "start" << "/wait" << "winget" << "upgrade" << "--id" << packageId << "--accept-source-agreements" << "--accept-package-agreements";
                process.start("cmd.exe", args);
            } else {
                args << "install" << "--id" << packageId << "--silent" << "--accept-source-agreements" << "--accept-package-agreements";
                process.start("winget", args);
            }
            process.waitForFinished(-1); // Wait forever
            if (process.exitCode() != 0 && static_cast<quint32>(process.exitCode()) != 0x8A150101u) { // winget specific success/already installed codes
                if (process.exitCode() == 1618) throw std::runtime_error("1618");
                // If it fails we throw
                throw std::runtime_error("Winget installation/update failed.");
            }
        } 
        else if (sourceType == "Link") {
            QUrl url(source.value("value").toString());
            if (url.scheme().toLower() == "http") {
                url.setScheme("https"); // Auto-upgrade to HTTPS for security
            } else if (url.scheme().toLower() != "https") {
                throw std::runtime_error("Insecure or invalid URL scheme. Only HTTPS is allowed.");
            }
            
            emit progress(m_name, "downloading", QVariantMap{{"percent", 0}});
            
            QNetworkAccessManager manager;
            QNetworkRequest request(url);
            request.setHeader(QNetworkRequest::UserAgentHeader, "Mozilla/5.0");
            request.setAttribute(QNetworkRequest::RedirectPolicyAttribute, QNetworkRequest::NoLessSafeRedirectPolicy);
            
            QNetworkReply* reply = manager.get(request);
            
            QString fileName = url.fileName();
            if (fileName.isEmpty()) fileName = "installer.exe";
            m_downloadPath = QDir(m_thu_muc_tam).filePath(fileName);
            
            QFile file(m_downloadPath);
            if (!file.open(QIODevice::WriteOnly)) {
                reply->deleteLater();
                throw std::runtime_error("Failed to open temp file.");
            }

            QEventLoop loop;
            connect(reply, &QNetworkReply::readyRead, [&]() {
                file.write(reply->readAll());
            });
            connect(reply, &QNetworkReply::downloadProgress, this, &Tac_Vu_Cai_Dat::handleDownloadProgress);
            connect(reply, &QNetworkReply::finished, &loop, &QEventLoop::quit);
            loop.exec();
            
            if (reply->error() != QNetworkReply::NoError) {
                file.close();
                QString err = reply->errorString();
                reply->deleteLater();
                throw std::runtime_error("Download failed: " + err.toStdString());
            }
            
            file.flush();
            file.close();
            reply->deleteLater();
            
            emit progress(m_name, "installing", QVariantMap());
            QProcess process;
            process.setProgram(m_downloadPath);
            process.setArguments(silentArgs.split(" ", Qt::SkipEmptyParts));
            process.start();
            process.waitForFinished(-1);
            if (process.exitCode() != 0) {
                if (process.exitCode() == 1618) throw std::runtime_error("1618");
                throw std::runtime_error("Installer process failed.");
            }
        } 
        else if (sourceType == "Package") {
            QString path = source.value("value").toString();
            if (!QFileInfo::exists(path)) throw std::runtime_error("Package not found.");
            
            emit progress(m_name, "installing", QVariantMap());
            QProcess process;
            process.setProgram(path);
            process.setArguments(silentArgs.split(" ", Qt::SkipEmptyParts));
            process.start();
            process.waitForFinished(-1);
            if (process.exitCode() != 0) {
                if (process.exitCode() == 1618) throw std::runtime_error("1618");
                throw std::runtime_error("Installer process failed.");
            }
        } 
        else {
            throw std::runtime_error("Unknown source type.");
        }
        
        emit progress(m_name, "completed", QVariantMap());
        emit finished(m_name, true, false);
        
    } catch (const std::exception& e) {
        if (QString(e.what()) == "1618") {
            emit progress(m_name, "waiting", QVariantMap{{"detail", "Waiting in sequential queue..."}});
            emit finished(m_name, false, true);
        } else {
            emit finished(m_name, false, false);
        }
    }
}

void Tac_Vu_Cai_Dat::handleDownloadProgress(qint64 bytesReceived, qint64 bytesTotal) {
    if (bytesTotal > 0) {
        int percent = (bytesReceived * 100) / bytesTotal;
        emit progress(m_name, "downloading", QVariantMap{{"percent", percent}});
    }
}

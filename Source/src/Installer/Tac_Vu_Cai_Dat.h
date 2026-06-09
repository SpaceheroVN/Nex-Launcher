#pragma once

#include <QObject>
#include <QRunnable>
#include <QVariantMap>
#include <QString>

class Tac_Vu_Cai_Dat : public QObject, public QRunnable {
    Q_OBJECT
public:
    explicit Tac_Vu_Cai_Dat(const QVariantMap& item, const QString& tempDir, bool isUpdate = false, QObject *parent = nullptr);

    void run() override;

signals:
    void progress(const QString& name, const QString& status, const QVariantMap& details);
    void finished(const QString& name, bool success, bool retrySequentially);

private slots:
    void handleDownloadProgress(qint64 bytesReceived, qint64 bytesTotal);

private:
    bool isAppInstalled(const QString& appName);

    QVariantMap m_item;
    QString m_thu_muc_tam;
    QString m_name;
    QString m_downloadPath;
    bool m_isUpdate;
};

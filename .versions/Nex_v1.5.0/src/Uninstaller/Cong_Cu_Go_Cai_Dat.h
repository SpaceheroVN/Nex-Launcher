#pragma once

#include <QThread>
#include <QVariantMap>
#include <QWidget>

class AppScannerWorker : public QThread {
    Q_OBJECT
public:
    explicit AppScannerWorker(const QString& language, QObject *parent = nullptr);
    void run() override;

signals:
    void finished(const QList<QVariantMap>& apps);

private:
    QString m_ngon_ngu;
    void scanRegistryKey(void* hKeyRoot, const QString& subKeyPath, QList<QVariantMap>& apps, QSet<QString>& seenNames);
};

class Cong_Cu_Go_Cai_Dat {
public:
    static QWidget* createAppRowWidget(const QVariantMap& appData, const QString& language, const QString& theme, QWidget* parent);
};

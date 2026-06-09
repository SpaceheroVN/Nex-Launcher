#pragma once

#include <QDialog>
#include <QVariantMap>
#include <QCheckBox>
#include <QLabel>
#include <QProgressBar>
#include <QGridLayout>
#include <QThread>
#include <QPushButton>
#include <QRunnable>


class ConfirmUninstallDialog : public QDialog {
    Q_OBJECT
public:
    explicit ConfirmUninstallDialog(const QList<QVariantMap>& apps, const QString& theme, QWidget *parent = nullptr, const QString& lang = "EN");
    bool isAutoCleanupChecked() const;
    bool isCreateRestorePointChecked() const;
private:
    QCheckBox* m_autoCleanupCheckBox;
    QCheckBox* m_restorePointCheckBox;
};

class Tac_Vu_Go_Cai_Dat : public QObject, public QRunnable {
    Q_OBJECT
public:
    explicit Tac_Vu_Go_Cai_Dat(const QVariantMap& appData, bool silent, QObject *parent = nullptr);
    void run() override;

signals:
    void progress(const QString& name, const QString& status, const QString& detail);
    void finished(const QString& name, bool success);

private:
    QVariantMap m_appData;
    bool m_silent;
    QString m_name;
};

class UninstallProgressDialog : public QDialog {
    Q_OBJECT
public:
    explicit UninstallProgressDialog(int totalItems, const QString& theme, QWidget *parent, const QString& lang, bool alwaysOnTop);
    void setupItems(const QStringList& appNames);
    void updateItemStatus(const QString& appName, const QString& status, const QString& detail);
    void updateOverallProgress(int completedCount);
    void allDone();

private:
    QString m_lang;
    QGridLayout* gridLayout;
    QProgressBar* overallProgress;
    QPushButton* closeButton;
    QMap<QString, QLabel*> itemLabels;
};

struct LeftoverItem {
    QString path;
    QString type; // "File", "Folder", "Registry"
    QString appName;
};

class LeftoverScanner : public QObject, public QRunnable {
    Q_OBJECT
public:
    explicit LeftoverScanner(const QList<QVariantMap>& uninstalledApps, QObject *parent = nullptr);
    void run() override;

signals:
    void finished(const QList<LeftoverItem>& leftovers);

private:
    QList<QVariantMap> m_uninstalledApps;
    void scanForApp(const QVariantMap& appData, QList<LeftoverItem>& leftovers);
    bool isSafeToDelete(const QString& path);
};

class LeftoverCleanupDialog : public QDialog {
    Q_OBJECT
public:
    explicit LeftoverCleanupDialog(const QList<LeftoverItem>& items, const QString& theme, QWidget *parent, const QString& lang);
    QList<LeftoverItem> getSelectedItems() const;

private:
    QList<LeftoverItem> m_items;
    QList<QCheckBox*> m_checkboxes;
};

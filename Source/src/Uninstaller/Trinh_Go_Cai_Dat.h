#pragma once

#include <QWidget>
#include <QVariantMap>
#include <QList>
#include <QLineEdit>
#include <QPushButton>
#include <QScrollArea>
#include <QVBoxLayout>
#include <QCheckBox>
#include <QSystemTrayIcon>
#include <QThreadPool>
#include <QListWidget>
#include <QLabel>

class Chay_Nex;
class AppScannerWorker;
#include "Hop_Thoai_Go_Cai_Dat.h"

class Trinh_Go_Cai_Dat : public QWidget {
    Q_OBJECT
public:
    explicit Trinh_Go_Cai_Dat(const QString& language, const QString& theme, QWidget *parent = nullptr);
    ~Trinh_Go_Cai_Dat();

signals:
    void statusMessage(const QString& msg, int timeoutMs);

public slots:
    void cap_nhat_chu_de(const QString& theme);
    void cap_nhat_tieng(const QString& lang);
    void reloadConfig();
    void startScan();
    bool hasScanned() const { return m_hasScanned; }
    void setFilterCategory(int index);

private slots:
    void filterAppList(const QString& text);
    void populateAppList(const QList<QVariantMap>& apps);
    void uninstallSelected();
    void toggleAllVisible(bool checked);
    void khi_tien_trinh_cap_nhat(const QString& name, const QString& status, const QString& detail);
    void khi_tien_trinh_hoan_thanh(const QString& name, bool success);
    void onLeftoverScanFinished(const QList<LeftoverItem>& leftovers);
    void sortAppsBy(const QString& column);

private:
    void loadConfig();
    void saveConfig();
    void thiet_lap_giao_dien();
    void setupTrayIcon();
    void ap_dung_chu_de();
    void clearList();
    void sortAndRedisplayApps();
    void updateStatusLabel();
    void updateHeaderIcons();

    QString m_ngon_ngu;
    QString m_chu_de;
    bool m_hasScanned = false;
    bool m_isUninstalling;
    bool m_autoCleanup;

    QVariantMap m_config;
    QList<QVariantMap> m_allApps;
    QList<QVariantMap> m_uninstalledApps;
    QList<QWidget*> m_appRows;
    QMap<QString, QPushButton*> m_headerButtons;
    int m_totalItemsToUninstall;
    int m_so_luong_hoan_thanh;
    QString m_sortColumn = "name";
    bool m_sortAscending = true;

    QLineEdit* searchInput;
    QPushButton* refreshButton;
    QScrollArea* scrollArea;
    QWidget* listContainer;
    QVBoxLayout* listLayout;
    QCheckBox* selectAllHeaderCheck;
    QLabel* statusLabel;
    QPushButton* uninstallButton;
    QLabel* loadingLabel;
    QLabel* scanningLabel;
    
    // m_sidebar removed
    int m_currentCategory = 0;
    
    UninstallProgressDialog* m_hop_thoai_tien_trinh;
    QThreadPool* m_nhom_luong;
};

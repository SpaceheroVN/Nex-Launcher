#pragma once

#include <QWidget>
#include <QVariantMap>
#include <QList>
#include <QSystemTrayIcon>
#include <QTemporaryDir>
#include <QThreadPool>
#include <QListWidget>
#include <QStackedWidget>
#include <QComboBox>
#include <QPushButton>
#include <QLabel>
#include <QScrollArea>
#include <QVBoxLayout>
#include <QProcess>
#include <QCheckBox>
#include <QLineEdit>

class Chay_Nex;
class Hop_Thoai_Tien_Trinh;

class Trinh_Cai_Dat : public QWidget {
    Q_OBJECT
public:
    explicit Trinh_Cai_Dat(const QString& language, const QString& theme, QWidget *parent = nullptr);
    ~Trinh_Cai_Dat();

signals:
    void statusMessage(const QString& msg, int timeoutMs);

public slots:
    void cap_nhat_chu_de(const QString& theme);
    void cap_nhat_tieng(const QString& lang);
    void reloadConfig();

public slots:
    void setFilterCategory(int index);
    void them_muc_moi();
    void xoa_cac_muc_da_chon();
    void thuc_hien_tim_kiem(const QString& text);
    void cap_nhat_co_so_du_lieu();
    void thuc_hien_cai_dat();
    void sortAppsBy(const QString& column);
    void toggleAllVisible(bool checked);
    void filterAppList(const QString& text = "");
    
    // Worker slots
    void khi_tien_trinh_cap_nhat(const QString& name, const QString& status, const QVariantMap& details);
    void khi_tien_trinh_hoan_thanh(const QString& name, bool success, bool retrySequentially = false);
    
    void checkUpdates();
    void onUpdateCheckFinished(int exitCode, QProcess::ExitStatus exitStatus);

private:
    void initUI();
    void thiet_lap_bo_cuc();
    void tai_du_lieu();
    void luu_du_lieu();
    void ap_dung_chu_de();
    void cap_nhat_ngon_ngu();
    void lam_moi_cac_trang();
    void setupTrayIcon();
    void updateHeaderIcons();
    void sortAndRedisplayApps();

    QString m_ngon_ngu;
    QString m_chu_de;
    
    QList<QVariantMap> m_co_so_du_lieu;
    QVariantMap m_cai_dat;
    
    // Removed m_sidebar
    QWidget* headerContainer;
    QScrollArea* scrollArea;
    QWidget* listContainer;
    QVBoxLayout* listLayout;
    
    QProcess* m_updateProcess = nullptr;
    QLabel* m_updateStatusLabel = nullptr;
    
    QList<QWidget*> m_appRows;
    QMap<QString, QPushButton*> m_headerButtons;
    QCheckBox* selectAllHeaderCheck;
    
    QString m_sortColumn = "name";
    bool m_sortAscending = true;
    QString m_currentFilter = "all";
    
    QPushButton* m_nut_thuc_hien_cai;
    QLineEdit* m_o_tim_kiem;
    QPushButton* m_nut_them;
    QPushButton* m_nut_xoa;
    QPushButton* m_nut_cap_nhat;

    bool m_dang_cai_dat;
    int m_so_luong_hoan_thanh;
    int m_tong_so_can_cai;
    
    Hop_Thoai_Tien_Trinh* m_hop_thoai_tien_trinh = nullptr;
    
    QTemporaryDir* m_thu_muc_tam;
    QThreadPool* m_nhom_luong;
    
    QList<QVariantMap> m_itemsToInstall;
    QList<QVariantMap> m_sequentialQueue;
    int m_threads_finished = 0;
    int m_currentPhaseTotal = 0;
};

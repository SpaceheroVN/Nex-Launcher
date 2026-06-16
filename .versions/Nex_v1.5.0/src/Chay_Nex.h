#ifndef NEXLAUNCHER_H
#define NEXLAUNCHER_H

#include <QMainWindow>
#include <QPushButton>
#include <QToolButton>
#include <QLabel>
#include <QComboBox>
#include <QJsonObject>

#define APP_VERSION "Nex_v1.5"

#include <QStackedWidget>
#include <QSystemTrayIcon>
#include <QCheckBox>
#include <QTreeWidget>

// Forward declarations
class Trinh_Cai_Dat;
class Trinh_Go_Cai_Dat;

class Chay_Nex : public QMainWindow {
    Q_OBJECT

public:
    explicit Chay_Nex(QWidget *parent = nullptr);
    ~Chay_Nex();

    void showLauncher();

    static void setBlur(bool enable);

    static constexpr int SIDEBAR_WIDTH = 220;
    static constexpr int SIDEBAR_COLLAPSED = 60;
    static constexpr int SIDEBAR_EXPANDED = 220;
    void mousePressEvent(QMouseEvent *event) override;
    void mouseMoveEvent(QMouseEvent *event) override;
    void mouseReleaseEvent(QMouseEvent *event) override;
    void closeEvent(QCloseEvent *event) override;
    void resizeEvent(QResizeEvent* event) override;
    bool eventFilter(QObject *obj, QEvent *event) override;
    void changeEvent(QEvent *event) override;

private slots:
    void toggleSidebar();
    void hien_thi_hop_thoai_gioi_thieu();
    void kiem_tra_cap_nhat();
    void chuyen_trang(int index);
    void thiet_lap_ngon_ngu(const QString& lang);
    void chuyen_doi_luon_on_top(bool checked);
    void thiet_lap_chu_de(const QString& theme);
    void hien_thi_thong_bao_trang_thai(const QString& msg, int timeoutMs);

private:
    void thiet_lap_giao_dien();
    void ap_dung_cai_dat_ban_dau();
    void loadConfigOrSetDefaults();
    void createDefaultConfig();
    void saveConfig();
    void cap_nhat_ngon_ngu();
    void cap_nhat_mau_menu_chinh();
    void applyStyles();
    QWidget* sidebar;
    bool isSidebarMinimized = false;
    QPushButton* btnToggleSidebar;
    QString getCurrentTheme() const;
    void centerOnScreen();
    QString detectSystemLanguage() const;
    QString detectSystemTheme() const;
    QPixmap colorizePixmap(const QString& path, const QColor& color) const;

    QWidget* centralWidget;
    QWidget* topBarWidget;
    QPushButton* btnMinimize;
    QPushButton* btnMaximize;
    QPushButton* btnClose;
    QLabel* titleLabel;

    QTreeWidget* mainSidebarTree;

    QPushButton* btnMenu;
    QMenu* mainMenu;
    QAction* actionSettings;
    QAction* actionCheckUpdates;
    QAction* actionAbout;

    QStackedWidget* ngan_xep_chinh;
    
    QLabel* logoLabel;
    QLabel* versionLabel;
    
    QWidget* overlayWidget;
    QLabel* loadingLabel;

    QJsonObject config;
    QString configFilePath;
    QString appDataPath;
    QString installerDataFile;
    QString uninstallerDataFile;

    QPoint initialPos;
    bool isDragging;
    
    QSystemTrayIcon* bieu_tuong_khay_he_thong;
    QAction* showAction;
    QAction* installerAction;
    QAction* uninstallerAction;
    QAction* aboutAction;
    QAction* quitAction;

    Trinh_Cai_Dat* installerWidget;
    Trinh_Go_Cai_Dat* uninstallerWidget;
};

#endif // NEXLAUNCHER_H

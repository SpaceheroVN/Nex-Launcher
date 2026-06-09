#include "Chay_Nex.h"
#include "Gioi_Thieu.h"
#include "Cau_Hinh.h"
#include "Installer/Trinh_Cai_Dat.h"
#include "Uninstaller/Trinh_Go_Cai_Dat.h"
#include "Cai_Dat_Chung.h"
#include <QMenu>
#include <QButtonGroup>
#include <QGraphicsBlurEffect>

#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QMouseEvent>
#include <QPainter>
#include <QDir>
#include <QStandardPaths>
#include <QJsonDocument>
#include <QFile>
#include <QApplication>
#include <QScreen>
#include <QTimer>
#include <QLocale>
#include <QDesktopServices>
#include <QVersionNumber>
#include <QSettings>
#include <Windows.h>
#include <QNetworkAccessManager>
#include <QNetworkRequest>
#include <QNetworkReply>
#include <QEventLoop>
#include <QJsonArray>
#include <QJsonObject>
#include "NexMessageBox.h"
#include <QProgressDialog>
#include <QProcess>
#include <QUrl>
#include <QPropertyAnimation>
#include <QStyleFactory>
#include <QPainter>
#include <QGraphicsOpacityEffect>
#include <windows.h>

static Chay_Nex* g_instance = nullptr;
static int g_blurCount = 0;

Chay_Nex::Chay_Nex(QWidget *parent)
    : QMainWindow(parent), isDragging(false), installerWidget(nullptr), uninstallerWidget(nullptr)
{
    g_instance = this;
    setWindowIcon(QIcon(":/icons/logo.ico"));
    setAttribute(Qt::WA_TranslucentBackground);
    setWindowFlags(Qt::FramelessWindowHint | Qt::WindowSystemMenuHint | Qt::WindowMinimizeButtonHint | Qt::WindowMaximizeButtonHint);

    appDataPath = QStandardPaths::writableLocation(QStandardPaths::AppDataLocation) + "/Nex-Launcher";
    QDir().mkpath(appDataPath);
    
    configFilePath = appDataPath + "/launcher_config.json";
    installerDataFile = appDataPath + "/installer_data.json";
    uninstallerDataFile = appDataPath + "/uninstaller_data.json";

    if (!QFile::exists(uninstallerDataFile)) {
        QFile f(uninstallerDataFile);
        if (f.open(QIODevice::WriteOnly)) {
            f.write("{}");
            f.close();
        }
    }

    loadConfigOrSetDefaults();
    thiet_lap_giao_dien();
    ap_dung_cai_dat_ban_dau();
    
    resize(1100, 750);
    setMinimumSize(1100, 750);
    centerOnScreen();
}

Chay_Nex::~Chay_Nex() {
}

void Chay_Nex::mousePressEvent(QMouseEvent *event) {
    if (event->button() == Qt::LeftButton && !isMaximized()) {
        int currentSidebarWidth = SIDEBAR_WIDTH;
        if ((topBarWidget && topBarWidget->geometry().contains(event->pos())) || event->pos().x() < currentSidebarWidth) {
            initialPos = event->globalPosition().toPoint() - frameGeometry().topLeft();
            isDragging = true;
            event->accept();
        }
    }
}

void Chay_Nex::mouseMoveEvent(QMouseEvent *event) {
    if (isDragging) {
        move(event->globalPosition().toPoint() - initialPos);
        event->accept();
    }
}

void Chay_Nex::mouseReleaseEvent(QMouseEvent *event) {
    isDragging = false;
    event->accept();
}

QString Chay_Nex::detectSystemLanguage() const {
    QLocale locale;
    if (locale.name().startsWith("vi", Qt::CaseInsensitive)) {
        return "VN";
    }
    return "EN";
}

QString Chay_Nex::detectSystemTheme() const {
    QSettings settings("HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize", QSettings::NativeFormat);
    int value = settings.value("AppsUseLightTheme", 1).toInt();
    return (value > 0) ? "Light" : "Dark";
}

void Chay_Nex::loadConfigOrSetDefaults() {
    QFile file(configFilePath);
    if (file.exists() && file.size() > 0 && file.open(QIODevice::ReadOnly)) {
        QJsonDocument doc = QJsonDocument::fromJson(file.readAll());
        if (!doc.isNull() && doc.isObject()) {
            config = doc.object();
        } else {
            createDefaultConfig();
        }
        file.close();
    } else {
        createDefaultConfig();
    }
    
    // Apply Font Size
    int fontSize = config.value("font_size").toInt(10);
    QFont defaultFont = QApplication::font();
    defaultFont.setPointSize(fontSize);
    QApplication::setFont(defaultFont);
}

void Chay_Nex::createDefaultConfig() {
    config["language"] = detectSystemLanguage();
    config["theme"] = "System";
    
    // Auto-detect weak PC to disable heavy animations
    bool isWeakPc = false;
    MEMORYSTATUSEX memInfo;
    memInfo.dwLength = sizeof(MEMORYSTATUSEX);
    if (GlobalMemoryStatusEx(&memInfo)) {
        if (memInfo.ullTotalPhys <= 4294967296ull) { // 4GB or less
            isWeakPc = true;
        }
        
        // Calculate RAM usage percentage
        double ramUsagePercent = (double)(memInfo.ullTotalPhys - memInfo.ullAvailPhys) / memInfo.ullTotalPhys * 100.0;
        if (ramUsagePercent >= 85.0) { // RAM is > 85% full
            isWeakPc = true;
        }
    }
    
    SYSTEM_INFO sysInfo;
    GetSystemInfo(&sysInfo);
    if (sysInfo.dwNumberOfProcessors <= 2) { // 2 cores or less
        isWeakPc = true;
    }
    if (!config.contains("disable_animations")) {
        config["disable_animations"] = isWeakPc;
    }
    if (!config.contains("font_size")) {
        config["font_size"] = 10;
    }
    saveConfig();
}

void Chay_Nex::saveConfig() {
    QFile file(configFilePath);
    if (file.open(QIODevice::WriteOnly)) {
        QJsonDocument doc(config);
        file.write(doc.toJson());
        file.close();
    }
}

void Chay_Nex::thiet_lap_giao_dien() {
    centralWidget = new QWidget(this);
    centralWidget->setObjectName("centralWidget");
    setCentralWidget(centralWidget);

    QVBoxLayout* mainLayout = new QVBoxLayout(centralWidget);
    mainLayout->setContentsMargins(0, 0, 0, 0);
    mainLayout->setSpacing(0);

    // --- Top Bar (Title & Close) ---
    topBarWidget = new QWidget(this);
    topBarWidget->setObjectName("topBar");
    topBarWidget->setAttribute(Qt::WA_StyledBackground, true);
    topBarWidget->setFixedHeight(40);
    QHBoxLayout* topBarLayout = new QHBoxLayout(topBarWidget);
    topBarLayout->setContentsMargins(15, 0, 10, 0);
    
    // btnToggleSidebar removed

    titleLabel = new QLabel("Nex Launcher", this);
    titleLabel->setObjectName("titleLabel");
    
    btnMinimize = new QPushButton(this);
    btnMinimize->setIcon(QIcon(":/icons/minimize.svg"));
    btnMinimize->setObjectName("winCtrlButton");
    btnMinimize->setFixedSize(36, 28);
    connect(btnMinimize, &QPushButton::clicked, this, &Chay_Nex::showMinimized);

    btnMaximize = new QPushButton(this);
    btnMaximize->setIcon(QIcon(":/icons/maximize.svg"));
    btnMaximize->setObjectName("winCtrlButton");
    btnMaximize->setFixedSize(36, 28);
    connect(btnMaximize, &QPushButton::clicked, this, [this]() {
        if (isMaximized()) {
            hide();
            showNormal();
        } else {
            hide();
            showMaximized();
        }
    });

    btnMenu = new QPushButton(this);
    btnMenu->setIcon(QIcon(":/icons/menu.svg"));
    btnMenu->setObjectName("winCtrlButton");
    btnMenu->setFixedSize(36, 28);
    
    // Setup Menu
    mainMenu = new QMenu(this);
    
    actionSettings = new QAction("Settings...", this);
    connect(actionSettings, &QAction::triggered, this, [this]() {


        Cai_Dat_Chung dialog(config["language"].toString("EN"), getCurrentTheme(), this);
        if (dialog.exec() == QDialog::Accepted) {
            bool hasChanges = dialog.hasLauncherConfigChanged() || dialog.hasUninstallerConfigChanged() || dialog.hasInstallerConfigChanged();
            if (hasChanges) {
                QLabel* loadingLabel = new QLabel(config["language"].toString() == "VN" ? "Đang áp dụng thiết lập mới, vui lòng đợi..." : "Applying new settings, please wait...", this);
                loadingLabel->setStyleSheet("color: white; font-size: 20px; font-weight: bold; background: rgba(0, 0, 0, 0.6);");
                loadingLabel->setAlignment(Qt::AlignCenter);
                loadingLabel->setGeometry(0, 0, width(), height());
                loadingLabel->show();
                QApplication::processEvents();

                if (dialog.hasLauncherConfigChanged()) {
                    QJsonObject newConfig = QJsonObject::fromVariantMap(dialog.getLauncherConfig());
                    
                    QString oldLang = config["language"].toString("EN");
                    QString newLang = newConfig["language"].toString("EN");
                    
                    QString oldTheme = getCurrentTheme();
                    QString newTheme = newConfig["theme"].toString("Dark");
                    
                    bool oldTop = config["always_on_top"].toBool();
                    bool newTop = newConfig["always_on_top"].toBool();
                    
                    int oldFontSize = config["font_size"].toInt(10);
                    int newFontSize = newConfig["font_size"].toInt(10);
                    
                    config = newConfig;
                    saveConfig();
                    
                    if (oldFontSize != newFontSize) {
                        QFont defaultFont = QApplication::font();
                        defaultFont.setPointSize(newFontSize);
                        QApplication::setFont(defaultFont);
                    }
                    
                    if (oldLang != newLang) {
                        cap_nhat_ngon_ngu();
                    }
                    
                    if (oldTheme != newTheme) {
                        // Temporarily revert config to old theme so animation triggers correctly
                        config["theme"] = oldTheme;
                        thiet_lap_chu_de(newTheme);
                    }
                    
                    if (oldTop != newTop) {
                        chuyen_doi_luon_on_top(newTop);
                    }
                    applyStyles();
                }
                // Reload configs in modules if they exist
                if (installerWidget) installerWidget->reloadConfig();
                if (uninstallerWidget) uninstallerWidget->reloadConfig();

                loadingLabel->deleteLater();
            }
        }
    });
    mainMenu->addAction(actionSettings);
    mainMenu->addSeparator();
    
    actionCheckUpdates = new QAction("Check for Updates", this);
    connect(actionCheckUpdates, &QAction::triggered, this, &Chay_Nex::kiem_tra_cap_nhat);
    mainMenu->addAction(actionCheckUpdates);
    
    actionAbout = new QAction("About", this);
    connect(actionAbout, &QAction::triggered, this, &Chay_Nex::hien_thi_hop_thoai_gioi_thieu);
    mainMenu->addAction(actionAbout);
    
    btnMenu->setMenu(mainMenu);

    btnClose = new QPushButton(this);
    btnClose->setIcon(QIcon(":/icons/close.svg"));
    btnClose->setObjectName("closeButton");
    btnClose->setFixedSize(36, 28);
    btnClose->installEventFilter(this);
    connect(btnClose, &QPushButton::clicked, this, &Chay_Nex::close);

    btnToggleSidebar = new QPushButton(this);
    btnToggleSidebar->setObjectName("sidebarButton");
    btnToggleSidebar->setCursor(Qt::PointingHandCursor);
    btnToggleSidebar->setFixedSize(36, 28);
    connect(btnToggleSidebar, &QPushButton::clicked, this, &Chay_Nex::toggleSidebar);

    topBarLayout->addWidget(btnToggleSidebar);
    topBarLayout->addWidget(titleLabel);
    topBarLayout->addStretch();
    QFrame* topBarSeparator = new QFrame(this);
    topBarSeparator->setObjectName("topBarSeparator");
    topBarSeparator->setFixedSize(2, 20);
    
    topBarLayout->addWidget(btnMenu, 0, Qt::AlignVCenter);
    topBarLayout->addSpacing(8);
    topBarLayout->addWidget(topBarSeparator, 0, Qt::AlignVCenter);
    topBarLayout->addSpacing(8);
    topBarLayout->addWidget(btnMinimize);
    topBarLayout->addWidget(btnMaximize);
    topBarLayout->addWidget(btnClose);
    mainLayout->addWidget(topBarWidget);

    // --- Content Area ---
    QHBoxLayout* contentLayout = new QHBoxLayout();
    contentLayout->setContentsMargins(0, 0, 0, 0);
    contentLayout->setSpacing(0);

    // --- Sidebar ---
    sidebar = new QWidget(this);
    sidebar->setObjectName("sidebar");
    sidebar->setAttribute(Qt::WA_StyledBackground, true);
    sidebar->setMinimumWidth(SIDEBAR_WIDTH);
    sidebar->setMaximumWidth(SIDEBAR_WIDTH);
    QVBoxLayout* sidebarLayout = new QVBoxLayout(sidebar);
    sidebarLayout->setContentsMargins(10, 20, 10, 20);
    sidebarLayout->setSpacing(10);

    // App Logo in Sidebar
    logoLabel = new QLabel(this);
    logoLabel->setPixmap(QIcon(":/icons/logo.ico").pixmap(256, 256));
    logoLabel->setScaledContents(true);
    int logoSize = 80;
    logoLabel->setMinimumSize(logoSize, logoSize);
    logoLabel->setMaximumSize(logoSize, logoSize);
    sidebarLayout->addWidget(logoLabel, 0, Qt::AlignCenter);
    
    versionLabel = new QLabel("Nex Launcher v1.5", this);
    versionLabel->setObjectName("versionLabel");
    versionLabel->setAlignment(Qt::AlignCenter);
    QFont versionFont = versionLabel->font();
    versionFont.setBold(true);
    versionLabel->setFont(versionFont);
    sidebarLayout->addWidget(versionLabel);
    
    QWidget* versionSpacer = new QWidget(this);
    versionSpacer->setObjectName("versionSpacer");
    versionSpacer->setFixedHeight(10);
    sidebarLayout->addWidget(versionSpacer);
    
    QFrame* sidebarSeparator = new QFrame(this);
    sidebarSeparator->setObjectName("sidebarSeparator");
    sidebarSeparator->setFixedHeight(2);
    sidebarLayout->addWidget(sidebarSeparator);
    
    QWidget* bottomSpacer = new QWidget(this);
    bottomSpacer->setObjectName("bottomSpacer");
    bottomSpacer->setFixedHeight(10);
    sidebarLayout->addWidget(bottomSpacer);
    
    // Unified TreeWidget Sidebar
    mainSidebarTree = new QTreeWidget(this);
    mainSidebarTree->setObjectName("mainSidebarTree");
    mainSidebarTree->setHeaderHidden(true);
    mainSidebarTree->setIndentation(15);
    mainSidebarTree->setAnimated(false); // Fixes bug where rapid clicking collapses the tree permanently
    mainSidebarTree->setRootIsDecorated(false);
    mainSidebarTree->setVerticalScrollBarPolicy(Qt::ScrollBarAlwaysOff);
    mainSidebarTree->setHorizontalScrollBarPolicy(Qt::ScrollBarAlwaysOff);
    mainSidebarTree->setFocusPolicy(Qt::NoFocus); // Removes native cyan focus border line on Windows
    // Stylesheet is now applied dynamically in chuyen_doi_chu_de
    
    // Setup Installer Node
    QTreeWidgetItem* installerNode = new QTreeWidgetItem(mainSidebarTree);
    installerNode->setText(0, "Trình Cài Đặt");
    installerNode->setIcon(0, QIcon(":/icons/download.svg"));
    installerNode->setExpanded(true);
    
    QTreeWidgetItem* instAll = new QTreeWidgetItem(installerNode);
    instAll->setText(0, "Tất cả");
    
    QTreeWidgetItem* instApps = new QTreeWidgetItem(installerNode);
    instApps->setText(0, "Phần mềm");
    
    QTreeWidgetItem* instGames = new QTreeWidgetItem(installerNode);
    instGames->setText(0, "Trò chơi");
    
    QTreeWidgetItem* instUpdates = new QTreeWidgetItem(installerNode);
    instUpdates->setText(0, "Cập nhật");
    
    // Setup Uninstaller Node
    QTreeWidgetItem* uninstallerNode = new QTreeWidgetItem(mainSidebarTree);
    uninstallerNode->setText(0, "Trình Gỡ Cài Đặt");
    uninstallerNode->setIcon(0, QIcon(":/icons/trash.svg"));
    uninstallerNode->setExpanded(false);
    
    QTreeWidgetItem* uninstAll = new QTreeWidgetItem(uninstallerNode);
    uninstAll->setText(0, "Mọi chương trình");
    
    QTreeWidgetItem* uninstRecent = new QTreeWidgetItem(uninstallerNode);
    uninstRecent->setText(0, "Cài đặt gần đây");
    
    QTreeWidgetItem* uninstLarge = new QTreeWidgetItem(uninstallerNode);
    uninstLarge->setText(0, "Phần mềm lớn");
    
    QTreeWidgetItem* uninstSystem = new QTreeWidgetItem(uninstallerNode);
    uninstSystem->setText(0, "Hệ thống");
    
    QTreeWidgetItem* uninstThirdParty = new QTreeWidgetItem(uninstallerNode);
    uninstThirdParty->setText(0, "Bên ngoài");
    
    // Auto-select first item
    mainSidebarTree->setCurrentItem(instAll);
    
    connect(mainSidebarTree, &QTreeWidget::itemExpanded, this, [this, installerNode, uninstallerNode](QTreeWidgetItem* item) {
        // Nếu sidebar thu nhỏ, không cho expand
        if (isSidebarMinimized) {
            mainSidebarTree->blockSignals(true);
            item->setExpanded(false);
            mainSidebarTree->blockSignals(false);
            return;
        }
        // Khi một node expand, collapse node còn lại
        mainSidebarTree->blockSignals(true);
        if (item == installerNode) {
            uninstallerNode->setExpanded(false);
        } else if (item == uninstallerNode) {
            installerNode->setExpanded(false);
        }
        mainSidebarTree->blockSignals(false);
    });

    connect(mainSidebarTree, &QTreeWidget::itemCollapsed, this, [this, installerNode, uninstallerNode](QTreeWidgetItem* item) {
        if (!isSidebarMinimized) {
            // Giữ node active luôn expanded, dùng blockSignals để tránh re-trigger itemExpanded
            if ((item == installerNode && ngan_xep_chinh->currentIndex() == 0) ||
                (item == uninstallerNode && ngan_xep_chinh->currentIndex() == 1)) {
                mainSidebarTree->blockSignals(true);
                item->setExpanded(true);
                mainSidebarTree->blockSignals(false);
            }
        }
    });

    connect(mainSidebarTree, &QTreeWidget::itemClicked, this, [this, installerNode, uninstallerNode](QTreeWidgetItem* item, int column) {
        if (!item) return;
        
        QTreeWidgetItem* parent = item->parent();
        if (!parent) {
            if (!isSidebarMinimized) {
                if ((item == installerNode && ngan_xep_chinh->currentIndex() == 0) ||
                    (item == uninstallerNode && ngan_xep_chinh->currentIndex() == 1)) {
                    return; // Node này đang active, không làm gì cả
                }
                // Expand node được click, collapse node kia — dùng blockSignals để tránh double-trigger
                mainSidebarTree->blockSignals(true);
                if (item == installerNode) {
                    installerNode->setExpanded(true);
                    uninstallerNode->setExpanded(false);
                } else {
                    uninstallerNode->setExpanded(true);
                    installerNode->setExpanded(false);
                }
                mainSidebarTree->blockSignals(false);
                // Switch trang và chọn child đầu tiên trực tiếp, không qua signal chain
                if (item == installerNode) {
                    chuyen_trang(0);
                    if (installerWidget) installerWidget->setFilterCategory(0);
                    if (item->childCount() > 0) mainSidebarTree->setCurrentItem(item->child(0));
                } else if (item == uninstallerNode) {
                    chuyen_trang(1);
                    if (uninstallerWidget) uninstallerWidget->setFilterCategory(0);
                    if (item->childCount() > 0) mainSidebarTree->setCurrentItem(item->child(0));
                }
            } else {
                // Sidebar đang thu nhỏ: chỉ switch trang
                mainSidebarTree->setCurrentItem(item);
                if (item == installerNode) {
                    chuyen_trang(0);
                    if (installerWidget) installerWidget->setFilterCategory(0);
                } else if (item == uninstallerNode) {
                    chuyen_trang(1);
                    if (uninstallerWidget) uninstallerWidget->setFilterCategory(0);
                }
            }
            return;
        }
        
        if (parent == installerNode) {
            chuyen_trang(0);
            int index = installerNode->indexOfChild(item);
            if (installerWidget) installerWidget->setFilterCategory(index);
        } else if (parent == uninstallerNode) {
            chuyen_trang(1);
            int index = uninstallerNode->indexOfChild(item);
            if (uninstallerWidget) uninstallerWidget->setFilterCategory(index);
        }
    });
    
    mainSidebarTree->setSizePolicy(QSizePolicy::Expanding, QSizePolicy::Expanding);
    sidebarLayout->addWidget(mainSidebarTree, 1);

    contentLayout->addWidget(sidebar);

    // --- Main Stack ---
    ngan_xep_chinh = new QStackedWidget(this);
    ngan_xep_chinh->setObjectName("ngan_xep_chinh");
    
    QString lang = config["language"].toString("EN");
    QString theme = getCurrentTheme();
    
    installerWidget = new Trinh_Cai_Dat(lang, theme, this);
    connect(installerWidget, &Trinh_Cai_Dat::statusMessage, this, &Chay_Nex::hien_thi_thong_bao_trang_thai);
    
    uninstallerWidget = new Trinh_Go_Cai_Dat(lang, theme, this);
    connect(uninstallerWidget, &Trinh_Go_Cai_Dat::statusMessage, this, &Chay_Nex::hien_thi_thong_bao_trang_thai);

    ngan_xep_chinh->addWidget(installerWidget);
    ngan_xep_chinh->addWidget(uninstallerWidget);

    contentLayout->addWidget(ngan_xep_chinh, 1);
    mainLayout->addLayout(contentLayout, 1);
    
    // Setup Tray Icon
    bieu_tuong_khay_he_thong = new QSystemTrayIcon(this);
    bieu_tuong_khay_he_thong->setIcon(QIcon(":/icons/logo.ico"));
    QMenu* menu_khay_he_thong = new QMenu(this);
    
    showAction = menu_khay_he_thong->addAction("Show Nex Launcher");
    connect(showAction, &QAction::triggered, this, &Chay_Nex::showNormal);
    
    menu_khay_he_thong->addSeparator();
    
    installerAction = menu_khay_he_thong->addAction("Installer");
    connect(installerAction, &QAction::triggered, this, [this]() {
        showNormal();
        chuyen_trang(0);
    });
    
    uninstallerAction = menu_khay_he_thong->addAction("Uninstaller");
    connect(uninstallerAction, &QAction::triggered, this, [this]() {
        showNormal();
        chuyen_trang(1);
    });
    
    menu_khay_he_thong->addSeparator();
    
    aboutAction = menu_khay_he_thong->addAction("About");
    connect(aboutAction, &QAction::triggered, this, [this]() {
        showNormal();
        hien_thi_hop_thoai_gioi_thieu();
    });
    
    menu_khay_he_thong->addSeparator();
    
    quitAction = menu_khay_he_thong->addAction("Exit");
    connect(quitAction, &QAction::triggered, qApp, &QCoreApplication::quit);
    
    bieu_tuong_khay_he_thong->setContextMenu(menu_khay_he_thong);
    
    connect(bieu_tuong_khay_he_thong, &QSystemTrayIcon::activated, this, [this](QSystemTrayIcon::ActivationReason reason) {
        if (reason == QSystemTrayIcon::DoubleClick) {
            showNormal();
            activateWindow();
        }
    });
    
    bieu_tuong_khay_he_thong->show();

    // Overlay Widget
    overlayWidget = new QWidget(this);
    overlayWidget->setAttribute(Qt::WA_StyledBackground, true);
    overlayWidget->setStyleSheet("background-color: rgba(0, 0, 0, 150);");
    overlayWidget->hide();
    QVBoxLayout* overlayLayout = new QVBoxLayout(overlayWidget);
    loadingLabel = new QLabel("Loading Theme...", overlayWidget);
    loadingLabel->setStyleSheet("color: white; font-size: 24px; font-weight: bold; background: transparent;");
    loadingLabel->setAlignment(Qt::AlignCenter);
    overlayLayout->addWidget(loadingLabel);
}

void Chay_Nex::resizeEvent(QResizeEvent* event) {
    QMainWindow::resizeEvent(event);
    if (overlayWidget) overlayWidget->resize(event->size());
}

bool Chay_Nex::eventFilter(QObject *obj, QEvent *event) {
    if (obj == btnClose) {
        if (event->type() == QEvent::Enter) {
            btnClose->setIcon(QIcon(colorizePixmap(":/icons/close.svg", Qt::white)));
        } else if (event->type() == QEvent::Leave) {
            QColor iconColor = (getCurrentTheme() == "Light") ? QColor("#333333") : QColor(Qt::white);
            btnClose->setIcon(QIcon(colorizePixmap(":/icons/close.svg", iconColor)));
        }
    }
    return QMainWindow::eventFilter(obj, event);
}

void Chay_Nex::chuyen_doi_luon_on_top(bool checked) {
    config["always_on_top"] = checked;
    saveConfig();
#ifdef Q_OS_WIN
    if (checked) {
        SetWindowPos((HWND)winId(), HWND_TOPMOST, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE);
    } else {
        SetWindowPos((HWND)winId(), HWND_NOTOPMOST, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE);
    }
#else
    if (checked) {
        setWindowFlags(windowFlags() | Qt::WindowStaysOnTopHint);
    } else {
        setWindowFlags(windowFlags() & ~Qt::WindowStaysOnTopHint);
    }
    show();
#endif
}

void Chay_Nex::thiet_lap_ngon_ngu(const QString& lang) {
    if (config["language"].toString() != lang) {
        config["language"] = lang;
        saveConfig();
        cap_nhat_ngon_ngu();
    }
}

void Chay_Nex::cap_nhat_ngon_ngu() {
    QString lang = config["language"].toString("EN");
    QMap<QString, QString> t = Cau_Hinh::getLauncherTranslations(lang);
    titleLabel->setText("Nex Launcher");
    
    if (mainSidebarTree) {
        QTreeWidgetItem* instNode = mainSidebarTree->topLevelItem(0);
        if (instNode) {
            instNode->setText(0, t["installer_btn"]);
            if (instNode->childCount() >= 4) {
                QStringList viItems = {"Tất cả", "Phần mềm", "Trò chơi", "Cập nhật"};
                QStringList enItems = {"All", "Apps", "Games", "Updates"};
                QStringList& items = (lang == "VN") ? viItems : enItems;
                for (int i = 0; i < 4; ++i) {
                    instNode->child(i)->setText(0, items[i]);
                }
            }
        }
        QTreeWidgetItem* uninstNode = mainSidebarTree->topLevelItem(1);
        if (uninstNode) {
            uninstNode->setText(0, t["uninstaller_btn"]);
            if (uninstNode->childCount() >= 5) {
                QStringList viItems = {"Mọi chương trình", "Cài đặt gần đây", "Phần mềm lớn", "Hệ thống", "Bên ngoài"};
                QStringList enItems = {"All programs", "Recently installed", "Large programs", "System components", "Third-party"};
                QStringList& items = (lang == "VN") ? viItems : enItems;
                for (int i = 0; i < 5; ++i) {
                    uninstNode->child(i)->setText(0, items[i]);
                }
            }
        }
    }
    
    actionAbout->setText(t.value("about_btn", "About"));
    actionCheckUpdates->setText(t.value("update_btn", "Check for Updates"));
    
    // Update Menus
    actionSettings->setText(t.value("menu_settings", "Settings..."));
    
    showAction->setText(t.value("tray_show", "Show Nex Launcher"));
    installerAction->setText(t["installer_btn"]);
    uninstallerAction->setText(t["uninstaller_btn"]);
    aboutAction->setText(t.value("about_btn", "About"));
    quitAction->setText(t.value("tray_exit", "Exit"));
    
    if (installerWidget) installerWidget->cap_nhat_tieng(lang);
    if (uninstallerWidget) uninstallerWidget->cap_nhat_tieng(lang);
}

QString Chay_Nex::getCurrentTheme() const {
    QString themeSetting = config["theme"].toString("System");
    if (themeSetting == "System") {
        return detectSystemTheme();
    }
    return themeSetting;
}

void Chay_Nex::thiet_lap_chu_de(const QString& theme) {
    if (config["theme"].toString() != theme) {
        config["theme"] = theme;
        applyStyles();
        saveConfig();
    }
}

void Chay_Nex::changeEvent(QEvent *event) {
    if (event->type() == QEvent::WindowStateChange) {
        if (centralWidget) {
            centralWidget->setProperty("isMaximized", isMaximized());
            centralWidget->style()->unpolish(centralWidget);
            centralWidget->style()->polish(centralWidget);
            
            QWidget* sidebarWidget = centralWidget->findChild<QWidget*>("sidebar");
            if (sidebarWidget) { sidebarWidget->style()->unpolish(sidebarWidget); sidebarWidget->style()->polish(sidebarWidget); }
            
            QWidget* tbWidget = centralWidget->findChild<QWidget*>("topBar");
            if (tbWidget) { tbWidget->style()->unpolish(tbWidget); tbWidget->style()->polish(tbWidget); }
        }
        QColor iconColor = (getCurrentTheme() == "Light") ? QColor("#333333") : QColor(Qt::white);
        QString iconName = isMaximized() ? ":/icons/restore.svg" : ":/icons/maximize.svg";
        btnMaximize->setIcon(QIcon(colorizePixmap(iconName, iconColor)));
    }
    QMainWindow::changeEvent(event);
}

void Chay_Nex::applyStyles() {
    QString theme = getCurrentTheme();
    QMap<QString, QString> c = Cau_Hinh::getThemeColors(theme);
    
    QString tier0 = c["bg_tier0"];
    QString tier1 = c["bg_tier1"];
    QString tier2 = c["bg_tier2"];
    QString tier3 = c["bg_tier3"];

    QString sidebarBg = tier0;
    QString sidebarText = c["text_color"];
    QString sidebarHover = c["hover_bg"];
    QString sidebarBtnBg = tier0;
    QString sidebarBtnHover = c["hover_bg"];
    QString topBarBg = tier0;

    int borderRadius = config["border_radius"].toInt(15);

    int opacityPercent = config["window_opacity"].toInt(100);
    setWindowOpacity(opacityPercent / 100.0);

    QColor iconColor = (theme == "Light") ? QColor("#333333") : QColor(Qt::white);

    setStyleSheet(Cau_Hinh::getLauncherStyle(theme, borderRadius) + QString(R"(
        #centralWidget[isMaximized="false"] #sidebar { background-color: %1; border-bottom-left-radius: %7px; }
        #centralWidget[isMaximized="false"] #topBar { background-color: %2; border-top-left-radius: %7px; border-top-right-radius: %7px; }
        #centralWidget[isMaximized="true"] #sidebar { background-color: %1; border-bottom-left-radius: 0px; }
        #centralWidget[isMaximized="true"] #topBar { background-color: %2; border-top-left-radius: 0px; border-top-right-radius: 0px; }

        #sidebarButton { background-color: %5; color: %3; border: none; padding: 5px; border-radius: 4px; }
        #sidebarButton:hover { background-color: %6; }
        #topBarSeparator { border-left: 2px solid %9; background-color: transparent; }
        QMenu::separator { height: 1px; background-color: %8; margin: 4px 10px; }
    )").arg(sidebarBg, topBarBg, sidebarText, sidebarHover, sidebarBtnBg, sidebarBtnHover, QString::number(borderRadius), c["border_color"], iconColor.name()));
    
    btnMinimize->setIcon(QIcon(colorizePixmap(":/icons/minimize.svg", iconColor)));
    btnMaximize->setIcon(QIcon(colorizePixmap(":/icons/maximize.svg", iconColor)));
    btnClose->setIcon(QIcon(colorizePixmap(":/icons/close.svg", iconColor)));
    
    if (mainSidebarTree) {
        QString treeStyle = QString(
            "QTreeWidget { border: none; background: transparent; outline: none; show-decoration-selected: 0; }"
            "QTreeWidget::item { height: 35px; border-radius: 5px; margin: 2px 5px; color: %1; border: none; }"
            "QTreeWidget::item:hover { background: rgba(128, 128, 128, 0.1); border: none; }"
            "QTreeWidget::item:open:hover { background: transparent; border: none; }"
            "QTreeWidget::item:selected { background: rgba(128, 128, 128, 0.2); font-weight: bold; color: %1; border: none; }"
            "QTreeWidget::branch { background: transparent; border: none; image: none; }"
        ).arg(sidebarText);
        mainSidebarTree->setStyleSheet(treeStyle);
        cap_nhat_mau_menu_chinh();
    }
    
    btnMenu->setIcon(QIcon(colorizePixmap(":/icons/menu.svg", iconColor)));
    
    QString sidebarIcon = isSidebarMinimized ? ":/icons/sidebar-open.svg" : ":/icons/sidebar-close.svg";
    btnToggleSidebar->setIcon(QIcon(colorizePixmap(sidebarIcon, iconColor)));
    
    if (installerWidget) installerWidget->cap_nhat_chu_de(theme);
    if (uninstallerWidget) uninstallerWidget->cap_nhat_chu_de(theme);
}

void Chay_Nex::ap_dung_cai_dat_ban_dau() {
    QString lang = config["language"].toString("EN");
    QString theme = config["theme"].toString("System");
    
    if (centralWidget) {
        centralWidget->setProperty("isMaximized", isMaximized());
    }
    
    cap_nhat_ngon_ngu();
    applyStyles();
    chuyen_doi_luon_on_top(config["always_on_top"].toBool(false));
}

QPixmap Chay_Nex::colorizePixmap(const QString& path, const QColor& color) const {
    QPixmap pixmap(path);
    if (pixmap.isNull()) return pixmap;
    QPainter painter(&pixmap);
    painter.setCompositionMode(QPainter::CompositionMode_SourceIn);
    painter.fillRect(pixmap.rect(), color);
    painter.end();
    return pixmap;
}

void Chay_Nex::setBlur(bool enable) {
    if (!g_instance) return;
    if (enable) {
        g_blurCount++;
        if (g_blurCount == 1) {
            QGraphicsBlurEffect* blurEffect = new QGraphicsBlurEffect(g_instance);
            blurEffect->setBlurRadius(15);
            g_instance->centralWidget->setGraphicsEffect(blurEffect);
            
            if (!g_instance->overlayWidget) {
                g_instance->overlayWidget = new QWidget(g_instance);
            }
            int baseRadius = g_instance->config.contains("border_radius") ? g_instance->config["border_radius"].toInt() : 15;
            bool rounded = baseRadius > 0;
            int radius = (g_instance->isMaximized() || !rounded) ? 0 : baseRadius;
            g_instance->overlayWidget->setStyleSheet("background-color: rgba(0, 0, 0, 0.4); border-radius: " + QString::number(radius) + "px;");
            g_instance->overlayWidget->setGeometry(0, 0, g_instance->width(), g_instance->height());
            g_instance->overlayWidget->show();
        }
    } else {
        g_blurCount--;
        if (g_blurCount <= 0) {
            g_blurCount = 0;
            g_instance->centralWidget->setGraphicsEffect(nullptr);
            if (g_instance->overlayWidget) {
                g_instance->overlayWidget->hide();
            }
        }
    }
}

void Chay_Nex::chuyen_trang(int index) {
    if (index == 1 && uninstallerWidget && !uninstallerWidget->hasScanned()) {
        uninstallerWidget->startScan();
    }
    ngan_xep_chinh->setCurrentIndex(index);
    cap_nhat_mau_menu_chinh();
}

void Chay_Nex::cap_nhat_mau_menu_chinh() {
    if (!mainSidebarTree) return;
    
    // Dùng getCurrentTheme() để xử lý đúng cả trường hợp theme = "System"
    QString theme = getCurrentTheme();
    QMap<QString, QString> c = Cau_Hinh::getThemeColors(theme);
    QColor primaryColor(c["primary_color"]);
    QColor iconColor = (theme == "Light") ? QColor("#333333") : QColor(Qt::white);
    
    int currentIndex = ngan_xep_chinh->currentIndex();
    
    QTreeWidgetItem* instNode = mainSidebarTree->topLevelItem(0);
    if (instNode) {
        if (currentIndex == 0) {
            instNode->setForeground(0, QBrush(primaryColor));
            instNode->setIcon(0, QIcon(colorizePixmap(":/icons/download.svg", primaryColor)));
        } else {
            instNode->setForeground(0, QBrush(iconColor));
            instNode->setIcon(0, QIcon(colorizePixmap(":/icons/download.svg", iconColor)));
        }
    }
    
    QTreeWidgetItem* uninstNode = mainSidebarTree->topLevelItem(1);
    if (uninstNode) {
        if (currentIndex == 1) {
            uninstNode->setForeground(0, QBrush(primaryColor));
            uninstNode->setIcon(0, QIcon(colorizePixmap(":/icons/trash.svg", primaryColor)));
        } else {
            uninstNode->setForeground(0, QBrush(iconColor));
            uninstNode->setIcon(0, QIcon(colorizePixmap(":/icons/trash.svg", iconColor)));
        }
    }
}

void Chay_Nex::hien_thi_thong_bao_trang_thai(const QString& msg, int timeoutMs) {
    if (bieu_tuong_khay_he_thong) {
        bieu_tuong_khay_he_thong->showMessage("Nex Launcher", msg, QSystemTrayIcon::Information, timeoutMs);
    }
}

void Chay_Nex::toggleSidebar() {
    bool disableAnimations = config["disable_animations"].toBool(false);
    isSidebarMinimized = !isSidebarMinimized;
    
    int targetWidth = isSidebarMinimized ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;
    
    if (disableAnimations) {
        sidebar->setMinimumWidth(targetWidth);
        sidebar->setMaximumWidth(targetWidth);
    } else {
        QPropertyAnimation* animation = new QPropertyAnimation(sidebar, "minimumWidth");
        animation->setDuration(250);
        animation->setStartValue(sidebar->width());
        animation->setEndValue(targetWidth);
        animation->setEasingCurve(QEasingCurve::OutCubic);
        connect(animation, &QPropertyAnimation::valueChanged, this, [this](const QVariant& value) {
            sidebar->setMaximumWidth(value.toInt());
        });
        animation->start(QAbstractAnimation::DeleteWhenStopped);
    }
    
    // Mở lại sidebar: expand node đang active, dùng blockSignals để tránh trigger itemExpanded
    if (mainSidebarTree) {
        if (isSidebarMinimized) {
            QTreeWidgetItem* instNode = mainSidebarTree->topLevelItem(0);
            if (instNode) instNode->setExpanded(false);
            QTreeWidgetItem* uninstNode = mainSidebarTree->topLevelItem(1);
            if (uninstNode) uninstNode->setExpanded(false);
            logoLabel->hide();
            versionLabel->hide();
        } else {
            int currentIndex = ngan_xep_chinh->currentIndex();
            QTreeWidgetItem* node = mainSidebarTree->topLevelItem(currentIndex);
            if (node) {
                mainSidebarTree->blockSignals(true);
                node->setExpanded(true);
                mainSidebarTree->blockSignals(false);
            }
            logoLabel->show();
            versionLabel->show();
        }
    }
    
    // Chỉ update icon toggle thay vì gọi toàn bộ applyStyles() — tránh rebuild style không cần thiết
    QColor iconColor = (getCurrentTheme() == "Light") ? QColor("#333333") : QColor(Qt::white);
    QString sidebarIcon = isSidebarMinimized ? ":/icons/sidebar-open.svg" : ":/icons/sidebar-close.svg";
    btnToggleSidebar->setIcon(QIcon(colorizePixmap(sidebarIcon, iconColor)));
}


void Chay_Nex::hien_thi_hop_thoai_gioi_thieu() {
    QString lang = config["language"].toString("EN");
    QString theme = getCurrentTheme();
    Gioi_Thieu dialog(this, lang, theme);
    dialog.exec();
}

void Chay_Nex::kiem_tra_cap_nhat() {
    QNetworkAccessManager* manager = new QNetworkAccessManager(this);
    QNetworkRequest request(QUrl("https://api.github.com/repos/SpaceheroVN/Nex-Launcher/releases/latest"));
    request.setHeader(QNetworkRequest::UserAgentHeader, "Nex-Launcher-Updater");
    
    QNetworkReply* reply = manager->get(request);
    
    connect(reply, &QNetworkReply::finished, this, [this, manager, reply]() {
        reply->deleteLater();
        if (reply->error() == QNetworkReply::NoError) {
            QJsonDocument doc = QJsonDocument::fromJson(reply->readAll());
            QJsonObject obj = doc.object();
            QString latestVersion = obj.value("name").toString();
            
            if (!latestVersion.isEmpty()) {
                QString currentStr = APP_VERSION; currentStr.remove("Nex_v");
                QString latestStr = latestVersion; latestStr.remove("Nex_v");
                QVersionNumber currentV = QVersionNumber::fromString(currentStr);
                QVersionNumber latestV = QVersionNumber::fromString(latestStr);
                
                QString lang = config["language"].toString("EN");
                
                if (latestV > currentV) {
                    QString title = (lang == "VN") ? "Cập nhật ứng dụng" : "Update Available";
                    QString msg = (lang == "VN") ? "Đã có phiên bản mới (" + latestVersion + "). Bạn có muốn tải xuống và cài đặt không?" 
                                                 : "A new version (" + latestVersion + ") is available. Do you want to download and install it?";
                    if (NexMessageBox::question(this, title, msg) == NexMessageBox::Yes) {
                        QString downloadUrl;
                        QJsonArray assets = obj.value("assets").toArray();
                        for (const QJsonValue& asset : assets) {
                            QString name = asset.toObject().value("name").toString();
                            if (name.endsWith(".exe")) {
                                downloadUrl = asset.toObject().value("browser_download_url").toString();
                                break;
                            }
                        }
                    
                        if (!downloadUrl.isEmpty()) {
                            QProgressDialog* progress = new QProgressDialog("Downloading update...", "Cancel", 0, 100, this);
                            progress->setWindowModality(Qt::WindowModal);
                            progress->setAttribute(Qt::WA_DeleteOnClose);
                            progress->show();
                            
                            QNetworkReply* dlReply = manager->get(QNetworkRequest(QUrl(downloadUrl)));
                            connect(dlReply, &QNetworkReply::downloadProgress, progress, [progress](qint64 bytesRead, qint64 totalBytes){
                                if (totalBytes > 0) progress->setValue((bytesRead * 100) / totalBytes);
                            });
                            connect(progress, &QProgressDialog::canceled, dlReply, &QNetworkReply::abort);
                            
                                    QString appDataPath = QStandardPaths::writableLocation(QStandardPaths::AppDataLocation);
                                    QDir().mkpath(appDataPath);
                                    QString tempPath = appDataPath + "/Nex-Launcher_Update.exe";
                                    
                                    QFile* file = new QFile(tempPath);
                                    if (!file->open(QIODevice::WriteOnly)) {
                                        delete file;
                                        NexMessageBox::critical(this, "Error", "Failed to write update file.");
                                        dlReply->deleteLater();
                                        manager->deleteLater();
                                        return;
                                    }
                                    
                                    connect(dlReply, &QNetworkReply::readyRead, [dlReply, file]() {
                                        if (file->isOpen()) {
                                            file->write(dlReply->readAll());
                                        }
                                    });
                                    
                                    connect(dlReply, &QNetworkReply::finished, this, [this, manager, dlReply, progress, file, tempPath]() {
                                        if (file->isOpen()) {
                                            file->close();
                                        }
                                        delete file;
                                        
                                        dlReply->deleteLater();
                                        manager->deleteLater();
                                        if (progress) progress->close();
                                        
                                        if (dlReply->error() == QNetworkReply::NoError) {
                                            QProcess::startDetached(tempPath, QStringList());
                                            QApplication::quit();
                                        } else {
                                            if (dlReply->error() != QNetworkReply::OperationCanceledError) {
                                                NexMessageBox::critical(this, "Error", "Failed to download update.");
                                            }
                                        }
                                    });
                            return; // Manager deleted in nested slot
                        } else {
                            NexMessageBox::warning(this, "Update", "No installer (.exe) found in the latest release.");
                        }
                    }
                } else {
                    QString title = (lang == "VN") ? "Cập nhật ứng dụng" : "Update Check";
                    QString msg = (lang == "VN") ? "Đây đã là bản mới nhất rồi." : "This is already the latest version.";
                    NexMessageBox::information(this, title, msg);
                }
            } else {
                NexMessageBox::information(this, "Up to date", "You are already running the latest version.");
            }
        } else {
            NexMessageBox::critical(this, "Error", "Failed to check for updates: " + reply->errorString());
        }
        manager->deleteLater();
    });
}

void Chay_Nex::showLauncher() {
    show();
    QTimer::singleShot(0, this, &Chay_Nex::centerOnScreen);
}

void Chay_Nex::centerOnScreen() {
    if (QScreen *screen = QGuiApplication::primaryScreen()) {
        QRect screenGeometry = screen->availableGeometry();
        int x = screenGeometry.x() + (screenGeometry.width() - width()) / 2;
        int y = screenGeometry.y() + (screenGeometry.height() - height()) / 2;
        move(x, y);
    }
}

void Chay_Nex::closeEvent(QCloseEvent *event) {
    bool minimize_to_tray = config.contains("minimize_to_tray") ? config["minimize_to_tray"].toBool() : true;
    if (bieu_tuong_khay_he_thong && bieu_tuong_khay_he_thong->isVisible() && minimize_to_tray) {
        hide();
        event->ignore();
    } else {
        event->accept();
    }
}
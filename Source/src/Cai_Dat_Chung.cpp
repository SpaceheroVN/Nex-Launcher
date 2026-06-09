#include "Cai_Dat_Chung.h"
#include "Cau_Hinh.h"
#include <QHBoxLayout>
#include <QVBoxLayout>
#include <QLabel>
#include <QFile>
#include <QJsonDocument>
#include <QJsonObject>
#include <QStandardPaths>
#include <QGraphicsDropShadowEffect>
#include <QComboBox>
#include <QScrollArea>
#include <QScrollBar>
#include <QFormLayout>
#include <QDir>
#include "NexMessageBox.h"

Cai_Dat_Chung::Cai_Dat_Chung(const QString& currentLang, const QString& currentTheme, QWidget *parent)
    : QDialog(parent), m_lang(currentLang), m_theme(currentTheme),
      m_launcherConfigChanged(false), m_uninstallerConfigChanged(false), m_installerConfigChanged(false)
{
    setWindowFlags(windowFlags() | Qt::FramelessWindowHint | Qt::NoDropShadowWindowHint);
    setAttribute(Qt::WA_TranslucentBackground);

    QMap<QString, QString> c = Cau_Hinh::getThemeColors(m_theme);
    QPalette pal = palette();
    pal.setColor(QPalette::Window, QColor(c["window_bg"]));
    setPalette(pal);
    setAutoFillBackground(true);
    
    setWindowTitle(Cau_Hinh::getTranslation("Launcher", m_lang, "menu_settings"));
    setFixedSize(700, 480);
    
    loadConfig();
    thiet_lap_giao_dien();
    applyStyles();
}

Cai_Dat_Chung::~Cai_Dat_Chung() {}

#include <QEvent>

bool Cai_Dat_Chung::eventFilter(QObject *obj, QEvent *event) {
    if (event->type() == QEvent::Wheel) {
        if (obj == langCombo || obj == fontSizeSlider || obj == opacitySlider) {
            return true;
        }
    }
    return QDialog::eventFilter(obj, event);
}

void Cai_Dat_Chung::loadConfig() {
    QString appDataPath = QStandardPaths::writableLocation(QStandardPaths::AppDataLocation) + "/Nex-Launcher";
    
    // Load Launcher config
    QString launcherPath = appDataPath + "/launcher_config.json";
    QFile launcherFile(launcherPath);
    if (launcherFile.open(QIODevice::ReadOnly)) {
        QJsonObject obj = QJsonDocument::fromJson(launcherFile.readAll()).object();
        for (auto it = obj.begin(); it != obj.end(); ++it) {
            m_launcherConfig[it.key()] = it.value().toVariant();
        }
        launcherFile.close();
    }
    
    // Default Launcher values
    if (!m_launcherConfig.contains("language")) m_launcherConfig["language"] = "EN";
    if (!m_launcherConfig.contains("theme")) m_launcherConfig["theme"] = "System";
    if (!m_launcherConfig.contains("always_on_top")) m_launcherConfig["always_on_top"] = false;
    if (!m_launcherConfig.contains("minimize_to_tray")) m_launcherConfig["minimize_to_tray"] = true;

    // Load Uninstaller config
    QString uninstallerPath = appDataPath + "/uninstaller_config.json";
    QFile uninstallerFile(uninstallerPath);
    if (uninstallerFile.open(QIODevice::ReadOnly)) {
        QJsonObject obj = QJsonDocument::fromJson(uninstallerFile.readAll()).object();
        for (auto it = obj.begin(); it != obj.end(); ++it) {
            m_uninstallerConfig[it.key()] = it.value().toVariant();
        }
        uninstallerFile.close();
    }
    
    // Default Uninstaller values
    if (!m_uninstallerConfig.contains("silent_uninstall")) m_uninstallerConfig["silent_uninstall"] = true;
    if (!m_uninstallerConfig.contains("show_confirmation")) m_uninstallerConfig["show_confirmation"] = true;
    if (!m_uninstallerConfig.contains("show_progress_dialog")) m_uninstallerConfig["show_progress_dialog"] = true;
    if (!m_uninstallerConfig.contains("minimize_on_close")) m_uninstallerConfig["minimize_on_close"] = true;

    // Load Installer config
    QString installerPath = appDataPath + "/installer_config.json";
    QFile installerFile(installerPath);
    if (installerFile.open(QIODevice::ReadOnly)) {
        QJsonObject obj = QJsonDocument::fromJson(installerFile.readAll()).object();
        for (auto it = obj.begin(); it != obj.end(); ++it) {
            m_installerConfig[it.key()] = it.value().toVariant();
        }
        installerFile.close();
    }
    
    // Default Installer values
    if (!m_installerConfig.contains("multi_thread")) m_installerConfig["multi_thread"] = true;
    if (!m_installerConfig.contains("auto_select_all")) m_installerConfig["auto_select_all"] = true;
    if (!m_installerConfig.contains("minimize_on_close")) m_installerConfig["minimize_on_close"] = true;
    if (!m_installerConfig.contains("detailed_categories")) m_installerConfig["detailed_categories"] = false;
    if (!m_installerConfig.contains("show_progress_dialog")) m_installerConfig["show_progress_dialog"] = true;
    if (!m_installerConfig.contains("hide_unsupported")) m_installerConfig["hide_unsupported"] = false;
    if (!m_installerConfig.contains("show_complete_dialog")) m_installerConfig["show_complete_dialog"] = true;
}

void Cai_Dat_Chung::thiet_lap_giao_dien() {
    QHBoxLayout* mainLayout = new QHBoxLayout(this);
    mainLayout->setContentsMargins(0, 0, 0, 0);
    mainLayout->setSpacing(0);
    
    // Sidebar
    QWidget* sidebarContainer = new QWidget(this);
    sidebarContainer->setObjectName("settingsSidebar");
    sidebarContainer->setFixedWidth(200);
    QVBoxLayout* sidebarLayout = new QVBoxLayout(sidebarContainer);
    sidebarLayout->setContentsMargins(0, 20, 0, 0);
    
    sidebarList = new QListWidget(this);
    sidebarList->setObjectName("settingsList");
    
    QString uiTabName = m_lang == "VN" ? "Giao diện người dùng" : "User Interface";
    QString genTabName = m_lang == "VN" ? "Chung" : "General";
    QString inTabName = Cau_Hinh::getTranslation("Launcher", m_lang, "installer_btn");
    QString unTabName = Cau_Hinh::getTranslation("Launcher", m_lang, "uninstaller_btn");
    
    sidebarList->addItem(uiTabName);
    sidebarList->addItem(genTabName);
    sidebarList->addItem(inTabName);
    sidebarList->addItem(unTabName);
    sidebarList->addItem(m_lang == "VN" ? "Trợ giúp" : "Help");
    
    sidebarLayout->addWidget(sidebarList);
    mainLayout->addWidget(sidebarContainer);
    
    // Content area
    QWidget* contentContainer = new QWidget(this);
    contentContainer->setObjectName("settingsContent");
    QVBoxLayout* contentLayout = new QVBoxLayout(contentContainer);
    contentLayout->setContentsMargins(10, 30, 30, 20);
    
    scrollArea = new QScrollArea(this);
    scrollArea->setWidgetResizable(true);
    scrollArea->setFrameShape(QFrame::NoFrame);
    scrollArea->setHorizontalScrollBarPolicy(Qt::ScrollBarAlwaysOff);
    
    QWidget* scrollContent = new QWidget();
    scrollContent->setObjectName("settingsScrollContent");
    QVBoxLayout* scrollLayout = new QVBoxLayout(scrollContent);
    scrollLayout->setSpacing(40);
    
    QWidget* uiTab = createUiTab();
    QWidget* genTab = createGeneralTab();
    QWidget* instTab = createInstallerTab();
    QWidget* uninstTab = createUninstallerTab();
    QWidget* helpTab = createHelpTab();
    
    sectionWidgets << uiTab << genTab << instTab << uninstTab << helpTab;
    
    connect(scrollArea->verticalScrollBar(), &QScrollBar::valueChanged, this, &Cai_Dat_Chung::onScrollValueChanged);
    
    scrollLayout->addWidget(uiTab);
    scrollLayout->addWidget(genTab);
    scrollLayout->addWidget(instTab);
    scrollLayout->addWidget(uninstTab);
    scrollLayout->addWidget(helpTab);
    scrollLayout->addStretch();
    
    scrollArea->setWidget(scrollContent);
    contentLayout->addWidget(scrollArea);
    
    QWidget* bottomWidget = new QWidget(this);
    bottomWidget->setObjectName("settingsBottomBar");
    QHBoxLayout* btnLayout = new QHBoxLayout(bottomWidget);
    btnLayout->setContentsMargins(20, 15, 20, 15);
    
    QPushButton* resetBtn = new QPushButton(m_lang == "VN" ? "Đặt lại" : "Reset", this);
    resetBtn->setObjectName("resetButton");
    connect(resetBtn, &QPushButton::clicked, this, &Cai_Dat_Chung::resetSettings);
    
    btnLayout->addWidget(resetBtn);
    btnLayout->addStretch();
    
    QPushButton* cancelBtn = new QPushButton(m_lang == "VN" ? "Hủy bỏ" : "Cancel", this);
    cancelBtn->setObjectName("cancelButton");
    connect(cancelBtn, &QPushButton::clicked, this, &QDialog::reject);
    
    QPushButton* acceptBtn = new QPushButton(m_lang == "VN" ? "Xác nhận" : "Accept", this);
    acceptBtn->setObjectName("acceptButton");
    connect(acceptBtn, &QPushButton::clicked, this, &Cai_Dat_Chung::saveSettings);
    
    btnLayout->addWidget(cancelBtn);
    btnLayout->addWidget(acceptBtn);
    
    QVBoxLayout* rightLayout = new QVBoxLayout();
    rightLayout->setContentsMargins(0, 0, 0, 0);
    rightLayout->setSpacing(0);
    rightLayout->addWidget(contentContainer, 1);
    
    QFrame* bottomSeparator = new QFrame(this);
    bottomSeparator->setFrameShape(QFrame::HLine);
    bottomSeparator->setFrameShadow(QFrame::Plain);
    bottomSeparator->setObjectName("bottomSeparator");
    rightLayout->addWidget(bottomSeparator);
    rightLayout->addWidget(bottomWidget);
    
    mainLayout->addLayout(rightLayout);
    
    connect(sidebarList, &QListWidget::currentRowChanged, this, &Cai_Dat_Chung::changePage);
    sidebarList->setCurrentRow(0);
}

QWidget* Cai_Dat_Chung::createUiTab() {
    QWidget* w = new QWidget();
    QVBoxLayout* layout = new QVBoxLayout(w);
    layout->setContentsMargins(0, 0, 0, 0);
    
    QLabel* title = new QLabel(m_lang == "VN" ? "Giao diện người dùng" : "User Interface");
    title->setObjectName("pageTitle");
    layout->addWidget(title);
    layout->addSpacing(20);
    
    // Language
    QHBoxLayout* langLayout = new QHBoxLayout();
    QLabel* langLbl = new QLabel(Cau_Hinh::getTranslation("Launcher", m_lang, "menu_language") + ":");
    langCombo = new QComboBox();
    langCombo->addItem("English", "EN");
    langCombo->addItem("Tiếng Việt", "VN");
    
    if (m_launcherConfig["language"].toString() == "VN") langCombo->setCurrentIndex(1);
    else langCombo->setCurrentIndex(0);
    
    langCombo->installEventFilter(this);
    
    langLayout->addWidget(langLbl);
    langLayout->addWidget(langCombo);
    
    // Font Size
    QHBoxLayout* fontLayout = new QHBoxLayout();
    QLabel* fontLbl = new QLabel(m_lang == "VN" ? "Cỡ chữ:" : "Font Size:");
    
    fontSizeSlider = new QSlider(Qt::Horizontal);
    fontSizeSlider->setRange(9, 24);
    
    int currentSize = m_launcherConfig.value("font_size", 10).toInt();
    fontSizeSlider->setValue(currentSize);
    
    fontSizeValueLbl = new QLabel(QString::number(currentSize) + " px");
    fontSizeValueLbl->setMinimumWidth(40);
    connect(fontSizeSlider, &QSlider::valueChanged, this, [this](int value) {
        fontSizeValueLbl->setText(QString::number(value) + " px");
    });
    
    fontSizeSlider->installEventFilter(this);
    
    fontLayout->setSpacing(15);
    fontLayout->addWidget(fontLbl);
    fontLayout->addWidget(fontSizeSlider, 1);
    fontLayout->addWidget(fontSizeValueLbl);
    
    // Theme
    QHBoxLayout* themeLayout = new QHBoxLayout();
    QLabel* themeLbl = new QLabel(Cau_Hinh::getTranslation("Launcher", m_lang, "menu_theme") + ":");
    
    lightThemeBtn = new QPushButton();
    lightThemeBtn->setObjectName("themeLightBtn");
    lightThemeBtn->setFixedSize(140, 90);
    lightThemeBtn->setIcon(QIcon(":/icons/theme-light.svg"));
    lightThemeBtn->setIconSize(QSize(130, 80));
    lightThemeBtn->setCheckable(true);
    lightThemeBtn->setCursor(Qt::PointingHandCursor);
    
    darkThemeBtn = new QPushButton();
    darkThemeBtn->setObjectName("themeDarkBtn");
    darkThemeBtn->setFixedSize(140, 90);
    darkThemeBtn->setIcon(QIcon(":/icons/theme-dark.svg"));
    darkThemeBtn->setIconSize(QSize(130, 80));
    darkThemeBtn->setCheckable(true);
    darkThemeBtn->setCursor(Qt::PointingHandCursor);
    
    QString t = m_theme;
    if (t == "Dark") darkThemeBtn->setChecked(true);
    else lightThemeBtn->setChecked(true);
    
    connect(lightThemeBtn, &QPushButton::clicked, [this]() {
        lightThemeBtn->setChecked(true);
        darkThemeBtn->setChecked(false);
    });
    
    connect(darkThemeBtn, &QPushButton::clicked, [this]() {
        darkThemeBtn->setChecked(true);
        lightThemeBtn->setChecked(false);
    });
    
    themeLayout->addWidget(themeLbl);
    themeLayout->addSpacing(20);
    themeLayout->addWidget(lightThemeBtn);
    themeLayout->addWidget(darkThemeBtn);
    themeLayout->addStretch();

    QGridLayout* gridLayout = new QGridLayout();
    gridLayout->setContentsMargins(20, 0, 0, 0);
    gridLayout->setVerticalSpacing(30);
    gridLayout->setHorizontalSpacing(40);
    
    // Row 0: Language
    gridLayout->addWidget(langLbl, 0, 0);
    gridLayout->addWidget(langCombo, 0, 1, 1, 1, Qt::AlignLeft);
    
    // Row 1: Theme
    gridLayout->addWidget(themeLbl, 1, 0);
    QHBoxLayout* themeBtns = new QHBoxLayout();
    themeBtns->addWidget(lightThemeBtn);
    themeBtns->addWidget(darkThemeBtn);
    themeBtns->addStretch();
    gridLayout->addLayout(themeBtns, 1, 1, 1, 3);
    
    // Row 2: Checkboxes
    borderRadiusCheck = new QCheckBox(m_lang == "VN" ? "Bo tròn góc" : "Enable Rounded Corners");
    borderRadiusCheck->setChecked(m_launcherConfig.value("border_radius", 15).toInt() > 0);
    borderRadiusCheck->installEventFilter(this);
    gridLayout->addWidget(borderRadiusCheck, 2, 0, 1, 4);
    
    // Row 3: Disable Animations
    disableAnimationsCheck = new QCheckBox(m_lang == "VN" ? "Tắt hiệu ứng chuyển động" : "Disable Animations");
    disableAnimationsCheck->setChecked(m_launcherConfig.value("disable_animations", false).toBool());
    disableAnimationsCheck->installEventFilter(this);
    gridLayout->addWidget(disableAnimationsCheck, 3, 0, 1, 4);
    
    // Row 4: Font Size
    gridLayout->addLayout(fontLayout, 4, 0, 1, 4);
    
    // Row 5: Transparency
    QLabel* opacityLbl = new QLabel(m_lang == "VN" ? "Độ trong suốt:" : "Transparency:");
    opacitySlider = new QSlider(Qt::Horizontal);
    opacitySlider->setRange(0, 67);
    int currentTransparency = 100 - m_launcherConfig.value("window_opacity", 100).toInt();
    if (currentTransparency > 67) currentTransparency = 67;
    opacitySlider->setValue(currentTransparency);
    opacitySlider->setFocusPolicy(Qt::StrongFocus);
    opacitySlider->installEventFilter(this);
    opacityValueLbl = new QLabel(QString::number(currentTransparency) + "%");
    opacityValueLbl->setMinimumWidth(40);
    connect(opacitySlider, &QSlider::valueChanged, this, [this](int value) {
        opacityValueLbl->setText(QString::number(value) + "%");
    });
    opacitySlider->installEventFilter(this);
    
    QHBoxLayout* opacityLayout = new QHBoxLayout();
    opacityLayout->setSpacing(15);
    opacityLayout->addWidget(opacityLbl);
    opacityLayout->addWidget(opacitySlider, 1);
    opacityLayout->addWidget(opacityValueLbl);
    gridLayout->addLayout(opacityLayout, 5, 0, 1, 4);
    
    QWidget* childContainer = new QWidget();
    childContainer->setLayout(gridLayout);
    
    layout->addWidget(childContainer);
    return w;
}

QWidget* Cai_Dat_Chung::createGeneralTab() {
    QWidget* w = new QWidget();
    QVBoxLayout* layout = new QVBoxLayout(w);
    layout->setContentsMargins(0, 0, 0, 0);
    
    QLabel* title = new QLabel(m_lang == "VN" ? "Chung" : "General");
    title->setObjectName("pageTitle");
    layout->addWidget(title);
    layout->addSpacing(20);
    
    alwaysOnTopCheck = new QCheckBox(Cau_Hinh::getTranslation("Launcher", m_lang, "always_on_top_btn"));
    alwaysOnTopCheck->setChecked(m_launcherConfig["always_on_top"].toBool());
    
    minimizeToTrayCheck = new QCheckBox(Cau_Hinh::getTranslation("Launcher", m_lang, "minimize_tray_btn"));
    minimizeToTrayCheck->setChecked(m_launcherConfig["minimize_to_tray"].toBool());
    
    QWidget* childContainer = new QWidget();
    QVBoxLayout* childLayout = new QVBoxLayout(childContainer);
    childLayout->setContentsMargins(20, 0, 0, 0);
    
    childLayout->addWidget(alwaysOnTopCheck);
    childLayout->addWidget(minimizeToTrayCheck);
    childLayout->addStretch();
    
    layout->addWidget(childContainer);
    return w;
}

QWidget* Cai_Dat_Chung::createUninstallerTab() {
    QWidget* w = new QWidget();
    QVBoxLayout* layout = new QVBoxLayout(w);
    layout->setContentsMargins(0, 0, 0, 0);
    
    QHBoxLayout* titleLayout = new QHBoxLayout();
    QLabel* title = new QLabel(Cau_Hinh::getTranslation("Launcher", m_lang, "uninstaller_btn"));
    title->setObjectName("pageTitle");
    titleLayout->addWidget(title);
    titleLayout->addStretch();
    
    QPushButton* helpBtn = new QPushButton(this);
    helpBtn->setIcon(QIcon(":/icons/help.svg"));
    helpBtn->setObjectName("helpButton");
    helpBtn->setFixedSize(24, 24);
    connect(helpBtn, &QPushButton::clicked, this, [this]() {
        NexMessageBox msgBox(this);
        msgBox.setWindowTitle(m_lang == "VN" ? "Trợ giúp - Gỡ cài đặt" : "Help - Uninstaller");
        msgBox.setText(m_lang == "VN" ? "<b>Trình Gỡ Cài Đặt:</b><br>"
          "- <b>Gỡ cài đặt ngầm:</b> Gỡ phần mềm tự động không hiện giao diện của trình gỡ.<br>"
          "- <b>Hiện hộp thoại xác nhận:</b> Hỏi ý kiến trước khi gỡ một phần mềm.<br>"
          "- <b>Thu nhỏ khi đóng:</b> Thu nhỏ Trình gỡ cài đặt sau khi gỡ xong." 
          : "<b>Uninstaller:</b><br>"
          "- <b>Silent Uninstall:</b> Uninstalls software automatically without showing its UI.<br>"
          "- <b>Show Confirmation:</b> Asks for confirmation before uninstalling.<br>"
          "- <b>Minimize on Close:</b> Minimizes the Uninstaller after completion.");
        msgBox.setIcon(NexMessageBox::Information);
        msgBox.exec();
    });
    titleLayout->addWidget(helpBtn);
    layout->addLayout(titleLayout);
    layout->addSpacing(20);
    
    silentUninstallCheck = new QCheckBox(Cau_Hinh::getTranslation("Uninstaller", m_lang, "silent_uninstall_check"));
    silentUninstallCheck->setChecked(m_uninstallerConfig["silent_uninstall"].toBool());
    
    showConfirmationCheck = new QCheckBox(Cau_Hinh::getTranslation("Uninstaller", m_lang, "show_confirmation_check"));
    showConfirmationCheck->setChecked(m_uninstallerConfig["show_confirmation"].toBool());
    
    showProgressCheck = new QCheckBox(Cau_Hinh::getTranslation("Uninstaller", m_lang, "show_progress_check"));
    showProgressCheck->setChecked(m_uninstallerConfig["show_progress_dialog"].toBool());
    
    showNotificationCheck = new QCheckBox(Cau_Hinh::getTranslation("Uninstaller", m_lang, "show_notification_check"));
    showNotificationCheck->setChecked(m_uninstallerConfig["show_notification"].toBool());
    
    minimizeOnCloseCheck = new QCheckBox(Cau_Hinh::getTranslation("Uninstaller", m_lang, "minimize_on_close_check"));
    minimizeOnCloseCheck->setChecked(m_uninstallerConfig["minimize_on_close"].toBool());
    
    QWidget* childContainer = new QWidget();
    QVBoxLayout* childLayout = new QVBoxLayout(childContainer);
    childLayout->setContentsMargins(20, 0, 0, 0);
    
    childLayout->addWidget(silentUninstallCheck);
    childLayout->addWidget(showConfirmationCheck);
    childLayout->addWidget(showProgressCheck);
    childLayout->addWidget(showNotificationCheck);
    childLayout->addWidget(minimizeOnCloseCheck);
    childLayout->addStretch();
    
    layout->addWidget(childContainer);
    return w;
}

QWidget* Cai_Dat_Chung::createInstallerTab() {
    QWidget* w = new QWidget();
    QVBoxLayout* layout = new QVBoxLayout(w);
    layout->setContentsMargins(0, 0, 0, 0);
    
    QHBoxLayout* titleLayout = new QHBoxLayout();
    QLabel* title = new QLabel(Cau_Hinh::getTranslation("Launcher", m_lang, "installer_btn"));
    title->setObjectName("pageTitle");
    titleLayout->addWidget(title);
    titleLayout->addStretch();
    QPushButton* helpBtn = new QPushButton(this);
    helpBtn->setIcon(QIcon(":/icons/help.svg"));
    helpBtn->setObjectName("helpButton");
    helpBtn->setFixedSize(24, 24);
    connect(helpBtn, &QPushButton::clicked, this, [this]() {
        NexMessageBox msgBox(this);
        msgBox.setWindowTitle(m_lang == "VN" ? "Trợ giúp - Cài đặt" : "Help - Installer");
        msgBox.setText(m_lang == "VN" ? "<b>Trình Cài Đặt:</b><br>"
          "- <b>Tải đa luồng:</b> Tăng tốc độ tải bằng cách sử dụng nhiều kết nối cùng lúc.<br>"
          "- <b>Tự động chọn tất cả:</b> Tự động đánh dấu tất cả phần mềm khi mở.<br>"
          "- <b>Thu nhỏ xuống khay khi cài đặt:</b> Thu nhỏ Launcher khi bắt đầu cài.<br>"
          "- <b>Sử dụng danh mục chi tiết:</b> Tách riêng các danh mục thay vì gộp chung.<br>"
          "- <b>Hiển thị tiến trình:</b> Hiện tiến trình tải và cài đặt.<br>"
          "- <b>Ẩn ứng dụng không hỗ trợ:</b> Ẩn các phần mềm không tương thích với Windows của bạn.<br>"
          "- <b>Hiển thị thông báo hoàn tất:</b> Thông báo sau khi cài xong toàn bộ."
          : "<b>Installer:</b><br>"
          "- <b>Multi-threaded Download:</b> Speeds up downloads using multiple connections.<br>"
          "- <b>Auto-select All:</b> Automatically checks all software when opened.<br>"
          "- <b>Minimize during install:</b> Minimizes the Launcher when starting install.<br>"
          "- <b>Use detailed categories:</b> Separates categories instead of grouping.<br>"
          "- <b>Show Progress:</b> Shows download and install progress.<br>"
          "- <b>Hide Unsupported:</b> Hides applications incompatible with your OS.<br>"
          "- <b>Show Complete Dialog:</b> Displays a notification when everything is finished.");
        msgBox.setIcon(NexMessageBox::Question);
        msgBox.exec();
    });
    titleLayout->addWidget(helpBtn);
    layout->addLayout(titleLayout);
    layout->addSpacing(20);
    
    multiThreadCheck = new QCheckBox(Cau_Hinh::getTranslation("Installer", m_lang, "multithread_install_check"));
    multiThreadCheck->setChecked(m_installerConfig["multi_thread"].toBool());
    
    autoselectCheck = new QCheckBox(Cau_Hinh::getTranslation("Installer", m_lang, "auto_select_check"));
    autoselectCheck->setChecked(m_installerConfig["auto_select_all"].toBool());
    
    minimizeCheck = new QCheckBox(Cau_Hinh::getTranslation("Installer", m_lang, "minimize_tray_check"));
    minimizeCheck->setChecked(m_installerConfig["minimize_on_close"].toBool());
    
    detailedCategoriesCheck = new QCheckBox(Cau_Hinh::getTranslation("Installer", m_lang, "use_detailed_categories_check"));
    detailedCategoriesCheck->setChecked(m_installerConfig["detailed_categories"].toBool());
    
    progressCheck = new QCheckBox(Cau_Hinh::getTranslation("Installer", m_lang, "show_progress_check"));
    progressCheck->setChecked(m_installerConfig["show_progress_dialog"].toBool());
    
    hideCheck = new QCheckBox(Cau_Hinh::getTranslation("Installer", m_lang, "hide_unsupported_check"));
    hideCheck->setChecked(m_installerConfig["hide_unsupported"].toBool());
    
    completeCheck = new QCheckBox(Cau_Hinh::getTranslation("Installer", m_lang, "show_completion_check"));
    completeCheck->setChecked(m_installerConfig["show_complete_dialog"].toBool());
    
    QWidget* childContainer = new QWidget();
    QVBoxLayout* childLayout = new QVBoxLayout(childContainer);
    childLayout->setContentsMargins(20, 0, 0, 0);
    
    childLayout->addWidget(multiThreadCheck);
    childLayout->addWidget(autoselectCheck);
    childLayout->addWidget(minimizeCheck);
    childLayout->addWidget(detailedCategoriesCheck);
    childLayout->addWidget(progressCheck);
    childLayout->addWidget(hideCheck);
    childLayout->addWidget(completeCheck);
    childLayout->addStretch();
    
    layout->addWidget(childContainer);
    return w;
}

void Cai_Dat_Chung::changePage(int index) {
    if (index >= 0 && index < sectionWidgets.size()) {
        int y = sectionWidgets[index]->pos().y();
        scrollArea->verticalScrollBar()->setValue(y);
    }
}

void Cai_Dat_Chung::onScrollValueChanged(int value) {
    if (!scrollArea || sectionWidgets.isEmpty()) return;
    
    for (int i = sectionWidgets.size() - 1; i >= 0; --i) {
        if (value >= sectionWidgets[i]->pos().y() - 100) {
            sidebarList->blockSignals(true);
            sidebarList->setCurrentRow(i);
            sidebarList->blockSignals(false);
            break;
        }
    }
}

QWidget* Cai_Dat_Chung::createHelpTab() {
    QWidget* w = new QWidget();
    QVBoxLayout* layout = new QVBoxLayout(w);
    layout->setContentsMargins(0, 0, 0, 0);
    
    QLabel* title = new QLabel(m_lang == "VN" ? "Trợ giúp" : "Help");
    title->setObjectName("pageTitle");
    layout->addWidget(title);
    layout->addSpacing(20);
    
    QLabel* helpText = new QLabel(m_lang == "VN" 
        ? "<b>Hướng dẫn sử dụng các tính năng:</b><br><br>"
          "<b>Cài đặt chung:</b><br>"
          "- <b>Luôn ở trên cùng:</b> Giữ cửa sổ Nex Launcher luôn nổi trên các ứng dụng khác.<br>"
          "- <b>Thu nhỏ xuống khay hệ thống:</b> Khi đóng, ứng dụng sẽ thu nhỏ xuống góc màn hình thay vì tắt hẳn.<br><br>"
          "<b>Trình Cài Đặt:</b><br>"
          "- <b>Tải đa luồng:</b> Tăng tốc độ tải bằng cách sử dụng nhiều kết nối cùng lúc.<br>"
          "- <b>Tự động chọn tất cả:</b> Tự động đánh dấu tất cả phần mềm khi mở.<br>"
          "- <b>Ẩn ứng dụng không hỗ trợ:</b> Ẩn các ứng dụng không tương thích với hệ thống hiện tại.<br>"
          "- <b>Hiển thị hộp thoại khi hoàn tất:</b> Thông báo khi quá trình cài đặt xong.<br><br>"
          "<b>Trình Gỡ Cài Đặt:</b><br>"
          "- <b>Gỡ cài đặt ngầm:</b> Gỡ phần mềm tự động không hiện giao diện của trình gỡ.<br>"
          "- <b>Hiện hộp thoại xác nhận:</b> Hỏi ý kiến trước khi gỡ một phần mềm.<br>"
          "- <b>Thu nhỏ khi đóng:</b> Thu nhỏ Trình gỡ cài đặt sau khi gỡ xong.<br><br>"
          "<i>Nex Launcher v1.5 - Phát triển bởi SpaceheroVN</i>" 
        : "<b>Feature Guide:</b><br><br>"
          "<b>General Settings:</b><br>"
          "- <b>Always on Top:</b> Keeps the Nex Launcher window above other applications.<br>"
          "- <b>Minimize to Tray:</b> Minimizes the app to the system tray instead of closing.<br><br>"
          "<b>Installer:</b><br>"
          "- <b>Multi-threaded Download:</b> Speeds up downloads using multiple connections.<br>"
          "- <b>Auto-select All:</b> Automatically checks all software when opened.<br>"
          "- <b>Hide Unsupported:</b> Hides applications that are not compatible with your system.<br>"
          "- <b>Show Complete Dialog:</b> Displays a notification when installation finishes.<br><br>"
          "<b>Uninstaller:</b><br>"
          "- <b>Silent Uninstall:</b> Uninstalls software automatically without showing its UI.<br>"
          "- <b>Show Confirmation:</b> Asks for confirmation before uninstalling.<br>"
          "- <b>Minimize on Close:</b> Minimizes the Uninstaller after completion.<br><br>"
          "<i>Nex Launcher v1.5 - Developed by SpaceheroVN</i>");
    helpText->setWordWrap(true);
    QWidget* childContainer = new QWidget();
    QVBoxLayout* childLayout = new QVBoxLayout(childContainer);
    childLayout->setContentsMargins(20, 0, 0, 0);
    
    childLayout->addWidget(helpText);
    childLayout->addStretch();
    
    layout->addWidget(childContainer);
    return w;
}

void Cai_Dat_Chung::saveSettings() {
    QString newLang = langCombo->currentData().toString();
    int newFontSize = fontSizeSlider->value();
    QString newTheme = darkThemeBtn->isChecked() ? "Dark" : "Light";
    bool newAlwaysOnTop = alwaysOnTopCheck->isChecked();
    bool newMinToTray = minimizeToTrayCheck->isChecked();
    bool newDisableAnims = disableAnimationsCheck->isChecked();
    int newBorderRadius = borderRadiusCheck->isChecked() ? 15 : 0;
    int newOpacity = 100 - opacitySlider->value();
    
    if (m_launcherConfig["language"].toString() != newLang ||
        m_launcherConfig.value("font_size", 10).toInt() != newFontSize ||
        m_launcherConfig["theme"].toString() != newTheme ||
        m_launcherConfig["always_on_top"].toBool() != newAlwaysOnTop ||
        m_launcherConfig["minimize_to_tray"].toBool() != newMinToTray ||
        m_launcherConfig["disable_animations"].toBool() != newDisableAnims ||
        m_launcherConfig.value("border_radius", 15).toInt() != newBorderRadius ||
        m_launcherConfig.value("window_opacity", 100).toInt() != newOpacity) 
    {
        m_launcherConfig["language"] = newLang;
        m_launcherConfig["font_size"] = newFontSize;
        m_launcherConfig["theme"] = newTheme;
        m_launcherConfig["always_on_top"] = newAlwaysOnTop;
        m_launcherConfig["minimize_to_tray"] = newMinToTray;
        m_launcherConfig["disable_animations"] = newDisableAnims;
        m_launcherConfig["border_radius"] = newBorderRadius;
        m_launcherConfig["window_opacity"] = newOpacity;
        
        QString appDataPath = QStandardPaths::writableLocation(QStandardPaths::AppDataLocation) + "/Nex-Launcher";
        QDir().mkpath(appDataPath);
        QFile f(appDataPath + "/launcher_config.json");
        if (f.open(QIODevice::WriteOnly)) {
            f.write(QJsonDocument(QJsonObject::fromVariantMap(m_launcherConfig)).toJson());
            f.close();
        }
        m_launcherConfigChanged = true;
    }
    
    // Save Uninstaller config
    bool s1 = silentUninstallCheck->isChecked();
    bool s2 = showConfirmationCheck->isChecked();
    bool s3 = showProgressCheck->isChecked();
    bool s4 = showNotificationCheck->isChecked();
    bool s5 = minimizeOnCloseCheck->isChecked();
    
    if (m_uninstallerConfig["silent_uninstall"].toBool() != s1 ||
        m_uninstallerConfig["show_confirmation"].toBool() != s2 ||
        m_uninstallerConfig["show_progress_dialog"].toBool() != s3 ||
        m_uninstallerConfig["show_notification"].toBool() != s4 ||
        m_uninstallerConfig["minimize_on_close"].toBool() != s5) {
        
        m_uninstallerConfig["silent_uninstall"] = s1;
        m_uninstallerConfig["show_confirmation"] = s2;
        m_uninstallerConfig["show_progress_dialog"] = s3;
        m_uninstallerConfig["show_notification"] = s4;
        m_uninstallerConfig["minimize_on_close"] = s5;
        
        QString appDataPath = QStandardPaths::writableLocation(QStandardPaths::AppDataLocation) + "/Nex-Launcher";
        QDir().mkpath(appDataPath);
        QFile f(appDataPath + "/uninstaller_config.json");
        if (f.open(QIODevice::WriteOnly)) {
            f.write(QJsonDocument(QJsonObject::fromVariantMap(m_uninstallerConfig)).toJson());
            f.close();
        }
        m_uninstallerConfigChanged = true;
    }
    
    // Save Installer config
    bool i1 = multiThreadCheck->isChecked();
    bool i2 = autoselectCheck->isChecked();
    bool i3 = minimizeCheck->isChecked();
    bool i4 = detailedCategoriesCheck->isChecked();
    bool i5 = progressCheck->isChecked();
    bool i6 = hideCheck->isChecked();
    bool i7 = completeCheck->isChecked();
    
    if (m_installerConfig["multi_thread"].toBool() != i1 ||
        m_installerConfig["auto_select_all"].toBool() != i2 ||
        m_installerConfig["minimize_on_close"].toBool() != i3 ||
        m_installerConfig["detailed_categories"].toBool() != i4 ||
        m_installerConfig["show_progress_dialog"].toBool() != i5 ||
        m_installerConfig["hide_unsupported"].toBool() != i6 ||
        m_installerConfig["show_complete_dialog"].toBool() != i7) {
        
        m_installerConfig["multi_thread"] = i1;
        m_installerConfig["auto_select_all"] = i2;
        m_installerConfig["minimize_on_close"] = i3;
        m_installerConfig["detailed_categories"] = i4;
        m_installerConfig["show_progress_dialog"] = i5;
        m_installerConfig["hide_unsupported"] = i6;
        m_installerConfig["show_complete_dialog"] = i7;
        
        QString appDataPath = QStandardPaths::writableLocation(QStandardPaths::AppDataLocation) + "/Nex-Launcher";
        QDir().mkpath(appDataPath);
        QFile f(appDataPath + "/installer_config.json");
        if (f.open(QIODevice::WriteOnly)) {
            f.write(QJsonDocument(QJsonObject::fromVariantMap(m_installerConfig)).toJson());
            f.close();
        }
        m_installerConfigChanged = true;
    }
    
    accept();
}

void Cai_Dat_Chung::applyStyles() {
    QMap<QString, QString> c = Cau_Hinh::getThemeColors(m_theme);
    int radius = m_launcherConfig.value("border_radius", 15).toInt();
    
    QString br4 = radius > 0 ? "4" : "0";
    QString br5 = radius > 0 ? "5" : "0";
    QString br6 = radius > 0 ? "6" : "0";
    QString br1 = radius > 0 ? "1" : "0";

    QString style = R"(
        QDialog {
            background-color: )" + c["window_bg"] + R"(;
            border-radius: )" + QString::number(radius) + R"(px;
        }
        #settingsSidebar {
            background-color: )" + c["input_bg"] + R"(;
            border-right: 1px solid )" + c["border_color"] + R"(;
            border-top-left-radius: )" + QString::number(radius) + R"(px;
            border-bottom-left-radius: )" + QString::number(radius) + R"(px;
        }
        #settingsContent {
            background-color: )" + c["window_bg"] + R"(;
            border-top-right-radius: )" + QString::number(radius) + R"(px;
        }
        #settingsBottomBar {
            background-color: )" + c["input_bg"] + R"(;
            border-bottom-right-radius: )" + QString::number(radius) + R"(px;
        }
        QScrollArea {
            background-color: transparent;
            border: none;
        }
        #settingsScrollContent {
            background-color: transparent;
        }
        #pageTitle {
            font-size: 18px;
            color: )" + c["text_color"] + R"(;
            border-bottom: 1px solid )" + c["border_color"] + R"(;
            padding-bottom: 10px;
        }
        QLabel, QCheckBox {
            color: )" + c["text_color"] + R"(;
            font-size: 14px;
        }
        QListWidget {
            background-color: transparent;
            border: none;
            outline: none;
            color: )" + c["text_color"] + R"(;
        }
        QListWidget::item {
            padding: 12px 20px;
            font-size: 14px;
        }
        QListWidget::item:hover {
            background-color: )" + c["hover_bg"] + R"(;
        }
        QListWidget::item:selected {
            background-color: transparent;
            color: )" + c["primary_color"] + R"(;
            border-left: 3px solid )" + c["primary_color"] + R"(;
        }
        #resetButton, #cancelButton {
            background-color: )" + c["button_bg"] + R"(;
            color: )" + c["text_color"] + R"(;
            border: 1px solid )" + c["button_border"] + R"(;
            border-radius: )" + br5 + R"(px;
            padding: 8px 25px;
            font-weight: bold;
        }
        #resetButton:hover, #cancelButton:hover {
            background-color: )" + c["hover_bg"] + R"(;
            border: 1px solid )" + c["primary_color"] + R"(;
        }
        #acceptButton {
            background-color: )" + c["primary_color"] + R"(;
            color: )" + c["primary_text"] + R"(;
            border: none;
            border-radius: )" + br5 + R"(px;
            padding: 8px 25px;
            font-weight: bold;
        }
        #acceptButton:hover {
            background-color: )" + c["primary_hover_bg"] + R"(;
        }
        QComboBox {
            background-color: )" + c["input_bg"] + R"(;
            color: )" + c["text_color"] + R"(;
            border: 1px solid )" + c["border_color"] + R"(;
            border-radius: )" + br4 + R"(px;
            padding: 5px 10px;
            min-width: 150px;
        }
        QComboBox QAbstractItemView {
            background-color: )" + c["input_bg"] + R"(;
            color: )" + c["text_color"] + R"(;
            selection-background-color: #2568EC;
            selection-color: white;
            border: 1px solid )" + c["border_color"] + R"(;
            outline: none;
        }
        QPushButton#themeLightBtn, QPushButton#themeDarkBtn {
            border: 2px solid transparent;
            border-radius: )" + br6 + R"(px;
            background-color: transparent;
        }
        QPushButton#themeLightBtn:hover, QPushButton#themeDarkBtn:hover {
            border: 2px solid #5588FF;
        }
        QPushButton#themeLightBtn:checked, QPushButton#themeDarkBtn:checked {
            border: 2px solid #2568EC;
            background-color: )" + c["hover_bg"] + R"(;
        }
        QCheckBox::indicator {
            width: 18px; height: 18px; border-radius: )" + br4 + R"(px;
            border: 1px solid )" + c["border_color"] + R"(;
        }
        QCheckBox::indicator:checked {
            background-color: #2568EC;
            border: 1px solid #2568EC;
            image: url(:/icons/tick.svg);
        }
        QSlider { min-height: 20px; background: transparent; }
        QSlider::groove:horizontal {
            border: none;
            height: 2px;
            background: )" + c["border_color"] + R"(;
            margin: 0px 0;
            border-radius: )" + br1 + R"(px;
        }
        QSlider::handle:horizontal {
            background: #2568EC;
            border: 1px solid #2568EC;
            width: 12px;
            margin: -5px 0;
            border-radius: )" + br6 + R"(px;
        }
        QSlider::handle:horizontal:hover {
            background: #1D52BA;
            border: 1px solid #1D52BA;
        }
        QSlider::sub-page:horizontal {
            background: #2568EC;
            border-radius: )" + br1 + R"(px;
        }
        QScrollBar:vertical { border: none; background: transparent; width: 14px; margin: 0px; }
        QScrollBar::handle:vertical { background: )" + c["border_color"] + R"(; min-height: 25px; border-radius: )" + br4 + R"(px; margin: 3px; }
        QScrollBar::handle:vertical:hover { background: )" + c["primary_hover"] + R"(; }
        QScrollBar::handle:vertical:pressed { background: )" + c["primary_color"] + R"(; }
        QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical { height: 0px; border: none; background: none; }
        QScrollBar::add-page:vertical, QScrollBar::sub-page:vertical { background: transparent; }
    )";
    setStyleSheet(style);
}

void Cai_Dat_Chung::resetSettings() {
    m_launcherConfig.clear();
    m_installerConfig.clear();
    m_uninstallerConfig.clear();
    
    QString defaultLang = (QLocale::system().language() == QLocale::Vietnamese) ? "VN" : "EN";
    
    m_launcherConfig["language"] = defaultLang;
    m_launcherConfig["font_size"] = 10;
    m_launcherConfig["theme"] = "Light";
    m_launcherConfig["always_on_top"] = false;
    m_launcherConfig["minimize_to_tray"] = false;
    m_launcherConfig["disable_animations"] = false;
    
    m_installerConfig["multi_thread"] = true;
    m_installerConfig["auto_select_all"] = true;
    m_installerConfig["minimize_on_close"] = true;
    m_installerConfig["detailed_categories"] = false;
    m_installerConfig["show_progress_dialog"] = true;
    m_installerConfig["hide_unsupported"] = false;
    m_installerConfig["show_complete_dialog"] = true;
    
    m_uninstallerConfig["silent_uninstall"] = false;
    m_uninstallerConfig["show_confirmation"] = true;
    m_uninstallerConfig["minimize_on_close"] = false;

    m_launcherConfigChanged = true;
    m_installerConfigChanged = true;
    m_uninstallerConfigChanged = true;
    
    QDialog::accept();
}

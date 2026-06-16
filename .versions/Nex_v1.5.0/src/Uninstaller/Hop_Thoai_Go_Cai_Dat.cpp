#include "Hop_Thoai_Go_Cai_Dat.h"
#include "Cau_Hinh_Go_Cai_Dat.h"
#include "../Cau_Hinh.h"

#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QDialogButtonBox>
#include <QScrollArea>
#include <QProcess>
#include <QRegularExpression>
#include <QIcon>
#include <QStyle>
#include <QDebug>
#include <QDir>
#include <QFileInfo>
#include <QStandardPaths>
#include <QSettings>
#include <Windows.h>
#include <QFile>
#include <QJsonDocument>
#include <QJsonObject>
#include <QLabel>
#include <QProgressBar>
#include <QCheckBox>
#include <QGraphicsDropShadowEffect>
#include <QFileIconProvider>
#include <QScrollBar>

// ==========================================
// ConfirmUninstallDialog
// ==========================================
ConfirmUninstallDialog::ConfirmUninstallDialog(const QList<QVariantMap>& apps, const QString& theme, QWidget *parent, const QString& lang) : QDialog(parent) {
    setWindowTitle(Cau_Hinh::getTranslation("Uninstaller", lang, "confirm_uninstall_title"));
    setMinimumWidth(750);
    
    setWindowFlags(windowFlags() | Qt::FramelessWindowHint);
    setAttribute(Qt::WA_TranslucentBackground, true);
    
    QWidget* container = new QWidget(this);
    container->setObjectName("bgWidget");
    
    QGraphicsDropShadowEffect *shadow = new QGraphicsDropShadowEffect(this);
    shadow->setBlurRadius(20);
    shadow->setColor(QColor(0, 0, 0, 80));
    shadow->setOffset(0, 4);
    container->setGraphicsEffect(shadow);
    
    QVBoxLayout* mainLayout = new QVBoxLayout(this);
    mainLayout->setContentsMargins(10, 10, 10, 10);
    mainLayout->addWidget(container);
    
    QVBoxLayout* layout = new QVBoxLayout(container);
    layout->setContentsMargins(40, 40, 40, 40);
    layout->setSpacing(20);
    
    QHBoxLayout* scrollContainerLayout = new QHBoxLayout();
    scrollContainerLayout->setContentsMargins(0, 0, 0, 0);
    scrollContainerLayout->setSpacing(10);
    
    QPushButton* leftBtn = new QPushButton("◄", container);
    leftBtn->setFixedSize(30, 60);
    leftBtn->setObjectName("navButton");
    scrollContainerLayout->addWidget(leftBtn);
    
    QScrollArea* scrollArea = new QScrollArea(container);
    scrollArea->setWidgetResizable(true);
    scrollArea->setVerticalScrollBarPolicy(Qt::ScrollBarAlwaysOff);
    scrollArea->setHorizontalScrollBarPolicy(Qt::ScrollBarAlwaysOff);
    
    QWidget* listWidget = new QWidget();
    listWidget->setObjectName("confirmListContainer");
    QHBoxLayout* listLayout = new QHBoxLayout(listWidget);
    listLayout->setSpacing(20);
    listLayout->setAlignment(Qt::AlignCenter);
    
    for (const QVariantMap& app : apps) {
        QWidget* appWidget = new QWidget(listWidget);
        appWidget->setFixedWidth(140);
        QVBoxLayout* appLayout = new QVBoxLayout(appWidget);
        appLayout->setContentsMargins(5, 5, 5, 5);
        appLayout->setAlignment(Qt::AlignTop | Qt::AlignHCenter);
        
        QLabel* iconLabel = new QLabel(appWidget);
        QString iconPath = app.value("display_icon").toString();
        QIcon appIcon;
        if (!iconPath.isEmpty() && QFileInfo::exists(iconPath)) {
            if (iconPath.endsWith(".ico", Qt::CaseInsensitive) || iconPath.endsWith(".png", Qt::CaseInsensitive)) {
                appIcon = QIcon(iconPath);
            } else {
                QFileIconProvider provider;
                appIcon = provider.icon(QFileInfo(iconPath));
            }
        }
        if (appIcon.isNull()) {
            appIcon = QIcon(":/icons/what_app.svg");
        }
        
        QPixmap pix = appIcon.pixmap(256, 256);
        if (pix.isNull()) pix = appIcon.pixmap(64, 64);
        
        // Scale to fit 64x64 cleanly
        pix = pix.scaled(64, 64, Qt::KeepAspectRatio, Qt::SmoothTransformation);
        
        iconLabel->setPixmap(pix);
        iconLabel->setFixedSize(64, 64);
        iconLabel->setAlignment(Qt::AlignCenter);
        appLayout->addWidget(iconLabel);
        
        QLabel* nameLabel = new QLabel(app.value("name").toString(), appWidget);
        nameLabel->setAlignment(Qt::AlignCenter);
        nameLabel->setWordWrap(true);
        QFont boldFont = nameLabel->font();
        boldFont.setPointSize(10);
        nameLabel->setFont(boldFont);
        appLayout->addWidget(nameLabel);
        
        if (app.contains("size_kb")) {
            qint64 sizeKb = app.value("size_kb").toLongLong();
            QString sizeStr;
            if (sizeKb > 1024 * 1024) {
                sizeStr = QString::number(sizeKb / (1024.0 * 1024.0), 'f', 2) + " GB";
            } else if (sizeKb > 1024) {
                sizeStr = QString::number(sizeKb / 1024.0, 'f', 1) + " MB";
            } else {
                sizeStr = QString::number(sizeKb) + " KB";
            }
            QLabel* sizeLabel = new QLabel(sizeStr, appWidget);
            sizeLabel->setAlignment(Qt::AlignCenter);
            sizeLabel->setStyleSheet("color: #888888; font-size: 11px;");
            appLayout->addWidget(sizeLabel);
        }
        
        listLayout->addWidget(appWidget);
    }
    scrollArea->setWidget(listWidget);
    scrollArea->setMinimumHeight(160);
    scrollArea->setMaximumHeight(160);
    scrollContainerLayout->addWidget(scrollArea);

    QPushButton* rightBtn = new QPushButton("►", container);
    rightBtn->setFixedSize(30, 60);
    rightBtn->setObjectName("navButton");
    scrollContainerLayout->addWidget(rightBtn);
    
    layout->addLayout(scrollContainerLayout);
    
    connect(leftBtn, &QPushButton::clicked, scrollArea, [scrollArea]() {
        scrollArea->horizontalScrollBar()->setValue(scrollArea->horizontalScrollBar()->value() - 160);
    });
    connect(rightBtn, &QPushButton::clicked, scrollArea, [scrollArea]() {
        scrollArea->horizontalScrollBar()->setValue(scrollArea->horizontalScrollBar()->value() + 160);
    });
    
    if (apps.size() <= 4) {
        leftBtn->hide();
        rightBtn->hide();
    }

    QString confirmMsg = Cau_Hinh::getTranslation("Uninstaller", lang, "confirm_uninstall_body");
    if (apps.size() > 1 && lang == "VN") {
        confirmMsg = QString("Bạn có chắc chắn muốn gỡ cài đặt %1 chương trình đã chọn không?").arg(apps.size());
    } else if (apps.size() > 1 && lang == "EN") {
        confirmMsg = QString("Are you sure you want to uninstall the %1 selected programs?").arg(apps.size());
    }
    
    layout->addSpacing(10);
    QLabel* messageLabel = new QLabel(confirmMsg, container);
    messageLabel->setWordWrap(true);
    messageLabel->setAlignment(Qt::AlignCenter);
    QFont msgFont = messageLabel->font();
    msgFont.setPointSize(11);
    messageLabel->setFont(msgFont);
    layout->addWidget(messageLabel);

    QHBoxLayout* checkboxesLayout = new QHBoxLayout();
    checkboxesLayout->setAlignment(Qt::AlignCenter);
    checkboxesLayout->setSpacing(30);

    m_restorePointCheckBox = new QCheckBox(Cau_Hinh::getTranslation("Uninstaller", lang, "create_restore_point_check"), container);
    m_restorePointCheckBox->setChecked(false);
    checkboxesLayout->addWidget(m_restorePointCheckBox);

    m_autoCleanupCheckBox = new QCheckBox(Cau_Hinh::getTranslation("Uninstaller", lang, "auto_cleanup_check"), container);
    m_autoCleanupCheckBox->setChecked(false);
    checkboxesLayout->addWidget(m_autoCleanupCheckBox);

    layout->addLayout(checkboxesLayout);
    layout->addSpacing(10);

    QHBoxLayout* buttonsLayout = new QHBoxLayout();
    buttonsLayout->setAlignment(Qt::AlignCenter);
    buttonsLayout->setSpacing(20);

    QPushButton* cancelBtn = new QPushButton(Cau_Hinh::getTranslation("Uninstaller", lang, "cancel_btn"), container);
    cancelBtn->setObjectName("cancelButton");
    connect(cancelBtn, &QPushButton::clicked, this, &QDialog::reject);
    buttonsLayout->addWidget(cancelBtn);

    QPushButton* acceptBtn = new QPushButton(Cau_Hinh::getTranslation("Uninstaller", lang, "uninstall_btn"), container);
    acceptBtn->setObjectName("acceptButton");
    connect(acceptBtn, &QPushButton::clicked, this, &QDialog::accept);
    buttonsLayout->addWidget(acceptBtn);

    layout->addLayout(buttonsLayout);
    
    QMap<QString, QString> c = Cau_Hinh::getThemeColors(theme);
    
    setStyleSheet(QString(
        "QWidget#bgWidget { background-color: %1; border-radius: 12px; border: 1px solid %6; }"
        "QLabel { color: %2; }"
        "QCheckBox { color: %2; font-size: 13px; }"
        "QScrollArea { background: transparent; border: none; }"
        "QWidget#confirmListContainer { background: transparent; }"
        "QPushButton#navButton { background-color: rgba(128, 128, 128, 0.1); color: %2; border: 1px solid %6; border-radius: 15px; font-size: 20px; font-weight: bold; }"
        "QPushButton#navButton:hover { background-color: rgba(128, 128, 128, 0.3); }"
        "QPushButton#acceptButton { background-color: %7; color: white; border: none; border-radius: 5px; padding: 10px 40px; font-size: 14px; font-weight: bold; min-width: 120px; }"
        "QPushButton#acceptButton:hover { background-color: %8; }"
        "QPushButton#cancelButton { background-color: %3; color: %4; border: none; border-radius: 5px; padding: 10px 40px; font-size: 14px; font-weight: bold; min-width: 120px; }"
        "QPushButton#cancelButton:hover { background-color: %5; }")
        .arg(c["bg_tier0"], c["text_color"], c["button_bg"], c["button_text"], c["hover_bg"], c["border_color"], c["primary_color"], c["primary_hover"]));
}

bool ConfirmUninstallDialog::isAutoCleanupChecked() const {
    return m_autoCleanupCheckBox->isChecked();
}

bool ConfirmUninstallDialog::isCreateRestorePointChecked() const {
    return m_restorePointCheckBox->isChecked();
}

// ==========================================
// Tac_Vu_Go_Cai_Dat
// ==========================================
Tac_Vu_Go_Cai_Dat::Tac_Vu_Go_Cai_Dat(const QVariantMap& appData, bool silent, QObject *parent)
    : QObject(parent), m_appData(appData), m_silent(silent) {
    m_name = m_appData.value("name").toString();
}

void Tac_Vu_Go_Cai_Dat::run() {
    QString uninstallString = m_appData.value("uninstall_string").toString();
    if (uninstallString.isEmpty()) {
        emit progress(m_name, "failed", "No uninstall string found.");
        emit finished(m_name, false);
        return;
    }

    emit progress(m_name, "uninstalling", "");

    // Process silent arguments if requested
    if (m_silent) {
        // MsiExec handling
        if (uninstallString.contains("msiexec.exe", Qt::CaseInsensitive) && uninstallString.contains("/I", Qt::CaseInsensitive)) {
            uninstallString.replace("/I", "/X", Qt::CaseInsensitive);
            uninstallString += " /quiet /norestart";
        } else if (uninstallString.contains("msiexec.exe", Qt::CaseInsensitive)) {
            uninstallString += " /quiet /norestart";
        } else if (uninstallString.contains(".exe", Qt::CaseInsensitive)) {
            // Inno Setup / NSIS common silent args
            uninstallString += " /S /SILENT /VERYSILENT /SUPPRESSMSGBOXES /NORESTART";
        } else {
            // Fallback
            uninstallString += " /quiet /norestart";
        }
    } else {
        if (uninstallString.contains("msiexec.exe", Qt::CaseInsensitive) && uninstallString.contains("/I", Qt::CaseInsensitive)) {
            uninstallString.replace("/I", "/X", Qt::CaseInsensitive);
        }
    }

    // Fix Unquoted path vulnerability (e.g. C:\Program Files\App\uninst.exe -> "C:\Program Files\App\uninst.exe")
    if (!uninstallString.startsWith("\"")) {
        int exeIndex = uninstallString.indexOf(".exe", 0, Qt::CaseInsensitive);
        if (exeIndex != -1) {
            QString exePath = uninstallString.left(exeIndex + 4);
            QString argsStr = uninstallString.mid(exeIndex + 4);
            uninstallString = "\"" + exePath + "\"" + argsStr;
        }
    }

    QProcess process;
    process.startCommand(uninstallString);

    if (process.waitForFinished(-1)) {
        if (process.exitCode() == 0 || process.exitCode() == 3010) { // 3010 is REBOOT_REQUIRED, considered success
            emit progress(m_name, "completed", "");
            emit finished(m_name, true);
        } else {
            emit progress(m_name, "failed", QString("Exit code: %1").arg(process.exitCode()));
            emit finished(m_name, false);
        }
    } else {
        emit progress(m_name, "failed", "Process failed to start or timed out.");
        emit finished(m_name, false);
    }
}

// ==========================================
// UninstallProgressDialog
// ==========================================
UninstallProgressDialog::UninstallProgressDialog(int totalItems, const QString& theme, QWidget *parent, const QString& lang, bool alwaysOnTop)
    : QDialog(parent), m_lang(lang) {
    setWindowTitle(Cau_Hinh_Go_Cai_Dat::getTranslation("Uninstaller", lang, "progress_title"));
    setModal(true);
    if (alwaysOnTop) {
        setWindowFlags(windowFlags() | Qt::WindowStaysOnTopHint);
    }
    
    setMinimumWidth(600);
    QVBoxLayout* mainLayout = new QVBoxLayout(this);
    
    QMap<QString, QString> c = Cau_Hinh::getThemeColors(theme);
    
    setStyleSheet(QString("QDialog { background-color: %1; } QLabel { color: %2; } "
                          "QProgressBar { border: 1px solid %3; background-color: %4; color: %2; text-align: center; border-radius: 4px; } "
                          "QProgressBar::chunk { background-color: #2568EC; border-radius: 3px; } "
                          "QScrollArea { background: transparent; border: none; } QWidget#uninstContainer { background: transparent; }")
        .arg(c["window_bg"], c["text_color"], c["border_color"], c["input_bg"]));
    
    QScrollArea* scrollArea = new QScrollArea(this);
    scrollArea->setWidgetResizable(true);
    QWidget* container = new QWidget();
    container->setObjectName("uninstContainer");
    gridLayout = new QGridLayout(container);
    gridLayout->setColumnStretch(0, 1);
    scrollArea->setWidget(container);
    mainLayout->addWidget(scrollArea);
    
    QHBoxLayout* bottomLayout = new QHBoxLayout();
    overallProgress = new QProgressBar(this);
    overallProgress->setMaximum(totalItems);
    overallProgress->setValue(0);
    overallProgress->setFormat("%v/%m - " + Cau_Hinh_Go_Cai_Dat::getTranslation("Uninstaller", m_lang, "progress_overall"));
    bottomLayout->addWidget(overallProgress);
    
    closeButton = new QPushButton(Cau_Hinh_Go_Cai_Dat::getTranslation("Uninstaller", m_lang, "close_btn"), this);
    closeButton->setObjectName("acceptButton");
    connect(closeButton, &QPushButton::clicked, this, &QDialog::accept);
    closeButton->setEnabled(false);
    bottomLayout->addWidget(closeButton);
    
    mainLayout->addLayout(bottomLayout);
}

void UninstallProgressDialog::setupItems(const QStringList& appNames) {
    for (int i = 0; i < appNames.size(); ++i) {
        QLabel* nameLabel = new QLabel(appNames[i], this);
        QLabel* statusLabel = new QLabel(Cau_Hinh_Go_Cai_Dat::getTranslation("Uninstaller", m_lang, "status_waiting"), this);
        statusLabel->setProperty("status", "waiting");
        
        gridLayout->addWidget(nameLabel, i, 0);
        gridLayout->addWidget(statusLabel, i, 1, Qt::AlignRight);
        itemLabels[appNames[i]] = statusLabel;
    }
    int numRows = qMin(appNames.size(), 5);
    setMinimumHeight(100 + (numRows * 35));
}

void UninstallProgressDialog::updateItemStatus(const QString& appName, const QString& status, const QString& detail) {
    if (!itemLabels.contains(appName)) return;
    QLabel* statusLabel = itemLabels[appName];
    statusLabel->setProperty("status", status);
    
    QString text = status;
    if (status == "uninstalling") text = Cau_Hinh_Go_Cai_Dat::getTranslation("Uninstaller", m_lang, "status_uninstalling");
    else if (status == "completed") text = Cau_Hinh_Go_Cai_Dat::getTranslation("Uninstaller", m_lang, "status_completed");
    else if (status == "failed") text = Cau_Hinh_Go_Cai_Dat::getTranslation("Uninstaller", m_lang, "status_failed");
    
    if (!detail.isEmpty()) statusLabel->setToolTip(detail);
    
    statusLabel->setText(text);
    statusLabel->style()->unpolish(statusLabel);
    statusLabel->style()->polish(statusLabel);
}

void UninstallProgressDialog::updateOverallProgress(int completedCount) {
    overallProgress->setValue(completedCount);
}

void UninstallProgressDialog::allDone() {
    closeButton->setEnabled(true);
}

// ==========================================
// LeftoverScanner
// ==========================================
LeftoverScanner::LeftoverScanner(const QList<QVariantMap>& uninstalledApps, QObject *parent)
    : QObject(parent), m_uninstalledApps(uninstalledApps) {}

void LeftoverScanner::run() {
    QList<LeftoverItem> leftovers;
    
    for (const QVariantMap& appData : m_uninstalledApps) {
        scanForApp(appData, leftovers);
    }
    
    emit finished(leftovers);
}

bool LeftoverScanner::isSafeToDelete(const QString& path) {
    QString p = QDir::toNativeSeparators(path).toLower();
    if (p.endsWith("program files") || p.endsWith("program files (x86)") || 
        p.endsWith("appdata\\local") || p.endsWith("appdata\\roaming") || 
        p.endsWith("programdata") || p.endsWith("windows") || p.endsWith("system32")) {
        return false;
    }
    if (p.length() <= 3) return false; // C:\ or D: (Root drive)
    return true;
}

void LeftoverScanner::scanForApp(const QVariantMap& appData, QList<LeftoverItem>& leftovers) {
    QString rawName = appData.value("name").toString();
    QString publisher = appData.value("publisher").toString();
    QString installLocation = appData.value("install_location").toString();
    
    // Clean app name (remove versions, architectures like " (x64)", " - 1.0.0")
    QString cleanName = rawName;
    int idx = cleanName.indexOf(QRegularExpression("\\s+[-vV]?\\d+\\.|\\s+\\("));
    if (idx > 0) cleanName = cleanName.left(idx).trimmed();
    
    if (cleanName.isEmpty()) return;

    QStringList searchPaths = {
        QStandardPaths::writableLocation(QStandardPaths::AppLocalDataLocation).section("/", 0, -2), // LocalAppData
        QStandardPaths::writableLocation(QStandardPaths::AppDataLocation).section("/", 0, -2),      // RoamingAppData
        QStandardPaths::writableLocation(QStandardPaths::GenericDataLocation).section("/", 0, -2),  // ProgramData (usually C:/ProgramData)
        "C:/Program Files",
        "C:/Program Files (x86)"
    };
    
    // 1. Scan Folders
    for (const QString& basePath : searchPaths) {
        QDir dir(basePath);
        if (!dir.exists()) continue;
        
        // Publisher\AppName or just AppName
        QStringList possibleSubDirs;
        if (!publisher.isEmpty()) {
            possibleSubDirs << publisher + "/" + cleanName;
            possibleSubDirs << publisher + "/" + rawName;
            // Also just publisher if it matches app name closely
        }
        possibleSubDirs << cleanName;
        possibleSubDirs << rawName;
        
        for (const QString& subDir : possibleSubDirs) {
            QString fullPath = basePath + "/" + subDir;
            if (QFileInfo::exists(fullPath) && isSafeToDelete(fullPath)) {
                LeftoverItem item;
                item.path = QDir::toNativeSeparators(fullPath);
                item.type = "Folder";
                item.appName = rawName;
                
                // Avoid duplicates
                bool exists = false;
                for (const auto& l : leftovers) if (l.path.compare(item.path, Qt::CaseInsensitive) == 0) exists = true;
                if (!exists) leftovers.append(item);
            }
        }
    }
    
    // 2. Install Location
    if (!installLocation.isEmpty() && QFileInfo::exists(installLocation) && isSafeToDelete(installLocation)) {
        LeftoverItem item;
        item.path = QDir::toNativeSeparators(installLocation);
        item.type = "Folder";
        item.appName = rawName;
        bool exists = false;
        for (const auto& l : leftovers) if (l.path.compare(item.path, Qt::CaseInsensitive) == 0) exists = true;
        if (!exists) leftovers.append(item);
    }
    
    // 3. Scan Registry
    QStringList rootKeys = {
        "HKEY_CURRENT_USER\\Software",
        "HKEY_LOCAL_MACHINE\\Software",
        "HKEY_LOCAL_MACHINE\\Software\\WOW6432Node"
    };
    
    for (const QString& rootKey : rootKeys) {
        QStringList possibleKeys;
        if (!publisher.isEmpty()) possibleKeys << rootKey + "\\" + publisher + "\\" + cleanName;
        possibleKeys << rootKey + "\\" + cleanName;
        possibleKeys << rootKey + "\\" + rawName;
        
        for (const QString& keyPath : possibleKeys) {
            QSettings reg(keyPath, QSettings::NativeFormat);
            if (reg.allKeys().count() > 0 || reg.childGroups().count() > 0) { // Key exists
                LeftoverItem item;
                item.path = keyPath;
                item.type = "Registry";
                item.appName = rawName;
                bool exists = false;
                for (const auto& l : leftovers) if (l.path.compare(item.path, Qt::CaseInsensitive) == 0) exists = true;
                if (!exists) leftovers.append(item);
            }
        }
    }
}

// ==========================================
// LeftoverCleanupDialog
// ==========================================
LeftoverCleanupDialog::LeftoverCleanupDialog(const QList<LeftoverItem>& items, const QString& theme, QWidget *parent, const QString& lang) : QDialog(parent) {
    setWindowTitle(Cau_Hinh_Go_Cai_Dat::getTranslation("Uninstaller", lang, "leftover_title"));
    setMinimumWidth(500);
    setMinimumHeight(400);
    
    QVBoxLayout* mainLayout = new QVBoxLayout(this);
    
    QLabel* descLabel = new QLabel(Cau_Hinh_Go_Cai_Dat::getTranslation("Uninstaller", lang, "leftover_desc"), this);
    descLabel->setWordWrap(true);
    mainLayout->addWidget(descLabel);
    
    QScrollArea* scrollArea = new QScrollArea(this);
    scrollArea->setWidgetResizable(true);
    QWidget* listWidget = new QWidget();
    listWidget->setObjectName("leftoverListContainer");
    QVBoxLayout* listLayout = new QVBoxLayout(listWidget);
    
    for (const auto& item : items) {
        QCheckBox* cb = new QCheckBox(QString("[%1] %2").arg(item.type, item.path), listWidget);
        cb->setChecked(true); // Default to checked
        listLayout->addWidget(cb);
        m_checkboxes.append(cb);
    }
    m_items = items;
    listLayout->addStretch();
    scrollArea->setWidget(listWidget);
    mainLayout->addWidget(scrollArea);
    
    QDialogButtonBox* buttons = new QDialogButtonBox(this);
    QPushButton* deleteBtn = buttons->addButton(Cau_Hinh_Go_Cai_Dat::getTranslation("Uninstaller", lang, "delete_btn"), QDialogButtonBox::AcceptRole);
    deleteBtn->setObjectName("acceptButton");
    QPushButton* cancelBtn = buttons->addButton(Cau_Hinh_Go_Cai_Dat::getTranslation("Uninstaller", lang, "cancel_btn"), QDialogButtonBox::RejectRole);
    cancelBtn->setObjectName("cancelButton");
    
    connect(buttons, &QDialogButtonBox::accepted, this, &QDialog::accept);
    connect(buttons, &QDialogButtonBox::rejected, this, &QDialog::reject);
    mainLayout->addWidget(buttons);
    
    QMap<QString, QString> c = Cau_Hinh::getThemeColors(theme);
    
    setStyleSheet(QString("QDialog { background-color: %1; } QLabel { color: %2; } QCheckBox { color: %2; } QScrollArea { background: transparent; border: none; } QWidget#leftoverListContainer { background: transparent; } "
        "QPushButton#acceptButton { background-color: #E53935; color: white; border: none; border-radius: 5px; padding: 8px 25px; font-weight: bold; } "
        "QPushButton#acceptButton:hover { background-color: #D32F2F; } "
        "QPushButton#cancelButton { background-color: %3; color: %4; border: none; border-radius: 5px; padding: 8px 25px; font-weight: bold; } "
        "QPushButton#cancelButton:hover { background-color: %5; }")
        .arg(c["window_bg"], c["text_color"], c["button_bg"], c["button_text"], c["hover_bg"]));
}

QList<LeftoverItem> LeftoverCleanupDialog::getSelectedItems() const {
    QList<LeftoverItem> selected;
    for (int i = 0; i < m_checkboxes.size(); ++i) {
        if (m_checkboxes[i]->isChecked()) {
            selected.append(m_items[i]);
        }
    }
    return selected;
}

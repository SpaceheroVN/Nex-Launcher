#include "Trinh_Go_Cai_Dat.h"
#include "Cau_Hinh_Go_Cai_Dat.h"
#include "Cong_Cu_Go_Cai_Dat.h"
#include "Hop_Thoai_Go_Cai_Dat.h"

#include <QHBoxLayout>
#include <QLabel>
#include "../NexMessageBox.h"
#include <QMenu>
#include <QFile>
#include <QJsonDocument>
#include <QJsonObject>
#include <QStandardPaths>
#include <QCoreApplication>
#include <QCloseEvent>
#include <QThreadPool>
#include <QPainter>
#include <QDir>
#include <QSettings>

Trinh_Go_Cai_Dat::Trinh_Go_Cai_Dat(const QString& language, const QString& theme, QWidget *parent)
    : QWidget(parent), m_ngon_ngu(language), m_chu_de(theme),
      m_isUninstalling(false), m_hop_thoai_tien_trinh(nullptr), loadingLabel(nullptr), scanningLabel(nullptr)
{
    setAttribute(Qt::WA_StyledBackground, true);
    setObjectName("uninstallerWidget");
    m_nhom_luong = new QThreadPool(this);
    loadConfig();
    
    thiet_lap_giao_dien();
    ap_dung_chu_de();
    startScan();
}

Trinh_Go_Cai_Dat::~Trinh_Go_Cai_Dat() {}

void Trinh_Go_Cai_Dat::loadConfig() {
    QString appDataPath = QStandardPaths::writableLocation(QStandardPaths::AppDataLocation) + "/Nex-Launcher";
    QString configPath = appDataPath + "/uninstaller_config.json";
    
    m_config["silent_uninstall"] = true;
    m_config["show_confirmation"] = true;
    m_config["show_progress_dialog"] = true;
    m_config["show_notification"] = true;
    m_config["minimize_on_close"] = true;

    QFile file(configPath);
    if (file.open(QIODevice::ReadOnly)) {
        QJsonDocument doc = QJsonDocument::fromJson(file.readAll());
        if (doc.isObject()) {
            QJsonObject obj = doc.object();
            for (auto it = obj.begin(); it != obj.end(); ++it) {
                m_config[it.key()] = it.value().toVariant();
            }
        }
        file.close();
    }
}

void Trinh_Go_Cai_Dat::saveConfig() {
    QString appDataPath = QStandardPaths::writableLocation(QStandardPaths::AppDataLocation) + "/Nex-Launcher";
    QString configPath = appDataPath + "/uninstaller_config.json";
    
    QFile file(configPath);
    if (file.open(QIODevice::WriteOnly)) {
        QJsonObject obj = QJsonObject::fromVariantMap(m_config);
        file.write(QJsonDocument(obj).toJson());
        file.close();
    }
}

void Trinh_Go_Cai_Dat::thiet_lap_giao_dien() {
    QVBoxLayout* mainLayout = new QVBoxLayout(this);
    mainLayout->setContentsMargins(15, 15, 15, 15);
    mainLayout->setSpacing(10);
    
    QHBoxLayout* topLayout = new QHBoxLayout();
    searchInput = new QLineEdit(this);
    searchInput->setPlaceholderText(Cau_Hinh_Go_Cai_Dat::getTranslation("Uninstaller", m_ngon_ngu, "search_placeholder"));
    connect(searchInput, &QLineEdit::textChanged, this, &Trinh_Go_Cai_Dat::filterAppList);
    topLayout->addWidget(searchInput, 1);
    
    refreshButton = new QPushButton(Cau_Hinh_Go_Cai_Dat::getTranslation("Uninstaller", m_ngon_ngu, "refresh_btn"), this);
    connect(refreshButton, &QPushButton::clicked, this, &Trinh_Go_Cai_Dat::startScan);
    topLayout->addWidget(refreshButton);
    
    QWidget* searchWidget = new QWidget(this);
    searchWidget->setObjectName("searchWidget");
    searchWidget->setLayout(topLayout);
    mainLayout->addWidget(searchWidget);
    
    scanningLabel = new QLabel(Cau_Hinh_Go_Cai_Dat::getTranslation("Uninstaller", m_ngon_ngu, "loading_text"), this);
    scanningLabel->setAlignment(Qt::AlignCenter);
    scanningLabel->setObjectName("scanningLabel");
    scanningLabel->hide();
    mainLayout->addWidget(scanningLabel);
    
    // Header
    QWidget* headerContainer = new QWidget(this);
    headerContainer->setObjectName("headerContainer");
    QHBoxLayout* headerLayout = new QHBoxLayout(headerContainer);
    headerLayout->setContentsMargins(10, 5, 24, 5);
    headerLayout->setSpacing(10);
    
    selectAllHeaderCheck = new QCheckBox(headerContainer);
    selectAllHeaderCheck->setToolTip(Cau_Hinh_Go_Cai_Dat::getTranslation("Uninstaller", m_ngon_ngu, "header_select_all_tooltip"));
    connect(selectAllHeaderCheck, &QCheckBox::toggled, this, &Trinh_Go_Cai_Dat::toggleAllVisible);
    headerLayout->addWidget(selectAllHeaderCheck);
    
    auto createHeaderBtn = [this](const QString& text, const QString& col) {
        QPushButton* btn = new QPushButton(text);
        btn->setProperty("isHeaderBtn", true);
        btn->setStyleSheet(QString("text-align: left; background: transparent; color: %1; font-weight: bold; border: none; padding: 0px;")
                           .arg(m_chu_de == "Light" ? "#333333" : "#FFFFFF"));
        btn->setCursor(Qt::PointingHandCursor);
        btn->setIconSize(QSize(12, 12));
        connect(btn, &QPushButton::clicked, this, [this, col]() { sortAppsBy(col); });
        m_headerButtons[col] = btn;
        return btn;
    };
    
    headerLayout->addWidget(createHeaderBtn(Cau_Hinh_Go_Cai_Dat::getTranslation("Uninstaller", m_ngon_ngu, "header_name"), "name"), 5);
    headerLayout->addWidget(createHeaderBtn(Cau_Hinh_Go_Cai_Dat::getTranslation("Uninstaller", m_ngon_ngu, "header_publisher"), "publisher"), 3);
    headerLayout->addWidget(createHeaderBtn(Cau_Hinh_Go_Cai_Dat::getTranslation("Uninstaller", m_ngon_ngu, "header_date"), "install_date"), 1);
    
    QPushButton* sizeBtn = createHeaderBtn(Cau_Hinh_Go_Cai_Dat::getTranslation("Uninstaller", m_ngon_ngu, "header_size"), "size_kb");
    sizeBtn->setLayoutDirection(Qt::LeftToRight);
    sizeBtn->setStyleSheet(QString("text-align: right; background: transparent; color: %1; font-weight: bold; border: none; padding: 0px;")
                           .arg(m_chu_de == "Light" ? "#333333" : "#FFFFFF"));
    headerLayout->addWidget(sizeBtn, 2);
    
    QVBoxLayout* listAndHeaderLayout = new QVBoxLayout();
    listAndHeaderLayout->setSpacing(0);
    listAndHeaderLayout->setContentsMargins(0, 0, 0, 0);
    listAndHeaderLayout->addWidget(headerContainer);
    
    // List Area
    scrollArea = new QScrollArea(this);
    scrollArea->setWidgetResizable(true);
    scrollArea->setVerticalScrollBarPolicy(Qt::ScrollBarAlwaysOn);
    scrollArea->setObjectName("contentScroll");
    listContainer = new QWidget(this);
    listContainer->setObjectName("list_container");
    listLayout = new QVBoxLayout(listContainer);
    listLayout->setContentsMargins(0, 0, 0, 0);
    listLayout->setSpacing(0);
    listLayout->addStretch();
    scrollArea->setWidget(listContainer);
    listAndHeaderLayout->addWidget(scrollArea);
    
    mainLayout->addLayout(listAndHeaderLayout, 1);
    
    // Bottom Layout
    QHBoxLayout* bottomLayout = new QHBoxLayout();
    
    statusLabel = new QLabel("", this);
    statusLabel->setObjectName("statusLabel");
    bottomLayout->addWidget(statusLabel, 1, Qt::AlignLeft);
    
    uninstallButton = new QPushButton(Cau_Hinh_Go_Cai_Dat::getTranslation("Uninstaller", m_ngon_ngu, "uninstall_btn"), this);
    uninstallButton->setObjectName("uninstallButton");
    uninstallButton->setMinimumSize(150, 40);
    connect(uninstallButton, &QPushButton::clicked, this, &Trinh_Go_Cai_Dat::uninstallSelected);
    bottomLayout->addWidget(uninstallButton);
    
    QWidget* bottomBarWidget = new QWidget(this);
    bottomBarWidget->setObjectName("bottomBarWidget");
    bottomBarWidget->setLayout(bottomLayout);
    mainLayout->addWidget(bottomBarWidget);
    
    updateHeaderIcons();
}

void Trinh_Go_Cai_Dat::ap_dung_chu_de() {
    QString appDataPath = QStandardPaths::writableLocation(QStandardPaths::AppDataLocation) + "/Nex-Launcher";
    QFile f(appDataPath + "/launcher_config.json");
    int radius = 15;
    if (f.open(QIODevice::ReadOnly)) {
        QJsonDocument doc = QJsonDocument::fromJson(f.readAll());
        if (doc.object().contains("border_radius") && doc.object()["border_radius"].toInt() == 0) {
            radius = 0;
        }
    }
    setStyleSheet(Cau_Hinh_Go_Cai_Dat::getUninstallerStyle(m_chu_de, radius));
}

void Trinh_Go_Cai_Dat::cap_nhat_tieng(const QString& lang) {
    if (m_ngon_ngu != lang) {
        m_ngon_ngu = lang;
        searchInput->setPlaceholderText(Cau_Hinh_Go_Cai_Dat::getTranslation("Uninstaller", m_ngon_ngu, "search_placeholder"));
        refreshButton->setText(Cau_Hinh_Go_Cai_Dat::getTranslation("Uninstaller", m_ngon_ngu, "refresh_btn"));
        uninstallButton->setText(Cau_Hinh_Go_Cai_Dat::getTranslation("Uninstaller", m_ngon_ngu, "uninstall_btn"));
        
        if (m_headerButtons.contains("name")) m_headerButtons["name"]->setText(Cau_Hinh_Go_Cai_Dat::getTranslation("Uninstaller", m_ngon_ngu, "header_name"));
        if (m_headerButtons.contains("publisher")) m_headerButtons["publisher"]->setText(Cau_Hinh_Go_Cai_Dat::getTranslation("Uninstaller", m_ngon_ngu, "header_publisher"));
        if (m_headerButtons.contains("install_date")) m_headerButtons["install_date"]->setText(Cau_Hinh_Go_Cai_Dat::getTranslation("Uninstaller", m_ngon_ngu, "header_date"));
        if (m_headerButtons.contains("size_kb")) m_headerButtons["size_kb"]->setText(Cau_Hinh_Go_Cai_Dat::getTranslation("Uninstaller", m_ngon_ngu, "header_size"));
        selectAllHeaderCheck->setToolTip(Cau_Hinh_Go_Cai_Dat::getTranslation("Uninstaller", m_ngon_ngu, "header_select_all_tooltip"));
        
        // Sidebar items removed
        
        updateHeaderIcons();
        updateStatusLabel();
    }
}

void Trinh_Go_Cai_Dat::cap_nhat_chu_de(const QString& theme) {
    if (m_chu_de != theme) {
        m_chu_de = theme;
        ap_dung_chu_de();
        updateHeaderIcons();
        if (!m_appRows.isEmpty()) {
            clearList();
            sortAndRedisplayApps();
        }
    }
}

void Trinh_Go_Cai_Dat::clearList() {
    m_appRows.clear();
    while (listLayout->count() > 1) {
        QLayoutItem* item = listLayout->takeAt(0);
        if (item->widget()) {
            item->widget()->deleteLater();
        }
        delete item;
    }
}

void Trinh_Go_Cai_Dat::startScan() {
    m_hasScanned = true;
    
    if (scanningLabel) {
        scanningLabel->show();
    }
    
    if (m_allApps.isEmpty()) {
        clearList();
        if (!loadingLabel) {
            loadingLabel = new QLabel(Cau_Hinh_Go_Cai_Dat::getTranslation("Uninstaller", m_ngon_ngu, "loading_text"), this);
            loadingLabel->setAlignment(Qt::AlignCenter);
            listLayout->insertWidget(0, loadingLabel);
        }
    }
    
    refreshButton->setEnabled(false);
    uninstallButton->setEnabled(false);
    
    AppScannerWorker* scanner = new AppScannerWorker(m_ngon_ngu, this);
    connect(scanner, &AppScannerWorker::finished, this, &Trinh_Go_Cai_Dat::populateAppList);
    connect(scanner, &AppScannerWorker::finished, scanner, &QObject::deleteLater);
    scanner->start();
}

void Trinh_Go_Cai_Dat::populateAppList(const QList<QVariantMap>& apps) {
    if (loadingLabel) {
        loadingLabel->deleteLater();
        loadingLabel = nullptr;
    }
    if (scanningLabel) {
        scanningLabel->hide();
    }
    
    m_allApps = apps;
    searchInput->clear();
    refreshButton->setEnabled(true);
    uninstallButton->setEnabled(true);
    
    clearList();
    
    if (apps.isEmpty()) {
        QLabel* noApps = new QLabel(Cau_Hinh_Go_Cai_Dat::getTranslation("Uninstaller", m_ngon_ngu, "no_apps_found_body"), this);
        noApps->setAlignment(Qt::AlignCenter);
        listLayout->insertWidget(0, noApps);
    } else {
        sortAndRedisplayApps();
    }
    updateStatusLabel();
}

void Trinh_Go_Cai_Dat::sortAppsBy(const QString& column) {
    if (m_sortColumn == column) {
        m_sortAscending = !m_sortAscending;
    } else {
        m_sortColumn = column;
        m_sortAscending = true;
    }
    sortAndRedisplayApps();
    updateHeaderIcons();
}

void Trinh_Go_Cai_Dat::updateHeaderIcons() {
    QColor iconColor = m_chu_de == "Light" ? QColor(28, 30, 33) : QColor(228, 230, 235);
    
    QPixmap basePixmap(":/icons/sort.svg");
    QPixmap colorized(basePixmap.size());
    colorized.fill(Qt::transparent);
    QPainter painter(&colorized);
    painter.drawPixmap(0, 0, basePixmap);
    painter.setCompositionMode(QPainter::CompositionMode_SourceIn);
    painter.fillRect(colorized.rect(), iconColor);
    painter.end();
    
    QIcon iconDesc(colorized);
    QImage img = colorized.toImage().mirrored(false, true);
    QIcon iconAsc(QPixmap::fromImage(img));
    
    QPixmap emptyPixmap(12, 12);
    emptyPixmap.fill(Qt::transparent);
    QIcon emptyIcon(emptyPixmap);

    for (auto it = m_headerButtons.begin(); it != m_headerButtons.end(); ++it) {
        if (it.key() == m_sortColumn) {
            if (it.key() == "size_kb") {
                it.value()->setIcon(m_sortAscending ? iconAsc : iconDesc);
            } else {
                it.value()->setIcon(m_sortAscending ? iconDesc : iconAsc);
            }
        } else {
            it.value()->setIcon(emptyIcon);
        }
        
        QString alignStr = (it.key() == "size_kb") ? "right" : "left";
        QString paddingStr = (it.key() == "size_kb") ? "0px 4px 0px 0px" : "0px 0px 0px 16px";
        it.value()->setStyleSheet(QString("text-align: %1; background: transparent; color: %2; font-weight: bold; border: none; padding: %3;")
                           .arg(alignStr)
                           .arg(m_chu_de == "Light" ? "#333333" : "#FFFFFF")
                           .arg(paddingStr));
    }
}

void Trinh_Go_Cai_Dat::sortAndRedisplayApps() {
    std::sort(m_allApps.begin(), m_allApps.end(), [this](const QVariantMap& a, const QVariantMap& b) {
        const QVariantMap& first = m_sortAscending ? a : b;
        const QVariantMap& second = m_sortAscending ? b : a;
        
        if (m_sortColumn == "size_kb") {
            return first.value("size_kb").toULongLong() < second.value("size_kb").toULongLong();
        } else if (m_sortColumn == "install_date") {
            return first.value("install_date").toString() < second.value("install_date").toString();
        } else if (m_sortColumn == "publisher") {
            return first.value("publisher").toString().compare(second.value("publisher").toString(), Qt::CaseInsensitive) < 0;
        } else {
            return first.value("name").toString().compare(second.value("name").toString(), Qt::CaseInsensitive) < 0;
        }
    });
    
    if (m_appRows.isEmpty()) {
        for (const auto& appData : m_allApps) {
            QWidget* row = Cong_Cu_Go_Cai_Dat::createAppRowWidget(appData, m_ngon_ngu, m_chu_de, listContainer);
            listLayout->insertWidget(listLayout->count() - 1, row);
            m_appRows.append(row);
            
            QCheckBox* cb = row->findChild<QCheckBox*>();
            if (cb) {
                connect(cb, &QCheckBox::stateChanged, this, &Trinh_Go_Cai_Dat::updateStatusLabel);
            }
        }
    } else {
        // Reorder widgets without recreating them
        for (int i = 0; i < m_allApps.size(); ++i) {
            QString appName = m_allApps[i].value("name").toString();
            for (int j = 0; j < m_appRows.size(); ++j) {
                if (m_appRows[j]->property("appName").toString() == appName) {
                    listLayout->removeWidget(m_appRows[j]);
                    listLayout->insertWidget(i, m_appRows[j]);
                    break;
                }
            }
        }
    }
    filterAppList(searchInput->text());
}

void Trinh_Go_Cai_Dat::setFilterCategory(int index) {
    m_currentCategory = index;
    filterAppList(searchInput->text());
}

void Trinh_Go_Cai_Dat::filterAppList(const QString& text) {
    if (listContainer) {
        listContainer->setUpdatesEnabled(false);
    }
    
    QDate recentDate = QDate::currentDate().addDays(-7);
    
    for (QWidget* row : m_appRows) {
        if (row && row->property("isAppRow").toBool()) {
            QString name = row->property("appName").toString();
            QString installDateStr = row->property("appInstallDate").toString();
            qint64 sizeKb = row->property("appSizeKb").toLongLong();
            bool isSystem = row->property("appSystemComponent").toBool();
            
            bool matchSearch = name.contains(text, Qt::CaseInsensitive) || text.isEmpty();
            bool matchCategory = true;
            
            if (m_currentCategory == 1) { // Recent
                QDate installDate = QDate::fromString(installDateStr, "yyyy-MM-dd");
                matchCategory = (installDate.isValid() && installDate >= recentDate);
            } else if (m_currentCategory == 2) { // Large programs (> 500MB)
                matchCategory = (sizeKb > 500 * 1024);
            } else if (m_currentCategory == 3) { // System
                matchCategory = isSystem;
            } else if (m_currentCategory == 4) { // Third-party
                matchCategory = !isSystem;
            }
            
            row->setVisible(matchSearch && matchCategory);
        }
    }
    
    if (listContainer) {
        listContainer->setUpdatesEnabled(true);
    }
}

void Trinh_Go_Cai_Dat::toggleAllVisible(bool checked) {
    for (QWidget* row : m_appRows) {
        if (row && row->property("isAppRow").toBool() && row->isVisible()) {
            QCheckBox* cb = row->findChild<QCheckBox*>();
            if (cb) cb->setChecked(checked);
        }
    }
}

void Trinh_Go_Cai_Dat::updateStatusLabel() {
    int count = 0;
    for (QWidget* row : m_appRows) {
        if (row && row->property("isAppRow").toBool()) {
            QCheckBox* cb = row->findChild<QCheckBox*>();
            if (cb && cb->isChecked()) count++;
        }
    }
    QString text = Cau_Hinh_Go_Cai_Dat::getTranslation("Uninstaller", m_ngon_ngu, "status_selected").arg(count);
    statusLabel->setText(text);
}

void Trinh_Go_Cai_Dat::reloadConfig() {
    m_config.clear();
    loadConfig();
}

void Trinh_Go_Cai_Dat::uninstallSelected() {
    if (m_isUninstalling) return;

    QList<QVariantMap> appsToUninstall;
    QStringList appNames;
    
    for (QWidget* row : m_appRows) {
        if (row && row->property("isAppRow").toBool()) {
            QCheckBox* cb = row->findChild<QCheckBox*>();
            if (cb && cb->isChecked()) {
                QString name = row->property("appName").toString();
                appNames.append(name);
                for (const auto& app : m_allApps) {
                    if (app.value("name").toString() == name) {
                        appsToUninstall.append(app);
                        break;
                    }
                }
            }
        }
    }
    
    if (appsToUninstall.isEmpty()) return;
    
    if (m_config.value("show_confirmation", true).toBool()) {
        ConfirmUninstallDialog confirm(appsToUninstall, m_chu_de, this, m_ngon_ngu);
        if (confirm.exec() != QDialog::Accepted) return;
        m_autoCleanup = confirm.isAutoCleanupChecked();
    } else {
        m_autoCleanup = false;
    }
    
    m_uninstalledApps = appsToUninstall;
    
    m_isUninstalling = true;
    uninstallButton->setEnabled(false);
    m_totalItemsToUninstall = appsToUninstall.size();
    m_so_luong_hoan_thanh = 0;
    
    if (m_config.value("show_progress_dialog", true).toBool()) {
        if (m_hop_thoai_tien_trinh) {
            m_hop_thoai_tien_trinh->deleteLater();
        }
        m_hop_thoai_tien_trinh = new UninstallProgressDialog(m_totalItemsToUninstall, m_chu_de, this, m_ngon_ngu, false);
        m_hop_thoai_tien_trinh->setupItems(appNames);
        m_hop_thoai_tien_trinh->show();
    }
    
    // Force single-threaded uninstallation. Windows Installer (msiexec) and most uninstallers do not support concurrent uninstallations.
    m_nhom_luong->setMaxThreadCount(1);
    
    for (const auto& app : appsToUninstall) {
        Tac_Vu_Go_Cai_Dat* worker = new Tac_Vu_Go_Cai_Dat(app, m_config.value("silent_uninstall", true).toBool());
        connect(worker, &Tac_Vu_Go_Cai_Dat::progress, this, &Trinh_Go_Cai_Dat::khi_tien_trinh_cap_nhat, Qt::QueuedConnection);
        connect(worker, &Tac_Vu_Go_Cai_Dat::finished, this, &Trinh_Go_Cai_Dat::khi_tien_trinh_hoan_thanh, Qt::QueuedConnection);
        
        m_nhom_luong->start([worker]() {
            worker->run();
            worker->deleteLater();
        });
    }
}

void Trinh_Go_Cai_Dat::khi_tien_trinh_cap_nhat(const QString& name, const QString& status, const QString& detail) {
    if (m_hop_thoai_tien_trinh) {
        m_hop_thoai_tien_trinh->updateItemStatus(name, status, detail);
    }
}

void Trinh_Go_Cai_Dat::khi_tien_trinh_hoan_thanh(const QString& name, bool success) {
    m_so_luong_hoan_thanh++;
    if (m_hop_thoai_tien_trinh) {
        m_hop_thoai_tien_trinh->updateOverallProgress(m_so_luong_hoan_thanh);
    }
    
    if (m_so_luong_hoan_thanh >= m_totalItemsToUninstall) {
        m_isUninstalling = false;
        uninstallButton->setEnabled(true);
        if (m_hop_thoai_tien_trinh) m_hop_thoai_tien_trinh->allDone();
        if (m_config.value("show_notification", true).toBool()) {
            emit statusMessage("Uninstall operations completed. Scanning for leftovers...", 3000);
        }
        
        LeftoverScanner* scanner = new LeftoverScanner(m_uninstalledApps);
        connect(scanner, &LeftoverScanner::finished, this, &Trinh_Go_Cai_Dat::onLeftoverScanFinished, Qt::QueuedConnection);
        m_nhom_luong->start([scanner]() {
            scanner->run();
            scanner->deleteLater();
        });
    }
}

void Trinh_Go_Cai_Dat::onLeftoverScanFinished(const QList<LeftoverItem>& leftovers) {
    if (!leftovers.isEmpty()) {
        if (m_autoCleanup) {
            int deletedCount = 0;
            for (const LeftoverItem& item : leftovers) {
                if (item.type == "Folder") {
                    QDir dir(item.path);
                    if (dir.removeRecursively()) deletedCount++;
                } else if (item.type == "Registry") {
                    QSettings reg(item.path, QSettings::NativeFormat);
                    reg.remove("");
                    deletedCount++;
                }
            }
            if (m_config.value("show_notification", true).toBool()) {
                emit statusMessage(QString("Automatically cleaned %1 leftover items.").arg(deletedCount), 3000);
            }
        } else {
            LeftoverCleanupDialog dialog(leftovers, m_chu_de, this, m_ngon_ngu);
            if (dialog.exec() == QDialog::Accepted) {
                QList<LeftoverItem> toDelete = dialog.getSelectedItems();
                int deletedCount = 0;
                for (const LeftoverItem& item : toDelete) {
                    if (item.type == "Folder") {
                        QDir dir(item.path);
                        if (dir.removeRecursively()) deletedCount++;
                    } else if (item.type == "Registry") {
                        QSettings reg(item.path, QSettings::NativeFormat);
                        reg.clear();
                        deletedCount++;
                    }
                }
                emit statusMessage(QString("Cleaned up %1 leftover items.").arg(deletedCount), 3000);
            }
        }
    }
    startScan(); // Refresh list after uninstall and cleanup
}



#include "Trinh_Cai_Dat.h"
#include "Cau_Hinh_Cai_Dat.h"
#include "Tac_Vu_Cai_Dat.h"
#include "Hop_Thoai_Cai_Dat.h"
#include <QPushButton>
#include <algorithm>

#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QLabel>
#include "../NexMessageBox.h"
#include <QCloseEvent>
#include <QTimer>
#include <QMenu>
#include <QAction>
#include <QJsonDocument>
#include <QJsonObject>
#include <QJsonArray>
#include <QFile>
#include <QStandardPaths>
#include <QNetworkAccessManager>
#include <QNetworkReply>
#include <QEventLoop>
#include <QDir>
#include <QCheckBox>
#include <QPainter>
#include <QImage>

#include "Cong_Cu_Cai_Dat.h"

Trinh_Cai_Dat::Trinh_Cai_Dat(const QString& language, const QString& theme, QWidget *parent)
    : QWidget(parent), m_ngon_ngu(language), m_chu_de(theme),
      m_dang_cai_dat(false), m_so_luong_hoan_thanh(0), m_tong_so_can_cai(0)
{
    setAttribute(Qt::WA_StyledBackground, true);
    m_thu_muc_tam = new QTemporaryDir();
    m_nhom_luong = new QThreadPool(this);
    
    initUI();
    thiet_lap_bo_cuc();
    
    ap_dung_chu_de();
    cap_nhat_ngon_ngu();
    
    tai_du_lieu();
    lam_moi_cac_trang();
}

Trinh_Cai_Dat::~Trinh_Cai_Dat() {
    delete m_thu_muc_tam;
}

void Trinh_Cai_Dat::initUI() {
    // Header
    headerContainer = new QWidget(this);
    headerContainer->setObjectName("headerContainer");
    QHBoxLayout* headerLayout = new QHBoxLayout(headerContainer);
    headerLayout->setContentsMargins(10, 5, 24, 5);
    headerLayout->setSpacing(10);
    
    selectAllHeaderCheck = new QCheckBox(headerContainer);
    selectAllHeaderCheck->setToolTip(Cau_Hinh_Cai_Dat::getTranslation("Installer", m_ngon_ngu, "header_select_all_tooltip"));
    connect(selectAllHeaderCheck, &QCheckBox::toggled, this, &Trinh_Cai_Dat::toggleAllVisible);
    headerLayout->addWidget(selectAllHeaderCheck);
    
    auto createHeaderBtn = [this](const QString& text, const QString& col) {
        QPushButton* btn = new QPushButton(text);
        btn->setProperty("isHeaderBtn", true);
        QString textAlign = (col == "source") ? "center" : "left";
        btn->setStyleSheet(QString("text-align: %1; background: transparent; color: %2; font-weight: bold; border: none; padding: 0px;")
                           .arg(textAlign, m_chu_de == "Light" ? "#333333" : "#FFFFFF"));
        btn->setCursor(Qt::PointingHandCursor);
        btn->setIconSize(QSize(12, 12));
        connect(btn, &QPushButton::clicked, this, [this, col]() { sortAppsBy(col); });
        m_headerButtons[col] = btn;
        return btn;
    };
    
    headerLayout->addWidget(createHeaderBtn(Cau_Hinh_Cai_Dat::getTranslation("Installer", m_ngon_ngu, "header_name"), "name"), 5);
    headerLayout->addWidget(createHeaderBtn(Cau_Hinh_Cai_Dat::getTranslation("Installer", m_ngon_ngu, "header_category"), "category"), 3);
    headerLayout->addWidget(createHeaderBtn(Cau_Hinh_Cai_Dat::getTranslation("Installer", m_ngon_ngu, "header_source"), "source"), 2);
    
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
    
    m_nut_them = new QPushButton(this);
    m_nut_them->setIcon(QIcon(":/icons/add.svg"));
    m_nut_them->setFixedSize(36, 36);
    m_nut_them->setIconSize(QSize(22, 22));
    m_nut_them->setObjectName("addButton");
    connect(m_nut_them, &QPushButton::clicked, this, &Trinh_Cai_Dat::them_muc_moi);
    
    m_nut_xoa = new QPushButton(this);
    m_nut_xoa->setIcon(QIcon(":/icons/minus.svg"));
    m_nut_xoa->setFixedSize(36, 36);
    m_nut_xoa->setIconSize(QSize(22, 22));
    m_nut_xoa->setObjectName("removeButton");
    connect(m_nut_xoa, &QPushButton::clicked, this, &Trinh_Cai_Dat::xoa_cac_muc_da_chon);
    
    m_o_tim_kiem = new QLineEdit(this);
    m_o_tim_kiem->setObjectName("searchInput");
    m_o_tim_kiem->setClearButtonEnabled(true);
    m_o_tim_kiem->setMinimumWidth(150);
    connect(m_o_tim_kiem, &QLineEdit::textChanged, this, &Trinh_Cai_Dat::filterAppList);
    
    m_nut_cap_nhat = new QPushButton(m_ngon_ngu == "VN" ? "Cập Nhật Dữ Liệu" : "Update Database", this);
    m_nut_cap_nhat->setObjectName("updateButton");
    connect(m_nut_cap_nhat, &QPushButton::clicked, this, &Trinh_Cai_Dat::cap_nhat_co_so_du_lieu);
    
    m_nut_thuc_hien_cai = new QPushButton(this);
    m_nut_thuc_hien_cai->setObjectName("installBtn");
    connect(m_nut_thuc_hien_cai, &QPushButton::clicked, this, &Trinh_Cai_Dat::thuc_hien_cai_dat);
}

void Trinh_Cai_Dat::thiet_lap_bo_cuc() {
    QHBoxLayout* bottomLayout = new QHBoxLayout();
    bottomLayout->addWidget(m_nut_them);
    bottomLayout->addWidget(m_nut_xoa);
    bottomLayout->addSpacing(20);
    bottomLayout->addWidget(m_o_tim_kiem);
    bottomLayout->addWidget(m_nut_cap_nhat);
    bottomLayout->addStretch(1);
    bottomLayout->addWidget(m_nut_thuc_hien_cai);
    
    QWidget* bottomBarWidget = new QWidget();
    bottomBarWidget->setObjectName("bottomBarWidget");
    bottomBarWidget->setLayout(bottomLayout);
    
    QVBoxLayout* listAndHeaderLayout = new QVBoxLayout();
    listAndHeaderLayout->setSpacing(0);
    listAndHeaderLayout->setContentsMargins(0, 0, 0, 0);
    listAndHeaderLayout->addWidget(headerContainer);
    listAndHeaderLayout->addWidget(scrollArea);
    
    QVBoxLayout* mainLayout = new QVBoxLayout();
    mainLayout->setSpacing(10);
    mainLayout->addLayout(listAndHeaderLayout, 1);
    mainLayout->addWidget(bottomBarWidget);
    mainLayout->setContentsMargins(15, 15, 15, 15);
    
    setLayout(mainLayout);
}

void Trinh_Cai_Dat::ap_dung_chu_de() {
    setStyleSheet(Cau_Hinh_Cai_Dat::getInstallerStyle(m_chu_de));
}

void Trinh_Cai_Dat::cap_nhat_ngon_ngu() {
    if (m_o_tim_kiem) m_o_tim_kiem->setPlaceholderText(Cau_Hinh_Cai_Dat::getTranslation("Installer", m_ngon_ngu, "search_btn"));
    m_nut_cap_nhat->setText(m_ngon_ngu == "VN" ? "Cập Nhật Dữ Liệu" : "Update Database");
    
    if (m_currentFilter == "updates") {
        m_nut_thuc_hien_cai->setText(m_ngon_ngu == "VN" ? "Cập nhật" : "Update");
    } else {
        m_nut_thuc_hien_cai->setText(Cau_Hinh_Cai_Dat::getTranslation("Installer", m_ngon_ngu, "install_btn"));
    }
}

void Trinh_Cai_Dat::cap_nhat_tieng(const QString& lang) {
    if (m_ngon_ngu != lang) {
        m_ngon_ngu = lang;
        cap_nhat_ngon_ngu();
        lam_moi_cac_trang();
    }
}

void Trinh_Cai_Dat::cap_nhat_chu_de(const QString& theme) {
    if (m_chu_de != theme) {
        m_chu_de = theme;
        ap_dung_chu_de();
    }
}


void Trinh_Cai_Dat::tai_du_lieu() {
    QString appDataPath = QStandardPaths::writableLocation(QStandardPaths::AppDataLocation) + "/Nex-Launcher";
    
    // Load config
    QString configPath = appDataPath + "/installer_config.json";
    m_cai_dat.clear();
    m_cai_dat["show_progress_dialog"] = true;
    m_cai_dat["auto_select_all"] = true;
    m_cai_dat["minimize_on_close"] = true;
    m_cai_dat["detailed_categories"] = false;
    m_cai_dat["multi_thread"] = true;
    m_cai_dat["hide_unsupported"] = false;
    m_cai_dat["show_complete_dialog"] = true;
    
    QFile configFile(configPath);
    if (configFile.open(QIODevice::ReadOnly)) {
        QJsonObject root = QJsonDocument::fromJson(configFile.readAll()).object();
        for (auto it = root.begin(); it != root.end(); ++it) {
            m_cai_dat[it.key()] = it.value().toVariant();
        }
        configFile.close();
    }
    
    // Load database
    QString dataFile = appDataPath + "/installer_data.json";
    m_co_so_du_lieu.clear();
    QFile dataFileObj(dataFile);
    if (dataFileObj.exists() && dataFileObj.size() > 0 && dataFileObj.open(QIODevice::ReadOnly)) {
        QJsonDocument doc = QJsonDocument::fromJson(dataFileObj.readAll());
        if (doc.isArray()) {
            QJsonArray dbArray = doc.array();
            for (const QJsonValue& val : dbArray) {
                m_co_so_du_lieu.append(val.toObject().toVariantMap());
            }
        } else if (doc.isObject()) {
            // Old format migration
            QJsonObject root = doc.object();
            QJsonArray dbArray = root["database"].toArray();
            for (const QJsonValue& val : dbArray) {
                m_co_so_du_lieu.append(val.toObject().toVariantMap());
            }
        }
        dataFileObj.close();
    } else {
        // Fallback to internal Basic.json first time
        QFile basicFile(":/Basic.json");
        if (basicFile.open(QIODevice::ReadOnly)) {
            QJsonDocument doc = QJsonDocument::fromJson(basicFile.readAll());
            if (doc.isArray()) {
                QJsonArray dbArray = doc.array();
                for (const QJsonValue& val : dbArray) {
                    m_co_so_du_lieu.append(val.toObject().toVariantMap());
                }
            }
            basicFile.close();
        }
        luu_du_lieu();
    }
}

void Trinh_Cai_Dat::cap_nhat_co_so_du_lieu() {
    emit statusMessage("Fetching latest database from GitHub...", 3000);
    QNetworkAccessManager* manager = new QNetworkAccessManager(this);
    QNetworkRequest request(QUrl("https://raw.githubusercontent.com/SpaceheroVN/Nex-Launcher/main/Source/Basic.json"));
    request.setHeader(QNetworkRequest::UserAgentHeader, "Nex-Launcher-Installer");
    QNetworkReply* reply = manager->get(request);
    
    QObject::connect(reply, &QNetworkReply::finished, this, [this, manager, reply]() {
        reply->deleteLater();
        if (reply->error() == QNetworkReply::NoError) {
            QJsonDocument doc = QJsonDocument::fromJson(reply->readAll());
            if (doc.isArray()) {
                m_co_so_du_lieu.clear();
                QJsonArray dbArray = doc.array();
                for (const QJsonValue& val : dbArray) {
                    m_co_so_du_lieu.append(val.toObject().toVariantMap());
                }
                luu_du_lieu();
                lam_moi_cac_trang();
                NexMessageBox::information(this, "Success", "Database updated successfully.");
            }
        } else {
            NexMessageBox::warning(this, "Error", "Failed to update database from GitHub.");
        }
        manager->deleteLater();
    });
}

void Trinh_Cai_Dat::luu_du_lieu() {
    QString appDataPath = QStandardPaths::writableLocation(QStandardPaths::AppDataLocation) + "/Nex-Launcher";
    QString dataFile = appDataPath + "/installer_data.json";
    QFile file(dataFile);
    if (file.open(QIODevice::WriteOnly)) {
        QJsonArray dbArray;
        for (const auto& item : m_co_so_du_lieu) {
            dbArray.append(QJsonObject::fromVariantMap(item));
        }
        QJsonDocument doc(dbArray);
        file.write(doc.toJson());
        file.close();
    }
}

void Trinh_Cai_Dat::lam_moi_cac_trang() {
    for (QWidget* row : m_appRows) {
        listLayout->removeWidget(row);
        row->deleteLater();
    }
    m_appRows.clear();
    
    Cong_Cu_Cai_Dat::SourceEditHandler sourceEditHandler = [this](QWidget* parent, QVariantMap& itemData, const QString& newType) {
        QVariantMap source = itemData.value("source").toMap();
        QString currentValue = source.value("value").toString();
        QString currentArgs = source.value("silent_args").toString();
        
        SourceEditDialog dialog(newType, currentValue, currentArgs, "Enter source URL or path...", parent, m_ngon_ngu, m_chu_de);
        if (dialog.exec() == QDialog::Accepted) {
            auto [newValue, newArgs] = dialog.getData();
            source["type"] = newType;
            source["value"] = newValue;
            source["silent_args"] = newArgs;
            itemData["source"] = source;
            
            for (int i = 0; i < m_co_so_du_lieu.size(); ++i) {
                if (m_co_so_du_lieu[i].value("name").toString() == itemData.value("name").toString()) {
                    m_co_so_du_lieu[i] = itemData;
                    break;
                }
            }
            luu_du_lieu();
            return true;
        }
        return false;
    };

    for (int i = 0; i < m_co_so_du_lieu.size(); ++i) {
        QVariantMap appData = m_co_so_du_lieu[i];
        QWidget* rowWidget = Cong_Cu_Cai_Dat::createAppRowWidget(appData, sourceEditHandler, m_ngon_ngu, listContainer);
        rowWidget->setProperty("appType", appData.value("type").toString());
        m_appRows.append(rowWidget);
        listLayout->addWidget(rowWidget);
    }
    
    sortAndRedisplayApps();
    updateHeaderIcons();
}

void Trinh_Cai_Dat::setFilterCategory(int index) {
    if (index == 0) m_currentFilter = "all";
    else if (index == 1) m_currentFilter = "app";
    else if (index == 2) m_currentFilter = "game";
    else if (index == 3) m_currentFilter = "update";
    
    cap_nhat_ngon_ngu(); // Update button text
    
    m_o_tim_kiem->clear();
    if (index == 3) {
        checkUpdates();
    } else {
        filterAppList();
    }
}

void Trinh_Cai_Dat::filterAppList(const QString& text) {
    if (listContainer) {
        listContainer->setUpdatesEnabled(false);
    }
    
    for (QWidget* row : m_appRows) {
        QString name = row->property("appName").toString();
        QString type = row->property("appType").toString();
        bool hasUpdate = row->property("hasUpdate").toBool();
        
        bool matchSearch = name.contains(text, Qt::CaseInsensitive) || text.isEmpty();
        bool matchType = (m_currentFilter == "all") || 
                         (m_currentFilter == "update" ? hasUpdate : (type == m_currentFilter));
        
        row->setVisible(matchSearch && matchType);
    }
    
    if (listContainer) {
        listContainer->setUpdatesEnabled(true);
    }
}

void Trinh_Cai_Dat::checkUpdates() {
    if (m_updateProcess) {
        return; // Already checking
    }
    
    if (!m_updateStatusLabel) {
        m_updateStatusLabel = new QLabel(this);
        m_updateStatusLabel->setAlignment(Qt::AlignCenter);
        m_updateStatusLabel->setStyleSheet("color: #D97706; font-style: italic;");
        listLayout->insertWidget(0, m_updateStatusLabel);
    }
    
    m_updateStatusLabel->setText(m_ngon_ngu == "VN" ? "Đang quét bản cập nhật..." : "Scanning for updates...");
    m_updateStatusLabel->show();
    
    // Clear old update status
    for (QWidget* row : m_appRows) {
        row->setProperty("hasUpdate", false);
        row->setVisible(false);
    }
    
    m_updateProcess = new QProcess(this);
    connect(m_updateProcess, QOverload<int, QProcess::ExitStatus>::of(&QProcess::finished), this, &Trinh_Cai_Dat::onUpdateCheckFinished);
    m_updateProcess->start("winget", QStringList() << "upgrade" << "--accept-source-agreements");
}

void Trinh_Cai_Dat::onUpdateCheckFinished(int exitCode, QProcess::ExitStatus exitStatus) {
    if (m_updateStatusLabel) {
        m_updateStatusLabel->hide();
    }
    
    if (exitStatus == QProcess::NormalExit && exitCode == 0) {
        QString output = QString::fromLocal8Bit(m_updateProcess->readAllStandardOutput());
        QStringList lines = output.split('\n', Qt::SkipEmptyParts);
        
        QSet<QString> updatePackages;
        bool inList = false;
        for (const QString& line : lines) {
            if (line.contains("Name") && line.contains("Id") && line.contains("Version")) {
                inList = true;
                continue;
            }
            if (line.startsWith("----")) {
                continue;
            }
            if (inList) {
                // Parse package id, e.g., "Google Chrome   Google.Chrome   ..."
                QStringList parts = line.split(" ", Qt::SkipEmptyParts);
                if (parts.size() >= 2) {
                    QString id;
                    for (const QString& part : parts) {
                        if (part.contains(".")) {
                            id = part;
                            break;
                        }
                    }
                    if (!id.isEmpty()) updatePackages.insert(id);
                }
            }
        }
        
        bool anyUpdate = false;
        for (QWidget* row : m_appRows) {
            QString name = row->property("appName").toString();
            // Check if name or any known id matches
            bool found = false;
            for (const QVariantMap& app : m_co_so_du_lieu) {
                if (app.value("name").toString() == name) {
                    QString sourceVal = app.value("source").toMap().value("value").toString();
                    if (updatePackages.contains(sourceVal)) {
                        found = true;
                        break;
                    }
                }
            }
            
            if (found) {
                row->setProperty("hasUpdate", true);
                anyUpdate = true;
            }
        }
        
        if (!anyUpdate && m_updateStatusLabel) {
            m_updateStatusLabel->setText(m_ngon_ngu == "VN" ? "Không có bản cập nhật nào." : "No updates available.");
            m_updateStatusLabel->show();
        }
    } else {
        if (m_updateStatusLabel) {
            m_updateStatusLabel->setText(m_ngon_ngu == "VN" ? "Lỗi khi quét cập nhật." : "Failed to scan for updates.");
            m_updateStatusLabel->show();
        }
    }
    
    m_updateProcess->deleteLater();
    m_updateProcess = nullptr;
    
    filterAppList(m_o_tim_kiem->text());
}

void Trinh_Cai_Dat::toggleAllVisible(bool checked) {
    for (QWidget* row : m_appRows) {
        if (row->isVisible()) {
            QCheckBox* cb = row->findChild<QCheckBox*>();
            if (cb) cb->setChecked(checked);
        }
    }
}

void Trinh_Cai_Dat::updateHeaderIcons() {
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
            it.value()->setIcon(m_sortAscending ? iconDesc : iconAsc);
        } else {
            it.value()->setIcon(emptyIcon);
        }
    }
}

void Trinh_Cai_Dat::sortAppsBy(const QString& column) {
    if (m_sortColumn == column) {
        m_sortAscending = !m_sortAscending;
    } else {
        m_sortColumn = column;
        m_sortAscending = true;
    }
    updateHeaderIcons();
    sortAndRedisplayApps();
}

void Trinh_Cai_Dat::sortAndRedisplayApps() {
    std::sort(m_co_so_du_lieu.begin(), m_co_so_du_lieu.end(), [this](const QVariantMap& a, const QVariantMap& b) {
        const QVariantMap& first = m_sortAscending ? a : b;
        const QVariantMap& second = m_sortAscending ? b : a;

        QVariant valA = first.value(m_sortColumn);
        QVariant valB = second.value(m_sortColumn);
        
        if (m_sortColumn == "source") {
            valA = first.value("source").toMap().value("type");
            valB = second.value("source").toMap().value("type");
        }
        
        if (valA.typeId() == QMetaType::Double || valA.typeId() == QMetaType::Int || valA.typeId() == QMetaType::LongLong) {
            return valA.toDouble() < valB.toDouble();
        } else {
            return valA.toString().compare(valB.toString(), Qt::CaseInsensitive) < 0;
        }
    });

    for (int i = 0; i < m_co_so_du_lieu.size(); ++i) {
        QString appName = m_co_so_du_lieu[i].value("name").toString();
        for (int j = 0; j < m_appRows.size(); ++j) {
            if (m_appRows[j]->property("appName").toString() == appName) {
                listLayout->removeWidget(m_appRows[j]);
                listLayout->insertWidget(i, m_appRows[j]);
                break;
            }
        }
    }
    filterAppList(m_o_tim_kiem->text());

}

void Trinh_Cai_Dat::reloadConfig() {
    tai_du_lieu();
}

void Trinh_Cai_Dat::them_muc_moi() {
    Hop_Thoai_Them_Phan_Mem dialog(m_chu_de, this, m_ngon_ngu, m_cai_dat);
    if (dialog.exec() == QDialog::Accepted) {
        auto [name, type, category, source] = dialog.getData();
        QVariantMap newItem;
        newItem["name"] = name;
        newItem["type"] = type;
        if (!category.isEmpty()) newItem["category"] = category;
        newItem["source"] = source;
        m_co_so_du_lieu.append(newItem);
        luu_du_lieu();
        lam_moi_cac_trang();
    }
}

void Trinh_Cai_Dat::xoa_cac_muc_da_chon() {
    QStringList itemsToRemove;
    for (QWidget* row : m_appRows) {
        if (row->isVisible()) {
            QCheckBox* cb = row->findChild<QCheckBox*>();
            if (cb && cb->isChecked()) {
                itemsToRemove.append(row->property("appName").toString());
            }
        }
    }
    
    if (itemsToRemove.isEmpty()) return;
    
    if (NexMessageBox::question(this, "Confirm", "Are you sure you want to remove selected items?") == NexMessageBox::Yes) {
        for (int i = m_co_so_du_lieu.size() - 1; i >= 0; --i) {
            if (itemsToRemove.contains(m_co_so_du_lieu[i].value("name").toString())) {
                m_co_so_du_lieu.removeAt(i);
            }
        }
        luu_du_lieu();
        lam_moi_cac_trang();
    }
}

void Trinh_Cai_Dat::thuc_hien_tim_kiem(const QString& text) {
    filterAppList(text);
}

void Trinh_Cai_Dat::thuc_hien_cai_dat() {
    if (m_dang_cai_dat) return;
    
    QList<QVariantMap> itemsToInstall;
    for (QWidget* row : m_appRows) {
        if (row->isVisible()) {
            QCheckBox* cb = row->findChild<QCheckBox*>();
            if (cb && cb->isChecked()) {
                QString name = row->property("appName").toString();
                for (const auto& item : m_co_so_du_lieu) {
                    if (item.value("name").toString() == name) {
                        itemsToInstall.append(item);
                        break;
                    }
                }
            }
        }
    }
    

    if (itemsToInstall.isEmpty()) {
        NexMessageBox::information(this, "Nex-Launcher", "Please select at least one item to install.");
        return;
    }
    
    m_dang_cai_dat = true;
    m_nut_thuc_hien_cai->setEnabled(false);
    m_tong_so_can_cai = itemsToInstall.size();
    m_so_luong_hoan_thanh = 0;
    
    if (m_cai_dat.value("minimize_on_close", true).toBool()) {
        if (m_cai_dat.value("notifications").toMap().value("on_hide", true).toBool()) {
            emit statusMessage("Installation started in background.", 3000);
        }
    }
    
    if (m_cai_dat.value("show_progress_dialog", true).toBool()) {
        if (m_hop_thoai_tien_trinh) {
            m_hop_thoai_tien_trinh->deleteLater();
        }
        m_hop_thoai_tien_trinh = new Hop_Thoai_Tien_Trinh(m_tong_so_can_cai, m_chu_de, this, m_ngon_ngu, false);
        m_hop_thoai_tien_trinh->setupItems(itemsToInstall);
        m_hop_thoai_tien_trinh->show();
    }
    
    m_itemsToInstall = itemsToInstall;
    m_sequentialQueue.clear();
    m_threads_finished = 0;
    m_currentPhaseTotal = itemsToInstall.size();
    
    if (!m_cai_dat.value("multi_thread", true).toBool()) {
        m_nhom_luong->setMaxThreadCount(1);
    } else {
        m_nhom_luong->setMaxThreadCount(QThread::idealThreadCount());
    }
    
    for (const auto& item : itemsToInstall) {
        bool isUpdate = (m_currentFilter == "update");
        Tac_Vu_Cai_Dat* worker = new Tac_Vu_Cai_Dat(item, m_thu_muc_tam->path(), isUpdate);
        connect(worker, &Tac_Vu_Cai_Dat::progress, this, &Trinh_Cai_Dat::khi_tien_trinh_cap_nhat, Qt::QueuedConnection);
        connect(worker, &Tac_Vu_Cai_Dat::finished, this, &Trinh_Cai_Dat::khi_tien_trinh_hoan_thanh, Qt::QueuedConnection);
        
        m_nhom_luong->start([worker]() {
            worker->run();
            worker->deleteLater();
        });
    }
}

void Trinh_Cai_Dat::khi_tien_trinh_cap_nhat(const QString& name, const QString& status, const QVariantMap& details) {
    if (m_hop_thoai_tien_trinh) {
        m_hop_thoai_tien_trinh->updateItemStatus(name, status, details);
    }
}

void Trinh_Cai_Dat::khi_tien_trinh_hoan_thanh(const QString& name, bool success, bool retrySequentially) {
    if (retrySequentially) {
        for (const auto& item : m_itemsToInstall) {
            if (item.value("name").toString() == name) {
                m_sequentialQueue.append(item);
                break;
            }
        }
    } else {
        m_so_luong_hoan_thanh++;
        if (m_hop_thoai_tien_trinh) {
            m_hop_thoai_tien_trinh->updateOverallProgress(m_so_luong_hoan_thanh);
        }
    }
    
    m_threads_finished++;
    
    if (m_threads_finished >= m_currentPhaseTotal) {
        if (!m_sequentialQueue.isEmpty()) {
            m_nhom_luong->setMaxThreadCount(1);
            m_currentPhaseTotal = m_sequentialQueue.size();
            m_threads_finished = 0;
            QList<QVariantMap> queue = m_sequentialQueue;
            m_sequentialQueue.clear();
            for (const auto& item : queue) {
                Tac_Vu_Cai_Dat* worker = new Tac_Vu_Cai_Dat(item, m_thu_muc_tam->path());
                connect(worker, &Tac_Vu_Cai_Dat::progress, this, &Trinh_Cai_Dat::khi_tien_trinh_cap_nhat, Qt::QueuedConnection);
                connect(worker, &Tac_Vu_Cai_Dat::finished, this, &Trinh_Cai_Dat::khi_tien_trinh_hoan_thanh, Qt::QueuedConnection);
                m_nhom_luong->start([worker]() {
                    worker->run();
                    worker->deleteLater();
                });
            }
        } else {
            m_dang_cai_dat = false;
            m_nut_thuc_hien_cai->setEnabled(true);
            if (m_hop_thoai_tien_trinh) m_hop_thoai_tien_trinh->allDone();
            
            if (m_cai_dat.value("notifications").toMap().value("on_complete", true).toBool()) {
                emit statusMessage("All installations completed.", 3000);
            }
        }
    }
}

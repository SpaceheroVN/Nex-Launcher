#include "Hop_Thoai_Cai_Dat.h"
#include "Cau_Hinh_Cai_Dat.h"
#include "../Cau_Hinh.h"

#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QLabel>
#include <QComboBox>
#include <QLineEdit>
#include <QPushButton>
#include <QDialogButtonBox>
#include <QFileDialog>
#include "../NexMessageBox.h"
#include <QTimer>
#include <QUrl>
#include <QHeaderView>
#include <QScrollArea>
#include <QProcess>
#include <QFrame>
#include <QMessageBox>
#include <QGraphicsDropShadowEffect>
#include <QProgressBar>
#include <QFile>
#include <QJsonDocument>
#include <QJsonObject>

// ==========================================
// HelpDialog
// ==========================================
HelpDialog::HelpDialog(const QString& helpText, QWidget *parent) : QDialog(parent) {
    setWindowFlags(Qt::Tool | Qt::FramelessWindowHint);
    setAttribute(Qt::WA_TranslucentBackground, true);
    setFocusPolicy(Qt::NoFocus);
    setFixedSize(300, 350);
    
    QWidget* container = new QWidget(this);
    container->setObjectName("helpContainer");
    container->setStyleSheet("QWidget#helpContainer { background-color: #2D2D30; border: 1px solid #555; border-radius: 6px; }");
    QVBoxLayout* layout = new QVBoxLayout(container);
    layout->setContentsMargins(10, 10, 10, 10);
    
    QScrollArea* scrollArea = new QScrollArea(this);
    scrollArea->setWidgetResizable(true);
    scrollArea->setObjectName("helpScrollArea");
    scrollArea->setStyleSheet("background: transparent; border: none;");
    
    label = new QLabel(helpText, this);
    label->setWordWrap(true);
    label->setTextFormat(Qt::RichText);
    label->setOpenExternalLinks(true);
    scrollArea->setWidget(label);
    
    layout->addWidget(scrollArea);
    
    QVBoxLayout* mainLayout = new QVBoxLayout(this);
    mainLayout->setContentsMargins(0,0,0,0);
    mainLayout->addWidget(container);
}

// ==========================================
// Hop_Thoai_Tim_Kiem
// ==========================================
Hop_Thoai_Tim_Kiem::Hop_Thoai_Tim_Kiem(QWidget *parent, const QString& lang, const QString& currentText) : QDialog(parent) {
    setWindowTitle(Cau_Hinh_Cai_Dat::getTranslation("Installer", lang, "search_dialog_title"));
    setMinimumWidth(350);
    
    QVBoxLayout* layout = new QVBoxLayout(this);
    searchEdit = new QLineEdit(this);
    searchEdit->setPlaceholderText(Cau_Hinh_Cai_Dat::getTranslation("Installer", lang, "search_placeholder"));
    searchEdit->setText(currentText);
    layout->addWidget(searchEdit);
    
    QDialogButtonBox* buttons = new QDialogButtonBox(QDialogButtonBox::Ok | QDialogButtonBox::Cancel, this);
    buttons->button(QDialogButtonBox::Ok)->setObjectName("acceptButton");
    buttons->button(QDialogButtonBox::Cancel)->setObjectName("cancelButton");
    connect(buttons, &QDialogButtonBox::accepted, this, &QDialog::accept);
    connect(buttons, &QDialogButtonBox::rejected, this, &QDialog::reject);
    layout->addWidget(buttons);
}

QString Hop_Thoai_Tim_Kiem::getData() const {
    return searchEdit->text();
}

// ==========================================
// Hop_Thoai_Tien_Trinh
// ==========================================
Hop_Thoai_Tien_Trinh::Hop_Thoai_Tien_Trinh(int totalItems, const QString& theme, QWidget *parent, const QString& lang, bool alwaysOnTop) 
    : QDialog(parent), m_lang(lang) {
    setWindowTitle(Cau_Hinh_Cai_Dat::getTranslation("Installer", lang, "progress_title"));
    setModal(true);
    if (alwaysOnTop) {
        setWindowFlags(windowFlags() | Qt::WindowStaysOnTopHint);
    }
    
    setMinimumWidth(600);
    setSizePolicy(QSizePolicy::Preferred, QSizePolicy::MinimumExpanding);
    
    QVBoxLayout* mainLayout = new QVBoxLayout(this);
    mainLayout->setContentsMargins(10, 10, 10, 10);
    mainLayout->setSpacing(10);
    
    QMap<QString, QString> c = Cau_Hinh::getThemeColors(theme);
    QString bgColor = (theme == "Light") ? "#FFFFFF" : c["window_bg"];
    
    setStyleSheet(QString("QDialog { background-color: %1; } QLabel { color: %2; } "
                          "QScrollArea { background: transparent; border: none; } QWidget#progressContainer { background: transparent; }")
        .arg(bgColor, c["text_color"]));
    QScrollArea* scrollArea = new QScrollArea(this);
    scrollArea->setWidgetResizable(true);
    scrollArea->setHorizontalScrollBarPolicy(Qt::ScrollBarAlwaysOff);
    
    QWidget* container = new QWidget();
    container->setObjectName("progressContainer");
    gridLayout = new QGridLayout(container);
    gridLayout->setColumnStretch(0, 1);
    gridLayout->setSpacing(5);
    scrollArea->setWidget(container);
    mainLayout->addWidget(scrollArea);
    
    QHBoxLayout* bottomLayout = new QHBoxLayout();
    overallProgress = new QProgressBar(this);
    overallProgress->setMaximum(totalItems);
    overallProgress->setValue(0);
    overallProgress->setTextVisible(true);
    
    connect(overallProgress, &QProgressBar::valueChanged, this, [this](int value) {
        int maxVal = overallProgress->maximum();
        int percent = (maxVal > 0) ? (value * 100 / maxVal) : 0;
        QString color;
        if (percent < 25) color = "#FF3333";
        else if (percent < 50) color = "#FFA500";
        else if (percent < 100) color = "#FFD700";
        else color = "#32CD32";
        overallProgress->setStyleSheet(QString(
            "QProgressBar { border: 1px solid #C0C0C0; background-color: transparent; color: %1; text-align: center; border-radius: 4px; font-weight: bold; }"
            "QProgressBar::chunk { background-color: #2568EC; border-radius: 3px; }"
        ).arg(color));
    });
    // Trigger initial style
    emit overallProgress->valueChanged(0);
    
    bottomLayout->addWidget(overallProgress);
    
    closeButton = new QPushButton(Cau_Hinh_Cai_Dat::getTranslation("Installer", lang, "close_btn"), this);
    closeButton->setObjectName("acceptButton");
    connect(closeButton, &QPushButton::clicked, this, &QDialog::accept);
    closeButton->setEnabled(false);
    bottomLayout->addWidget(closeButton);
    
    mainLayout->addLayout(bottomLayout);
}

void Hop_Thoai_Tien_Trinh::setupItems(const QList<QVariantMap>& items) {
    for (int i = 0; i < items.size(); ++i) {
        QString name = items[i].value("name", "Unknown").toString();
        QLabel* nameLabel = new QLabel(name, this);
        QLabel* statusLabel = new QLabel(Cau_Hinh_Cai_Dat::getTranslation("Installer", m_lang, "progress_status_waiting"), this);
        statusLabel->setProperty("status", "waiting");
        
        gridLayout->addWidget(nameLabel, i, 0);
        gridLayout->addWidget(statusLabel, i, 1, Qt::AlignRight);
        itemLabels[name] = statusLabel;
    }
    int numRows = qMin(items.size(), 5);
    setFixedSize(width(), 100 + (numRows * 35));
}

void Hop_Thoai_Tien_Trinh::updateItemStatus(const QString& itemName, const QString& status, const QVariantMap& details) {
    if (!itemLabels.contains(itemName)) return;
    QLabel* statusLabel = itemLabels[itemName];
    statusLabel->setProperty("status", status);
    
    QString text = status;
    if (status == "downloading") text = QString("Downloading (%1%)").arg(details.value("percent").toInt());
    else if (status == "installing") text = Cau_Hinh_Cai_Dat::getTranslation("Installer", m_lang, "progress_status_installing");
    else if (status == "completed") text = Cau_Hinh_Cai_Dat::getTranslation("Installer", m_lang, "progress_status_completed");
    
    statusLabel->setText(text);
    statusLabel->style()->unpolish(statusLabel);
    statusLabel->style()->polish(statusLabel);
}

void Hop_Thoai_Tien_Trinh::updateOverallProgress(int completedCount) {
    overallProgress->setValue(completedCount);
}

void Hop_Thoai_Tien_Trinh::allDone() {
    closeButton->setEnabled(true);
}

// ==========================================
// Hop_Thoai_Them_Phan_Mem
// ==========================================
Hop_Thoai_Them_Phan_Mem::Hop_Thoai_Them_Phan_Mem(const QString& theme, QWidget *parent, const QString& lang, const QVariantMap& settings) : QDialog(parent), m_lang(lang), m_cai_dat(settings) {
    setWindowTitle(Cau_Hinh_Cai_Dat::getTranslation("Installer", lang, "add_item_title"));
    setMinimumWidth(400);
    
    QVBoxLayout* layout = new QVBoxLayout(this);
    
    QMap<QString, QString> c = Cau_Hinh::getThemeColors(theme);
    
    setStyleSheet(QString("QDialog { background-color: %1; } QLabel { color: %2; } "
        "QComboBox { background-color: %3; color: %2; border: 1px solid %4; border-radius: 4px; padding: 5px 10px; min-width: 150px; } "
        "QComboBox QAbstractItemView { background-color: %3; color: %2; selection-background-color: #2568EC; selection-color: white; border: 1px solid %4; outline: none; min-width: 150px; } "
        "QLineEdit { background-color: %3; color: %2; border: 1px solid %4; padding: 5px; border-radius: 4px; } "
        "QPushButton#browseButton { background-color: #2568EC; color: white; border: none; border-radius: 4px; padding: 5px 15px; font-weight: bold; } "
        "QPushButton#browseButton:hover { background-color: #1D52BA; } "
        "QPushButton#acceptButton { background-color: #2568EC; color: white; border: none; border-radius: 5px; padding: 8px 25px; font-weight: bold; } "
        "QPushButton#acceptButton:hover { background-color: #1D52BA; } "
        "QPushButton#cancelButton { background-color: %5; color: %6; border: none; border-radius: 5px; padding: 8px 25px; font-weight: bold; } "
        "QPushButton#cancelButton:hover { background-color: %7; }")
        .arg(c["window_bg"], c["text_color"], c["input_bg"], c["border_color"], c["button_bg"], c["button_text"], c["hover_bg"]));
        
    layout->addWidget(new QLabel(Cau_Hinh_Cai_Dat::getTranslation("Installer", lang, "item_name_label"), this));
    
    nameEdit = new QLineEdit(this);
    nameEdit->setPlaceholderText(Cau_Hinh_Cai_Dat::getTranslation("Installer", lang, "item_name_placeholder"));
    layout->addWidget(nameEdit);
    
    layout->addWidget(new QLabel(Cau_Hinh_Cai_Dat::getTranslation("Installer", lang, "item_type_label"), this));
    typeCombo = new QComboBox(this);
    typeCombo->addItems({Cau_Hinh_Cai_Dat::getTranslation("Installer", lang, "item_type_app"), Cau_Hinh_Cai_Dat::getTranslation("Installer", lang, "item_type_game")});
    layout->addWidget(typeCombo);
    
    layout->addWidget(new QLabel(Cau_Hinh_Cai_Dat::getTranslation("Installer", lang, "source_type_label"), this));
    sourceTypeCombo = new QComboBox(this);
    sourceTypeCombo->addItems({
        Cau_Hinh_Cai_Dat::getTranslation("Installer", lang, "source_type_unknown"),
        Cau_Hinh_Cai_Dat::getTranslation("Installer", lang, "source_type_package"),
        Cau_Hinh_Cai_Dat::getTranslation("Installer", lang, "source_type_link"),
        Cau_Hinh_Cai_Dat::getTranslation("Installer", lang, "source_type_winget")
    });
    connect(sourceTypeCombo, &QComboBox::currentTextChanged, this, &Hop_Thoai_Them_Phan_Mem::onSourceTypeChanged);
    layout->addWidget(sourceTypeCombo);
    
    sourceValueWidget = new QWidget(this);
    QHBoxLayout* sourceLayout = new QHBoxLayout(sourceValueWidget);
    sourceLayout->setContentsMargins(0,0,0,0);
    sourceValueEdit = new QLineEdit(this);
    browseButton = new QPushButton(Cau_Hinh_Cai_Dat::getTranslation("Installer", lang, "browse_btn"), this);
    browseButton->setObjectName("browseButton");
    connect(browseButton, &QPushButton::clicked, this, &Hop_Thoai_Them_Phan_Mem::browseFile);
    sourceLayout->addWidget(sourceValueEdit);
    sourceLayout->addWidget(browseButton);
    layout->addWidget(sourceValueWidget);
    
    layout->addStretch();
    QDialogButtonBox* buttons = new QDialogButtonBox(QDialogButtonBox::Ok | QDialogButtonBox::Cancel, this);
    buttons->button(QDialogButtonBox::Ok)->setObjectName("acceptButton");
    buttons->button(QDialogButtonBox::Cancel)->setObjectName("cancelButton");
    connect(buttons, &QDialogButtonBox::accepted, this, &Hop_Thoai_Them_Phan_Mem::accept);
    connect(buttons, &QDialogButtonBox::rejected, this, &QDialog::reject);
    layout->addWidget(buttons);
    
    onSourceTypeChanged("Unknown");
}

void Hop_Thoai_Them_Phan_Mem::onSourceTypeChanged(const QString& sourceType) {
    sourceValueWidget->show();
    if (sourceType == "Package") {
        sourceValueEdit->setPlaceholderText("Path to .exe or .msi file...");
        browseButton->show();
    } else if (sourceType == "Link") {
        sourceValueEdit->setPlaceholderText("https://... download link");
        browseButton->hide();
    } else if (sourceType == "Winget") {
        sourceValueEdit->setPlaceholderText("Winget Package ID");
        browseButton->hide();
    } else {
        sourceValueWidget->hide();
    }
}

void Hop_Thoai_Them_Phan_Mem::browseFile() {
    QString file = QFileDialog::getOpenFileName(this, "Select Installer", "", "Installers (*.exe *.msi *.bat);;All Files (*)");
    if (!file.isEmpty()) sourceValueEdit->setText(file);
}

void Hop_Thoai_Them_Phan_Mem::accept() {
    if (nameEdit->text().trimmed().isEmpty()) {
        NexMessageBox::warning(this, "Input Error", "Name cannot be empty");
        return;
    }
    if (sourceTypeCombo->currentText() != "Unknown" && sourceValueEdit->text().trimmed().isEmpty()) {
        NexMessageBox::warning(this, "Input Error", "Source value cannot be empty");
        return;
    }
    QDialog::accept();
}

std::tuple<QString, QString, QString, QVariantMap> Hop_Thoai_Them_Phan_Mem::getData() const {
    QString name = nameEdit->text().trimmed();
    QString type = (typeCombo->currentIndex() == 0) ? "app" : "game";
    QVariantMap source;
    source["type"] = sourceTypeCombo->currentText();
    source["value"] = sourceValueEdit->text().trimmed();
    source["silent_args"] = "";
    return {name, type, "", source};
}

// ==========================================
// SourceEditDialog
// ==========================================
SourceEditDialog::SourceEditDialog(const QString& sourceType, const QString& currentValue, const QString& currentArgs, const QString& placeholderText, QWidget *parent, const QString& lang, const QString& theme)
    : QDialog(parent), m_lang(lang), m_sourceType(sourceType), m_helpDialog(nullptr) {
    
    setWindowFlags(windowFlags() | Qt::FramelessWindowHint);
    setAttribute(Qt::WA_TranslucentBackground, true);
    
    QMap<QString, QString> colors = Cau_Hinh::getThemeColors(theme);
    
    QWidget* container = new QWidget(this);
    container->setObjectName("bgWidget");
    
    QGraphicsDropShadowEffect *shadow = new QGraphicsDropShadowEffect(this);
    shadow->setBlurRadius(20);
    shadow->setColor(QColor(0, 0, 0, 80));
    shadow->setOffset(0, 4);
    container->setGraphicsEffect(shadow);
    
    container->setStyleSheet(QString(
        "QWidget#bgWidget { background-color: %1; border-radius: 12px; border: 1px solid %2; }"
        "QLabel { color: %3; font-size: 14px; }"
        "QLineEdit { background-color: %4; color: %3; border: 1px solid %2; border-radius: 5px; padding: 5px; }"
        "QPushButton#browseButton, QPushButton#optionsButton { background-color: %5; color: %6; border: 1px solid %2; border-radius: 5px; padding: 5px 10px; }"
        "QPushButton#browseButton:hover, QPushButton#optionsButton:hover { background-color: %7; }"
        "QPushButton#helpButton { background-color: %5; border: 1px solid %2; border-radius: 12px; }"
        "QPushButton#helpButton:hover { background-color: %7; }"
        "QPushButton#acceptButton { background-color: %8; color: %9; border: none; border-radius: 6px; padding: 6px 15px; font-weight: bold; min-width: 80px; }"
        "QPushButton#acceptButton:hover { background-color: %10; }"
        "QPushButton#cancelButton { background-color: transparent; color: %3; border: 1px solid %2; border-radius: 6px; padding: 6px 15px; font-weight: bold; min-width: 80px; }"
        "QPushButton#cancelButton:hover { background-color: rgba(128, 128, 128, 0.1); }"
    ).arg(colors["bg_tier0"], colors["border_color"], colors["text_color"], colors["input_bg"], colors["button_bg"], colors["button_text"], colors["hover_bg"], colors["primary_color"], colors["primary_text"], colors["primary_hover"]));
    
    QVBoxLayout* mainLayout = new QVBoxLayout(this);
    mainLayout->setContentsMargins(10, 10, 10, 10);
    mainLayout->addWidget(container);
    
    QVBoxLayout* layout = new QVBoxLayout(container);
    layout->setContentsMargins(20, 20, 20, 20);
    layout->setSpacing(15);
    
    QLabel* titleLabel = new QLabel(Cau_Hinh::getTranslation("Installer", lang, "edit_source_title"), this);
    QFont titleFont = titleLabel->font();
    titleFont.setPointSize(14);
    titleFont.setBold(true);
    titleLabel->setFont(titleFont);
    layout->addWidget(titleLabel);
    
    layout->addWidget(new QLabel(Cau_Hinh::getTranslation("Installer", lang, "source_value"), this));
    
    QHBoxLayout* valueLayout = new QHBoxLayout();
    m_valueEdit = new QLineEdit(currentValue, this);
    if (currentValue.isEmpty()) m_valueEdit->setPlaceholderText(placeholderText);
    valueLayout->addWidget(m_valueEdit);
    
    if (sourceType == "Package") {
        QPushButton* browseBtn = new QPushButton(Cau_Hinh::getTranslation("Installer", lang, "browse_btn"), this);
        browseBtn->setObjectName("browseButton");
        connect(browseBtn, &QPushButton::clicked, this, &SourceEditDialog::browseFile);
        valueLayout->addWidget(browseBtn);
    }
    layout->addLayout(valueLayout);
    
    QHBoxLayout* argsLabelLayout = new QHBoxLayout();
    argsLabelLayout->addWidget(new QLabel(Cau_Hinh::getTranslation("Installer", lang, "silent_args"), this));
    argsLabelLayout->addStretch();
    m_helpBtn = new QPushButton(this);
    m_helpBtn->setIcon(QIcon(":/icons/help.svg"));
    m_helpBtn->setObjectName("helpButton");
    m_helpBtn->setFixedSize(25, 25);
    m_helpBtn->setCheckable(true);
    connect(m_helpBtn, &QPushButton::toggled, this, &SourceEditDialog::toggleHelpDialog);
    argsLabelLayout->addWidget(m_helpBtn);
    layout->addLayout(argsLabelLayout);
    
    QHBoxLayout* argsInputLayout = new QHBoxLayout();
    m_argsEdit = new QLineEdit(currentArgs, this);
    argsInputLayout->addWidget(m_argsEdit);
    m_optionsBtn = new QPushButton(Cau_Hinh::getTranslation("Installer", lang, "options_btn"), this);
    m_optionsBtn->setObjectName("optionsButton");
    m_optionsBtn->setCheckable(true);
    connect(m_optionsBtn, &QPushButton::toggled, this, &SourceEditDialog::toggleOptionsPanel);
    argsInputLayout->addWidget(m_optionsBtn);
    layout->addLayout(argsInputLayout);
    
    createOptionsPanel();
    layout->addWidget(m_checkboxPanel);
    
    QDialogButtonBox* buttons = new QDialogButtonBox(QDialogButtonBox::Ok | QDialogButtonBox::Cancel, this);
    buttons->button(QDialogButtonBox::Ok)->setText(Cau_Hinh::getTranslation("Installer", lang, "ok_btn"));
    buttons->button(QDialogButtonBox::Cancel)->setText(Cau_Hinh::getTranslation("Installer", lang, "cancel_btn"));
    buttons->button(QDialogButtonBox::Ok)->setObjectName("acceptButton");
    buttons->button(QDialogButtonBox::Cancel)->setObjectName("cancelButton");
    connect(buttons, &QDialogButtonBox::accepted, this, &QDialog::accept);
    connect(buttons, &QDialogButtonBox::rejected, this, &QDialog::reject);
    layout->addWidget(buttons);
    
    adjustSize();
    setMinimumWidth(container->sizeHint().width() + 20);
}

void SourceEditDialog::createOptionsPanel() {
    m_checkboxPanel = new QWidget(this);
    QGridLayout* layout = new QGridLayout(m_checkboxPanel);
    
    m_argMap = { {"/S","force"}, {"/s","force"}, {"/Silent","force"}, {"/quiet","force"}, {"/passive","force"}, {"/VERYSILENT","force"} };
    
    int row = 0, col = 0;
    for (auto it = m_argMap.constBegin(); it != m_argMap.constEnd(); ++it) {
        QCheckBox* cb = new QCheckBox(it.key(), this);
        m_checkboxes[it.key()] = cb;
        connect(cb, &QCheckBox::toggled, this, [this, key=it.key()](bool checked){ onCheckboxToggled(key, checked); });
        layout->addWidget(cb, row, col++);
        if (col > 2) { col = 0; row++; }
    }
    m_checkboxPanel->hide();
    updateCheckboxesFromText();
}

void SourceEditDialog::onCheckboxToggled(const QString& argText, bool isChecked) {
    QStringList args = m_argsEdit->text().split(" ", Qt::SkipEmptyParts);
    if (isChecked) {
        if (!args.contains(argText)) args.append(argText);
    } else {
        args.removeAll(argText);
    }
    m_argsEdit->setText(args.join(" "));
}

void SourceEditDialog::updateCheckboxesFromText() {
    QStringList args = m_argsEdit->text().split(" ", Qt::SkipEmptyParts);
    for (auto it = m_checkboxes.constBegin(); it != m_checkboxes.constEnd(); ++it) {
        it.value()->blockSignals(true);
        it.value()->setChecked(args.contains(it.key()));
        it.value()->blockSignals(false);
    }
}

void SourceEditDialog::toggleOptionsPanel(bool checked) {
    m_checkboxPanel->setVisible(checked);
    adjustSize();
}

void SourceEditDialog::toggleHelpDialog(bool checked) {
    if (checked) {
        if (!m_helpDialog) {
            QString helpHtml = "<h4 style='color: white; margin-top: 0px; margin-bottom: 5px;'>Silent Arguments Guide</h4>"
            "<ul style='color: #E0E0E0; margin-top: 0px; padding-left: 20px;'>"
            "<li><b>Inno Setup</b>:<br>/VERYSILENT /SUPPRESSMSGBOXES</li>"
            "<li><b>NSIS</b>:<br>/S</li>"
            "<li><b>MSI</b>:<br>/qn /norestart</li>"
            "<li><b>WiX</b>:<br>-quiet</li>"
            "</ul>";
            m_helpDialog = new HelpDialog(helpHtml, this);
        }
        m_helpDialog->show();
        positionHelpDialog();
    } else {
        if (m_helpDialog) m_helpDialog->hide();
    }
}

void SourceEditDialog::positionHelpDialog() {
    if (m_helpDialog && m_helpDialog->isVisible()) {
        m_helpDialog->move(geometry().x() + geometry().width() + 10, geometry().y() - 30);
    }
}

void SourceEditDialog::moveEvent(QMoveEvent *event) { QDialog::moveEvent(event); positionHelpDialog(); }
void SourceEditDialog::showEvent(QShowEvent *event) { QDialog::showEvent(event); positionHelpDialog(); }
void SourceEditDialog::closeEvent(QCloseEvent *event) { if (m_helpDialog) m_helpDialog->close(); QDialog::closeEvent(event); }
void SourceEditDialog::browseFile() {
    QString f = QFileDialog::getOpenFileName(this, "Select Installer", "", "Installers (*.exe *.msi *.bat);;All Files (*)");
    if (!f.isEmpty()) m_valueEdit->setText(f);
}
void SourceEditDialog::accept() { QDialog::accept(); }
std::pair<QString, QString> SourceEditDialog::getData() const { return {m_valueEdit->text().trimmed(), m_argsEdit->text().trimmed()}; }

// ==========================================
// WingetSearchWorker
// ==========================================
WingetSearchWorker::WingetSearchWorker(const QString& searchTerm, QObject *parent) 
    : QThread(parent), m_searchTerm(searchTerm) {}

void WingetSearchWorker::run() {
    QList<QVariantMap> results;
    QProcess process;
    process.setProgram("winget");
    process.setArguments({"search", m_searchTerm});
    process.start();
    if (process.waitForFinished(30000)) {
        QString output = process.readAllStandardOutput();
        QStringList lines = output.split("\n", Qt::SkipEmptyParts);
        int headerIndex = -1;
        for (int i = 0; i < lines.size(); ++i) {
            if (lines[i].startsWith("---")) { headerIndex = i - 1; break; }
        }
        if (headerIndex >= 0 && headerIndex < lines.size()) {
            QString headerLine = lines[headerIndex];
            int idPos = headerLine.indexOf("Id");
            int verPos = headerLine.indexOf("Version");
            if (idPos != -1 && verPos != -1) {
                for (int i = headerIndex + 2; i < lines.size(); ++i) {
                    QString line = lines[i];
                    if (line.length() < verPos) continue;
                    QString name = line.left(idPos).trimmed();
                    QString id = line.mid(idPos, verPos - idPos).trimmed();
                    if (!name.isEmpty() && !id.isEmpty()) {
                        QVariantMap map; map["name"] = name; map["id"] = id;
                        results.append(map);
                    }
                }
            }
        }
    }
    emit searchComplete(results);
}

// ==========================================
// WingetSearchDialog
// ==========================================
WingetSearchDialog::WingetSearchDialog(const QString& initialSearchText, QWidget *parent, const QString& lang)
    : QDialog(parent), m_lang(lang) {
    setWindowTitle("Winget Search");
    setMinimumSize(700, 500);
    
    QVBoxLayout* layout = new QVBoxLayout(this);
    QHBoxLayout* searchLayout = new QHBoxLayout();
    searchEdit = new QLineEdit(initialSearchText, this);
    searchButton = new QPushButton("Search...", this);
    searchButton->setObjectName("searchButton");
    connect(searchButton, &QPushButton::clicked, this, &WingetSearchDialog::startSearch);
    searchLayout->addWidget(searchEdit);
    searchLayout->addWidget(searchButton);
    layout->addLayout(searchLayout);
    
    resultsTable = new QTableWidget(this);
    resultsTable->setColumnCount(2);
    resultsTable->setHorizontalHeaderLabels({"Name", "Package ID"});
    resultsTable->horizontalHeader()->setSectionResizeMode(QHeaderView::Stretch);
    resultsTable->setSelectionBehavior(QAbstractItemView::SelectRows);
    resultsTable->setEditTriggers(QAbstractItemView::NoEditTriggers);
    connect(resultsTable, &QTableWidget::itemSelectionChanged, this, &WingetSearchDialog::onItemSelected);
    layout->addWidget(resultsTable);
    
    progressBar = new QProgressBar(this);
    progressBar->setRange(0, 0);
    progressBar->hide();
    layout->addWidget(progressBar);
    
    buttonBox = new QDialogButtonBox(QDialogButtonBox::Ok | QDialogButtonBox::Cancel, this);
    buttonBox->button(QDialogButtonBox::Ok)->setObjectName("acceptButton");
    buttonBox->button(QDialogButtonBox::Cancel)->setObjectName("cancelButton");
    connect(buttonBox, &QDialogButtonBox::accepted, this, &QDialog::accept);
    connect(buttonBox, &QDialogButtonBox::rejected, this, &QDialog::reject);
    buttonBox->button(QDialogButtonBox::Ok)->setEnabled(false);
    layout->addWidget(buttonBox);
}

void WingetSearchDialog::startSearch() {
    if (searchEdit->text().trimmed().isEmpty()) return;
    searchButton->setEnabled(false);
    resultsTable->setRowCount(0);
    buttonBox->button(QDialogButtonBox::Ok)->setEnabled(false);
    progressBar->show();
    
    searchWorker = new WingetSearchWorker(searchEdit->text().trimmed(), this);
    connect(searchWorker, &WingetSearchWorker::searchComplete, this, &WingetSearchDialog::onSearchComplete);
    connect(searchWorker, &WingetSearchWorker::finished, searchWorker, &QObject::deleteLater);
    searchWorker->start();
}

void WingetSearchDialog::onSearchComplete(const QList<QVariantMap>& results) {
    progressBar->hide();
    searchButton->setEnabled(true);
    resultsTable->setRowCount(results.size());
    for (int i = 0; i < results.size(); ++i) {
        resultsTable->setItem(i, 0, new QTableWidgetItem(results[i].value("name").toString()));
        resultsTable->setItem(i, 1, new QTableWidgetItem(results[i].value("id").toString()));
    }
}

void WingetSearchDialog::onItemSelected() {
    auto items = resultsTable->selectedItems();
    if (!items.isEmpty()) {
        int row = items.first()->row();
        selectedId = resultsTable->item(row, 1)->text();
        buttonBox->button(QDialogButtonBox::Ok)->setEnabled(true);
    }
}

QString WingetSearchDialog::getData() const {
    return selectedId;
}

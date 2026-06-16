#include "NexMessageBox.h"
#include "Cau_Hinh.h"
#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QGraphicsDropShadowEffect>
#include <QStandardPaths>
#include <QDir>
#include <QJsonDocument>
#include <QJsonObject>

NexMessageBox::NexMessageBox(QWidget *parent) : QDialog(parent), m_icon(NoIcon), m_buttons(Ok), m_clickedButton(NoButton) {
    setupUi();
    setStandardButtons(m_buttons);
    applyTheme();
}

NexMessageBox::NexMessageBox(Icon icon, const QString &title, const QString &text, StandardButtons buttons, QWidget *parent)
    : QDialog(parent), m_icon(icon), m_buttons(buttons), m_clickedButton(NoButton) {
    setupUi();
    setWindowTitle(title);
    setText(text);
    setIcon(icon);
    setStandardButtons(buttons);
    applyTheme();
}

void NexMessageBox::setupUi() {
    setWindowFlags(Qt::Dialog | Qt::FramelessWindowHint);
    setAttribute(Qt::WA_TranslucentBackground);
    setMinimumWidth(350);

    QVBoxLayout *mainLayout = new QVBoxLayout(this);
    mainLayout->setContentsMargins(10, 10, 10, 10);

    QWidget *bgWidget = new QWidget(this);
    bgWidget->setObjectName("bgWidget");
    QVBoxLayout *bgLayout = new QVBoxLayout(bgWidget);
    bgLayout->setContentsMargins(20, 20, 20, 15);
    bgLayout->setSpacing(15);

    QGraphicsDropShadowEffect *shadow = new QGraphicsDropShadowEffect(this);
    shadow->setBlurRadius(20);
    shadow->setColor(QColor(0, 0, 0, 80));
    shadow->setOffset(0, 4);
    bgWidget->setGraphicsEffect(shadow);

    QHBoxLayout *contentLayout = new QHBoxLayout();
    contentLayout->setSpacing(15);

    textLabel = new QLabel(bgWidget);
    textLabel->setWordWrap(true);
    textLabel->setStyleSheet("font-size: 14px;");

    iconLabel = new QLabel(bgWidget);
    iconLabel->setFixedSize(32, 32);
    iconLabel->setAlignment(Qt::AlignCenter);
    iconLabel->hide();
    contentLayout->addWidget(iconLabel, 0, Qt::AlignTop);
    contentLayout->addWidget(textLabel, 1);

    bgLayout->addLayout(contentLayout);

    QHBoxLayout *buttonLayout = new QHBoxLayout();
    buttonLayout->setObjectName("buttonLayout");
    buttonLayout->addStretch();
    bgLayout->addLayout(buttonLayout);

    mainLayout->addWidget(bgWidget);
}

void NexMessageBox::applyTheme() {
    QString appDataPath = QStandardPaths::writableLocation(QStandardPaths::AppDataLocation) + "/Nex-Launcher";
    QFile f(appDataPath + "/launcher_config.json");
    QString theme = "Dark";
    int radius = 15;
    if (f.open(QIODevice::ReadOnly)) {
        QJsonDocument doc = QJsonDocument::fromJson(f.readAll());
        theme = doc.object()["theme"].toString("Dark");
        if (doc.object().contains("border_radius") && doc.object()["border_radius"].toInt() == 0) {
            radius = 0;
        }
    }
    QMap<QString, QString> c = Cau_Hinh::getThemeColors(theme);
    
    QString br6 = radius > 0 ? "6" : "0";
    QString br12 = radius > 0 ? "12" : "0";
    
    QString style = R"(
        QWidget#bgWidget {
            background-color: )" + c["bg_tier0"] + R"(;
            border-radius: )" + br12 + R"(px;
            border: 1px solid )" + c["border_color"] + R"(;
        }
        QLabel {
            color: )" + c["text_color"] + R"(;
        }
        QPushButton {
            background-color: transparent;
            color: )" + c["text_color"] + R"(;
            border: 1px solid )" + c["border_color"] + R"(;
            border-radius: )" + br6 + R"(px;
            padding: 6px 15px;
            font-size: 14px;
            font-weight: bold;
            min-width: 70px;
        }
        QPushButton:hover {
            background-color: )" + c["hover_bg"] + R"(;
        }
        QPushButton#primaryBtn {
            background-color: )" + c["primary_color"] + R"(;
            color: )" + c["primary_text"] + R"(;
            border: none;
        }
        QPushButton#primaryBtn:hover {
            background-color: )" + c["primary_hover"] + R"(;
        }
    )";
    setStyleSheet(style);
}

QPushButton* NexMessageBox::createButton(StandardButton btn) {
    QPushButton* button = new QPushButton(this);
    QString text;
    if (btn == Ok) { text = "OK"; button->setObjectName("primaryBtn"); }
    else if (btn == Yes) { text = "Yes"; button->setObjectName("primaryBtn"); }
    else if (btn == No) { text = "No"; }
    else if (btn == Cancel) { text = "Cancel"; }
    button->setText(text);
    
    connect(button, &QPushButton::clicked, this, [this, btn]() {
        m_clickedButton = btn;
        accept();
    });
    return button;
}

void NexMessageBox::setStandardButtons(StandardButtons buttons) {
    m_buttons = buttons;
    QList<QPushButton*> oldButtons = findChildren<QPushButton*>();
    for (QPushButton* btn : oldButtons) btn->deleteLater();

    QVBoxLayout* bgLayout = findChild<QWidget*>("bgWidget")->findChild<QVBoxLayout*>();
    QHBoxLayout* btnLayout = bgLayout->findChild<QHBoxLayout*>("buttonLayout");
    if (btnLayout) {
        if (buttons & Ok) btnLayout->addWidget(createButton(Ok));
        if (buttons & Yes) btnLayout->addWidget(createButton(Yes));
        if (buttons & No) btnLayout->addWidget(createButton(No));
        if (buttons & Cancel) btnLayout->addWidget(createButton(Cancel));
    }
}

void NexMessageBox::setIcon(Icon icon) {
    m_icon = icon;
    if (icon == NoIcon) {
        iconLabel->hide();
    } else {
        iconLabel->show();
        // Here we could load icons like ":/icons/info.svg" based on type
        if (icon == Information) iconLabel->setPixmap(QIcon(":/icons/info.svg").pixmap(32, 32));
        else if (icon == Question) iconLabel->setPixmap(QIcon(":/icons/help.svg").pixmap(32, 32));
        else if (icon == Warning) iconLabel->setPixmap(QIcon(":/icons/warning.svg").pixmap(32, 32));
        else if (icon == Critical) iconLabel->setPixmap(QIcon(":/icons/critical.svg").pixmap(32, 32));
        // You could add custom colors to icons using colorizePixmap if needed
    }
}

void NexMessageBox::setText(const QString &text) {
    textLabel->setText(text);
}

void NexMessageBox::setWindowTitle(const QString &title) {
    QDialog::setWindowTitle(title);
    // Since we are frameless, we might want to show title in UI or just keep it simple.
}

NexMessageBox::StandardButton NexMessageBox::information(QWidget *parent, const QString &title, const QString &text, StandardButtons buttons, StandardButton defaultButton) {
    NexMessageBox box(Information, title, text, buttons, parent);
    box.exec();
    return box.m_clickedButton;
}

NexMessageBox::StandardButton NexMessageBox::warning(QWidget *parent, const QString &title, const QString &text, StandardButtons buttons, StandardButton defaultButton) {
    NexMessageBox box(Warning, title, text, buttons, parent);
    box.exec();
    return box.m_clickedButton;
}

NexMessageBox::StandardButton NexMessageBox::critical(QWidget *parent, const QString &title, const QString &text, StandardButtons buttons, StandardButton defaultButton) {
    NexMessageBox box(Critical, title, text, buttons, parent);
    box.exec();
    return box.m_clickedButton;
}

NexMessageBox::StandardButton NexMessageBox::question(QWidget *parent, const QString &title, const QString &text, StandardButtons buttons, StandardButton defaultButton) {
    NexMessageBox box(Question, title, text, buttons, parent);
    box.exec();
    return box.m_clickedButton;
}

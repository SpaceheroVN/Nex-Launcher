#include "Gioi_Thieu.h"
#include "Cau_Hinh.h"
#include "Chay_Nex.h"

#include <QVBoxLayout>
#include <QLabel>
#include <QDialogButtonBox>
#include <QPushButton>
#include <QGraphicsDropShadowEffect>

Gioi_Thieu::Gioi_Thieu(QWidget *parent, const QString& lang, const QString& theme)
    : QDialog(parent)
{
    setWindowIcon(QIcon(":/icons/logo.ico"));
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
        "QLabel { color: %3; }"
        "QPushButton#acceptButton {"
        "   background-color: %4;"
        "   color: %5;"
        "   border: none;"
        "   border-radius: 6px;"
        "   padding: 6px 15px;"
        "   font-size: 14px;"
        "   min-width: 70px;"
        "}"
        "QPushButton#acceptButton:hover {"
        "   background-color: %6;"
        "}"
    ).arg(colors["bg_tier0"], colors["border_color"], colors["text_color"], colors["primary_color"], colors["primary_text"], colors["primary_hover_bg"]));
    
    QVBoxLayout* mainLayout = new QVBoxLayout(this);
    mainLayout->setContentsMargins(10, 10, 10, 10);
    mainLayout->addWidget(container);
    
    QMap<QString, QString> t = Cau_Hinh::getAboutTranslations(lang);
    setWindowTitle(t.value("title", "About Nex-Launcher"));
    setFixedSize(400, 340);
    
    QVBoxLayout* layout = new QVBoxLayout(container);
    layout->setAlignment(Qt::AlignCenter);
    layout->setSpacing(15);
    layout->setContentsMargins(20, 20, 20, 20);

    QLabel* logo_label = new QLabel(this);
    logo_label->setPixmap(QIcon(":/icons/logo.ico").pixmap(64, 64));
    logo_label->setAlignment(Qt::AlignCenter);
    logo_label->setFixedSize(64, 64);
    logo_label->setScaledContents(true);

    QLabel* title_label = new QLabel(t.value("title", "About Nex-Launcher"), this);
    QFont new_font = font();
    new_font.setPointSize(16);
    title_label->setFont(new_font);
    
    QLabel* version_label = new QLabel(t.value("version", "Version " + QString(APP_VERSION).remove("Nex_v")), this);
    version_label->setStyleSheet("font-size: 13px; color: gray;");

    QLabel* author_label = new QLabel(t.value("author", "Author: SpaceheroVN"), this);
    author_label->setStyleSheet("font-size: 14px;");
    
    QString link_template = t.value("github", "<a href=\"https://github.com/SpaceheroVN/Nex-Launcher/releases/\">Source Code on GitHub</a>");
    QString github_text = link_template;
    github_text.replace("{link_color}", colors["primary_color"]);

    QLabel* github_link = new QLabel(github_text, this);
    github_link->setOpenExternalLinks(true);
    github_link->setStyleSheet("font-size: 14px;");
    
    layout->addWidget(logo_label, 0, Qt::AlignCenter);
    layout->addWidget(title_label, 0, Qt::AlignCenter);
    layout->addWidget(version_label, 0, Qt::AlignCenter);
    layout->addWidget(author_label, 0, Qt::AlignCenter);
    layout->addWidget(github_link, 0, Qt::AlignCenter);
    
    layout->addStretch();

    QHBoxLayout* btnLayout = new QHBoxLayout();
    btnLayout->addStretch();
    QPushButton* ok_button = new QPushButton("OK", this);
    ok_button->setObjectName("acceptButton");
    connect(ok_button, &QPushButton::clicked, this, &QDialog::accept);
    btnLayout->addWidget(ok_button);
    btnLayout->addStretch();
    
    layout->addLayout(btnLayout);
}

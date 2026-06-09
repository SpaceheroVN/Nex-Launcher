#include "Cong_Cu_Cai_Dat.h"
#include "Cau_Hinh_Cai_Dat.h"

#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QGridLayout>
#include <QPushButton>
#include <QLabel>
#include <QCheckBox>
#include <QFrame>
#include <QMenu>
#include <QAction>
#include <QFont>
#include <QApplication>
#include <QMouseEvent>
#include <QComboBox>
#include <QFileInfo>
#include <QFileIconProvider>

class RowClickEventFilter : public QObject {
public:
    RowClickEventFilter(QCheckBox* cb, QObject* parent) : QObject(parent), checkbox(cb) {}
protected:
    bool eventFilter(QObject* obj, QEvent* event) override {
        if (event->type() == QEvent::MouseButtonRelease) {
            QMouseEvent* mouseEvent = static_cast<QMouseEvent*>(event);
            if (mouseEvent->button() == Qt::LeftButton) {
                QWidget* widget = static_cast<QWidget*>(obj);
                QWidget* child = widget->childAt(mouseEvent->pos());
                if (!child || (!qobject_cast<QPushButton*>(child) && !qobject_cast<QComboBox*>(child) && !qobject_cast<QCheckBox*>(child))) {
                    checkbox->toggle();
                    return true;
                }
            }
        }
        return QObject::eventFilter(obj, event);
    }
private:
    QCheckBox* checkbox;
};

QWidget* Cong_Cu_Cai_Dat::createListViewForItems(
    QList<QVariantMap>& items, QVBoxLayout* listLayout,
    SourceEditHandler sourceEditHandler, ToggleAllHandler toggleAllHandler, const QString& lang, bool showSelectAll) 
{
    if (items.isEmpty()) return nullptr;

    QWidget* mainListContainer = new QWidget();
    QVBoxLayout* mainListLayout = new QVBoxLayout(mainListContainer);
    mainListLayout->setContentsMargins(0, 0, 0, 0);
    mainListLayout->setSpacing(0);

    QPushButton* selectAllButton = nullptr;
    if (showSelectAll) {
        selectAllButton = new QPushButton(Cau_Hinh_Cai_Dat::getTranslation("Installer", lang, "select_all_btn"));
        selectAllButton->setObjectName("selectAllButton");
        mainListLayout->addWidget(selectAllButton);
        mainListLayout->addSpacing(10);
    }

    QWidget* itemWidgetsContainer = new QWidget();
    QVBoxLayout* layout = new QVBoxLayout(itemWidgetsContainer);
    layout->setContentsMargins(0, 0, 0, 0);
    layout->setSpacing(0);

    for (int i = 0; i < items.size(); ++i) {
        QVariantMap& itemData = items[i];
        
        QWidget* rowContainer = new QWidget();
        rowContainer->setObjectName("rowContainer");
        rowContainer->setProperty("isAppRow", true);
        rowContainer->setProperty("appName", itemData.value("name").toString());
        QHBoxLayout* rowLayout = new QHBoxLayout(rowContainer);
        rowLayout->setContentsMargins(10, 5, 10, 5);
        rowLayout->setSpacing(10);

        QCheckBox* checkbox = new QCheckBox();
        checkbox->setProperty("software_index", i); // Store index or identifier
        rowLayout->addWidget(checkbox);

        QWidget* nameContainer = new QWidget();
        QHBoxLayout* nameLayout = new QHBoxLayout(nameContainer);
        nameLayout->setContentsMargins(0, 0, 0, 0);
        nameLayout->setSpacing(10);

        QLabel* iconLabel = new QLabel();
        iconLabel->setFixedSize(32, 32);
        
        QString iconPath = itemData.value("display_icon").toString();
        QIcon appIcon;
        if (!iconPath.isEmpty() && QFileInfo::exists(iconPath)) {
            if (iconPath.endsWith(".ico", Qt::CaseInsensitive) || iconPath.endsWith(".png", Qt::CaseInsensitive)) {
                appIcon = QIcon(iconPath);
            } else {
                QFileIconProvider provider;
                appIcon = provider.icon(QFileInfo(iconPath));
            }
        }
        
        if (appIcon.isNull() || appIcon.availableSizes().isEmpty()) {
            appIcon = QIcon(":/icons/what_app.svg");
        }
        iconLabel->setPixmap(appIcon.pixmap(32, 32));
        nameLayout->addWidget(iconLabel);
        
        QLabel* nameLabel = new QLabel(itemData.value("name").toString());
        nameLayout->addWidget(nameLabel, 1);
        
        rowLayout->addWidget(nameContainer, 5);

        QVariantMap source = itemData.value("source").toMap();
        QString sourceType = source.value("type", "Unknown").toString();

        QPushButton* sourceButton = new QPushButton(sourceType);
        sourceButton->setFixedWidth(140);
        sourceButton->setFixedHeight(30);
        
        QMenu* sourceMenu = new QMenu(sourceButton);
        sourceMenu->setMinimumWidth(140);
        sourceMenu->setStyleSheet(qApp->styleSheet());
        
        QStringList types = {"Unknown", "Package", "Link", "Winget"};
        QVariantMap itemDataCopy = itemData;
        for (const QString& type : types) {
            QAction* action = sourceMenu->addAction(type);
            QObject::connect(action, &QAction::triggered, [sourceButton, itemDataCopy, type, sourceEditHandler]() mutable {
                if (sourceEditHandler) {
                    if (sourceEditHandler(sourceButton, itemDataCopy, type)) {
                        sourceButton->setText(type);
                    }
                }
            });
        }
        sourceButton->setMenu(sourceMenu);

        rowLayout->addWidget(checkbox);
        rowLayout->addWidget(nameLabel, 1);
        rowLayout->addWidget(sourceButton);

        rowContainer->installEventFilter(new RowClickEventFilter(checkbox, rowContainer));
        layout->addWidget(rowContainer);
    }

    mainListLayout->addWidget(itemWidgetsContainer);
    listLayout->addWidget(mainListContainer);

    if (selectAllButton) {
        QObject::connect(selectAllButton, &QPushButton::clicked, [toggleAllHandler, itemWidgetsContainer, selectAllButton]() {
            if (toggleAllHandler) toggleAllHandler(itemWidgetsContainer, selectAllButton);
        });
    }

    return mainListContainer;
}

void Cong_Cu_Cai_Dat::createGridViewForApps(
    QList<QVariantMap>& apps, QVBoxLayout* listLayout, ToggleAllHandler toggleAllHandler, const QString& lang, bool showSelectAll)
{
    if (apps.isEmpty()) return;

    // Simple grouping by category
    QMap<QString, QList<QVariantMap>> grouped;
    for (const auto& item : apps) {
        QString cat = item.value("category", "Utilities").toString();
        grouped[cat].append(item);
    }

    for (auto it = grouped.begin(); it != grouped.end(); ++it) {
        if (it.value().isEmpty()) continue;

        QWidget* headerWidget = new QWidget();
        QHBoxLayout* headerLayout = new QHBoxLayout(headerWidget);
        headerLayout->setContentsMargins(0, 0, 0, 0);

        // Ideally translate the category name here
        QLabel* catHeader = new QLabel(it.key());
        catHeader->setProperty("class", "ListHeader");

        headerLayout->addWidget(catHeader);
        headerLayout->addStretch();
        
        QPushButton* selectAllButton = nullptr;
        if (showSelectAll) {
            selectAllButton = new QPushButton(Cau_Hinh_Cai_Dat::getTranslation("Installer", lang, "select_all_btn"));
            selectAllButton->setObjectName("selectAllButton");
            selectAllButton->setFixedWidth(140);
            headerLayout->addWidget(selectAllButton);
        }
        
        listLayout->addWidget(headerWidget);

        QWidget* gridContainer = new QWidget();
        QGridLayout* gridLayout = new QGridLayout(gridContainer);
        gridLayout->setSpacing(10);

        QList<QVariantMap> sortedItems = it.value();
        // Sorting should be done here if needed

        for (int i = 0; i < sortedItems.size(); ++i) {
            QWidget* itemWidget = new QWidget();
            itemWidget->setObjectName("gridItem");
            itemWidget->setProperty("isAppRow", true);
            itemWidget->setProperty("appName", sortedItems[i].value("name").toString());
            QHBoxLayout* itemHLayout = new QHBoxLayout(itemWidget);
            itemHLayout->setContentsMargins(5, 5, 5, 5);

            QCheckBox* checkbox = new QCheckBox();
            
            QLabel* nameLabel = new QLabel(sortedItems[i].value("name").toString());
            
            itemHLayout->addWidget(checkbox);
            itemHLayout->addWidget(nameLabel);
            itemHLayout->addStretch();
            
            itemWidget->installEventFilter(new RowClickEventFilter(checkbox, itemWidget));
            gridLayout->addWidget(itemWidget, i / 3, i % 3);
        }
        
        listLayout->addWidget(gridContainer);
        listLayout->addSpacing(15);

        if (selectAllButton) {
            QObject::connect(selectAllButton, &QPushButton::clicked, [toggleAllHandler, gridContainer, selectAllButton]() {
                if (toggleAllHandler) toggleAllHandler(gridContainer, selectAllButton);
            });
        }
    }
}

QScrollArea* Cong_Cu_Cai_Dat::createSoftwareListPage(
    QList<QVariantMap>& softwareList, const QString& filterType,
    SourceEditHandler sourceEditHandler, ToggleAllHandler toggleAllHandler,
    const QVariantMap& settings, const QString& lang) 
{
    QScrollArea* scrollArea = new QScrollArea();
    scrollArea->setWidgetResizable(true);
    scrollArea->setObjectName("contentScroll");

    QWidget* pageContentWidget = new QWidget();
    QVBoxLayout* contentLayout = new QVBoxLayout(pageContentWidget);
    contentLayout->setContentsMargins(0, 0, 0, 10);
    contentLayout->setSpacing(0);

    QWidget* listContainer = new QWidget();
    QVBoxLayout* listLayout = new QVBoxLayout(listContainer);
    listLayout->setContentsMargins(0, 5, 0, 0);
    listLayout->setSpacing(0);

    bool useDetailed = settings.value("detailed_categories", false).toBool();

    QList<QVariantMap> apps;
    QList<QVariantMap> games;
    for (const auto& s : softwareList) {
        if (s.value("type").toString() == "app") apps.append(s);
        else if (s.value("type").toString() == "game") games.append(s);
    }

    if (filterType == "app") {
        if (useDetailed) createGridViewForApps(apps, listLayout, toggleAllHandler, lang);
        else createListViewForItems(apps, listLayout, sourceEditHandler, toggleAllHandler, lang);
    } else if (filterType == "game") {
        createListViewForItems(games, listLayout, sourceEditHandler, toggleAllHandler, lang);
    } else if (filterType == "all") {
        QPushButton* globalSelectAllButton = new QPushButton(Cau_Hinh_Cai_Dat::getTranslation("Installer", lang, "select_all_btn"));
        globalSelectAllButton->setObjectName("selectAllButton");
        listLayout->addWidget(globalSelectAllButton);
        listLayout->addSpacing(10);
        
        QObject::connect(globalSelectAllButton, &QPushButton::clicked, [toggleAllHandler, listContainer, globalSelectAllButton]() {
            if (toggleAllHandler) toggleAllHandler(listContainer, globalSelectAllButton);
        });

        if (!apps.isEmpty()) {
            QLabel* appHeader = new QLabel(Cau_Hinh_Cai_Dat::getTranslation("Installer", lang, "item_type_app"));
            appHeader->setProperty("class", "ListHeader");
            listLayout->addWidget(appHeader);
            listLayout->addSpacing(5);
            if (useDetailed) {
                appHeader->hide();
                createGridViewForApps(apps, listLayout, toggleAllHandler, lang, false);
            } else {
                createListViewForItems(apps, listLayout, sourceEditHandler, toggleAllHandler, lang, false);
            }
        }
        if (!apps.isEmpty() && !games.isEmpty()) listLayout->addSpacing(20);
        if (!games.isEmpty()) {
            QLabel* gameHeader = new QLabel(Cau_Hinh_Cai_Dat::getTranslation("Installer", lang, "item_type_game"));
            gameHeader->setProperty("class", "ListHeader");
            listLayout->addWidget(gameHeader);
            listLayout->addSpacing(5);
            createListViewForItems(games, listLayout, sourceEditHandler, toggleAllHandler, lang, false);
        }
    }

    listLayout->addStretch(1);
    contentLayout->addWidget(listContainer);
    scrollArea->setWidget(pageContentWidget);

    return scrollArea;
}

QWidget* Cong_Cu_Cai_Dat::createSearchResultsPage(
    QList<QVariantMap>& softwareList, SourceEditHandler sourceEditHandler, ToggleAllHandler toggleAllHandler, const QString& lang)
{
    QWidget* pageContentWidget = new QWidget();
    QVBoxLayout* contentLayout = new QVBoxLayout(pageContentWidget);
    contentLayout->setContentsMargins(10, 5, 10, 10);
    contentLayout->setSpacing(0);

    if (softwareList.isEmpty()) {
        QLabel* noResults = new QLabel("No matching results found.");
        noResults->setFont(QFont("Segoe UI", 12));
        noResults->setAlignment(Qt::AlignCenter);
        contentLayout->addWidget(noResults);
    } else {
        createListViewForItems(softwareList, contentLayout, sourceEditHandler, toggleAllHandler, lang);
    }
    
    contentLayout->addStretch(1);
    return pageContentWidget;
}

QWidget* Cong_Cu_Cai_Dat::createAppRowWidget(const QVariantMap& appData, SourceEditHandler sourceEditHandler, const QString& lang, QWidget* parent) {
    QWidget* rowContainer = new QWidget(parent);
    rowContainer->setObjectName("rowContainer");
    rowContainer->setProperty("isAppRow", true);
    rowContainer->setProperty("appName", appData.value("name").toString());
    
    QHBoxLayout* rowLayout = new QHBoxLayout(rowContainer);
    rowLayout->setContentsMargins(10, 5, 10, 5);
    rowLayout->setSpacing(10);

    QCheckBox* checkbox = new QCheckBox();

    QWidget* nameContainer = new QWidget();
    QHBoxLayout* nameLayout = new QHBoxLayout(nameContainer);
    nameLayout->setContentsMargins(0, 0, 0, 0);
    nameLayout->setSpacing(10);
    
    QLabel* nameLabel = new QLabel(appData.value("name").toString());
    nameLabel->setFont(QFont("Segoe UI", 11));
    nameLayout->addWidget(nameLabel, 1);

    QLabel* catLabel = new QLabel(appData.value("category", "Utilities").toString());
    catLabel->setContentsMargins(0, 0, 0, 0);

    QVariantMap source = appData.value("source").toMap();
    QString sourceType = source.value("type", "Unknown").toString();

    QPushButton* sourceButton = new QPushButton(sourceType);
    sourceButton->setFixedWidth(140);
    sourceButton->setFixedHeight(30);
    
    QMenu* sourceMenu = new QMenu(sourceButton);
    sourceMenu->setMinimumWidth(140);
    sourceMenu->setStyleSheet(qApp->styleSheet());
    
    QStringList types = {"Unknown", "Package", "Link", "Winget"};
    QVariantMap itemDataCopy = appData;
    for (const QString& type : types) {
        QAction* action = sourceMenu->addAction(type);
        QObject::connect(action, &QAction::triggered, [sourceButton, itemDataCopy, type, sourceEditHandler]() mutable {
            if (sourceEditHandler) {
                if (sourceEditHandler(sourceButton, itemDataCopy, type)) {
                    sourceButton->setText(type);
                }
            }
        });
    }
    sourceButton->setMenu(sourceMenu);

    rowLayout->addWidget(checkbox);
    rowLayout->addWidget(nameContainer, 5);
    rowLayout->addWidget(catLabel, 3);
    rowLayout->addWidget(sourceButton, 2);

    rowContainer->installEventFilter(new RowClickEventFilter(checkbox, rowContainer));
    return rowContainer;
}

#pragma once

#include <QWidget>
#include <QScrollArea>
#include <QVariantMap>
#include <QVBoxLayout>
#include <functional>

class Cong_Cu_Cai_Dat {
public:
    using SourceEditHandler = std::function<bool(QWidget* button, QVariantMap& itemData, const QString& newType)>;
    using ToggleAllHandler = std::function<void(QWidget* container, QWidget* button)>;

    static QScrollArea* createSoftwareListPage(
        QList<QVariantMap>& softwareList, 
        const QString& filterType,
        SourceEditHandler sourceEditHandler,
        ToggleAllHandler toggleAllHandler,
        const QVariantMap& settings,
        const QString& lang);

    static QWidget* createSearchResultsPage(
        QList<QVariantMap>& softwareList,
        SourceEditHandler sourceEditHandler,
        ToggleAllHandler toggleAllHandler,
        const QString& lang);

    static QWidget* createAppRowWidget(
        const QVariantMap& appData,
        SourceEditHandler sourceEditHandler,
        const QString& lang,
        QWidget* parent);

private:
    static QWidget* createListViewForItems(
        QList<QVariantMap>& items,
        QVBoxLayout* listLayout,
        SourceEditHandler sourceEditHandler,
        ToggleAllHandler toggleAllHandler,
        const QString& lang,
        bool showSelectAll = true);

    static void createGridViewForApps(
        QList<QVariantMap>& apps,
        QVBoxLayout* listLayout,
        ToggleAllHandler toggleAllHandler,
        const QString& lang,
        bool showSelectAll = true);
};

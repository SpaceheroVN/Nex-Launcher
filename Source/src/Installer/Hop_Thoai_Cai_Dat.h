#pragma once

#include <QDialog>
#include <QVariantMap>
#include <QList>
#include <QLabel>
#include <QLineEdit>
#include <QCheckBox>
#include <QComboBox>
#include <QProgressBar>
#include <QTableWidget>
#include <QGridLayout>
#include <QThread>
#include <QDialogButtonBox>
#include <QPushButton>

class HelpDialog : public QDialog {
    Q_OBJECT
public:
    explicit HelpDialog(const QString& helpText, QWidget *parent);
private:
    QLabel* label;
};

class SourceEditDialog : public QDialog {
    Q_OBJECT
public:
    explicit SourceEditDialog(const QString& sourceType, const QString& currentValue, const QString& currentArgs, const QString& placeholderText, QWidget *parent, const QString& lang, const QString& theme);
    std::pair<QString, QString> getData() const;

private slots:
    void browseFile();
    void toggleOptionsPanel(bool checked);
    void toggleHelpDialog(bool checked);
    void positionHelpDialog();
    void onCheckboxToggled(const QString& argText, bool isChecked);
    void updateCheckboxesFromText();

protected:
    void moveEvent(QMoveEvent *event) override;
    void closeEvent(QCloseEvent *event) override;
    void showEvent(QShowEvent *event) override;
    void accept() override;

private:
    void createOptionsPanel();

    QString m_lang;
    QString m_sourceType;
    HelpDialog* m_helpDialog;
    QLineEdit* m_valueEdit;
    QLineEdit* m_argsEdit;
    QPushButton* m_helpBtn;
    QPushButton* m_optionsBtn;
    QWidget* m_checkboxPanel;
    QMap<QString, QString> m_argMap;
    QMap<QString, QCheckBox*> m_checkboxes;
};

class Hop_Thoai_Tim_Kiem : public QDialog {
    Q_OBJECT
public:
    explicit Hop_Thoai_Tim_Kiem(QWidget *parent, const QString& lang, const QString& currentText);
    QString getData() const;

    QLineEdit* searchEdit;
};

class Hop_Thoai_Tien_Trinh : public QDialog {
    Q_OBJECT
public:
    explicit Hop_Thoai_Tien_Trinh(int totalItems, const QString& theme, QWidget *parent, const QString& lang, bool alwaysOnTop);
    void setupItems(const QList<QVariantMap>& items);
    void updateItemStatus(const QString& itemName, const QString& status, const QVariantMap& details);
    void updateOverallProgress(int completedCount);
    void allDone();

private:
    QString m_lang;
    QGridLayout* gridLayout;
    QProgressBar* overallProgress;
    QPushButton* closeButton;
    QMap<QString, QLabel*> itemLabels;
};

class Hop_Thoai_Them_Phan_Mem : public QDialog {
    Q_OBJECT
public:
    explicit Hop_Thoai_Them_Phan_Mem(const QString& theme, QWidget *parent, const QString& lang, const QVariantMap& settings);
    std::tuple<QString, QString, QString, QVariantMap> getData() const;

private slots:
    void onSourceTypeChanged(const QString& sourceType);
    void browseFile();
    void accept() override;

private:
    QString m_lang;
    QVariantMap m_cai_dat;
    QLineEdit* nameEdit;
    QComboBox* typeCombo;
    QComboBox* sourceTypeCombo;
    QWidget* sourceValueWidget;
    QLineEdit* sourceValueEdit;
    QPushButton* browseButton;
};

// Winget Worker
class WingetSearchWorker : public QThread {
    Q_OBJECT
public:
    explicit WingetSearchWorker(const QString& searchTerm, QObject *parent = nullptr);
    void run() override;

signals:
    void searchComplete(const QList<QVariantMap>& results);

private:
    QString m_searchTerm;
};

class WingetSearchDialog : public QDialog {
    Q_OBJECT
public:
    explicit WingetSearchDialog(const QString& initialSearchText, QWidget *parent, const QString& lang);
    QString getData() const;

private slots:
    void startSearch();
    void onSearchComplete(const QList<QVariantMap>& results);
    void onItemSelected();

private:
    QString m_lang;
    QString selectedId;
    QLineEdit* searchEdit;
    QPushButton* searchButton;
    QTableWidget* resultsTable;
    QProgressBar* progressBar;
    QDialogButtonBox* buttonBox;
    WingetSearchWorker* searchWorker;
};

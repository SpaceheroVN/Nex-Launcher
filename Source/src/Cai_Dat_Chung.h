#ifndef CAI_DAT_CHUNG_H
#define CAI_DAT_CHUNG_H

#include <QDialog>
#include <QVariantMap>
#include <QListWidget>
#include <QScrollArea>
#include <QScrollBar>
#include <QComboBox>
#include <QCheckBox>
#include <QPushButton>
#include <QSlider>
#include <QLabel>

class Cai_Dat_Chung : public QDialog {
    Q_OBJECT
public:
    explicit Cai_Dat_Chung(const QString& currentLang, const QString& currentTheme, QWidget *parent = nullptr);
    ~Cai_Dat_Chung();

    bool hasLauncherConfigChanged() const { return m_launcherConfigChanged; }
    bool hasUninstallerConfigChanged() const { return m_uninstallerConfigChanged; }
    bool hasInstallerConfigChanged() const { return m_installerConfigChanged; }
    
    QVariantMap getLauncherConfig() const { return m_launcherConfig; }
    QVariantMap getUninstallerConfig() const { return m_uninstallerConfig; }
    QVariantMap getInstallerConfig() const { return m_installerConfig; }

protected:
    bool eventFilter(QObject *obj, QEvent *event) override;

private slots:
    void changePage(int index);
    void onScrollValueChanged(int value);
    void saveSettings();
    void resetSettings();

private:
    void thiet_lap_giao_dien();
    void loadConfig();
    void applyStyles();
    
    QWidget* createUiTab();
    QWidget* createGeneralTab();
    QWidget* createUninstallerTab();
    QWidget* createInstallerTab();
    QWidget* createHelpTab();

    QString m_lang;
    QString m_theme;
    
    QVariantMap m_launcherConfig;
    QVariantMap m_uninstallerConfig;
    QVariantMap m_installerConfig;
    
    bool m_launcherConfigChanged;
    bool m_uninstallerConfigChanged;
    bool m_installerConfigChanged;

    QListWidget* sidebarList;
    QScrollArea* scrollArea;
    QList<QWidget*> sectionWidgets;
    
    // UI Tab widgets
    QComboBox* langCombo;
    QSlider* fontSizeSlider;
    QLabel* fontSizeValueLbl;
    QPushButton* lightThemeBtn;
    QPushButton* darkThemeBtn;
    QCheckBox* disableAnimationsCheck;
    QCheckBox* borderRadiusCheck;
    QSlider* opacitySlider;
    QLabel* opacityValueLbl;
    // General Tab widgets
    QCheckBox* alwaysOnTopCheck;
    QCheckBox* minimizeToTrayCheck;
    QCheckBox* silentUninstallCheck;
    QCheckBox* showConfirmationCheck;
    QCheckBox* showProgressCheck;
    QCheckBox* showNotificationCheck;
    QCheckBox* minimizeOnCloseCheck;

    // Installer Tab widgets
    QCheckBox* multiThreadCheck;
    QCheckBox* autoselectCheck;
    QCheckBox* minimizeCheck;
    QCheckBox* detailedCategoriesCheck;
    QCheckBox* progressCheck;
    QCheckBox* hideCheck;
    QCheckBox* completeCheck;
};

#endif // CAI_DAT_CHUNG_H

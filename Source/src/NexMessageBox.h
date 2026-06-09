#pragma once

#include <QDialog>
#include <QLabel>
#include <QPushButton>
#include <QString>

class NexMessageBox : public QDialog {
    Q_OBJECT
public:
    enum Icon { NoIcon, Information, Warning, Critical, Question };
    enum StandardButton { NoButton = 0, Ok = 1, Yes = 2, No = 4, Cancel = 8 };
    Q_DECLARE_FLAGS(StandardButtons, StandardButton)

    explicit NexMessageBox(QWidget *parent = nullptr);
    NexMessageBox(Icon icon, const QString &title, const QString &text, StandardButtons buttons = Ok, QWidget *parent = nullptr);

    static StandardButton information(QWidget *parent, const QString &title, const QString &text, StandardButtons buttons = Ok, StandardButton defaultButton = NoButton);
    static StandardButton warning(QWidget *parent, const QString &title, const QString &text, StandardButtons buttons = Ok, StandardButton defaultButton = NoButton);
    static StandardButton critical(QWidget *parent, const QString &title, const QString &text, StandardButtons buttons = Ok, StandardButton defaultButton = NoButton);
    static StandardButton question(QWidget *parent, const QString &title, const QString &text, StandardButtons buttons = StandardButtons(Yes | No), StandardButton defaultButton = NoButton);

    void setIcon(Icon icon);
    void setText(const QString &text);
    void setWindowTitle(const QString &title);
    void setStandardButtons(StandardButtons buttons);

private:
    void setupUi();
    void applyTheme();
    QPushButton* createButton(StandardButton btn);

    QLabel *iconLabel;
    QLabel *textLabel;
    Icon m_icon;
    StandardButtons m_buttons;
    StandardButton m_clickedButton;
};
Q_DECLARE_OPERATORS_FOR_FLAGS(NexMessageBox::StandardButtons)

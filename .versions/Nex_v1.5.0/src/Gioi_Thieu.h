#ifndef ABOUTDIALOG_H
#define ABOUTDIALOG_H

#include <QDialog>

class Gioi_Thieu : public QDialog {
    Q_OBJECT
public:
    explicit Gioi_Thieu(QWidget *parent = nullptr, const QString& lang = "EN", const QString& theme = "Light");
};

#endif // ABOUTDIALOG_H

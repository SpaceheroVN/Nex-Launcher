#include <QApplication>
#include "NexMessageBox.h"
#include <Windows.h>
#include <shellapi.h>

#include "Chay_Nex.h"

class DialogBlurFilter : public QObject {
public:
    DialogBlurFilter(QObject *parent = nullptr) : QObject(parent) {}
    bool eventFilter(QObject *obj, QEvent *event) override {
        if (qobject_cast<QDialog*>(obj)) {
            if (event->type() == QEvent::Show) {
                Chay_Nex::setBlur(true);
            } else if (event->type() == QEvent::Hide) {
                Chay_Nex::setBlur(false);
            }
        }
        return QObject::eventFilter(obj, event);
    }
};

int main(int argc, char *argv[]) {
    HANDLE hMutex = CreateMutexW(NULL, FALSE, L"NexLauncher_SingleInstance_Mutex");
    if (GetLastError() == ERROR_ALREADY_EXISTS) {
        MessageBoxW(NULL, L"Another instance of NEX is already running.", L"Nex-Launcher", MB_ICONWARNING | MB_OK);
        CloseHandle(hMutex);
        return 0;
    }

    QApplication app(argc, argv);
    app.setWindowIcon(QIcon(":/icons/logo.ico"));
    
    app.installEventFilter(new DialogBlurFilter(&app));

    Chay_Nex launcher;
    launcher.show();

    return app.exec();
}

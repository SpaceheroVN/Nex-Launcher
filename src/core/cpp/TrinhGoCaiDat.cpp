#include "TrinhGoCaiDat.h"

bool TrinhGoCaiDat::GoCaiDatPhanMem(const std::wstring& command) {
    STARTUPINFOW si;
    PROCESS_INFORMATION pi;
    ZeroMemory(&si, sizeof(si));
    si.cb = sizeof(si);
    si.dwFlags |= STARTF_USESHOWWINDOW;
    si.wShowWindow = SW_HIDE;
    
    ZeroMemory(&pi, sizeof(pi));

    std::wstring cmdBuffer = command;

    if (!CreateProcessW(NULL,
        &cmdBuffer[0],
        NULL,
        NULL,
        FALSE,
        CREATE_NO_WINDOW,
        NULL,
        NULL,
        &si,
        &pi)
    ) {
        return false;
    }

    WaitForSingleObject(pi.hProcess, INFINITE);

    DWORD exitCode = 0;
    GetExitCodeProcess(pi.hProcess, &exitCode);

    CloseHandle(pi.hProcess);
    CloseHandle(pi.hThread);

    return (exitCode == 0);
}

bool TrinhGoCaiDat::TaoDiemKhoiPhuc(const std::wstring& description) {
    // Tương lai: Logic SRSetRestorePoint API
    return true;
}

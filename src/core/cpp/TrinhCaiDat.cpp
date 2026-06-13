#include "TrinhCaiDat.h"

bool TrinhCaiDat::CaiDatPhanMem(const std::wstring& command) {
    STARTUPINFOW si;
    PROCESS_INFORMATION pi;
    ZeroMemory(&si, sizeof(si));
    si.cb = sizeof(si);
    // Hide window
    si.dwFlags |= STARTF_USESHOWWINDOW;
    si.wShowWindow = SW_HIDE;
    
    ZeroMemory(&pi, sizeof(pi));

    // Create a mutable copy of the command string since CreateProcessW might modify it
    std::wstring cmdBuffer = command;

    if (!CreateProcessW(NULL,
        &cmdBuffer[0],
        NULL,
        NULL,
        FALSE,
        CREATE_NO_WINDOW, // No console window
        NULL,
        NULL,
        &si,
        &pi)
    ) {
        return false;
    }

    // Wait until child process exits
    WaitForSingleObject(pi.hProcess, INFINITE);

    DWORD exitCode = 0;
    GetExitCodeProcess(pi.hProcess, &exitCode);

    CloseHandle(pi.hProcess);
    CloseHandle(pi.hThread);

    return (exitCode == 0);
}

bool TrinhCaiDat::DongGoiPhanMem(const std::wstring& sourceDir, const std::wstring& outputExe) {
    // Tương lai: Logic đóng gói file
    return true;
}

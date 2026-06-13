#pragma once

#include <windows.h>
#include <string>

class TrinhCaiDat {
public:
    // Thực thi lệnh cài đặt (winget hoặc file exe) ẩn
    // Trả về true nếu exit code = 0
    static bool CaiDatPhanMem(const std::wstring& command);
    
    // Stub cho tính năng Đóng gói sau này
    static bool DongGoiPhanMem(const std::wstring& sourceDir, const std::wstring& outputExe);
};

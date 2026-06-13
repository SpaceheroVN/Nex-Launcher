#pragma once

#include <windows.h>
#include <string>

class TrinhGoCaiDat {
public:
    // Thực thi lệnh gỡ cài đặt ẩn
    static bool GoCaiDatPhanMem(const std::wstring& command);
    
    // Stub cho tính năng Tạo Restore Point sau này
    static bool TaoDiemKhoiPhuc(const std::wstring& description);
};

#pragma once

#include <windows.h>
#include <string>
#include <vector>
#include <functional>

class KhoiPhucDuLieu {
public:
    // Cấu trúc đại diện cho định dạng file cần tìm
    struct FileSignature {
        std::string extension;
        std::vector<uint8_t> header;
        std::vector<uint8_t> footer;
    };

    // Hàm thực thi quét và khôi phục (File Carving)
    // - drivePath: Đường dẫn vật lý (ví dụ: \\.\PhysicalDrive1)
    // - outDir: Thư mục lưu file khôi phục
    // - pCallback: Hàm callback(int percent) báo tiến trình
    static bool QuetVaKhoiPhuc(const std::wstring& drivePath, const std::wstring& outDir, std::function<void(int)> progressCallback);

private:
    static std::vector<FileSignature> GetSignatures();
};

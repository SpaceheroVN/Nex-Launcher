#include "KhoiPhucDuLieu.h"
#include <iostream>
#include <fstream>
#include <sstream>

std::vector<KhoiPhucDuLieu::FileSignature> KhoiPhucDuLieu::GetSignatures() {
    std::vector<FileSignature> sigs;

    sigs.push_back({".jpg",  {0xFF,0xD8,0xFF},                                      {0xFF,0xD9},                                        15*1024*1024});
    sigs.push_back({".png",  {0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A},            {0x49,0x45,0x4E,0x44,0xAE,0x42,0x60,0x82},         20*1024*1024});
    sigs.push_back({".pdf",  {0x25,0x50,0x44,0x46},                                 {0x25,0x25,0x45,0x4F,0x46},                         100*1024*1024});
    sigs.push_back({".zip",  {0x50,0x4B,0x03,0x04},                                 {0x50,0x4B,0x05,0x06},                              500*1024*1024});
    sigs.push_back({".mp4",  {0x66,0x74,0x79,0x70},                                 {},                                                 2048*1024*1024LL});
    sigs.push_back({".avi",  {0x52,0x49,0x46,0x46},                                 {},                                                 2048*1024*1024LL});
    sigs.push_back({".docx", {0x50,0x4B,0x03,0x04,0x14,0x00,0x06,0x00},            {},                                                 100*1024*1024});
    sigs.push_back({".gif",  {0x47,0x49,0x46,0x38},                                 {0x00,0x3B},                                        10*1024*1024});
    sigs.push_back({".bmp",  {0x42,0x4D},                                           {},                                                 50*1024*1024});
    sigs.push_back({".exe",  {0x4D,0x5A},                                           {},                                                 200*1024*1024});
    sigs.push_back({".sqlite",{0x53,0x51,0x4C,0x69,0x74,0x65,0x20,0x66},           {},                                                 500*1024*1024});

    return sigs;
}

static bool MatchHeader(const uint8_t* buf, size_t bufLen, const std::vector<uint8_t>& header) {
    if (header.empty() || bufLen < header.size()) return false;
    return memcmp(buf, header.data(), header.size()) == 0;
}

static int64_t FindFooter(const uint8_t* buf, size_t bufLen, const std::vector<uint8_t>& footer, size_t startOffset) {
    if (footer.empty()) return -1;
    for (size_t i = startOffset; i + footer.size() <= bufLen; i++) {
        if (memcmp(buf + i, footer.data(), footer.size()) == 0) {
            return (int64_t)(i + footer.size());
        }
    }
    return -1;
}

static std::wstring BuildOutputPath(const std::wstring& outDir, const std::string& ext, int index) {
    std::wstring wext(ext.begin(), ext.end());
    if (!wext.empty() && wext.back() == L'b') wext.pop_back();
    std::wstring path = outDir + L"\\recovered_" + std::to_wstring(index) + wext;
    return path;
}

bool KhoiPhucDuLieu::QuetVaKhoiPhuc(
    const std::wstring& drivePath,
    const std::wstring& outDir,
    std::function<void(int)> progressCallback)
{
    HANDLE hDevice = CreateFileW(
        drivePath.c_str(),
        GENERIC_READ,
        FILE_SHARE_READ | FILE_SHARE_WRITE,
        NULL,
        OPEN_EXISTING,
        FILE_FLAG_NO_BUFFERING | FILE_FLAG_SEQUENTIAL_SCAN,
        NULL);

    if (hDevice == INVALID_HANDLE_VALUE) return false;

    DISK_GEOMETRY_EX geo;
    DWORD br = 0;
    LONGLONG diskSize = 0;
    if (DeviceIoControl(hDevice, IOCTL_DISK_GET_DRIVE_GEOMETRY_EX,
                        NULL, 0, &geo, sizeof(geo), &br, NULL)) {
        diskSize = geo.DiskSize.QuadPart;
    }
    if (diskSize == 0) {
        GET_LENGTH_INFORMATION gli;
        if (DeviceIoControl(hDevice, IOCTL_DISK_GET_LENGTH_INFO,
                            NULL, 0, &gli, sizeof(gli), &br, NULL)) {
            diskSize = gli.Length.QuadPart;
        }
    }
    if (diskSize == 0) diskSize = 100LL * 1024 * 1024 * 1024; // fallback 100GB

    auto sigs = GetSignatures();
    const DWORD SECTOR  = 512;
    const DWORD BUF_SEC = 8192;                  // 8192 sectors = 4MB
    const DWORD BUF_SZ  = SECTOR * BUF_SEC;

    uint8_t* buffer = (uint8_t*)VirtualAlloc(NULL, BUF_SZ, MEM_COMMIT, PAGE_READWRITE);
    if (!buffer) { CloseHandle(hDevice); return false; }

    int fileIndex  = 0;
    LONGLONG pos   = 0;
    DWORD bytesRead = 0;

    CreateDirectoryW(outDir.c_str(), NULL);

    while (pos < diskSize) {
        if (!ReadFile(hDevice, buffer, BUF_SZ, &bytesRead, NULL) || bytesRead == 0) break;

        for (DWORD i = 0; i < bytesRead; i++) {
            for (auto& sig : sigs) {
                if (!MatchHeader(buffer + i, bytesRead - i, sig.header)) continue;

                std::wstring outPath = BuildOutputPath(outDir, sig.extension, fileIndex++);
                HANDLE hOut = CreateFileW(outPath.c_str(), GENERIC_WRITE, 0, NULL,
                                          CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, NULL);
                if (hOut == INVALID_HANDLE_VALUE) continue;

                LONGLONG written = 0;
                LONGLONG maxSize = sig.maxSize;
                bool done = false;

                DWORD firstChunk = bytesRead - i;
                if ((LONGLONG)firstChunk > maxSize) firstChunk = (DWORD)maxSize;

                if (!sig.footer.empty()) {
                    int64_t footerEnd = FindFooter(buffer + i, firstChunk, sig.footer, sig.header.size());
                    if (footerEnd >= 0) {
                        DWORD dw; WriteFile(hOut, buffer + i, (DWORD)footerEnd, &dw, NULL);
                        CloseHandle(hOut);
                        done = true;
                    }
                }

                if (!done) {
                    DWORD dw; WriteFile(hOut, buffer + i, firstChunk, &dw, NULL);
                    written += firstChunk;

                    uint8_t* extBuf = (uint8_t*)VirtualAlloc(NULL, BUF_SZ, MEM_COMMIT, PAGE_READWRITE);
                    if (extBuf) {
                        while (written < maxSize && !done) {
                            DWORD extRead = 0;
                            if (!ReadFile(hDevice, extBuf, BUF_SZ, &extRead, NULL) || extRead == 0) break;

                            DWORD toWrite = extRead;
                            if (written + toWrite > maxSize) toWrite = (DWORD)(maxSize - written);

                            if (!sig.footer.empty()) {
                                int64_t footerEnd = FindFooter(extBuf, toWrite, sig.footer, 0);
                                if (footerEnd >= 0) {
                                    WriteFile(hOut, extBuf, (DWORD)footerEnd, &dw, NULL);
                                    done = true;
                                    LARGE_INTEGER li;
                                    li.QuadPart = pos + i + written + footerEnd;
                                    SetFilePointerEx(hDevice, li, NULL, FILE_BEGIN);
                                    pos = li.QuadPart - bytesRead; 
                                    break;
                                }
                            }
                            WriteFile(hOut, extBuf, toWrite, &dw, NULL);
                            written += toWrite;
                            pos += extRead; 
                        }
                        VirtualFree(extBuf, 0, MEM_RELEASE);
                    }
                    CloseHandle(hOut);
                }

                i = bytesRead; 
                break; 
            }
        }

        pos += bytesRead;

        if (diskSize > 0 && progressCallback) {
            int pct = (int)((pos * 100LL) / diskSize);
            if (pct > 100) pct = 100;
            progressCallback(pct);
        }
    }

    VirtualFree(buffer, 0, MEM_RELEASE);
    CloseHandle(hDevice);
    return true;
}

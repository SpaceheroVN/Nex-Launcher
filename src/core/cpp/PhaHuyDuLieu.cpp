#include "PhaHuyDuLieu.h"
#include <iostream>
#include <algorithm>

#pragma comment(lib, "bcrypt.lib")

void SecureWiper::fill_random(uint8_t* buf, size_t len) {
    BCryptGenRandom(NULL, buf, (ULONG)len, BCRYPT_USE_SYSTEM_PREFERRED_RNG);
}

bool SecureWiper::crypto_scramble(uint8_t* buf, size_t len) {
    BCRYPT_ALG_HANDLE hAlg = NULL;
    BCRYPT_KEY_HANDLE hKey = NULL;
    
    uint8_t key[32];
    uint8_t iv[16];
    fill_random(key, sizeof(key));
    fill_random(iv, sizeof(iv));
    
    BCryptOpenAlgorithmProvider(&hAlg, BCRYPT_AES_ALGORITHM, NULL, 0);
    BCryptSetProperty(hAlg, BCRYPT_CHAINING_MODE, (PUCHAR)BCRYPT_CHAIN_MODE_CFB, sizeof(BCRYPT_CHAIN_MODE_CFB), 0);
    BCryptGenerateSymmetricKey(hAlg, &hKey, NULL, 0, key, sizeof(key), 0);
    
    ULONG cbResult = 0;
    BCryptEncrypt(hKey, buf, (ULONG)len, NULL, iv, sizeof(iv), buf, (ULONG)len, &cbResult, 0);
    
    SecureZeroMemory(key, sizeof(key));
    SecureZeroMemory(iv, sizeof(iv));
    
    BCryptDestroyKey(hKey);
    BCryptCloseAlgorithmProvider(hAlg, 0);
    return true;
}

bool SecureWiper::wipe_region(const char* device_path, LONGLONG offset, LONGLONG length, int passes) {
    std::string device_str(device_path);
    std::wstring w_device(device_str.begin(), device_str.end());
    
    HANDLE hDisk = CreateFileW(w_device.c_str(),
                                GENERIC_WRITE,
                                FILE_SHARE_READ | FILE_SHARE_WRITE,
                                NULL, OPEN_EXISTING, 
                                FILE_FLAG_NO_BUFFERING | FILE_FLAG_WRITE_THROUGH,
                                NULL);

    if (hDisk == INVALID_HANDLE_VALUE) {
        return false;
    }

    // Try to lock and dismount the volume if it's a mounted volume
    DWORD bytesReturned;
    DeviceIoControl(hDisk, FSCTL_LOCK_VOLUME, NULL, 0, NULL, 0, &bytesReturned, NULL);
    DeviceIoControl(hDisk, FSCTL_DISMOUNT_VOLUME, NULL, 0, NULL, 0, &bytesReturned, NULL);

    // Default sector size fallback
    DWORD sectorSize = 4096; 
    
    // Try to get actual geometry
    DISK_GEOMETRY_EX geo;
    if (DeviceIoControl(hDisk, IOCTL_DISK_GET_DRIVE_GEOMETRY_EX, NULL, 0, &geo, sizeof(geo), &bytesReturned, NULL)) {
        sectorSize = geo.Geometry.BytesPerSector;
    }
    
    size_t bufSize = 4 * 1024 * 1024; // 4MB chunks
    bufSize = (bufSize / sectorSize) * sectorSize; // Align
    if (bufSize == 0) bufSize = sectorSize;

    std::vector<uint8_t> buf(bufSize);
    LONGLONG remaining, pos;

    // We do the recommended 4 passes if passes > 0, otherwise just 1 random pass.
    int max_passes = (passes > 0) ? passes : 4;
    
    for (int p = 0; p < max_passes; p++) {
        remaining = length; 
        pos = offset;
        while (remaining > 0) {
            LONGLONG chunkSize = std::min((LONGLONG)bufSize, remaining);
            if (chunkSize % sectorSize != 0) {
                 // Warning: writes with NO_BUFFERING must be sector-aligned
                 // In a real scenario, we might need read-modify-write for unaligned ends
            }
            
            if (p == 0 && max_passes >= 4) {
                 // Pass 1: Crypto scramble
                 fill_random(buf.data(), chunkSize);
                 crypto_scramble(buf.data(), chunkSize);
            } else if (p == 2 && max_passes >= 4) {
                 // Pass 3: Zeros
                 SecureZeroMemory(buf.data(), chunkSize);
            } else {
                 // Pass 2, 4 or custom: Pure random
                 fill_random(buf.data(), chunkSize);
            }
            
            write_at(hDisk, pos, buf.data(), chunkSize);
            pos += chunkSize;
            remaining -= chunkSize;
        }
        FlushFileBuffers(hDisk);
    }
    
    CloseHandle(hDisk);
    return true;
}

void SecureWiper::write_at(HANDLE h, LONGLONG offset, const uint8_t* buf, LONGLONG size) {
    LARGE_INTEGER li;
    li.QuadPart = offset;
    SetFilePointerEx(h, li, NULL, FILE_BEGIN);
    DWORD written;
    WriteFile(h, buf, (DWORD)size, &written, NULL);
}

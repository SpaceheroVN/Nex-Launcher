#pragma once

#include <windows.h>
#include <bcrypt.h>
#include <vector>
#include <string>
#include <cstdint>

class SecureWiper {
public:
    static void fill_random(uint8_t* buf, size_t len);
    static bool crypto_scramble(uint8_t* buf, size_t len);
    bool wipe_region(const char* device_path, LONGLONG offset, LONGLONG length, int passes);

private:
    void write_at(HANDLE h, LONGLONG offset, const uint8_t* buf, LONGLONG size);
};

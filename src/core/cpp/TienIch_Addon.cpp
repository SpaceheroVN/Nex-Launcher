#include <napi.h>
#include <thread>
#include "PhaHuyDuLieu.h"
#include "TrinhCaiDat.h"
#include "TrinhGoCaiDat.h"
#include "KhoiPhucDuLieu.h"

// Wrapper for secure wipe
Napi::Boolean WipeRegion(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 4 || !info[0].IsString() || !info[1].IsNumber() || !info[2].IsNumber() || !info[3].IsNumber()) {
        Napi::TypeError::New(env, "Wrong arguments. Expected: string device, number offset, number length, number passes").ThrowAsJavaScriptException();
        return Napi::Boolean::New(env, false);
    }
    
    std::string device = info[0].As<Napi::String>();
    int64_t offset    = info[1].As<Napi::Number>().Int64Value();
    int64_t length    = info[2].As<Napi::Number>().Int64Value();
    int passes        = info[3].As<Napi::Number>().Int32Value();
    
    SecureWiper wiper;
    bool result = wiper.wipe_region(device.c_str(), offset, length, passes);
    return Napi::Boolean::New(env, result);
}

// Wrapper for Installer
Napi::Boolean NativeInstallApp(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected string command").ThrowAsJavaScriptException();
        return Napi::Boolean::New(env, false);
    }
    
    std::string cmd = info[0].As<Napi::String>();
    std::wstring wcmd(cmd.begin(), cmd.end());
    
    bool result = TrinhCaiDat::CaiDatPhanMem(wcmd);
    return Napi::Boolean::New(env, result);
}

// Wrapper for Uninstaller
Napi::Boolean NativeUninstallApp(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected string command").ThrowAsJavaScriptException();
        return Napi::Boolean::New(env, false);
    }
    
    std::string cmd = info[0].As<Napi::String>();
    std::wstring wcmd(cmd.begin(), cmd.end());
    
    bool result = TrinhGoCaiDat::GoCaiDatPhanMem(wcmd);
    return Napi::Boolean::New(env, result);
}

// Wrapper for Data Recovery using ThreadSafeFunction
Napi::Value NativeRecoverData(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 3 || !info[0].IsString() || !info[1].IsString() || !info[2].IsFunction()) {
        Napi::TypeError::New(env, "Expected drivePath, outDir strings and a callback function").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    
    std::string drive = info[0].As<Napi::String>();
    std::wstring wdrive(drive.begin(), drive.end());

    std::string out = info[1].As<Napi::String>();
    std::wstring wout(out.begin(), out.end());
    
    Napi::Function cb = info[2].As<Napi::Function>();

    Napi::ThreadSafeFunction tsfn = Napi::ThreadSafeFunction::New(
        env,
        cb,
        "RecoverDataCallback",
        0,
        1
    );

    std::thread nativeThread([tsfn, wdrive, wout]() mutable {
        auto progressCallback = [&tsfn](int percent) {
            auto callback = [percent](Napi::Env env, Napi::Function jsCallback) {
                jsCallback.Call({ Napi::Number::New(env, percent), env.Undefined() });
            };
            tsfn.BlockingCall(callback);
        };
        
        bool result = KhoiPhucDuLieu::QuetVaKhoiPhuc(wdrive, wout, progressCallback);
        
        auto finalCallback = [result](Napi::Env env, Napi::Function jsCallback) {
            jsCallback.Call({ Napi::Number::New(env, 100), Napi::Boolean::New(env, result) });
        };
        tsfn.BlockingCall(finalCallback);
        tsfn.Release();
    });

    nativeThread.detach();
    return env.Undefined();
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set("wipeRegion", Napi::Function::New(env, WipeRegion));
    exports.Set("nativeInstallApp", Napi::Function::New(env, NativeInstallApp));
    exports.Set("nativeUninstallApp", Napi::Function::New(env, NativeUninstallApp));
    exports.Set("nativeRecoverData", Napi::Function::New(env, NativeRecoverData));
    return exports;
}

NODE_API_MODULE(nex_addon, Init)

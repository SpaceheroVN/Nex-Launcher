{
  "targets": [
    {
      "target_name": "nex_addon",
      "cflags!": [ "-fno-exceptions" ],
      "sources": [
        "src/core/cpp/TienIch_Addon.cpp",
        "src/core/cpp/PhaHuyDuLieu.cpp",
        "src/core/cpp/TrinhCaiDat.cpp",
        "src/core/cpp/TrinhGoCaiDat.cpp",
        "src/core/cpp/KhoiPhucDuLieu.cpp"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "defines": [ "NAPI_DISABLE_CPP_EXCEPTIONS" ],
      "conditions": [
        ["OS=='win'", {
          "libraries": [ "bcrypt.lib" ]
        }]
      ],
      "msvs_settings": {
        "VCCLCompilerTool": {
          "ExceptionHandling": 1
        }
      }
    }
  ]
}

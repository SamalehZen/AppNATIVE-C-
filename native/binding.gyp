{
  "targets": [
    {
      "target_name": "speechly_native",
      "cflags!": ["-fno-exceptions"],
      "cflags_cc!": ["-fno-exceptions"],
      "sources": [
        "src/addon.cpp",
        "src/window_detector.cpp",
        "src/text_injector.cpp",
        "src/hotkey_manager.cpp"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "src"
      ],
      "defines": ["NAPI_DISABLE_CPP_EXCEPTIONS"],
      "conditions": [
        ["OS=='win'", {
          "sources": [
            "src/window_detector_win.cpp",
            "src/text_injector_win.cpp",
            "src/hotkey_manager_win.cpp"
          ],
          "libraries": [
            "-luser32.lib",
            "-lpsapi.lib",
            "-lole32.lib",
            "-loleaut32.lib"
          ],
          "msvs_settings": {
            "VCCLCompilerTool": {
              "ExceptionHandling": 1
            }
          }
        }],
        ["OS=='mac'", {
          "sources": [
            "src/window_detector_mac.mm",
            "src/text_injector_mac.mm",
            "src/hotkey_manager_mac.mm"
          ],
          "xcode_settings": {
            "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
            "CLANG_CXX_LIBRARY": "libc++",
            "MACOSX_DEPLOYMENT_TARGET": "10.15",
            "OTHER_CPLUSPLUSFLAGS": ["-std=c++17", "-ObjC++"],
            "OTHER_LDFLAGS": [
              "-framework Cocoa",
              "-framework Carbon",
              "-framework ApplicationServices",
              "-framework AppKit",
              "-framework CoreGraphics"
            ]
          }
        }],
        ["OS=='linux'", {
          "sources": [
            "src/window_detector_linux.cpp",
            "src/text_injector_linux.cpp",
            "src/hotkey_manager_linux.cpp"
          ],
          "libraries": [
            "-lX11",
            "-lXtst"
          ],
          "cflags_cc": ["-std=c++17"]
        }]
      ]
    }
  ]
}

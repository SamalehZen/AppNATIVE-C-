#include <napi.h>
#include "window_detector.h"
#include "text_injector.h"
#include "hotkey_manager.h"
#include <memory>
#include <thread>
#include <atomic>

namespace speechly {

static std::unique_ptr<WindowDetector> g_windowDetector;
static std::unique_ptr<TextInjector> g_textInjector;
static std::unique_ptr<HotkeyManager> g_hotkeyManager;
static Napi::ThreadSafeFunction g_windowChangeCallback;
static Napi::ThreadSafeFunction g_hotkeyCallbacks[256];
static std::atomic<int> g_nextHotkeyId{1};

Napi::Object GetActiveWindow(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_windowDetector) {
        g_windowDetector = std::make_unique<WindowDetector>();
    }
    
    ActiveWindowInfo windowInfo = g_windowDetector->getActiveWindow();
    
    Napi::Object result = Napi::Object::New(env);
    result.Set("title", Napi::String::New(env, windowInfo.title));
    result.Set("processName", Napi::String::New(env, windowInfo.processName));
    result.Set("bundleId", Napi::String::New(env, windowInfo.bundleId));
    result.Set("executablePath", Napi::String::New(env, windowInfo.executablePath));
    result.Set("pid", Napi::Number::New(env, static_cast<double>(windowInfo.pid)));
    result.Set("isValid", Napi::Boolean::New(env, windowInfo.isValid));
    
    return result;
}

Napi::Value StartWindowWatcher(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsFunction()) {
        Napi::TypeError::New(env, "Callback function expected").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    if (!g_windowDetector) {
        g_windowDetector = std::make_unique<WindowDetector>();
    }
    
    g_windowChangeCallback = Napi::ThreadSafeFunction::New(
        env,
        info[0].As<Napi::Function>(),
        "WindowChangeCallback",
        0,
        1
    );
    
    bool success = g_windowDetector->startWatching([](const ActiveWindowInfo& windowInfo) {
        auto callback = [](Napi::Env env, Napi::Function jsCallback, ActiveWindowInfo* info) {
            Napi::Object result = Napi::Object::New(env);
            result.Set("title", Napi::String::New(env, info->title));
            result.Set("processName", Napi::String::New(env, info->processName));
            result.Set("bundleId", Napi::String::New(env, info->bundleId));
            result.Set("executablePath", Napi::String::New(env, info->executablePath));
            result.Set("pid", Napi::Number::New(env, static_cast<double>(info->pid)));
            result.Set("isValid", Napi::Boolean::New(env, info->isValid));
            jsCallback.Call({result});
            delete info;
        };
        
        ActiveWindowInfo* infoCopy = new ActiveWindowInfo(windowInfo);
        g_windowChangeCallback.BlockingCall(infoCopy, callback);
    });
    
    return Napi::Boolean::New(env, success);
}

Napi::Value StopWindowWatcher(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (g_windowDetector) {
        g_windowDetector->stopWatching();
    }
    
    if (g_windowChangeCallback) {
        g_windowChangeCallback.Release();
    }
    
    return env.Undefined();
}

Napi::Value InjectText(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "String expected").ThrowAsJavaScriptException();
        return Napi::Boolean::New(env, false);
    }
    
    if (!g_textInjector) {
        g_textInjector = std::make_unique<TextInjector>();
    }
    
    std::string text = info[0].As<Napi::String>().Utf8Value();
    
    InjectionMethod method = InjectionMethod::Auto;
    if (info.Length() > 1 && info[1].IsString()) {
        std::string methodStr = info[1].As<Napi::String>().Utf8Value();
        if (methodStr == "clipboard") {
            method = InjectionMethod::Clipboard;
        } else if (methodStr == "direct") {
            method = InjectionMethod::Direct;
        }
    }
    
    InjectionResult result = g_textInjector->injectText(text, method);
    
    Napi::Object resultObj = Napi::Object::New(env);
    resultObj.Set("success", Napi::Boolean::New(env, result.success));
    resultObj.Set("error", Napi::String::New(env, result.error));
    
    return resultObj;
}

Napi::Value InjectTextWithDelay(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 2 || !info[0].IsString() || !info[1].IsNumber()) {
        Napi::TypeError::New(env, "String and number expected").ThrowAsJavaScriptException();
        return Napi::Boolean::New(env, false);
    }
    
    if (!g_textInjector) {
        g_textInjector = std::make_unique<TextInjector>();
    }
    
    std::string text = info[0].As<Napi::String>().Utf8Value();
    uint32_t delayMs = info[1].As<Napi::Number>().Uint32Value();
    
    InjectionResult result = g_textInjector->injectTextWithDelay(text, delayMs);
    
    Napi::Object resultObj = Napi::Object::New(env);
    resultObj.Set("success", Napi::Boolean::New(env, result.success));
    resultObj.Set("error", Napi::String::New(env, result.error));
    
    return resultObj;
}

Napi::Value PasteFromClipboard(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_textInjector) {
        g_textInjector = std::make_unique<TextInjector>();
    }
    
    InjectionResult result = g_textInjector->pasteFromClipboard();
    
    Napi::Object resultObj = Napi::Object::New(env);
    resultObj.Set("success", Napi::Boolean::New(env, result.success));
    resultObj.Set("error", Napi::String::New(env, result.error));
    
    return resultObj;
}

Napi::Value SetClipboardText(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "String expected").ThrowAsJavaScriptException();
        return Napi::Boolean::New(env, false);
    }
    
    if (!g_textInjector) {
        g_textInjector = std::make_unique<TextInjector>();
    }
    
    std::string text = info[0].As<Napi::String>().Utf8Value();
    bool success = g_textInjector->setClipboardText(text);
    
    return Napi::Boolean::New(env, success);
}

Napi::Value GetClipboardText(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_textInjector) {
        g_textInjector = std::make_unique<TextInjector>();
    }
    
    std::string text = g_textInjector->getClipboardText();
    return Napi::String::New(env, text);
}

Napi::Value RegisterHotkey(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Accelerator string and callback expected").ThrowAsJavaScriptException();
        return Napi::Number::New(env, -1);
    }
    
    if (!g_hotkeyManager) {
        g_hotkeyManager = std::make_unique<HotkeyManager>();
        g_hotkeyManager->start();
    }
    
    std::string accelerator;
    uint32_t modifiers = 0;
    uint32_t keyCode = 0;
    
    if (info[0].IsString()) {
        accelerator = info[0].As<Napi::String>().Utf8Value();
        Hotkey hotkey = HotkeyManager::parseAccelerator(accelerator);
        modifiers = hotkey.modifiers;
        keyCode = hotkey.keyCode;
    } else if (info[0].IsNumber() && info.Length() >= 3 && info[1].IsNumber()) {
        modifiers = info[0].As<Napi::Number>().Uint32Value();
        keyCode = info[1].As<Napi::Number>().Uint32Value();
    } else {
        Napi::TypeError::New(env, "Invalid arguments").ThrowAsJavaScriptException();
        return Napi::Number::New(env, -1);
    }
    
    Napi::Function callback = info[info.Length() - 1].As<Napi::Function>();
    int hotkeyId = g_nextHotkeyId++;
    
    if (hotkeyId < 256) {
        g_hotkeyCallbacks[hotkeyId] = Napi::ThreadSafeFunction::New(
            env,
            callback,
            "HotkeyCallback" + std::to_string(hotkeyId),
            0,
            1
        );
        
        int32_t result = g_hotkeyManager->registerHotkey(modifiers, keyCode, [hotkeyId]() {
            if (g_hotkeyCallbacks[hotkeyId]) {
                g_hotkeyCallbacks[hotkeyId].BlockingCall([](Napi::Env env, Napi::Function jsCallback) {
                    jsCallback.Call({});
                });
            }
        });
        
        if (result >= 0) {
            return Napi::Number::New(env, hotkeyId);
        }
    }
    
    return Napi::Number::New(env, -1);
}

Napi::Value UnregisterHotkey(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Hotkey ID expected").ThrowAsJavaScriptException();
        return Napi::Boolean::New(env, false);
    }
    
    int32_t id = info[0].As<Napi::Number>().Int32Value();
    
    if (!g_hotkeyManager) {
        return Napi::Boolean::New(env, false);
    }
    
    bool success = g_hotkeyManager->unregisterHotkey(id);
    
    if (success && id >= 0 && id < 256 && g_hotkeyCallbacks[id]) {
        g_hotkeyCallbacks[id].Release();
    }
    
    return Napi::Boolean::New(env, success);
}

Napi::Value UnregisterAllHotkeys(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (g_hotkeyManager) {
        g_hotkeyManager->unregisterAll();
    }
    
    for (int i = 0; i < 256; i++) {
        if (g_hotkeyCallbacks[i]) {
            g_hotkeyCallbacks[i].Release();
        }
    }
    
    return env.Undefined();
}

Napi::Value ParseAccelerator(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Accelerator string expected").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string accelerator = info[0].As<Napi::String>().Utf8Value();
    Hotkey hotkey = HotkeyManager::parseAccelerator(accelerator);
    
    Napi::Object result = Napi::Object::New(env);
    result.Set("modifiers", Napi::Number::New(env, hotkey.modifiers));
    result.Set("keyCode", Napi::Number::New(env, hotkey.keyCode));
    result.Set("accelerator", Napi::String::New(env, hotkey.accelerator));
    
    return result;
}

Napi::Value GetPlatform(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
#if defined(_WIN32)
    return Napi::String::New(env, "win32");
#elif defined(__APPLE__)
    return Napi::String::New(env, "darwin");
#elif defined(__linux__)
    return Napi::String::New(env, "linux");
#else
    return Napi::String::New(env, "unknown");
#endif
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set("getActiveWindow", Napi::Function::New(env, GetActiveWindow));
    exports.Set("startWindowWatcher", Napi::Function::New(env, StartWindowWatcher));
    exports.Set("stopWindowWatcher", Napi::Function::New(env, StopWindowWatcher));
    
    exports.Set("injectText", Napi::Function::New(env, InjectText));
    exports.Set("injectTextWithDelay", Napi::Function::New(env, InjectTextWithDelay));
    exports.Set("pasteFromClipboard", Napi::Function::New(env, PasteFromClipboard));
    exports.Set("setClipboardText", Napi::Function::New(env, SetClipboardText));
    exports.Set("getClipboardText", Napi::Function::New(env, GetClipboardText));
    
    exports.Set("registerHotkey", Napi::Function::New(env, RegisterHotkey));
    exports.Set("unregisterHotkey", Napi::Function::New(env, UnregisterHotkey));
    exports.Set("unregisterAllHotkeys", Napi::Function::New(env, UnregisterAllHotkeys));
    exports.Set("parseAccelerator", Napi::Function::New(env, ParseAccelerator));
    
    exports.Set("getPlatform", Napi::Function::New(env, GetPlatform));
    
    return exports;
}

NODE_API_MODULE(speechly_native, Init)

}

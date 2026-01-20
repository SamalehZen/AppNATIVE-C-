#ifdef _WIN32

#include "hotkey_manager.h"
#include <windows.h>
#include <thread>
#include <atomic>
#include <map>
#include <mutex>

namespace speechly {

static UINT ConvertModifiers(uint32_t modifiers) {
    UINT winMods = 0;
    
    if (modifiers & static_cast<uint32_t>(Modifier::Ctrl)) {
        winMods |= MOD_CONTROL;
    }
    if (modifiers & static_cast<uint32_t>(Modifier::Alt)) {
        winMods |= MOD_ALT;
    }
    if (modifiers & static_cast<uint32_t>(Modifier::Shift)) {
        winMods |= MOD_SHIFT;
    }
    if (modifiers & static_cast<uint32_t>(Modifier::Meta)) {
        winMods |= MOD_WIN;
    }
    
    return winMods | MOD_NOREPEAT;
}

static DWORD GetVirtualKeyForTrigger(TriggerKey key) {
    switch (key) {
        case TriggerKey::Ctrl: return VK_CONTROL;
        case TriggerKey::Alt: return VK_MENU;
        case TriggerKey::Shift: return VK_SHIFT;
        case TriggerKey::CapsLock: return VK_CAPITAL;
        case TriggerKey::Fn: return 0xFF;
        default: return VK_CONTROL;
    }
}

class HotkeyManager::Impl {
public:
    std::atomic<bool> running{false};
    std::thread messageThread;
    std::map<int32_t, HotkeyCallback> callbacks;
    std::map<int32_t, std::pair<uint32_t, uint32_t>> hotkeys;
    std::mutex mutex;
    int32_t nextId{1};
    DWORD threadId{0};
    
    static Impl* instance;
    
    void messageLoop() {
        threadId = GetCurrentThreadId();
        
        {
            std::lock_guard<std::mutex> lock(mutex);
            for (const auto& pair : hotkeys) {
                UINT mods = ConvertModifiers(pair.second.first);
                RegisterHotKey(NULL, pair.first, mods, pair.second.second);
            }
        }
        
        MSG msg;
        while (running && GetMessage(&msg, NULL, 0, 0)) {
            if (msg.message == WM_HOTKEY) {
                int32_t id = static_cast<int32_t>(msg.wParam);
                HotkeyCallback cb;
                
                {
                    std::lock_guard<std::mutex> lock(mutex);
                    auto it = callbacks.find(id);
                    if (it != callbacks.end()) {
                        cb = it->second;
                    }
                }
                
                if (cb) {
                    cb();
                }
            }
        }
        
        {
            std::lock_guard<std::mutex> lock(mutex);
            for (const auto& pair : hotkeys) {
                UnregisterHotKey(NULL, pair.first);
            }
        }
    }
};

HotkeyManager::Impl* HotkeyManager::Impl::instance = nullptr;

HotkeyManager::HotkeyManager() : impl_(new Impl()) {
    impl_->instance = impl_;
}

HotkeyManager::~HotkeyManager() {
    stop();
    if (impl_->instance == impl_) {
        impl_->instance = nullptr;
    }
    delete impl_;
}

int32_t HotkeyManager::registerHotkey(const std::string& accelerator, HotkeyCallback callback) {
    Hotkey hk = parseAccelerator(accelerator);
    return registerHotkey(hk.modifiers, hk.keyCode, callback);
}

int32_t HotkeyManager::registerHotkey(uint32_t modifiers, uint32_t keyCode, HotkeyCallback callback) {
    std::lock_guard<std::mutex> lock(impl_->mutex);
    
    int32_t id = impl_->nextId++;
    impl_->callbacks[id] = callback;
    impl_->hotkeys[id] = {modifiers, keyCode};
    
    if (impl_->running && impl_->threadId != 0) {
        UINT mods = ConvertModifiers(modifiers);
        PostThreadMessage(impl_->threadId, WM_USER, id, MAKELPARAM(mods, keyCode));
    }
    
    return id;
}

bool HotkeyManager::unregisterHotkey(int32_t id) {
    std::lock_guard<std::mutex> lock(impl_->mutex);
    
    auto it = impl_->callbacks.find(id);
    if (it == impl_->callbacks.end()) {
        return false;
    }
    
    impl_->callbacks.erase(it);
    impl_->hotkeys.erase(id);
    
    if (impl_->running && impl_->threadId != 0) {
        UnregisterHotKey(NULL, id);
    }
    
    return true;
}

void HotkeyManager::unregisterAll() {
    std::lock_guard<std::mutex> lock(impl_->mutex);
    
    if (impl_->running && impl_->threadId != 0) {
        for (const auto& pair : impl_->hotkeys) {
            UnregisterHotKey(NULL, pair.first);
        }
    }
    
    impl_->callbacks.clear();
    impl_->hotkeys.clear();
}

bool HotkeyManager::start() {
    if (impl_->running) {
        return true;
    }
    
    impl_->running = true;
    impl_->messageThread = std::thread(&Impl::messageLoop, impl_);
    
    return true;
}

void HotkeyManager::stop() {
    if (!impl_->running) {
        return;
    }
    
    impl_->running = false;
    
    if (impl_->threadId != 0) {
        PostThreadMessage(impl_->threadId, WM_QUIT, 0, 0);
    }
    
    if (impl_->messageThread.joinable()) {
        impl_->messageThread.join();
    }
    
    impl_->threadId = 0;
}

bool HotkeyManager::isRunning() const {
    return impl_->running;
}

int RegisterGlobalHotkey(uint32_t modifiers, uint32_t keyCode, HotkeyCallback callback) {
    UINT mods = ConvertModifiers(modifiers);
    static int nextId = 1;
    int id = nextId++;
    
    if (RegisterHotKey(NULL, id, mods, keyCode)) {
        return id;
    }
    
    return -1;
}

bool UnregisterGlobalHotkey(int32_t id) {
    return UnregisterHotKey(NULL, id) != 0;
}

struct DoubleTapListenerInfo {
    TriggerKey key;
    int thresholdMs;
    DoubleTapCallback callback;
    DoubleTapDetector detector;
};

struct HoldListenerInfo {
    TriggerKey key;
    HoldCallback callback;
    HoldDetector detector;
};

class KeyListener::Impl {
public:
    std::atomic<bool> running{false};
    std::thread hookThread;
    std::map<int32_t, DoubleTapListenerInfo> doubleTapListeners;
    std::map<int32_t, HoldListenerInfo> holdListeners;
    std::mutex mutex;
    int32_t nextId{1};
    HHOOK keyboardHook{nullptr};
    
    static Impl* instance;
    
    static LRESULT CALLBACK LowLevelKeyboardProc(int nCode, WPARAM wParam, LPARAM lParam) {
        if (nCode == HC_ACTION && instance) {
            KBDLLHOOKSTRUCT* kbd = reinterpret_cast<KBDLLHOOKSTRUCT*>(lParam);
            
            bool isKeyDown = (wParam == WM_KEYDOWN || wParam == WM_SYSKEYDOWN);
            bool isKeyUp = (wParam == WM_KEYUP || wParam == WM_SYSKEYUP);
            
            std::lock_guard<std::mutex> lock(instance->mutex);
            
            for (auto& pair : instance->doubleTapListeners) {
                DWORD targetVK = GetVirtualKeyForTrigger(pair.second.key);
                if (kbd->vkCode == targetVK) {
                    if (isKeyDown) {
                        pair.second.detector.onKeyDown();
                        if (pair.second.detector.tapCount >= 2) {
                            pair.second.detector.reset();
                            if (pair.second.callback) {
                                pair.second.callback("double-tap");
                            }
                        }
                    } else if (isKeyUp) {
                        pair.second.detector.onKeyUp();
                    }
                }
            }
            
            for (auto& pair : instance->holdListeners) {
                DWORD targetVK = GetVirtualKeyForTrigger(pair.second.key);
                if (kbd->vkCode == targetVK) {
                    if (isKeyDown && !pair.second.detector.isCurrentlyHeld()) {
                        pair.second.detector.onKeyDown();
                        if (pair.second.callback) {
                            pair.second.callback("hold-start", 0);
                        }
                    } else if (isKeyUp && pair.second.detector.isCurrentlyHeld()) {
                        int duration = pair.second.detector.holdDurationMs();
                        pair.second.detector.onKeyUp();
                        if (pair.second.callback) {
                            pair.second.callback("hold-end", duration);
                        }
                    }
                }
            }
        }
        
        return CallNextHookEx(nullptr, nCode, wParam, lParam);
    }
    
    void hookLoop() {
        keyboardHook = SetWindowsHookEx(WH_KEYBOARD_LL, LowLevelKeyboardProc, nullptr, 0);
        
        if (!keyboardHook) {
            running = false;
            return;
        }
        
        MSG msg;
        while (running && GetMessage(&msg, nullptr, 0, 0)) {
            TranslateMessage(&msg);
            DispatchMessage(&msg);
        }
        
        if (keyboardHook) {
            UnhookWindowsHookEx(keyboardHook);
            keyboardHook = nullptr;
        }
    }
};

KeyListener::Impl* KeyListener::Impl::instance = nullptr;

KeyListener::KeyListener() : impl_(new Impl()) {
    impl_->instance = impl_;
}

KeyListener::~KeyListener() {
    stop();
    if (impl_->instance == impl_) {
        impl_->instance = nullptr;
    }
    delete impl_;
}

int32_t KeyListener::registerDoubleTapListener(const std::string& key, int thresholdMs, DoubleTapCallback callback) {
    std::lock_guard<std::mutex> lock(impl_->mutex);
    
    int32_t id = impl_->nextId++;
    DoubleTapListenerInfo info;
    info.key = HotkeyManager::parseTriggerKey(key);
    info.thresholdMs = thresholdMs;
    info.callback = callback;
    info.detector.key = info.key;
    info.detector.thresholdMs = thresholdMs;
    
    impl_->doubleTapListeners[id] = info;
    return id;
}

int32_t KeyListener::registerHoldListener(const std::string& key, HoldCallback callback) {
    std::lock_guard<std::mutex> lock(impl_->mutex);
    
    int32_t id = impl_->nextId++;
    HoldListenerInfo info;
    info.key = HotkeyManager::parseTriggerKey(key);
    info.callback = callback;
    info.detector.key = info.key;
    
    impl_->holdListeners[id] = info;
    return id;
}

bool KeyListener::unregisterDoubleTapListener(int32_t id) {
    std::lock_guard<std::mutex> lock(impl_->mutex);
    return impl_->doubleTapListeners.erase(id) > 0;
}

bool KeyListener::unregisterHoldListener(int32_t id) {
    std::lock_guard<std::mutex> lock(impl_->mutex);
    return impl_->holdListeners.erase(id) > 0;
}

bool KeyListener::start() {
    if (impl_->running) {
        return true;
    }
    
    impl_->running = true;
    impl_->hookThread = std::thread(&Impl::hookLoop, impl_);
    
    return true;
}

void KeyListener::stop() {
    if (!impl_->running) {
        return;
    }
    
    impl_->running = false;
    
    PostThreadMessage(GetThreadId(impl_->hookThread.native_handle()), WM_QUIT, 0, 0);
    
    if (impl_->hookThread.joinable()) {
        impl_->hookThread.join();
    }
}

bool KeyListener::isRunning() const {
    return impl_->running;
}

}

#endif

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

}

#endif

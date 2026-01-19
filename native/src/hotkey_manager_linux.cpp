#ifdef __linux__

#include "hotkey_manager.h"
#include <X11/Xlib.h>
#include <X11/keysym.h>
#include <X11/XKBlib.h>
#include <thread>
#include <atomic>
#include <map>
#include <mutex>
#include <unistd.h>

namespace speechly {

static unsigned int ConvertModifiers(uint32_t modifiers) {
    unsigned int xMods = 0;
    
    if (modifiers & static_cast<uint32_t>(Modifier::Ctrl)) {
        xMods |= ControlMask;
    }
    if (modifiers & static_cast<uint32_t>(Modifier::Alt)) {
        xMods |= Mod1Mask;
    }
    if (modifiers & static_cast<uint32_t>(Modifier::Shift)) {
        xMods |= ShiftMask;
    }
    if (modifiers & static_cast<uint32_t>(Modifier::Meta)) {
        xMods |= Mod4Mask;
    }
    
    return xMods;
}

static KeySym ConvertKeyCode(uint32_t keyCode) {
    if (keyCode >= 'A' && keyCode <= 'Z') {
        return XK_a + (keyCode - 'A');
    }
    if (keyCode >= '0' && keyCode <= '9') {
        return XK_0 + (keyCode - '0');
    }
    
    switch (keyCode) {
        case 0x20: return XK_space;
        case 0x0D: return XK_Return;
        case 0x09: return XK_Tab;
        case 0x08: return XK_BackSpace;
        case 0x2E: return XK_Delete;
        case 0x1B: return XK_Escape;
        case 0x26: return XK_Up;
        case 0x28: return XK_Down;
        case 0x25: return XK_Left;
        case 0x27: return XK_Right;
        case 0x24: return XK_Home;
        case 0x23: return XK_End;
        case 0x21: return XK_Page_Up;
        case 0x22: return XK_Page_Down;
        case 0x2D: return XK_Insert;
        case 0x70: return XK_F1;
        case 0x71: return XK_F2;
        case 0x72: return XK_F3;
        case 0x73: return XK_F4;
        case 0x74: return XK_F5;
        case 0x75: return XK_F6;
        case 0x76: return XK_F7;
        case 0x77: return XK_F8;
        case 0x78: return XK_F9;
        case 0x79: return XK_F10;
        case 0x7A: return XK_F11;
        case 0x7B: return XK_F12;
        default: return NoSymbol;
    }
}

class HotkeyManager::Impl {
public:
    std::atomic<bool> running{false};
    std::thread watcherThread;
    std::map<int32_t, HotkeyCallback> callbacks;
    std::map<int32_t, std::pair<unsigned int, KeyCode>> hotkeys;
    std::mutex mutex;
    int32_t nextId{1};
    Display* display{nullptr};
    
    void grabKey(Display* dpy, unsigned int modifiers, KeyCode keycode) {
        Window root = DefaultRootWindow(dpy);
        
        unsigned int modMasks[] = {0, LockMask, Mod2Mask, LockMask | Mod2Mask};
        
        for (unsigned int mask : modMasks) {
            XGrabKey(dpy, keycode, modifiers | mask, root, True,
                    GrabModeAsync, GrabModeAsync);
        }
    }
    
    void ungrabKey(Display* dpy, unsigned int modifiers, KeyCode keycode) {
        Window root = DefaultRootWindow(dpy);
        
        unsigned int modMasks[] = {0, LockMask, Mod2Mask, LockMask | Mod2Mask};
        
        for (unsigned int mask : modMasks) {
            XUngrabKey(dpy, keycode, modifiers | mask, root);
        }
    }
    
    void watchLoop() {
        Display* dpy = XOpenDisplay(nullptr);
        if (!dpy) {
            running = false;
            return;
        }
        
        {
            std::lock_guard<std::mutex> lock(mutex);
            for (const auto& pair : hotkeys) {
                grabKey(dpy, pair.second.first, pair.second.second);
            }
        }
        
        Window root = DefaultRootWindow(dpy);
        XSelectInput(dpy, root, KeyPressMask);
        
        while (running) {
            while (XPending(dpy) > 0) {
                XEvent event;
                XNextEvent(dpy, &event);
                
                if (event.type == KeyPress) {
                    XKeyEvent* keyEvent = &event.xkey;
                    unsigned int modState = keyEvent->state & (ControlMask | Mod1Mask | ShiftMask | Mod4Mask);
                    
                    std::lock_guard<std::mutex> lock(mutex);
                    for (const auto& pair : hotkeys) {
                        if (pair.second.second == keyEvent->keycode &&
                            pair.second.first == modState) {
                            auto it = callbacks.find(pair.first);
                            if (it != callbacks.end() && it->second) {
                                it->second();
                            }
                            break;
                        }
                    }
                }
            }
            
            usleep(10000);
        }
        
        {
            std::lock_guard<std::mutex> lock(mutex);
            for (const auto& pair : hotkeys) {
                ungrabKey(dpy, pair.second.first, pair.second.second);
            }
        }
        
        XCloseDisplay(dpy);
    }
};

HotkeyManager::HotkeyManager() : impl_(new Impl()) {}

HotkeyManager::~HotkeyManager() {
    stop();
    delete impl_;
}

int32_t HotkeyManager::registerHotkey(const std::string& accelerator, HotkeyCallback callback) {
    Hotkey hk = parseAccelerator(accelerator);
    return registerHotkey(hk.modifiers, hk.keyCode, callback);
}

int32_t HotkeyManager::registerHotkey(uint32_t modifiers, uint32_t keyCode, HotkeyCallback callback) {
    std::lock_guard<std::mutex> lock(impl_->mutex);
    
    Display* dpy = XOpenDisplay(nullptr);
    if (!dpy) {
        return -1;
    }
    
    KeySym keysym = ConvertKeyCode(keyCode);
    if (keysym == NoSymbol) {
        XCloseDisplay(dpy);
        return -1;
    }
    
    KeyCode xKeyCode = XKeysymToKeycode(dpy, keysym);
    unsigned int xMods = ConvertModifiers(modifiers);
    
    int32_t id = impl_->nextId++;
    impl_->callbacks[id] = callback;
    impl_->hotkeys[id] = {xMods, xKeyCode};
    
    if (impl_->running) {
        impl_->grabKey(dpy, xMods, xKeyCode);
    }
    
    XCloseDisplay(dpy);
    return id;
}

bool HotkeyManager::unregisterHotkey(int32_t id) {
    std::lock_guard<std::mutex> lock(impl_->mutex);
    
    auto it = impl_->callbacks.find(id);
    if (it == impl_->callbacks.end()) {
        return false;
    }
    
    auto hkIt = impl_->hotkeys.find(id);
    if (hkIt != impl_->hotkeys.end() && impl_->running) {
        Display* dpy = XOpenDisplay(nullptr);
        if (dpy) {
            impl_->ungrabKey(dpy, hkIt->second.first, hkIt->second.second);
            XCloseDisplay(dpy);
        }
    }
    
    impl_->callbacks.erase(it);
    impl_->hotkeys.erase(id);
    
    return true;
}

void HotkeyManager::unregisterAll() {
    std::lock_guard<std::mutex> lock(impl_->mutex);
    
    if (impl_->running) {
        Display* dpy = XOpenDisplay(nullptr);
        if (dpy) {
            for (const auto& pair : impl_->hotkeys) {
                impl_->ungrabKey(dpy, pair.second.first, pair.second.second);
            }
            XCloseDisplay(dpy);
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
    impl_->watcherThread = std::thread(&Impl::watchLoop, impl_);
    
    return true;
}

void HotkeyManager::stop() {
    if (!impl_->running) {
        return;
    }
    
    impl_->running = false;
    
    if (impl_->watcherThread.joinable()) {
        impl_->watcherThread.join();
    }
}

bool HotkeyManager::isRunning() const {
    return impl_->running;
}

int RegisterGlobalHotkey(uint32_t modifiers, uint32_t keyCode, HotkeyCallback callback) {
    return -1;
}

bool UnregisterGlobalHotkey(int32_t id) {
    return false;
}

}

#endif

#include "hotkey_manager.h"
#include <algorithm>
#include <cctype>
#include <sstream>
#include <vector>

namespace speechly {

bool DoubleTapDetector::detectDoubleTap() {
    auto now = std::chrono::steady_clock::now();
    auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(now - lastTapTime).count();
    
    if (elapsed < thresholdMs && tapCount > 0) {
        tapCount = 0;
        return true;
    }
    
    return false;
}

void DoubleTapDetector::reset() {
    tapCount = 0;
    wasKeyUp = true;
}

void DoubleTapDetector::onKeyDown() {
    if (wasKeyUp) {
        auto now = std::chrono::steady_clock::now();
        auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(now - lastTapTime).count();
        
        if (elapsed > thresholdMs) {
            tapCount = 1;
        } else {
            tapCount++;
        }
        
        lastTapTime = now;
        wasKeyUp = false;
    }
}

void DoubleTapDetector::onKeyUp() {
    wasKeyUp = true;
}

void HoldDetector::onKeyDown() {
    if (!isHeld) {
        isHeld = true;
        holdStartTime = std::chrono::steady_clock::now();
    }
}

void HoldDetector::onKeyUp() {
    isHeld = false;
}

bool HoldDetector::isCurrentlyHeld() const {
    return isHeld;
}

int HoldDetector::holdDurationMs() const {
    if (!isHeld) return 0;
    auto now = std::chrono::steady_clock::now();
    return static_cast<int>(std::chrono::duration_cast<std::chrono::milliseconds>(now - holdStartTime).count());
}

TriggerKey HotkeyManager::parseTriggerKey(const std::string& keyName) {
    std::string key = keyName;
    std::transform(key.begin(), key.end(), key.begin(), ::tolower);
    
    if (key == "ctrl" || key == "control") return TriggerKey::Ctrl;
    if (key == "alt" || key == "option") return TriggerKey::Alt;
    if (key == "shift") return TriggerKey::Shift;
    if (key == "capslock" || key == "caps") return TriggerKey::CapsLock;
    if (key == "fn") return TriggerKey::Fn;
    
    return TriggerKey::Ctrl;
}

Hotkey HotkeyManager::parseAccelerator(const std::string& accelerator) {
    Hotkey hotkey;
    hotkey.modifiers = 0;
    hotkey.keyCode = 0;
    hotkey.accelerator = accelerator;
    
    std::string acc = accelerator;
    std::transform(acc.begin(), acc.end(), acc.begin(), ::tolower);
    
    std::vector<std::string> parts;
    std::stringstream ss(acc);
    std::string part;
    
    while (std::getline(ss, part, '+')) {
        size_t start = part.find_first_not_of(" ");
        size_t end = part.find_last_not_of(" ");
        if (start != std::string::npos) {
            parts.push_back(part.substr(start, end - start + 1));
        }
    }
    
    for (size_t i = 0; i < parts.size(); i++) {
        const std::string& p = parts[i];
        
        if (p == "ctrl" || p == "control" || p == "commandorcontrol" || p == "cmdorctrl") {
            hotkey.modifiers |= static_cast<uint32_t>(Modifier::Ctrl);
        } else if (p == "alt" || p == "option") {
            hotkey.modifiers |= static_cast<uint32_t>(Modifier::Alt);
        } else if (p == "shift") {
            hotkey.modifiers |= static_cast<uint32_t>(Modifier::Shift);
        } else if (p == "meta" || p == "cmd" || p == "command" || p == "super" || p == "win") {
            hotkey.modifiers |= static_cast<uint32_t>(Modifier::Meta);
        } else if (i == parts.size() - 1) {
            if (p == "space") hotkey.keyCode = 0x20;
            else if (p == "enter" || p == "return") hotkey.keyCode = 0x0D;
            else if (p == "tab") hotkey.keyCode = 0x09;
            else if (p == "backspace") hotkey.keyCode = 0x08;
            else if (p == "delete") hotkey.keyCode = 0x2E;
            else if (p == "escape" || p == "esc") hotkey.keyCode = 0x1B;
            else if (p == "up") hotkey.keyCode = 0x26;
            else if (p == "down") hotkey.keyCode = 0x28;
            else if (p == "left") hotkey.keyCode = 0x25;
            else if (p == "right") hotkey.keyCode = 0x27;
            else if (p == "home") hotkey.keyCode = 0x24;
            else if (p == "end") hotkey.keyCode = 0x23;
            else if (p == "pageup") hotkey.keyCode = 0x21;
            else if (p == "pagedown") hotkey.keyCode = 0x22;
            else if (p == "insert") hotkey.keyCode = 0x2D;
            else if (p.size() >= 2 && p[0] == 'f' && std::isdigit(p[1])) {
                int fNum = std::stoi(p.substr(1));
                if (fNum >= 1 && fNum <= 24) {
                    hotkey.keyCode = 0x70 + fNum - 1;
                }
            } else if (p.size() == 1) {
                char c = std::toupper(p[0]);
                if ((c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9')) {
                    hotkey.keyCode = static_cast<uint32_t>(c);
                }
            }
        }
    }
    
    return hotkey;
}

std::string HotkeyManager::getAcceleratorString(uint32_t modifiers, uint32_t keyCode) {
    std::string result;
    
    if (modifiers & static_cast<uint32_t>(Modifier::Ctrl)) {
        result += "Ctrl+";
    }
    if (modifiers & static_cast<uint32_t>(Modifier::Alt)) {
        result += "Alt+";
    }
    if (modifiers & static_cast<uint32_t>(Modifier::Shift)) {
        result += "Shift+";
    }
    if (modifiers & static_cast<uint32_t>(Modifier::Meta)) {
#ifdef __APPLE__
        result += "Cmd+";
#else
        result += "Meta+";
#endif
    }
    
    if (keyCode == 0x20) result += "Space";
    else if (keyCode == 0x0D) result += "Enter";
    else if (keyCode == 0x09) result += "Tab";
    else if (keyCode == 0x08) result += "Backspace";
    else if (keyCode == 0x2E) result += "Delete";
    else if (keyCode == 0x1B) result += "Escape";
    else if (keyCode == 0x26) result += "Up";
    else if (keyCode == 0x28) result += "Down";
    else if (keyCode == 0x25) result += "Left";
    else if (keyCode == 0x27) result += "Right";
    else if (keyCode >= 0x70 && keyCode <= 0x87) {
        result += "F" + std::to_string(keyCode - 0x70 + 1);
    } else if ((keyCode >= 'A' && keyCode <= 'Z') || (keyCode >= '0' && keyCode <= '9')) {
        result += static_cast<char>(keyCode);
    }
    
    return result;
}

#if defined(_WIN32)
#elif defined(__APPLE__)
#elif defined(__linux__)
#else

class HotkeyManager::Impl {
public:
    bool running{false};
};

HotkeyManager::HotkeyManager() : impl_(new Impl()) {}
HotkeyManager::~HotkeyManager() { delete impl_; }

int32_t HotkeyManager::registerHotkey(const std::string& accelerator, HotkeyCallback callback) {
    return -1;
}

int32_t HotkeyManager::registerHotkey(uint32_t modifiers, uint32_t keyCode, HotkeyCallback callback) {
    return -1;
}

bool HotkeyManager::unregisterHotkey(int32_t id) {
    return false;
}

void HotkeyManager::unregisterAll() {}

bool HotkeyManager::start() {
    return false;
}

void HotkeyManager::stop() {}

bool HotkeyManager::isRunning() const {
    return impl_->running;
}

class KeyListener::Impl {
public:
    bool running{false};
};

KeyListener::KeyListener() : impl_(new Impl()) {}
KeyListener::~KeyListener() { delete impl_; }

int32_t KeyListener::registerDoubleTapListener(const std::string& key, int thresholdMs, DoubleTapCallback callback) {
    return -1;
}

int32_t KeyListener::registerHoldListener(const std::string& key, HoldCallback callback) {
    return -1;
}

bool KeyListener::unregisterDoubleTapListener(int32_t id) {
    return false;
}

bool KeyListener::unregisterHoldListener(int32_t id) {
    return false;
}

bool KeyListener::start() {
    return false;
}

void KeyListener::stop() {}

bool KeyListener::isRunning() const {
    return impl_->running;
}

int RegisterGlobalHotkey(uint32_t modifiers, uint32_t keyCode, HotkeyCallback callback) {
    return -1;
}

bool UnregisterGlobalHotkey(int32_t id) {
    return false;
}

#endif

}

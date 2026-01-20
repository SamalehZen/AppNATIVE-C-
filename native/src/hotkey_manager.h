#ifndef HOTKEY_MANAGER_H
#define HOTKEY_MANAGER_H

#include <string>
#include <functional>
#include <cstdint>
#include <map>
#include <chrono>

namespace speechly {

enum class Modifier : uint32_t {
    None = 0,
    Ctrl = 1 << 0,
    Alt = 1 << 1,
    Shift = 1 << 2,
    Meta = 1 << 3,
    Command = Meta
};

inline Modifier operator|(Modifier a, Modifier b) {
    return static_cast<Modifier>(static_cast<uint32_t>(a) | static_cast<uint32_t>(b));
}

inline uint32_t operator&(Modifier a, Modifier b) {
    return static_cast<uint32_t>(a) & static_cast<uint32_t>(b);
}

struct Hotkey {
    uint32_t modifiers;
    uint32_t keyCode;
    std::string accelerator;
};

using HotkeyCallback = std::function<void()>;
using DoubleTapCallback = std::function<void(const std::string&)>;
using HoldCallback = std::function<void(const std::string&, int)>;

enum class TriggerKey {
    Ctrl,
    Alt,
    Shift,
    CapsLock,
    Fn
};

struct DoubleTapDetector {
    TriggerKey key;
    int tapCount;
    std::chrono::steady_clock::time_point lastTapTime;
    int thresholdMs;
    bool wasKeyUp;
    
    DoubleTapDetector() : key(TriggerKey::Ctrl), tapCount(0), thresholdMs(300), wasKeyUp(true) {}
    
    bool detectDoubleTap();
    void reset();
    void onKeyDown();
    void onKeyUp();
};

struct HoldDetector {
    TriggerKey key;
    bool isHeld;
    std::chrono::steady_clock::time_point holdStartTime;
    
    HoldDetector() : key(TriggerKey::Ctrl), isHeld(false) {}
    
    void onKeyDown();
    void onKeyUp();
    bool isCurrentlyHeld() const;
    int holdDurationMs() const;
};

class HotkeyManager {
public:
    HotkeyManager();
    ~HotkeyManager();

    int32_t registerHotkey(const std::string& accelerator, HotkeyCallback callback);
    int32_t registerHotkey(uint32_t modifiers, uint32_t keyCode, HotkeyCallback callback);
    bool unregisterHotkey(int32_t id);
    void unregisterAll();
    
    bool start();
    void stop();
    bool isRunning() const;
    
    static Hotkey parseAccelerator(const std::string& accelerator);
    static std::string getAcceleratorString(uint32_t modifiers, uint32_t keyCode);
    static TriggerKey parseTriggerKey(const std::string& keyName);

private:
    class Impl;
    Impl* impl_;
};

class KeyListener {
public:
    KeyListener();
    ~KeyListener();
    
    int32_t registerDoubleTapListener(const std::string& key, int thresholdMs, DoubleTapCallback callback);
    int32_t registerHoldListener(const std::string& key, HoldCallback callback);
    bool unregisterDoubleTapListener(int32_t id);
    bool unregisterHoldListener(int32_t id);
    
    bool start();
    void stop();
    bool isRunning() const;

private:
    class Impl;
    Impl* impl_;
};

int RegisterGlobalHotkey(uint32_t modifiers, uint32_t keyCode, HotkeyCallback callback);
bool UnregisterGlobalHotkey(int32_t id);

}

#endif

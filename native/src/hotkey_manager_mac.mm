#ifdef __APPLE__

#include "hotkey_manager.h"
#import <Carbon/Carbon.h>
#import <Cocoa/Cocoa.h>
#include <map>
#include <mutex>
#include <atomic>

namespace speechly {

static UInt32 ConvertKeyCode(uint32_t keyCode) {
    static std::map<uint32_t, UInt32> keyMap = {
        {'A', kVK_ANSI_A}, {'B', kVK_ANSI_B}, {'C', kVK_ANSI_C}, {'D', kVK_ANSI_D},
        {'E', kVK_ANSI_E}, {'F', kVK_ANSI_F}, {'G', kVK_ANSI_G}, {'H', kVK_ANSI_H},
        {'I', kVK_ANSI_I}, {'J', kVK_ANSI_J}, {'K', kVK_ANSI_K}, {'L', kVK_ANSI_L},
        {'M', kVK_ANSI_M}, {'N', kVK_ANSI_N}, {'O', kVK_ANSI_O}, {'P', kVK_ANSI_P},
        {'Q', kVK_ANSI_Q}, {'R', kVK_ANSI_R}, {'S', kVK_ANSI_S}, {'T', kVK_ANSI_T},
        {'U', kVK_ANSI_U}, {'V', kVK_ANSI_V}, {'W', kVK_ANSI_W}, {'X', kVK_ANSI_X},
        {'Y', kVK_ANSI_Y}, {'Z', kVK_ANSI_Z},
        {'0', kVK_ANSI_0}, {'1', kVK_ANSI_1}, {'2', kVK_ANSI_2}, {'3', kVK_ANSI_3},
        {'4', kVK_ANSI_4}, {'5', kVK_ANSI_5}, {'6', kVK_ANSI_6}, {'7', kVK_ANSI_7},
        {'8', kVK_ANSI_8}, {'9', kVK_ANSI_9},
        {0x20, kVK_Space},
        {0x0D, kVK_Return},
        {0x09, kVK_Tab},
        {0x08, kVK_Delete},
        {0x2E, kVK_ForwardDelete},
        {0x1B, kVK_Escape},
        {0x26, kVK_UpArrow},
        {0x28, kVK_DownArrow},
        {0x25, kVK_LeftArrow},
        {0x27, kVK_RightArrow},
        {0x24, kVK_Home},
        {0x23, kVK_End},
        {0x21, kVK_PageUp},
        {0x22, kVK_PageDown},
        {0x70, kVK_F1}, {0x71, kVK_F2}, {0x72, kVK_F3}, {0x73, kVK_F4},
        {0x74, kVK_F5}, {0x75, kVK_F6}, {0x76, kVK_F7}, {0x77, kVK_F8},
        {0x78, kVK_F9}, {0x79, kVK_F10}, {0x7A, kVK_F11}, {0x7B, kVK_F12}
    };
    
    auto it = keyMap.find(keyCode);
    return (it != keyMap.end()) ? it->second : 0;
}

static UInt32 ConvertModifiers(uint32_t modifiers) {
    UInt32 macMods = 0;
    
    if (modifiers & static_cast<uint32_t>(Modifier::Ctrl)) {
        macMods |= controlKey;
    }
    if (modifiers & static_cast<uint32_t>(Modifier::Alt)) {
        macMods |= optionKey;
    }
    if (modifiers & static_cast<uint32_t>(Modifier::Shift)) {
        macMods |= shiftKey;
    }
    if (modifiers & static_cast<uint32_t>(Modifier::Meta)) {
        macMods |= cmdKey;
    }
    
    return macMods;
}

class HotkeyManager::Impl {
public:
    std::atomic<bool> running{false};
    std::map<int32_t, HotkeyCallback> callbacks;
    std::map<int32_t, EventHotKeyRef> hotkeyRefs;
    std::mutex mutex;
    int32_t nextId{1};
    EventHandlerRef eventHandler{nullptr};
    
    static Impl* instance;
    
    static OSStatus HotkeyHandler(EventHandlerCallRef nextHandler, EventRef event, void* userData) {
        if (!instance) return eventNotHandledErr;
        
        EventHotKeyID hotkeyID;
        GetEventParameter(event, kEventParamDirectObject, typeEventHotKeyID, NULL, 
                         sizeof(hotkeyID), NULL, &hotkeyID);
        
        int32_t id = static_cast<int32_t>(hotkeyID.id);
        HotkeyCallback cb;
        
        {
            std::lock_guard<std::mutex> lock(instance->mutex);
            auto it = instance->callbacks.find(id);
            if (it != instance->callbacks.end()) {
                cb = it->second;
            }
        }
        
        if (cb) {
            dispatch_async(dispatch_get_main_queue(), ^{
                cb();
            });
        }
        
        return noErr;
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
    
    if (impl_->running) {
        EventHotKeyID hotkeyID;
        hotkeyID.signature = 'SPLY';
        hotkeyID.id = static_cast<UInt32>(id);
        
        EventHotKeyRef hotkeyRef;
        UInt32 macKeyCode = ConvertKeyCode(keyCode);
        UInt32 macMods = ConvertModifiers(modifiers);
        
        OSStatus status = RegisterEventHotKey(macKeyCode, macMods, hotkeyID,
                                              GetApplicationEventTarget(), 0, &hotkeyRef);
        
        if (status == noErr) {
            impl_->hotkeyRefs[id] = hotkeyRef;
        } else {
            impl_->callbacks.erase(id);
            return -1;
        }
    }
    
    return id;
}

bool HotkeyManager::unregisterHotkey(int32_t id) {
    std::lock_guard<std::mutex> lock(impl_->mutex);
    
    auto it = impl_->callbacks.find(id);
    if (it == impl_->callbacks.end()) {
        return false;
    }
    
    auto refIt = impl_->hotkeyRefs.find(id);
    if (refIt != impl_->hotkeyRefs.end()) {
        UnregisterEventHotKey(refIt->second);
        impl_->hotkeyRefs.erase(refIt);
    }
    
    impl_->callbacks.erase(it);
    return true;
}

void HotkeyManager::unregisterAll() {
    std::lock_guard<std::mutex> lock(impl_->mutex);
    
    for (auto& pair : impl_->hotkeyRefs) {
        UnregisterEventHotKey(pair.second);
    }
    
    impl_->hotkeyRefs.clear();
    impl_->callbacks.clear();
}

bool HotkeyManager::start() {
    if (impl_->running) {
        return true;
    }
    
    EventTypeSpec eventType;
    eventType.eventClass = kEventClassKeyboard;
    eventType.eventKind = kEventHotKeyPressed;
    
    OSStatus status = InstallApplicationEventHandler(&Impl::HotkeyHandler, 1, &eventType,
                                                     nullptr, &impl_->eventHandler);
    
    if (status != noErr) {
        return false;
    }
    
    impl_->running = true;
    
    {
        std::lock_guard<std::mutex> lock(impl_->mutex);
        for (auto& pair : impl_->callbacks) {
            int32_t id = pair.first;
            
            EventHotKeyID hotkeyID;
            hotkeyID.signature = 'SPLY';
            hotkeyID.id = static_cast<UInt32>(id);
            
            EventHotKeyRef hotkeyRef;
            OSStatus regStatus = RegisterEventHotKey(0, 0, hotkeyID,
                                                     GetApplicationEventTarget(), 0, &hotkeyRef);
            
            if (regStatus == noErr) {
                impl_->hotkeyRefs[id] = hotkeyRef;
            }
        }
    }
    
    return true;
}

void HotkeyManager::stop() {
    if (!impl_->running) {
        return;
    }
    
    impl_->running = false;
    
    unregisterAll();
    
    if (impl_->eventHandler) {
        RemoveEventHandler(impl_->eventHandler);
        impl_->eventHandler = nullptr;
    }
}

bool HotkeyManager::isRunning() const {
    return impl_->running;
}

int RegisterGlobalHotkey(uint32_t modifiers, uint32_t keyCode, HotkeyCallback callback) {
    static int nextId = 1;
    int id = nextId++;
    
    EventHotKeyID hotkeyID;
    hotkeyID.signature = 'SPLY';
    hotkeyID.id = static_cast<UInt32>(id);
    
    EventHotKeyRef hotkeyRef;
    UInt32 macKeyCode = ConvertKeyCode(keyCode);
    UInt32 macMods = ConvertModifiers(modifiers);
    
    OSStatus status = RegisterEventHotKey(macKeyCode, macMods, hotkeyID,
                                          GetApplicationEventTarget(), 0, &hotkeyRef);
    
    return (status == noErr) ? id : -1;
}

bool UnregisterGlobalHotkey(int32_t id) {
    return false;
}

}

#endif

#ifdef _WIN32

#include "text_injector.h"
#include <windows.h>
#include <string>
#include <thread>
#include <chrono>

namespace speechly {

static std::wstring Utf8ToWide(const std::string& str) {
    if (str.empty()) return std::wstring();
    int size = MultiByteToWideChar(CP_UTF8, 0, str.c_str(), -1, nullptr, 0);
    std::wstring result(size - 1, 0);
    MultiByteToWideChar(CP_UTF8, 0, str.c_str(), -1, &result[0], size);
    return result;
}

static std::string WideToUtf8(const std::wstring& wstr) {
    if (wstr.empty()) return std::string();
    int size = WideCharToMultiByte(CP_UTF8, 0, wstr.c_str(), -1, nullptr, 0, nullptr, nullptr);
    std::string result(size - 1, 0);
    WideCharToMultiByte(CP_UTF8, 0, wstr.c_str(), -1, &result[0], size, nullptr, nullptr);
    return result;
}

class TextInjector::Impl {
public:
    std::wstring savedClipboard;
    bool clipboardSaved{false};
    
    bool saveClipboard() {
        if (!OpenClipboard(nullptr)) return false;
        
        HANDLE hData = GetClipboardData(CF_UNICODETEXT);
        if (hData) {
            wchar_t* pszText = static_cast<wchar_t*>(GlobalLock(hData));
            if (pszText) {
                savedClipboard = pszText;
                clipboardSaved = true;
                GlobalUnlock(hData);
            }
        }
        
        CloseClipboard();
        return clipboardSaved;
    }
    
    bool restoreClipboard() {
        if (!clipboardSaved) return false;
        
        if (!OpenClipboard(nullptr)) return false;
        EmptyClipboard();
        
        size_t size = (savedClipboard.size() + 1) * sizeof(wchar_t);
        HGLOBAL hMem = GlobalAlloc(GMEM_MOVEABLE, size);
        if (!hMem) {
            CloseClipboard();
            return false;
        }
        
        memcpy(GlobalLock(hMem), savedClipboard.c_str(), size);
        GlobalUnlock(hMem);
        SetClipboardData(CF_UNICODETEXT, hMem);
        CloseClipboard();
        
        clipboardSaved = false;
        return true;
    }
};

TextInjector::TextInjector() : impl_(new Impl()), typingDelay_(5) {}

TextInjector::~TextInjector() {
    delete impl_;
}

bool TextInjector::setClipboardText(const std::string& text) {
    std::wstring wtext = Utf8ToWide(text);
    
    if (!OpenClipboard(nullptr)) {
        return false;
    }
    
    EmptyClipboard();
    
    size_t size = (wtext.size() + 1) * sizeof(wchar_t);
    HGLOBAL hMem = GlobalAlloc(GMEM_MOVEABLE, size);
    if (!hMem) {
        CloseClipboard();
        return false;
    }
    
    memcpy(GlobalLock(hMem), wtext.c_str(), size);
    GlobalUnlock(hMem);
    SetClipboardData(CF_UNICODETEXT, hMem);
    CloseClipboard();
    
    return true;
}

std::string TextInjector::getClipboardText() {
    std::string result;
    
    if (!OpenClipboard(nullptr)) {
        return result;
    }
    
    HANDLE hData = GetClipboardData(CF_UNICODETEXT);
    if (hData) {
        wchar_t* pszText = static_cast<wchar_t*>(GlobalLock(hData));
        if (pszText) {
            result = WideToUtf8(std::wstring(pszText));
            GlobalUnlock(hData);
        }
    }
    
    CloseClipboard();
    return result;
}

InjectionResult TextInjector::injectText(const std::string& text, InjectionMethod method) {
    if (text.empty()) {
        return {true, ""};
    }
    
    if (method == InjectionMethod::Direct) {
        bool success = InjectTextDirect(text);
        return {success, success ? "" : "Failed to inject text directly"};
    }
    
    bool success = InjectTextViaClipboard(text);
    return {success, success ? "" : "Failed to inject text via clipboard"};
}

InjectionResult TextInjector::injectTextWithDelay(const std::string& text, uint32_t delayMs) {
    std::this_thread::sleep_for(std::chrono::milliseconds(delayMs));
    return injectText(text, InjectionMethod::Clipboard);
}

InjectionResult TextInjector::pasteFromClipboard() {
    INPUT inputs[4] = {};
    
    inputs[0].type = INPUT_KEYBOARD;
    inputs[0].ki.wVk = VK_CONTROL;
    
    inputs[1].type = INPUT_KEYBOARD;
    inputs[1].ki.wVk = 'V';
    
    inputs[2].type = INPUT_KEYBOARD;
    inputs[2].ki.wVk = 'V';
    inputs[2].ki.dwFlags = KEYEVENTF_KEYUP;
    
    inputs[3].type = INPUT_KEYBOARD;
    inputs[3].ki.wVk = VK_CONTROL;
    inputs[3].ki.dwFlags = KEYEVENTF_KEYUP;
    
    UINT sent = SendInput(4, inputs, sizeof(INPUT));
    
    return {sent == 4, sent == 4 ? "" : "Failed to send paste command"};
}

void TextInjector::setTypingDelay(uint32_t delayMs) {
    typingDelay_ = delayMs;
}

uint32_t TextInjector::getTypingDelay() const {
    return typingDelay_;
}

bool InjectTextViaClipboard(const std::string& text) {
    std::wstring wtext = Utf8ToWide(text);
    
    if (!OpenClipboard(nullptr)) {
        return false;
    }
    
    EmptyClipboard();
    
    size_t size = (wtext.size() + 1) * sizeof(wchar_t);
    HGLOBAL hMem = GlobalAlloc(GMEM_MOVEABLE, size);
    if (!hMem) {
        CloseClipboard();
        return false;
    }
    
    memcpy(GlobalLock(hMem), wtext.c_str(), size);
    GlobalUnlock(hMem);
    SetClipboardData(CF_UNICODETEXT, hMem);
    CloseClipboard();
    
    INPUT inputs[4] = {};
    
    inputs[0].type = INPUT_KEYBOARD;
    inputs[0].ki.wVk = VK_CONTROL;
    
    inputs[1].type = INPUT_KEYBOARD;
    inputs[1].ki.wVk = 'V';
    
    inputs[2].type = INPUT_KEYBOARD;
    inputs[2].ki.wVk = 'V';
    inputs[2].ki.dwFlags = KEYEVENTF_KEYUP;
    
    inputs[3].type = INPUT_KEYBOARD;
    inputs[3].ki.wVk = VK_CONTROL;
    inputs[3].ki.dwFlags = KEYEVENTF_KEYUP;
    
    return SendInput(4, inputs, sizeof(INPUT)) == 4;
}

bool InjectTextDirect(const std::string& text) {
    std::wstring wtext = Utf8ToWide(text);
    
    for (wchar_t c : wtext) {
        INPUT inputs[2] = {};
        
        inputs[0].type = INPUT_KEYBOARD;
        inputs[0].ki.wScan = c;
        inputs[0].ki.dwFlags = KEYEVENTF_UNICODE;
        
        inputs[1].type = INPUT_KEYBOARD;
        inputs[1].ki.wScan = c;
        inputs[1].ki.dwFlags = KEYEVENTF_UNICODE | KEYEVENTF_KEYUP;
        
        if (SendInput(2, inputs, sizeof(INPUT)) != 2) {
            return false;
        }
        
        Sleep(5);
    }
    
    return true;
}

}

#endif

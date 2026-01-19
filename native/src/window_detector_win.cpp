#ifdef _WIN32

#include "window_detector.h"
#include <windows.h>
#include <psapi.h>
#include <string>
#include <thread>
#include <atomic>
#include <mutex>

namespace speechly {

static std::string WideToUtf8(const std::wstring& wstr) {
    if (wstr.empty()) return std::string();
    int size = WideCharToMultiByte(CP_UTF8, 0, wstr.c_str(), -1, nullptr, 0, nullptr, nullptr);
    std::string result(size - 1, 0);
    WideCharToMultiByte(CP_UTF8, 0, wstr.c_str(), -1, &result[0], size, nullptr, nullptr);
    return result;
}

class WindowDetector::Impl {
public:
    std::atomic<bool> isWatching{false};
    std::thread watcherThread;
    WindowChangeCallback callback;
    HWND lastActiveWindow{nullptr};
    std::mutex mutex;
    HWINEVENTHOOK hook{nullptr};
    
    static Impl* instance;
    
    static void CALLBACK WinEventProc(
        HWINEVENTHOOK hWinEventHook,
        DWORD event,
        HWND hwnd,
        LONG idObject,
        LONG idChild,
        DWORD dwEventThread,
        DWORD dwmsEventTime
    ) {
        if (instance && instance->isWatching && event == EVENT_SYSTEM_FOREGROUND) {
            ActiveWindowInfo info = GetActiveWindowInfo();
            if (instance->callback) {
                instance->callback(info);
            }
        }
    }
};

WindowDetector::Impl* WindowDetector::Impl::instance = nullptr;

WindowDetector::WindowDetector() : impl_(new Impl()) {
    impl_->instance = impl_;
}

WindowDetector::~WindowDetector() {
    stopWatching();
    if (impl_->instance == impl_) {
        impl_->instance = nullptr;
    }
    delete impl_;
}

ActiveWindowInfo WindowDetector::getActiveWindow() {
    return GetActiveWindowInfo();
}

bool WindowDetector::startWatching(WindowChangeCallback callback) {
    if (impl_->isWatching) {
        return false;
    }
    
    impl_->callback = callback;
    impl_->isWatching = true;
    
    impl_->watcherThread = std::thread([this]() {
        impl_->hook = SetWinEventHook(
            EVENT_SYSTEM_FOREGROUND,
            EVENT_SYSTEM_FOREGROUND,
            nullptr,
            Impl::WinEventProc,
            0,
            0,
            WINEVENT_OUTOFCONTEXT | WINEVENT_SKIPOWNPROCESS
        );
        
        if (!impl_->hook) {
            impl_->isWatching = false;
            return;
        }
        
        MSG msg;
        while (impl_->isWatching && GetMessage(&msg, nullptr, 0, 0)) {
            TranslateMessage(&msg);
            DispatchMessage(&msg);
        }
        
        if (impl_->hook) {
            UnhookWinEvent(impl_->hook);
            impl_->hook = nullptr;
        }
    });
    
    return true;
}

void WindowDetector::stopWatching() {
    if (!impl_->isWatching) {
        return;
    }
    
    impl_->isWatching = false;
    
    if (impl_->hook) {
        PostThreadMessage(GetThreadId(impl_->watcherThread.native_handle()), WM_QUIT, 0, 0);
    }
    
    if (impl_->watcherThread.joinable()) {
        impl_->watcherThread.join();
    }
}

bool WindowDetector::isWatching() const {
    return impl_->isWatching;
}

ActiveWindowInfo GetActiveWindowInfo() {
    ActiveWindowInfo info;
    info.isValid = false;
    
    HWND hwnd = GetForegroundWindow();
    if (!hwnd) {
        return info;
    }
    
    wchar_t title[512];
    int titleLen = GetWindowTextW(hwnd, title, 512);
    if (titleLen > 0) {
        info.title = WideToUtf8(std::wstring(title, titleLen));
    }
    
    DWORD pid;
    GetWindowThreadProcessId(hwnd, &pid);
    info.pid = static_cast<int64_t>(pid);
    
    HANDLE hProcess = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, FALSE, pid);
    if (hProcess) {
        wchar_t exePath[MAX_PATH];
        DWORD size = MAX_PATH;
        if (QueryFullProcessImageNameW(hProcess, 0, exePath, &size)) {
            std::wstring path(exePath);
            info.executablePath = WideToUtf8(path);
            
            size_t pos = path.find_last_of(L"\\/");
            if (pos != std::wstring::npos) {
                std::wstring name = path.substr(pos + 1);
                size_t extPos = name.find_last_of(L'.');
                if (extPos != std::wstring::npos) {
                    name = name.substr(0, extPos);
                }
                info.processName = WideToUtf8(name);
            }
        }
        CloseHandle(hProcess);
    }
    
    info.isValid = true;
    return info;
}

}

#endif

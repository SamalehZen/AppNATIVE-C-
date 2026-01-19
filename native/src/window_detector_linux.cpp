#ifdef __linux__

#include "window_detector.h"
#include <X11/Xlib.h>
#include <X11/Xatom.h>
#include <X11/Xutil.h>
#include <cstring>
#include <fstream>
#include <sstream>
#include <thread>
#include <atomic>
#include <unistd.h>

namespace speechly {

class WindowDetector::Impl {
public:
    std::atomic<bool> isWatching{false};
    std::thread watcherThread;
    WindowChangeCallback callback;
    Display* display{nullptr};
    Window lastActiveWindow{0};
};

WindowDetector::WindowDetector() : impl_(new Impl()) {
    impl_->display = XOpenDisplay(nullptr);
}

WindowDetector::~WindowDetector() {
    stopWatching();
    if (impl_->display) {
        XCloseDisplay(impl_->display);
    }
    delete impl_;
}

static std::string GetWindowName(Display* display, Window window) {
    if (!display || !window) return "";
    
    Atom netWmName = XInternAtom(display, "_NET_WM_NAME", True);
    Atom utf8String = XInternAtom(display, "UTF8_STRING", True);
    
    if (netWmName != None) {
        Atom actualType;
        int actualFormat;
        unsigned long nItems, bytesAfter;
        unsigned char* prop = nullptr;
        
        if (XGetWindowProperty(display, window, netWmName, 0, 1024, False,
                              utf8String, &actualType, &actualFormat, &nItems,
                              &bytesAfter, &prop) == Success && prop) {
            std::string name(reinterpret_cast<char*>(prop));
            XFree(prop);
            return name;
        }
    }
    
    char* wmName = nullptr;
    if (XFetchName(display, window, &wmName) && wmName) {
        std::string name(wmName);
        XFree(wmName);
        return name;
    }
    
    return "";
}

static pid_t GetWindowPid(Display* display, Window window) {
    if (!display || !window) return 0;
    
    Atom pidAtom = XInternAtom(display, "_NET_WM_PID", True);
    if (pidAtom == None) return 0;
    
    Atom actualType;
    int actualFormat;
    unsigned long nItems, bytesAfter;
    unsigned char* prop = nullptr;
    
    if (XGetWindowProperty(display, window, pidAtom, 0, 1, False,
                          XA_CARDINAL, &actualType, &actualFormat, &nItems,
                          &bytesAfter, &prop) == Success && prop) {
        pid_t pid = *reinterpret_cast<pid_t*>(prop);
        XFree(prop);
        return pid;
    }
    
    return 0;
}

static std::string GetProcessName(pid_t pid) {
    if (pid <= 0) return "";
    
    std::string commPath = "/proc/" + std::to_string(pid) + "/comm";
    std::ifstream commFile(commPath);
    if (commFile.is_open()) {
        std::string name;
        std::getline(commFile, name);
        return name;
    }
    
    return "";
}

static std::string GetExecutablePath(pid_t pid) {
    if (pid <= 0) return "";
    
    std::string exePath = "/proc/" + std::to_string(pid) + "/exe";
    char buffer[4096];
    ssize_t len = readlink(exePath.c_str(), buffer, sizeof(buffer) - 1);
    if (len > 0) {
        buffer[len] = '\0';
        return std::string(buffer);
    }
    
    return "";
}

static Window GetActiveWindow(Display* display) {
    if (!display) return 0;
    
    Window root = DefaultRootWindow(display);
    Atom activeWindowAtom = XInternAtom(display, "_NET_ACTIVE_WINDOW", True);
    
    if (activeWindowAtom == None) return 0;
    
    Atom actualType;
    int actualFormat;
    unsigned long nItems, bytesAfter;
    unsigned char* prop = nullptr;
    
    if (XGetWindowProperty(display, root, activeWindowAtom, 0, 1, False,
                          XA_WINDOW, &actualType, &actualFormat, &nItems,
                          &bytesAfter, &prop) == Success && prop) {
        Window window = *reinterpret_cast<Window*>(prop);
        XFree(prop);
        return window;
    }
    
    return 0;
}

ActiveWindowInfo WindowDetector::getActiveWindow() {
    return GetActiveWindowInfo();
}

bool WindowDetector::startWatching(WindowChangeCallback callback) {
    if (impl_->isWatching || !impl_->display) {
        return false;
    }
    
    impl_->callback = callback;
    impl_->isWatching = true;
    
    impl_->watcherThread = std::thread([this]() {
        Display* display = XOpenDisplay(nullptr);
        if (!display) {
            impl_->isWatching = false;
            return;
        }
        
        Window root = DefaultRootWindow(display);
        XSelectInput(display, root, PropertyChangeMask);
        
        Atom activeWindowAtom = XInternAtom(display, "_NET_ACTIVE_WINDOW", True);
        Window lastWindow = 0;
        
        while (impl_->isWatching) {
            while (XPending(display) > 0) {
                XEvent event;
                XNextEvent(display, &event);
                
                if (event.type == PropertyNotify) {
                    XPropertyEvent* propEvent = &event.xproperty;
                    if (propEvent->atom == activeWindowAtom) {
                        Window currentWindow = GetActiveWindow(display);
                        if (currentWindow != lastWindow) {
                            lastWindow = currentWindow;
                            if (impl_->callback) {
                                ActiveWindowInfo info = GetActiveWindowInfo();
                                impl_->callback(info);
                            }
                        }
                    }
                }
            }
            
            usleep(50000);
        }
        
        XCloseDisplay(display);
    });
    
    return true;
}

void WindowDetector::stopWatching() {
    if (!impl_->isWatching) {
        return;
    }
    
    impl_->isWatching = false;
    
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
    
    Display* display = XOpenDisplay(nullptr);
    if (!display) {
        return info;
    }
    
    Window activeWindow = GetActiveWindow(display);
    if (!activeWindow) {
        XCloseDisplay(display);
        return info;
    }
    
    info.title = GetWindowName(display, activeWindow);
    info.pid = static_cast<int64_t>(GetWindowPid(display, activeWindow));
    
    if (info.pid > 0) {
        info.processName = GetProcessName(static_cast<pid_t>(info.pid));
        info.executablePath = GetExecutablePath(static_cast<pid_t>(info.pid));
    }
    
    info.isValid = true;
    
    XCloseDisplay(display);
    return info;
}

}

#endif

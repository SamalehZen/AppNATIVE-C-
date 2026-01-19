#ifdef __APPLE__

#include "window_detector.h"
#import <Cocoa/Cocoa.h>
#import <AppKit/AppKit.h>
#import <ApplicationServices/ApplicationServices.h>
#include <thread>
#include <atomic>

namespace speechly {

class WindowDetector::Impl {
public:
    std::atomic<bool> isWatching{false};
    WindowChangeCallback callback;
    id observer{nil};
    NSRunningApplication* lastApp{nil};
};

WindowDetector::WindowDetector() : impl_(new Impl()) {}

WindowDetector::~WindowDetector() {
    stopWatching();
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
    
    NSNotificationCenter* center = [[NSWorkspace sharedWorkspace] notificationCenter];
    
    impl_->observer = [center addObserverForName:NSWorkspaceDidActivateApplicationNotification
                                          object:nil
                                           queue:[NSOperationQueue mainQueue]
                                      usingBlock:^(NSNotification* notification) {
        if (impl_->callback && impl_->isWatching) {
            ActiveWindowInfo info = GetActiveWindowInfo();
            impl_->callback(info);
        }
    }];
    
    return true;
}

void WindowDetector::stopWatching() {
    if (!impl_->isWatching) {
        return;
    }
    
    impl_->isWatching = false;
    
    if (impl_->observer) {
        NSNotificationCenter* center = [[NSWorkspace sharedWorkspace] notificationCenter];
        [center removeObserver:impl_->observer];
        impl_->observer = nil;
    }
}

bool WindowDetector::isWatching() const {
    return impl_->isWatching;
}

ActiveWindowInfo GetActiveWindowInfo() {
    ActiveWindowInfo info;
    info.isValid = false;
    
    @autoreleasepool {
        NSRunningApplication* frontApp = [[NSWorkspace sharedWorkspace] frontmostApplication];
        if (!frontApp) {
            return info;
        }
        
        if (frontApp.localizedName) {
            info.processName = [frontApp.localizedName UTF8String];
        }
        
        if (frontApp.bundleIdentifier) {
            info.bundleId = [frontApp.bundleIdentifier UTF8String];
        }
        
        if (frontApp.executableURL) {
            info.executablePath = [frontApp.executableURL.path UTF8String];
        }
        
        info.pid = static_cast<int64_t>(frontApp.processIdentifier);
        
        AXUIElementRef appElement = AXUIElementCreateApplication(frontApp.processIdentifier);
        if (appElement) {
            AXUIElementRef focusedWindow = NULL;
            AXError error = AXUIElementCopyAttributeValue(appElement, kAXFocusedWindowAttribute, (CFTypeRef*)&focusedWindow);
            
            if (error == kAXErrorSuccess && focusedWindow) {
                CFStringRef windowTitle = NULL;
                error = AXUIElementCopyAttributeValue(focusedWindow, kAXTitleAttribute, (CFTypeRef*)&windowTitle);
                
                if (error == kAXErrorSuccess && windowTitle) {
                    NSString* title = (__bridge NSString*)windowTitle;
                    info.title = [title UTF8String];
                    CFRelease(windowTitle);
                }
                CFRelease(focusedWindow);
            }
            CFRelease(appElement);
        }
        
        if (info.title.empty() && frontApp.localizedName) {
            info.title = [frontApp.localizedName UTF8String];
        }
        
        info.isValid = true;
    }
    
    return info;
}

}

#endif

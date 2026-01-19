#ifdef __APPLE__

#include "text_injector.h"
#import <Cocoa/Cocoa.h>
#import <Carbon/Carbon.h>
#include <thread>
#include <chrono>

namespace speechly {

class TextInjector::Impl {
public:
    NSString* savedClipboard{nil};
    bool clipboardSaved{false};
    
    void saveClipboard() {
        @autoreleasepool {
            NSPasteboard* pasteboard = [NSPasteboard generalPasteboard];
            NSString* content = [pasteboard stringForType:NSPasteboardTypeString];
            if (content) {
                savedClipboard = [content copy];
                clipboardSaved = true;
            }
        }
    }
    
    void restoreClipboard() {
        if (!clipboardSaved || !savedClipboard) return;
        
        @autoreleasepool {
            NSPasteboard* pasteboard = [NSPasteboard generalPasteboard];
            [pasteboard clearContents];
            [pasteboard setString:savedClipboard forType:NSPasteboardTypeString];
            savedClipboard = nil;
            clipboardSaved = false;
        }
    }
};

TextInjector::TextInjector() : impl_(new Impl()), typingDelay_(5) {}

TextInjector::~TextInjector() {
    delete impl_;
}

bool TextInjector::setClipboardText(const std::string& text) {
    @autoreleasepool {
        NSPasteboard* pasteboard = [NSPasteboard generalPasteboard];
        [pasteboard clearContents];
        NSString* nsText = [NSString stringWithUTF8String:text.c_str()];
        return [pasteboard setString:nsText forType:NSPasteboardTypeString];
    }
}

std::string TextInjector::getClipboardText() {
    @autoreleasepool {
        NSPasteboard* pasteboard = [NSPasteboard generalPasteboard];
        NSString* content = [pasteboard stringForType:NSPasteboardTypeString];
        if (content) {
            return [content UTF8String];
        }
        return "";
    }
}

static void SimulatePaste() {
    CGEventSourceRef source = CGEventSourceCreate(kCGEventSourceStateHIDSystemState);
    if (!source) return;
    
    CGEventRef cmdDown = CGEventCreateKeyboardEvent(source, kVK_Command, true);
    CGEventRef vDown = CGEventCreateKeyboardEvent(source, kVK_ANSI_V, true);
    CGEventRef vUp = CGEventCreateKeyboardEvent(source, kVK_ANSI_V, false);
    CGEventRef cmdUp = CGEventCreateKeyboardEvent(source, kVK_Command, false);
    
    CGEventSetFlags(vDown, kCGEventFlagMaskCommand);
    CGEventSetFlags(vUp, kCGEventFlagMaskCommand);
    
    CGEventPost(kCGHIDEventTap, cmdDown);
    CGEventPost(kCGHIDEventTap, vDown);
    CGEventPost(kCGHIDEventTap, vUp);
    CGEventPost(kCGHIDEventTap, cmdUp);
    
    CFRelease(cmdDown);
    CFRelease(vDown);
    CFRelease(vUp);
    CFRelease(cmdUp);
    CFRelease(source);
}

static void TypeCharacter(UniChar character) {
    CGEventSourceRef source = CGEventSourceCreate(kCGEventSourceStateHIDSystemState);
    if (!source) return;
    
    CGEventRef keyDown = CGEventCreateKeyboardEvent(source, 0, true);
    CGEventRef keyUp = CGEventCreateKeyboardEvent(source, 0, false);
    
    CGEventKeyboardSetUnicodeString(keyDown, 1, &character);
    CGEventKeyboardSetUnicodeString(keyUp, 1, &character);
    
    CGEventPost(kCGHIDEventTap, keyDown);
    CGEventPost(kCGHIDEventTap, keyUp);
    
    CFRelease(keyDown);
    CFRelease(keyUp);
    CFRelease(source);
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
    SimulatePaste();
    return {true, ""};
}

void TextInjector::setTypingDelay(uint32_t delayMs) {
    typingDelay_ = delayMs;
}

uint32_t TextInjector::getTypingDelay() const {
    return typingDelay_;
}

bool InjectTextViaClipboard(const std::string& text) {
    @autoreleasepool {
        NSPasteboard* pasteboard = [NSPasteboard generalPasteboard];
        [pasteboard clearContents];
        NSString* nsText = [NSString stringWithUTF8String:text.c_str()];
        if (![pasteboard setString:nsText forType:NSPasteboardTypeString]) {
            return false;
        }
        
        SimulatePaste();
        return true;
    }
}

bool InjectTextDirect(const std::string& text) {
    @autoreleasepool {
        NSString* nsText = [NSString stringWithUTF8String:text.c_str()];
        
        for (NSUInteger i = 0; i < [nsText length]; i++) {
            UniChar c = [nsText characterAtIndex:i];
            TypeCharacter(c);
            usleep(5000);
        }
        
        return true;
    }
}

}

#endif

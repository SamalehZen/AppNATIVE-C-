#ifdef __linux__

#include "text_injector.h"
#include <X11/Xlib.h>
#include <X11/Xatom.h>
#include <X11/extensions/XTest.h>
#include <X11/keysym.h>
#include <cstring>
#include <thread>
#include <chrono>
#include <cstdlib>

namespace speechly {

class TextInjector::Impl {
public:
    Display* display{nullptr};
    std::string savedClipboard;
    bool clipboardSaved{false};
    
    Impl() {
        display = XOpenDisplay(nullptr);
    }
    
    ~Impl() {
        if (display) {
            XCloseDisplay(display);
        }
    }
};

TextInjector::TextInjector() : impl_(new Impl()), typingDelay_(5) {}

TextInjector::~TextInjector() {
    delete impl_;
}

bool TextInjector::setClipboardText(const std::string& text) {
    if (!impl_->display) return false;
    
    FILE* pipe = popen("xclip -selection clipboard", "w");
    if (!pipe) {
        pipe = popen("xsel --clipboard --input", "w");
    }
    
    if (!pipe) return false;
    
    fwrite(text.c_str(), 1, text.size(), pipe);
    int result = pclose(pipe);
    
    return result == 0;
}

std::string TextInjector::getClipboardText() {
    FILE* pipe = popen("xclip -selection clipboard -o 2>/dev/null || xsel --clipboard --output 2>/dev/null", "r");
    if (!pipe) return "";
    
    std::string result;
    char buffer[256];
    while (fgets(buffer, sizeof(buffer), pipe)) {
        result += buffer;
    }
    
    pclose(pipe);
    return result;
}

static void SimulatePaste(Display* display) {
    if (!display) return;
    
    KeyCode ctrlKey = XKeysymToKeycode(display, XK_Control_L);
    KeyCode vKey = XKeysymToKeycode(display, XK_v);
    
    XTestFakeKeyEvent(display, ctrlKey, True, CurrentTime);
    XTestFakeKeyEvent(display, vKey, True, CurrentTime);
    XTestFakeKeyEvent(display, vKey, False, CurrentTime);
    XTestFakeKeyEvent(display, ctrlKey, False, CurrentTime);
    
    XFlush(display);
}

static void TypeCharacter(Display* display, const char* utf8Char) {
    if (!display) return;
    
    KeySym keysym = XStringToKeysym(utf8Char);
    if (keysym == NoSymbol) {
        return;
    }
    
    KeyCode keycode = XKeysymToKeycode(display, keysym);
    if (keycode == 0) {
        return;
    }
    
    int index = 0;
    KeySym lower, upper;
    XConvertCase(keysym, &lower, &upper);
    bool needShift = (keysym == upper && lower != upper);
    
    if (needShift) {
        KeyCode shiftKey = XKeysymToKeycode(display, XK_Shift_L);
        XTestFakeKeyEvent(display, shiftKey, True, CurrentTime);
    }
    
    XTestFakeKeyEvent(display, keycode, True, CurrentTime);
    XTestFakeKeyEvent(display, keycode, False, CurrentTime);
    
    if (needShift) {
        KeyCode shiftKey = XKeysymToKeycode(display, XK_Shift_L);
        XTestFakeKeyEvent(display, shiftKey, False, CurrentTime);
    }
    
    XFlush(display);
}

InjectionResult TextInjector::injectText(const std::string& text, InjectionMethod method) {
    if (text.empty()) {
        return {true, ""};
    }
    
    if (!impl_->display) {
        return {false, "No display connection"};
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
    if (!impl_->display) {
        return {false, "No display connection"};
    }
    
    SimulatePaste(impl_->display);
    return {true, ""};
}

void TextInjector::setTypingDelay(uint32_t delayMs) {
    typingDelay_ = delayMs;
}

uint32_t TextInjector::getTypingDelay() const {
    return typingDelay_;
}

bool InjectTextViaClipboard(const std::string& text) {
    FILE* pipe = popen("xclip -selection clipboard", "w");
    if (!pipe) {
        pipe = popen("xsel --clipboard --input", "w");
    }
    
    if (!pipe) return false;
    
    fwrite(text.c_str(), 1, text.size(), pipe);
    if (pclose(pipe) != 0) {
        return false;
    }
    
    Display* display = XOpenDisplay(nullptr);
    if (!display) return false;
    
    SimulatePaste(display);
    
    XCloseDisplay(display);
    return true;
}

bool InjectTextDirect(const std::string& text) {
    Display* display = XOpenDisplay(nullptr);
    if (!display) return false;
    
    for (size_t i = 0; i < text.size(); i++) {
        char c[2] = {text[i], '\0'};
        TypeCharacter(display, c);
        usleep(5000);
    }
    
    XCloseDisplay(display);
    return true;
}

}

#endif

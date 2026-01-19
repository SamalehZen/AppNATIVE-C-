#include "text_injector.h"

namespace speechly {

#if defined(_WIN32)
#elif defined(__APPLE__)
#elif defined(__linux__)
#else

class TextInjector::Impl {
public:
};

TextInjector::TextInjector() : impl_(new Impl()), typingDelay_(5) {}
TextInjector::~TextInjector() { delete impl_; }

InjectionResult TextInjector::injectText(const std::string& text, InjectionMethod method) {
    return {false, "Platform not supported"};
}

InjectionResult TextInjector::injectTextWithDelay(const std::string& text, uint32_t delayMs) {
    return {false, "Platform not supported"};
}

InjectionResult TextInjector::pasteFromClipboard() {
    return {false, "Platform not supported"};
}

bool TextInjector::setClipboardText(const std::string& text) {
    return false;
}

std::string TextInjector::getClipboardText() {
    return "";
}

void TextInjector::setTypingDelay(uint32_t delayMs) {
    typingDelay_ = delayMs;
}

uint32_t TextInjector::getTypingDelay() const {
    return typingDelay_;
}

bool InjectTextViaClipboard(const std::string& text) {
    return false;
}

bool InjectTextDirect(const std::string& text) {
    return false;
}

#endif

}

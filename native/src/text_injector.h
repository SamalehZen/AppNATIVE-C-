#ifndef TEXT_INJECTOR_H
#define TEXT_INJECTOR_H

#include <string>
#include <cstdint>

namespace speechly {

enum class InjectionMethod {
    Clipboard,
    Direct,
    Auto
};

struct InjectionResult {
    bool success;
    std::string error;
};

class TextInjector {
public:
    TextInjector();
    ~TextInjector();

    InjectionResult injectText(const std::string& text, InjectionMethod method = InjectionMethod::Auto);
    InjectionResult injectTextWithDelay(const std::string& text, uint32_t delayMs);
    InjectionResult pasteFromClipboard();
    
    bool setClipboardText(const std::string& text);
    std::string getClipboardText();
    
    void setTypingDelay(uint32_t delayMs);
    uint32_t getTypingDelay() const;

private:
    class Impl;
    Impl* impl_;
    uint32_t typingDelay_;
};

bool InjectTextViaClipboard(const std::string& text);
bool InjectTextDirect(const std::string& text);

}

#endif

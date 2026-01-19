#include "window_detector.h"

namespace speechly {

#if defined(_WIN32)
#elif defined(__APPLE__)
#elif defined(__linux__)
#else

class WindowDetector::Impl {
public:
    bool isWatching = false;
};

WindowDetector::WindowDetector() : impl_(new Impl()) {}
WindowDetector::~WindowDetector() { delete impl_; }

ActiveWindowInfo WindowDetector::getActiveWindow() {
    ActiveWindowInfo info;
    info.isValid = false;
    return info;
}

bool WindowDetector::startWatching(WindowChangeCallback callback) {
    return false;
}

void WindowDetector::stopWatching() {}

bool WindowDetector::isWatching() const {
    return impl_->isWatching;
}

ActiveWindowInfo GetActiveWindowInfo() {
    ActiveWindowInfo info;
    info.isValid = false;
    return info;
}

#endif

}

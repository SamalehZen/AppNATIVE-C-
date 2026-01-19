#ifndef WINDOW_DETECTOR_H
#define WINDOW_DETECTOR_H

#include <string>
#include <functional>
#include <cstdint>

namespace speechly {

struct ActiveWindowInfo {
    std::string title;
    std::string processName;
    std::string bundleId;
    std::string executablePath;
    int64_t pid;
    bool isValid;

    ActiveWindowInfo() : pid(0), isValid(false) {}
};

using WindowChangeCallback = std::function<void(const ActiveWindowInfo&)>;

class WindowDetector {
public:
    WindowDetector();
    ~WindowDetector();

    ActiveWindowInfo getActiveWindow();
    bool startWatching(WindowChangeCallback callback);
    void stopWatching();
    bool isWatching() const;

private:
    class Impl;
    Impl* impl_;
};

ActiveWindowInfo GetActiveWindowInfo();

}

#endif

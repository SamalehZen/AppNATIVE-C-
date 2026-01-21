# Speechly Clone - Native C++ Modules

Native C++ modules for Electron applications that provide system-wide text injection, active window detection, and global hotkey management. Cross-platform support for Windows, macOS, and Linux.

## 🚀 Quick Start - Déploiement Production

```bash
cd speechly-clone
npm install
npm run icons      # Génère les icônes
npm run make       # Build les installeurs
```

**Voir le guide complet:** [DEPLOYMENT.md](./DEPLOYMENT.md)

**GitHub Actions:** Push un tag `v1.0.0` pour créer une release automatique avec tous les installeurs.

---

## Features

- **Window Detection**: Detect the currently active window (title, process name, PID, executable path)
- **Text Injection**: Inject text into any application via clipboard or direct input simulation
- **Global Hotkeys**: Register system-wide hotkeys that work even when the app is not focused
- **Cross-Platform**: Full support for Windows, macOS, and Linux

## Architecture

```
speechly-clone/
├── native/
│   ├── binding.gyp                    # node-gyp configuration
│   ├── index.d.ts                     # TypeScript declarations
│   └── src/
│       ├── addon.cpp                  # N-API entry point
│       ├── window_detector.h          # Window detector interface
│       ├── window_detector_win.cpp    # Windows implementation
│       ├── window_detector_mac.mm     # macOS implementation
│       ├── window_detector_linux.cpp  # Linux implementation
│       ├── text_injector.h            # Text injector interface
│       ├── text_injector_win.cpp      # Windows implementation
│       ├── text_injector_mac.mm       # macOS implementation
│       ├── text_injector_linux.cpp    # Linux implementation
│       ├── hotkey_manager.h           # Hotkey manager interface
│       ├── hotkey_manager_win.cpp     # Windows implementation
│       ├── hotkey_manager_mac.mm      # macOS implementation
│       └── hotkey_manager_linux.cpp   # Linux implementation
├── src/
│   └── main/
│       ├── index.ts                   # Electron main process entry
│       ├── native-bridge.ts           # TypeScript wrapper for native module
│       ├── ipc-handlers.ts            # IPC handlers for renderer communication
│       ├── permissions.ts             # macOS permission handling
│       └── preload.ts                 # Electron preload script
├── package.json
└── tsconfig.json
```

## Prerequisites

### All Platforms
- Node.js 18+ 
- npm or yarn
- Python 3.x (for node-gyp)

### Windows
- Visual Studio Build Tools 2019 or later
- Windows SDK

```bash
npm install --global windows-build-tools
```

### macOS
- Xcode Command Line Tools
- Xcode (for Objective-C++ support)

```bash
xcode-select --install
```

### Linux
- GCC/G++ 9+
- X11 development libraries
- XTest extension

```bash
# Ubuntu/Debian
sudo apt-get install build-essential libx11-dev libxtst-dev

# Fedora
sudo dnf install gcc-c++ libX11-devel libXtst-devel

# Arch Linux
sudo pacman -S base-devel libx11 libxtst
```

## Installation

```bash
# Clone the repository
git clone https://github.com/SamalehZen/AppNATIVE-C-.git
cd AppNATIVE-C-

# Install dependencies
npm install

# Build the native module
npm run build:native

# Build TypeScript
npm run build:ts
```

## Usage

### TypeScript/JavaScript API

```typescript
import {
  getActiveWindow,
  injectText,
  registerHotkey,
  WindowDetector,
  TextInjector,
  HotkeyManager,
} from './main/native-bridge';

// Get active window information
const windowInfo = getActiveWindow();
console.log('Active window:', windowInfo?.title);
console.log('Process:', windowInfo?.processName);

// Watch for window changes
const detector = new WindowDetector();
detector.onActiveWindowChange((info) => {
  console.log('Window changed to:', info.title);
});

// Inject text into the active application
const result = injectText('Hello, World!');
if (result.success) {
  console.log('Text injected successfully');
}

// Register a global hotkey
const hotkeyManager = new HotkeyManager();
const id = hotkeyManager.register('CommandOrControl+Shift+Space', () => {
  console.log('Hotkey pressed!');
});

// Cleanup
detector.stopWatching();
hotkeyManager.unregisterAll();
```

### Electron Integration

```typescript
// In main process (index.ts)
import { app, BrowserWindow } from 'electron';
import { initializeIpcHandlers, setMainWindow } from './ipc-handlers';

app.whenReady().then(() => {
  const mainWindow = new BrowserWindow({...});
  setMainWindow(mainWindow);
  initializeIpcHandlers();
});

// In renderer process (via preload)
window.speechlyNative.getActiveWindow().then((info) => {
  console.log('Active window:', info);
});

window.speechlyNative.injectText('Hello!').then((result) => {
  if (result.success) {
    console.log('Text injected');
  }
});

window.speechlyNative.onToggleDictation(() => {
  // Handle dictation toggle
});
```

## API Reference

### Window Detection

```typescript
interface ActiveWindowInfo {
  title: string;           // Window title
  processName: string;     // Process name (e.g., "chrome", "outlook")
  bundleId: string;        // macOS bundle ID (e.g., "com.microsoft.Outlook")
  executablePath: string;  // Full path to executable
  pid: number;             // Process ID
  isValid: boolean;        // Whether the info is valid
}

// Get current active window
getActiveWindow(): ActiveWindowInfo | null;

// Watch for window changes
startWindowWatcher(callback: (info: ActiveWindowInfo) => void): boolean;
stopWindowWatcher(): void;
```

### Text Injection

```typescript
interface InjectionResult {
  success: boolean;
  error: string;
}

type InjectionMethod = 'clipboard' | 'direct' | 'auto';

// Inject text (default: clipboard method)
injectText(text: string, method?: InjectionMethod): InjectionResult;

// Inject with delay
injectTextWithDelay(text: string, delayMs: number): InjectionResult;

// Just paste from clipboard
pasteFromClipboard(): InjectionResult;

// Clipboard operations
setClipboardText(text: string): boolean;
getClipboardText(): string;
```

### Hotkey Management

```typescript
// Register a hotkey with accelerator string
registerHotkey(accelerator: string, callback: () => void): number;

// Register with modifiers and keycode
registerHotkey(modifiers: number, keyCode: number, callback: () => void): number;

// Unregister a hotkey
unregisterHotkey(id: number): boolean;

// Unregister all hotkeys
unregisterAllHotkeys(): void;

// Parse accelerator string
parseAccelerator(accelerator: string): HotkeyInfo;

// Modifier constants
const Modifiers = {
  None: 0,
  Ctrl: 1,
  Alt: 2,
  Shift: 4,
  Meta: 8,    // Windows key on Windows, Cmd on macOS
  Command: 8,
};
```

### Accelerator String Format

Accelerator strings follow Electron's format:
- `CommandOrControl+Shift+Space` - Ctrl+Shift+Space on Windows/Linux, Cmd+Shift+Space on macOS
- `Alt+R` - Alt+R
- `Ctrl+Shift+F1` - Ctrl+Shift+F1
- `Meta+A` - Windows+A on Windows, Cmd+A on macOS

## Permissions

### macOS

The native module requires the following permissions:

1. **Accessibility** - Required for text injection and global hotkeys
   - System Preferences > Security & Privacy > Privacy > Accessibility
   
2. **Screen Recording** (optional) - Required for window title detection in some apps
   - System Preferences > Security & Privacy > Privacy > Screen Recording

The app will prompt for permissions automatically. Use the permissions API:

```typescript
import { checkAllPermissions, requestAccessibilityPermission } from './permissions';

const status = await checkAllPermissions();
if (!status.accessibility) {
  await requestAccessibilityPermission();
}
```

### Windows

No special permissions required, but the app may trigger UAC prompts when simulating keyboard input in elevated applications.

### Linux

Requires X11 with the XTest extension. Most desktop environments include this by default. For Wayland, text injection may not work in all applications.

## Building

### Development Build

```bash
npm run build:native:debug
```

### Production Build

```bash
npm run build:native
```

### Rebuild for Electron

When using with Electron, rebuild the native module for the specific Electron version:

```bash
npm run postinstall
# or
npx electron-rebuild
```

## Troubleshooting

### Module not found

Ensure the native module is built:
```bash
npm run rebuild:native
```

### Build errors on Windows

Install Visual Studio Build Tools:
```bash
npm install --global windows-build-tools
```

### Build errors on macOS

Ensure Xcode CLI tools are installed:
```bash
xcode-select --install
```

### Text injection not working

- **macOS**: Check Accessibility permissions
- **Windows**: Try running as administrator for elevated apps
- **Linux**: Ensure X11 XTest extension is available

### Hotkeys not registering

- Another application may have registered the same hotkey
- Try a different key combination

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

*Last updated: January 21, 2026 - Test push by Capy AI*

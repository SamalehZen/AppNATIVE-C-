# Speechly Clone

A cross-platform desktop voice dictation application with AI-powered text cleanup, inspired by [Speechly.io](https://www.speechly.io/).

## Features

- **Voice Dictation**: Real-time speech-to-text using Web Speech API
- **AI Text Cleanup**: Automatic grammar, punctuation, and filler word removal using Google Gemini
- **Multi-language Support**: 15+ languages including English, French, Spanish, German, and more
- **Dark Theme UI**: Modern, sleek interface inspired by Speechly
- **Local History**: SQLite database stores all your transcriptions
- **Cross-platform**: Works on macOS and Windows
- **Hotkey Support**: Global hotkey (Cmd/Ctrl+Shift+Space) to start/stop recording
- **Context-aware Cleanup**: Optimize text for email, chat, documents, or code

## Prerequisites

- Node.js 20+
- npm or yarn
- Microphone access
- Google Gemini API key (for AI cleanup feature)

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd speechly-clone

# Install dependencies
npm install

# Rebuild native modules for Electron
npm run rebuild
```

## Configuration

1. Launch the application
2. Click the settings icon (gear) in the top right
3. Enter your Google Gemini API key
4. Select your default language
5. Enable/disable auto-cleanup as preferred

### Getting a Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy and paste it into the app settings

## Usage

### Starting the App

```bash
npm start
```

### Dictation Workflow

1. Click the microphone button (or use Cmd/Ctrl+Shift+Space)
2. Speak clearly into your microphone
3. Click again to stop recording
4. The original transcript appears on the left
5. AI-cleaned text appears on the right (if auto-cleanup is enabled)
6. Click "Copy to Clipboard" to copy the cleaned text

### Context Selection

Choose the appropriate context for better cleanup results:
- **General**: Default, balanced cleanup
- **Email**: Professional tone, formal structure
- **Chat**: Casual, preserves conversational style
- **Document**: Formal, thorough cleanup
- **Code**: Preserves technical terms and formatting

## Building for Distribution

```bash
# Package the app
npm run package

# Create installers
npm run make
```

## Project Structure

```
speechly-clone/
├── src/
│   ├── main/                   # Electron main process
│   │   ├── index.ts            # App entry point
│   │   ├── preload.ts          # IPC bridge
│   │   ├── ipc-handlers.ts     # IPC handlers
│   │   ├── database.ts         # SQLite service
│   │   └── gemini.ts           # Gemini API service
│   ├── renderer/               # React UI
│   │   ├── App.tsx             # Main component
│   │   ├── components/         # UI components
│   │   ├── hooks/              # React hooks
│   │   └── styles/             # CSS styles
│   └── shared/
│       └── types.ts            # Shared TypeScript types
├── index.html
├── package.json
├── tailwind.config.js
└── forge.config.ts
```

## Tech Stack

- **Electron 28+** - Desktop app framework
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Web Speech API** - Speech recognition
- **Google Gemini** - AI text cleanup
- **better-sqlite3** - Local database

## Supported Languages

| Language | Code |
|----------|------|
| English (US) | en-US |
| English (UK) | en-GB |
| Français | fr-FR |
| Español | es-ES |
| Deutsch | de-DE |
| Italiano | it-IT |
| Português | pt-BR |
| العربية | ar-SA |
| 中文 (简体) | zh-CN |
| 日本語 | ja-JP |
| 한국어 | ko-KR |
| Русский | ru-RU |
| Nederlands | nl-NL |
| Polski | pl-PL |
| Türkçe | tr-TR |

## Troubleshooting

### Microphone not working
- Ensure your browser/Electron has microphone permissions
- Check that no other app is using the microphone

### AI cleanup not working
- Verify your Gemini API key is valid
- Check your internet connection
- The cleanup will return original text if API fails

### Native module errors
```bash
npm run rebuild
```

## License

MIT

## Phase 2 (Coming Soon)

- System-wide text injection
- Context-aware mode detection
- Custom dictionary support
- Keyboard shortcut customization
- History search and management

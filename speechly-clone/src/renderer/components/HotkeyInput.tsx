import React, { useState, useRef, useEffect } from 'react';
import { Keyboard } from 'lucide-react';

interface HotkeyInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const HotkeyInput: React.FC<HotkeyInputProps> = ({
  value,
  onChange,
  placeholder = 'Press a key combination',
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [currentKeys, setCurrentKeys] = useState<string[]>([]);
  const inputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isRecording) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const keys: string[] = [];

      if (e.ctrlKey || e.metaKey) keys.push('CommandOrControl');
      if (e.altKey) keys.push('Alt');
      if (e.shiftKey) keys.push('Shift');

      const key = e.key;
      if (!['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
        const normalizedKey = key.length === 1 ? key.toUpperCase() : key;
        keys.push(normalizedKey);
      }

      setCurrentKeys(keys);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      e.preventDefault();
      
      if (currentKeys.length > 1 || (currentKeys.length === 1 && !['CommandOrControl', 'Alt', 'Shift'].includes(currentKeys[0]))) {
        const hotkey = currentKeys.join('+');
        onChange(hotkey);
        setIsRecording(false);
        setCurrentKeys([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isRecording, currentKeys, onChange]);

  const formatHotkey = (hotkey: string): string => {
    return hotkey
      .replace('CommandOrControl', '⌘/Ctrl')
      .replace('Shift', '⇧')
      .replace('Alt', '⌥')
      .replace(/\+/g, ' + ');
  };

  return (
    <div
      ref={inputRef}
      onClick={() => setIsRecording(true)}
      onBlur={() => {
        setIsRecording(false);
        setCurrentKeys([]);
      }}
      tabIndex={0}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer
        bg-bg-tertiary border transition-colors
        ${isRecording 
          ? 'border-accent-purple ring-1 ring-accent-purple/50' 
          : 'border-bg-tertiary hover:border-gray-600'}
      `}
    >
      <Keyboard size={18} className="text-text-secondary" />
      <span className={`flex-1 ${!value && !isRecording ? 'text-text-secondary' : 'text-text-primary'}`}>
        {isRecording 
          ? (currentKeys.length > 0 ? formatHotkey(currentKeys.join('+')) : 'Recording...')
          : (value ? formatHotkey(value) : placeholder)}
      </span>
      {isRecording && (
        <span className="text-xs text-accent-purple animate-pulse">Recording</span>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Eye, EyeOff, Key } from 'lucide-react';

interface ApiKeyInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({
  value,
  onChange,
  placeholder = 'Enter your API key',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const maskedValue = value ? '•'.repeat(Math.min(value.length, 32)) + (value.length > 32 ? '...' : '') : '';

  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
        <Key size={18} />
      </div>
      <input
        type={isVisible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-bg-tertiary text-text-primary rounded-lg pl-10 pr-12 py-3
                   border border-bg-tertiary focus:border-accent-purple focus:outline-none
                   focus:ring-1 focus:ring-accent-purple/50 transition-colors"
      />
      <button
        type="button"
        onClick={() => setIsVisible(!isVisible)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary 
                   hover:text-text-primary transition-colors"
      >
        {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
};

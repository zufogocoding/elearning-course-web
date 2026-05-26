'use client';

import { useRef, KeyboardEvent, ClipboardEvent, useEffect } from 'react';

interface OtpInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  isDark?: boolean;
  disabled?: boolean;
}

export default function OtpInput({ value, onChange, isDark = false, disabled = false }: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, val: string) => {
    if (!/^[0-9]$/.test(val) && val !== '') return;
    const newValue = [...value];
    newValue[index] = val;
    onChange(newValue);
    // Auto-focus next
    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (value[index]) {
        const newValue = [...value];
        newValue[index] = '';
        onChange(newValue);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        const newValue = [...value];
        newValue[index - 1] = '';
        onChange(newValue);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newValue = [...value];
    for (let i = 0; i < 6; i++) {
      newValue[i] = text[i] || '';
    }
    onChange(newValue);
    const nextEmpty = newValue.findIndex((v) => !v);
    const focusIndex = nextEmpty === -1 ? 5 : nextEmpty;
    inputRefs.current[focusIndex]?.focus();
  };

  const inputCls = isDark
    ? 'bg-[#22263a] border-[#252840] text-[#e2e8f0] focus:border-indigo-500 focus:ring-indigo-500/40'
    : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-400 focus:ring-indigo-500/40';

  return (
    <div className="flex gap-2 sm:gap-3 justify-center">
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index]}
          disabled={disabled}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className={`w-11 h-14 sm:w-12 sm:h-14 text-center text-xl font-bold border-2 rounded-xl outline-none focus:ring-2 transition-all ${
            value[index]
              ? isDark ? 'border-indigo-500' : 'border-indigo-400'
              : inputCls
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
      ))}
    </div>
  );
}

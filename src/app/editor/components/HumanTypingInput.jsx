"use client";

import { useState, useRef, useEffect } from "react";
import { useHumanTyping } from "../utils/useHumanTyping";

/**
 * Komponen Input dengan efek typing seperti manusia
 * Baik saat mengetik langsung maupun paste, teks akan muncul secara bertahap
 */
export default function HumanTypingInput({
  value,
  onChange,
  onPaste,
  minDelay = 30,
  maxDelay = 120,
  enabled = true,
  ...props
}) {
  const [isTyping, setIsTyping] = useState(false);
  const [targetValue, setTargetValue] = useState(null);
  const [isPasteMode, setIsPasteMode] = useState(false);
  const inputRef = useRef(null);
  const lastValueRef = useRef(value || "");
  const typingStartTimeRef = useRef(null);

  // Hitung delay berdasarkan apakah ini paste atau typing langsung
  // Untuk typing langsung, gunakan delay yang cukup terlihat (tidak terlalu cepat)
  // Untuk paste (banyak karakter), gunakan delay normal
  const effectiveMinDelay = isPasteMode ? minDelay : Math.max(50, minDelay);
  const effectiveMaxDelay = isPasteMode ? maxDelay : Math.max(100, maxDelay * 0.8);

  // Gunakan efek typing untuk semua perubahan value
  const displayValue = useHumanTyping(
    isTyping ? targetValue : value,
    {
      minDelay: effectiveMinDelay,
      maxDelay: effectiveMaxDelay,
      enabled: isTyping && enabled,
    }
  );

  // Update value ketika displayValue selesai di-typing
  useEffect(() => {
    if (isTyping && displayValue === targetValue && targetValue !== null) {
      // Typing selesai, update value asli
      if (onChange && inputRef.current) {
        const syntheticEvent = {
          target: {
            ...inputRef.current,
            value: targetValue,
          },
        };
        onChange(syntheticEvent);
      }
      lastValueRef.current = targetValue;
      setIsTyping(false);
      setIsPasteMode(false);
      setTargetValue(null);
      typingStartTimeRef.current = null;
    }
  }, [displayValue, targetValue, isTyping, onChange]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    const oldValue = lastValueRef.current;
    const lengthDiff = newValue.length - oldValue.length;
    
    // Jika sedang dalam proses typing dengan efek, update target value
    // agar efek typing bisa melanjutkan ke nilai baru
    if (isTyping) {
      setTargetValue(newValue);
      return;
    }
    
    // Deteksi apakah ini typing langsung atau perubahan besar (paste/delete banyak)
    const now = Date.now();
    const timeSinceLastChange = typingStartTimeRef.current 
      ? now - typingStartTimeRef.current 
      : 0;
    
    // Jika disabled, langsung update tanpa efek
    if (!enabled) {
      lastValueRef.current = newValue;
      if (onChange) {
        onChange(e);
      }
      typingStartTimeRef.current = now;
      return;
    }
    
    // Jika menghapus (lengthDiff < 0), langsung update tanpa efek typing
    if (lengthDiff < 0) {
      lastValueRef.current = newValue;
      if (onChange) {
        onChange(e);
      }
      typingStartTimeRef.current = now;
      return;
    }
    
    // Jika menambah karakter (lengthDiff > 0), gunakan efek typing
    // Deteksi apakah ini paste (banyak karakter sekaligus) atau typing langsung
    const isPaste = lengthDiff > 2 || (lengthDiff > 0 && timeSinceLastChange > 200);
    
    if (lengthDiff > 0) {
      setIsPasteMode(isPaste);
      setIsTyping(true);
      setTargetValue(newValue);
      typingStartTimeRef.current = now;
    } else {
      // Jika tidak ada perubahan panjang (replace), langsung update
      lastValueRef.current = newValue;
      if (onChange) {
        onChange(e);
      }
      typingStartTimeRef.current = now;
    }
  };

  const handlePaste = (e) => {
    // Prevent default paste behavior
    e.preventDefault();
    
    // Get pasted text
    const pastedText = (e.clipboardData || window.clipboardData).getData("text");
    
    if (pastedText) {
      // Dapatkan posisi cursor
      const input = e.target;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const currentValue = value || "";
      
      // Buat nilai baru dengan teks yang di-paste
      const newValue = 
        currentValue.substring(0, start) + 
        pastedText + 
        currentValue.substring(end);
      
      if (enabled) {
        // Aktifkan efek typing untuk paste (selalu paste mode)
        setIsPasteMode(true);
        setIsTyping(true);
        setTargetValue(newValue);
        typingStartTimeRef.current = Date.now();
      } else {
        // Jika disabled, langsung paste tanpa efek
        if (onChange) {
          const syntheticEvent = {
            ...e,
            target: {
              ...e.target,
              value: newValue,
            },
          };
          onChange(syntheticEvent);
        }
      }
      
      // Jika ada custom onPaste handler, panggil
      if (onPaste) {
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            value: newValue,
          },
        };
        onPaste(syntheticEvent);
      }
    }
  };

  const handleKeyDown = (e) => {
    // Handle Ctrl+A / Cmd+A untuk select all
    if ((e.ctrlKey || e.metaKey) && e.key === "a") {
      e.preventDefault();
      e.target.select();
      return;
    }
  };

  // Update lastValue ketika value berubah dari luar
  useEffect(() => {
    if (!isTyping) {
      lastValueRef.current = value || "";
    }
  }, [value, isTyping]);

  return (
    <input
      {...props}
      ref={inputRef}
      value={isTyping ? displayValue : (value || "")}
      onChange={handleChange}
      onPaste={handlePaste}
      onKeyDown={handleKeyDown}
    />
  );
}

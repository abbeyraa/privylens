"use client";

import { useState, useEffect, useRef } from "react";

/**
 * Custom hook untuk efek typing seperti manusia
 * @param {string} value - Nilai input yang akan di-typing
 * @param {Object} options - Opsi konfigurasi
 * @param {number} options.minDelay - Delay minimum per karakter (ms)
 * @param {number} options.maxDelay - Delay maksimum per karakter (ms)
 * @param {boolean} options.enabled - Aktifkan/disable efek typing
 * @returns {string} - Nilai yang sedang di-typing
 */
export function useHumanTyping(value, options = {}) {
  const { minDelay = 30, maxDelay = 120, enabled = true } = options;

  const [displayValue, setDisplayValue] = useState(value || "");
  const timeoutRef = useRef(null);
  const targetValueRef = useRef(value || "");

  useEffect(() => {
    // Update target value ketika value berubah
    const newTarget = value || "";
    targetValueRef.current = newTarget;

    if (!enabled) {
      // Jika disabled, langsung set nilai tanpa efek typing
      setDisplayValue(newTarget);
      return;
    }

    // Clear timeout yang ada
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Jika value baru lebih pendek dari display value, langsung update
    if (newTarget.length < displayValue.length) {
      setDisplayValue(newTarget);
      return;
    }

    // Jika value baru sama dengan display value, tidak perlu update
    if (newTarget === displayValue) {
      return;
    }

    // Fungsi untuk mengetik karakter berikutnya
    const typeNextChar = () => {
      const current = displayValue;
      const target = targetValueRef.current;

      // Jika sudah mencapai target, stop
      if (current === target) {
        return;
      }

      // Jika target berubah saat typing, reset
      if (target.length < current.length || !target.startsWith(current)) {
        setDisplayValue(target);
        return;
      }

      // Tambahkan karakter berikutnya
      const nextChar = target[current.length];
      if (nextChar) {
        const newDisplay = current + nextChar;
        setDisplayValue(newDisplay);

        // Generate delay random seperti manusia mengetik
        const delay = Math.random() * (maxDelay - minDelay) + minDelay;
        timeoutRef.current = setTimeout(typeNextChar, delay);
      }
    };

    // Mulai typing jika ada karakter yang perlu ditambahkan
    if (displayValue.length < newTarget.length) {
      const delay = Math.random() * (maxDelay - minDelay) + minDelay;
      timeoutRef.current = setTimeout(typeNextChar, delay);
    } else {
      // Jika value berubah tapi lebih pendek, langsung update
      setDisplayValue(newTarget);
    }

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [value, enabled, minDelay, maxDelay, displayValue]);

  return displayValue;
}

import { useState, useCallback, useEffect } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

class ToastManager {
  private listeners: ((toasts: ToastMessage[]) => void)[] = [];
  private toasts: ToastMessage[] = [];

  subscribe(listener: (toasts: ToastMessage[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  show(message: string, type: ToastType = 'info', duration = 3000) {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, message, type, duration };
    this.toasts = [...this.toasts, newToast];
    this.notify();

    setTimeout(() => {
      this.remove(id);
    }, duration);
  }

  success(message: string, duration = 3000) {
    this.show(message, 'success', duration);
  }

  error(message: string, duration = 3000) {
    this.show(message, 'error', duration);
  }

  remove(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.notify();
  }

  private notify() {
    this.listeners.forEach(l => l(this.toasts));
  }
}

export const toastService = new ToastManager();

export function useToasts() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    return toastService.subscribe(setToasts);
  }, []);

  return toasts;
}

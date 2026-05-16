import { useState, useEffect } from 'react';

class LoaderManager {
  private listeners: ((loading: boolean, message?: string) => void)[] = [];
  private isLoading = false;
  private message?: string;

  subscribe(listener: (loading: boolean, message?: string) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  show(message?: string) {
    this.isLoading = true;
    this.message = message;
    this.notify();
  }

  hide() {
    this.isLoading = false;
    this.message = undefined;
    this.notify();
  }

  private notify() {
    this.listeners.forEach(l => l(this.isLoading, this.message));
  }
}

export const loaderService = new LoaderManager();

export function useLoader() {
  const [state, setState] = useState({ isLoading: false, message: undefined as string | undefined });

  useEffect(() => {
    return loaderService.subscribe((isLoading, message) => {
      setState({ isLoading, message });
    });
  }, []);

  return state;
}

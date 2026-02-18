import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const MAX_TOASTS = 4;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  addToast: (toast) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const nextToast: ToastItem = {
      id,
      duration: 3500,
      ...toast,
    };

    set((state) => ({
      toasts: [nextToast, ...state.toasts].slice(0, MAX_TOASTS),
    }));

    if (nextToast.duration && nextToast.duration > 0) {
      window.setTimeout(() => {
        get().removeToast(id);
      }, nextToast.duration);
    }

    return id;
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }));
  },
  clearToasts: () => set({ toasts: [] }),
}));

export const toast = {
  success: (message: string, title = 'Success', duration = 3000) =>
    useToastStore.getState().addToast({ type: 'success', message, title, duration }),
  error: (message: string, title = 'Error', duration = 4500) =>
    useToastStore.getState().addToast({ type: 'error', message, title, duration }),
  info: (message: string, title = 'Info', duration = 3000) =>
    useToastStore.getState().addToast({ type: 'info', message, title, duration }),
};

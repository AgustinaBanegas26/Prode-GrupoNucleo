import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type SlideStatus = 'active' | 'inactive';

export type SlideButton = {
  enabled: boolean;
  text: string;
  internalLink?: string;
  externalLink?: string;
};

export type Slide = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  button: SlideButton;
  order: number;
  status: SlideStatus;
  createdAt: number;
  updatedAt: number;
};

type SlideInput = Omit<Slide, 'createdAt' | 'updatedAt'>;

type SliderStore = {
  slides: Slide[];
  isHydrated: boolean;
  setHydrated: (value: boolean) => void;
  upsert: (slide: SlideInput) => void;
  remove: (id: string) => void;
  toggleStatus: (id: string) => void;
  reorder: (idsInOrder: string[]) => void;
};

const now = () => Date.now();

const initialSlides: Slide[] = [
  {
    id: 'slide_fixture',
    title: 'Fixture Mundial',
    description: 'Consultá los partidos y horarios actualizados',
    imageUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&h=600&fit=crop',
    button: { enabled: true, text: 'Ver Fixture', internalLink: '/(app)/fixture' },
    order: 1,
    status: 'active',
    createdAt: now(),
    updatedAt: now(),
  },
];

export const useSliderStore = create<SliderStore>()(
  persist(
    (set, get) => ({
      slides: initialSlides,
      isHydrated: false,
      setHydrated: (value) => set({ isHydrated: value }),
      upsert: (slide) => {
        const existing = get().slides;
        const idx = existing.findIndex((s) => s.id === slide.id);
        const next: Slide = {
          ...slide,
          createdAt: idx >= 0 ? existing[idx].createdAt : now(),
          updatedAt: now(),
        };
        const merged = idx >= 0 ? [...existing.slice(0, idx), next, ...existing.slice(idx + 1)] : [...existing, next];
        const normalized = merged
          .sort((a, b) => a.order - b.order)
          .map((s, i) => ({ ...s, order: i + 1 }));
        set({ slides: normalized });
      },
      remove: (id) => {
        const next = get()
          .slides.filter((s) => s.id !== id)
          .sort((a, b) => a.order - b.order)
          .map((s, i) => ({ ...s, order: i + 1 }));
        set({ slides: next });
      },
      toggleStatus: (id) => {
        set({
          slides: get().slides.map((s) =>
            s.id === id ? { ...s, status: s.status === 'active' ? 'inactive' : 'active', updatedAt: now() } : s,
          ),
        });
      },
      reorder: (idsInOrder) => {
        const map = new Map(get().slides.map((s) => [s.id, s] as const));
        const next = idsInOrder
          .map((id) => map.get(id))
          .filter((s): s is Slide => !!s)
          .map((s, i) => ({ ...s, order: i + 1, updatedAt: now() }));
        set({ slides: next });
      },
    }),
    {
      name: 'content_slider_v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ slides: s.slides }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
);

export const makeEmptySlide = (): SlideInput => ({
  id: `${Date.now()}`,
  title: '',
  description: '',
  imageUrl: '',
  button: { enabled: false, text: '', internalLink: '' },
  order: 1,
  status: 'active',
});


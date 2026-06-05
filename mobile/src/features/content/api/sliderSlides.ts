import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '../../../lib/supabase';
import { deleteStorageObject, getPublicUrl, uploadImageFromUri } from '../../../lib/storage';

export type SliderSlideRow = {
  id: string;
  title: string;
  description: string;
  image_path: string;
  button_enabled: boolean;
  button_text: string;
  internal_link: string | null;
  external_link: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type SliderSlide = {
  id: string;
  title: string;
  description: string;
  imagePath: string;
  imageUrl: string;
  button: {
    enabled: boolean;
    text: string;
    internalLink?: string;
    externalLink?: string;
  };
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

const SLIDER_BUCKET = 'slider';

function randomByte(): number {
  // UUID v4 sin dependencias (mejor si existe crypto.getRandomValues).
  try {
    // RN/Expo suele exponer crypto.getRandomValues (web/metro); si no, fallback.
    const cryptoObj = (globalThis as unknown as { crypto?: { getRandomValues?: (arr: Uint8Array) => Uint8Array } })
      .crypto;
    if (cryptoObj?.getRandomValues) {
      const arr = new Uint8Array(1);
      cryptoObj.getRandomValues(arr);
      return arr[0]!;
    }
  } catch {
    // no-op
  }
  return Math.floor(Math.random() * 256);
}

function makeUuidV4(): string {
  const b = new Uint8Array(16);
  for (let i = 0; i < 16; i++) b[i] = randomByte();

  // Version 4
  b[6] = (b[6]! & 0x0f) | 0x40;
  // Variant 10xxxxxx
  b[8] = (b[8]! & 0x3f) | 0x80;

  const hex = Array.from(b, (n) => n.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function guessImageExt(uri: string): 'jpg' | 'png' | 'webp' {
  const clean = uri.split('?')[0] ?? uri;
  const m = clean.match(/\.([a-zA-Z0-9]+)$/);
  const raw = (m?.[1] ?? '').toLowerCase();
  if (raw === 'png') return 'png';
  if (raw === 'webp') return 'webp';
  // Normalizamos jpeg -> jpg y fallback.
  return 'jpg';
}

function mapRow(row: SliderSlideRow): SliderSlide {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    imagePath: row.image_path,
    imageUrl: getPublicUrl(SLIDER_BUCKET, row.image_path),
    button: {
      enabled: !!row.button_enabled,
      text: row.button_text ?? '',
      internalLink: row.internal_link ?? undefined,
      externalLink: row.external_link ?? undefined,
    },
    order: row.sort_order,
    active: !!row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const sliderQueryKey = ['slider_slides'] as const;

export function useSliderSlides() {
  return useQuery({
    queryKey: sliderQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('slider_slides')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw new Error(error.message);
      return (Array.isArray(data) ? data : []).map(mapRow);
    },
  });
}

export function useSliderRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('slider-slides-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'slider_slides' }, () => {
        qc.invalidateQueries({ queryKey: sliderQueryKey });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}

export function useUpsertSliderSlide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id?: string;
      title: string;
      description: string;
      active: boolean;
      order: number;
      button: {
        enabled: boolean;
        text: string;
        internalLink?: string;
        externalLink?: string;
      };
      // Si viene uri, se sube archivo. Si no, se conserva imagePath (edición sin cambiar imagen)
      imageUri?: string;
      imagePath?: string;
    }) => {
      const id = input.id ?? makeUuidV4();

      // Si viene uri, subimos archivo. Si no, conservamos imagePath (edición sin cambiar imagen).
      // Importante: image_path en DB es path dentro del bucket (no URL).
      const imagePath = input.imageUri
        ? (input.imagePath ?? `slides/${id}.${guessImageExt(input.imageUri)}`)
        : input.imagePath;

      if (!imagePath) throw new Error('Falta imagen');

      if (input.imageUri) {
        await uploadImageFromUri({ bucket: SLIDER_BUCKET, path: imagePath, uri: input.imageUri });
      }

      const { error } = await supabase.from('slider_slides').upsert(
        {
          id,
          title: input.title,
          description: input.description,
          image_path: imagePath,
          button_enabled: input.button.enabled,
          button_text: input.button.text,
          internal_link: input.button.internalLink ?? null,
          external_link: input.button.externalLink ?? null,
          sort_order: input.order,
          is_active: input.active,
        },
        { onConflict: 'id' },
      );

      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: sliderQueryKey });
    },
  });
}

export function useDeleteSliderSlide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; imagePath: string }) => {
      const { error } = await supabase.from('slider_slides').delete().eq('id', input.id);
      if (error) throw new Error(error.message);

      // delete image (best-effort)
      try {
        await deleteStorageObject({ bucket: SLIDER_BUCKET, paths: [input.imagePath] });
      } catch {
        // no-op
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: sliderQueryKey });
    },
  });
}

export function useReorderSliderSlides() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (idsInOrder: string[]) => {
      const rows = idsInOrder.map((id, idx) => ({ id, sort_order: idx + 1 }));
      const { error } = await supabase.from('slider_slides').upsert(rows, { onConflict: 'id' });
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: sliderQueryKey });
    },
  });
}

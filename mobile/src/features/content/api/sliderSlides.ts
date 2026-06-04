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

function makeId(): string {
  // Suficiente para ids de contenido en este proyecto (evita dependencia extra).
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
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
      const id = input.id ?? makeId();

      const imagePath =
        input.imageUri
          ? `slides/${id}.${(input.imageUri.split('.').pop() || 'jpg').split('?')[0]}`
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

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '../../../lib/supabase';
import { deleteStorageObject, getPublicUrl, uploadImageFromUri } from '../../../lib/storage';

export type SliderSlideRow = {
  id: number;
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
};

const SLIDER_BUCKET = 'slider';

function makeNumericId(): number {
  return Date.now();
}

function parseSlideId(id: string | undefined): number | null {
  if (!id) return null;
  const n = Number(id);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function mapRow(row: SliderSlideRow): SliderSlide {
  return {
    id: String(row.id),
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
      imageUri?: string;
      imagePath?: string;
    }) => {
      const existingId = parseSlideId(input.id);
      const slideId = existingId ?? makeNumericId();

      const ext = input.imageUri
        ? (input.imageUri.split('.').pop() || 'jpg').split('?')[0]
        : 'jpg';

      const imagePath = input.imageUri
        ? `slides/${slideId}.${ext}`
        : input.imagePath;

      if (!imagePath) throw new Error('Falta imagen');

      if (input.imageUri) {
        await uploadImageFromUri({ bucket: SLIDER_BUCKET, path: imagePath, uri: input.imageUri });
      }

      const payload = {
        id: slideId,
        title: input.title,
        description: input.description,
        image_path: imagePath,
        button_enabled: input.button.enabled,
        button_text: input.button.text,
        internal_link: input.button.internalLink ?? null,
        external_link: input.button.externalLink ?? null,
        sort_order: input.order,
        is_active: input.active,
      };

      const { error } = existingId
        ? await supabase.from('slider_slides').update(payload).eq('id', existingId)
        : await supabase.from('slider_slides').insert(payload);

      if (error) throw new Error(error.message);
      return String(slideId);
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
      const numericId = parseSlideId(input.id);
      if (!numericId) throw new Error('ID de slide inválido');

      const { error } = await supabase.from('slider_slides').delete().eq('id', numericId);
      if (error) throw new Error(error.message);

      try {
        await deleteStorageObject({ bucket: SLIDER_BUCKET, paths: [input.imagePath] });
      } catch {
        // best-effort
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
      for (let idx = 0; idx < idsInOrder.length; idx++) {
        const id = parseSlideId(idsInOrder[idx]);
        if (!id) continue;
        const { error } = await supabase
          .from('slider_slides')
          .update({ sort_order: idx + 1 })
          .eq('id', id);
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: sliderQueryKey });
    },
  });
}

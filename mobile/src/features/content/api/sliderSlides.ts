import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '../../../lib/supabase';
import { deleteStorageObject, getPublicUrl, guessFileExt, uploadImageFromUri } from '../../../lib/storage';

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

const SLIDER_BUCKET = 'sliders';

type UseSliderSlidesOptions = {
  onlyActive?: boolean;
};

function parseSlideId(id: string | undefined): string | null {
  if (!id) return null;
  const trimmed = id.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function makeImagePath(ext: string): string {
  return `slides/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
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

export function useSliderSlides(options: UseSliderSlidesOptions = {}) {
  const onlyActive = options.onlyActive ?? true;
  const queryKey = onlyActive ? ['slider_slides', 'active'] as const : ['slider_slides', 'all'] as const;

  return useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase.from('slider_slides').select('*');
      if (onlyActive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query.order('sort_order', { ascending: true });
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
        qc.invalidateQueries({ queryKey: ['slider_slides'] });
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
      const oldImagePath = input.imagePath;
      let imagePath = input.imagePath;

      if (input.imageUri) {
        const ext = guessFileExt(input.imageUri) ?? 'jpg';
        imagePath = makeImagePath(ext);
        await uploadImageFromUri({ bucket: SLIDER_BUCKET, path: imagePath, uri: input.imageUri });
      }

      if (!imagePath) throw new Error('Falta imagen');

      const payload = {
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

      if (existingId) {
        const { error } = await supabase.from('slider_slides').update(payload).eq('id', existingId);
        if (error) {
          if (input.imageUri) {
            await deleteStorageObject({ bucket: SLIDER_BUCKET, paths: [imagePath] }).catch(() => {});
          }
          throw new Error(error.message);
        }

        if (input.imageUri && oldImagePath && oldImagePath !== imagePath) {
          await deleteStorageObject({ bucket: SLIDER_BUCKET, paths: [oldImagePath] }).catch(() => {});
        }

        return existingId;
      }

      const { data, error } = await supabase
        .from('slider_slides')
        .insert(payload)
        .select('id')
        .maybeSingle();

      if (error) {
        if (input.imageUri) {
          await deleteStorageObject({ bucket: SLIDER_BUCKET, paths: [imagePath] }).catch(() => {});
        }
        throw new Error(error.message);
      }
      if (!data?.id) {
        if (input.imageUri) {
          await deleteStorageObject({ bucket: SLIDER_BUCKET, paths: [imagePath] }).catch(() => {});
        }
        throw new Error('No se pudo crear el slider');
      }
      return String(data.id);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['slider_slides'] });
    },
  });
}

export function useDeleteSliderSlide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; imagePath: string }) => {
      const slideId = parseSlideId(input.id);
      if (!slideId) throw new Error('ID de slide inválido');

      const { error } = await supabase.from('slider_slides').delete().eq('id', slideId);
      if (error) throw new Error(error.message);

      try {
        await deleteStorageObject({ bucket: SLIDER_BUCKET, paths: [input.imagePath] });
      } catch {
        // best-effort
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['slider_slides'] });
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
      await qc.invalidateQueries({ queryKey: ['slider_slides'] });
    },
  });
}

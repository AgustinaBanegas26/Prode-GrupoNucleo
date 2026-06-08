import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '../../../lib/supabase';
import { deleteStorageObject, getPublicUrl, guessFileExt, uploadImageFromUri } from '../../../lib/storage';

export type SliderSlideRow = {
  id: string;
  title: string;
  description: string;
  image_path: string | null;
  button_enabled: boolean;
  button_text: string;
  internal_link: string | null;
  external_link: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
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
  updatedAt?: string;
};

export type UpsertSliderSlideInput = {
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
  onUploadProgress?: (percent: number) => void;
};

const SLIDER_BUCKET = 'sliders';
const STALE_TIME_MS = 30_000;

export const sliderSlidesQueryKey = ['slider_slides'] as const;

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

/** Traduce errores de Supabase a mensajes claros para el usuario. */
export function parseSupabaseError(error: unknown, fallback: string): string {
  if (!error) return fallback;
  if (error instanceof Error) {
    const msg = error.message;
    if (msg.includes('JWT') || msg.includes('permission') || msg.includes('policy')) {
      return 'No tenés permisos para esta acción. Volvé a iniciar sesión como admin.';
    }
    if (msg.includes('duplicate key')) return 'Ya existe un registro con esos datos.';
    if (msg.includes('violates')) return 'Los datos ingresados no son válidos.';
    return msg;
  }
  return fallback;
}

function mapRow(row: SliderSlideRow): SliderSlide {
  const imagePath = row.image_path ?? '';
  return {
    id: String(row.id),
    title: row.title,
    description: row.description ?? '',
    imagePath,
    imageUrl: imagePath ? getPublicUrl(SLIDER_BUCKET, imagePath) : '',
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

async function fetchSliderSlides(onlyActive: boolean): Promise<SliderSlide[]> {
  let query = supabase.from('slider_slides').select('*');
  if (onlyActive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query.order('sort_order', { ascending: true });
  if (error) throw new Error(parseSupabaseError(error, 'No se pudieron cargar los slides'));
  return (Array.isArray(data) ? data : []).map(mapRow);
}

async function invalidateSliderQueries(qc: ReturnType<typeof useQueryClient>) {
  await qc.invalidateQueries({ queryKey: sliderSlidesQueryKey });
}

/** Todos los slides (admin). */
export function useAllSliderSlides() {
  return useSliderSlides({ onlyActive: false });
}

/** Solo slides activos, ordenados por sort_order ASC (home). */
export function useActiveSliderSlides() {
  return useSliderSlides({ onlyActive: true });
}

export function useSliderSlides(options: UseSliderSlidesOptions = {}) {
  const onlyActive = options.onlyActive ?? false;
  const queryKey = onlyActive
    ? ([...sliderSlidesQueryKey, 'active'] as const)
    : ([...sliderSlidesQueryKey, 'all'] as const);

  return useQuery({
    queryKey,
    queryFn: () => fetchSliderSlides(onlyActive),
    staleTime: STALE_TIME_MS,
  });
}

export function useSliderRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('slider-slides-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'slider_slides' }, () => {
        void invalidateSliderQueries(qc);
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
    mutationFn: async (input: UpsertSliderSlideInput) => {
      const existingId = parseSlideId(input.id);
      const oldImagePath = input.imagePath;
      let imagePath = input.imagePath;

      if (input.imageUri) {
        const ext = guessFileExt(input.imageUri) ?? 'jpg';
        imagePath = makeImagePath(ext);
        await uploadImageFromUri({
          bucket: SLIDER_BUCKET,
          path: imagePath,
          uri: input.imageUri,
          onProgress: input.onUploadProgress,
        });
      }

      if (!imagePath) throw new Error('Seleccioná una imagen antes de guardar');

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
          if (input.imageUri && imagePath) {
            await deleteStorageObject({ bucket: SLIDER_BUCKET, paths: [imagePath] }).catch(() => {});
          }
          throw new Error(parseSupabaseError(error, 'No se pudo actualizar el slide'));
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
        if (input.imageUri && imagePath) {
          await deleteStorageObject({ bucket: SLIDER_BUCKET, paths: [imagePath] }).catch(() => {});
        }
        throw new Error(parseSupabaseError(error, 'No se pudo crear el slide'));
      }
      if (!data?.id) {
        if (input.imageUri && imagePath) {
          await deleteStorageObject({ bucket: SLIDER_BUCKET, paths: [imagePath] }).catch(() => {});
        }
        throw new Error('No se pudo crear el slide');
      }
      return String(data.id);
    },
    onSuccess: async () => {
      await invalidateSliderQueries(qc);
    },
  });
}

export function useToggleSliderSlideActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; active: boolean }) => {
      const slideId = parseSlideId(input.id);
      if (!slideId) throw new Error('ID de slide inválido');

      const { error } = await supabase
        .from('slider_slides')
        .update({ is_active: input.active })
        .eq('id', slideId);

      if (error) throw new Error(parseSupabaseError(error, 'No se pudo cambiar el estado del slide'));
    },
    onSuccess: async () => {
      await invalidateSliderQueries(qc);
    },
  });
}

export function useDeleteSliderSlide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; imagePath?: string }) => {
      const slideId = parseSlideId(input.id);
      if (!slideId) throw new Error('ID de slide inválido');

      const { error } = await supabase.from('slider_slides').delete().eq('id', slideId);
      if (error) throw new Error(parseSupabaseError(error, 'No se pudo eliminar el slide'));

      if (input.imagePath) {
        try {
          await deleteStorageObject({ bucket: SLIDER_BUCKET, paths: [input.imagePath] });
        } catch {
          // best-effort: el registro ya fue eliminado
        }
      }
    },
    onSuccess: async () => {
      await invalidateSliderQueries(qc);
    },
  });
}

export function useDeleteSliderImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; imagePath: string }) => {
      const slideId = parseSlideId(input.id);
      if (!slideId) throw new Error('ID de slide inválido');
      if (!input.imagePath) throw new Error('No hay imagen para eliminar');

      await deleteStorageObject({ bucket: SLIDER_BUCKET, paths: [input.imagePath] });

      const { error } = await supabase
        .from('slider_slides')
        .update({ image_path: null })
        .eq('id', slideId);

      if (error) {
        throw new Error(parseSupabaseError(error, 'No se pudo limpiar la imagen del slide'));
      }
    },
    onSuccess: async () => {
      await invalidateSliderQueries(qc);
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
        if (error) throw new Error(parseSupabaseError(error, 'No se pudo reordenar los slides'));
      }
    },
    onSuccess: async () => {
      await invalidateSliderQueries(qc);
    },
  });
}

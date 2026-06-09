const META_PREFIX = '<!--slider-meta:';
const META_SUFFIX = '-->';

export type SliderSlideMeta = {
  showTitle: boolean;
};

const DEFAULT_META: SliderSlideMeta = { showTitle: true };

export function parseSliderDescription(raw: string): { meta: SliderSlideMeta; description: string } {
  if (!raw?.startsWith(META_PREFIX)) {
    return { meta: DEFAULT_META, description: raw ?? '' };
  }

  const end = raw.indexOf(META_SUFFIX);
  if (end < 0) {
    return { meta: DEFAULT_META, description: raw };
  }

  const jsonPart = raw.slice(META_PREFIX.length, end);
  let meta = DEFAULT_META;
  try {
    const parsed = JSON.parse(jsonPart) as Partial<SliderSlideMeta>;
    meta = { showTitle: parsed.showTitle !== false };
  } catch {
    meta = DEFAULT_META;
  }

  const description = raw.slice(end + META_SUFFIX.length).trimStart();
  return { meta, description };
}

export function serializeSliderDescription(description: string, meta: SliderSlideMeta): string {
  if (meta.showTitle === true) {
    return description;
  }
  return `${META_PREFIX}${JSON.stringify({ showTitle: false })}${META_SUFFIX}${description}`;
}

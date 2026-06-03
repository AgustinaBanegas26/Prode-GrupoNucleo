import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { useAppTheme } from '../../../providers/ThemeProvider';
import { spacing, radius, shadows, typography } from '../../../theme/theme';
import { useUsersStore } from '../../users/store/usersStore';
import { useNewsStore } from '../../content/store/newsStore';
import { useRewardsStore } from '../../content/store/rewardsStore';
import { useImageAssetsStore } from '../../content/store/imageAssetsStore';
import { useSliderStore } from '../../content/store/sliderStore';
import { useAdminActivityStore } from '../store/adminActivityStore';

type ReportKind = 'Resumen' | 'Usuarios' | 'Noticias' | 'Premios' | 'Imágenes' | 'Slider';

function csvEscape(v: string) {
  const s = v ?? '';
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function makeCsv(rows: string[][]) {
  return rows.map((r) => r.map(csvEscape).join(',')).join('\n');
}

function makeHtmlPage(title: string, bodyHtml: string) {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; }
  h1 { font-size: 18px; margin: 0 0 12px 0; }
  .meta { color: #666; font-size: 12px; margin-bottom: 18px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; text-align: left; }
  th { background: #f5f5f5; }
</style>
</head>
<body>
  <h1>${title}</h1>
  ${bodyHtml}
</body>
</html>`;
}

async function ensureShareAvailable() {
  const ok = await Sharing.isAvailableAsync();
  if (!ok) {
    Alert.alert('No disponible', 'Compartir archivos no está disponible en este dispositivo.');
  }
  return ok;
}

async function writeAndShare(uri: string, mimeType: string) {
  if (!(await ensureShareAvailable())) return;
  await Sharing.shareAsync(uri, { mimeType });
}

export function ReportsScreen() {
  const { theme } = useAppTheme();
  const log = useAdminActivityStore((s) => s.log);

  const users = useUsersStore((s) => s.users);
  const refreshUsers = useUsersStore((s) => s.refresh);
  const news = useNewsStore((s) => s.items);
  const rewards = useRewardsStore((s) => s.rewards);
  const images = useImageAssetsStore((s) => s.assets);
  const slides = useSliderStore((s) => s.slides);

  const [kind, setKind] = useState<ReportKind>('Resumen');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  const summary = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.status === 'active').length;
    const publishedNews = news.filter((n) => n.status === 'published').length;
    const activeRewards = rewards.filter((r) => r.status === 'active').length;
    const activeSlides = slides.filter((s) => s.status === 'active').length;
    const activeImages = images.filter((a) => a.status === 'active').length;
    return { totalUsers, activeUsers, publishedNews, activeRewards, activeSlides, activeImages };
  }, [images, news, rewards, slides, users]);

  const buildRows = useMemo((): { title: string; rows: string[][]; html: string } => {
    const now = new Date().toLocaleString();

    if (kind === 'Usuarios') {
      const rows: string[][] = [
        ['id', 'nombre', 'apellido', 'email', 'usuario', 'estado', 'rol', 'actualizado'],
        ...users
          .slice()
          .sort((a, b) => b.updatedAt - a.updatedAt)
          .map((u) => [
            u.id,
            u.firstName,
            u.lastName,
            u.email,
            u.username,
            u.status,
            u.role,
            new Date(u.updatedAt).toLocaleString(),
          ]),
      ];

      const table = `<div class="meta">Generado: ${now}</div>
<table><thead><tr>${rows[0].map((h) => `<th>${h}</th>`).join('')}</tr></thead>
<tbody>${rows
        .slice(1)
        .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`)
        .join('')}</tbody></table>`;

      return { title: 'Reporte de Usuarios', rows, html: makeHtmlPage('Reporte de Usuarios', table) };
    }

    if (kind === 'Noticias') {
      const rows: string[][] = [
        ['id', 'titulo', 'estado', 'fecha', 'actualizado'],
        ...news
          .slice()
          .sort((a, b) => b.updatedAt - a.updatedAt)
          .map((n) => [
            n.id,
            n.title,
            n.status,
            new Date(n.date).toLocaleDateString(),
            new Date(n.updatedAt).toLocaleString(),
          ]),
      ];

      const table = `<div class="meta">Generado: ${now}</div>
<table><thead><tr>${rows[0].map((h) => `<th>${h}</th>`).join('')}</tr></thead>
<tbody>${rows
        .slice(1)
        .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`)
        .join('')}</tbody></table>`;

      return { title: 'Reporte de Noticias', rows, html: makeHtmlPage('Reporte de Noticias', table) };
    }

    if (kind === 'Premios') {
      const rows: string[][] = [
        ['id', 'nombre', 'estado', 'cantidad', 'actualizado'],
        ...rewards
          .slice()
          .sort((a, b) => b.updatedAt - a.updatedAt)
          .map((r) => [r.id, r.name, r.status, `${r.quantity}`, new Date(r.updatedAt).toLocaleString()]),
      ];

      const table = `<div class="meta">Generado: ${now}</div>
<table><thead><tr>${rows[0].map((h) => `<th>${h}</th>`).join('')}</tr></thead>
<tbody>${rows
        .slice(1)
        .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`)
        .join('')}</tbody></table>`;

      return { title: 'Reporte de Premios', rows, html: makeHtmlPage('Reporte de Premios', table) };
    }

    if (kind === 'Imágenes') {
      const rows: string[][] = [
        ['id', 'titulo', 'estado', 'ubicacion', 'link', 'actualizado'],
        ...images
          .slice()
          .sort((a, b) => b.updatedAt - a.updatedAt)
          .map((a) => [a.id, a.title, a.status, a.placement, a.link ?? '', new Date(a.updatedAt).toLocaleString()]),
      ];

      const table = `<div class="meta">Generado: ${now}</div>
<table><thead><tr>${rows[0].map((h) => `<th>${h}</th>`).join('')}</tr></thead>
<tbody>${rows
        .slice(1)
        .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`)
        .join('')}</tbody></table>`;

      return { title: 'Reporte de Imágenes', rows, html: makeHtmlPage('Reporte de Imágenes', table) };
    }

    if (kind === 'Slider') {
      const rows: string[][] = [
        ['id', 'titulo', 'estado', 'orden', 'boton', 'link interno', 'link externo', 'actualizado'],
        ...slides
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((s) => [
            s.id,
            s.title,
            s.status,
            `${s.order}`,
            s.button.enabled ? 'si' : 'no',
            s.button.internalLink ?? '',
            s.button.externalLink ?? '',
            new Date(s.updatedAt).toLocaleString(),
          ]),
      ];

      const table = `<div class="meta">Generado: ${now}</div>
<table><thead><tr>${rows[0].map((h) => `<th>${h}</th>`).join('')}</tr></thead>
<tbody>${rows
        .slice(1)
        .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`)
        .join('')}</tbody></table>`;

      return { title: 'Reporte de Slider', rows, html: makeHtmlPage('Reporte de Slider', table) };
    }

    const rows: string[][] = [
      ['métrica', 'valor'],
      ['Usuarios', `${summary.totalUsers}`],
      ['Usuarios activos', `${summary.activeUsers}`],
      ['Noticias publicadas', `${summary.publishedNews}`],
      ['Premios activos', `${summary.activeRewards}`],
      ['Imágenes activas', `${summary.activeImages}`],
      ['Slides activos', `${summary.activeSlides}`],
    ];

    const table = `<div class="meta">Generado: ${now}</div>
<table><thead><tr>${rows[0].map((h) => `<th>${h}</th>`).join('')}</tr></thead>
<tbody>${rows
      .slice(1)
      .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`)
      .join('')}</tbody></table>`;

    return { title: 'Reporte Resumen', rows, html: makeHtmlPage('Reporte Resumen', table) };
  }, [images, kind, news, rewards, slides, summary, users]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const csv = makeCsv(buildRows.rows);
      const filename = `reporte_${kind.toLowerCase()}_${Date.now()}.csv`;
      const uri = `${FileSystem.cacheDirectory ?? ''}${filename}`;
      await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 });
      log({ action: 'export', module: 'reports', title: `Export CSV (${kind})` });
      await writeAndShare(uri, 'text/csv');
    } finally {
      setExporting(false);
    }
  };

  const exportExcel = async () => {
    setExporting(true);
    try {
      const head = buildRows.rows[0];
      const body = buildRows.rows.slice(1);
      const htmlTable = `<table><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${body
        .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`)
        .join('')}</tbody></table>`;
      const html = makeHtmlPage(`Reporte ${kind}`, htmlTable);

      const filename = `reporte_${kind.toLowerCase()}_${Date.now()}.xls`;
      const uri = `${FileSystem.cacheDirectory ?? ''}${filename}`;
      await FileSystem.writeAsStringAsync(uri, html, { encoding: FileSystem.EncodingType.UTF8 });
      log({ action: 'export', module: 'reports', title: `Export Excel (${kind})` });
      await writeAndShare(uri, 'application/vnd.ms-excel');
    } finally {
      setExporting(false);
    }
  };

  const exportPdf = async () => {
    setExporting(true);
    try {
      const result = await Print.printToFileAsync({ html: buildRows.html });
      log({ action: 'export', module: 'reports', title: `Export PDF (${kind})` });
      await writeAndShare(result.uri, 'application/pdf');
    } finally {
      setExporting(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="file-export" size={32} color={theme.colors.success} />
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Reportes</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Exportar PDF · Excel · CSV</Text>
          </View>
        </View>

        <View style={styles.filters}>
          {(['Resumen', 'Usuarios', 'Noticias', 'Premios', 'Imágenes', 'Slider'] as const).map((k) => (
            <Pressable
              key={k}
              onPress={() => setKind(k)}
              style={[
                styles.filterButton,
                {
                  backgroundColor: kind === k ? theme.colors.primary : theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text style={[styles.filterText, { color: kind === k ? '#fff' : theme.colors.text }]} numberOfLines={1}>
                {k}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={[styles.preview, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.previewTitle, { color: theme.colors.text }]}>{buildRows.title}</Text>
          <Text style={[styles.previewMeta, { color: theme.colors.textSecondary }]}>{buildRows.rows.length - 1} filas</Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={exportPdf}
            disabled={exporting}
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
          >
            <MaterialCommunityIcons name="file-pdf-box" size={18} color="#fff" />
            <Text style={styles.actionText}>{exporting ? 'Exportando...' : 'PDF'}</Text>
          </Pressable>
          <Pressable
            onPress={exportExcel}
            disabled={exporting}
            style={[styles.actionButton, { backgroundColor: theme.colors.info }]}
          >
            <MaterialCommunityIcons name="file-excel" size={18} color="#fff" />
            <Text style={styles.actionText}>{exporting ? 'Exportando...' : 'Excel'}</Text>
          </Pressable>
          <Pressable
            onPress={exportCsv}
            disabled={exporting}
            style={[styles.actionButton, { backgroundColor: theme.colors.success }]}
          >
            <MaterialCommunityIcons name="file-delimited" size={18} color="#fff" />
            <Text style={styles.actionText}>{exporting ? 'Exportando...' : 'CSV'}</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
  header: { flexDirection: 'row', gap: spacing.lg, alignItems: 'flex-start' },
  headerText: { flex: 1 },
  title: { fontSize: 20, fontWeight: typography.bold as any },
  subtitle: { fontSize: 12, fontWeight: typography.regular as any, marginTop: spacing.xs },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  filterButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.full, borderWidth: 1, maxWidth: '100%' },
  filterText: { fontSize: 12, fontWeight: typography.semibold as any },
  preview: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, gap: spacing.xs, ...shadows.sm },
  previewTitle: { fontSize: 14, fontWeight: typography.semibold as any },
  previewMeta: { fontSize: 12, fontWeight: typography.regular as any },
  actions: { flexDirection: 'row', gap: spacing.md },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.md, borderRadius: radius.lg, ...shadows.sm },
  actionText: { color: '#fff', fontSize: 14, fontWeight: typography.semibold as any },
});


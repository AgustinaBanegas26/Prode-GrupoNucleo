import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { Screen } from '../../src/components/Screen';
import { profileStats, homePosition, getUpcomingMatches } from '../../src/features/mockData';
import { useAuth } from '../../src/providers/AuthProvider';
import { useAppTheme } from '../../src/providers/ThemeProvider';
import { getFlagEmoji } from '../../src/theme/theme';

// ── Paleta — celeste/blanco para header Argentina, rojo solo CTA ──
const CELESTE      = '#6EC6FF';
const CELESTE_DARK = '#3DA5F5';
const CELESTE_BG   = '#DDF4FF';
const DEEP         = '#0F4C81';
const RED          = '#CC2627';

// ────────────────────────────────────────────────────────────
// Animación entrada
// ────────────────────────────────────────────────────────────
function FadeSlide({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 380, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 380, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

// ────────────────────────────────────────────────────────────
// Stat Card
// ────────────────────────────────────────────────────────────
function StatCard({ icon, label, value }: { icon: string; label: string; value: string | number }) {
  const { theme } = useAppTheme();
  return (
    <View style={[
      statS.card,
      {
        backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : '#fff',
        borderColor: theme.isDark ? 'rgba(110,198,255,0.15)' : 'rgba(110,198,255,0.3)',
      },
    ]}>
      <Text style={statS.icon}>{icon}</Text>
      <Text style={[statS.value, { color: CELESTE_DARK }]}>{value}</Text>
      <Text style={[statS.label, { color: theme.colors.muted }]}>{label}</Text>
    </View>
  );
}

const statS = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    shadowColor: CELESTE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
  },
  icon:  { fontSize: 22 },
  value: { fontSize: 20, fontWeight: '800' },
  label: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
});

// ────────────────────────────────────────────────────────────
// PANTALLA PRINCIPAL
// ────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const router           = useRouter();
  const { theme }        = useAppTheme();
  const { user, logout } = useAuth();

  const [displayName, setDisplayName] = useState(user?.nombre ?? 'Usuario');
  const [avatarUri,   setAvatarUri]   = useState<string | null>(null);
  const [editing,     setEditing]     = useState(false);
  const [editName,    setEditName]    = useState(displayName);

  const initials = displayName.substring(0, 2).toUpperCase();
  const clientId = user?.role === 'admin'
    ? `Administrador · ${user.admin_id ?? ''}`
    : `Cliente #${user?.cliente_id ?? ''}`;
  const bg = theme.isDark ? '#0D0D0D' : '#F5F7FA';
  const nextMatch = getUpcomingMatches(1)[0];

  // ── Selector de foto ──────────────────────────────────────
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para cambiar la foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const saveEdit = () => {
    setDisplayName(editName.trim() || displayName);
    setEditing(false);
  };

  const cancelEdit = () => {
    setEditName(displayName);
    setEditing(false);
  };

  return (
    <Screen style={{ backgroundColor: bg }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ══════════════════════════════════════════════════
            HEADER — celeste y blanco, identidad Argentina
        ══════════════════════════════════════════════════ */}
        <View style={hdrS.wrapper}>
          {/* Gradiente celeste → azul profundo */}
          <LinearGradient
            colors={[CELESTE, CELESTE_DARK, DEEP]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Franjas horizontales Argentina — celeste/blanco muy sutiles */}
          <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            {[0, 1, 2, 3, 4].map((i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  backgroundColor: i % 2 === 0 ? CELESTE : '#FFFFFF',
                  opacity: 0.05,
                }}
              />
            ))}
          </View>

          {/* Círculo decorativo */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              width: 200,
              height: 200,
              borderRadius: 100,
              backgroundColor: 'rgba(255,255,255,0.07)',
              top: -60,
              right: -60,
            }}
          />

          {/* Estrellas campeón */}
          <View pointerEvents="none" style={hdrS.starsRow}>
            <Text style={hdrS.stars}>★  ★  ★</Text>
          </View>

          {/* Contenido */}
          <View style={hdrS.content}>
            {/* Avatar */}
            <Pressable onPress={pickImage} style={hdrS.avatarOuter}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={hdrS.avatarImg} />
              ) : (
                <View style={hdrS.avatarFallback}>
                  <Text style={hdrS.avatarText}>{initials}</Text>
                </View>
              )}
              <View style={hdrS.cameraBadge}>
                <Feather name="camera" size={12} color="#fff" />
              </View>
            </Pressable>

            <Text style={hdrS.name}>{displayName}</Text>
            <Text style={hdrS.clientId}>{clientId}</Text>

            <View style={hdrS.rankBadge}>
              <Text style={hdrS.rankEmoji}>🏆</Text>
              <Text style={hdrS.rankText}>#{homePosition.position} del Ranking General</Text>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, gap: 20, marginTop: 20 }}>

          {/* ══════════════════════════════════════════════════
              EDITAR PERFIL
          ══════════════════════════════════════════════════ */}
          <FadeSlide delay={60}>
            <View style={[
              editS.card,
              {
                backgroundColor: theme.isDark ? '#171717' : '#fff',
                borderColor: theme.isDark ? 'rgba(110,198,255,0.15)' : 'rgba(110,198,255,0.25)',
              },
            ]}>
              {/* Header de la card */}
              <View style={editS.cardHeader}>
                <View style={editS.titleRow}>
                  <Feather name="user" size={15} color={CELESTE_DARK} />
                  <Text style={[editS.cardTitle, { color: theme.colors.text }]}>Editar perfil</Text>
                </View>
                {!editing && (
                  <Pressable
                    onPress={() => { setEditName(displayName); setEditing(true); }}
                    style={[editS.editBtn, { backgroundColor: theme.isDark ? 'rgba(61,165,245,0.12)' : CELESTE_BG }]}
                  >
                    <Feather name="edit-2" size={12} color={CELESTE_DARK} />
                    <Text style={[editS.editBtnText, { color: CELESTE_DARK }]}>Editar</Text>
                  </Pressable>
                )}
              </View>

              {/* Foto */}
              <View style={editS.photoRow}>
                <Pressable onPress={pickImage} style={editS.photoBtn}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={editS.photo} />
                  ) : (
                    <View style={[editS.photoFallback, { backgroundColor: theme.isDark ? 'rgba(110,198,255,0.12)' : CELESTE_BG }]}>
                      <Text style={[editS.photoInitials, { color: CELESTE_DARK }]}>{initials}</Text>
                    </View>
                  )}
                </Pressable>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={[editS.photoLabel, { color: theme.colors.text }]}>Foto de perfil</Text>
                  <Pressable onPress={pickImage}>
                    <Text style={[editS.photoHint, { color: CELESTE_DARK }]}>Tocar para cambiar</Text>
                  </Pressable>
                </View>
              </View>

              {/* Nombre */}
              <View style={editS.fieldBlock}>
                <Text style={[editS.fieldLabel, { color: theme.colors.muted }]}>Nombre de usuario</Text>
                {editing ? (
                  <TextInput
                    style={[
                      editS.input,
                      {
                        color: theme.colors.text,
                        backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : '#F5F7FA',
                        borderColor: CELESTE,
                      },
                    ]}
                    value={editName}
                    onChangeText={setEditName}
                    autoFocus
                    maxLength={40}
                    placeholder="Tu nombre de usuario"
                    placeholderTextColor={theme.colors.placeholder}
                    returnKeyType="done"
                    onSubmitEditing={saveEdit}
                  />
                ) : (
                  <Text style={[editS.fieldValue, { color: theme.colors.text }]}>{displayName}</Text>
                )}
              </View>

              {/* Acciones guardar/cancelar */}
              {editing && (
                <View style={editS.actionRow}>
                  <Pressable
                    onPress={cancelEdit}
                    style={({ pressed }) => [
                      editS.cancelBtn,
                      { borderColor: theme.colors.border, opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <Text style={[editS.cancelText, { color: theme.colors.textSecondary }]}>Cancelar</Text>
                  </Pressable>
                  <Pressable
                    onPress={saveEdit}
                    style={({ pressed }) => [editS.saveBtn, { opacity: pressed ? 0.85 : 1 }]}
                  >
                    <LinearGradient
                      colors={[CELESTE_DARK, DEEP]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={editS.saveBtnGrad}
                    >
                      <Feather name="check" size={14} color="#fff" />
                      <Text style={editS.saveText}>Guardar</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              )}
            </View>
          </FadeSlide>

          {/* ══════════════════════════════════════════════════
              ESTADÍSTICAS
          ══════════════════════════════════════════════════ */}
          <FadeSlide delay={120}>
            <Text style={[secS.title, { color: theme.colors.text }]}>Mis estadísticas</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <StatCard icon="🏆" label="Puntos"      value={profileStats.points}      />
              <StatCard icon="🎯" label="Aciertos"    value={profileStats.aciertos}    />
              <StatCard icon="📈" label="Efectividad" value={profileStats.efectividad} />
            </View>
          </FadeSlide>

          {/* ══════════════════════════════════════════════════
              PRÓXIMO PARTIDO
          ══════════════════════════════════════════════════ */}
          {nextMatch && (
            <FadeSlide delay={180}>
              <Text style={[secS.title, { color: theme.colors.text }]}>Próximo partido</Text>
              <View style={[
                nmS.card,
                {
                  backgroundColor: theme.isDark ? '#171717' : '#fff',
                  borderColor: theme.isDark ? 'rgba(110,198,255,0.15)' : 'rgba(110,198,255,0.25)',
                  marginTop: 10,
                },
              ]}>
                <View style={nmS.row}>
                  <View style={nmS.teamCol}>
                    <Text style={nmS.flag}>{getFlagEmoji(nextMatch.homeCode)}</Text>
                    <Text style={[nmS.teamName, { color: theme.colors.text }]} numberOfLines={1}>
                      {nextMatch.homeTeam}
                    </Text>
                  </View>
                  <View style={nmS.center}>
                    <Text style={[nmS.vs, { color: theme.colors.muted }]}>VS</Text>
                    <Text style={[nmS.time, { color: theme.colors.text }]}>{nextMatch.time}</Text>
                    <Text style={[nmS.date, { color: theme.colors.muted }]}>{nextMatch.date}</Text>
                  </View>
                  <View style={nmS.teamCol}>
                    <Text style={nmS.flag}>{getFlagEmoji(nextMatch.awayCode)}</Text>
                    <Text style={[nmS.teamName, { color: theme.colors.text }]} numberOfLines={1}>
                      {nextMatch.awayTeam}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => router.push('/(app)/pronosticos')}
                  style={({ pressed }) => [nmS.btn, { opacity: pressed ? 0.85 : 1 }]}
                >
                  <LinearGradient
                    colors={[CELESTE_DARK, DEEP]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={nmS.btnGrad}
                  >
                    <Feather name="edit-3" size={15} color="#fff" />
                    <Text style={nmS.btnText}>Realizar pronóstico</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </FadeSlide>
          )}

          {/* ══════════════════════════════════════════════════
              TÉRMINOS Y CONDICIONES
          ══════════════════════════════════════════════════ */}
          <FadeSlide delay={230}>
            <Pressable
              onPress={() => router.push('/(app)/terminos-y-condiciones')}
              style={({ pressed }) => [
                tcS.btn,
                {
                  backgroundColor: theme.isDark ? 'rgba(110,198,255,0.06)' : '#F0F8FF',
                  borderColor: theme.isDark ? 'rgba(110,198,255,0.18)' : 'rgba(110,198,255,0.3)',
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <Feather name="file-text" size={16} color={CELESTE_DARK} />
              <Text style={[tcS.text, { color: CELESTE_DARK }]}>Términos y Condiciones</Text>
              <Feather name="chevron-right" size={15} color={CELESTE_DARK} />
            </Pressable>
          </FadeSlide>

          {/* ══════════════════════════════════════════════════
              CERRAR SESIÓN — rojo del Grupo Núcleo
          ══════════════════════════════════════════════════ */}
          <FadeSlide delay={240}>
            <Pressable
              onPress={async () => { await logout(); router.replace('/(auth)/login'); }}
              style={({ pressed }) => [
                logoutS.btn,
                {
                  borderColor: RED,
                  backgroundColor: theme.isDark ? 'rgba(204,38,39,0.08)' : 'rgba(204,38,39,0.05)',
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Ionicons name="log-out-outline" size={18} color={RED} />
              <Text style={[logoutS.text, { color: RED }]}>Cerrar sesión</Text>
            </Pressable>
          </FadeSlide>

        </View>
      </ScrollView>
    </Screen>
  );
}

// ────────────────────────────────────────────────────────────
// Estilos
// ────────────────────────────────────────────────────────────

const hdrS = StyleSheet.create({
  wrapper: {
    height: 310,
    overflow: 'hidden',
    position: 'relative',
  },
  starsRow: {
    position: 'absolute',
    top: 14,
    width: '100%',
    alignItems: 'center',
  },
  stars: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 16,
    letterSpacing: 6,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 32,
    gap: 6,
  },
  avatarOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 6,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  avatarImg: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  avatarFallback: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '900' },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: CELESTE_DARK,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  name:     { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  clientId: { color: 'rgba(255,255,255,0.70)', fontSize: 13, fontWeight: '500' },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  rankEmoji: { fontSize: 14 },
  rankText:  { color: '#fff', fontSize: 13, fontWeight: '700' },
});

const editS = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 16,
    shadowColor: CELESTE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  editBtnText: { fontSize: 13, fontWeight: '600' },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  photoBtn: {},
  photo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: CELESTE,
  },
  photoFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: CELESTE,
  },
  photoInitials: { fontSize: 22, fontWeight: '800' },
  photoLabel: { fontSize: 14, fontWeight: '600' },
  photoHint:  { fontSize: 12, fontWeight: '500' },
  fieldBlock: { gap: 6 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldValue: { fontSize: 16, fontWeight: '600' },
  input: {
    fontSize: 16,
    fontWeight: '600',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  actionRow: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { fontSize: 14, fontWeight: '600' },
  saveBtn: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveBtnGrad: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  saveText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});

const secS = StyleSheet.create({
  title: { fontSize: 17, fontWeight: '800' },
});

const nmS = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 14,
    shadowColor: CELESTE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  teamCol: { flex: 1, alignItems: 'center', gap: 6 },
  flag: { fontSize: 38 },
  teamName: { fontSize: 12, fontWeight: '600', textAlign: 'center', maxWidth: 80 },
  center: { width: 72, alignItems: 'center', gap: 2 },
  vs:   { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  time: { fontSize: 18, fontWeight: '800' },
  date: { fontSize: 11, fontWeight: '500' },
  btn:  { borderRadius: 14, overflow: 'hidden' },
  btnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

const logoutS = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  text: { fontSize: 15, fontWeight: '700' },
});

const tcS = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  text: { fontSize: 14, fontWeight: '600', flex: 1 },
});

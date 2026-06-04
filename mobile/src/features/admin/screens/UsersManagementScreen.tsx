import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { TextField } from "../../../components/TextField";
import { useAppTheme } from "../../../providers/ThemeProvider";
import type { AppUser } from "../../users/types";
import { makeEmptyUser, useUsersStore } from "../../users/store/usersStore";
import { useAdminActivityStore } from "../store/adminActivityStore";

const CELESTE = "#6EC6FF";
const CELESTE_DARK = "#3DA5F5";
const DEEP_BLUE = "#0F4C81";
const RED = "#CC2627";

function FadeSlide({
  delay = 0,
  children,
}: {
  delay?: number;
  children: React.ReactNode;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 380,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 380,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

export function UsersManagementScreen() {
  const { theme } = useAppTheme();
  const isDark = theme.isDark;
  const router = useRouter();

  const users = useUsersStore((s) => s.users);
  const refresh = useUsersStore((s) => s.refresh);
  const upsert = useUsersStore((s) => s.upsert);
  const remove = useUsersStore((s) => s.remove);
  const setActivo = useUsersStore((s) => s.setActivo);
  const resetPassword = useUsersStore((s) => s.resetPassword);
  const log = useAdminActivityStore((s) => s.log);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "blocked"
  >("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(makeEmptyUser());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      const statusOk =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
            ? u.activo
            : !u.activo;
      if (!statusOk) return false;
      if (!q) return true;
      return `${u.numeroEmpleado} ${u.nombre} ${u.apellido}`
        .toLowerCase()
        .includes(q);
    });
  }, [query, statusFilter, users]);

  const openCreate = () => {
    setForm(makeEmptyUser());
    setModalVisible(true);
  };
  const openEdit = (u: AppUser) => {
    setForm({
      id: u.id,
      numeroEmpleado: u.numeroEmpleado,
      nombre: u.nombre,
      apellido: u.apellido,
      email: u.email,
      empresa: u.empresa,
      rol: u.rol,
      activo: u.activo,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (
      !form.numeroEmpleado.trim() ||
      !form.nombre.trim() ||
      !form.apellido.trim()
    ) {
      Alert.alert("Error", "Completá Número de empleado, Nombre y Apellido.");
      return;
    }
    const existed = users.some((u) => u.id === form.id);
    setSaving(true);
    try {
      await upsert({
        ...form,
        numeroEmpleado: form.numeroEmpleado.trim(),
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
      });
      log({
        action: existed ? "update" : "create",
        module: "users",
        title: existed ? "Usuario actualizado" : "Usuario creado",
        detail: `${form.nombre.trim()} ${form.apellido.trim()}`,
      });
      setModalVisible(false);
    } catch (e) {
      Alert.alert(
        "Error",
        e instanceof Error ? e.message : "No se pudo guardar el usuario.",
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (u: AppUser) =>
    Alert.alert("Eliminar usuario", `${u.nombre} ${u.apellido}`, [
      { text: "Cancelar" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          await remove(u.id);
          log({
            action: "delete",
            module: "users",
            title: "Usuario eliminado",
            detail: `${u.nombre} ${u.apellido}`,
          });
        },
      },
    ]);

  const handleBlockToggle = async (u: AppUser) => {
    const next = !u.activo;
    await setActivo(u.id, next);
    log({
      action: "toggle",
      module: "users",
      title: next ? "Usuario desbloqueado" : "Usuario bloqueado",
      detail: `${u.nombre} ${u.apellido}`,
    });
  };

  const handleResetPassword = async (u: AppUser) => {
    const next = await resetPassword(u.id);
    log({
      action: "update",
      module: "users",
      title: "Contraseña restablecida",
      detail: `${u.nombre} ${u.apellido}`,
    });
    Alert.alert("Contraseña restablecida", `Nueva contraseña: ${next}`);
  };

  const bg = isDark ? "#0D0D0D" : "#F5F7FA";
  const cardBg = isDark ? "rgba(255,255,255,0.05)" : "#fff";
  const cardBorder = isDark
    ? "rgba(110,198,255,0.15)"
    : "rgba(110,198,255,0.25)";
  const searchBg = isDark ? "rgba(255,255,255,0.06)" : "#fff";
  const textPrimary = theme.colors.text;
  const textMuted = theme.colors.muted;
  const placeColor = theme.colors.placeholder;

  const renderUserItem = ({
    item,
    index,
  }: {
    item: AppUser;
    index: number;
  }) => {
    const isActive = item.activo;
    return (
      <FadeSlide key={item.id} delay={index * 35}>
        <View
          style={[
            u.card,
            {
              backgroundColor: cardBg,
              borderColor: cardBorder,
              shadowColor: CELESTE,
            },
          ]}
        >
          <View style={u.topRow}>
            <View
              style={[
                u.initials,
                {
                  backgroundColor: isDark
                    ? "rgba(110,198,255,0.12)"
                    : "#EBF5FF",
                },
              ]}
            >
              <Text style={[u.initialsText, { color: CELESTE_DARK }]}>
                {item.nombre.slice(0, 1)}
                {item.apellido.slice(0, 1)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[u.name, { color: textPrimary }]}>
                {item.nombre} {item.apellido}
              </Text>
              <Text style={[u.meta, { color: textMuted }]}>
                Nº {item.numeroEmpleado} ·{" "}
                {item.rol === "admin" ? "👑 Admin" : "Usuario"}
              </Text>
            </View>
            <View
              style={[
                u.badge,
                {
                  backgroundColor: isActive
                    ? isDark
                      ? "rgba(110,198,255,0.12)"
                      : "#EBF5FF"
                    : "rgba(239,68,68,0.12)",
                },
              ]}
            >
              <View
                style={[
                  u.dot,
                  { backgroundColor: isActive ? CELESTE_DARK : "#ef4444" },
                ]}
              />
              <Text
                style={[
                  u.badgeText,
                  { color: isActive ? CELESTE_DARK : "#ef4444" },
                ]}
              >
                {isActive ? "Activo" : "Bloq."}
              </Text>
            </View>
          </View>

          <View
            style={[
              u.divider,
              {
                backgroundColor: isDark
                  ? "rgba(110,198,255,0.08)"
                  : "rgba(110,198,255,0.15)",
              },
            ]}
          />

          <View style={u.actions}>
            <ActionBtn
              icon="pencil"
              label="Editar"
              color={CELESTE_DARK}
              onPress={() => openEdit(item)}
            />
            <ActionBtn
              icon="key"
              label="Reset"
              color="#f59e0b"
              onPress={() => handleResetPassword(item)}
            />
            <ActionBtn
              icon={isActive ? "lock" : "lock-open-variant"}
              label={isActive ? "Bloq." : "Desbloq."}
              color={isActive ? "#f59e0b" : CELESTE_DARK}
              onPress={() => handleBlockToggle(item)}
            />
            <ActionBtn
              icon="delete"
              label="Eliminar"
              color={RED}
              onPress={() => confirmDelete(item)}
            />
          </View>
        </View>
      </FadeSlide>
    );
  };

  return (
    <View style={[s.root, { backgroundColor: bg }]}>
      <LinearGradient
        colors={[CELESTE_DARK, DEEP_BLUE]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.header}
      >
        <View style={s.circleL} />
        <View style={s.circleS} />
        <View style={s.headerRow}>
          <Pressable onPress={() => router.push("/(admin)")} style={s.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
          </Pressable>
          <View
            style={[s.iconBox, { backgroundColor: "rgba(255,255,255,0.18)" }]}
          >
            <MaterialCommunityIcons
              name="account-multiple"
              size={22}
              color="#fff"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>Gestión de Usuarios</Text>
            <Text style={s.sub}>{filtered.length} usuarios</Text>
          </View>
          <Pressable onPress={openCreate} style={s.addBtn}>
            <LinearGradient colors={[CELESTE, CELESTE_DARK]} style={s.addGrad}>
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              <Text style={s.addText}>Nuevo</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={s.section}>
          <View
            style={[
              s.searchBox,
              {
                backgroundColor: searchBg,
                borderColor: isDark
                  ? "rgba(110,198,255,0.15)"
                  : "rgba(110,198,255,0.3)",
              },
            ]}
          >
            <MaterialCommunityIcons
              name="magnify"
              size={18}
              color={textMuted}
            />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar por nombre o nº empleado"
              placeholderTextColor={placeColor}
              style={[s.searchInput, { color: textPrimary }]}
              autoCapitalize="none"
            />
          </View>

          <View
            style={[
              s.tabBar,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(110,198,255,0.10)",
              },
            ]}
          >
            {(["all", "active", "blocked"] as const).map((f) => {
              const active = statusFilter === f;
              return (
                <Pressable
                  key={f}
                  onPress={() => setStatusFilter(f)}
                  style={[
                    s.tabItem,
                    active && { backgroundColor: CELESTE_DARK },
                  ]}
                >
                  <Text
                    style={[
                      s.tabText,
                      { color: active ? "#fff" : theme.colors.textSecondary },
                    ]}
                  >
                    {f === "all"
                      ? "Todos"
                      : f === "active"
                        ? "Activos"
                        : "Bloqueados"}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <FlatList
            data={filtered}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={{ gap: 12 }}
            ListEmptyComponent={
              <View style={s.empty}>
                <Text style={{ fontSize: 40 }}>👥</Text>
                <Text style={[s.emptyText, { color: textMuted }]}>
                  No hay usuarios para mostrar
                </Text>
              </View>
            }
          />
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={m.backdrop}>
          <View
            style={[
              m.sheet,
              {
                backgroundColor: isDark ? "#1A1A1A" : "#fff",
                borderColor: isDark
                  ? "rgba(110,198,255,0.15)"
                  : "rgba(110,198,255,0.25)",
              },
            ]}
          >
            <View
              style={[
                m.handle,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.15)"
                    : "rgba(0,0,0,0.12)",
                },
              ]}
            />

            <View style={m.sheetHeader}>
              <Text style={[m.sheetTitle, { color: textPrimary }]}>
                {users.some((u) => u.id === form.id)
                  ? "✏️  Editar usuario"
                  : "➕  Crear usuario"}
              </Text>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={[
                  m.closeBtn,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.08)"
                      : "#F5F7FA",
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={20}
                  color={textMuted}
                />
              </Pressable>
            </View>

            <View style={m.body}>
              <TextField
                label="Número de empleado"
                value={form.numeroEmpleado}
                onChangeText={(v) =>
                  setForm((p) => ({ ...p, numeroEmpleado: v }))
                }
                keyboardType="number-pad"
              />
              <TextField
                label="Nombre"
                value={form.nombre}
                onChangeText={(v) => setForm((p) => ({ ...p, nombre: v }))}
              />
              <TextField
                label="Apellido"
                value={form.apellido}
                onChangeText={(v) => setForm((p) => ({ ...p, apellido: v }))}
              />
              <TextField
                label="Email"
                value={form.email || ""}
                onChangeText={(v) => setForm((p) => ({ ...p, email: v }))}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <TextField
                label="Empresa"
                value={form.empresa || ""}
                onChangeText={(v) => setForm((p) => ({ ...p, empresa: v }))}
              />

              <View style={m.pillRow}>
                {([true, false] as const).map((st) => (
                  <Pressable
                    key={String(st)}
                    onPress={() => setForm((p) => ({ ...p, activo: st }))}
                    style={[
                      m.pill,
                      form.activo === st && {
                        backgroundColor: isDark
                          ? "rgba(61,165,245,0.18)"
                          : "#EBF5FF",
                        borderColor: CELESTE_DARK,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        m.pillTxt,
                        {
                          color: form.activo === st ? CELESTE_DARK : textMuted,
                        },
                      ]}
                    >
                      {st ? "Activo" : "Bloqueado"}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View style={m.pillRow}>
                {(["usuario", "admin"] as const).map((r) => (
                  <Pressable
                    key={r}
                    onPress={() => setForm((p) => ({ ...p, rol: r }))}
                    style={[
                      m.pill,
                      form.rol === r && {
                        backgroundColor: isDark
                          ? "rgba(61,165,245,0.18)"
                          : "#EBF5FF",
                        borderColor: CELESTE_DARK,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        m.pillTxt,
                        { color: form.rol === r ? CELESTE_DARK : textMuted },
                      ]}
                    >
                      {r === "usuario" ? "Usuario" : "👑 Admin"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={m.footer}>
              <Pressable
                onPress={handleSave}
                disabled={saving}
                style={m.saveBtn}
              >
                <LinearGradient
                  colors={[CELESTE_DARK, DEEP_BLUE]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={m.saveBtnGrad}
                >
                  <Text style={m.saveBtnText}>
                    {saving ? "Guardando..." : "Guardar"}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ActionBtn({
  icon,
  label,
  color,
  onPress,
}: {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        ab.btn,
        { backgroundColor: `${color}15`, borderColor: `${color}30` },
      ]}
    >
      <MaterialCommunityIcons name={icon as any} size={14} color={color} />
      <Text style={[ab.txt, { color }]}>{label}</Text>
    </Pressable>
  );
}
const ab = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 9,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
  },
  txt: { fontSize: 11, fontWeight: "700" },
});

const u = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  topRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  initials: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  initialsText: { fontSize: 14, fontWeight: "800" },
  name: { fontSize: 14, fontWeight: "700" },
  meta: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  divider: { height: 1 },
  actions: { flexDirection: "row", gap: 8 },
});

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingTop: 56,
    paddingBottom: 28,
    paddingHorizontal: 20,
    position: "relative",
    overflow: "hidden",
  },
  circleL: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1.5,
    borderColor: `${CELESTE}30`,
    top: -50,
    right: -40,
  },
  circleS: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: `${CELESTE}20`,
    top: 30,
    right: 60,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: "#fff", fontSize: 18, fontWeight: "800" },
  sub: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  addBtn: { borderRadius: 14, overflow: "hidden" },
  addGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  addText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  section: { padding: 16, gap: 12 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: { flex: 1, height: 46, fontSize: 14 },
  tabBar: {
    flexDirection: "row",
    borderRadius: 20,
    padding: 4,
    alignSelf: "stretch",
  },
  tabItem: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 18,
    alignItems: "center",
  },
  tabText: { fontSize: 13, fontWeight: "700" },
  empty: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 14 },
});

const m = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 36,
    borderWidth: 1,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  sheetTitle: { fontSize: 17, fontWeight: "800" },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { paddingHorizontal: 20, gap: 12 },
  pillRow: { flexDirection: "row", gap: 10 },
  pill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.10)",
    alignItems: "center",
  },
  pillTxt: { fontSize: 13, fontWeight: "700" },
  footer: { padding: 20, paddingTop: 16 },
  saveBtn: { borderRadius: 14, overflow: "hidden" },
  saveBtnGrad: { paddingVertical: 15, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});

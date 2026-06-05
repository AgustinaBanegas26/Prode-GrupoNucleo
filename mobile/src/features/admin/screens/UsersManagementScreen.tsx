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

import { useAppTheme } from "../../../providers/ThemeProvider";
import type { AppUser } from "../../users/types";
import { makeEmptyUser, useUsersStore } from "../../users/store/usersStore";
import type { UserInput } from "../../users/store/usersStore";
import { useAdminActivityStore } from "../store/adminActivityStore";
import { useRanking } from "../../content/api/ranking";

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

function UserCard({
  user,
  theme,
  isDark,
  onToggleActive,
  onEdit,
  onDelete,
  onResetPassword,
  rankPosition,
  rankPoints,
}: {
  user: AppUser;
  theme: any;
  isDark: boolean;
  onToggleActive: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onResetPassword: () => void;
  rankPosition?: number;
  rankPoints?: number;
}) {
  return (
    <View
      style={[
        us.card,
        {
          backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#fff",
          borderColor: isDark
            ? "rgba(110,198,255,0.15)"
            : "rgba(110,198,255,0.25)",
          shadowColor: CELESTE,
        },
      ]}
    >
      <View style={us.avatar}>
        <Text
          style={us.avatarText}
        >{`${(user.nombre || 'C').charAt(0)}`}</Text>
      </View>

      <View style={us.body}>
        <Text
          style={[us.name, { color: theme.colors.text }]}
        >{`${user.nombre}`}</Text>
        <Text style={[us.email, { color: theme.colors.muted }]}>
          {user.email || "Sin email"}
        </Text>
        <View style={us.metaRow}>
          <MaterialCommunityIcons
            name="badge-account"
            size={12}
            color={isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)"}
          />
          <Text
            style={[
              us.meta,
              { color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)" },
            ]}
          >
            Cliente ID: {user.clienteId}
          </Text>
          <View style={us.dot} />
          <MaterialCommunityIcons
            name="key"
            size={12}
            color={isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)"}
          />
          <Text
            style={[
              us.meta,
              { color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)" },
            ]}
          >
            {user.primerLogin ? "Primer login" : "Activo"}
          </Text>
          {rankPoints != null ? (
            <>
              <View style={us.dot} />
              <MaterialCommunityIcons name="trophy" size={12} color={CELESTE_DARK} />
              <Text style={[us.meta, { color: CELESTE_DARK }]}>
                #{rankPosition ?? "—"} · {rankPoints} pts
              </Text>
            </>
          ) : null}
        </View>
      </View>

      <View style={us.actions}>
        <Pressable
          onPress={onToggleActive}
          style={[
            us.iconBtn,
            {
              backgroundColor: user.activo
                ? "rgba(34, 197, 94, 0.12)"
                : "rgba(245, 158, 11, 0.12)",
            },
          ]}
        >
          <MaterialCommunityIcons
            name={user.activo ? "eye" : "eye-off"}
            size={16}
            color={user.activo ? "#22C55E" : "#F59E0B"}
          />
        </Pressable>
        <Pressable
          onPress={onEdit}
          style={[
            us.iconBtn,
            { backgroundColor: isDark ? "rgba(110,198,255,0.12)" : "#EBF5FF" },
          ]}
        >
          <MaterialCommunityIcons
            name="pencil"
            size={16}
            color={CELESTE_DARK}
          />
        </Pressable>
        <Pressable
          onPress={onResetPassword}
          style={[us.iconBtn, { backgroundColor: "rgba(245, 158, 11, 0.12)" }]}
        >
          <MaterialCommunityIcons name="lock-reset" size={16} color="#F59E0B" />
        </Pressable>
        <Pressable
          onPress={onDelete}
          style={[us.iconBtn, { backgroundColor: "rgba(239, 68, 68, 0.12)" }]}
        >
          <MaterialCommunityIcons name="delete" size={16} color="#ef4444" />
        </Pressable>
      </View>
    </View>
  );
}

const us = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: CELESTE_DARK,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  body: { flex: 1, gap: 3 },
  name: { fontSize: 14, fontWeight: "800" },
  email: { fontSize: 11, fontWeight: "500" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  meta: { fontSize: 10, fontWeight: "600" },
  actions: { flexDirection: "row", gap: 6 },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});

export function UsersManagementScreen() {
  const { theme } = useAppTheme();
  const isDark = theme.isDark;
  const router = useRouter();

  const users = useUsersStore((s) => s.users);
  const refreshUsers = useUsersStore((s) => s.refresh);
  const setActivo = useUsersStore((s) => s.setActivo);
  const upsert = useUsersStore((s) => s.upsert);
  const remove = useUsersStore((s) => s.remove);
  const resetPassword = useUsersStore((s) => s.resetPassword);
  const log = useAdminActivityStore((s) => s.log);
  const { data: ranking = [] } = useRanking("general");

  const rankingByCliente = useMemo(() => {
    const map = new Map<string, { position: number; points: number }>();
    ranking.forEach((r, i) => {
      map.set(String(r.clienteId), { position: i + 1, points: r.points });
    });
    return map;
  }, [ranking]);

  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "blocked"
  >("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  const filtered = useMemo(() => {
    let arr = [...users];
    if (query) {
      const q = query.toLowerCase();
      arr = arr.filter(
        (u) =>
          u.nombre.toLowerCase().includes(q) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          u.clienteId.toLowerCase().includes(q) ||
          u.id.toLowerCase().includes(q),
      );
    }
    if (statusFilter === "active") arr = arr.filter((u) => u.activo);
    if (statusFilter === "blocked") arr = arr.filter((u) => !u.activo);
    return arr;
  }, [users, query, statusFilter]);

  const handleToggleActive = async (user: AppUser) => {
    try {
      await setActivo(user.id, !user.activo);
      log({
        action: "toggle",
        module: "users",
        title: "Usuario " + (!user.activo ? "activado" : "desactivado"),
        detail: `${user.nombre} · ${user.clienteId}`,
      });
    } catch (e) {
      Alert.alert("Error", "No se pudo actualizar el estado del usuario");
    }
  };

  const handleEdit = (user: AppUser) => {
    setEditingUser(user);
    setModalVisible(true);
  };

  const handleDelete = (user: AppUser) => {
    Alert.alert(
      "Eliminar usuario",
      "¿Estás seguro de eliminar a " + user.nombre + "?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await remove(user.id);
              log({
                action: "delete",
                module: "users",
                title: "Usuario eliminado",
                detail: `${user.nombre} · ${user.clienteId}`,
              });
            } catch (e) {
              Alert.alert("Error", "No se pudo eliminar el usuario");
            }
          },
        },
      ],
    );
  };

  const handleResetPassword = async (user: AppUser) => {
    Alert.alert(
      "Resetear contraseña",
      `Esto deja al usuario en "primer login". Contraseña inicial: clientesgn123\n\nCliente: ${user.clienteId}`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Resetear",
          style: "destructive",
          onPress: async () => {
            try {
              await resetPassword(user.id);
              log({
                action: "update",
                module: "users",
                title: "Contraseña reseteada",
                detail: `Cliente ID: ${user.clienteId}`,
              });
              Alert.alert("OK", "Contraseña reseteada. El usuario debe ingresar con: clientesgn123");
            } catch (e) {
              Alert.alert("Error", "No se pudo resetear la contraseña");
            }
          },
        },
      ],
    );
  };

  const handleCreate = () => {
    setEditingUser(null);
    setModalVisible(true);
  };

  const bg = isDark ? "#0D0D0D" : "#F5F7FA";

  return (
    <ScrollView
      style={[s.root, { backgroundColor: bg }]}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={[CELESTE_DARK, DEEP_BLUE]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.header}
      >
        <View style={s.circleL} />
        <View style={s.circleS} />
        <FadeSlide delay={0}>
          <View style={s.headerRow}>
            <Pressable
              onPress={() => router.push("/(admin)")}
              style={s.backBtn}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={22}
                color="#fff"
              />
            </Pressable>
            <LinearGradient colors={["#1e3a5f", "#0f2040"]} style={s.iconGrad}>
              <MaterialCommunityIcons
                name="account-group"
                size={22}
                color={CELESTE}
              />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>Usuarios</Text>
              <Text style={s.sub}>{users.length} usuarios totales</Text>
            </View>
            <Pressable onPress={handleCreate} style={s.addBtn}>
              <MaterialCommunityIcons name="plus" size={18} color="#fff" />
            </Pressable>
          </View>
        </FadeSlide>
      </LinearGradient>

      <View style={s.content}>
        <FadeSlide delay={40}>
          <View style={s.searchRow}>
            <View
              style={[
                s.searchBox,
                {
                  backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#fff",
                  borderColor: isDark
                    ? "rgba(110,198,255,0.15)"
                    : "rgba(110,198,255,0.25)",
                },
              ]}
            >
              <MaterialCommunityIcons
                name="magnify"
                size={18}
                color={theme.colors.muted}
              />
              <TextInput
                style={[s.searchInput, { color: theme.colors.text }]}
                placeholder="Buscar usuario..."
                placeholderTextColor={theme.colors.muted}
                value={query}
                onChangeText={setQuery}
              />
              {query ? (
                <Pressable onPress={() => setQuery("")}>
                  <MaterialCommunityIcons
                    name="close"
                    size={16}
                    color={theme.colors.muted}
                  />
                </Pressable>
              ) : null}
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.filtersRow}
          >
            {[
              { value: "all", label: "Todos", color: CELESTE_DARK },
              { value: "active", label: "Activos", color: "#22C55E" },
              { value: "blocked", label: "Bloqueados", color: "#ef4444" },
            ].map((f) => (
              <Pressable
                key={f.value}
                onPress={() => setStatusFilter(f.value as any)}
                style={[
                  s.filterBtn,
                  {
                    borderColor:
                      statusFilter === f.value
                        ? f.color
                        : isDark
                          ? "rgba(255,255,255,0.12)"
                          : "rgba(0,0,0,0.10)",
                    backgroundColor:
                      statusFilter === f.value
                        ? isDark
                          ? "rgba(61,165,245,0.15)"
                          : "rgba(61,165,245,0.10)"
                        : isDark
                          ? "rgba(255,255,255,0.04)"
                          : "rgba(0,0,0,0.03)",
                  },
                ]}
              >
                <Text
                  style={[
                    s.filterText,
                    {
                      color:
                        statusFilter === f.value ? f.color : theme.colors.muted,
                    },
                  ]}
                >
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </FadeSlide>

        <View style={s.list}>
          {filtered.length === 0 ? (
            <FadeSlide delay={80}>
              <View
                style={[
                  s.emptyCard,
                  {
                    backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#fff",
                    borderColor: isDark
                      ? "rgba(110,198,255,0.15)"
                      : "rgba(110,198,255,0.25)",
                  },
                ]}
              >
                <Text style={{ fontSize: 40 }}>👥</Text>
                <Text style={[s.emptyText, { color: theme.colors.muted }]}>
                  {query ? "No se encontraron usuarios" : "No hay usuarios aún"}
                </Text>
              </View>
            </FadeSlide>
          ) : (
            filtered.map((user, index) => (
              <FadeSlide key={user.id} delay={80 + index * 30}>
                <UserCard
                  user={user}
                  theme={theme}
                  isDark={isDark}
                  rankPosition={rankingByCliente.get(String(user.clienteId))?.position}
                  rankPoints={rankingByCliente.get(String(user.clienteId))?.points}
                  onToggleActive={() => handleToggleActive(user)}
                  onEdit={() => handleEdit(user)}
                  onDelete={() => handleDelete(user)}
                  onResetPassword={() => handleResetPassword(user)}
                />
              </FadeSlide>
            ))
          )}
        </View>
      </View>

      <UserModal
        isDark={isDark}
        theme={theme}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        user={editingUser}
        onSave={async (u) => {
          await upsert(u);
          log({
            action: editingUser ? "update" : "create",
            module: "users",
            title: editingUser ? "Usuario actualizado" : "Usuario creado",
          detail: `${u.nombre} · ${u.clienteId}`,
          });
          setModalVisible(false);
        }}
      />
    </ScrollView>
  );
}

function UserModal({
  isDark,
  theme,
  visible,
  onClose,
  user,
  onSave,
}: {
  isDark: boolean;
  theme: any;
  visible: boolean;
  onClose: () => void;
  user: AppUser | null;
  onSave: (u: UserInput) => Promise<void>;
}) {
  const [form, setForm] = useState(makeEmptyUser());

  useEffect(() => {
    if (visible) {
      setForm(user ? { ...user } : makeEmptyUser());
    }
  }, [visible, user]);

  const handleSave = async () => {
    if (!form.nombre.trim() || !form.clienteId.trim()) {
      Alert.alert("Error", "Completá nombre y cliente_id");
      return;
    }
    await onSave(form);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={m.backdrop} onPress={onClose}>
        <Pressable
          style={[
            m.card,
            {
              backgroundColor: isDark ? "#1e1e1e" : "#fff",
              borderColor: isDark
                ? "rgba(110,198,255,0.15)"
                : "rgba(110,198,255,0.25)",
            },
          ]}
        >
          <View style={m.header}>
            <Text style={[m.headerTitle, { color: theme.colors.text }]}>
              {user ? "Editar usuario" : "Nuevo usuario"}
            </Text>
            <Pressable onPress={onClose}>
              <MaterialCommunityIcons
                name="close"
                size={22}
                color={theme.colors.muted}
              />
            </Pressable>
          </View>

          <ScrollView style={m.body}>
            <View style={m.field}>
              <Text style={[m.label, { color: theme.colors.text }]}>Nombre</Text>
              <TextInput
                style={[
                  m.input,
                  {
                    color: theme.colors.text,
                    backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F5F7FA",
                    borderColor: isDark ? "rgba(110,198,255,0.15)" : "rgba(110,198,255,0.25)",
                  },
                ]}
                value={form.nombre}
                onChangeText={(text) => setForm({ ...form, nombre: text })}
              />
            </View>

            <View style={m.field}>
              <Text style={[m.label, { color: theme.colors.text }]}>
                Cliente ID
              </Text>
              <TextInput
                style={[
                  m.input,
                  {
                    color: theme.colors.text,
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.05)"
                      : "#F5F7FA",
                    borderColor: isDark
                      ? "rgba(110,198,255,0.15)"
                      : "rgba(110,198,255,0.25)",
                  },
                ]}
                value={form.clienteId}
                onChangeText={(text) =>
                  setForm({ ...form, clienteId: text })
                }
              />
            </View>

            <View style={m.field}>
              <Text style={[m.label, { color: theme.colors.text }]}>Email</Text>
              <TextInput
                style={[
                  m.input,
                  {
                    color: theme.colors.text,
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.05)"
                      : "#F5F7FA",
                    borderColor: isDark
                      ? "rgba(110,198,255,0.15)"
                      : "rgba(110,198,255,0.25)",
                  },
                ]}
                value={form.email || ""}
                onChangeText={(text) => setForm({ ...form, email: text })}
                keyboardType="email-address"
              />
            </View>

            <View style={m.field}>
              <Pressable
                onPress={() => setForm({ ...form, activo: !form.activo })}
                style={[
                  m.toggle,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.05)"
                      : "#F5F7FA",
                    borderColor: isDark
                      ? "rgba(110,198,255,0.15)"
                      : "rgba(110,198,255,0.25)",
                  },
                ]}
              >
                <View
                  style={[
                    m.toggleDot,
                    { backgroundColor: form.activo ? "#22C55E" : "#ef4444" },
                  ]}
                />
                <Text style={[m.toggleText, { color: theme.colors.text }]}>
                  {form.activo ? "Activo" : "Desactivado"}
                </Text>
              </Pressable>
            </View>
          </ScrollView>

          <View style={m.footer}>
            <Pressable onPress={onClose} style={m.cancelBtn}>
              <Text style={[m.cancelText, { color: theme.colors.muted }]}>
                Cancelar
              </Text>
            </Pressable>
            <Pressable onPress={handleSave} style={m.saveBtn}>
              <LinearGradient
                colors={[CELESTE_DARK, DEEP_BLUE]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={m.saveText}>Guardar</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const m = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  card: {
    width: "100%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingTop: 18,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  body: { paddingHorizontal: 18, paddingBottom: 10 },
  field: { marginBottom: 14 },
  row: { flexDirection: "row", marginBottom: 14 },
  label: { fontSize: 12, fontWeight: "700", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  toggleDot: { width: 10, height: 10, borderRadius: 5 },
  toggleText: { fontSize: 14, fontWeight: "700" },
  footer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 28,
  },
  cancelBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 50,
  },
  cancelText: { fontSize: 14, fontWeight: "700" },
  saveBtn: {
    flex: 1,
    borderRadius: 14,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  saveText: { color: "#fff", fontSize: 14, fontWeight: "800" },
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
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: "rgba(110,198,255,0.20)",
    top: -60,
    right: -40,
  },
  circleS: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "rgba(110,198,255,0.15)",
    top: 30,
    right: 60,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconGrad: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: "#fff", fontSize: 20, fontWeight: "800" },
  sub: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
  },
  content: { padding: 16, gap: 16 },
  searchRow: { gap: 10 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: "500" },
  filtersRow: { gap: 8, paddingVertical: 2 },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 99,
    borderWidth: 1,
  },
  filterText: { fontSize: 12, fontWeight: "700" },
  list: { gap: 10, paddingBottom: 40 },
  emptyCard: {
    alignItems: "center",
    paddingVertical: 48,
    borderRadius: 20,
    borderWidth: 1,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center",
  },
});

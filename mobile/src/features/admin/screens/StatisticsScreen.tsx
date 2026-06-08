import React, { useRef, useEffect } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useAppTheme } from "../../../providers/ThemeProvider";
import {
  useStatistics,
  useStatisticsRealtime,
} from "../../content/api/statistics";

const CELESTE = "#6EC6FF";
const CELESTE_DARK = "#3DA5F5";
const DEEP_BLUE = "#0F4C81";

function BarChart({
  data,
  isDark,
}: {
  data: { label: string; value: number }[];
  isDark: boolean;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const animsRef = useRef<Animated.Value[]>([]);

  // Update animsRef when data length changes
  useEffect(() => {
    if (animsRef.current.length < data.length) {
      // Add new animated values if needed
      const newAnims = data
        .slice(animsRef.current.length)
        .map(() => new Animated.Value(0));
      animsRef.current.push(...newAnims);
    }
    // Reset all animated values to 0
    animsRef.current.forEach((a) => a.setValue(0));
  }, [data.length]);

  // Animate when data changes
  useEffect(() => {
    Animated.stagger(
      60,
      data.map((_, i) => {
        // Ensure animsRef.current[i] exists
        if (!animsRef.current[i]) {
          animsRef.current[i] = new Animated.Value(0);
        }
        return Animated.timing(animsRef.current[i], {
          toValue: data[i].value / max,
          duration: 600,
          delay: i * 40,
          useNativeDriver: false,
        });
      }),
    ).start();
  }, [data, max]);

  return (
    <View style={bc.wrap}>
      {data.map((d, i) => {
        // Ensure we have an animated value for this index
        if (!animsRef.current[i]) {
          animsRef.current[i] = new Animated.Value(0);
        }
        return (
          <View key={d.label} style={bc.col}>
            <View style={bc.barContainer}>
              <Animated.View
                style={[
                  bc.bar,
                  {
                    height: animsRef.current[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                  },
                ]}
              >
                <LinearGradient
                  colors={[CELESTE, CELESTE_DARK]}
                  style={{ flex: 1, borderRadius: 6 }}
                />
              </Animated.View>
            </View>
            <Text
              style={[
                bc.label,
                {
                  color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)",
                },
              ]}
            >
              {d.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const bc = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 140,
    paddingBottom: 4,
  },
  col: { flex: 1, alignItems: "center", gap: 6 },
  barContainer: { flex: 1, width: "60%", justifyContent: "flex-end" },
  bar: { width: "100%", borderRadius: 6, overflow: "hidden", minHeight: 4 },
  label: { fontSize: 10, fontWeight: "600" },
});

export function StatisticsScreen() {
  const { theme } = useAppTheme();
  const isDark = theme.isDark;
  const router = useRouter();

  const { data: stats, isLoading } = useStatistics();
  useStatisticsRealtime();

  const bg = isDark ? "#0D0D0D" : "#F5F7FA";
  const cardBg = isDark ? "rgba(255,255,255,0.05)" : "#fff";
  const cardBorder = isDark
    ? "rgba(110,198,255,0.15)"
    : "rgba(110,198,255,0.25)";

  const statsData = [
    {
      icon: "account-multiple",
      value: stats?.totalUsers ?? 0,
      label: "Usuarios Totales",
    },
    {
      icon: "account-check",
      value: stats?.activeUsers ?? 0,
      label: "Usuarios Activos",
    },
    {
      icon: "soccer",
      value: stats?.totalPredictions ?? 0,
      label: "Pronósticos",
    },
    { icon: "trending-up", value: stats?.totalUsers ? `${Math.round((stats.activeUsers / stats.totalUsers) * 100)}%` : "0%", label: "Participación" },
  ];

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
        <View style={s.headerRow}>
          <Pressable onPress={() => router.push("/(admin)")} style={s.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
          </Pressable>
          <View
            style={[s.iconBox, { backgroundColor: "rgba(255,255,255,0.18)" }]}
          >
            <MaterialCommunityIcons name="chart-line" size={22} color="#fff" />
          </View>
          <View>
            <Text style={s.title}>Estadísticas</Text>
            <Text style={s.sub}>Métricas en tiempo real</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={[s.content, { backgroundColor: bg }]}>
        <View style={s.statsRow}>
          {statsData.map((stat, i) => (
            <View
              key={stat.label}
              style={[
                s.statCard,
                {
                  backgroundColor: cardBg,
                  borderColor: cardBorder,
                  shadowColor: CELESTE,
                },
              ]}
            >
              <View
                style={[
                  s.statIcon,
                  {
                    backgroundColor: isDark
                      ? "rgba(110,198,255,0.12)"
                      : "#EBF5FF",
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={stat.icon as any}
                  size={20}
                  color={CELESTE_DARK}
                />
              </View>
              <Text style={[s.statValue, { color: CELESTE_DARK }]}>
                {stat.value}
              </Text>
              <Text style={[s.statLabel, { color: theme.colors.muted }]}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        <View
          style={[
            s.card,
            {
              backgroundColor: cardBg,
              borderColor: cardBorder,
              shadowColor: CELESTE,
            },
          ]}
        >
          <View style={s.cardHeader}>
            <View
              style={[
                s.cardIcon,
                {
                  backgroundColor: isDark
                    ? "rgba(110,198,255,0.12)"
                    : "#EBF5FF",
                },
              ]}
            >
              <MaterialCommunityIcons
                name="chart-bar"
                size={18}
                color={CELESTE_DARK}
              />
            </View>
            <Text style={[s.cardTitle, { color: theme.colors.text }]}>
              Participación diaria
            </Text>
          </View>
          <BarChart data={stats?.participationByDay || []} isDark={isDark} />
        </View>

        <View
          style={[
            s.card,
            {
              backgroundColor: cardBg,
              borderColor: cardBorder,
              shadowColor: CELESTE,
            },
          ]}
        >
          <View style={s.cardHeader}>
            <View
              style={[
                s.cardIcon,
                {
                  backgroundColor: isDark
                    ? "rgba(110,198,255,0.12)"
                    : "#EBF5FF",
                },
              ]}
            >
              <MaterialCommunityIcons
                name="target"
                size={18}
                color={CELESTE_DARK}
              />
            </View>
            <Text style={[s.cardTitle, { color: theme.colors.text }]}>
              Tasa de Precisión
            </Text>
          </View>
          <View style={s.precRow}>
            <Text style={[s.precValue, { color: CELESTE_DARK }]}>
              {stats?.avgAccuracy || 0}%
            </Text>
            <Text style={[s.precLabel, { color: theme.colors.muted }]}>
              predicciones acertadas
            </Text>
          </View>
          <View
            style={[
              s.track,
              {
                backgroundColor: isDark ? "rgba(110,198,255,0.12)" : "#EBF5FF",
              },
            ]}
          >
            <LinearGradient
              colors={[CELESTE, CELESTE_DARK]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[s.fill, { width: `${stats?.avgAccuracy || 0}%` }]}
            />
          </View>
          <View style={s.legend}>
            <View style={s.legendItem}>
              <View style={[s.dot, { backgroundColor: CELESTE_DARK }]} />
              <Text style={[s.legendTxt, { color: theme.colors.muted }]}>
                Acertadas
              </Text>
            </View>
            <View style={s.legendItem}>
              <View style={[s.dot, { backgroundColor: "#ef4444" }]} />
              <Text style={[s.legendTxt, { color: theme.colors.muted }]}>
                Fallidas
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

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
  title: { color: "#fff", fontSize: 20, fontWeight: "800" },
  sub: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  statsRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  statCard: {
    width: "48%",
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
    gap: 6,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 10, fontWeight: "600", textAlign: "center" },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 14, fontWeight: "700" },
  precRow: { flexDirection: "row", alignItems: "baseline", gap: 10 },
  precValue: { fontSize: 28, fontWeight: "800" },
  precLabel: { fontSize: 13, fontWeight: "500" },
  track: { height: 10, borderRadius: 99, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 99 },
  legend: { flexDirection: "row", gap: 20 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendTxt: { fontSize: 12, fontWeight: "500" },
});

import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
  Share,
  Alert,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import * as Haptics from "expo-haptics";

export default function AccountScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, token, logout } = useAuth();

  const { data: referral, isLoading: loadingReferral } = useQuery({
    queryKey: ["referral", token],
    queryFn: () => api.customer.referral(token!),
    enabled: !!token,
  });

  const handleLogout = () => {
    Alert.alert("تسجيل الخروج", "هل أنت متأكد أنك تريد الخروج؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "خروج",
        style: "destructive",
        onPress: async () => {
          if (token) await api.customer.logout(token).catch(() => {});
          await logout();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
  };

  const shareReferral = async (code: string) => {
    await Share.share({
      message: `انضم إلى متجر Vermifert! استخدم كود الدعوة ${code} واحصل على خصم 10% على أول طلب.`,
    }).catch(() => {});
  };

  const MenuRow = ({
    icon,
    label,
    onPress,
    danger,
  }: {
    icon: string;
    label: string;
    onPress: () => void;
    danger?: boolean;
  }) => (
    <Pressable
      style={({ pressed }) => [
        styles.menuRow,
        {
          backgroundColor: colors.card,
          borderColor: danger ? colors.destructive + "30" : colors.border,
          borderRadius: colors.radius,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
      onPress={onPress}
    >
      <Feather
        name="chevron-left"
        size={18}
        color={danger ? colors.destructive + "50" : colors.mutedForeground}
      />
      <Text
        style={[
          styles.menuLabel,
          { color: danger ? colors.destructive : colors.foreground, flex: 1, textAlign: "right" },
        ]}
      >
        {label}
      </Text>
      <View
        style={[
          styles.menuIconWrap,
          {
            backgroundColor: danger ? colors.destructive + "18" : colors.primary + "18",
            borderRadius: 10,
          },
        ]}
      >
        <Feather
          name={icon as keyof typeof Feather.glyphMap}
          size={18}
          color={danger ? colors.destructive : colors.primary}
        />
      </View>
    </Pressable>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {Platform.OS === "web" && <View style={{ height: 67 }} />}

      {!user ? (
        <View style={styles.authWrap}>
          {/* Welcome header */}
          <View style={styles.welcomeHeader}>
            <View style={[styles.authIconBg, { backgroundColor: colors.primary + "18", borderRadius: 44 }]}>
              <Feather name="user" size={38} color={colors.primary} />
            </View>
            <Text style={[styles.authTitle, { color: colors.foreground }]}>مرحباً بك</Text>
            <Text style={[styles.authSub, { color: colors.mutedForeground }]}>
              اختر بوابة الدخول المناسبة
            </Text>
          </View>

          {/* Portal cards */}
          <View style={styles.portalsGrid}>
            {/* Customer */}
            <Pressable
              style={({ pressed }) => [
                styles.portalCard,
                { backgroundColor: colors.primary + "12", borderColor: colors.primary + "50", opacity: pressed ? 0.88 : 1 },
              ]}
              onPress={() => router.push("/login")}
            >
              <View style={[styles.portalIconCircle, { backgroundColor: colors.primary + "20" }]}>
                <Feather name="user" size={26} color={colors.primary} />
              </View>
              <Text style={[styles.portalLabel, { color: colors.foreground }]}>زبون</Text>
              <Text style={[styles.portalSub, { color: colors.mutedForeground }]}>تسجيل الدخول</Text>
              <View style={[styles.portalArrow, { backgroundColor: colors.primary + "15" }]}>
                <Feather name="arrow-left" size={13} color={colors.primary} />
              </View>
            </Pressable>

            {/* Admin */}
            <Pressable
              style={({ pressed }) => [
                styles.portalCard,
                { backgroundColor: "#3b82f612", borderColor: "#3b82f650", opacity: pressed ? 0.88 : 1 },
              ]}
              onPress={() => router.push("/admin-login")}
            >
              <View style={[styles.portalIconCircle, { backgroundColor: "#3b82f620" }]}>
                <Feather name="shield" size={26} color="#3b82f6" />
              </View>
              <Text style={[styles.portalLabel, { color: colors.foreground }]}>مدير</Text>
              <Text style={[styles.portalSub, { color: colors.mutedForeground }]}>لوحة التحكم</Text>
              <View style={[styles.portalArrow, { backgroundColor: "#3b82f615" }]}>
                <Feather name="arrow-left" size={13} color="#3b82f6" />
              </View>
            </Pressable>

            {/* Driver */}
            <Pressable
              style={({ pressed }) => [
                styles.portalCard,
                { backgroundColor: "#22c55e12", borderColor: "#22c55e50", opacity: pressed ? 0.88 : 1 },
              ]}
              onPress={() => router.push("/driver-login")}
            >
              <View style={[styles.portalIconCircle, { backgroundColor: "#22c55e20" }]}>
                <Feather name="truck" size={26} color="#22c55e" />
              </View>
              <Text style={[styles.portalLabel, { color: colors.foreground }]}>سائق</Text>
              <Text style={[styles.portalSub, { color: colors.mutedForeground }]}>بوابة التوصيل</Text>
              <View style={[styles.portalArrow, { backgroundColor: "#22c55e15" }]}>
                <Feather name="arrow-left" size={13} color="#22c55e" />
              </View>
            </Pressable>

            {/* Track order */}
            <Pressable
              style={({ pressed }) => [
                styles.portalCard,
                { backgroundColor: "#0ea5e912", borderColor: "#0ea5e950", opacity: pressed ? 0.88 : 1 },
              ]}
              onPress={() => router.push("/track-order")}
            >
              <View style={[styles.portalIconCircle, { backgroundColor: "#0ea5e920" }]}>
                <Feather name="search" size={26} color="#0ea5e9" />
              </View>
              <Text style={[styles.portalLabel, { color: colors.foreground }]}>تتبع</Text>
              <Text style={[styles.portalSub, { color: colors.mutedForeground }]}>متابعة الطلب</Text>
              <View style={[styles.portalArrow, { backgroundColor: "#0ea5e915" }]}>
                <Feather name="arrow-left" size={13} color="#0ea5e9" />
              </View>
            </Pressable>
          </View>

          {/* Create account link */}
          <Pressable
            style={[styles.createAccountRow, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={() => router.push("/register")}
          >
            <Feather name="chevron-left" size={18} color={colors.mutedForeground} />
            <Text style={[styles.createAccountText, { color: colors.foreground }]}>إنشاء حساب جديد</Text>
            <Feather name="user-plus" size={18} color={colors.primary} />
          </Pressable>

          {/* Waste collection */}
          <MenuRow
            icon="refresh-cw"
            label="تبرع بمخلفاتك / تتبع طلب"
            onPress={() => router.push("/waste-collection")}
          />
        </View>
      ) : (
        <View style={{ padding: 16, gap: 14 }}>
          {/* Profile Header */}
          <View
            style={[
              styles.profileCard,
              {
                backgroundColor: colors.primary,
                borderRadius: colors.radius + 4,
              },
            ]}
          >
            <View
              style={[
                styles.avatar,
                { backgroundColor: "rgba(255,255,255,0.2)" },
              ]}
            >
              <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>
                {user.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <Text style={[styles.profileName, { color: colors.primaryForeground }]}>
                {user.name}
              </Text>
              <Text style={[styles.profileEmail, { color: colors.primaryForeground + "cc" }]}>
                {user.email}
              </Text>
              <Text style={[styles.profilePhone, { color: colors.primaryForeground + "99" }]}>
                {user.phone}
              </Text>
            </View>
          </View>

          {/* Referral */}
          {loadingReferral ? (
            <ActivityIndicator color={colors.primary} />
          ) : referral ? (
            <View
              style={[
                styles.referralCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                },
              ]}
            >
              <Text style={[styles.referralTitle, { color: colors.foreground }]}>
                كود الإحالة الخاص بك
              </Text>
              <View style={styles.codeRow}>
                <Pressable
                  style={[
                    styles.shareBtn,
                    {
                      backgroundColor: colors.primary,
                      borderRadius: 10,
                    },
                  ]}
                  onPress={() => shareReferral(referral.referralCode)}
                >
                  <Feather name="share-2" size={16} color={colors.primaryForeground} />
                </Pressable>
                <View
                  style={[
                    styles.codeBox,
                    {
                      backgroundColor: colors.muted,
                      borderRadius: 10,
                      flex: 1,
                    },
                  ]}
                >
                  <Text style={[styles.codeText, { color: colors.foreground }]}>
                    {referral.referralCode}
                  </Text>
                </View>
              </View>
              <Text style={[styles.referralSub, { color: colors.mutedForeground }]}>
                {referral.totalReferrals} أشخاص انضموا عبر كودك
              </Text>

              {referral.coupons.filter((c) => !c.used).length > 0 && (
                <View style={{ gap: 8, marginTop: 4 }}>
                  <Text style={[styles.couponsTitle, { color: colors.foreground }]}>
                    كوبونات الخصم النشطة
                  </Text>
                  {referral.coupons
                    .filter((c) => !c.used)
                    .map((coupon) => (
                      <View
                        key={coupon.code}
                        style={[
                          styles.couponRow,
                          {
                            backgroundColor: colors.accent,
                            borderRadius: 8,
                          },
                        ]}
                      >
                        <Text
                          style={[styles.couponPct, { color: colors.accentForeground }]}
                        >
                          {coupon.discountPercent}% خصم
                        </Text>
                        <Text
                          style={[styles.couponCode, { color: colors.accentForeground }]}
                        >
                          {coupon.code}
                        </Text>
                      </View>
                    ))}
                </View>
              )}
            </View>
          ) : null}

          {/* Menu */}
          <View style={{ gap: 10 }}>
            <MenuRow
              icon="package"
              label="طلباتي"
              onPress={() => router.push("/(tabs)/orders")}
            />
            <MenuRow
              icon="refresh-cw"
              label="تبرع بمخلفاتك العضوية"
              onPress={() => router.push("/waste-collection")}
            />
            <MenuRow
              icon="log-out"
              label="تسجيل الخروج"
              onPress={handleLogout}
              danger
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  authWrap: { padding: 16, gap: 14, marginTop: 20 },
  welcomeHeader: { alignItems: "center", gap: 10, paddingVertical: 8 },
  authIconBg: {
    width: 88,
    height: 88,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  authTitle: { fontSize: 24, fontWeight: "800" },
  authSub: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  portalsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  portalCard: {
    width: "47%",
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 16,
    alignItems: "flex-end",
    gap: 6,
  },
  portalIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  portalLabel: { fontSize: 16, fontWeight: "800" },
  portalSub: { fontSize: 12 },
  portalArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
    marginTop: 4,
  },
  createAccountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  createAccountText: { flex: 1, fontSize: 15, fontWeight: "600", textAlign: "right" },
  authBtn: { width: "100%", padding: 15, alignItems: "center" },
  authBtnText: { fontSize: 16, fontWeight: "700" },
  authBtnOutline: { width: "100%", padding: 13, alignItems: "center", borderWidth: 1 },
  authBtnOutlineText: { fontSize: 15, fontWeight: "600" },
  profileCard: {
    padding: 20,
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 26, fontWeight: "800" },
  profileName: { fontSize: 18, fontWeight: "700" },
  profileEmail: { fontSize: 13, marginTop: 2 },
  profilePhone: { fontSize: 13 },
  referralCard: { padding: 16, borderWidth: 1, gap: 12 },
  referralTitle: { fontSize: 15, fontWeight: "700", textAlign: "right" },
  codeRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  codeBox: { padding: 12 },
  codeText: { fontSize: 18, fontWeight: "800", textAlign: "center", letterSpacing: 2 },
  shareBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  referralSub: { fontSize: 13, textAlign: "right" },
  couponsTitle: { fontSize: 14, fontWeight: "700", textAlign: "right" },
  couponRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
  },
  couponCode: { fontSize: 13, fontWeight: "700", letterSpacing: 1 },
  couponPct: { fontSize: 13, fontWeight: "600" },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderWidth: 1,
  },
  menuIconWrap: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontSize: 15, fontWeight: "600" },
});

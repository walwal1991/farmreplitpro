import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

const getBaseUrl = () =>
  `https://${process.env.EXPO_PUBLIC_DOMAIN ?? "localhost"}`;

interface ChatMsg {
  id: number;
  customerName: string;
  message: string;
  adminReply: string | null;
  createdAt: string;
}

function getOrCreateSession(customerId?: number): string {
  return `session_${customerId ?? "guest"}_${Date.now()}`;
}

export default function ConsultationScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, token } = useAuth();

  const [sessionId] = useState(() =>
    getOrCreateSession(user?.id)
  );
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [nameInput, setNameInput] = useState(user?.name ?? "");
  const [phase, setPhase] = useState<"intro" | "chat">("intro");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const fetchMessages = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["x-customer-token"] = token;
      const res = await fetch(`${getBaseUrl()}/api/contact/session`, {
        method: "POST",
        headers,
        body: JSON.stringify({ sessionId }),
      });
      if (res.ok) {
        const data: ChatMsg[] = await res.json();
        setMessages(data);
        if (data.length > 0) setPhase("chat");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [sessionId, token]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  useEffect(() => {
    if (phase === "chat") {
      const interval = setInterval(() => fetchMessages(true), 15000);
      return () => clearInterval(interval);
    }
  }, [phase, fetchMessages]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const sendMessage = async (text: string, name: string) => {
    if (!text.trim() || !name.trim()) return;
    setSending(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["x-customer-token"] = token;
      const res = await fetch(`${getBaseUrl()}/api/contact`, {
        method: "POST",
        headers,
        body: JSON.stringify({ customerName: name.trim(), message: text.trim(), sessionId }),
      });
      if (res.ok) {
        const created: ChatMsg = await res.json();
        setMessages(prev => [...prev, created]);
        setMsgInput("");
        setPhase("chat");
      }
    } finally {
      setSending(false);
    }
  };

  const handleStart = () => {
    const name = user ? user.name : nameInput.trim();
    sendMessage(msgInput, name);
  };

  const handleSend = () => sendMessage(msgInput, user?.name ?? nameInput);

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.primary }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={22} color="#fff" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>فريق الدعم</Text>
          <Text style={styles.headerSub}>يرد عادةً خلال ساعات</Text>
        </View>
        <Pressable onPress={() => fetchMessages(true)} style={styles.backBtn}>
          <Feather name="refresh-cw" size={18} color="rgba(255,255,255,0.8)" />
        </Pressable>
      </View>

      {phase === "intro" && !loading ? (
        <ScrollView
          contentContainerStyle={{ padding: 16, flexGrow: 1, justifyContent: "center" }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Welcome bubble */}
          <View style={styles.welcomeRow}>
            <View style={[styles.bubble, styles.agentBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.agentBadge}>
                <Feather name="zap" size={10} color={colors.primary} />
                <Text style={[styles.agentLabel, { color: colors.primary }]}>فريق الدعم</Text>
              </View>
              <Text style={[styles.bubbleText, { color: colors.foreground }]}>
                مرحباً! كيف يمكنني مساعدتك اليوم؟ يسعدنا الإجابة على جميع أسئلتك حول سماد الديدان.
              </Text>
            </View>
          </View>

          <View style={{ gap: 10, marginTop: 24 }}>
            {!user && (
              <View style={[styles.nameInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="user" size={16} color={colors.mutedForeground} />
                <TextInput
                  value={nameInput}
                  onChangeText={setNameInput}
                  placeholder="اسمك الكامل..."
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.inputText, { color: colors.foreground }]}
                />
              </View>
            )}
            {user && (
              <View style={[styles.nameInput, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
                <Feather name="user" size={16} color={colors.primary} />
                <Text style={[styles.inputText, { color: colors.primary, fontWeight: "600" }]}>{user.name}</Text>
              </View>
            )}
            <View style={[styles.msgInputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                value={msgInput}
                onChangeText={setMsgInput}
                placeholder="اكتب سؤالك هنا..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                style={[styles.msgInput, { color: colors.foreground }]}
              />
              <Pressable
                onPress={handleStart}
                disabled={sending || !msgInput.trim() || (!user && !nameInput.trim())}
                style={[styles.sendBtn, { backgroundColor: colors.primary, opacity: (!msgInput.trim() || (!user && !nameInput.trim())) ? 0.5 : 1 }]}
              >
                {sending
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Feather name="send" size={18} color="#fff" />
                }
              </Pressable>
            </View>
          </View>
        </ScrollView>
      ) : (
        <>
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, gap: 12 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Welcome msg */}
            <View style={styles.welcomeRow}>
              <View style={[styles.bubble, styles.agentBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.agentBadge}>
                  <Feather name="zap" size={10} color={colors.primary} />
                  <Text style={[styles.agentLabel, { color: colors.primary }]}>فريق الدعم</Text>
                </View>
                <Text style={[styles.bubbleText, { color: colors.foreground }]}>
                  مرحباً! يسعدنا خدمتك. نحاول الرد في أسرع وقت ممكن.
                </Text>
              </View>
            </View>

            {loading && messages.length === 0 && (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
            )}

            {messages.map((msg) => (
              <View key={msg.id} style={{ gap: 8 }}>
                {/* Customer message */}
                <View style={styles.customerRow}>
                  <View style={[styles.bubble, styles.customerBubble, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.bubbleText, { color: "#fff" }]}>{msg.message}</Text>
                    <Text style={styles.customerTime}>{formatTime(msg.createdAt)}</Text>
                  </View>
                </View>
                {/* Admin reply */}
                {msg.adminReply && (
                  <View style={styles.welcomeRow}>
                    <View style={[styles.bubble, styles.agentBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <View style={styles.agentBadge}>
                        <Feather name="zap" size={10} color={colors.primary} />
                        <Text style={[styles.agentLabel, { color: colors.primary }]}>فريق الدعم</Text>
                      </View>
                      <Text style={[styles.bubbleText, { color: colors.foreground }]}>{msg.adminReply}</Text>
                      <Text style={[styles.agentTime, { color: colors.mutedForeground }]}>{formatTime(msg.createdAt)}</Text>
                    </View>
                  </View>
                )}
              </View>
            ))}

            {messages.length > 0 && !messages[messages.length - 1].adminReply && (
              <Text style={[styles.waitingText, { color: colors.mutedForeground }]}>في انتظار الرد...</Text>
            )}
          </ScrollView>

          {/* Input bar */}
          <View style={[styles.inputBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom + 8 }]}>
            <Pressable
              onPress={() => fetchMessages(true)}
              style={[styles.refreshMini, { backgroundColor: colors.background, borderColor: colors.border }]}
            >
              <Feather name="refresh-cw" size={16} color={colors.mutedForeground} />
            </Pressable>
            <TextInput
              value={msgInput}
              onChangeText={setMsgInput}
              placeholder="رسالتك..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              style={[styles.barInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
            />
            <Pressable
              onPress={handleSend}
              disabled={sending || !msgInput.trim()}
              style={[styles.sendBtn, { backgroundColor: colors.primary, opacity: !msgInput.trim() ? 0.5 : 1 }]}
            >
              {sending
                ? <ActivityIndicator size="small" color="#fff" />
                : <Feather name="send" size={18} color="#fff" />
              }
            </Pressable>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  headerSub: { color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 1 },
  welcomeRow: { alignItems: "flex-end" },
  customerRow: { alignItems: "flex-start" },
  bubble: { maxWidth: "80%", borderRadius: 18, padding: 12, gap: 4 },
  agentBubble: { borderRadius: 18, borderTopRightRadius: 4, borderWidth: 1 },
  customerBubble: { borderRadius: 18, borderTopLeftRadius: 4 },
  agentBadge: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 },
  agentLabel: { fontSize: 10, fontWeight: "700" },
  bubbleText: { fontSize: 14, lineHeight: 21, textAlign: "right" },
  customerTime: { color: "rgba(255,255,255,0.6)", fontSize: 10, textAlign: "left", marginTop: 2 },
  agentTime: { fontSize: 10, textAlign: "right", marginTop: 2 },
  waitingText: { fontSize: 12, textAlign: "center", fontStyle: "italic", marginTop: 4 },
  nameInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputText: { flex: 1, fontSize: 14, textAlign: "right" },
  msgInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    padding: 8,
  },
  msgInput: { flex: 1, fontSize: 14, textAlign: "right", minHeight: 44, maxHeight: 100, paddingHorizontal: 8 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  refreshMini: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
  barInput: {
    flex: 1, borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, textAlign: "right", maxHeight: 100,
  },
});

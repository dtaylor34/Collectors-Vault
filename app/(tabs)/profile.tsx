import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { trustLevels, THEME_OPTIONS, type ThemeMode } from '../../lib/theme';
import { METROS } from '../../lib/data';
import { useTheme } from '../../hooks/useTheme';

export default function ProfileScreen() {
  const { mode, colors, setMode } = useTheme();
  const [metro, setMetro] = useState('sf-bay');
  const [showMetroPicker, setShowMetroPicker] = useState(false);

  const user = {
    vaultId: 'Vault #8847',
    trustLevel: 1,
    transactions: 2,
    memberSince: '2026-01',
    collections: 2,
    items: 7,
    connections: 0,
  };

  const trust = trustLevels[user.trustLevel];
  const currentMetro = METROS.find(m => m.id === metro);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={{ paddingHorizontal: 16 }} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ paddingTop: 16, marginBottom: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: '900', color: colors.textPrimary }}>Your Vault</Text>
        </View>

        {/* Identity card */}
        <View style={{
          padding: 20, borderRadius: 14, marginBottom: 14,
          backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.borderSubtle,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{
              width: 52, height: 52, borderRadius: 26, borderWidth: 2,
              alignItems: 'center', justifyContent: 'center',
              borderColor: trust.color + '60', backgroundColor: trust.color + '15',
            }}>
              <Text style={{ fontSize: 24, color: trust.color }}>{trust.icon}</Text>
            </View>
            <View>
              <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary, fontFamily: 'Courier' }}>{user.vaultId}</Text>
              <Text style={{ fontSize: 11, color: trust.color, fontWeight: '600' }}>{trust.name}</Text>
              <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>Member since {user.memberSince}</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 20 }}>
          {[
            { num: user.transactions, label: 'Deals' },
            { num: user.collections, label: 'Collections' },
            { num: user.items, label: 'Items' },
            { num: user.connections, label: 'Connected' },
          ].map(s => (
            <View key={s.label} style={{
              flex: 1, padding: 10, borderRadius: 10, alignItems: 'center',
              backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder,
            }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary }}>{s.num}</Text>
              <Text style={{ fontSize: 9, color: colors.textMuted, marginTop: 2 }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Trust level progress */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1, marginBottom: 10 }}>TRUST LEVEL</Text>
          {trustLevels.map((tl, i) => {
            const isActive = i <= user.trustLevel;
            const isCurrent = i === user.trustLevel;
            return (
              <View key={tl.level} style={{
                flexDirection: 'row', alignItems: 'center', gap: 10,
                padding: 10, borderRadius: 8, marginBottom: 4,
                borderWidth: isCurrent ? 1 : 0,
                borderColor: isCurrent ? tl.color + '40' : 'transparent',
                backgroundColor: isCurrent ? tl.color + '08' : 'transparent',
              }}>
                <View style={{
                  width: 8, height: 8, borderRadius: 4,
                  backgroundColor: isActive ? tl.color : colors.textDark,
                }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: isActive ? '700' : '500', color: isActive ? tl.color : colors.textMuted }}>
                    {tl.icon} {tl.name}
                  </Text>
                  <Text style={{ fontSize: 10, color: colors.textMuted }}>{tl.desc}</Text>
                </View>
                {isCurrent && (
                  <View style={{ paddingVertical: 2, paddingHorizontal: 8, borderRadius: 4, backgroundColor: tl.color + '15', borderWidth: 1, borderColor: tl.color + '30' }}>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: tl.color }}>CURRENT</Text>
                  </View>
                )}
                {isActive && !isCurrent && (
                  <Text style={{ fontSize: 10, color: colors.green }}>✓</Text>
                )}
              </View>
            );
          })}
        </View>

        {/* Theme selector */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1, marginBottom: 10 }}>APPEARANCE</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {THEME_OPTIONS.map(opt => {
              const isActive = mode === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => setMode(opt.id)}
                  style={{
                    flex: 1, padding: 14, borderRadius: 12, alignItems: 'center',
                    backgroundColor: isActive ? colors.gold + '12' : colors.surface,
                    borderWidth: 1.5,
                    borderColor: isActive ? colors.gold : colors.surfaceBorder,
                  }}
                >
                  <Text style={{ fontSize: 22, marginBottom: 6 }}>{opt.icon}</Text>
                  <Text style={{
                    fontSize: 12, fontWeight: '700',
                    color: isActive ? colors.gold : colors.textPrimary,
                  }}>{opt.label}</Text>
                  <Text style={{ fontSize: 9, color: colors.textMuted, marginTop: 2, textAlign: 'center' }}>
                    {opt.desc}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Location */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1, marginBottom: 10 }}>YOUR METRO AREA</Text>
          <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 10 }}>
            Other users see your metro area — never your exact location.
          </Text>

          <TouchableOpacity
            onPress={() => setShowMetroPicker(!showMetroPicker)}
            style={{
              flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              padding: 14, borderRadius: 10,
              backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>
              📍 {currentMetro?.label}, {currentMetro?.state}
            </Text>
            <Text style={{ fontSize: 11, color: colors.textMuted }}>{showMetroPicker ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {showMetroPicker && (
            <View style={{ marginTop: 6, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: colors.surfaceBorder }}>
              {METROS.map(m => (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => { setMetro(m.id); setShowMetroPicker(false); }}
                  style={{
                    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                    padding: 12, borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder,
                    backgroundColor: m.id === metro ? colors.gold + '10' : colors.surface,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: m.id === metro ? '700' : '400', color: m.id === metro ? colors.gold : colors.textPrimary }}>
                    {m.label}, {m.state}
                  </Text>
                  <Text style={{ fontSize: 9, color: colors.textMuted }}>{m.region}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Anonymity info */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1, marginBottom: 10 }}>YOUR PRIVACY</Text>
          <View style={{
            padding: 16, borderRadius: 12,
            backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.borderSubtle,
          }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 }}>🔒 You are anonymous</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 18 }}>
              Other users only see your Vault ID, trust level, and metro area. Your real name and email are encrypted and never shown to anyone.
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 18, marginTop: 8 }}>
              When you accept a connection request, you can choose to share your real name with that specific user.
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={{ marginBottom: 20 }}>
          <TouchableOpacity style={{
            padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 8,
            backgroundColor: colors.gold + '12', borderWidth: 1.5, borderColor: colors.gold + '40',
          }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.gold }}>⚡ Upgrade to Pro — $4.99/mo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{
            padding: 16, borderRadius: 12, alignItems: 'center',
            borderWidth: 1, borderColor: colors.red + '30',
          }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.red }}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

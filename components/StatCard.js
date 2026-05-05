import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import COLORS from '../constants/colors';

const StatCard = ({ icon, label, value, color, bg }) => (
  <View style={[S.statCard, { backgroundColor: bg }]}>
    <Text style={{ fontSize: 20, marginBottom: 4 }}>{icon}</Text>
    <Text style={[S.statValue, { color }]}>{value}</Text>
    <Text style={S.statLabel}>{label}</Text>
  </View>
);

const S = StyleSheet.create({
  statCard: { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '900', marginBottom: 3 },
  statLabel: { fontSize: 10, color: COLORS.textLight, fontWeight: '700', textAlign: 'center', letterSpacing: 0.2 },
});

export default StatCard;

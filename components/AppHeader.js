import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import COLORS from '../constants/colors';

const AppHeader = ({ emoji, title, subtitle, onProfile, accent = COLORS.primaryMid, currentUser }) => (
  <View style={[S.appHeader, { borderBottomColor: COLORS.borderLight }]}>
    <View style={S.headerLeft}>
      <View style={[S.headerIconBox, { backgroundColor: accent + '18' }]}>
        <Text style={{ fontSize: 22 }}>{emoji}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={S.headerGreeting}>{title}</Text>
        <Text style={[S.headerSubtitle, { color: accent }]}>{subtitle}</Text>
      </View>
    </View>
    {onProfile && (
      <TouchableOpacity onPress={onProfile} style={[S.avatarBtn, { backgroundColor: accent + '18' }]}>
        <Text style={[S.avatarBtnText, { color: accent }]}>
          {currentUser?.name?.charAt(0)?.toUpperCase() || '?'}
        </Text>
      </TouchableOpacity>
    )}
  </View>
);

const S = StyleSheet.create({
  appHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 58, paddingBottom: 16, backgroundColor: COLORS.surface, borderBottomWidth: 1 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  headerIconBox: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  headerGreeting: { fontSize: 17, fontWeight: '700', color: COLORS.text, letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 12, fontWeight: '600', marginTop: 2, letterSpacing: 0.2 },
  avatarBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  avatarBtnText: { fontSize: 17, fontWeight: '800' },
});

export default AppHeader;

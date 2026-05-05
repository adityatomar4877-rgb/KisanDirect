import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import COLORS from '../constants/colors';

const SectionHeader = ({ title, action, onAction, roleColor }) => (
  <View style={S.sectionHeader}>
    <Text style={S.sectionTitle}>{title}</Text>
    {action && (
      <TouchableOpacity onPress={onAction}>
        <Text style={[S.sectionAction, { color: roleColor || COLORS.primaryMid }]}>{action}</Text>
      </TouchableOpacity>
    )}
  </View>
);

const S = StyleSheet.create({
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text, letterSpacing: -0.3 },
  sectionAction: { fontSize: 13, fontWeight: '700' },
});

export default SectionHeader;

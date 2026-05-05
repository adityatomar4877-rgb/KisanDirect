import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import S from '../constants/styles';

const BackHeader = ({ title, onBack, rightAction }) => (
  <View style={S.backHeader}>
    <TouchableOpacity onPress={onBack} style={S.backBtn2} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
      <Text style={S.backArrow}>‹</Text>
    </TouchableOpacity>
    <Text style={S.backTitle} numberOfLines={1}>{title}</Text>
    {rightAction || <View style={{ width: 40 }} />}
  </View>
);

export default BackHeader;

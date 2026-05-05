// screens/AICropRec.js — KisanDirect
// NOTE: This screen receives state from AppNavigator.js via props.
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Image, Alert, ActivityIndicator, Platform, StatusBar, Dimensions, Animated } from 'react-native';
import { MapPin, Search, Plus, Star, ShieldCheck, CheckCircle2, Clock, Truck, Mic, Image as ImageIcon, TrendingUp, Package, Users, BarChart2 } from 'lucide-react-native';
import Svg, { Path, Circle, Line, Text as SvgText, Polyline, Defs, LinearGradient, Stop } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { addListing, updateOrderStatus, sendNegotiationMessage, listenNegotiationMessages, placeOrder as fbPlaceOrder } from '../services/firebase';
import COLORS from '../constants/colors';
import S from '../constants/styles';
import { COMMODITY_MAP, MOCK_PRICE_DATA, MONTHS } from '../constants/data';
import { fetchMandiPrice, DEFAULT_DISTRICT } from '../services/mandiApi';
import BackHeader from '../components/BackHeader';
import SectionHeader from '../components/SectionHeader';
import StatCard from '../components/StatCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

  // â”€â”€â”€ SCREEN: AI CROP RECOMMENDATION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function AICropRec({ t, navigateTo, soilType, setSoilType, season, setSeason, aiResult, setAiResult, aiLoading, setAiLoading }) {
    const soilOptions = ['Clay', 'Loamy', 'Sandy', 'Silty', 'Black'];
    const seasonOptions = [t('Kharif (Jun–Oct)', 'खरीफ (जून–अक्टू)'), t('Rabi (Nov–Mar)', 'रबी (नव–मार्च)'), t('Zaid (Mar–Jun)', 'जायद (मार्च–जून)')];
    const cropRecs = {
      'Clay-Kharif (Jun–Oct)': ['🌾 Rice', '🥜 Peanuts', '🌽 Maize'],
      'Clay-Rabi (Nov–Mar)': ['🌿 Wheat', '🥬 Mustard', '🧅 Onion'],
      'Clay-Zaid (Mar–Jun)': ['🥒 Cucumber', '🍉 Watermelon', '🌽 Maize'],
      'Loamy-Kharif (Jun–Oct)': ['🍅 Tomato', '🌽 Maize', '🫘 Soybean'],
      'Loamy-Rabi (Nov–Mar)': ['🥕 Carrot', '🌿 Wheat', '🫛 Peas'],
      'Loamy-Zaid (Mar–Jun)': ['🫑 Capsicum', '🥒 Cucumber', '🥜 Peanuts'],
      'Sandy-Kharif (Jun–Oct)': ['🥜 Peanuts', '🫘 Cowpea', '🌻 Sunflower'],
      'Sandy-Rabi (Nov–Mar)': ['🥔 Potato', '🫛 Peas', '🌿 Barley'],
      'Sandy-Zaid (Mar–Jun)': ['🍉 Watermelon', '🥒 Cucumber', '🌻 Sunflower'],
      'Silty-Kharif (Jun–Oct)': ['🍅 Tomato', '🌾 Rice', '🥒 Cucumber'],
      'Silty-Rabi (Nov–Mar)': ['🌿 Wheat', '🥬 Spinach', '🧅 Onion'],
      'Silty-Zaid (Mar–Jun)': ['🥬 Spinach', '🫑 Capsicum', '🫛 Peas'],
      'Black-Kharif (Jun–Oct)': ['🪴 Cotton', '🫘 Soybean', '🌻 Sunflower'],
      'Black-Rabi (Nov–Mar)': ['🌿 Wheat', '🥬 Mustard', '🫛 Chickpea'],
      'Black-Zaid (Mar–Jun)': ['🫘 Mung Bean', '🥜 Peanuts', '🌽 Maize'],
    };

    const getRecommendation = () => {
      if (!soilType || !season) {
        Alert.alert(t('Missing Info', 'जानकारी ज़रूरी'), t('Please select soil type and season.', 'कृपया मिट्टी का प्रकार और मौसम चुनें।'));
        return;
      }
      setAiLoading(true);
      setTimeout(() => {
        const seasonKey = season.includes('Kharif') || season.includes('खरीफ') ? 'Kharif (Jun–Oct)'
          : season.includes('Rabi') || season.includes('रबी') ? 'Rabi (Nov–Mar)' : 'Zaid (Mar–Jun)';
        const key = `${soilType}-${seasonKey}`;
        const found = cropRecs[key] || ['🌽 Maize', '🌿 Wheat', '🥜 Peanuts'];
        setAiResult(found);
        setAiLoading(false);
      }, 1500);
    };

    return (
      <View style={S.screen}>
        <BackHeader title={t('AI Crop Recommendation', 'AI फसल सुझाव')} onBack={() => { setAiResult(null); navigateTo('farmerDashboard'); }} />
        <ScrollView contentContainerStyle={S.scrollPad} showsVerticalScrollIndicator={false}>
          <View style={[S.infoBox, { backgroundColor: COLORS.primaryBg, marginBottom: 24 }]}>
            <Text style={[S.infoBoxTitle, { color: COLORS.primaryMid }]}>🌱 {t('How it works', 'यह कैसे काम करता है')}</Text>
            <Text style={[S.infoBoxText, { color: COLORS.primaryMid }]}>{t('Select your soil type and season. Our AI suggests the best crops for maximum yield.', 'मिट्टी का प्रकार और मौसम चुनें। AI सर्वश्रेष्ठ फसल सुझाएगा।')}</Text>
          </View>
          <Text style={S.inputLabel}>{t('Soil Type', 'मिट्टी का प्रकार')}</Text>
          <View style={S.chipRow}>
            {soilOptions.map(s => (
              <TouchableOpacity key={s} style={[S.chip, soilType === s && S.chipActive]} onPress={() => { setSoilType(s); setAiResult(null); }}>
                <Text style={[S.chipText, soilType === s && S.chipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[S.inputLabel, { marginTop: 20 }]}>{t('Season', 'मौसम')}</Text>
          <View style={S.chipRow}>
            {seasonOptions.map(s => (
              <TouchableOpacity key={s} style={[S.chip, season === s && S.chipActive]} onPress={() => { setSeason(s); setAiResult(null); }}>
                <Text style={[S.chipText, season === s && S.chipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={[S.primaryBtn, { marginTop: 28 }]} onPress={getRecommendation} activeOpacity={0.88}>
            {aiLoading ? <ActivityIndicator color="#fff" /> : <Text style={S.primaryBtnText}>{t('Get AI Recommendation', 'AI सुझाव पाएं')}</Text>}
          </TouchableOpacity>
          {aiResult && (
            <View style={{ marginTop: 28 }}>
              <SectionHeader title={t('Recommended Crops', 'अनुशंसित फसलें')} />
              {aiResult.map((crop, i) => (
                <View key={i} style={[S.recCard, i === 0 && { borderColor: COLORS.primaryLight, borderWidth: 1.5 }]}>
                  <Text style={{ fontSize: 34, marginRight: 14 }}>{crop.split(' ')[0]}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={S.recCardName}>{crop.split(' ').slice(1).join(' ')}</Text>
                    <Text style={S.recCardDesc}>
                      {i === 0 ? t('Best match for your conditions', 'आपकी स्थितियों के लिए सर्वश्रेष्ठ')
                        : i === 1 ? t('Good alternative', 'अच्छा विकल्प') : t('Backup option', 'बैकअप विकल्प')}
                    </Text>
                  </View>
                  {i === 0 && <View style={[S.pillBadge, { backgroundColor: COLORS.accent }]}><Text style={[S.pillBadgeText, { color: '#fff' }]}>★ BEST</Text></View>}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    );
}


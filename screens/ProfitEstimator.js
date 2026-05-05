// screens/ProfitEstimator.js — KisanDirect
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

  // â”€â”€â”€ SCREEN: PROFIT ESTIMATOR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function ProfitEstimator({ t, navigateTo, cropType, setCropType, areaAcres, setAreaAcres, seedCost, setSeedCost, fertCost, setFertCost, profitResult, setProfitResult, livePrice, selectedPriceCrop }) {
    const allCrops = ['Tomato', 'Wheat', 'Rice', 'Potato', 'Onion', 'Garlic', 'Soybean', 'Mustard', 'Cotton', 'Cauliflower', 'Chilli', 'Maize'];
    const yieldPerAcre = { Tomato: 8000, Wheat: 1800, Rice: 2200, Potato: 10000, Onion: 12000, Garlic: 3000, Soybean: 1200, Mustard: 900, Cotton: 600, Cauliflower: 15000, Chilli: 2500, Maize: 2500 };
    const pricePerKg = { Tomato: 40, Wheat: 22, Rice: 35, Potato: 25, Onion: 30, Garlic: 110, Soybean: 48, Mustard: 62, Cotton: 65, Cauliflower: 25, Chilli: 100, Maize: 18 };

    const calculateProfit = () => {
      const area = parseFloat(areaAcres) || 0;
      const seed = parseFloat(seedCost) || 0;
      const fert = parseFloat(fertCost) || 0;
      if (!area || !cropType) {
        Alert.alert(t('Missing Info', 'जानकारी ज़रूरी'), t('Please select a crop and fill all fields.', 'कृपया फसल चुनें और सभी फ़ील्ड भरें।'));
        return;
      }
      const livePriceForCrop = (livePrice && selectedPriceCrop === cropType) ? livePrice.modal_price : null;
      const effectivePrice = livePriceForCrop || pricePerKg[cropType] || 30;
      const y = (yieldPerAcre[cropType] || 5000) * area;
      const revenue = y * effectivePrice;
      const totalCost = (seed + fert) * area;
      const labour = area * 3000;
      const profit = revenue - totalCost - labour;
      setProfitResult({ revenue, totalCost, labour, profit, yield: y, usedLivePrice: !!livePriceForCrop, effectivePrice });
    };

    return (
      <View style={S.screen}>
        <BackHeader title={t('Profit Estimator', 'लाभ अनुमानक')} onBack={() => { setProfitResult(null); navigateTo('farmerDashboard'); }} />
        <ScrollView contentContainerStyle={S.scrollPad} showsVerticalScrollIndicator={false}>
          <Text style={S.inputLabel}>{t('Select Crop', 'फसल चुनें')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8, marginTop: 8 }}>
            {allCrops.map(c => (
              <TouchableOpacity key={c} style={[S.chip, { marginRight: 10 }, cropType === c && S.chipActive]} onPress={() => { setCropType(c); setProfitResult(null); }}>
                <Text style={[S.chipText, cropType === c && S.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={[S.formCard, { marginTop: 16 }]}>
            <Text style={S.inputLabel}>{t('Land Area (acres)', 'जमीन (एकड़)')}</Text>
            <TextInput style={S.input} keyboardType="numeric" placeholder="e.g. 2" placeholderTextColor={COLORS.textLight} value={areaAcres} onChangeText={v => { setAreaAcres(v); setProfitResult(null); }} />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={S.inputLabel}>{t('Seed Cost (₹/acre)', 'बीज लागत')}</Text>
                <TextInput style={S.input} keyboardType="numeric" placeholder="2000" placeholderTextColor={COLORS.textLight} value={seedCost} onChangeText={v => { setSeedCost(v); setProfitResult(null); }} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.inputLabel}>{t('Fertilizer (₹/acre)', 'खाद लागत')}</Text>
                <TextInput style={S.input} keyboardType="numeric" placeholder="1500" placeholderTextColor={COLORS.textLight} value={fertCost} onChangeText={v => { setFertCost(v); setProfitResult(null); }} />
              </View>
            </View>
          </View>
          <TouchableOpacity style={S.primaryBtn} onPress={calculateProfit} activeOpacity={0.88}>
            <Text style={S.primaryBtnText}>{t('Calculate Profit', 'लाभ की गणना करें')}</Text>
          </TouchableOpacity>
          {profitResult && (
            <View style={{ marginTop: 28 }}>
              {profitResult.usedLivePrice && (
                <View style={[S.infoBox, { flexDirection: 'row', alignItems: 'center', marginBottom: 12 }]}>
                  <View style={S.liveDot} />
                  <Text style={[S.infoBoxText, { marginLeft: 8 }]}>{t(`Using live mandi price ₹${profitResult.effectivePrice}/kg`, `लाइव मंडी भाव ₹${profitResult.effectivePrice}/किलो`)}</Text>
                </View>
              )}
              <SectionHeader title={t('Profit Breakdown', 'लाभ का विवरण')} />
              <View style={S.formCard}>
                {[
                  { label: t('Expected Yield', 'अपेक्षित उपज'), value: `${profitResult.yield.toLocaleString()} kg`, color: COLORS.text },
                  { label: t('Estimated Revenue', 'अनुमानित राजस्व'), value: `₹ ${profitResult.revenue.toLocaleString()}`, color: COLORS.primaryMid },
                  { label: t('Input Costs', 'इनपुट लागत'), value: `− ₹ ${profitResult.totalCost.toLocaleString()}`, color: COLORS.danger },
                  { label: t('Labour Cost', 'श्रम लागत'), value: `− ₹ ${profitResult.labour.toLocaleString()}`, color: COLORS.danger },
                ].map((row, i) => (
                  <View key={i} style={[S.breakdownRow, { borderBottomWidth: i < 3 ? 1 : 0, borderBottomColor: COLORS.borderLight }]}>
                    <Text style={S.breakdownLabel}>{row.label}</Text>
                    <Text style={[S.breakdownValue, { color: row.color }]}>{row.value}</Text>
                  </View>
                ))}
                <View style={[S.profitSummary, { backgroundColor: profitResult.profit >= 0 ? COLORS.primaryBg : COLORS.dangerLight }]}>
                  <Text style={S.profitSummaryLabel}>{t('Net Profit', 'शुद्ध लाभ')}</Text>
                  <Text style={[S.profitSummaryValue, { color: profitResult.profit >= 0 ? COLORS.primaryMid : COLORS.danger }]}>
                    {profitResult.profit >= 0 ? '+' : ''}₹ {Math.abs(profitResult.profit).toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    );
}


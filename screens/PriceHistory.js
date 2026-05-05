// screens/PriceHistory.js — KisanDirect
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

  // â”€â”€â”€ SCREEN: PRICE HISTORY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function PriceHistory({
  t, navigateTo,
  priceData,
  selectedPriceCrop, setSelectedPriceCrop,
  livePrice, livePriceLoading, livePriceError,
  aiSellAdvice, setAiSellAdvice,
  aiSellLoading, setAiSellLoading,
  fetchLivePrice
}) {
    const CROPS = ['Tomato', 'Wheat', 'Onion', 'Potato', 'Maize', 'Rice', 'Garlic', 'Soybean', 'Mustard', 'Cotton', 'Cauliflower', 'Chilli'];
    const CROP_EMOJI = { Tomato: '🍅', Wheat: '🌾', Onion: '🧅', Potato: '🥔', Maize: '🌽', Rice: '🍚', Garlic: '🧄', Soybean: '🫘', Mustard: '🌻', Cotton: '🪴', Cauliflower: '🥦', Chilli: '🌶️' };

    const prices = priceData[selectedPriceCrop] || MOCK_PRICE_DATA[selectedPriceCrop];
    const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const currentPrice = livePrice ? Math.round(livePrice.modal_price) : prices[prices.length - 1];
    const prevPrice = prices[prices.length - 2];
    const recentTrend = prices[7] - prices[5];

    const CHART_W = SCREEN_WIDTH - 80;
    const CHART_H = 160;
    const PAD_L = 36, PAD_R = 12, PAD_T = 16, PAD_B = 28;
    const plotW = CHART_W - PAD_L - PAD_R;
    const plotH = CHART_H - PAD_T - PAD_B;
    const range = maxPrice - minPrice || 1;
    const px = (i) => PAD_L + (i / (prices.length - 1)) * plotW;
    const py = (v) => PAD_T + plotH - ((v - minPrice) / range) * plotH;
    const points = prices.map((v, i) => `${px(i)},${py(v)}`).join(' ');
    const areaPath = `M ${px(0)},${py(prices[0])} ` + prices.slice(1).map((v, i) => `L ${px(i + 1)},${py(v)}`).join(' ') + ` L ${px(prices.length - 1)},${PAD_T + plotH} L ${px(0)},${PAD_T + plotH} Z`;
    const yTicks = [minPrice, Math.round((minPrice + maxPrice) / 2), maxPrice];

    const getAiAdvice = () => {
      setAiSellLoading(true); setAiSellAdvice(null);
      setTimeout(() => {
        const pctAboveAvg = ((currentPrice - avgPrice) / avgPrice) * 100;
        let action, reason, color, emoji;
        if (pctAboveAvg >= 15 && recentTrend <= 0) {
          action = t('SELL NOW', 'अभी बेचें'); emoji = '🟢'; color = COLORS.success;
          reason = t(`Price is ₹${currentPrice}/quintal — ${Math.round(pctAboveAvg)}% above the 8-month average. Strong selling window.`, `कीमत ₹${currentPrice}/क्विंटल — औसत से ${Math.round(pctAboveAvg)}% अधिक। बेचने का अच्छा समय।`);
        } else if (recentTrend > 5 && pctAboveAvg < 20) {
          action = t('WAIT & WATCH', 'रुकें और देखें'); emoji = '🟡'; color = COLORS.warning;
          reason = t('Price is rising. Hold for 2–3 weeks for a better rate.', 'कीमत बढ़ रही है। 2–3 सप्ताह और रुकें।');
        } else if (pctAboveAvg < -10 || recentTrend < -10) {
          action = t('SELL SOON', 'जल्दी बेचें'); emoji = '🔴'; color = COLORS.danger;
          reason = t(`Price is falling at ₹${currentPrice}/quintal. Sell now to avoid further loss.`, 'कीमत गिर रही है। नुकसान से बचने के लिए अभी बेचें।');
        } else {
          action = t('HOLD FOR NOW', 'अभी रोकें'); emoji = '🟡'; color = '#E65100';
          reason = t(`Price is stable at ₹${currentPrice}/quintal. Monitor for 1–2 more weeks.`, 'कीमत स्थिर है। 1–2 सप्ताह और देखें।');
        }
        setAiSellAdvice({ action, reason, color, emoji });
        setAiSellLoading(false);
      }, 1800);
    };

    return (
      <View style={S.screen}>
        <BackHeader title={t('Price History', 'मूल्य इतिहास')} onBack={() => { setAiSellAdvice(null); navigateTo('farmerDashboard'); }} />
        <ScrollView contentContainerStyle={S.scrollPad} showsVerticalScrollIndicator={false}>
          <View style={S.livePriceCard}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <View style={[S.liveDot, livePriceLoading && { backgroundColor: COLORS.accent }]} />
                <Text style={S.livePriceLabel}>
                  {livePriceLoading ? t('Fetching live price…', 'लाइव भाव ला रहे हैं…')
                    : livePrice ? `Live · ${livePrice.market}` : t('Live Mandi Price (data.gov.in)', 'लाइव मंडी भाव')}
                </Text>
              </View>
              {livePriceLoading ? (
                <ActivityIndicator color={COLORS.primaryMid} size="small" style={{ alignSelf: 'flex-start' }} />
              ) : livePrice ? (
                <>
                  <Text style={S.livePriceValue}>₹{Math.round(livePrice.modal_price)}/quintal</Text>
                  <Text style={S.livePriceRange}>Min ₹{Math.round(livePrice.min_price)} · Max ₹{Math.round(livePrice.max_price)} · {livePrice.date}</Text>
                </>
              ) : livePriceError ? (
                <Text style={{ fontSize: 13, color: COLORS.danger, marginTop: 4 }}>{livePriceError}</Text>
              ) : null}
            </View>
            <TouchableOpacity style={S.refreshBtn} onPress={() => fetchLivePrice(selectedPriceCrop)} disabled={livePriceLoading}>
              <Text style={{ fontSize: 20 }}>🔄</Text>
            </TouchableOpacity>
          </View>

          <Text style={S.inputLabel}>{t('Select Crop', 'फसल चुनें')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20, marginTop: 8 }}>
            {CROPS.map(c => (
              <TouchableOpacity key={c} style={[S.chip, { marginRight: 10, flexDirection: 'row', gap: 6 }, selectedPriceCrop === c && S.chipActive]} onPress={() => { setSelectedPriceCrop(c); setAiSellAdvice(null); }}>
                <Text style={{ fontSize: 14 }}>{CROP_EMOJI[c]}</Text>
                <Text style={[S.chipText, selectedPriceCrop === c && S.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            {[
              { label: t('Live/Now', 'वर्तमान'), value: `₹${currentPrice}`, sub: `${currentPrice >= prevPrice ? '▲' : '▼'} ₹${Math.abs(currentPrice - prevPrice)}`, subColor: currentPrice >= prevPrice ? COLORS.success : COLORS.danger },
              { label: t('8m Avg', 'औसत'), value: `₹${avgPrice}`, sub: `${currentPrice >= avgPrice ? '+' : ''}${Math.round(((currentPrice - avgPrice) / avgPrice) * 100)}%`, subColor: currentPrice >= avgPrice ? COLORS.success : COLORS.danger },
              { label: t('High', 'उच्च'), value: `₹${maxPrice}`, sub: '', subColor: COLORS.success },
              { label: t('Low', 'न्यून'), value: `₹${minPrice}`, sub: '', subColor: COLORS.danger },
            ].map((s, i) => (
              <View key={i} style={S.priceStatCard}>
                <Text style={S.priceStatLabel}>{s.label}</Text>
                <Text style={S.priceStatValue}>{s.value}</Text>
                {s.sub ? <Text style={[S.priceStatChange, { color: s.subColor }]}>{s.sub}</Text> : null}
              </View>
            ))}
          </View>

          <View style={S.chartCard}>
            <Text style={S.chartTitle}>{CROP_EMOJI[selectedPriceCrop]} {selectedPriceCrop} — {t('Price Trend (₹/quintal)', 'मूल्य रुझान (₹/क्विंटल)')}</Text>
            <Svg width={CHART_W} height={CHART_H}>
              <Defs>
                <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={COLORS.primaryMid} stopOpacity="0.2" />
                  <Stop offset="100%" stopColor={COLORS.primaryMid} stopOpacity="0.02" />
                </LinearGradient>
              </Defs>
              {yTicks.map((tick, i) => (
                <Line key={i} x1={PAD_L} y1={py(tick)} x2={PAD_L + plotW} y2={py(tick)} stroke={COLORS.borderLight} strokeWidth="1" strokeDasharray="4,4" />
              ))}
              {yTicks.map((tick, i) => (
                <SvgText key={i} x={PAD_L - 4} y={py(tick) + 4} fontSize="10" fill={COLORS.textLight} textAnchor="end">{tick}</SvgText>
              ))}
              {MONTHS.map((m, i) => (
                <SvgText key={i} x={px(i)} y={CHART_H - 4} fontSize="9" fill={COLORS.textLight} textAnchor="middle">{m}</SvgText>
              ))}
              <Path d={areaPath} fill="url(#areaGrad)" />
              <Polyline points={points} fill="none" stroke={COLORS.primaryMid} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
              {prices.map((v, i) => (
                <Circle key={i} cx={px(i)} cy={py(v)} r={i === prices.length - 1 ? 6 : 3.5}
                  fill={i === prices.length - 1 ? (livePrice ? '#E65100' : COLORS.primaryMid) : COLORS.surface}
                  stroke={i === prices.length - 1 ? (livePrice ? '#E65100' : COLORS.primaryMid) : COLORS.primaryMid}
                  strokeWidth="2" />
              ))}
              <SvgText x={px(prices.length - 1)} y={py(currentPrice) - 10} fontSize="11" fill={livePrice ? '#E65100' : COLORS.primaryMid} fontWeight="bold" textAnchor="middle">₹{currentPrice}</SvgText>
            </Svg>
          </View>

          <View style={[S.infoBox, { backgroundColor: COLORS.buyerBg, borderColor: COLORS.buyerMid + '30' }]}>
            <Text style={[S.infoBoxTitle, { color: COLORS.buyerMid }]}>🤖 {t('AI Sell Advisor', 'AI बिक्री सलाहकार')}</Text>
            <Text style={[S.infoBoxText, { color: COLORS.buyerMid, marginBottom: 14 }]}>{t(`Should you sell ${selectedPriceCrop} now?`, `क्या आपको अभी ${selectedPriceCrop} बेचना चाहिए?`)}</Text>
            <TouchableOpacity style={[S.primaryBtn, { backgroundColor: COLORS.buyerMid, marginTop: 0 }]} onPress={getAiAdvice} activeOpacity={0.88}>
              {aiSellLoading ? <ActivityIndicator color="#fff" /> : <Text style={S.primaryBtnText}>{t('Get AI Sell Advice', 'AI बिक्री सलाह पाएं')}</Text>}
            </TouchableOpacity>
          </View>

          {aiSellAdvice && (
            <View style={[S.aiResultCard, { borderColor: aiSellAdvice.color }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                <Text style={{ fontSize: 28 }}>{aiSellAdvice.emoji}</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 11, color: COLORS.textLight, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 3 }}>{t('AI Recommendation', 'AI सुझाव')}</Text>
                  <Text style={[S.aiAction, { color: aiSellAdvice.color }]}>{aiSellAdvice.action}</Text>
                </View>
              </View>
              <View style={{ height: 1, backgroundColor: COLORS.borderLight, marginHorizontal: 16 }} />
              <Text style={S.aiReason}>{aiSellAdvice.reason}</Text>
              <View style={[S.aiFooter, { backgroundColor: aiSellAdvice.color + '15' }]}>
                <Text style={{ fontSize: 12, color: aiSellAdvice.color, fontWeight: '700' }}>
                  {t('Current', 'वर्तमान')}: ₹{currentPrice}/quintal  •  8m {t('Avg', 'औसत')}: ₹{avgPrice}/quintal{livePrice ? `  •  Live ✓` : ''}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    );
}


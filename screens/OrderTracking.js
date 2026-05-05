// screens/OrderTracking.js — KisanDirect
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

  // â”€â”€â”€ SCREEN: ORDER TRACKING â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function OrderTracking({ t, navigateTo, orderPlaced, setOrderPlaced }) {
    const BC = COLORS.buyerMid;
    const order = orderPlaced || {
      farmer: { name: 'Ramesh Singh' },
      cropName: 'Tomatoes', cropEmoji: '🍅',
      qty: 20, pricePerKg: 38, total: 760, orderId: '#40291',
    };
    return (
      <View style={S.screen}>
        <BackHeader title={t('Order Status', 'ऑर्डर की स्थिति')} onBack={() => navigateTo('buyerMarketplace')} />
        <ScrollView contentContainerStyle={S.scrollPad} showsVerticalScrollIndicator={false}>
          <View style={[S.heroCard, { backgroundColor: BC }]}>
            <Text style={S.heroLabel}>{t('Order', 'ऑर्डर')} {order.orderId}</Text>
            <Text style={S.heroAmount}>₹ {order.total?.toLocaleString()}</Text>
            <Text style={[S.heroTrendText, { marginTop: 4 }]}>{order.qty} kg {order.cropEmoji} {order.cropName} · {order.farmer?.name}</Text>
          </View>
          <View style={S.formCard}>
            <View style={S.trackStep}>
              <View style={[S.trackDot, { backgroundColor: COLORS.primaryMid }]}><Text style={{ color: '#fff', fontSize: 12 }}>✓</Text></View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={S.trackTitle}>{t('Order Placed', 'ऑर्डर दिया गया')}</Text>
                <Text style={S.trackTime}>{t('Just now', 'अभी')}</Text>
              </View>
            </View>
            <View style={S.trackLine} />
            <View style={S.trackStep}>
              <View style={[S.trackDot, { backgroundColor: COLORS.borderLight }]}><Text style={{ color: COLORS.textLight, fontSize: 12 }}>⏳</Text></View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[S.trackTitle, { color: COLORS.textLight }]}>{t('Awaiting Farmer Confirmation', 'किसान की पुष्टि का इंतज़ार')}</Text>
                <Text style={S.trackTime}>{t('Pending', 'बाकी')}</Text>
              </View>
            </View>
            <View style={[S.trackLine, { backgroundColor: COLORS.borderLight }]} />
            <View style={S.trackStep}>
              <View style={[S.trackDot, { backgroundColor: COLORS.borderLight }]}><Text style={{ color: COLORS.textLight, fontSize: 12 }}>📦</Text></View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[S.trackTitle, { color: COLORS.textLight }]}>{t('Delivered', 'पहुंचाया')}</Text>
                <Text style={S.trackTime}>{t('Est. after confirmation', 'पुष्टि के बाद')}</Text>
              </View>
            </View>
          </View>
          <View style={[S.formCard, { marginTop: 12 }]}>
            <Text style={{ fontWeight: '700', color: COLORS.text, marginBottom: 8 }}>📋 {t('Order Summary', 'ऑर्डर सारांश')}</Text>
            <Text style={{ color: COLORS.textMid }}>🌾 {order.cropEmoji} {order.cropName} Ã— {order.qty} kg @ ₹{order.pricePerKg}/kg</Text>
            <Text style={{ color: COLORS.textMid, marginTop: 4 }}>👨🏽‍🌾 {order.farmer?.name}</Text>
            <Text style={{ color: BC, fontWeight: '800', fontSize: 18, marginTop: 8 }}>{t('Total', 'कुल')}: ₹{order.total?.toLocaleString()}</Text>
          </View>
          <TouchableOpacity style={[S.primaryBtn, { backgroundColor: BC }]} onPress={() => { setOrderPlaced(null); navigateTo('buyerMarketplace'); }} activeOpacity={0.88}>
            <Text style={S.primaryBtnText}>{t('Back to Market', 'बाज़ार वापस जाएँ')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
}


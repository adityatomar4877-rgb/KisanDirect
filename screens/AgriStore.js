// screens/AgriStore.js — KisanDirect
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

  // â”€â”€â”€ SCREEN: AGRI STORE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function AgriStore({ t, navigateTo, cart, setCart }) {
    const storeItems = [
      { id: 1, name: t('Hybrid Tomato Seeds', 'हाइब्रिड टमाटर के बीज'), price: 320, unit: '50g packet', emoji: '🌱', category: t('Seeds', 'बीज') },
      { id: 2, name: t('NPK Fertilizer', 'NPK खाद'), price: 850, unit: '25kg bag', emoji: '🧪', category: t('Fertilizer', 'खाद') },
      { id: 3, name: t('Hand Sprayer', 'हैंड स्प्रेयर'), price: 1200, unit: '1 piece', emoji: '💧', category: t('Equipment', 'उपकरण') },
      { id: 4, name: t('Sharbati Wheat Seeds', 'गेहूं बीज'), price: 280, unit: '5kg bag', emoji: '🌾', category: t('Seeds', 'बीज') },
      { id: 5, name: t('Organic Compost', 'जैविक खाद'), price: 400, unit: '10kg bag', emoji: '🌿', category: t('Fertilizer', 'खाद') },
      { id: 6, name: t('Irrigation Pipe', 'सिंचाई पाइप'), price: 550, unit: '50m roll', emoji: '🪣', category: t('Equipment', 'उपकरण') },
    ];
    const addToCart = (item) => {
      setCart(prev => {
        const exists = prev.find(c => c.id === item.id);
        if (exists) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
        return [...prev, { ...item, qty: 1 }];
      });
    };
    const cartTotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
    const cartCount = cart.reduce((sum, c) => sum + c.qty, 0);

    return (
      <View style={S.screen}>
        <BackHeader
          title={t('Agri Store', 'कृषि स्टोर')}
          onBack={() => navigateTo('farmerDashboard')}
          rightAction={cartCount > 0 ? (
            <TouchableOpacity
              onPress={() => Alert.alert(
                t('Your Cart', 'आपकी कार्ट'),
                cart.map(c => `${c.name} x${c.qty} = ₹${c.price * c.qty}`).join('\n') + `\n\n${t('Total', 'कुल')}: ₹${cartTotal.toLocaleString()}`,
                [{ text: t('Checkout', 'चेकआउट'), onPress: () => { setCart([]); Alert.alert('✅ ' + t('Order Placed!', 'ऑर्डर हो गया!')); } }, { text: t('Cancel', 'रद्द') }]
              )}
              style={{ position: 'relative' }}
            >
              <Text style={{ fontSize: 22 }}>🛒</Text>
              <View style={S.cartBadge}><Text style={S.cartBadgeText}>{cartCount}</Text></View>
            </TouchableOpacity>
          ) : <View style={{ width: 40 }} />}
        />
        <ScrollView contentContainerStyle={S.scrollPad} showsVerticalScrollIndicator={false}>
          <View style={S.storeGrid}>
            {storeItems.map((item) => {
              const inCart = cart.find(c => c.id === item.id);
              return (
                <View key={item.id} style={S.storeCard}>
                  <View style={S.storeEmojiBox}><Text style={{ fontSize: 32 }}>{item.emoji}</Text></View>
                  <Text style={S.storeCatLabel}>{item.category}</Text>
                  <Text style={S.storeItemName}>{item.name}</Text>
                  <Text style={S.storeUnit}>{item.unit}</Text>
                  <Text style={[S.storePrice, { color: COLORS.primaryMid }]}>₹ {item.price}</Text>
                  <TouchableOpacity
                    style={[S.addCartBtn, inCart && { backgroundColor: COLORS.primaryBg, borderColor: COLORS.primaryMid, borderWidth: 1 }]}
                    onPress={() => addToCart(item)}
                  >
                    <Text style={[S.addCartBtnText, inCart && { color: COLORS.primaryMid }]}>
                      {inCart ? `✓ ${t('Added', 'जोड़ा')} (${inCart.qty})` : `+ ${t('Add', 'जोड़ें')}`}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
}


// screens/ProfileScreen.js — KisanDirect
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

  // â”€â”€â”€ SCREEN: PROFILE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function ProfileScreen({ t, navigateTo, role, currentUser, myOrders, setMyOrders, marketListings, cart, setCart, handleLogout }) {
    const isFarmer = role === 'farmer';
    const isRetailer = role === 'retailer';
    const isBuyer = role === 'buyer';
    const backScreen = isFarmer ? 'farmerDashboard' : isRetailer ? 'retailerDashboard' : 'buyerMarketplace';
    const displayName = currentUser?.name || (isFarmer ? 'Farmer' : isRetailer ? 'Retailer' : 'Buyer');
    const displayPhone = currentUser?.phone ? `+91 ${currentUser.phone}` : '—';
    const accent = isFarmer ? COLORS.primaryMid : isRetailer ? COLORS.retailerMid : COLORS.buyerMid;
    const accentBg = isFarmer ? COLORS.primaryBg : isRetailer ? COLORS.retailerBg : COLORS.buyerBg;

    const realFarmersMap = {};
    marketListings.forEach(l => {
      if (l.farmerUid && !realFarmersMap[l.farmerUid]) {
        realFarmersMap[l.farmerUid] = { uid: l.farmerUid, name: l.farmerName || 'Farmer', crops: [] };
      }
      if (l.farmerUid && realFarmersMap[l.farmerUid]) {
        realFarmersMap[l.farmerUid].crops.push((l.emoji || '🌿') + ' ' + (l.cropName || ''));
      }
    });
    const realFarmers = Object.values(realFarmersMap);

    const buyerCartTotal = cart.reduce((sum, c) => sum + (c.price || c.pricePerKg || 0) * c.qty, 0);
    const [checkingOut, setCheckingOut] = React.useState(false);

    const updateCartQty = (itemId, delta) => {
      setCart(prev => prev.map(c => {
        if (c.id !== itemId) return c;
        const newQty = c.qty + delta;
        return newQty > 0 ? { ...c, qty: newQty } : c;
      }).filter(c => c.qty > 0));
    };

    // â”€â”€ FIX: real checkout that writes orders to Firestore â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handleCheckout = async () => {
      if (cart.length === 0 || !currentUser?.uid) return;
      setCheckingOut(true);
      try {
        // Group cart items by farmerUid
        const farmerGroups = {};
        const invalidItems = [];

        cart.forEach(item => {
          const fUid = item.farmerUid;
          if (!fUid || typeof fUid !== 'string' || fUid.trim().length < 10) {
            invalidItems.push(item.cropName || item.name);
            return;
          }
          if (!farmerGroups[fUid]) farmerGroups[fUid] = [];
          farmerGroups[fUid].push(item);
        });

        const farmerUids = Object.keys(farmerGroups);

        if (farmerUids.length === 0) {
          Alert.alert(
            t('Cannot Checkout', 'चेकआउट नहीं हो सकता'),
            t('No valid items in cart. Please add items from the Market tab.', 'कार्ट में कोई वैध आइटम नहीं। बाज़ार टैब से जोड़ें।')
          );
          setCheckingOut(false);
          return;
        }

        // Place one order per farmer
        for (const fUid of farmerUids) {
          const items = farmerGroups[fUid];
          const firstItem = items[0];
          const totalQty = items.reduce((s, i) => s + i.qty, 0);
          const totalAmount = items.reduce((s, i) => s + (i.price || i.pricePerKg || 0) * i.qty, 0);
          const pricePerKg = items.length === 1
            ? (firstItem.price || firstItem.pricePerKg || 0)
            : Math.round(totalAmount / totalQty);

          await fbPlaceOrder({
            buyerUid: currentUser.uid,
            buyerName: currentUser.name || 'Buyer',
            farmerUid: fUid.trim(),
            farmerName: firstItem.farmerName || 'Farmer',
            cropName: items.length === 1 ? (firstItem.cropName || firstItem.name) : `${items.length} items`,
            cropEmoji: items.length === 1 ? (firstItem.emoji || '🌱') : '🛒',
            qty: totalQty,
            pricePerKg,
            totalAmount,
            listingId: items.length === 1 ? (firstItem.id || null) : null,
          });
        }

        setCart([]);

        const msg = invalidItems.length > 0
          ? t(`Order placed! Note: ${invalidItems.join(', ')} could not be ordered (sample items).`, `ऑर्डर हो गया! नोट: ${invalidItems.join(', ')} ऑर्डर नहीं हो सका।`)
          : t('Farmer(s) will confirm your order soon.', 'किसान जल्द आपका ऑर्डर स्वीकार करेंगे।');

        Alert.alert('✅ ' + t('Order Placed!', 'ऑर्डर हो गया!'), msg);
      } catch (e) {
        console.error('[KD] checkout error:', e);
        Alert.alert(t('Checkout Failed', 'चेकआउट विफल'), e.message);
      }
      setCheckingOut(false);
    };

    return (
      <View style={S.screen}>
        <BackHeader title={t('My Profile', 'मेरी प्रोफ़ाइल')} onBack={() => navigateTo(backScreen)} />
        <ScrollView contentContainerStyle={S.scrollPad} showsVerticalScrollIndicator={false}>
          <View style={[S.profileHero, { backgroundColor: accentBg }]}>
            <View style={[S.profileAvatar, { backgroundColor: accent }]}>
              <Text style={S.profileAvatarText}>{displayName.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={S.profileName}>{displayName}</Text>
            <Text style={[S.profilePhone, { color: accent }]}>{displayPhone}</Text>
            <View style={[S.verifiedBadge, { backgroundColor: accent, paddingHorizontal: 16, paddingVertical: 6, marginTop: 10 }]}>
              <ShieldCheck color="#fff" size={14} />
              <Text style={[S.verifiedBadgeText, { color: '#fff', marginLeft: 6 }]}>
                {isFarmer ? t('Verified Farmer', 'सत्यापित किसान') : isRetailer ? t('Verified Retailer', 'सत्यापित व्यापारी') : t('Verified Buyer', 'सत्यापित खरीदार')}
              </Text>
            </View>
          </View>

          <View style={S.formCard}>
            <Text style={S.cardSectionTitle}>{t('Account Details', 'खाता विवरण')}</Text>
            {[
              [t('Full Name', 'पूरा नाम'), displayName],
              [t('Mobile', 'मोबाइल'), displayPhone],
              [t('Role', 'भूमिका'), isFarmer ? '🚜 Farmer' : isRetailer ? '🛒 Retailer' : '🛒 Buyer'],
              [t('Member Since', 'सदस्य बने'), currentUser?.createdAt ? new Date(currentUser.createdAt?.toDate?.() || currentUser.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : t('Recently', 'हाल ही में')],
              [t('Location', 'स्थान'), 'Indore, MP'],
            ].map(([label, val], i, arr) => (
              <View key={i} style={[S.detailRow, { borderBottomWidth: i < arr.length - 1 ? 1 : 0 }]}>
                <Text style={S.detailRowLabel}>{label}</Text>
                <Text style={S.detailRowValue}>{val}</Text>
              </View>
            ))}
          </View>

          {isBuyer && (
            <View style={S.formCard}>
              <Text style={S.cardSectionTitle}>🛒 {t('My Cart', 'मेरी कार्ट')}</Text>
              {cart.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <Text style={{ fontSize: 36, marginBottom: 8 }}>🛒</Text>
                  <Text style={{ color: COLORS.textLight, fontSize: 14 }}>{t('Your cart is empty', 'आपकी कार्ट खाली है')}</Text>
                  <TouchableOpacity style={{ marginTop: 12 }} onPress={() => navigateTo('buyerMarketplace')}>
                    <Text style={{ color: accent, fontWeight: '800', fontSize: 14 }}>{t('Browse Market →', 'बाज़ार देखें →')}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {cart.map((item) => (
                    <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight }}>
                      <Text style={{ fontSize: 26, marginRight: 12 }}>{item.emoji || '🌱'}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.text }}>{item.cropName || item.name}</Text>
                        <Text style={{ fontSize: 12, color: COLORS.textLight }}>{item.farmerName || ''}</Text>
                        {/* Show warning if item has no valid farmerUid */}
                        {(!item.farmerUid || typeof item.farmerUid !== 'string' || item.farmerUid.length < 10) && (
                          <Text style={{ fontSize: 10, color: COLORS.warning, fontWeight: '700' }}>⚠️ Sample item — cannot order</Text>
                        )}
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 12 }}>
                        <TouchableOpacity onPress={() => updateCartQty(item.id, -1)} style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.borderLight, justifyContent: 'center', alignItems: 'center' }}>
                          <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.text }}>−</Text>
                        </TouchableOpacity>
                        <Text style={{ fontSize: 15, fontWeight: '800', color: COLORS.text, minWidth: 20, textAlign: 'center' }}>{item.qty}</Text>
                        <TouchableOpacity onPress={() => updateCartQty(item.id, 1)} style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: accent, justifyContent: 'center', alignItems: 'center' }}>
                          <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff' }}>+</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: accent, minWidth: 60, textAlign: 'right' }}>
                        ₹{(item.price || item.pricePerKg || 0) * item.qty}
                      </Text>
                    </View>
                  ))}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTopWidth: 1.5, borderTopColor: COLORS.border }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.text }}>{t('Total', 'कुल')}</Text>
                    <Text style={{ fontSize: 20, fontWeight: '900', color: accent }}>₹{buyerCartTotal.toLocaleString()}</Text>
                  </View>
                  <TouchableOpacity
                    style={[S.primaryBtn, { backgroundColor: accent, marginTop: 12, opacity: checkingOut ? 0.7 : 1 }]}
                    onPress={handleCheckout}
                    disabled={checkingOut}
                    activeOpacity={0.88}
                  >
                    {checkingOut
                      ? <ActivityIndicator color="#fff" />
                      : <Text style={S.primaryBtnText}>{t('Checkout', 'चेकआउट')} — ₹{buyerCartTotal.toLocaleString()}</Text>
                    }
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {isBuyer && realFarmers.length > 0 && (
            <View style={S.formCard}>
              <Text style={S.cardSectionTitle}>👨‍🌾 {t('Farmers on KisanDirect', 'किसानडायरेक्ट पर किसान')}</Text>
              <Text style={{ fontSize: 12, color: COLORS.textLight, marginBottom: 14 }}>{t('Real farmers selling on the platform', 'प्लेटफ़ॉर्म पर बेचने वाले असली किसान')}</Text>
              {realFarmers.map((farmer, i) => (
                <View key={farmer.uid} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: i < realFarmers.length - 1 ? 1 : 0, borderBottomColor: COLORS.borderLight }}>
                  <View style={[S.farmerAvatar, { backgroundColor: COLORS.primaryBg, width: 44, height: 44 }]}>
                    <Text style={{ fontSize: 15, fontWeight: '900', color: COLORS.primaryMid }}>{(farmer.name || '?').charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.text }}>{farmer.name}</Text>
                    <Text style={{ fontSize: 11, color: COLORS.textLight, marginTop: 2 }}>ID: {farmer.uid.slice(0, 8)}…</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                      {farmer.crops.slice(0, 4).map((crop, ci) => (
                        <View key={ci} style={[S.cropPill, { backgroundColor: COLORS.primaryBg }]}>
                          <Text style={[S.cropPillText, { color: COLORS.primaryMid }]}>{crop}</Text>
                        </View>
                      ))}
                      {farmer.crops.length > 4 && (
                        <View style={[S.cropPill, { backgroundColor: COLORS.surfaceAlt }]}>
                          <Text style={[S.cropPillText, { color: COLORS.textLight }]}>+{farmer.crops.length - 4}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={[S.verifiedBadge, { backgroundColor: COLORS.primaryBg }]}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: COLORS.primaryMid }}>✓ {t('Active', 'सक्रिय')}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {isFarmer && (
            <View style={S.formCard}>
              <Text style={S.cardSectionTitle}>📋 {t('Manage Orders', 'ऑर्डर प्रबंधन')}</Text>
              {myOrders.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <Text style={{ fontSize: 36, marginBottom: 8 }}>📦</Text>
                  <Text style={{ color: COLORS.textLight, fontSize: 14 }}>{t('No orders yet', 'अभी तक कोई ऑर्डर नहीं')}</Text>
                  <Text style={{ color: COLORS.textLight, fontSize: 12, marginTop: 4, textAlign: 'center' }}>{t('Orders from buyers will appear here', 'खरीदारों के ऑर्डर यहां दिखेंगे')}</Text>
                </View>
              ) : (
                <>
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                    {[
                      { label: t('Pending', 'बाकी'), count: myOrders.filter(o => o.status === 'pending').length, color: COLORS.warning, bg: '#FFF3E0' },
                      { label: t('Confirmed', 'पुष्टि'), count: myOrders.filter(o => o.status === 'confirmed').length, color: COLORS.success, bg: COLORS.primaryBg },
                      { label: t('Delivered', 'पहुंचाया'), count: myOrders.filter(o => o.status === 'delivered').length, color: COLORS.primaryMid, bg: COLORS.primaryBg },
                      { label: t('Rejected', 'अस्वीकृत'), count: myOrders.filter(o => o.status === 'rejected').length, color: COLORS.danger, bg: COLORS.dangerLight },
                    ].map((s, i) => (
                      <View key={i} style={{ flex: 1, backgroundColor: s.bg, borderRadius: 12, padding: 10, alignItems: 'center' }}>
                        <Text style={{ fontSize: 18, fontWeight: '900', color: s.color }}>{s.count}</Text>
                        <Text style={{ fontSize: 9, fontWeight: '700', color: s.color, marginTop: 2 }}>{s.label}</Text>
                      </View>
                    ))}
                  </View>
                  {[...myOrders].sort((a, b) => {
                    const priority = { pending: 0, confirmed: 1, delivered: 2, rejected: 3 };
                    return (priority[a.status] ?? 4) - (priority[b.status] ?? 4);
                  }).map((order) => {
                    const statusConfig = {
                      pending: { label: t('Pending', 'बाकी'), color: COLORS.warning, emoji: '⏳' },
                      confirmed: { label: t('Confirmed', 'पुष्टि'), color: COLORS.success, emoji: '✅' },
                      delivered: { label: t('Delivered', 'पहुंचाया'), color: COLORS.primaryMid, emoji: '🚚' },
                      rejected: { label: t('Rejected', 'अस्वीकृत'), color: COLORS.danger, emoji: '❌' },
                    };
                    const sc = statusConfig[order.status] || statusConfig.pending;
                    return (
                      <View key={order.id} style={{ backgroundColor: COLORS.surfaceAlt, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.borderLight, borderLeftWidth: 4, borderLeftColor: sc.color }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                          <Text style={{ fontSize: 24, marginRight: 10 }}>{order.cropEmoji || '🌱'}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 14, fontWeight: '800', color: COLORS.text }}>{order.cropName || 'Crop'} — {order.qty || 1} kg</Text>
                            <Text style={{ fontSize: 12, color: COLORS.textLight, marginTop: 2 }}>🛒 {order.buyerName || t('Buyer', 'खरीदार')} • ₹{order.pricePerKg || '--'}/kg</Text>
                          </View>
                          <View style={[S.statusPill, { backgroundColor: sc.color + '1A' }]}>
                            <Text style={[S.statusPillText, { color: sc.color }]}>{sc.emoji} {sc.label}</Text>
                          </View>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ fontSize: 16, fontWeight: '900', color: accent }}>₹{(order.totalAmount || (order.pricePerKg || 0) * (order.qty || 1)).toLocaleString()}</Text>
                          {order.status === 'pending' && (
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                              <TouchableOpacity
                                style={{ backgroundColor: COLORS.danger + '15', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: COLORS.danger + '40' }}
                                onPress={() => {
                                  Alert.alert(
                                    t('Reject Order?', 'ऑर्डर अस्वीकार करें?'),
                                    t('This order will be rejected.', 'यह ऑर्डर अस्वीकार हो जाएगा।'),
                                    [
                                      { text: t('Cancel', 'रद्द') },
                                      {
                                        text: t('Reject', 'अस्वीकारें'), style: 'destructive', onPress: async () => {
                                          try {
                                            await updateOrderStatus(order.id, 'rejected');
                                            setMyOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'rejected' } : o));
                                          } catch (e) { Alert.alert('Error', e.message); }
                                        }
                                      },
                                    ]
                                  );
                                }}
                              >
                                <Text style={{ color: COLORS.danger, fontWeight: '800', fontSize: 12 }}>✖ {t('Reject', 'अस्वीकारें')}</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={{ backgroundColor: COLORS.success, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 }}
                                onPress={async () => {
                                  try {
                                    await updateOrderStatus(order.id, 'confirmed');
                                    setMyOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'confirmed' } : o));
                                  } catch (e) { Alert.alert('Error', e.message); }
                                }}
                              >
                                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>✓ {t('Accept', 'स्वीकारें')}</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                          {order.status === 'confirmed' && (
                            <TouchableOpacity
                              style={{ backgroundColor: COLORS.primaryMid, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 }}
                              onPress={async () => {
                                try {
                                  await updateOrderStatus(order.id, 'delivered');
                                  setMyOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'delivered' } : o));
                                } catch (e) { Alert.alert('Error', e.message); }
                              }}
                            >
                              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>🚚 {t('Mark Delivered', 'डिलीवर करें')}</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </>
              )}
            </View>
          )}

          {isFarmer && (() => {
            const [weather, setWeather] = React.useState(null);
            const [weatherLoading, setWeatherLoading] = React.useState(true);

            React.useEffect(() => {
              fetch('https://api.open-meteo.com/v1/forecast?latitude=22.72&longitude=75.86&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=Asia/Kolkata&forecast_days=5')
                .then(r => r.json())
                .then(data => { setWeather(data); setWeatherLoading(false); })
                .catch(() => setWeatherLoading(false));
            }, []);

            const weatherLabel = (code) => {
              if (code <= 1) return { emoji: '☀️', label: t('Clear', 'साफ़') };
              if (code <= 3) return { emoji: '⛅', label: t('Partly Cloudy', 'आंशिक बादल') };
              if (code <= 48) return { emoji: '🌫️', label: t('Foggy', 'कोहरा') };
              if (code <= 67) return { emoji: '🌧️', label: t('Rainy', 'बारिश') };
              if (code <= 77) return { emoji: '❄️', label: t('Snow', 'बर्फ़') };
              if (code <= 82) return { emoji: '⛈️', label: t('Heavy Rain', 'तेज़ बारिश') };
              if (code <= 99) return { emoji: '🌩️', label: t('Thunderstorm', 'आंधी') };
              return { emoji: '🌥️', label: t('Fair', 'ठीक') };
            };

            const getSuggestions = (data) => {
              if (!data?.current || !data?.daily) return [];
              const tips = [];
              const humidity = data.current.relative_humidity_2m;
              const wind = data.current.wind_speed_10m;
              const rain5d = data.daily.precipitation_sum?.reduce((s, v) => s + v, 0) || 0;
              const maxTemp = Math.max(...(data.daily.temperature_2m_max || [0]));
              const minTemp = Math.min(...(data.daily.temperature_2m_min || [40]));
              if (rain5d > 20) tips.push({ icon: '🌧️', tip: t('Heavy rain expected — delay sowing, ensure drainage channels are clear.', 'भारी बारिश आने वाली है — बुआई रोकें, नालियाँ साफ़ रखें।'), color: '#1565C0' });
              else if (rain5d > 5) tips.push({ icon: '💧', tip: t('Light rain ahead — good time for transplanting. Reduce irrigation.', 'हल्की बारिश आएगी — रोपाई का अच्छा समय। सिंचाई कम करें।'), color: '#2196F3' });
              else tips.push({ icon: '☀️', tip: t('Dry days ahead — ensure regular irrigation for standing crops.', 'सूखे दिन आएंगे — खड़ी फ़सल की सिंचाई नियमित रखें।'), color: '#FF8F00' });
              if (maxTemp > 40) tips.push({ icon: '🔥', tip: t('Heat wave alert! Use mulching to protect soil. Water crops early morning.', 'लू की चेतावनी! मल्चिंग करें। सुबह जल्दी पानी दें।'), color: '#D32F2F' });
              if (minTemp < 8) tips.push({ icon: '🥶', tip: t('Frost risk! Cover nursery beds. Avoid irrigation at night.', 'पाला का ख़तरा! पौधशाला को ढकें। रात में सिंचाई न करें।'), color: '#7B1FA2' });
              if (wind > 25) tips.push({ icon: '💨', tip: t('High winds — avoid spraying pesticides. Support tall crops with stakes.', 'तेज़ हवा — कीटनाशक छिड़काव न करें। लंबी फ़सल को सहारा दें।'), color: '#455A64' });
              tips.push({ icon: '📅', tip: t('Check mandi prices before harvesting to maximize your profit.', 'कटाई से पहले मंडी भाव चेक करें — ज़्यादा मुनाफ़ा कमाएं।'), color: COLORS.primaryMid });
              return tips;
            };

            if (weatherLoading) {
              return (
                <View style={S.formCard}>
                  <Text style={S.cardSectionTitle}>🌤️ {t('Weather Forecast', 'मौसम पूर्वानुमान')}</Text>
                  <ActivityIndicator color={COLORS.primaryMid} style={{ padding: 20 }} />
                </View>
              );
            }
            if (!weather?.current) {
              return (
                <View style={S.formCard}>
                  <Text style={S.cardSectionTitle}>🌤️ {t('Weather Forecast', 'मौसम पूर्वानुमान')}</Text>
                  <Text style={{ color: COLORS.textLight, textAlign: 'center', padding: 16 }}>{t('Weather data unavailable. Check your internet connection.', 'मौसम डेटा उपलब्ध नहीं। इंटरनेट जांचें।')}</Text>
                </View>
              );
            }

            const currentW = weatherLabel(weather.current.weather_code);
            const suggestions = getSuggestions(weather);

            return (
              <View style={S.formCard}>
                <Text style={S.cardSectionTitle}>🌤️ {t('Weather Forecast', 'मौसम पूर्वानुमान')}</Text>
                <View style={{ backgroundColor: COLORS.primaryBg, borderRadius: 16, padding: 16, marginBottom: 14, flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 44 }}>{currentW.emoji}</Text>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={{ fontSize: 28, fontWeight: '900', color: COLORS.text }}>{weather.current.temperature_2m}°C</Text>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.primaryMid }}>{currentW.label}</Text>
                    <Text style={{ fontSize: 11, color: COLORS.textLight, marginTop: 4 }}>
                      💧 {weather.current.relative_humidity_2m}% · 💨 {weather.current.wind_speed_10m} km/h
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 12, color: COLORS.textLight }}>📍 Indore</Text>
                    <Text style={{ fontSize: 11, color: COLORS.textLight, marginTop: 2 }}>{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</Text>
                  </View>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    {weather.daily?.time?.map((day, i) => {
                      const code = weather.daily.weather_code?.[i] || 0;
                      const wl = weatherLabel(code);
                      const dateLabel = i === 0 ? t('Today', 'आज') : new Date(day).toLocaleDateString('en-IN', { weekday: 'short' });
                      return (
                        <View key={i} style={{ backgroundColor: i === 0 ? COLORS.primaryMid : COLORS.surfaceAlt, borderRadius: 14, padding: 12, alignItems: 'center', minWidth: 72, borderWidth: 1, borderColor: COLORS.borderLight }}>
                          <Text style={{ fontSize: 10, fontWeight: '800', color: i === 0 ? '#fff' : COLORS.textLight, marginBottom: 6 }}>{dateLabel}</Text>
                          <Text style={{ fontSize: 22 }}>{wl.emoji}</Text>
                          <Text style={{ fontSize: 13, fontWeight: '800', color: i === 0 ? '#fff' : COLORS.text, marginTop: 4 }}>{Math.round(weather.daily.temperature_2m_max?.[i])}°</Text>
                          <Text style={{ fontSize: 11, color: i === 0 ? 'rgba(255,255,255,0.7)' : COLORS.textLight }}>{Math.round(weather.daily.temperature_2m_min?.[i])}°</Text>
                          {weather.daily.precipitation_sum?.[i] > 0 && (
                            <Text style={{ fontSize: 9, color: i === 0 ? '#B3E5FC' : '#1E88E5', fontWeight: '800', marginTop: 3 }}>💧{weather.daily.precipitation_sum[i]}mm</Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
                <Text style={{ fontSize: 14, fontWeight: '800', color: COLORS.text, marginBottom: 10 }}>🌾 {t('Farming Suggestions', 'खेती के सुझाव')}</Text>
                {suggestions.map((s, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', backgroundColor: s.color + '0D', borderRadius: 12, padding: 12, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: s.color }}>
                    <Text style={{ fontSize: 20, marginRight: 10 }}>{s.icon}</Text>
                    <Text style={{ flex: 1, fontSize: 13, color: COLORS.text, lineHeight: 20 }}>{s.tip}</Text>
                  </View>
                ))}
              </View>
            );
          })()}

          <TouchableOpacity style={[S.primaryBtn, { backgroundColor: COLORS.danger, marginTop: 8 }]} onPress={handleLogout} activeOpacity={0.88}>
            <Text style={S.primaryBtnText}>🚪 {t('Sign Out', 'साइन आउट')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
}

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  //  RENDER
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

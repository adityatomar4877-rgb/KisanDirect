// screens/ProductDetail.js — KisanDirect
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

  // â”€â”€â”€ SCREEN: PRODUCT DETAIL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function ProductDetail({ t, navigateTo, currentUser, selectedFarmer, selectedProduct, chatMessages, setChatMessages, offerPrice, setOfferPrice, myOrders, setMyOrders, orderPlaced, setOrderPlaced }) {
    const BC = COLORS.buyerMid;
    const farmer = selectedFarmer || {
      name: 'Ramesh Singh', dist: '2.5 km', rating: 4.8, reviews: 124,
      crops: ['🍅 Tomatoes', '🧅 Onions'], verified: true, avatar: 'RS',
      deliveries: 230, price: '₹38–42/kg', uid: null,
    };
    const listing = selectedProduct || {};
    const cropEmoji = listing.emoji || farmer.crops[0]?.split(' ')[0] || '🌾';
    const cropName = listing.cropName || farmer.crops[0]?.split(' ').slice(1).join(' ') || 'Produce';
    const basePrice = listing.pricePerKg || parseInt(farmer.price?.match(/\d+/) || ['40']) || 40;
    const threadId = `${currentUser?.uid || 'guest'}_${listing.id || farmer.uid || farmer.name.replace(/\s/g, '')}`;

    const [qty, setQty] = React.useState(1);
    const [localOffer, setLocalOffer] = React.useState('');
    const [localChat, setLocalChat] = React.useState([
      { from: 'farmer', text: `${t('Hello! I have fresh produce available.', 'नमस्ते! ताजा उपज उपलब्ध है।')} (${farmer.crops.join(', ')})` },
    ]);
    const [sending, setSending] = React.useState(false);
    const [ordering, setOrdering] = React.useState(false);

    React.useEffect(() => {
      let unsub;
      try {
        unsub = listenNegotiationMessages(threadId, (msgs) => {
          if (msgs.length > 0) {
            setLocalChat(msgs.map(m => ({ from: m.from, text: m.text })));
          }
        });
      } catch (e) { console.warn('listenNegotiation error:', e); }
      return () => { if (unsub) unsub(); };
    }, [threadId]);

    const sendOffer = async () => {
      if (!localOffer.trim()) {
        Alert.alert(t('Enter Price', 'कीमत दर्ज करें'), t('Please type your offer price first.', 'पहले अपनी कीमत टाइप करें।'));
        return;
      }
      const offerNum = parseInt(localOffer);
      setSending(true);
      const buyerMsg = {
        from: 'buyer',
        senderUid: currentUser?.uid || 'guest',
        text: `${t('I want', 'मुझे चाहिए')} ${qty} kg. ${t('Can you do', 'क्या आप दे सकते हैं')} ₹${localOffer}/kg?`,
        offeredPrice: offerNum,
      };
      try { await sendNegotiationMessage(threadId, buyerMsg); } catch (e) { console.warn('sendNegotiationMessage error:', e); }
      setLocalChat(prev => [...prev, { from: buyerMsg.from, text: buyerMsg.text }]);
      setLocalOffer('');

      setTimeout(async () => {
        let replyText;
        if (offerNum >= basePrice) {
          replyText = `✅ ${t('Deal! I accept', 'सौदा! मैं स्वीकार करता हूँ')} ₹${localOffer}/kg ${t('for', 'के लिए')} ${qty} kg.`;
        } else if (offerNum >= basePrice * 0.85) {
          const counter = Math.round((offerNum + basePrice) / 2);
          replyText = `${t('Minimum I can do is', 'न्यूनतम मैं दे सकता हूँ')} ₹${counter}/kg. ${t('Final offer!', 'अंतिम प्रस्ताव!')}`;
        } else {
          replyText = `${t('Sorry, my price is', 'माफ करें, मेरी कीमत है')} ₹${basePrice}/kg. ${t('Cannot go lower.', 'और कम नहीं हो सकता।')}`;
        }
        const farmerReply = { from: 'farmer', senderUid: farmer.uid || 'farmer', text: replyText };
        try { await sendNegotiationMessage(threadId, farmerReply); } catch (e) { console.warn('farmer reply save error:', e); }
        setLocalChat(prev => [...prev, { from: farmerReply.from, text: farmerReply.text }]);
        setSending(false);
      }, 1200);
    };

    // ——— FIX: validate farmerUid before writing order —————————————————————
    const handlePlaceOrder = async (pricePerKg) => {
      if (!currentUser?.uid) {
        Alert.alert(t('Login required', 'लॉगिन आवश्यक'), t('Please log in to place an order.', 'ऑर्डर करने के लिए लॉगिन करें।'));
        return;
      }

      const rawUid = farmer.uid ?? farmer.id ?? null;
      const resolvedFarmerUid =
        typeof rawUid === 'string' && rawUid.trim().length > 10
          ? rawUid.trim()
          : null;

      console.log('[KD] handlePlaceOrder — rawUid:', rawUid,
        '| resolved:', resolvedFarmerUid,
        '| listing.id:', listing?.id);

      if (!resolvedFarmerUid) {
        Alert.alert(
          t('Cannot Place Order', 'ऑर्डर नहीं हो सकता'),
          t('This is a sample profile. To place a real order, browse the Market tab and tap on a live listing.',
            'यह एक नमूना प्रोफाइल है। असली ऑर्डर के लिए बाज़ार टैब से लाइव लिस्टिंग चुनें।')
        );
        return;
      }

      setOrdering(true);
      const totalAmount = pricePerKg * qty;
      try {
        const orderId = await fbPlaceOrder({
          buyerUid: currentUser.uid,
          buyerName: currentUser.name || 'Buyer',
          farmerUid: resolvedFarmerUid,
          farmerName: farmer.name,
          cropName, cropEmoji, qty, pricePerKg, totalAmount,
          listingId: listing?.id || null,
        });
        console.log('[KD] Order placed. orderId:', orderId, '| farmerUid:', resolvedFarmerUid);
        setMyOrders(prev => [{
          id: orderId, buyerUid: currentUser.uid, farmerName: farmer.name,
          cropName, cropEmoji, qty, pricePerKg, totalAmount, status: 'pending',
        }, ...prev]);
        setOrderPlaced({
          farmer, cropName, cropEmoji, qty, pricePerKg,
          total: totalAmount, orderId: '#' + orderId.slice(-5).toUpperCase()
        });
        navigateTo('orderTracking');
      } catch (e) {
        console.error('[KD] placeOrder error:', e);
        Alert.alert(
          t('Order Failed', 'ऑर्डर विफल'),
          t('Could not place order. Please try again.', 'ऑर्डर नहीं हो सका। दोबारा कोशिश करें।') + '\n\n' + e.message
        );
      }
      setOrdering(false);
    };

    return (
      <View style={S.screen}>
        <BackHeader title={t('Product Details', 'उत्पाद विवरण')} onBack={() => navigateTo('buyerMarketplace')} />
        <ScrollView contentContainerStyle={S.scrollPad} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={[S.detailHero, { backgroundColor: COLORS.primaryBg }]}><Text style={{ fontSize: 80 }}>{cropEmoji}</Text></View>
          <View style={S.formCard}>
            <Text style={S.detailName}>{cropName}</Text>
            <Text style={[S.detailPrice, { color: BC }]}>₹{basePrice}/kg</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 14, borderTopWidth: 1, borderTopColor: COLORS.borderLight }}>
              <View style={[S.farmerAvatar, { backgroundColor: COLORS.primaryBg, width: 44, height: 44 }]}>
                <Text style={[S.farmerAvatarText, { color: COLORS.primaryMid, fontSize: 15 }]}>{farmer.avatar || '👨‍🌾'}</Text>
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text }}>{farmer.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ color: COLORS.accent, fontSize: 13 }}>★ {farmer.rating}</Text>
                  <Text style={[S.farmerMeta, { marginLeft: 6 }]}>{farmer.deliveries}+ {t('orders', 'ऑर्डर')} • {farmer.dist}</Text>
                </View>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, backgroundColor: COLORS.primaryBg, borderRadius: 12, padding: 12 }}>
              <Text style={{ fontWeight: '700', color: COLORS.text }}>{t('Quantity (kg)', 'मात्रा (किलो)')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <TouchableOpacity onPress={() => setQty(q => Math.max(1, q - 1))} style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: BC, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 20, lineHeight: 22 }}>−</Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.text, minWidth: 30, textAlign: 'center' }}>{qty}</Text>
                <TouchableOpacity onPress={() => setQty(q => q + 1)} style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: BC, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 20, lineHeight: 22 }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={[S.formCard, { marginTop: 12 }]}>
            <Text style={[S.sectionTitle, { marginBottom: 12 }]}>💬 {t('Negotiate Price', 'कीमत तय करें')}</Text>
            <View style={S.chatBox}>
              {localChat.map((msg, i) => (
                msg.from === 'farmer'
                  ? <View key={i} style={S.chatBubbleOther}><Text style={S.chatBubbleOtherText}>{msg.text}</Text></View>
                  : <View key={i} style={S.chatBubbleSelf}><Text style={S.chatBubbleSelfText}>{msg.text}</Text></View>
              ))}
              {sending && <View style={S.chatBubbleOther}><Text style={S.chatBubbleOtherText}>...</Text></View>}
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <TextInput
                style={[S.searchInput, { flex: 1, borderWidth: 1, borderColor: COLORS.borderLight, borderRadius: 10, paddingHorizontal: 12, backgroundColor: COLORS.surfaceAlt }]}
                placeholder={t('Your offer price (₹/kg)', 'आपकी कीमत (₹/kg)')}
                placeholderTextColor={COLORS.textLight}
                keyboardType="numeric"
                value={localOffer}
                onChangeText={setLocalOffer}
              />
              <TouchableOpacity style={[S.primaryBtn, { flex: 0, marginTop: 0, paddingHorizontal: 16, backgroundColor: BC, opacity: sending ? 0.6 : 1 }]} onPress={sendOffer} disabled={sending}>
                <Text style={S.primaryBtnText}>{t('Send', 'भेजें')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
            <TouchableOpacity style={[S.secondaryBtn, { flex: 1, opacity: ordering ? 0.6 : 1 }]} onPress={() => handlePlaceOrder(basePrice)} disabled={ordering} activeOpacity={0.88}>
              <Text style={[S.secondaryBtnText, { color: BC }]}>{t('Buy @ ', 'खरीदें @ ')}₹{basePrice}/kg</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[S.primaryBtn, { flex: 1, marginTop: 0, backgroundColor: BC, opacity: ordering ? 0.6 : 1 }]}
              disabled={ordering}
              onPress={() => {
                const lastFarmerMsg = [...localChat].reverse().find(m => m.from === 'farmer' && m.text.includes('₹'));
                const match = lastFarmerMsg?.text?.match(/₹(\d+)/);
                const agreedPrice = match ? parseInt(match[1]) : basePrice;
                handlePlaceOrder(agreedPrice);
              }} activeOpacity={0.88}>
              {ordering ? <ActivityIndicator color="#fff" /> : <Text style={S.primaryBtnText}>{t('Order Now', 'अभी ऑर्डर करें')}</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
}


import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  TextInput, Alert, Dimensions, Platform
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  primary: '#1B5E20', primaryMid: '#2E7D32', primaryLight: '#4CAF50',
  primaryBg: '#F1F8E9', primaryBgDark: '#DCEDC8',
  accent: '#F9A825', accentLight: '#FFF9C4',
  retailer: '#0D47A1', retailerMid: '#1565C0', retailerLight: '#1976D2', retailerBg: '#E3F2FD',
  buyer: '#4A148C', buyerMid: '#6A1B9A', buyerLight: '#7B1FA2', buyerBg: '#F3E5F5',
  bg: '#FAFDF6', surface: '#FFFFFF', surfaceAlt: '#F7F9F4',
  text: '#1C2B1E', textMid: '#4A5C4E', textLight: '#7A8C7E',
  border: '#D7E8D9', borderLight: '#EAF2EB',
  success: '#2E7D32', warning: '#E65100', danger: '#B71C1C', dangerLight: '#FFEBEE',
};

const BackHeader = ({ title, onBack, rightAction }) => (
  <View style={S.backHeader}>
    <TouchableOpacity onPress={onBack} style={S.backBtn2} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
      <Text style={S.backArrow}>‹</Text>
    </TouchableOpacity>
    <Text style={S.backTitle} numberOfLines={1}>{title}</Text>
    {rightAction || <View style={{ width: 40 }} />}
  </View>
);

export default function AuctionScreen({ navigateTo, t, isFarmer, currentUser }) {
  const [activeTab, setActiveTab] = useState('active');
  const [bidAmount, setBidAmount] = useState('');

  const accent = isFarmer ? COLORS.primaryMid : COLORS.buyerMid;
  const accentBg = isFarmer ? COLORS.primaryBg : COLORS.buyerBg;

  const mockAuctions = [
    {
      id: 'A101',
      crop: 'Wheat',
      emoji: '🌾',
      qty: '500 kg',
      farmer: 'Ramesh Singh',
      basePrice: 20,
      highestBid: 22.5,
      endsIn: '2h 15m',
      status: 'Live',
    },
    {
      id: 'A102',
      crop: 'Onion',
      emoji: '🧅',
      qty: '200 kg',
      farmer: 'Suresh Patel',
      basePrice: 30,
      highestBid: 35,
      endsIn: '45m',
      status: 'Live',
    },
    {
      id: 'A103',
      crop: 'Soybean',
      emoji: '🫘',
      qty: '1000 kg',
      farmer: 'Village Co-op',
      basePrice: 42,
      highestBid: 48,
      endsIn: 'Ended',
      status: 'Ended',
    }
  ];

  const handleBid = (auction) => {
    if (!bidAmount) {
      Alert.alert(t('Error', 'त्रुटि'), t('Please enter a bid amount.', 'कृपया बोली राशि दर्ज करें।'));
      return;
    }
    const val = parseFloat(bidAmount);
    if (isNaN(val) || val <= auction.highestBid) {
      Alert.alert(t('Invalid Bid', 'अमान्य बोली'), t(`Bid must be higher than ₹${auction.highestBid}`, `बोली ₹${auction.highestBid} से अधिक होनी चाहिए`));
      return;
    }
    Alert.alert(
      t('Bid Placed!', 'बोली लग गई!'),
      t(`You successfully bid ₹${val}/kg on ${auction.crop}.`, `आपने ${auction.crop} पर ₹${val}/किलो की बोली लगाई।`),
      [{ text: 'OK', onPress: () => setBidAmount('') }]
    );
  };

  return (
    <View style={S.screen}>
      <BackHeader title={t('Live Crop Auctions', 'लाइव फसल नीलामी')} onBack={() => navigateTo(isFarmer ? 'farmerDashboard' : 'buyerMarketplace')} />

      <View style={S.tabBar}>
        <TouchableOpacity style={[S.tabItem, activeTab === 'active' && S.tabItemActive]} onPress={() => setActiveTab('active')}>
          <Text style={[S.tabLabel, activeTab === 'active' && { color: accent }]}>{t('Live Auctions', 'लाइव नीलामी')}</Text>
          {activeTab === 'active' && <View style={[S.tabIndicator, { backgroundColor: accent }]} />}
        </TouchableOpacity>
        <TouchableOpacity style={[S.tabItem, activeTab === 'my' && S.tabItemActive]} onPress={() => setActiveTab('my')}>
          <Text style={[S.tabLabel, activeTab === 'my' && { color: accent }]}>{isFarmer ? t('My Auctions', 'मेरी नीलामियां') : t('My Bids', 'मेरी बोलियां')}</Text>
          {activeTab === 'my' && <View style={[S.tabIndicator, { backgroundColor: accent }]} />}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={S.scrollPad} showsVerticalScrollIndicator={false}>
        {isFarmer && activeTab === 'my' && (
          <TouchableOpacity style={[S.createBtn, { backgroundColor: accent }]} onPress={() => Alert.alert('Coming Soon', 'Create auction feature coming soon!')}>
            <Text style={S.createBtnText}>+ {t('Create New Auction', 'नई नीलामी बनाएं')}</Text>
          </TouchableOpacity>
        )}

        {mockAuctions.filter(a => activeTab === 'active' ? a.status === 'Live' : true).map((auction) => (
          <View key={auction.id} style={S.auctionCard}>
            <View style={S.cardHeader}>
              <View style={S.cropEmojiBox}><Text style={{ fontSize: 24 }}>{auction.emoji}</Text></View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={S.cropName}>{auction.crop} <Text style={{ fontWeight: '400', color: COLORS.textLight }}>• {auction.qty}</Text></Text>
                <Text style={S.farmerName}>👨🏽‍🌾 {auction.farmer}</Text>
              </View>
              <View style={[S.statusPill, { backgroundColor: auction.status === 'Live' ? '#E8F5E9' : COLORS.surfaceAlt }]}>
                {auction.status === 'Live' && <View style={S.liveDot} />}
                <Text style={[S.statusText, { color: auction.status === 'Live' ? COLORS.primaryMid : COLORS.textLight }]}>{auction.endsIn}</Text>
              </View>
            </View>

            <View style={S.priceRow}>
              <View>
                <Text style={S.priceLabel}>{t('Base Price', 'आधार मूल्य')}</Text>
                <Text style={S.basePrice}>₹{auction.basePrice}/kg</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={S.priceLabel}>{t('Highest Bid', 'सबसे ऊंची बोली')}</Text>
                <Text style={[S.highestBid, { color: COLORS.primaryMid }]}>₹{auction.highestBid}/kg</Text>
              </View>
            </View>

            {!isFarmer && auction.status === 'Live' && (
              <View style={S.bidActionRow}>
                <TextInput
                  style={S.bidInput}
                  placeholder={`> ₹${auction.highestBid}`}
                  placeholderTextColor={COLORS.textLight}
                  keyboardType="numeric"
                  value={bidAmount}
                  onChangeText={setBidAmount}
                />
                <TouchableOpacity style={[S.bidBtn, { backgroundColor: accent }]} onPress={() => handleBid(auction)}>
                  <Text style={S.bidBtnText}>{t('Place Bid', 'बोली लगाएं')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {isFarmer && auction.status === 'Live' && activeTab === 'my' && (
              <TouchableOpacity style={[S.bidBtn, { backgroundColor: COLORS.success, marginTop: 12, paddingVertical: 12 }]} onPress={() => Alert.alert('Accept', 'Bid Accepted!')}>
                <Text style={S.bidBtnText}>{t('Accept ₹' + auction.highestBid, '₹' + auction.highestBid + ' स्वीकार करें')}</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  backHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 58, paddingBottom: 16, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  backBtn2: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.surfaceAlt, justifyContent: 'center', alignItems: 'center' },
  backArrow: { fontSize: 24, color: COLORS.text, lineHeight: 28 },
  backTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, flex: 1, textAlign: 'center', marginHorizontal: 8 },

  tabBar: { flexDirection: 'row', backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, position: 'relative' },
  tabItemActive: {},
  tabLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textLight },
  tabIndicator: { position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 3, borderRadius: 3 },

  scrollPad: { padding: 20, paddingBottom: 100 },

  createBtn: { padding: 16, borderRadius: 16, alignItems: 'center', marginBottom: 20 },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  auctionCard: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: COLORS.borderLight },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  cropEmojiBox: { width: 50, height: 50, borderRadius: 14, backgroundColor: COLORS.primaryBg, justifyContent: 'center', alignItems: 'center' },
  cropName: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  farmerName: { fontSize: 13, color: COLORS.textLight, marginTop: 4 },

  statusPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primaryMid, marginRight: 6 },
  statusText: { fontSize: 11, fontWeight: '800' },

  priceRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.surfaceAlt, padding: 12, borderRadius: 12, marginBottom: 16 },
  priceLabel: { fontSize: 11, color: COLORS.textLight, fontWeight: '700', marginBottom: 4 },
  basePrice: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  highestBid: { fontSize: 20, fontWeight: '900' },

  bidActionRow: { flexDirection: 'row', gap: 10 },
  bidInput: { flex: 1, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 14, fontSize: 16, color: COLORS.text },
  bidBtn: { paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center', borderRadius: 12 },
  bidBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

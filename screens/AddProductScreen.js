// screens/AddProductScreen.js — KisanDirect
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

  // â”€â”€â”€ SCREEN: ADD PRODUCT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function AddProductScreen({ t, navigateTo, currentUser, cropName, setCropName, cropImage, setCropImage, isListeningAdd, setIsListeningAdd, setMyListings, takePhoto, handleVoiceInput }) {
    const [localQty, setLocalQty] = useState('');
    const [localPrice, setLocalPrice] = useState('');
    const [localCrop, setLocalCrop] = useState(cropName);
    const CROP_EMOJIS = { Tomato: '🍅', Wheat: '🌾', Onion: '🧅', Potato: '🥔', Garlic: '🧄', Rice: '🍚', Maize: '🌽', Soybean: '🫘', Mustard: '🌻', Cauliflower: '🥦', Chilli: '🌶️', Cotton: '🪴' };
    const [submitting, setSubmitting] = useState(false);

    const submitListing = async () => {
      if (!localCrop || !localQty || !localPrice) {
        Alert.alert(t('Missing Info', 'जानकारी ज़रूरी'), t('Please fill all fields.', 'सभी फ़ील्ड भरें।'));
        return;
      }
      setSubmitting(true);
      const emoji = CROP_EMOJIS[localCrop] || '🌿';
      try {
        const newId = await addListing(
          currentUser.uid,
          currentUser.name,
          { cropName: localCrop, emoji, pricePerKg: Number(localPrice), qty: Number(localQty), imageUrl: cropImage || null }
        );
        setMyListings(prev => [{
          id: newId, emoji, name: localCrop, nameHi: localCrop,
          price: `₹ ${localPrice}/kg`, qty: `${localQty} kg`, trend: '=', farmerUid: currentUser.uid,
        }, ...prev]);
        setCropImage(null); setCropName('');
        Alert.alert(
          t('Product Listed! 🎉', 'उत्पाद जोड़ा गया! 🎉'),
          t('Your crop is now visible to buyers.', 'आपकी फसल अब खरीदारों को दिखेगी।'),
          [{ text: t('Great!', 'बढ़िया!'), onPress: () => navigateTo('farmerDashboard') }]
        );
      } catch (e) {
        console.error('addListing error:', e);
        Alert.alert(t('Error', 'त्रुटि'), t('Could not save listing. Please try again.', 'सहेजा नहीं जा सका। दोबारा कोशिश करें।'));
      }
      setSubmitting(false);
    };

    return (
      <View style={S.screen}>
        <BackHeader title={t('Add New Crop', 'नई फसल जोड़ें')} onBack={() => navigateTo('farmerDashboard')} />
        <ScrollView contentContainerStyle={S.scrollPad} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={S.photoUpload} onPress={takePhoto} activeOpacity={0.85}>
            {cropImage ? (
              <Image source={{ uri: cropImage }} style={{ width: '100%', height: '100%', borderRadius: 18 }} />
            ) : (
              <>
                <View style={[S.photoIconBox, { backgroundColor: COLORS.primaryBg }]}><Text style={{ fontSize: 32 }}>📷</Text></View>
                <Text style={S.photoUploadText}>{t('Tap to photograph your crop', 'फसल की फोटो खींचने के लिए टैप करें')}</Text>
                <Text style={S.photoUploadSub}>{t('Clear photos attract more buyers', 'साफ फोटो से ज़्यादा खरीदार आते हैं')}</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={S.inputLabel}>{t('Select Crop', 'फसल चुनें')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {Object.keys(CROP_EMOJIS).map(c => (
              <TouchableOpacity key={c} style={[S.chip, { marginRight: 8 }, localCrop === c && S.chipActive]} onPress={() => setLocalCrop(c)}>
                <Text style={{ fontSize: 14 }}>{CROP_EMOJIS[c]} </Text>
                <Text style={[S.chipText, localCrop === c && S.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={S.formCard}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={S.inputLabel}>{t('Quantity (kg)', 'मात्रा (किलो)')}</Text>
                <TextInput style={S.input} keyboardType="numeric" placeholder="100" placeholderTextColor={COLORS.textLight} value={localQty} onChangeText={setLocalQty} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.inputLabel}>{t('Price (₹/kg)', 'मूल्य (₹/किलो)')}</Text>
                <TextInput style={S.input} keyboardType="numeric" placeholder="30" placeholderTextColor={COLORS.textLight} value={localPrice} onChangeText={setLocalPrice} />
              </View>
            </View>
          </View>

          <View style={[S.infoBox, { marginBottom: 20 }]}>
            <Text style={[S.infoBoxTitle, { color: COLORS.primaryMid }]}>💡 {t('Market Insight', 'बाजार जानकारी')}</Text>
            <Text style={[S.infoBoxText, { color: COLORS.primaryMid }]}>{t('Nearby farmers are selling Potatoes at ₹28–32/kg. Price yours competitively!', 'आसपास के किसान आलू ₹28–32/किलो में बेच रहे हैं।')}</Text>
          </View>

          <TouchableOpacity style={[S.primaryBtn, submitting && { opacity: 0.7 }]} onPress={submitListing} disabled={submitting} activeOpacity={0.88}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={S.primaryBtnText}>{t('List My Crop', 'फसल जोड़ें')}</Text>}
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
}


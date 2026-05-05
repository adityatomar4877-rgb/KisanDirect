// screens/FarmingNews.js — KisanDirect
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

  // â”€â”€â”€ SCREEN: FARMING NEWS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function FarmingNews({ t, navigateTo }) {
    const news = [
      { id: 1, tag: t('Scheme', 'योजना'), title: t('PM Kisan: ₹2000 installment released for all registered farmers', 'PM किसान: सभी पंजीकृत किसानों के लिए ₹2000 की किस्त जारी'), time: t('2 hours ago', '2 घंटे पहले'), emoji: '💰', color: COLORS.primaryBg, link: 'https://pmkisan.gov.in' },
      { id: 2, tag: t('Weather', 'मौसम'), title: t('IMD predicts above-normal monsoon for Kharif season 2025', 'IMD ने खरीफ 2025 के लिए सामान्य से अधिक मानसून का अनुमान'), time: t('5 hours ago', '5 घंटे पहले'), emoji: '🌧️', color: COLORS.retailerBg, link: 'https://imd.gov.in' },
      { id: 3, tag: t('Market', 'बाज़ार'), title: t('Onion prices rise 18% in wholesale mandis across MP', 'MP में प्याज की कीमतें 18% बढ़ीं'), time: t('Yesterday', 'कल'), emoji: '📈', color: '#FFF8E1', link: 'https://agmarknet.gov.in' },
      { id: 4, tag: t('Scheme', 'योजना'), title: t('Fasal Bima Yojana: Enrollment extended to 31 July', 'फसल बीमा योजना: नामांकन 31 जुलाई तक बढ़ाई गई'), time: t('2 days ago', '2 दिन पहले'), emoji: '🚁ï¸', color: COLORS.buyerBg, link: 'https://pmfby.gov.in' },
      { id: 5, tag: t('Tech', 'तकनीक'), title: t('Drone spraying services now available in rural Madhya Pradesh', 'मध्य प्रदेश के ग्रामीण क्षेत्रों में ड्रोन छिड़काव उपलब्ध'), time: t('3 days ago', '3 दिन पहले'), emoji: '🍚', color: COLORS.primaryBg, link: '' },
      { id: 6, tag: t('Advisory', 'परामर्श'), title: t('Agriculture dept warns of fall armyworm attack on maize crop', 'मक्के की फसल पर फॉल आर्मीवर्म हमले की चेतावनी'), time: t('4 days ago', '4 दिन पहले'), emoji: 'âš ï¸', color: COLORS.dangerLight, link: '' },
    ];
    return (
      <View style={S.screen}>
        <BackHeader title={t('Kisan News', 'किसान समाचार')} onBack={() => navigateTo('farmerDashboard')} />
        <ScrollView contentContainerStyle={S.scrollPad} showsVerticalScrollIndicator={false}>
          {news.map((item) => (
            <TouchableOpacity key={item.id} style={[S.newsCard, { backgroundColor: item.color }]}
              onPress={() => Alert.alert(item.title, item.link ? `${t('Source', 'स्रोत')}: ${item.link}` : t('Full article coming soon!', 'पूरा लेख जल्द आ रहा है!'))}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ fontSize: 22, marginRight: 10 }}>{item.emoji}</Text>
                <View style={S.newsTagPill}><Text style={S.newsTagText}>{item.tag}</Text></View>
                <Text style={[S.newsTime, { marginLeft: 'auto' }]}>{item.time}</Text>
              </View>
              <Text style={S.newsTitle}>{item.title}</Text>
              <Text style={[S.newsReadMore, { color: COLORS.primaryMid }]}>{t('Read more →', 'और पढ़ें →')}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
}


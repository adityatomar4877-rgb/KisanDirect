// ─────────────────────────────────────────────────────────────────────────────
//  App.js  — KisanDirect  (updated with role-guard + auction + language fixes)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  TextInput, Image, StatusBar, Platform, Alert, Dimensions,
  ActivityIndicator, Animated,
} from 'react-native';
import { MapPin, Search, Plus, Star, ShieldCheck, CheckCircle2, Clock, Truck, Mic, Image as ImageIcon, TrendingUp, Package, Users, BarChart2 } from 'lucide-react-native';
import Svg, { Path, Circle, Line, Text as SvgText, Polyline, Defs, LinearGradient, Stop } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import { auth, db } from './firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import LoginScreen, { ROLE_CONFIG } from './Loginscreen.js';
import NearbyMandi from './NearbyMandi';
import AuctionScreen from './AuctionScreen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── data.gov.in API CONFIG ───────────────────────────────────────────────
const DATA_GOV_API_KEY =
  process.env.EXPO_PUBLIC_DATA_GOV_API_KEY ||
  Constants.expoConfig?.extra?.dataGovApiKey ||
  '';

const DATA_GOV_BASE_URL = 'https://api.data.gov.in/resource';
const AGMARKNET_RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';
const DEFAULT_STATE = 'Madhya Pradesh';
const DEFAULT_DISTRICT = 'Indore';

const fetchMandiPrice = async (commodity, state = DEFAULT_STATE) => {
  const params = new URLSearchParams({
    'api-key': DATA_GOV_API_KEY,
    format: 'json',
    limit: '10',
    'filters[state]': state,
    'filters[commodity]': commodity,
  });
  const url = `${DATA_GOV_BASE_URL}/${AGMARKNET_RESOURCE_ID}?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  const json = await response.json();
  return json.records || [];
};

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────
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

// ─── COMMODITY & MOCK DATA ────────────────────────────────────────────────
const COMMODITY_MAP = {
  Tomato: 'Tomato', Wheat: 'Wheat', Onion: 'Onion', Potato: 'Potato',
  Maize: 'Maize', Rice: 'Rice', Garlic: 'Garlic', Soybean: 'Soybean',
  Mustard: 'Mustard', Cotton: 'Cotton', Cauliflower: 'Cauliflower', Chilli: 'Chilli',
};

const MOCK_PRICE_DATA = {
  Tomato: [28, 35, 52, 65, 42, 38, 45, 58],
  Wheat: [18, 19, 22, 21, 20, 22, 23, 22],
  Onion: [22, 38, 60, 48, 32, 28, 40, 52],
  Potato: [24, 22, 18, 26, 32, 30, 27, 25],
  Maize: [15, 16, 19, 21, 18, 17, 18, 21],
  Rice: [32, 33, 35, 36, 34, 35, 37, 38],
  Garlic: [80, 95, 120, 145, 100, 85, 90, 110],
  Soybean: [42, 44, 48, 50, 46, 45, 47, 49],
  Mustard: [55, 58, 62, 65, 60, 58, 61, 64],
  Cotton: [60, 62, 58, 65, 70, 68, 65, 72],
  Cauliflower: [20, 25, 35, 28, 22, 18, 24, 30],
  Chilli: [85, 95, 110, 130, 100, 90, 95, 105],
};

const MONTHS = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];

const NEARBY_FARMERS = [
  { id: 1, name: 'Ramesh Singh', village: 'Sanwer Village', dist: '2.5 km', rating: 4.8, reviews: 124, crops: ['🍅 Tomatoes', '🧅 Onions'], verified: true, avatar: 'RS', deliveries: 230, price: '₹38–42/kg', badge: 'Top Seller' },
  { id: 2, name: 'Suresh Patel', village: 'Dewas Road', dist: '3.1 km', rating: 4.6, reviews: 89, crops: ['🥔 Potatoes', '🌽 Maize'], verified: true, avatar: 'SP', deliveries: 156, price: '₹22–28/kg', badge: 'Fast Delivery' },
  { id: 3, name: 'Village Co-op', village: 'Palda', dist: '1.2 km', rating: 4.9, reviews: 312, crops: ['🌾 Wheat', '🫘 Soybean', '🌻 Mustard'], verified: true, avatar: 'VC', deliveries: 580, price: '₹20–48/kg', badge: 'Best Rated' },
  { id: 4, name: 'Kisan Kumar', village: 'Ujjain Road', dist: '4.2 km', rating: 4.4, reviews: 67, crops: ['🥦 Cauliflower', '🌶️ Chilli', '🧄 Garlic'], verified: false, avatar: 'KK', deliveries: 98, price: '₹25–110/kg', badge: null },
  { id: 5, name: 'Meena Devi', village: 'Mhow', dist: '5.8 km', rating: 4.7, reviews: 201, crops: ['🍚 Rice', '🧅 Onions'], verified: true, avatar: 'MD', deliveries: 345, price: '₹28–36/kg', badge: 'Organic' },
];

// ─── GLOBAL TRANSLATIONS (Fast cache for common terms) ────────────────────
const GLOBAL_TRANSLATIONS = {
  'Dashboard': { en: 'Dashboard', hi: 'डैशबोर्ड', mr: 'डॅशबोर्ड', ta: 'டாஷ்போர்டு', te: 'డాష్బోర్డు', bn: 'ড্যাশবোর্ড' },
  'Tools': { en: 'Tools', hi: 'औज़ार', mr: 'साधने', ta: 'கருவிகள்', te: 'సాధనాలు', bn: 'সরঞ্জাম' },
  "Today's Earnings": { en: "Today's Earnings", hi: "आज की कमाई", mr: "आजची कमाई", ta: "இன்றைய வருமானம்", te: "నేటి ఆదాయం", bn: "আজকের আয়" },
  'Products': { en: 'Products', hi: 'उत्पाद', mr: 'उत्पादने', ta: 'தயாரிப்புகள்', te: 'ఉత్పత్తులు', bn: 'পণ্য' },
  'Orders': { en: 'Orders', hi: 'ऑर्डर', mr: 'ऑर्डर्स', ta: 'ஆர்டர்கள்', te: 'ఆర్డర్లు', bn: 'অর্ডার' },
  'Rating': { en: 'Rating', hi: 'रेटिंग', mr: 'रेटिंग', ta: 'மதிப்பீடு', te: 'రేటింగ్', bn: 'রেটিং' },
  'Overview': { en: 'Overview', hi: 'अवलोकन', mr: 'आढावा', ta: 'கண்ணோட்டம்', te: 'అవలోకనం', bn: 'সংক্ষিপ্ত বিবরণ' },
  'Market': { en: 'Market', hi: 'बाज़ार', mr: 'बाजार', ta: 'சந்தை', te: 'మార్కెట్', bn: 'বাজার' },
  'Analytics': { en: 'Analytics', hi: 'विश्लेषण', mr: 'विश्लेषण', ta: 'பகுப்பாய்வு', te: 'விశ్లేషణ', bn: 'বিশ্লেষণ' },
  'Farmers': { en: 'Farmers', hi: 'किसान', mr: 'शेतकरी', ta: 'விவசாயிகள்', te: 'రైతులు', bn: 'কৃষক' },
  'Price': { en: 'Price', hi: 'मूल्य', mr: 'किंमत', ta: 'விலை', te: 'ధర', bn: 'মূল্য' },
  'Available': { en: 'Available', hi: 'उपलब्ध', mr: 'उपलब्ध', ta: 'கிடைக்கிறது', te: 'అందుబాటులో', bn: 'পাওয়া যায়' },
  'Distance': { en: 'Distance', hi: 'दूरी', mr: 'अंतर', ta: 'தூரம்', te: 'దూరం', bn: 'দূরত্ব' },
  'Contact Now': { en: 'Contact Now', hi: 'अभी संपर्क करें', mr: 'आता संपर्क करा', ta: 'இப்போது தொடர்பு கொள்ளவும்', te: 'ఇప్పుడు సంప్రదించండి', bn: 'এখনই যোগাযোগ করুন' },
  'Close': { en: 'Close', hi: 'बंद करें', mr: 'बंद करा', ta: 'மூடு', te: 'మూసివేయి', bn: 'বন্ধ করুন' },
  'Buy Now': { en: 'Buy Now', hi: 'खरीदें', mr: 'आता खरेदी करा', ta: 'இப்போது வாங்கவும்', te: 'ఇప్పుడే కొనండి', bn: 'এখনই কিনুন' },
};

// ─── DYNAMIC TRANSLATOR HOOK ─────────────────────────────────────────────
const translationCache = {};
const listeners = new Set();
const notifyListeners = () => listeners.forEach(l => l());

const useTranslation = (language) => {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    listeners.add(forceUpdate);
    return () => listeners.delete(forceUpdate);
  }, []);

  const t = useCallback((enText, hiText) => {
    if (!enText) return '';
    if (language === 'en') return enText;
    
    // Quick fallback check inside our predefined hardcoded global translations
    const globalKey = Object.keys(GLOBAL_TRANSLATIONS).find(k => GLOBAL_TRANSLATIONS[k].en === enText || k === enText);
    if (globalKey && GLOBAL_TRANSLATIONS[globalKey][language]) {
      return GLOBAL_TRANSLATIONS[globalKey][language];
    }
    
    // Special fallback for Hindi if hardcoded in component
    if (language === 'hi' && hiText) return hiText;

    const cacheKey = `${language}_${enText}`;
    
    // If we have it in cache, return it immediately
    if (translationCache[cacheKey]) {
      return translationCache[cacheKey];
    }

    // If it's not in cache and not currently fetching, fetch it via free translate API
    if (translationCache[cacheKey] === undefined) {
      // Set an optimistic fallback (Hindi if available, else English) to avoid infinite re-renders
      translationCache[cacheKey] = hiText || enText;
      
      fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${language}&dt=t&q=${encodeURIComponent(enText)}`)
        .then(res => res.json())
        .then(json => {
          if (json && json[0]) {
            const translated = json[0].map(item => item[0]).join('');
            translationCache[cacheKey] = translated;
            notifyListeners(); // trigger re-render in all components using this hook
          }
        })
        .catch(err => {
          console.warn("Translation failed for", enText, err);
        });
    }

    return translationCache[cacheKey]; // returns the optimistic fallback until fetched
  }, [language]);

  return t;
};

// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [currentScreen, setCurrentScreen] = useState('onboarding');
  const [role, setRole] = useState(null);
  const [language, setLanguage] = useState('en');
  const [currentUser, setCurrentUser] = useState(null);

  const [cropImage, setCropImage] = useState(null);
  const [cropName, setCropName] = useState('');
  const [isListeningAdd, setIsListeningAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isListeningSearch, setIsListeningSearch] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(0);
  const [farmerTab, setFarmerTab] = useState('dashboard');
  const [retailerTab, setRetailerTab] = useState('dashboard');
  const [cropType, setCropType] = useState('');
  const [areaAcres, setAreaAcres] = useState('');
  const [seedCost, setSeedCost] = useState('');
  const [fertCost, setFertCost] = useState('');
  const [profitResult, setProfitResult] = useState(null);
  const [soilType, setSoilType] = useState('');
  const [season, setSeason] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [cart, setCart] = useState([]);
  const [selectedPriceCrop, setSelectedPriceCrop] = useState('Tomato');
  const [aiSellLoading, setAiSellLoading] = useState(false);
  const [aiSellAdvice, setAiSellAdvice] = useState(null);
  const [livePrice, setLivePrice] = useState(null);
  const [livePriceLoading, setLivePriceLoading] = useState(false);
  const [livePriceError, setLivePriceError] = useState(null);
  const [priceData, setPriceData] = useState(MOCK_PRICE_DATA);
  const [farmerSearch, setFarmerSearch] = useState('');

  // ── Listings state — used by Add Product & Dashboard ──────────────────
  const [myListings, setMyListings] = useState([
    { emoji: '🍅', name: 'Fresh Tomatoes', nameHi: 'ताजे टमाटर', price: '₹ 40/kg', qty: '50 kg', trend: '+₹2' },
    { emoji: '🧅', name: 'Red Onions', nameHi: 'लाल प्याज', price: '₹ 30/kg', qty: '120 kg', trend: '-₹1' },
    { emoji: '🌾', name: 'Wheat', nameHi: 'गेहूं', price: '₹ 22/kg', qty: '200 kg', trend: '=' },
  ]);

  const t = useTranslation(language);
  const navigateTo = (screen) => setCurrentScreen(screen);

  // ── FIX: Role-aware auto-login — reads role from Firestore only ──────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && !currentUser) {
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (snap.exists()) {
            const data = snap.data();
            setCurrentUser({ uid: firebaseUser.uid, ...data });
            setLanguage(data.language || 'en');
            const userRole = data.role;
            setRole(userRole);
            navigateTo(ROLE_CONFIG[userRole].screen);
          }
        } catch (e) { /* stay on onboarding */ }
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchLivePrice = useCallback(async (crop) => {
    setLivePriceLoading(true); setLivePriceError(null); setLivePrice(null);
    try {
      const records = await fetchMandiPrice(COMMODITY_MAP[crop]);
      if (records.length > 0) {
        const r = records[0];
        setLivePrice({
          modal_price: parseFloat(r.modal_price || r.Modal_Price || 0),
          min_price: parseFloat(r.min_price || r.Min_Price || 0),
          max_price: parseFloat(r.max_price || r.Max_Price || 0),
          market: r.market || r.Market || r.district || DEFAULT_DISTRICT,
          date: r.arrival_date || r.Arrival_Date || 'Today',
        });
        setPriceData(prev => {
          const base = MOCK_PRICE_DATA[crop].slice(0, 7);
          const live = Math.round(parseFloat(r.modal_price || r.Modal_Price || base[6]));
          return { ...prev, [crop]: [...base, live] };
        });
      } else {
        setLivePriceError(t('No data found for this crop.', 'इस फसल का डेटा नहीं मिला।'));
        setPriceData(prev => ({ ...prev, [crop]: MOCK_PRICE_DATA[crop] }));
      }
    } catch (err) {
      setLivePriceError(t('Could not load live price. Showing estimated data.', 'लाइव कीमत लोड नहीं हो सकी।'));
      setPriceData(prev => ({ ...prev, [crop]: MOCK_PRICE_DATA[crop] }));
    } finally {
      setLivePriceLoading(false);
    }
  }, [language]);

  useEffect(() => {
    if (currentScreen === 'priceHistory') fetchLivePrice(selectedPriceCrop);
  }, [selectedPriceCrop, currentScreen]);

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(t('Permission Denied', 'अनुमति नहीं मिली'), t('Enable camera in settings.', 'सेटिंग में कैमरा सक्षम करें।'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 1 });
    if (!result.canceled) setCropImage(result.assets[0].uri);
  };

  const handleVoiceInput = (setListeningState, setTargetText, mockText) => {
    setListeningState(true);
    if (Platform.OS === 'web' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SR();
      recognition.lang = language === 'en' ? 'en-US' : 'hi-IN';
      recognition.interimResults = false; recognition.maxAlternatives = 1;
      recognition.onresult = (e) => { setTargetText(e.results[0][0].transcript); setListeningState(false); };
      recognition.onerror = () => { setListeningState(false); setTargetText(mockText); };
      recognition.onend = () => setListeningState(false);
      recognition.start();
    } else {
      setTimeout(() => { setTargetText(mockText); setListeningState(false); }, 2000);
    }
  };

  const handleLogout = async () => {
    try { await signOut(auth); } catch (_) { }
    setRole(null); setCurrentUser(null);
    navigateTo('onboarding');
  };

  const roleColor = () => {
    if (role === 'retailer') return COLORS.retailerMid;
    if (role === 'buyer') return COLORS.buyerMid;
    return COLORS.primaryMid;
  };

  // ─── SHARED COMPONENTS ──────────────────────────────────────────────────
  const StatCard = ({ icon, label, value, color, bg }) => (
    <View style={[S.statCard, { backgroundColor: bg }]}>
      <Text style={{ fontSize: 20, marginBottom: 4 }}>{icon}</Text>
      <Text style={[S.statValue, { color }]}>{value}</Text>
      <Text style={S.statLabel}>{label}</Text>
    </View>
  );

  const SectionHeader = ({ title, action, onAction }) => (
    <View style={S.sectionHeader}>
      <Text style={S.sectionTitle}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={onAction}>
          <Text style={[S.sectionAction, { color: roleColor() }]}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const AppHeader = ({ emoji, title, subtitle, onProfile, accent = COLORS.primaryMid }) => (
    <View style={[S.appHeader, { borderBottomColor: COLORS.borderLight }]}>
      <View style={S.headerLeft}>
        <View style={[S.headerIconBox, { backgroundColor: accent + '18' }]}>
          <Text style={{ fontSize: 22 }}>{emoji}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={S.headerGreeting}>{title}</Text>
          <Text style={[S.headerSubtitle, { color: accent }]}>{subtitle}</Text>
        </View>
      </View>
      {onProfile && (
        <TouchableOpacity onPress={onProfile} style={[S.avatarBtn, { backgroundColor: accent + '18' }]}>
          <Text style={[S.avatarBtnText, { color: accent }]}>
            {currentUser?.name?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const BackHeader = ({ title, onBack, rightAction }) => (
    <View style={S.backHeader}>
      <TouchableOpacity onPress={onBack} style={S.backBtn2} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Text style={S.backArrow}>‹</Text>
      </TouchableOpacity>
      <Text style={S.backTitle} numberOfLines={1}>{title}</Text>
      {rightAction || <View style={{ width: 40 }} />}
    </View>
  );

  // ─── SCREEN: FARMER DASHBOARD ────────────────────────────────────────────
  const FarmerDashboard = () => (
    <View style={S.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
      <AppHeader
        emoji="🌾"
        title={t(`Namaste, ${currentUser?.name?.split(' ')[0] || 'Kisan'} 👋`, `नमस्ते, ${currentUser?.name?.split(' ')[0] || 'किसान'} 👋`)}
        subtitle={farmerTab === 'dashboard' ? t('Your farm at a glance', 'खेत का सारांश') : t('Farmer tools & insights', 'किसान औज़ार')}
        onProfile={() => navigateTo('profile')}
        accent={COLORS.primaryMid}
      />

      <View style={S.tabBar}>
        {[
          { key: 'dashboard', icon: '🏠', label: t('Dashboard', 'डैशबोर्ड') },
          { key: 'tools', icon: '🛠️', label: t('Tools', 'औज़ार') },
        ].map(tab => (
          <TouchableOpacity key={tab.key} style={[S.tabItem, farmerTab === tab.key && S.tabItemActive]} onPress={() => setFarmerTab(tab.key)}>
            <Text style={{ fontSize: 16 }}>{tab.icon}</Text>
            <Text style={[S.tabLabel, farmerTab === tab.key && { color: COLORS.primaryMid }]}>{tab.label}</Text>
            {farmerTab === tab.key && <View style={[S.tabIndicator, { backgroundColor: COLORS.primaryMid }]} />}
          </TouchableOpacity>
        ))}
      </View>

      {farmerTab === 'dashboard' ? (
        <ScrollView contentContainerStyle={S.scrollPad} showsVerticalScrollIndicator={false}>
          {/* Earnings Hero */}
          <View style={[S.heroCard, { backgroundColor: COLORS.primaryMid }]}>
            <Text style={S.heroLabel}>{t("Today's Earnings", "आज की कमाई")}</Text>
            <Text style={S.heroAmount}>₹ 4,500</Text>
            <View style={S.heroTrend}>
              <Text style={S.heroTrendText}>↑ 12% {t('from yesterday', 'कल से')}</Text>
            </View>
          </View>

          <View style={S.statsGrid}>
            <StatCard icon="📦" label={t('Products', 'उत्पाद')} value={String(myListings.length)} color={COLORS.primaryMid} bg={COLORS.primaryBg} />
            <StatCard icon="🛒" label={t('Orders', 'ऑर्डर')} value="12" color={COLORS.warning} bg="#FFF3E0" />
            <StatCard icon="⭐" label={t('Rating', 'रेटिंग')} value="4.8" color={COLORS.accent} bg={COLORS.accentLight} />
          </View>

          {/* Auction Quick-Access Banner */}
          <TouchableOpacity
            style={[S.auctionBanner]}
            onPress={() => navigateTo('auction')}
            activeOpacity={0.87}
          >
            <View style={S.auctionBannerLeft}>
              <Text style={{ fontSize: 28 }}>🔨</Text>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={S.auctionBannerTitle}>{t('Live Auction', 'लाइव नीलामी')}</Text>
                <Text style={S.auctionBannerSub}>{t('Get the best price via bidding', 'बोली लगाकर सबसे अच्छी कीमत पाएं')}</Text>
              </View>
            </View>
            <View style={S.auctionLivePill}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#69F0AE', marginRight: 5 }} />
              <Text style={S.auctionLiveTxt}>{t('LIVE', 'लाइव')}</Text>
            </View>
          </TouchableOpacity>

          <View style={[S.signalCard, { borderLeftColor: COLORS.primaryLight }]}>
            <View style={S.signalDot} />
            <View style={{ flex: 1 }}>
              <Text style={S.signalTitle}>{t('Market Pulse', 'बाजार का हाल')}</Text>
              <Text style={S.signalText}>{t('Tomatoes & Onions are selling fast — high demand today!', 'टमाटर और प्याज की मांग आज अधिक है!')}</Text>
            </View>
            <Text style={{ fontSize: 20 }}>📈</Text>
          </View>

          <TouchableOpacity style={S.featureCard} onPress={() => navigateTo('nearbyMandi')} activeOpacity={0.85}>
            <View style={[S.featureCardIcon, { backgroundColor: COLORS.primaryBg }]}><Text style={{ fontSize: 26 }}>🏪</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={S.featureCardTitle}>{t('Nearby Mandis', 'नज़दीकी मंडी')}</Text>
              <Text style={S.featureCardSub}>{t('Live prices • Distance • Ratings', 'लाइव भाव • दूरी • रेटिंग')}</Text>
            </View>
            <Text style={[S.featureCardChevron, { color: COLORS.primaryMid }]}>›</Text>
          </TouchableOpacity>

          <SectionHeader
            title={t('My Listings', 'मेरी फसलें')}
            action={t('+ Add', '+ जोड़ें')}
            onAction={() => navigateTo('addProduct')}
          />
          {myListings.map((p, i) => (
            <TouchableOpacity key={i} style={S.listingRow} activeOpacity={0.85}
              onPress={() => Alert.alert(p.name, `${t('Price', 'मूल्य')}: ${p.price}\n${t('Available', 'उपलब्ध')}: ${p.qty}`)}>
              <View style={S.listingEmoji}><Text style={{ fontSize: 28 }}>{p.emoji}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={S.listingName}>{t(p.name, p.nameHi)}</Text>
                <Text style={S.listingQty}>{p.qty} {t('available', 'उपलब्ध')}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[S.listingPrice, { color: COLORS.primaryMid }]}>{p.price}</Text>
                <Text style={[S.listingTrend, {
                  color: p.trend.startsWith('+') ? COLORS.success : p.trend.startsWith('-') ? COLORS.danger : COLORS.textLight
                }]}>{p.trend}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={S.scrollPad} showsVerticalScrollIndicator={false}>
          <Text style={S.toolsTagline}>{t('Smart tools to plan, analyze, and grow your farm.', 'खेती को बेहतर बनाने के लिए स्मार्ट औज़ार।')}</Text>

          <View style={S.toolsGrid}>
            {[
              { screen: 'aiCropRec', emoji: '🌱', title: t('AI Crop Advice', 'AI फसल सुझाव'), desc: t('Soil & season based picks', 'मिट्टी और मौसम आधारित'), bg: '#E8F5E9', accent: COLORS.primaryMid },
              { screen: 'profitEstimator', emoji: '📊', title: t('Profit Estimator', 'लाभ अनुमानक'), desc: t('Investment vs returns', 'निवेश और रिटर्न'), bg: '#FFF8E1', accent: '#F9A825' },
              { screen: 'agriStore', emoji: '🏪', title: t('Agri Store', 'कृषि स्टोर'), desc: t('Seeds, fertilizers & tools', 'बीज, खाद और उपकरण'), bg: '#E3F2FD', accent: COLORS.retailerMid },
              { screen: 'farmingNews', emoji: '📰', title: t('Kisan News', 'किसान समाचार'), desc: t('Schemes & advisories', 'योजनाएं और परामर्श'), bg: '#F3E5F5', accent: COLORS.buyerMid },
            ].map((tool, i) => (
              <TouchableOpacity key={i} style={S.toolCard} onPress={() => navigateTo(tool.screen)} activeOpacity={0.85}>
                <View style={[S.toolIconBg, { backgroundColor: tool.bg }]}>
                  <Text style={{ fontSize: 26 }}>{tool.emoji}</Text>
                </View>
                <Text style={S.toolTitle}>{tool.title}</Text>
                <Text style={S.toolDesc}>{tool.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Price History */}
          <TouchableOpacity style={S.wideToolCard} onPress={() => { setAiSellAdvice(null); navigateTo('priceHistory'); }} activeOpacity={0.85}>
            <View style={[S.toolIconBg, { backgroundColor: '#FCE4EC', marginBottom: 0, marginRight: 16 }]}>
              <Text style={{ fontSize: 26 }}>📈</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={S.toolTitle}>{t('Price History & Sell Advisor', 'मूल्य इतिहास और AI सलाह')}</Text>
              <Text style={S.toolDesc}>{t('Live mandi rates + AI tells when to sell', 'लाइव भाव + कब बेचें AI बताएगा')}</Text>
            </View>
            <Text style={{ fontSize: 22, color: COLORS.textLight }}>›</Text>
          </TouchableOpacity>

          {/* Auction Tool Card */}
          <TouchableOpacity style={[S.wideToolCard, { marginTop: 12, borderColor: COLORS.primaryLight }]} onPress={() => navigateTo('auction')} activeOpacity={0.85}>
            <View style={[S.toolIconBg, { backgroundColor: '#FFF9C4', marginBottom: 0, marginRight: 16 }]}>
              <Text style={{ fontSize: 26 }}>🔨</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={S.toolTitle}>{t('Crop Auction', 'फसल नीलामी')}</Text>
              <Text style={S.toolDesc}>{t('Let buyers bid — get best market price', 'खरीदारों को बोली लगाने दें — सबसे अच्छा भाव पाएं')}</Text>
            </View>
            <View style={{ backgroundColor: COLORS.primaryMid, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{t('NEW', 'नया')}</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      )}

      {farmerTab === 'dashboard' && (
        <TouchableOpacity style={[S.fab, { backgroundColor: COLORS.primaryMid }]} onPress={() => navigateTo('addProduct')} activeOpacity={0.9}>
          <Plus color="#fff" size={26} strokeWidth={2.5} />
        </TouchableOpacity>
      )}
    </View>
  );

  // ─── SCREEN: RETAILER DASHBOARD ──────────────────────────────────────────
  const RetailerDashboard = () => {
    const RC = COLORS.retailerMid;
    const bulkOrders = [
      { id: 'BO-1021', crop: 'Tomatoes', emoji: '🍅', qty: '500 kg', farmer: 'Ramesh Singh', status: 'Confirmed', statusColor: COLORS.success, price: '₹38/kg' },
      { id: 'BO-1020', crop: 'Onions', emoji: '🧅', qty: '300 kg', farmer: 'Suresh Farms', status: 'Pending', statusColor: COLORS.warning, price: '₹28/kg' },
      { id: 'BO-1019', crop: 'Potatoes', emoji: '🥔', qty: '1000 kg', farmer: 'Village Co-op', status: 'Delivered', statusColor: RC, price: '₹22/kg' },
    ];
    const availableCrops = [
      { name: 'Tomatoes', emoji: '🍅', price: '₹38/kg', available: '2 tonnes', farmer: 'Ramesh Singh', dist: '2.5 km' },
      { name: 'Wheat', emoji: '🌾', price: '₹22/kg', available: '5 tonnes', farmer: 'Village Co-op', dist: '1.2 km' },
      { name: 'Onions', emoji: '🧅', price: '₹30/kg', available: '3 tonnes', farmer: 'Suresh Farms', dist: '4.1 km' },
      { name: 'Potatoes', emoji: '🥔', price: '₹24/kg', available: '10 tonnes', farmer: 'Kisan Kumar', dist: '3.3 km' },
    ];

    return (
      <View style={S.screen}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
        <AppHeader
          emoji="🏬"
          title={t(`Namaste, ${currentUser?.name?.split(' ')[0] || 'Trader'} 👋`, `नमस्ते, ${currentUser?.name?.split(' ')[0] || 'व्यापारी'} 👋`)}
          subtitle={t('Retailer Dashboard', 'व्यापारी डैशबोर्ड')}
          onProfile={() => navigateTo('profile')}
          accent={RC}
        />
        <View style={S.tabBar}>
          {[
            { key: 'dashboard', icon: '🏠', label: t('Overview', 'अवलोकन') },
            { key: 'orders', icon: '📋', label: t('Orders', 'ऑर्डर') },
            { key: 'market', icon: '🌾', label: t('Market', 'बाज़ार') },
            { key: 'analytics', icon: '📊', label: t('Analytics', 'विश्लेषण') },
          ].map(tab => (
            <TouchableOpacity key={tab.key} style={[S.tabItem, retailerTab === tab.key && S.tabItemActive]} onPress={() => setRetailerTab(tab.key)}>
              <Text style={{ fontSize: 15 }}>{tab.icon}</Text>
              <Text style={[S.tabLabel, retailerTab === tab.key && { color: RC }]}>{tab.label}</Text>
              {retailerTab === tab.key && <View style={[S.tabIndicator, { backgroundColor: RC }]} />}
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView contentContainerStyle={S.scrollPad} showsVerticalScrollIndicator={false}>
          {retailerTab === 'dashboard' && (
            <>
              <View style={[S.heroCard, { backgroundColor: RC }]}>
                <Text style={S.heroLabel}>{t("Today's Purchase Value", "आज की खरीद")}</Text>
                <Text style={S.heroAmount}>₹ 1,14,000</Text>
                <View style={S.heroTrend}><Text style={S.heroTrendText}>↑ 8% {t('from yesterday', 'कल से')}</Text></View>
              </View>
              <View style={S.statsGrid}>
                <StatCard icon="📦" label={t('Active Orders', 'सक्रिय')} value="8" color={RC} bg={COLORS.retailerBg} />
                <StatCard icon="🚜" label={t('Farmers', 'किसान')} value="24" color={COLORS.warning} bg="#FFF3E0" />
                <StatCard icon="🚚" label={t('Pending', 'बाकी')} value="3" color={COLORS.danger} bg={COLORS.dangerLight} />
              </View>
              <SectionHeader title={t('Recent Orders', 'हालिया ऑर्डर')} />
              {bulkOrders.map((order) => (
                <TouchableOpacity key={order.id} style={[S.orderCard, { borderLeftColor: order.statusColor }]}
                  onPress={() => Alert.alert(order.id, `${t(order.crop)} ${order.qty}\n${t(order.farmer)}\n${order.price}`)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 30, marginRight: 12 }}>{order.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={S.orderCrop}>{t(order.crop)} — {order.qty}</Text>
                      <Text style={S.orderMeta}>{t(order.farmer)} • {order.price}</Text>
                      <Text style={S.orderId}>{order.id}</Text>
                    </View>
                    <View style={[S.statusPill, { backgroundColor: order.statusColor + '1A' }]}>
                      <Text style={[S.statusPillText, { color: order.statusColor }]}>{t(order.status)}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}
          {retailerTab === 'orders' && (
            <>
              <View style={[S.infoBox, { backgroundColor: COLORS.retailerBg, borderColor: COLORS.retailerMid + '40' }]}>
                <Text style={[S.infoBoxTitle, { color: RC }]}>📋 {t('Bulk Order Management', 'थोक ऑर्डर')}</Text>
                <Text style={[S.infoBoxText, { color: RC }]}>{t('Track and manage all bulk orders.', 'सभी ऑर्डर एक जगह ट्रैक करें।')}</Text>
              </View>
              {[
                { id: 'BO-1021', crop: 'Tomatoes', emoji: '🍅', qty: '500 kg', farmer: 'Ramesh Singh', status: 'Confirmed', statusColor: COLORS.success, price: '₹38/kg', total: '₹19,000', date: 'Today' },
                { id: 'BO-1020', crop: 'Onions', emoji: '🧅', qty: '300 kg', farmer: 'Suresh Farms', status: 'Pending', statusColor: COLORS.warning, price: '₹28/kg', total: '₹8,400', date: 'Yesterday' },
                { id: 'BO-1019', crop: 'Potatoes', emoji: '🥔', qty: '1000 kg', farmer: 'Village Co-op', status: 'Delivered', statusColor: RC, price: '₹22/kg', total: '₹22,000', date: '2 days ago' },
              ].map((order) => (
                <TouchableOpacity key={order.id} style={[S.orderCard, { borderLeftColor: order.statusColor }]}
                  onPress={() => Alert.alert(order.id, `${t(order.crop)} ${order.qty}\n${t(order.farmer)}\n${order.price} • ${order.total}`)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 30, marginRight: 12 }}>{order.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={S.orderCrop}>{t(order.crop)} — {order.qty}</Text>
                      <Text style={S.orderMeta}>{t(order.farmer)} • {t(order.date)}</Text>
                      <Text style={[S.orderMeta, { color: RC, fontWeight: '700' }]}>{order.price} • {order.total}</Text>
                    </View>
                    <View style={[S.statusPill, { backgroundColor: order.statusColor + '1A' }]}>
                      <Text style={[S.statusPillText, { color: order.statusColor }]}>{t(order.status)}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={[S.primaryBtn, { backgroundColor: RC }]}
                onPress={() => Alert.alert(t('New Bulk Order', 'नया थोक ऑर्डर'), t('Feature coming soon!', 'जल्द आ रहा है!'))}>
                <Text style={S.primaryBtnText}>+ {t('New Bulk Order', 'नया थोक ऑर्डर')}</Text>
              </TouchableOpacity>
            </>
          )}
          {retailerTab === 'market' && (
            <>
              <View style={[S.infoBox, { backgroundColor: COLORS.retailerBg, borderColor: COLORS.retailerMid + '40' }]}>
                <Text style={[S.infoBoxTitle, { color: RC }]}>🌾 {t('Fresh Produce Available', 'उपलब्ध उपज')}</Text>
                <Text style={[S.infoBoxText, { color: RC }]}>{t('Buy directly from verified farmers.', 'सत्यापित किसानों से सीधे खरीदें।')}</Text>
              </View>
              {availableCrops.map((crop, i) => (
                <TouchableOpacity key={i} style={S.marketRow}
                  onPress={() => Alert.alert(t(crop.name), `${t('Price', 'मूल्य')}: ${crop.price}\n${t('Available', 'उपलब्ध')}: ${crop.available}\n${t('Farmer', 'किसान')}: ${t(crop.farmer)}`)}>
                  <Text style={{ fontSize: 34, marginRight: 14 }}>{crop.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={S.marketCropName}>{t(crop.name)}</Text>
                    <Text style={S.marketCropMeta}>{t(crop.farmer)} • {crop.dist}</Text>
                    <Text style={[S.marketCropAvail, { color: RC }]}>{crop.available} {t('available', 'उपलब्ध')}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[S.marketPrice, { color: RC }]}>{crop.price}</Text>
                    <TouchableOpacity style={[S.negotiateBtn, { borderColor: RC }]}
                      onPress={() => Alert.alert(t('Negotiate', 'मोलभाव'), `${t('Contact', 'संपर्क')}: ${crop.farmer}\n${t('Asking', 'मांग')}: ${crop.price}`)}>
                      <Text style={[S.negotiateBtnTxt, { color: RC }]}>{t('Negotiate', 'मोलभाव')}</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}
          {retailerTab === 'analytics' && (
            <>
              <View style={[S.heroCard, { backgroundColor: RC }]}>
                <Text style={S.heroLabel}>{t('Monthly Spend', 'मासिक खर्च')}</Text>
                <Text style={S.heroAmount}>₹ 3,42,000</Text>
                <View style={S.heroTrend}><Text style={S.heroTrendText}>↑ 8% {t('from last month', 'पिछले महीने से')}</Text></View>
              </View>
              <SectionHeader title={t('Top Crops Purchased', 'सबसे ज़्यादा खरीदी')} />
              {[
                { emoji: '🌾', name: 'Wheat', qty: '8.0 t', spend: '₹1,68,000', pct: 1.0 },
                { emoji: '🍅', name: 'Tomatoes', qty: '4.2 t', spend: '₹1,59,600', pct: 0.82 },
                { emoji: '🥔', name: 'Potatoes', qty: '5.1 t', spend: '₹1,02,000', pct: 0.72 },
                { emoji: '🧅', name: 'Onions', qty: '2.8 t', spend: '₹78,400', pct: 0.60 },
              ].map((crop, i) => (
                <View key={i} style={S.analyticsRow}>
                  <Text style={{ fontSize: 26, marginRight: 12 }}>{crop.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={S.analyticsCropName}>{t(crop.name)} <Text style={S.analyticsCropQty}>{crop.qty}</Text></Text>
                      <Text style={[S.analyticsCropSpend, { color: RC }]}>{crop.spend}</Text>
                    </View>
                    <View style={S.progressBg}>
                      <View style={[S.progressFill, { width: `${crop.pct * 100}%`, backgroundColor: RC }]} />
                    </View>
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </View>
    );
  };

  // ─── SCREEN: BUYER MARKETPLACE ───────────────────────────────────────────
  const BuyerMarketplace = () => {
    const [activeTab, setActiveTab] = useState('market');
    const BC = COLORS.buyerMid;

    const filteredFarmers = NEARBY_FARMERS.filter(f =>
      farmerSearch === '' ||
      f.name.toLowerCase().includes(farmerSearch.toLowerCase()) ||
      f.crops.some(c => c.toLowerCase().includes(farmerSearch.toLowerCase()))
    );

    return (
      <View style={S.screen}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
        <AppHeader
          emoji="🛒"
          title={t(`Namaste, ${currentUser?.name?.split(' ')[0] || 'Guest'} 👋`, `नमस्ते, ${currentUser?.name?.split(' ')[0] || 'अतिथि'} 👋`)}
          subtitle={t('Fresh from nearby farms', 'आसपास के खेतों से सीधे')}
          onProfile={() => navigateTo('profile')}
          accent={BC}
        />

        <View style={S.tabBar}>
          {[
            { key: 'market', icon: '🌾', label: t('Market', 'बाज़ार') },
            { key: 'farmers', icon: '👨🏽‍🌾', label: t('Farmers', 'किसान') },
          ].map(tab => (
            <TouchableOpacity key={tab.key} style={[S.tabItem, activeTab === tab.key && S.tabItemActive]} onPress={() => setActiveTab(tab.key)}>
              <Text style={{ fontSize: 16 }}>{tab.icon}</Text>
              <Text style={[S.tabLabel, activeTab === tab.key && { color: BC }]}>{tab.label}</Text>
              {activeTab === tab.key && <View style={[S.tabIndicator, { backgroundColor: BC }]} />}
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'market' ? (
          <>
            <View style={[S.searchBar, isListeningSearch && { borderColor: COLORS.accent }]}>
              <Search color={BC} size={18} />
              <TextInput
                style={S.searchInput}
                placeholder={isListeningSearch ? t('Listening...', 'सुन रहा हूँ...') : t('Search crops, farmers...', 'फसलें खोजें...')}
                placeholderTextColor={isListeningSearch ? COLORS.accent : COLORS.textLight}
                value={searchQuery} onChangeText={setSearchQuery}
              />
              <TouchableOpacity
                style={[S.micPill, isListeningSearch && { backgroundColor: COLORS.accent }]}
                onPress={() => handleVoiceInput(setIsListeningSearch, setSearchQuery, t('Fresh Tomatoes', 'ताजे टमाटर'))}
              >
                <Mic color="#fff" size={16} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={S.scrollPad} showsVerticalScrollIndicator={false}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                {['All', 'Vegetables', 'Fruits', 'Grains', '< 5km'].map((f, i) => (
                  <TouchableOpacity key={i} style={[S.filterChip, selectedFilter === i && { backgroundColor: BC, borderColor: BC }]} onPress={() => setSelectedFilter(i)}>
                    <Text style={[S.filterChipText, selectedFilter === i && { color: '#fff' }]}>{f}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={S.productsGrid}>
                {[
                  { name: t('Tomatoes', 'टमाटर'), price: '40', dist: '2.5 km', farmer: 'Ramesh Singh', emoji: '🍅', rating: 4.8 },
                  { name: t('Potatoes', 'आलू'), price: '25', dist: '3.1 km', farmer: 'Kisan Kumar', emoji: '🥔', rating: 4.4 },
                  { name: t('Apples', 'सेब'), price: '120', dist: '8.0 km', farmer: 'Suraj Farms', emoji: '🍎', rating: 4.6 },
                  { name: t('Wheat', 'गेहूं'), price: '22', dist: '1.2 km', farmer: 'Village Co-op', emoji: '🌾', rating: 4.9 },
                  { name: t('Onions', 'प्याज'), price: '32', dist: '4.1 km', farmer: 'Suresh Patel', emoji: '🧅', rating: 4.6 },
                  { name: t('Chilli', 'मिर्च'), price: '95', dist: '5.8 km', farmer: 'Meena Devi', emoji: '🌶️', rating: 4.7 },
                ].map((item, i) => (
                  <TouchableOpacity key={i} style={S.productCard} onPress={() => navigateTo('productDetail')} activeOpacity={0.88}>
                    <View style={[S.productCardEmoji, { backgroundColor: COLORS.primaryBg }]}>
                      <Text style={{ fontSize: 36 }}>{item.emoji}</Text>
                    </View>
                    <Text style={S.productCardName}>{item.name}</Text>
                    <Text style={[S.productCardPrice, { color: BC }]}>₹{item.price}/kg</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                      <Text style={{ fontSize: 12, color: COLORS.accent }}>★</Text>
                      <Text style={S.productCardMeta}> {item.rating} • {item.dist}</Text>
                    </View>
                    <Text style={S.productCardFarmer} numberOfLines={1}>{item.farmer}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </>
        ) : (
          <>
            <View style={[S.searchBar, { borderColor: COLORS.borderLight }]}>
              <Search color={BC} size={18} />
              <TextInput
                style={S.searchInput}
                placeholder={t('Search farmers or crops...', 'किसान या फसल खोजें...')}
                placeholderTextColor={COLORS.textLight}
                value={farmerSearch} onChangeText={setFarmerSearch}
              />
            </View>
            <ScrollView contentContainerStyle={S.scrollPad} showsVerticalScrollIndicator={false}>
              <View style={[S.infoBox, { backgroundColor: COLORS.buyerBg, borderColor: BC + '40', marginBottom: 20 }]}>
                <Text style={[S.infoBoxTitle, { color: BC }]}>👨🏽‍🌾 {t('Nearby Verified Farmers', 'नज़दीकी सत्यापित किसान')}</Text>
                <Text style={[S.infoBoxText, { color: BC }]}>{t('Buy directly, negotiate prices & build trust with local farmers.', 'सीधे खरीदें, कीमत तय करें।')}</Text>
              </View>
              {filteredFarmers.map((farmer) => (
                <TouchableOpacity key={farmer.id} style={S.farmerCard}
                  onPress={() => Alert.alert(
                    farmer.name,
                    `${t('Distance', 'दूरी')}: ${farmer.dist}\n${t('Rating', 'रेटिंग')}: ${farmer.rating}/5 (${farmer.reviews} ${t('reviews', 'समीक्षाएं')})\n${t('Crops', 'फसलें')}: ${farmer.crops.join(', ')}\n${t('Total Deliveries', 'कुल डिलीवरी')}: ${farmer.deliveries}`,
                    [{ text: t('Contact Now', 'अभी संपर्क करें') }, { text: t('Close', 'बंद करें') }]
                  )}
                  activeOpacity={0.88}
                >
                  <View style={[S.farmerAvatar, { backgroundColor: farmer.verified ? COLORS.primaryBg : COLORS.surfaceAlt }]}>
                    <Text style={[S.farmerAvatarText, { color: farmer.verified ? COLORS.primaryMid : COLORS.textLight }]}>{farmer.avatar}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Text style={S.farmerName}>{t(farmer.name)}</Text>
                      {farmer.verified && (
                        <View style={S.verifiedBadge}>
                          <Text style={S.verifiedBadgeText}>✓ {t('Verified', 'सत्यापित')}</Text>
                        </View>
                      )}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      <Text style={{ fontSize: 12, color: COLORS.accent }}>{'★'.repeat(Math.round(farmer.rating))}{'☆'.repeat(5 - Math.round(farmer.rating))}</Text>
                      <Text style={[S.farmerMeta, { marginLeft: 6 }]}>{farmer.rating} ({farmer.reviews})</Text>
                      <Text style={[S.farmerMeta, { marginLeft: 10 }]}>📍 {farmer.dist}</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        {farmer.crops.map((crop, ci) => (
                          <View key={ci} style={[S.cropPill, { backgroundColor: COLORS.primaryBg }]}>
                            <Text style={[S.cropPillText, { color: COLORS.primaryMid }]}>{crop}</Text>
                          </View>
                        ))}
                      </View>
                    </ScrollView>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                      <View>
                        <Text style={S.farmerPriceRange}>{farmer.price}</Text>
                        <Text style={S.farmerDeliveries}>{farmer.deliveries} {t('deliveries', 'डिलीवरी')}</Text>
                      </View>
                      {farmer.badge && (
                        <View style={[S.farmerBadge, {
                          backgroundColor: farmer.badge === 'Best Rated' ? '#FFF3E0' : farmer.badge === 'Organic' ? COLORS.primaryBg : COLORS.retailerBg,
                        }]}>
                          <Text style={[S.farmerBadgeText, {
                            color: farmer.badge === 'Best Rated' ? COLORS.warning : farmer.badge === 'Organic' ? COLORS.primaryMid : COLORS.retailerMid,
                          }]}>
                            {farmer.badge === 'Best Rated' ? '⭐' : farmer.badge === 'Organic' ? '🌿' : '🚀'} {farmer.badge}
                          </Text>
                        </View>
                      )}
                      <TouchableOpacity
                        style={[S.contactBtn, { borderColor: BC, backgroundColor: BC + '0D' }]}
                        onPress={() => Alert.alert(t('Buy Now', 'खरीदें'), `${t('Contacting', 'संपर्क कर रहे हैं')} ${farmer.name}...`)}
                      >
                        <Text style={[S.contactBtnText, { color: BC }]}>{t('Buy Now', 'खरीदें')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
              {filteredFarmers.length === 0 && (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Text style={{ fontSize: 40, marginBottom: 12 }}>🔍</Text>
                  <Text style={{ color: COLORS.textMid, fontSize: 16, fontWeight: '600' }}>{t('No farmers found', 'कोई किसान नहीं मिला')}</Text>
                </View>
              )}
            </ScrollView>
          </>
        )}
      </View>
    );
  };

  // ─── SCREEN: AI CROP RECOMMENDATION ─────────────────────────────────────
  const AICropRec = () => {
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
        Alert.alert(t('Missing Info', 'जानकारी आवश्यक'), t('Please select soil type and season.', 'कृपया मिट्टी का प्रकार और मौसम चुनें।'));
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
  };

  // ─── SCREEN: PROFIT ESTIMATOR ────────────────────────────────────────────
  const ProfitEstimator = () => {
    const allCrops = ['Tomato', 'Wheat', 'Rice', 'Potato', 'Onion', 'Garlic', 'Soybean', 'Mustard', 'Cotton', 'Cauliflower', 'Chilli', 'Maize'];
    const yieldPerAcre = { Tomato: 8000, Wheat: 1800, Rice: 2200, Potato: 10000, Onion: 12000, Garlic: 3000, Soybean: 1200, Mustard: 900, Cotton: 600, Cauliflower: 15000, Chilli: 2500, Maize: 2500 };
    const pricePerKg = { Tomato: 40, Wheat: 22, Rice: 35, Potato: 25, Onion: 30, Garlic: 110, Soybean: 48, Mustard: 62, Cotton: 65, Cauliflower: 25, Chilli: 100, Maize: 18 };

    const calculateProfit = () => {
      const area = parseFloat(areaAcres) || 0;
      const seed = parseFloat(seedCost) || 0;
      const fert = parseFloat(fertCost) || 0;
      if (!area || !cropType) {
        Alert.alert(t('Missing Info', 'जानकारी आवश्यक'), t('Please select a crop and fill all fields.', 'कृपया फसल चुनें और सभी फ़ील्ड भरें।'));
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
  };

  // ─── SCREEN: AGRI STORE ──────────────────────────────────────────────────
  const AgriStore = () => {
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
  };

  // ─── SCREEN: FARMING NEWS ────────────────────────────────────────────────
  const FarmingNews = () => {
    const news = [
      { id: 1, tag: t('Scheme', 'योजना'), title: t('PM Kisan: ₹2000 installment released for all registered farmers', 'PM किसान: सभी पंजीकृत किसानों के लिए ₹2000 की किस्त जारी'), time: t('2 hours ago', '2 घंटे पहले'), emoji: '💰', color: COLORS.primaryBg, link: 'https://pmkisan.gov.in' },
      { id: 2, tag: t('Weather', 'मौसम'), title: t('IMD predicts above-normal monsoon for Kharif season 2025', 'IMD ने खरीफ 2025 के लिए सामान्य से अधिक मानसून का अनुमान'), time: t('5 hours ago', '5 घंटे पहले'), emoji: '🌧️', color: COLORS.retailerBg, link: 'https://imd.gov.in' },
      { id: 3, tag: t('Market', 'बाजार'), title: t('Onion prices rise 18% in wholesale mandis across MP', 'MP में प्याज की कीमतें 18% बढ़ीं'), time: t('Yesterday', 'कल'), emoji: '📈', color: '#FFF8E1', link: 'https://agmarknet.gov.in' },
      { id: 4, tag: t('Scheme', 'योजना'), title: t('Fasal Bima Yojana: Enrollment extended to 31 July', 'फसल बीमा योजना: नामांकन 31 जुलाई तक बढ़ाई गई'), time: t('2 days ago', '2 दिन पहले'), emoji: '🛡️', color: COLORS.buyerBg, link: 'https://pmfby.gov.in' },
      { id: 5, tag: t('Tech', 'तकनीक'), title: t('Drone spraying services now available in rural Madhya Pradesh', 'मध्य प्रदेश के ग्रामीण क्षेत्रों में ड्रोन छिड़काव उपलब्ध'), time: t('3 days ago', '3 दिन पहले'), emoji: '🚁', color: COLORS.primaryBg, link: '' },
      { id: 6, tag: t('Advisory', 'परामर्श'), title: t('Agriculture dept warns of fall armyworm attack on maize crop', 'मक्के की फसल पर फॉल आर्मीवर्म हमले की चेतावनी'), time: t('4 days ago', '4 दिन पहले'), emoji: '⚠️', color: COLORS.dangerLight, link: '' },
    ];
    return (
      <View style={S.screen}>
        <BackHeader title={t('Kisan News', 'किसान समाचार')} onBack={() => navigateTo('farmerDashboard')} />
        <ScrollView contentContainerStyle={S.scrollPad} showsVerticalScrollIndicator={false}>
          {news.map((item) => (
            <TouchableOpacity key={item.id} style={[S.newsCard, { backgroundColor: item.color }]}
              onPress={() => Alert.alert(item.title, item.link ? `${t('Source', 'स्रोत')}: ${item.link}\n\n${t('Full article available at the link above.', 'पूरा लेख ऊपर दिए लिंक पर उपलब्ध है।')}` : t('Full article coming soon!', 'पूरा लेख जल्द आ रहा है!'))}>
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
  };

  // ─── SCREEN: PRICE HISTORY ───────────────────────────────────────────────
  const PriceHistory = () => {
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
          reason = t(`Price is ₹${currentPrice}/kg — ${Math.round(pctAboveAvg)}% above the 8-month average. Strong selling window.`, `कीमत ₹${currentPrice}/किलो — औसत से ${Math.round(pctAboveAvg)}% अधिक। बेचने का अच्छा समय।`);
        } else if (recentTrend > 5 && pctAboveAvg < 20) {
          action = t('WAIT & WATCH', 'रुकें और देखें'); emoji = '🟡'; color = COLORS.warning;
          reason = t('Price is rising. Hold for 2–3 weeks for a better rate.', 'कीमत बढ़ रही है। 2–3 सप्ताह और रुकें।');
        } else if (pctAboveAvg < -10 || recentTrend < -10) {
          action = t('SELL SOON', 'जल्दी बेचें'); emoji = '🔴'; color = COLORS.danger;
          reason = t(`Price is falling at ₹${currentPrice}/kg. Sell now to avoid further loss.`, 'कीमत गिर रही है। नुकसान से बचने के लिए अभी बेचें।');
        } else {
          action = t('HOLD FOR NOW', 'अभी रोकें'); emoji = '🟡'; color = '#E65100';
          reason = t(`Price is stable at ₹${currentPrice}/kg. Monitor for 1–2 more weeks.`, 'कीमत स्थिर है। 1–2 सप्ताह और देखें।');
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
                  <Text style={S.livePriceValue}>₹{Math.round(livePrice.modal_price)}/kg</Text>
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
            <Text style={S.chartTitle}>{CROP_EMOJI[selectedPriceCrop]} {selectedPriceCrop} — {t('Price Trend (₹/kg)', 'मूल्य रुझान (₹/किलो)')}</Text>
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
                  {t('Current', 'वर्तमान')}: ₹{currentPrice}/kg  •  8m {t('Avg', 'औसत')}: ₹{avgPrice}/kg{livePrice ? `  •  Live ✓` : ''}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  // ─── SCREEN: ADD PRODUCT ─────────────────────────────────────────────────
  const AddProductScreen = () => {
    const [localQty, setLocalQty] = useState('');
    const [localPrice, setLocalPrice] = useState('');
    const [localCrop, setLocalCrop] = useState(cropName);

    const CROP_EMOJIS = { Tomato: '🍅', Wheat: '🌾', Onion: '🧅', Potato: '🥔', Garlic: '🧄', Rice: '🍚', Maize: '🌽', Soybean: '🫘', Mustard: '🌻', Cauliflower: '🥦', Chilli: '🌶️', Cotton: '🪴' };

    const submitListing = () => {
      if (!localCrop || !localQty || !localPrice) {
        Alert.alert(t('Missing Info', 'जानकारी ज़रूरी'), t('Please fill all fields.', 'सभी फ़ील्ड भरें।'));
        return;
      }
      const emoji = CROP_EMOJIS[localCrop] || '🌿';
      const newListing = {
        emoji,
        name: localCrop,
        nameHi: localCrop,
        price: `₹ ${localPrice}/kg`,
        qty: `${localQty} kg`,
        trend: '=',
      };
      setMyListings(prev => [newListing, ...prev]);
      setCropImage(null); setCropName('');
      Alert.alert(
        t('Product Listed! 🎉', 'उत्पाद जोड़ा गया! 🎉'),
        t('Your crop is now visible to buyers.', 'आपकी फसल अब खरीदारों को दिखेगी।'),
        [{ text: t('Great!', 'बढ़िया!'), onPress: () => navigateTo('farmerDashboard') }]
      );
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

          <TouchableOpacity style={S.primaryBtn} onPress={submitListing} activeOpacity={0.88}>
            <Text style={S.primaryBtnText}>{t('List My Crop', 'फसल जोड़ें')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  // ─── SCREEN: PRODUCT DETAIL ──────────────────────────────────────────────
  const ProductDetail = () => (
    <View style={S.screen}>
      <BackHeader title={t('Product Details', 'उत्पाद विवरण')} onBack={() => navigateTo('buyerMarketplace')} />
      <ScrollView contentContainerStyle={S.scrollPad} showsVerticalScrollIndicator={false}>
        <View style={[S.detailHero, { backgroundColor: COLORS.primaryBg }]}><Text style={{ fontSize: 80 }}>🍅</Text></View>
        <View style={S.formCard}>
          <Text style={S.detailName}>{t('Fresh Tomatoes', 'ताजे टमाटर')}</Text>
          <Text style={[S.detailPrice, { color: COLORS.primaryMid }]}>₹40 / kg</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 14, borderTopWidth: 1, borderTopColor: COLORS.borderLight }}>
            <Text style={{ fontSize: 32, marginRight: 12 }}>👨🏽‍🌾</Text>
            <View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text }}>Ramesh Singh</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: COLORS.accent, fontSize: 13 }}>★ 4.8</Text>
                <Text style={[S.farmerMeta, { marginLeft: 6 }]}>120+ orders • 2.5 km</Text>
              </View>
            </View>
          </View>
        </View>
        <SectionHeader title={t('Negotiate Price', 'कीमत तय करें')} />
        <View style={S.chatBox}>
          <View style={S.chatBubbleOther}><Text style={S.chatBubbleOtherText}>{t('Hello! I have 50kg fresh tomatoes available.', 'नमस्ते! 50 किलो ताजे टमाटर उपलब्ध हैं।')}</Text></View>
          <View style={S.chatBubbleSelf}><Text style={S.chatBubbleSelfText}>{t('I want 20kg. Can you do ₹35/kg?', 'मुझे 20 किलो चाहिए। ₹35/किलो में?')}</Text></View>
          <View style={S.chatBubbleOther}><Text style={S.chatBubbleOtherText}>{t('I can do ₹38/kg minimum.', 'न्यूनतम ₹38/किलो।')}</Text></View>
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity style={S.secondaryBtn}
            onPress={() => Alert.alert(t('Make Offer', 'प्रस्ताव'), t('Enter your offer price and the farmer will be notified.', 'अपनी कीमत दर्ज करें।'))}>
            <Text style={[S.secondaryBtnText, { color: COLORS.buyerMid }]}>{t('Make Offer', 'प्रस्ताव दें')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[S.primaryBtn, { flex: 1, marginTop: 0, backgroundColor: COLORS.buyerMid }]} onPress={() => navigateTo('orderTracking')} activeOpacity={0.88}>
            <Text style={S.primaryBtnText}>{t('Buy @ ₹38/kg', 'खरीदें @ ₹38')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  // ─── SCREEN: ORDER TRACKING ──────────────────────────────────────────────
  const OrderTracking = () => (
    <View style={S.screen}>
      <BackHeader title={t('Order Status', 'ऑर्डर की स्थिति')} onBack={() => navigateTo('buyerMarketplace')} />
      <ScrollView contentContainerStyle={S.scrollPad} showsVerticalScrollIndicator={false}>
        <View style={[S.heroCard, { backgroundColor: COLORS.buyerMid }]}>
          <Text style={S.heroLabel}>Order #40291</Text>
          <Text style={S.heroAmount}>₹ 760</Text>
          <Text style={[S.heroTrendText, { marginTop: 4 }]}>{t('20 kg Tomatoes · Ramesh Singh', '20 किलो टमाटर · रमेश सिंह')}</Text>
        </View>
        <View style={S.formCard}>
          <View style={S.trackStep}>
            <View style={[S.trackDot, { backgroundColor: COLORS.primaryMid }]}><Text style={{ color: '#fff', fontSize: 12 }}>✓</Text></View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={S.trackTitle}>{t('Order Accepted', 'ऑर्डर स्वीकार')}</Text>
              <Text style={S.trackTime}>10:00 AM</Text>
            </View>
          </View>
          <View style={S.trackLine} />
          <View style={S.trackStep}>
            <View style={[S.trackDot, { backgroundColor: COLORS.primaryMid }]}><Truck color="#fff" size={14} /></View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={S.trackTitle}>{t('Out for Delivery', 'डिलीवरी के लिए निकला')}</Text>
              <Text style={S.trackTime}>11:30 AM</Text>
            </View>
          </View>
          <View style={[S.trackLine, { backgroundColor: COLORS.borderLight }]} />
          <View style={S.trackStep}>
            <View style={[S.trackDot, { backgroundColor: COLORS.borderLight }]}><Clock color={COLORS.textLight} size={14} /></View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[S.trackTitle, { color: COLORS.textLight }]}>{t('Delivered', 'पहुंचा दिया गया')}</Text>
              <Text style={S.trackTime}>{t('Est. 12:45 PM', 'अनुमानित 12:45 PM')}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={[S.primaryBtn, { backgroundColor: COLORS.buyerMid }]} onPress={() => navigateTo('buyerMarketplace')} activeOpacity={0.88}>
          <Text style={S.primaryBtnText}>{t('Back to Market', 'बाज़ार वापस जाएँ')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  // ─── SCREEN: PROFILE ─────────────────────────────────────────────────────
  const ProfileScreen = () => {
    const isFarmer = role === 'farmer';
    const isRetailer = role === 'retailer';
    const backScreen = isFarmer ? 'farmerDashboard' : isRetailer ? 'retailerDashboard' : 'buyerMarketplace';
    const displayName = currentUser?.name || (isFarmer ? 'Farmer' : isRetailer ? 'Retailer' : 'Buyer');
    const displayPhone = currentUser?.phone ? `+91 ${currentUser.phone}` : '—';
    const accent = isFarmer ? COLORS.primaryMid : isRetailer ? COLORS.retailerMid : COLORS.buyerMid;
    const accentBg = isFarmer ? COLORS.primaryBg : isRetailer ? COLORS.retailerBg : COLORS.buyerBg;

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
              [t('Role', 'भूमिका'), isFarmer ? '🚜 Farmer' : isRetailer ? '🏬 Retailer' : '🛒 Buyer'],
              [t('Member Since', 'सदस्य बने'), currentUser?.createdAt ? new Date(currentUser.createdAt?.toDate?.() || currentUser.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : t('Recently', 'हाल ही में')],
              [t('Location', 'स्थान'), 'Indore, MP'],
            ].map(([label, val], i, arr) => (
              <View key={i} style={[S.detailRow, { borderBottomWidth: i < arr.length - 1 ? 1 : 0 }]}>
                <Text style={S.detailRowLabel}>{label}</Text>
                <Text style={S.detailRowValue}>{val}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={[S.primaryBtn, { backgroundColor: COLORS.danger, marginTop: 8 }]} onPress={handleLogout} activeOpacity={0.88}>
            <Text style={S.primaryBtnText}>🚪 {t('Sign Out', 'साइन आउट')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={S.mainWrapper}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />

      {currentScreen === 'onboarding' && (
        <LoginScreen
          language={language}
          onLanguageChange={setLanguage}
          t={t}
          onLogin={(selectedRole, user) => {
            // ── ROLE GUARD: Always use role from Firestore (user object), not the UI selection ──
            const trustedRole = user?.role || selectedRole;
            setRole(trustedRole);
            setCurrentUser(user);
            if (user?.language) setLanguage(user.language);
            navigateTo(ROLE_CONFIG[trustedRole].screen);
          }}
        />
      )}
      {currentScreen === 'farmerDashboard' && <FarmerDashboard />}
      {currentScreen === 'retailerDashboard' && <RetailerDashboard />}
      {currentScreen === 'buyerMarketplace' && <BuyerMarketplace />}
      {currentScreen === 'addProduct' && <AddProductScreen />}
      {currentScreen === 'productDetail' && <ProductDetail />}
      {currentScreen === 'orderTracking' && <OrderTracking />}
      {currentScreen === 'profile' && <ProfileScreen />}
      {currentScreen === 'aiCropRec' && <AICropRec />}
      {currentScreen === 'profitEstimator' && <ProfitEstimator />}
      {currentScreen === 'agriStore' && <AgriStore />}
      {currentScreen === 'farmingNews' && <FarmingNews />}
      {currentScreen === 'priceHistory' && <PriceHistory />}
      {currentScreen === 'nearbyMandi' && <NearbyMandi navigateTo={navigateTo} t={t} role={role} />}
      {currentScreen === 'auction' && (
        <AuctionScreen
          navigateTo={navigateTo}
          t={t}
          isFarmer={role === 'farmer'}
          currentUser={currentUser}
        />
      )}
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: COLORS.bg },
  screen: { flex: 1, backgroundColor: COLORS.bg },

  appHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 58, paddingBottom: 16, backgroundColor: COLORS.surface, borderBottomWidth: 1 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  headerIconBox: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  headerGreeting: { fontSize: 17, fontWeight: '700', color: COLORS.text, letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 12, fontWeight: '600', marginTop: 2, letterSpacing: 0.2 },
  avatarBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  avatarBtnText: { fontSize: 17, fontWeight: '800' },

  backHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 58, paddingBottom: 16, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  backBtn2: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.surfaceAlt, justifyContent: 'center', alignItems: 'center' },
  backArrow: { fontSize: 24, color: COLORS.text, lineHeight: 28 },
  backTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, flex: 1, textAlign: 'center', marginHorizontal: 8 },

  tabBar: { flexDirection: 'row', backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 3, position: 'relative' },
  tabItemActive: {},
  tabLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textLight, letterSpacing: 0.2 },
  tabIndicator: { position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 2.5, borderRadius: 2 },

  scrollPad: { padding: 20, paddingBottom: 100 },

  heroCard: { borderRadius: 24, padding: 24, marginBottom: 16, overflow: 'hidden' },
  heroLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600', letterSpacing: 0.3 },
  heroAmount: { fontSize: 38, fontWeight: '900', color: '#fff', letterSpacing: -1, marginTop: 6, marginBottom: 6 },
  heroTrend: { backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  heroTrendText: { fontSize: 12, color: '#fff', fontWeight: '700' },

  // Auction Banner (new)
  auctionBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#1B3A1E', borderRadius: 18, padding: 16, marginBottom: 16,
  },
  auctionBannerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  auctionBannerTitle: { fontSize: 15, fontWeight: '800', color: '#fff' },
  auctionBannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 3 },
  auctionLivePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  auctionLiveTxt: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },

  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '900', marginBottom: 3 },
  statLabel: { fontSize: 10, color: COLORS.textLight, fontWeight: '700', textAlign: 'center', letterSpacing: 0.2 },

  signalCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 16, padding: 14, marginBottom: 16, gap: 12, borderLeftWidth: 4, borderWidth: 1, borderColor: COLORS.borderLight },
  signalDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primaryLight },
  signalTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 3 },
  signalText: { fontSize: 12, color: COLORS.textMid, lineHeight: 18 },

  featureCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 18, padding: 16, marginBottom: 20, gap: 14, borderWidth: 1, borderColor: COLORS.borderLight },
  featureCardIcon: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  featureCardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 3 },
  featureCardSub: { fontSize: 12, color: COLORS.textLight },
  featureCardChevron: { fontSize: 24, fontWeight: '300' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text, letterSpacing: -0.3 },
  sectionAction: { fontSize: 13, fontWeight: '700' },

  listingRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.borderLight },
  listingEmoji: { width: 50, height: 50, borderRadius: 14, backgroundColor: COLORS.primaryBg, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  listingName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  listingQty: { fontSize: 12, color: COLORS.textLight, marginTop: 3 },
  listingPrice: { fontSize: 15, fontWeight: '800' },
  listingTrend: { fontSize: 12, fontWeight: '700', marginTop: 3 },

  fab: { position: 'absolute', bottom: 28, right: 22, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: COLORS.primaryMid, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },

  toolsTagline: { fontSize: 13, color: COLORS.textMid, marginBottom: 20, lineHeight: 20 },
  toolsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  toolCard: { width: (SCREEN_WIDTH - 52) / 2, backgroundColor: COLORS.surface, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: COLORS.borderLight },
  toolIconBg: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  toolTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text, marginBottom: 5, letterSpacing: -0.2 },
  toolDesc: { fontSize: 12, color: COLORS.textLight, lineHeight: 17 },
  wideToolCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 20, padding: 18, gap: 14, borderWidth: 1, borderColor: COLORS.borderLight },

  pillBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  pillBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },

  infoBox: { backgroundColor: COLORS.primaryBg, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.primaryBgDark },
  infoBoxTitle: { fontSize: 14, fontWeight: '800', marginBottom: 5, color: COLORS.primaryMid },
  infoBoxText: { fontSize: 13, lineHeight: 19, color: COLORS.primaryMid },

  formCard: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: COLORS.borderLight },
  cardSectionTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginBottom: 14 },

  inputLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textMid, marginBottom: 8, letterSpacing: 0.1 },
  input: { backgroundColor: COLORS.surfaceAlt, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: COLORS.text },
  micOverlay: { position: 'absolute', right: 4, backgroundColor: COLORS.primaryMid, padding: 10, borderRadius: 10 },

  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, marginHorizontal: 20, marginVertical: 12, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1.5, borderColor: COLORS.border, gap: 10 },
  searchInput: { flex: 1, paddingVertical: 13, fontSize: 15, color: COLORS.text },
  micPill: { backgroundColor: COLORS.primaryMid, padding: 8, borderRadius: 10 },

  filterChip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surface, marginRight: 8 },
  filterChipText: { fontSize: 13, fontWeight: '700', color: COLORS.textMid },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  chipActive: { borderColor: COLORS.primaryMid, backgroundColor: COLORS.primaryBg },
  chipText: { fontSize: 13, fontWeight: '700', color: COLORS.textMid },
  chipTextActive: { color: COLORS.primaryMid },

  productsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  productCard: { width: (SCREEN_WIDTH - 52) / 2, backgroundColor: COLORS.surface, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: COLORS.borderLight },
  productCardEmoji: { width: '100%', height: 90, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  productCardName: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  productCardPrice: { fontSize: 15, fontWeight: '900', marginTop: 3 },
  productCardMeta: { fontSize: 11, color: COLORS.textLight },
  productCardFarmer: { fontSize: 11, color: COLORS.textLight, marginTop: 3 },

  farmerCard: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: COLORS.borderLight },
  farmerAvatar: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  farmerAvatarText: { fontSize: 16, fontWeight: '900' },
  farmerName: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  farmerMeta: { fontSize: 12, color: COLORS.textLight },
  farmerPriceRange: { fontSize: 13, fontWeight: '800', color: COLORS.primaryMid },
  farmerDeliveries: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  farmerBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  farmerBadgeText: { fontSize: 11, fontWeight: '800' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primaryBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  verifiedBadgeText: { fontSize: 11, fontWeight: '800', color: COLORS.primaryMid },
  cropPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  cropPillText: { fontSize: 11, fontWeight: '700' },
  contactBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, borderWidth: 1.5 },
  contactBtnText: { fontSize: 12, fontWeight: '800' },

  recCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: COLORS.borderLight },
  recCardName: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginBottom: 3 },
  recCardDesc: { fontSize: 12, color: COLORS.textLight },

  primaryBtn: { backgroundColor: COLORS.primaryMid, paddingVertical: 16, paddingHorizontal: 24, borderRadius: 16, alignItems: 'center', marginTop: 12 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
  secondaryBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  secondaryBtnText: { fontSize: 15, fontWeight: '800' },

  orderCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.borderLight, borderLeftWidth: 4 },
  orderCrop: { fontSize: 14, fontWeight: '800', color: COLORS.text, marginBottom: 2 },
  orderMeta: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  orderId: { fontSize: 11, color: COLORS.textLight, marginTop: 6, fontWeight: '700' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusPillText: { fontSize: 11, fontWeight: '800' },

  marketRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.borderLight },
  marketCropName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  marketCropMeta: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  marketCropAvail: { fontSize: 12, fontWeight: '700', marginTop: 3 },
  marketPrice: { fontSize: 16, fontWeight: '900', marginBottom: 8 },
  negotiateBtn: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  negotiateBtnTxt: { fontSize: 12, fontWeight: '800' },

  analyticsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.borderLight },
  analyticsCropName: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  analyticsCropQty: { fontSize: 12, color: COLORS.textLight },
  analyticsCropSpend: { fontSize: 14, fontWeight: '800' },
  progressBg: { height: 5, backgroundColor: COLORS.borderLight, borderRadius: 3 },
  progressFill: { height: 5, borderRadius: 3 },

  photoUpload: { backgroundColor: COLORS.surface, borderWidth: 2, borderColor: COLORS.borderLight, borderStyle: 'dashed', borderRadius: 20, height: 160, justifyContent: 'center', alignItems: 'center', marginBottom: 16, overflow: 'hidden' },
  photoIconBox: { width: 64, height: 64, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  photoUploadText: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  photoUploadSub: { fontSize: 12, color: COLORS.textLight, marginTop: 4 },

  storeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  storeCard: { width: (SCREEN_WIDTH - 52) / 2, backgroundColor: COLORS.surface, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: COLORS.borderLight },
  storeEmojiBox: { width: 52, height: 52, borderRadius: 14, backgroundColor: COLORS.primaryBg, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  storeCatLabel: { fontSize: 10, fontWeight: '800', color: COLORS.primaryMid, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  storeItemName: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 2, lineHeight: 18 },
  storeUnit: { fontSize: 11, color: COLORS.textLight, marginBottom: 8 },
  storePrice: { fontSize: 15, fontWeight: '900', marginBottom: 10 },
  addCartBtn: { backgroundColor: COLORS.primaryMid, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  addCartBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  cartBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: COLORS.danger, borderRadius: 8, width: 16, height: 16, justifyContent: 'center', alignItems: 'center' },
  cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  newsCard: { borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.borderLight },
  newsTagPill: { backgroundColor: 'rgba(0,0,0,0.07)', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 8 },
  newsTagText: { fontSize: 11, fontWeight: '800', color: COLORS.textMid },
  newsTime: { fontSize: 11, color: COLORS.textLight },
  newsTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, lineHeight: 21, marginBottom: 8 },
  newsReadMore: { fontSize: 12, fontWeight: '800' },

  livePriceCard: { backgroundColor: COLORS.surface, borderRadius: 18, padding: 16, marginBottom: 16, borderWidth: 1.5, borderColor: COLORS.primaryLight, flexDirection: 'row', alignItems: 'center' },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primaryLight, marginRight: 6 },
  livePriceLabel: { fontSize: 12, color: COLORS.primaryMid, fontWeight: '700' },
  livePriceValue: { fontSize: 28, fontWeight: '900', color: COLORS.text, marginTop: 4 },
  livePriceRange: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  refreshBtn: { padding: 8 },
  priceStatCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 14, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderLight },
  priceStatLabel: { fontSize: 9, color: COLORS.textLight, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 4 },
  priceStatValue: { fontSize: 15, fontWeight: '900', color: COLORS.text },
  priceStatChange: { fontSize: 11, fontWeight: '800', marginTop: 2 },
  chartCard: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: COLORS.borderLight, marginBottom: 16, alignItems: 'center' },
  chartTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 12, alignSelf: 'flex-start' },
  aiResultCard: { backgroundColor: COLORS.surface, borderRadius: 20, borderWidth: 2, overflow: 'hidden', marginBottom: 20 },
  aiAction: { fontSize: 20, fontWeight: '900', letterSpacing: 0.5, marginTop: 2 },
  aiReason: { fontSize: 14, color: COLORS.text, lineHeight: 22, padding: 16 },
  aiFooter: { paddingHorizontal: 16, paddingVertical: 10 },

  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  breakdownLabel: { fontSize: 14, color: COLORS.textMid },
  breakdownValue: { fontSize: 15, fontWeight: '800' },
  profitSummary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 14, marginTop: 10 },
  profitSummaryLabel: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  profitSummaryValue: { fontSize: 22, fontWeight: '900' },

  detailHero: { borderRadius: 24, height: 180, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  detailName: { fontSize: 24, fontWeight: '900', color: COLORS.text, letterSpacing: -0.5 },
  detailPrice: { fontSize: 22, fontWeight: '900', marginVertical: 8 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11, borderBottomColor: COLORS.borderLight },
  detailRowLabel: { fontSize: 14, color: COLORS.textMid },
  detailRowValue: { fontSize: 14, fontWeight: '700', color: COLORS.text },

  chatBox: { backgroundColor: COLORS.surfaceAlt, borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: COLORS.borderLight },
  chatBubbleOther: { backgroundColor: COLORS.surface, padding: 12, borderRadius: 14, borderTopLeftRadius: 4, marginBottom: 8, alignSelf: 'flex-start', maxWidth: '80%', borderWidth: 1, borderColor: COLORS.borderLight },
  chatBubbleOtherText: { color: COLORS.text, fontSize: 13, lineHeight: 19 },
  chatBubbleSelf: { backgroundColor: COLORS.primaryBg, padding: 12, borderRadius: 14, borderTopRightRadius: 4, marginBottom: 8, alignSelf: 'flex-end', maxWidth: '80%' },
  chatBubbleSelfText: { color: COLORS.primaryMid, fontSize: 13, lineHeight: 19 },

  trackStep: { flexDirection: 'row', alignItems: 'center' },
  trackDot: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  trackTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  trackTime: { fontSize: 12, color: COLORS.textLight, marginTop: 3 },
  trackLine: { width: 2, height: 28, backgroundColor: COLORS.primaryMid, marginLeft: 15, marginVertical: 4 },

  profileHero: { borderRadius: 24, padding: 28, alignItems: 'center', marginBottom: 16 },
  profileAvatar: { width: 84, height: 84, borderRadius: 42, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  profileAvatarText: { fontSize: 36, fontWeight: '900', color: '#fff' },
  profileName: { fontSize: 22, fontWeight: '900', color: COLORS.text, letterSpacing: -0.5 },
  profilePhone: { fontSize: 14, fontWeight: '600', marginTop: 4 },
});
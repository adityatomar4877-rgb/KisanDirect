import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  TextInput, Image, StatusBar, Platform, Alert, Dimensions,
  ActivityIndicator,
} from 'react-native';
import { MapPin, Search, Plus, Star, ShieldCheck, CheckCircle2, Clock, Truck, Mic, Image as ImageIcon, RefreshCw } from 'lucide-react-native';
import Svg, { Path, Circle, Line, Rect, Text as SvgText, Polyline, Defs, LinearGradient, Stop } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import LoginScreen, { ROLE_CONFIG } from './Loginscreen.js';
import NearbyMandi from './NearbyMandi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─────────────────────────────────────────────
//  data.gov.in API CONFIG
//  Key is read from the .env file — never hardcoded.
//  Set EXPO_PUBLIC_DATA_GOV_API_KEY in your .env file.
// ─────────────────────────────────────────────
const DATA_GOV_API_KEY =
  process.env.EXPO_PUBLIC_DATA_GOV_API_KEY ||        // Expo SDK 49+ (recommended)
  Constants.expoConfig?.extra?.dataGovApiKey ||       // fallback via app.json extra
  '';

if (__DEV__ && !DATA_GOV_API_KEY) {
  console.warn('[KisanDirect] DATA_GOV_API_KEY is not set. Add EXPO_PUBLIC_DATA_GOV_API_KEY to your .env file.');
}

const DATA_GOV_BASE_URL = 'https://api.data.gov.in/resource';
const AGMARKNET_RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';

const DEFAULT_STATE = 'Madhya Pradesh';
const DEFAULT_DISTRICT = 'Indore';

// Fetch live mandi prices from data.gov.in
const fetchMandiPrice = async (commodity, state = DEFAULT_STATE, district = DEFAULT_DISTRICT) => {
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

// ─────────────────────────────────────────────
//  COLORS
// ─────────────────────────────────────────────
const COLORS = {
  primary: '#2e7d32',
  primaryLight: '#4caf50',
  primaryBg: '#e8f5e9',
  secondary: '#5d4037',
  secondaryLight: '#8d6e63',
  background: '#f9fbe7',
  card: '#ffffff',
  text: '#3e2723',
  textLight: '#795548',
  border: '#c8e6c9',
  accent: '#ffb300',
};

// Commodity name mapping: app name → data.gov.in name
const COMMODITY_MAP = {
  Tomato: 'Tomato',
  Wheat: 'Wheat',
  Onion: 'Onion',
  Potato: 'Potato',
  Maize: 'Maize',
  Rice: 'Rice',
};

// Fallback mock price data (used if API fails)
const MOCK_PRICE_DATA = {
  Tomato: [28, 35, 52, 65, 42, 38, 45, 58],
  Wheat: [18, 19, 22, 21, 20, 22, 23, 22],
  Onion: [22, 38, 60, 48, 32, 28, 40, 52],
  Potato: [24, 22, 18, 26, 32, 30, 27, 25],
  Maize: [15, 16, 19, 21, 18, 17, 18, 21],
  Rice: [32, 33, 35, 36, 34, 35, 37, 38],
};

const MONTHS = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('onboarding');
  const [role, setRole] = useState(null);
  const [language, setLanguage] = useState('en');

  const [cropImage, setCropImage] = useState(null);
  const [cropName, setCropName] = useState('');
  const [isListeningAdd, setIsListeningAdd] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [isListeningSearch, setIsListeningSearch] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(0);

  const [farmerTab, setFarmerTab] = useState('dashboard');

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

  // ── Price History state ──
  const [selectedPriceCrop, setSelectedPriceCrop] = useState('Tomato');
  const [aiSellLoading, setAiSellLoading] = useState(false);
  const [aiSellAdvice, setAiSellAdvice] = useState(null);

  // NEW: Live API price state
  const [livePrice, setLivePrice] = useState(null);       // { modal_price, min_price, max_price, market, date }
  const [livePriceLoading, setLivePriceLoading] = useState(false);
  const [livePriceError, setLivePriceError] = useState(null);
  const [priceData, setPriceData] = useState(MOCK_PRICE_DATA); // chart still uses historical mock

  const t = (enText, hiText) => language === 'en' ? enText : hiText;
  const navigateTo = (screen) => setCurrentScreen(screen);

  // ─────────────────────────────────────────────
  //  FETCH LIVE PRICE
  // ─────────────────────────────────────────────
  const fetchLivePrice = useCallback(async (crop) => {
    setLivePriceLoading(true);
    setLivePriceError(null);
    setLivePrice(null);
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

        // Inject live price as the last data point on the chart
        setPriceData(prev => {
          const base = MOCK_PRICE_DATA[crop].slice(0, 7);
          const live = Math.round(parseFloat(r.modal_price || r.Modal_Price || base[6]));
          return { ...prev, [crop]: [...base, live] };
        });
      } else {
        setLivePriceError(t('No data found for this crop in your region.', 'इस फसल का डेटा नहीं मिला।'));
        // Reset to mock data
        setPriceData(prev => ({ ...prev, [crop]: MOCK_PRICE_DATA[crop] }));
      }
    } catch (err) {
      console.error('data.gov.in API error:', err);
      setLivePriceError(t('Could not load live price. Showing estimated data.', 'लाइव कीमत लोड नहीं हो सकी। अनुमानित डेटा दिखाया जा रहा है।'));
      setPriceData(prev => ({ ...prev, [crop]: MOCK_PRICE_DATA[crop] }));
    } finally {
      setLivePriceLoading(false);
    }
  }, [language]);

  // Fetch whenever selected crop changes (only when on priceHistory screen)
  useEffect(() => {
    if (currentScreen === 'priceHistory') {
      fetchLivePrice(selectedPriceCrop);
    }
  }, [selectedPriceCrop, currentScreen]);

  // ─────────────────────────────────────────────
  //  CAMERA
  // ─────────────────────────────────────────────
  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        t('Permission Denied', 'अनुमति नहीं मिली'),
        t("You've refused camera access. Please enable it in settings.", 'कृपया सेटिंग में कैमरा एक्सेस सक्षम करें।')
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 1 });
    if (!result.canceled) setCropImage(result.assets[0].uri);
  };

  // ─────────────────────────────────────────────
  //  VOICE
  // ─────────────────────────────────────────────
  const handleVoiceInput = (setListeningState, setTargetText, mockText) => {
    setListeningState(true);
    if (Platform.OS === 'web' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SR();
      recognition.lang = language === 'en' ? 'en-US' : 'hi-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = (e) => { setTargetText(e.results[0][0].transcript); setListeningState(false); };
      recognition.onerror = () => { setListeningState(false); setTargetText(mockText); };
      recognition.onend = () => setListeningState(false);
      recognition.start();
    } else {
      setTimeout(() => { setTargetText(mockText); setListeningState(false); }, 2000);
    }
  };

  // ─────────────────────────────────────────────
  //  SCREEN: FARMER DASHBOARD
  // ─────────────────────────────────────────────
  const FarmerDashboard = () => (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { setRole(null); navigateTo('onboarding'); }} style={styles.backBtnCircle}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.greeting}>{t('Namaste, Ram 👋', 'नमस्ते, राम 👋')}</Text>
          <Text style={styles.subGreeting}>{farmerTab === 'dashboard' ? t('Your Farm Summary', 'आपके खेत का सारांश') : t('Farmer Tools', 'किसान औज़ार')}</Text>
        </View>
        <TouchableOpacity onPress={() => navigateTo('profile')}>
          <Text style={styles.headerAvatar}>👤</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.farmerTabBar}>
        <TouchableOpacity style={[styles.farmerTab, farmerTab === 'dashboard' && styles.farmerTabActive]} onPress={() => setFarmerTab('dashboard')}>
          <Text style={styles.farmerTabIcon}>🏠</Text>
          <Text style={[styles.farmerTabLabel, farmerTab === 'dashboard' && styles.farmerTabLabelActive]}>{t('Dashboard', 'डैशबोर्ड')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.farmerTab, farmerTab === 'tools' && styles.farmerTabActive]} onPress={() => setFarmerTab('tools')}>
          <Text style={styles.farmerTabIcon}>🛠️</Text>
          <Text style={[styles.farmerTabLabel, farmerTab === 'tools' && styles.farmerTabLabelActive]}>{t('Tools', 'औज़ार')}</Text>
        </TouchableOpacity>
      </View>

      {farmerTab === 'dashboard' ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t("Today's Earnings", 'आज की कमाई')}</Text>
            <Text style={styles.earningsAmount}>₹ 4,500</Text>
            <Text style={styles.cardSubText}>+12% {t('from yesterday', 'कल से')}</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>{t('Market Demand', 'बाजार की मांग')}</Text>
              <Text style={styles.badgeHigh}>{t('High Demand', 'उच्च मांग')}</Text>
            </View>
            <Text style={styles.cardSubText}>{t('Tomatoes and Onions are selling fast!', 'टमाटर और प्याज तेजी से बिक रहे हैं!')}</Text>
          </View>
          {/* NearbyMandi card from file 2 */}
          <TouchableOpacity style={styles.card} onPress={() => navigateTo('nearbyMandi')}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>{t('Find Nearby Mandi', 'नज़दीकी मंडी खोजें')}</Text>
              <Text style={styles.productEmoji}>🏪</Text>
            </View>
            <Text style={styles.cardSubText}>{t('Check mandi prices and distance', 'मंडी की कीमतें और दूरी जांचें')}</Text>
          </TouchableOpacity>
          <Text style={styles.sectionTitle}>{t('My Products', 'मेरे उत्पाद')}</Text>
          <View style={styles.productListItem}>
            <Text style={styles.productEmoji}>🍅</Text>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{t('Fresh Tomatoes', 'ताजे टमाटर')}</Text>
              <Text style={styles.productPrice}>₹ 40 / kg  •  50 kg left</Text>
            </View>
          </View>
          <View style={styles.productListItem}>
            <Text style={styles.productEmoji}>🧅</Text>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{t('Red Onions', 'लाल प्याज')}</Text>
              <Text style={styles.productPrice}>₹ 30 / kg  •  120 kg left</Text>
            </View>
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.toolsTagline}>{t("Everything you need to analyze, plan, and maximize your farm's yield.", 'अपनी फसल की उपज को अधिकतम करने के लिए सब कुछ।')}</Text>
          <View style={styles.toolsGrid}>
            <TouchableOpacity style={styles.toolCard} onPress={() => navigateTo('aiCropRec')}>
              <View style={[styles.toolIconBox, { backgroundColor: '#e8f5e9' }]}><Text style={styles.toolIconEmoji}>🌱</Text></View>
              <Text style={styles.toolCardTitle}>{t('AI Crop Recommendation', 'AI फसल सुझाव')}</Text>
              <Text style={styles.toolCardDesc}>{t('Get smart suggestions based on soil & weather', 'मिट्टी और मौसम के आधार पर स्मार्ट सुझाव पाएं')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolCard} onPress={() => navigateTo('profitEstimator')}>
              <View style={[styles.toolIconBox, { backgroundColor: '#fff8e1' }]}><Text style={styles.toolIconEmoji}>📊</Text></View>
              <Text style={styles.toolCardTitle}>{t('Profit Estimator', 'लाभ अनुमानक')}</Text>
              <Text style={styles.toolCardDesc}>{t('Calculate investment and expected returns', 'निवेश और अपेक्षित रिटर्न की गणना करें')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolCard} onPress={() => navigateTo('agriStore')}>
              <View style={[styles.toolIconBox, { backgroundColor: '#e3f2fd' }]}><Text style={styles.toolIconEmoji}>🏪</Text></View>
              <Text style={styles.toolCardTitle}>{t('Agri Store', 'कृषि स्टोर')}</Text>
              <Text style={styles.toolCardDesc}>{t('Buy seeds, fertilizers, and equipment', 'बीज, खाद और उपकरण खरीदें')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolCard} onPress={() => navigateTo('farmingNews')}>
              <View style={[styles.toolIconBox, { backgroundColor: '#f3e5f5' }]}><Text style={styles.toolIconEmoji}>📰</Text></View>
              <Text style={styles.toolCardTitle}>{t('Farming News', 'कृषि समाचार')}</Text>
              <Text style={styles.toolCardDesc}>{t('Latest schemes and agricultural updates', 'नवीनतम योजनाएं और कृषि अपडेट')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toolCard, { width: '100%', flexDirection: 'row', alignItems: 'center' }]} onPress={() => { setAiSellAdvice(null); navigateTo('priceHistory'); }}>
              <View style={[styles.toolIconBox, { backgroundColor: '#fce4ec', marginBottom: 0, marginRight: 16 }]}><Text style={styles.toolIconEmoji}>📈</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.toolCardTitle}>{t('Price History & Sell Advisor', 'मूल्य इतिहास और बिक्री सलाह')}</Text>
                <Text style={styles.toolCardDesc}>{t('Live mandi prices + AI tells you when to sell', 'लाइव मंडी भाव + AI बताएगा कब बेचें')}</Text>
              </View>
              <Text style={{ fontSize: 20, color: COLORS.textLight, marginLeft: 8 }}>›</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {farmerTab === 'dashboard' && (
        <TouchableOpacity style={styles.fab} onPress={() => navigateTo('addProduct')}>
          <Plus color="#fff" size={28} />
        </TouchableOpacity>
      )}
    </View>
  );

  // ─────────────────────────────────────────────
  //  SCREEN: AI CROP REC
  // ─────────────────────────────────────────────
  const AICropRec = () => {
    const soilOptions = ['Clay', 'Loamy', 'Sandy', 'Silty'];
    const seasonOptions = [t('Kharif (Jun–Oct)', 'खरीफ (जून–अक्टू)'), t('Rabi (Nov–Mar)', 'रबी (नव–मार्च)'), t('Zaid (Mar–Jun)', 'जायद (मार्च–जून)')];
    const cropRecs = {
      'Clay-Kharif (Jun–Oct)': ['🌾 Rice', '🥜 Peanuts', '🌽 Maize'],
      'Clay-Rabi (Nov–Mar)': ['🌿 Wheat', '🥬 Mustard', '🧅 Onion'],
      'Loamy-Kharif (Jun–Oct)': ['🍅 Tomato', '🌽 Maize', '🫘 Soybean'],
      'Loamy-Rabi (Nov–Mar)': ['🥕 Carrot', '🌿 Wheat', '🫛 Peas'],
      'Sandy-Kharif (Jun–Oct)': ['🥜 Peanuts', '🫘 Cowpea', '🌻 Sunflower'],
      'Sandy-Rabi (Nov–Mar)': ['🥔 Potato', '🫛 Peas', '🌿 Barley'],
      'Silty-Kharif (Jun–Oct)': ['🍅 Tomato', '🌾 Rice', '🥒 Cucumber'],
      'Silty-Rabi (Nov–Mar)': ['🌿 Wheat', '🥬 Spinach', '🧅 Onion'],
    };
    const getRecommendation = () => {
      if (!soilType || !season) {
        Alert.alert(t('Missing Info', 'जानकारी आवश्यक'), t('Please select soil type and season.', 'कृपया मिट्टी का प्रकार और मौसम चुनें।'));
        return;
      }
      setAiLoading(true);
      setTimeout(() => {
        const key = `${soilType}-${season}`;
        const found = cropRecs[key] || ['🌽 Maize', '🌿 Wheat', '🥜 Peanuts'];
        setAiResult(found);
        setAiLoading(false);
      }, 1500);
    };
    return (
      <View style={styles.screen}>
        <View style={styles.headerWithBack}>
          <TouchableOpacity onPress={() => { setAiResult(null); navigateTo('farmerDashboard'); }}>
            <Text style={styles.backBtn}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('AI Crop Recommendation', 'AI फसल सुझाव')}</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={[styles.suggestionBox, { marginBottom: 24 }]}>
            <Text style={styles.suggestionTitle}>🌱 {t('How it works', 'यह कैसे काम करता है')}</Text>
            <Text style={styles.suggestionText}>{t('Select your soil type and upcoming season. Our AI will suggest the best crops for maximum yield.', 'अपनी मिट्टी का प्रकार और आगामी मौसम चुनें।')}</Text>
          </View>
          <Text style={styles.inputLabel}>{t('Soil Type', 'मिट्टी का प्रकार')}</Text>
          <View style={styles.chipRow}>
            {soilOptions.map((s) => (
              <TouchableOpacity key={s} style={[styles.selChip, soilType === s && styles.selChipActive]} onPress={() => { setSoilType(s); setAiResult(null); }}>
                <Text style={[styles.selChipText, soilType === s && styles.selChipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.inputLabel, { marginTop: 16 }]}>{t('Season', 'मौसम')}</Text>
          <View style={styles.chipRow}>
            {seasonOptions.map((s) => (
              <TouchableOpacity key={s} style={[styles.selChip, season === s && styles.selChipActive]} onPress={() => { setSeason(s); setAiResult(null); }}>
                <Text style={[styles.selChipText, season === s && styles.selChipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={[styles.primaryBtn, { marginTop: 28 }]} onPress={getRecommendation}>
            <Text style={styles.primaryBtnText}>{aiLoading ? t('Analysing...', 'विश्लेषण हो रहा है...') : t('Get AI Recommendation', 'AI सुझाव पाएं')}</Text>
          </TouchableOpacity>
          {aiResult && (
            <View style={{ marginTop: 28 }}>
              <Text style={styles.sectionTitle}>{t('Recommended Crops', 'अनुशंसित फसलें')}</Text>
              {aiResult.map((crop, i) => (
                <View key={i} style={styles.recCropCard}>
                  <Text style={{ fontSize: 32, marginRight: 16 }}>{crop.split(' ')[0]}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 17, fontWeight: 'bold', color: COLORS.text }}>{crop.split(' ').slice(1).join(' ')}</Text>
                    <Text style={{ color: COLORS.textLight, fontSize: 13, marginTop: 2 }}>
                      {i === 0 ? t('Best match for your conditions', 'आपकी स्थितियों के लिए सर्वश्रेष्ठ') : i === 1 ? t('Good alternative crop', 'अच्छी वैकल्पिक फसल') : t('Consider as backup option', 'बैकअप विकल्प के रूप में विचार करें')}
                    </Text>
                  </View>
                  {i === 0 && <View style={styles.bestBadge}><Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>★ {t('BEST', 'सर्वश्रेष्ठ')}</Text></View>}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  // ─────────────────────────────────────────────
  //  SCREEN: PROFIT ESTIMATOR
  // ─────────────────────────────────────────────
  const ProfitEstimator = () => {
    const calculateProfit = () => {
      const area = parseFloat(areaAcres) || 0;
      const seed = parseFloat(seedCost) || 0;
      const fert = parseFloat(fertCost) || 0;
      if (!area || !cropType) {
        Alert.alert(t('Missing Info', 'जानकारी आवश्यक'), t('Please fill in all fields.', 'कृपया सभी फ़ील्ड भरें।'));
        return;
      }
      const yieldPerAcre = { Tomato: 8000, Wheat: 1800, Rice: 2200, Potato: 10000, Onion: 12000 };
      const pricePerKg = { Tomato: 40, Wheat: 22, Rice: 35, Potato: 25, Onion: 30 };

      // Use live modal price if available and the crop matches
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
      <View style={styles.screen}>
        <View style={styles.headerWithBack}>
          <TouchableOpacity onPress={() => { setProfitResult(null); navigateTo('farmerDashboard'); }}>
            <Text style={styles.backBtn}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('Profit Estimator', 'लाभ अनुमानक')}</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.inputLabel}>{t('Select Crop', 'फसल चुनें')}</Text>
          <View style={styles.chipRow}>
            {['Tomato', 'Wheat', 'Rice', 'Potato', 'Onion'].map((c) => (
              <TouchableOpacity key={c} style={[styles.selChip, cropType === c && styles.selChipActive]} onPress={() => { setCropType(c); setProfitResult(null); }}>
                <Text style={[styles.selChipText, cropType === c && styles.selChipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={[styles.inputGroup, { marginTop: 20 }]}>
            <Text style={styles.inputLabel}>{t('Land Area (acres)', 'जमीन का क्षेत्रफल (एकड़)')}</Text>
            <TextInput style={styles.input} keyboardType="numeric" placeholder="e.g. 2" placeholderTextColor="#999" value={areaAcres} onChangeText={(v) => { setAreaAcres(v); setProfitResult(null); }} />
          </View>
          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.inputLabel}>{t('Seed Cost (₹/acre)', 'बीज लागत (₹/एकड़)')}</Text>
              <TextInput style={styles.input} keyboardType="numeric" placeholder="2000" placeholderTextColor="#999" value={seedCost} onChangeText={(v) => { setSeedCost(v); setProfitResult(null); }} />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>{t('Fertilizer (₹/acre)', 'खाद लागत (₹/एकड़)')}</Text>
              <TextInput style={styles.input} keyboardType="numeric" placeholder="1500" placeholderTextColor="#999" value={fertCost} onChangeText={(v) => { setFertCost(v); setProfitResult(null); }} />
            </View>
          </View>
          <TouchableOpacity style={styles.primaryBtn} onPress={calculateProfit}>
            <Text style={styles.primaryBtnText}>{t('Calculate Profit', 'लाभ की गणना करें')}</Text>
          </TouchableOpacity>
          {profitResult && (
            <View style={{ marginTop: 28 }}>
              {profitResult.usedLivePrice && (
                <View style={[styles.suggestionBox, { marginBottom: 12, flexDirection: 'row', alignItems: 'center' }]}>
                  <Text style={{ fontSize: 16, marginRight: 8 }}>🟢</Text>
                  <Text style={styles.suggestionText}>{t(`Using live mandi price ₹${profitResult.effectivePrice}/kg`, `लाइव मंडी भाव ₹${profitResult.effectivePrice}/किलो उपयोग किया`)}</Text>
                </View>
              )}
              <Text style={styles.sectionTitle}>{t('Profit Breakdown', 'लाभ का विवरण')}</Text>
              <View style={styles.card}>
                {[
                  { label: t('Expected Yield', 'अपेक्षित उपज'), value: `${profitResult.yield.toLocaleString()} kg`, color: COLORS.text },
                  { label: t('Estimated Revenue', 'अनुमानित राजस्व'), value: `₹ ${profitResult.revenue.toLocaleString()}`, color: COLORS.primary },
                  { label: t('Input Costs', 'इनपुट लागत'), value: `- ₹ ${profitResult.totalCost.toLocaleString()}`, color: '#d32f2f' },
                  { label: t('Labour Cost', 'श्रम लागत'), value: `- ₹ ${profitResult.labour.toLocaleString()}`, color: '#d32f2f' },
                ].map((row, i) => (
                  <View key={i} style={[styles.rowBetween, { paddingVertical: 8, borderBottomWidth: i < 3 ? 1 : 0, borderBottomColor: COLORS.border }]}>
                    <Text style={{ color: COLORS.textLight, fontSize: 15 }}>{row.label}</Text>
                    <Text style={{ fontWeight: 'bold', fontSize: 15, color: row.color }}>{row.value}</Text>
                  </View>
                ))}
                <View style={[styles.rowBetween, { marginTop: 12, backgroundColor: profitResult.profit >= 0 ? COLORS.primaryBg : '#ffebee', padding: 12, borderRadius: 12 }]}>
                  <Text style={{ fontWeight: 'bold', fontSize: 17, color: COLORS.text }}>{t('Net Profit', 'शुद्ध लाभ')}</Text>
                  <Text style={{ fontWeight: '900', fontSize: 22, color: profitResult.profit >= 0 ? COLORS.primary : '#d32f2f' }}>
                    {profitResult.profit >= 0 ? '+ ' : ''}₹ {Math.abs(profitResult.profit).toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  // ─────────────────────────────────────────────
  //  SCREEN: AGRI STORE
  // ─────────────────────────────────────────────
  const AgriStore = () => {
    const storeItems = [
      { id: 1, name: t('Hybrid Tomato Seeds', 'हाइब्रिड टमाटर के बीज'), price: 320, unit: '50g packet', emoji: '🌱', category: t('Seeds', 'बीज') },
      { id: 2, name: t('NPK Fertilizer', 'NPK खाद'), price: 850, unit: '25kg bag', emoji: '🧪', category: t('Fertilizer', 'खाद') },
      { id: 3, name: t('Hand Sprayer', 'हैंड स्प्रेयर'), price: 1200, unit: '1 piece', emoji: '💧', category: t('Equipment', 'उपकरण') },
      { id: 4, name: t('Wheat Seeds (Sharbati)', 'गेहूं बीज (शरबती)'), price: 280, unit: '5kg bag', emoji: '🌾', category: t('Seeds', 'बीज') },
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
      <View style={styles.screen}>
        <View style={styles.headerWithBack}>
          <TouchableOpacity onPress={() => navigateTo('farmerDashboard')}><Text style={styles.backBtn}>←</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>{t('Agri Store', 'कृषि स्टोर')}</Text>
          {cartCount > 0 ? (
            <TouchableOpacity onPress={() => Alert.alert(t('Cart', 'कार्ट'), `${cartCount} ${t('items', 'वस्तुएं')} • ₹${cartTotal.toLocaleString()}`)}>
              <View style={styles.cartBadgeWrap}>
                <Text style={{ fontSize: 22 }}>🛒</Text>
                <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{cartCount}</Text></View>
              </View>
            </TouchableOpacity>
          ) : <View style={{ width: 32 }} />}
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {cartCount > 0 && (
            <TouchableOpacity style={[styles.suggestionBox, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }]}
              onPress={() => Alert.alert(t('Cart', 'कार्ट'), cart.map(c => `${c.emoji} ${c.name} x${c.qty} = ₹${c.price * c.qty}`).join('\n') + `\n\n${t('Total', 'कुल')}: ₹${cartTotal.toLocaleString()}`)}>
              <Text style={styles.suggestionTitle}>🛒 {cartCount} {t('items in cart', 'वस्तुएं कार्ट में')}</Text>
              <Text style={{ color: COLORS.primary, fontWeight: 'bold', fontSize: 16 }}>₹{cartTotal.toLocaleString()} →</Text>
            </TouchableOpacity>
          )}
          <View style={styles.storeGrid}>
            {storeItems.map((item) => {
              const inCart = cart.find(c => c.id === item.id);
              return (
                <View key={item.id} style={styles.storeCard}>
                  <View style={styles.storeEmojiBg}><Text style={{ fontSize: 34 }}>{item.emoji}</Text></View>
                  <Text style={styles.storeCat}>{item.category}</Text>
                  <Text style={styles.storeItemName}>{item.name}</Text>
                  <Text style={styles.storeUnit}>{item.unit}</Text>
                  <Text style={styles.storePrice}>₹ {item.price}</Text>
                  <TouchableOpacity style={[styles.addCartBtn, inCart && { backgroundColor: COLORS.primaryBg }]} onPress={() => addToCart(item)}>
                    <Text style={[styles.addCartBtnText, inCart && { color: COLORS.primary }]}>
                      {inCart ? `✓ ${t('Added', 'जोड़ा')} (${inCart.qty})` : `+ ${t('Add to Cart', 'कार्ट में जोड़ें')}`}
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

  // ─────────────────────────────────────────────
  //  SCREEN: FARMING NEWS
  // ─────────────────────────────────────────────
  const FarmingNews = () => {
    const news = [
      { id: 1, tag: t('Scheme', 'योजना'), title: t('PM Kisan Samman Nidhi: ₹2000 installment released for farmers', 'PM किसान सम्मान निधि: किसानों के लिए ₹2000 की किस्त जारी'), time: t('2 hours ago', '2 घंटे पहले'), emoji: '💰', color: '#e8f5e9' },
      { id: 2, tag: t('Weather', 'मौसम'), title: t('IMD predicts above-normal monsoon — good news for Kharif crops', 'IMD ने सामान्य से अधिक मानसून का अनुमान लगाया'), time: t('5 hours ago', '5 घंटे पहले'), emoji: '🌧️', color: '#e3f2fd' },
      { id: 3, tag: t('Market', 'बाजार'), title: t('Onion prices rise 18% in wholesale mandis across MP and Maharashtra', 'MP और महाराष्ट्र में प्याज की कीमतें 18% बढ़ीं'), time: t('Yesterday', 'कल'), emoji: '📈', color: '#fff8e1' },
      { id: 4, tag: t('Scheme', 'योजना'), title: t('Fasal Bima Yojana: Enrollment extended to 31 July', 'फसल बीमा योजना: नामांकन 31 जुलाई तक बढ़ाई गई'), time: t('2 days ago', '2 दिन पहले'), emoji: '🛡️', color: '#f3e5f5' },
      { id: 5, tag: t('Tech', 'तकनीक'), title: t('Drone spraying services now available in rural MP at subsidised rates', 'MP के ग्रामीण क्षेत्रों में रियायती दरों पर ड्रोन छिड़काव'), time: t('3 days ago', '3 दिन पहले'), emoji: '🚁', color: '#e8f5e9' },
      { id: 6, tag: t('Advisory', 'परामर्श'), title: t('Agriculture dept warns of fall armyworm attack on maize', 'कृषि विभाग ने मक्के पर फॉल आर्मीवर्म हमले की चेतावनी दी'), time: t('4 days ago', '4 दिन पहले'), emoji: '⚠️', color: '#ffebee' },
    ];
    return (
      <View style={styles.screen}>
        <View style={styles.headerWithBack}>
          <TouchableOpacity onPress={() => navigateTo('farmerDashboard')}><Text style={styles.backBtn}>←</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>{t('Farming News', 'कृषि समाचार')}</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={[styles.suggestionBox, { marginBottom: 20 }]}>
            <Text style={styles.suggestionTitle}>📰 {t('Latest Updates', 'नवीनतम अपडेट')}</Text>
            <Text style={styles.suggestionText}>{t('Government schemes, market prices, weather alerts and more.', 'सरकारी योजनाएं, बाजार मूल्य, मौसम अलर्ट और बहुत कुछ।')}</Text>
          </View>
          {news.map((item) => (
            <TouchableOpacity key={item.id} style={[styles.newsCard, { backgroundColor: item.color }]}
              onPress={() => Alert.alert(item.title, t('Full article coming soon!', 'पूरा लेख जल्द आ रहा है!'))}>
              <View style={styles.newsTop}>
                <Text style={styles.newsEmoji}>{item.emoji}</Text>
                <View style={styles.newsTagBadge}><Text style={styles.newsTagText}>{item.tag}</Text></View>
                <Text style={styles.newsTime}>{item.time}</Text>
              </View>
              <Text style={styles.newsTitle}>{item.title}</Text>
              <Text style={styles.newsReadMore}>{t('Read more →', 'और पढ़ें →')}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // ─────────────────────────────────────────────
  //  SCREEN: PRICE HISTORY (with live API)
  // ─────────────────────────────────────────────
  const PriceHistory = () => {
    const CROPS = ['Tomato', 'Wheat', 'Onion', 'Potato', 'Maize', 'Rice'];
    const CROP_EMOJI = { Tomato: '🍅', Wheat: '🌾', Onion: '🧅', Potato: '🥔', Maize: '🌽', Rice: '🍚' };

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
      setAiSellLoading(true);
      setAiSellAdvice(null);
      setTimeout(() => {
        const pctAboveAvg = ((currentPrice - avgPrice) / avgPrice) * 100;
        let action, reason, color, emoji;
        if (pctAboveAvg >= 15 && recentTrend <= 0) {
          action = t('SELL NOW', 'अभी बेचें'); emoji = '🟢'; color = '#2e7d32';
          reason = t(`Price is ₹${currentPrice}/kg — ${Math.round(pctAboveAvg)}% above the 8-month average of ₹${avgPrice}/kg. The trend is cooling. Strong selling window.`, `कीमत ₹${currentPrice}/किलो है — 8 महीने के औसत से ${Math.round(pctAboveAvg)}% अधिक। यह बेचने का अच्छा समय है।`);
        } else if (recentTrend > 5 && pctAboveAvg < 20) {
          action = t('WAIT & WATCH', 'रुकें और देखें'); emoji = '🟡'; color = '#f57f17';
          reason = t(`Price is rising — up ₹${recentTrend}/kg in 3 months. Hold 2–3 weeks for a better price.`, `कीमत बढ़ रही है। 2–3 सप्ताह और रुकें।`);
        } else if (pctAboveAvg < -10 || recentTrend < -10) {
          action = t('SELL SOON', 'जल्दी बेचें'); emoji = '🔴'; color = '#c62828';
          reason = t(`Price is falling — ${Math.abs(Math.round(pctAboveAvg))}% below average at ₹${currentPrice}/kg. Sell now to avoid further loss.`, `कीमत गिर रही है। अभी बेचें।`);
        } else {
          action = t('HOLD FOR NOW', 'अभी रोकें'); emoji = '🟡'; color = '#e65100';
          reason = t(`Price is stable at ₹${currentPrice}/kg, near the 8-month average of ₹${avgPrice}/kg. Monitor for 1–2 weeks.`, `कीमत स्थिर है। 1–2 सप्ताह और देखें।`);
        }
        setAiSellAdvice({ action, reason, color, emoji });
        setAiSellLoading(false);
      }, 1800);
    };

    return (
      <View style={styles.screen}>
        <View style={styles.headerWithBack}>
          <TouchableOpacity onPress={() => { setAiSellAdvice(null); navigateTo('farmerDashboard'); }}>
            <Text style={styles.backBtn}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('Price History', 'मूल्य इतिहास')}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* ── LIVE PRICE BANNER ── */}
          <View style={styles.livePriceBanner}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <View style={[styles.liveDot, livePriceLoading && { backgroundColor: '#ffb300' }]} />
                <Text style={styles.livePriceLabel}>
                  {livePriceLoading
                    ? t('Fetching live mandi price…', 'लाइव मंडी भाव ला रहे हैं…')
                    : livePrice
                      ? t(`Live · ${livePrice.market}`, `लाइव · ${livePrice.market}`)
                      : t('Live Mandi Price (data.gov.in)', 'लाइव मंडी भाव (data.gov.in)')}
                </Text>
              </View>
              {livePriceLoading ? (
                <ActivityIndicator color={COLORS.primary} size="small" style={{ alignSelf: 'flex-start' }} />
              ) : livePrice ? (
                <>
                  <Text style={styles.livePriceValue}>₹{Math.round(livePrice.modal_price)}/kg</Text>
                  <Text style={styles.livePriceRange}>
                    {t(`Min ₹${Math.round(livePrice.min_price)} · Max ₹${Math.round(livePrice.max_price)} · ${livePrice.date}`,
                      `न्यून ₹${Math.round(livePrice.min_price)} · उच्च ₹${Math.round(livePrice.max_price)} · ${livePrice.date}`)}
                  </Text>
                </>
              ) : livePriceError ? (
                <Text style={styles.livePriceError}>{livePriceError}</Text>
              ) : null}
            </View>
            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={() => fetchLivePrice(selectedPriceCrop)}
              disabled={livePriceLoading}
            >
              <Text style={{ fontSize: 18 }}>🔄</Text>
            </TouchableOpacity>
          </View>

          {/* ── CROP SELECTOR ── */}
          <Text style={styles.inputLabel}>{t('Select Crop', 'फसल चुनें')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20, marginTop: 8 }}>
            {CROPS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.cropPill, selectedPriceCrop === c && styles.cropPillActive]}
                onPress={() => { setSelectedPriceCrop(c); setAiSellAdvice(null); }}
              >
                <Text style={{ fontSize: 16 }}>{CROP_EMOJI[c]}</Text>
                <Text style={[styles.cropPillText, selectedPriceCrop === c && styles.cropPillTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ── PRICE SUMMARY ── */}
          <View style={styles.priceSummaryRow}>
            <View style={styles.priceSummaryCard}>
              <Text style={styles.priceSumLabel}>{t('Live / Current', 'लाइव / वर्तमान')}</Text>
              <Text style={styles.priceSumValue}>₹{currentPrice}</Text>
              <Text style={[styles.priceSumChange, { color: currentPrice >= prevPrice ? '#2e7d32' : '#c62828' }]}>
                {currentPrice >= prevPrice ? '▲' : '▼'} ₹{Math.abs(currentPrice - prevPrice)}
              </Text>
            </View>
            <View style={styles.priceSummaryCard}>
              <Text style={styles.priceSumLabel}>{t('Avg (8m)', 'औसत (8म)')}</Text>
              <Text style={styles.priceSumValue}>₹{avgPrice}</Text>
              <Text style={[styles.priceSumChange, { color: currentPrice >= avgPrice ? '#2e7d32' : '#c62828' }]}>
                {currentPrice >= avgPrice ? '+' : ''}{Math.round(((currentPrice - avgPrice) / avgPrice) * 100)}%
              </Text>
            </View>
            <View style={styles.priceSummaryCard}>
              <Text style={styles.priceSumLabel}>{t('High', 'उच्च')}</Text>
              <Text style={[styles.priceSumValue, { color: '#2e7d32' }]}>₹{maxPrice}</Text>
            </View>
            <View style={styles.priceSummaryCard}>
              <Text style={styles.priceSumLabel}>{t('Low', 'न्यून')}</Text>
              <Text style={[styles.priceSumValue, { color: '#c62828' }]}>₹{minPrice}</Text>
            </View>
          </View>

          {/* ── SVG LINE CHART ── */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>
              {CROP_EMOJI[selectedPriceCrop]} {selectedPriceCrop} — {t('Price Trend (₹/kg)', 'मूल्य रुझान (₹/किलो)')}
            </Text>
            {livePrice && (
              <Text style={{ fontSize: 11, color: COLORS.primary, marginBottom: 8, fontWeight: 'bold' }}>
                ★ {t('Last point = live mandi price', 'अंतिम बिंदु = लाइव मंडी भाव')}
              </Text>
            )}
            <Svg width={CHART_W} height={CHART_H}>
              <Defs>
                <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="#2e7d32" stopOpacity="0.25" />
                  <Stop offset="100%" stopColor="#2e7d32" stopOpacity="0.02" />
                </LinearGradient>
              </Defs>
              {yTicks.map((tick, i) => (
                <Line key={i} x1={PAD_L} y1={py(tick)} x2={PAD_L + plotW} y2={py(tick)} stroke="#e0e0e0" strokeWidth="1" strokeDasharray="4,4" />
              ))}
              {yTicks.map((tick, i) => (
                <SvgText key={i} x={PAD_L - 4} y={py(tick) + 4} fontSize="10" fill="#9e9e9e" textAnchor="end">{tick}</SvgText>
              ))}
              {MONTHS.map((m, i) => (
                <SvgText key={i} x={px(i)} y={CHART_H - 4} fontSize="9" fill="#9e9e9e" textAnchor="middle">{m}</SvgText>
              ))}
              <Path d={areaPath} fill="url(#areaGrad)" />
              <Polyline points={points} fill="none" stroke="#2e7d32" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
              {prices.map((v, i) => (
                <Circle key={i} cx={px(i)} cy={py(v)} r={i === prices.length - 1 ? 6 : 4}
                  fill={i === prices.length - 1 ? (livePrice ? '#ff6f00' : '#2e7d32') : '#fff'}
                  stroke={i === prices.length - 1 ? (livePrice ? '#ff6f00' : '#2e7d32') : '#2e7d32'} strokeWidth="2" />
              ))}
              <SvgText x={px(prices.length - 1)} y={py(currentPrice) - 10} fontSize="11" fill={livePrice ? '#ff6f00' : '#2e7d32'} fontWeight="bold" textAnchor="middle">
                ₹{currentPrice}
              </SvgText>
            </Svg>
          </View>

          {/* ── MONTHLY PRICE TABLE ── */}
          <Text style={[styles.sectionTitle, { marginTop: 8 }]}>{t('Monthly Price Table', 'मासिक मूल्य तालिका')}</Text>
          <View style={styles.priceTable}>
            <View style={styles.priceTableHeader}>
              <Text style={[styles.priceTableCell, styles.priceTableHeaderText, { flex: 1.2 }]}>{t('Month', 'माह')}</Text>
              <Text style={[styles.priceTableCell, styles.priceTableHeaderText]}>{t('Price', 'मूल्य')}</Text>
              <Text style={[styles.priceTableCell, styles.priceTableHeaderText]}>{t('vs Avg', 'औसत से')}</Text>
              <Text style={[styles.priceTableCell, styles.priceTableHeaderText]}>{t('Change', 'बदलाव')}</Text>
            </View>
            {prices.map((p, i) => {
              const change = i === 0 ? 0 : p - prices[i - 1];
              const vsAvg = p - avgPrice;
              const isLast = i === prices.length - 1;
              return (
                <View key={i} style={[styles.priceTableRow, isLast && { backgroundColor: livePrice ? '#fff3e0' : '#e8f5e9' }]}>
                  <Text style={[styles.priceTableCell, { flex: 1.2, fontWeight: isLast ? 'bold' : 'normal', color: COLORS.text }]}>
                    {MONTHS[i]}{isLast ? (livePrice ? ' 🟠' : ' ★') : ''}
                  </Text>
                  <Text style={[styles.priceTableCell, { fontWeight: isLast ? 'bold' : 'normal', color: COLORS.text }]}>₹{p}</Text>
                  <Text style={[styles.priceTableCell, { color: vsAvg >= 0 ? '#2e7d32' : '#c62828', fontWeight: 'bold' }]}>{vsAvg >= 0 ? '+' : ''}{vsAvg}</Text>
                  <Text style={[styles.priceTableCell, { color: change > 0 ? '#2e7d32' : change < 0 ? '#c62828' : '#999' }]}>
                    {i === 0 ? '—' : (change > 0 ? `▲${change}` : change < 0 ? `▼${Math.abs(change)}` : '—')}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* ── AI SELL ADVISOR ── */}
          <View style={styles.aiAdvisorBox}>
            <Text style={styles.aiAdvisorTitle}>🤖 {t('AI Sell Advisor', 'AI बिक्री सलाहकार')}</Text>
            <Text style={styles.aiAdvisorDesc}>
              {t(`Based on ${selectedPriceCrop}'s price history and ${livePrice ? 'live mandi data' : 'trend analysis'}, should you sell now?`,
                `${selectedPriceCrop} के मूल्य इतिहास और ${livePrice ? 'लाइव मंडी डेटा' : 'रुझान विश्लेषण'} के आधार पर, क्या आपको अभी बेचना चाहिए?`)}
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={getAiAdvice}>
              <Text style={styles.primaryBtnText}>
                {aiSellLoading ? t('Analysing market data...', 'बाज़ार डेटा विश्लेषण हो रहा है...') : t('Get AI Sell Advice', 'AI बिक्री सलाह पाएं')}
              </Text>
            </TouchableOpacity>
          </View>

          {aiSellAdvice && (
            <View style={[styles.aiResultBox, { borderColor: aiSellAdvice.color }]}>
              <View style={styles.aiResultHeader}>
                <Text style={{ fontSize: 30 }}>{aiSellAdvice.emoji}</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.aiResultLabel}>{t('AI Recommendation', 'AI सुझाव')}</Text>
                  <Text style={[styles.aiResultAction, { color: aiSellAdvice.color }]}>{aiSellAdvice.action}</Text>
                </View>
              </View>
              <View style={styles.aiResultDivider} />
              <Text style={styles.aiResultReason}>{aiSellAdvice.reason}</Text>
              <View style={[styles.aiResultFooter, { backgroundColor: aiSellAdvice.color + '18' }]}>
                <Text style={{ fontSize: 12, color: aiSellAdvice.color, fontWeight: 'bold' }}>
                  {t('Current', 'वर्तमान')}: ₹{currentPrice}/kg  •  {t('8m Avg', '8म औसत')}: ₹{avgPrice}/kg
                  {livePrice ? `  •  ${t('Live data', 'लाइव डेटा')} ✓` : ''}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  // ─────────────────────────────────────────────
  //  SCREEN: ADD PRODUCT
  // ─────────────────────────────────────────────
  const AddProductScreen = () => (
    <View style={styles.screen}>
      <View style={styles.headerWithBack}>
        <TouchableOpacity onPress={() => navigateTo('farmerDashboard')}><Text style={styles.backBtn}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>{t('Add New Crop', 'नई फसल जोड़ें')}</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.imageUpload} onPress={takePhoto}>
          {cropImage ? (
            <Image source={{ uri: cropImage }} style={{ width: '100%', height: '100%', borderRadius: 18 }} />
          ) : (
            <>
              <ImageIcon color={COLORS.primary} size={40} />
              <Text style={styles.uploadText}>{t('Tap to take photo of crop', 'फसल की फोटो लेने के लिए टैप करें')}</Text>
            </>
          )}
        </TouchableOpacity>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{t('Crop Name', 'फसल का नाम')}</Text>
          <View style={styles.inputWithMic}>
            <TextInput
              style={[styles.input, styles.inputWithMicPadding, isListeningAdd && { borderColor: COLORS.accent, borderWidth: 2 }]}
              placeholder={isListeningAdd ? t('Listening...', 'सुन रहा हूँ...') : t('e.g. Potatoes', 'उदा. आलू')}
              placeholderTextColor={isListeningAdd ? COLORS.accent : '#999'}
              value={cropName}
              onChangeText={setCropName}
            />
            <TouchableOpacity style={[styles.micBtn, isListeningAdd && { backgroundColor: COLORS.accent }]} onPress={() => handleVoiceInput(setIsListeningAdd, setCropName, t('Potatoes', 'आलू'))}>
              <Mic color="#fff" size={20} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
            <Text style={styles.inputLabel}>{t('Quantity (kg)', 'मात्रा (किलो)')}</Text>
            <TextInput style={styles.input} keyboardType="numeric" placeholder="100" placeholderTextColor="#999" />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>{t('Price (₹/kg)', 'मूल्य (₹/किलो)')}</Text>
            <TextInput style={styles.input} keyboardType="numeric" placeholder="30" placeholderTextColor="#999" />
          </View>
        </View>
        <View style={styles.suggestionBox}>
          <Text style={styles.suggestionTitle}>💡 {t('Smart Suggestion', 'स्मार्ट सुझाव')}</Text>
          <Text style={styles.suggestionText}>{t('Nearby farmers are selling Potatoes at ₹28-32/kg.', 'आसपास के किसान 28-32 ₹/किलो आलू बेच रहे हैं।')}</Text>
        </View>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => {
          setCropImage(null); setCropName('');
          Alert.alert(t('Product Listed!', 'उत्पाद जोड़ा गया!'), t('Your crop has been listed successfully.', 'आपकी फसल सफलतापूर्वक जोड़ी गई।'),
            [{ text: t('OK', 'ठीक है'), onPress: () => navigateTo('farmerDashboard') }]);
        }}>
          <Text style={styles.primaryBtnText}>{t('List Product', 'उत्पाद जोड़ें')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  // ─────────────────────────────────────────────
  //  SCREEN: BUYER MARKETPLACE
  // ─────────────────────────────────────────────
  const BuyerMarketplace = () => (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { setRole(null); navigateTo('onboarding'); }} style={styles.backBtnCircle}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.greeting}>{t('Fresh Produce', 'ताज़ी उपज')}</Text>
          <Text style={styles.subGreeting}>{t('Direct from farms near you', 'आपके आस-पास के खेतों से सीधे')}</Text>
        </View>
        <TouchableOpacity onPress={() => navigateTo('profile')}>
          <Text style={styles.headerAvatar}>👤</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.searchContainer, isListeningSearch && { borderColor: COLORS.accent, borderWidth: 2 }]}>
        <Search color={COLORS.primary} size={20} style={{ marginRight: 10 }} />
        <TextInput
          style={[styles.searchInput, { paddingRight: 50 }]}
          placeholder={isListeningSearch ? t('Listening...', 'सुन रहा हूँ...') : t('Search crops, farmers...', 'फसलें, किसान खोजें...')}
          placeholderTextColor={isListeningSearch ? COLORS.accent : '#999'}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={[styles.micBtnDark, isListeningSearch && { backgroundColor: COLORS.accent }]} onPress={() => handleVoiceInput(setIsListeningSearch, setSearchQuery, t('Fresh Apples', 'ताजे सेब'))}>
          <Mic color="#fff" size={18} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* NearbyMandi card from file 2 */}
        <TouchableOpacity style={[styles.card, { marginTop: 0, marginBottom: 20, padding: 20 }]} onPress={() => navigateTo('nearbyMandi')}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>{t('Find Nearby Mandi', 'नज़दीकी मंडी खोजें')}</Text>
            <Text style={{ fontSize: 24 }}>🏪</Text>
          </View>
          <Text style={styles.cardSubText}>{t('Check local mandi prices & status', 'स्थानीय मंडी की कीमतें और स्थिति जांचें')}</Text>
        </TouchableOpacity>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {['All', 'Vegetables', 'Fruits', 'Grains', '< 5km'].map((f, i) => (
            <TouchableOpacity key={i} style={[styles.filterChip, selectedFilter === i && styles.filterChipActive]} onPress={() => setSelectedFilter(i)}>
              <Text style={[styles.filterText, selectedFilter === i && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.grid}>
          {[
            { name: 'Tomatoes', price: '40', dist: '2.5 km', farmer: 'Ramesh Singh', emoji: '🍅' },
            { name: 'Potatoes', price: '25', dist: '3.1 km', farmer: 'Kisan Kumar', emoji: '🥔' },
            { name: 'Apples', price: '120', dist: '8.0 km', farmer: 'Suraj Farms', emoji: '🍎' },
            { name: 'Wheat', price: '22', dist: '1.2 km', farmer: 'Village Co-op', emoji: '🌾' },
          ].map((item, i) => (
            <TouchableOpacity key={i} style={styles.gridCard} onPress={() => navigateTo('productDetail')}>
              <View style={styles.gridImage}><Text style={{ fontSize: 40 }}>{item.emoji}</Text></View>
              <Text style={styles.gridTitle}>{item.name}</Text>
              <Text style={styles.gridPrice}>₹{item.price}/kg</Text>
              <View style={styles.gridMeta}>
                <MapPin size={12} color={COLORS.textLight} />
                <Text style={styles.gridMetaText}>{item.dist} • {item.farmer}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  // ─────────────────────────────────────────────
  //  SCREEN: PRODUCT DETAIL
  // ─────────────────────────────────────────────
  const ProductDetail = () => (
    <View style={styles.screen}>
      <View style={styles.headerWithBack}>
        <TouchableOpacity onPress={() => navigateTo('buyerMarketplace')}><Text style={styles.backBtn}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>{t('Product Details', 'उत्पाद विवरण')}</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.detailHero}><Text style={{ fontSize: 80 }}>🍅</Text></View>
        <View style={styles.detailInfoBox}>
          <Text style={styles.detailTitle}>{t('Fresh Tomatoes', 'ताजे टमाटर')}</Text>
          <Text style={styles.detailPrice}>₹40 / kg</Text>
          <View style={styles.farmerMiniProfile}>
            <Text style={{ fontSize: 30, marginRight: 15 }}>👨🏽‍🌾</Text>
            <View>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: COLORS.text }}>Ramesh Singh</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Star size={14} color="#ffb300" fill="#ffb300" />
                <Text style={{ color: COLORS.textLight, fontSize: 13, marginLeft: 4 }}>4.8 (120+ orders) • 2.5 km away</Text>
              </View>
            </View>
          </View>
        </View>
        <Text style={styles.sectionTitle}>{t('Negotiation', 'मोल भाव')}</Text>
        <View style={styles.chatBox}>
          <View style={styles.chatMsgOther}><Text style={styles.chatTextOther}>{t('Hello! I have 50kg fresh tomatoes available.', 'नमस्ते! मेरे पास 50 किलो ताजे टमाटर उपलब्ध हैं।')}</Text></View>
          <View style={styles.chatMsgSelf}><Text style={styles.chatTextSelf}>{t('I want 20kg. Can you do ₹35/kg?', 'मुझे 20 किलो चाहिए। क्या आप ₹35/किलो में दे सकते हैं?')}</Text></View>
          <View style={styles.chatMsgOther}><Text style={styles.chatTextOther}>{t('I can do ₹38/kg minimum.', 'मैं न्यूनतम ₹38/किलो में दे सकता हूँ।')}</Text></View>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.secondaryBtn}><Text style={styles.secondaryBtnText}>{t('Offer Price', 'कीमत का प्रस्ताव दें')}</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.primaryBtn, { flex: 1, marginTop: 0 }]} onPress={() => navigateTo('orderTracking')}>
            <Text style={styles.primaryBtnText}>{t('Buy Now (₹38/kg)', 'अभी खरीदें (₹38/किलो)')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  // ─────────────────────────────────────────────
  //  SCREEN: ORDER TRACKING
  // ─────────────────────────────────────────────
  const OrderTracking = () => (
    <View style={styles.screen}>
      <View style={styles.headerWithBack}>
        <TouchableOpacity onPress={() => navigateTo('buyerMarketplace')}><Text style={styles.backBtn}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>{t('Order Status', 'ऑर्डर की स्थिति')}</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 5 }}>Order #40291</Text>
          <Text style={{ color: COLORS.textLight }}>20 kg Tomatoes from Ramesh Singh</Text>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.primary, marginTop: 10 }}>₹ 760</Text>
        </View>
        <View style={styles.timelineBox}>
          <View style={styles.timelineItem}>
            <CheckCircle2 color={COLORS.primary} size={24} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>{t('Order Accepted', 'ऑर्डर स्वीकार किया गया')}</Text>
              <Text style={styles.timelineTime}>10:00 AM</Text>
            </View>
          </View>
          <View style={styles.timelineLine} />
          <View style={styles.timelineItem}>
            <Truck color={COLORS.primary} size={24} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>{t('Out for Delivery', 'डिलीवरी के लिए निकल गया')}</Text>
              <Text style={styles.timelineTime}>11:30 AM</Text>
            </View>
          </View>
          <View style={styles.timelineLineInactive} />
          <View style={styles.timelineItem}>
            <Clock color="#ccc" size={24} />
            <View style={styles.timelineContent}>
              <Text style={[styles.timelineTitle, { color: '#999' }]}>{t('Delivered', 'पहुंचा दिया गया')}</Text>
              <Text style={styles.timelineTime}>Est. 12:45 PM</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigateTo('buyerMarketplace')}>
          <Text style={styles.primaryBtnText}>{t('Back to Market', 'बाज़ार वापस जाएँ')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  // ─────────────────────────────────────────────
  //  SCREEN: PROFILE
  // ─────────────────────────────────────────────
  const ProfileScreen = () => {
    const isFarmer = role === 'farmer';
    return (
      <View style={styles.screen}>
        <View style={styles.headerWithBack}>
          <TouchableOpacity onPress={() => navigateTo(isFarmer ? 'farmerDashboard' : 'buyerMarketplace')}><Text style={styles.backBtn}>←</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>{t('Profile', 'प्रोफ़ाइल')}</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={{ alignItems: 'center', marginBottom: 30, marginTop: 20 }}>
            <Text style={{ fontSize: 80 }}>{isFarmer ? '👨🏽‍🌾' : '🛒'}</Text>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginTop: 10 }}>
              {isFarmer ? 'Ramesh Singh' : t('Arjun Mehta', 'अर्जुन मेहता')}
            </Text>
            <View style={[styles.badgeVerified, !isFarmer && { backgroundColor: COLORS.secondary }]}>
              <ShieldCheck color="#fff" size={16} />
              <Text style={styles.badgeVerifiedText}>{isFarmer ? t('Verified Farmer', 'सत्यापित किसान') : t('Verified Buyer', 'सत्यापित खरीदार')}</Text>
            </View>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{isFarmer ? t('Trust Rating', 'विश्वास रेटिंग') : t('Purchase History', 'खरीद इतिहास')}</Text>
            {isFarmer ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}>
                <Text style={{ fontSize: 40, fontWeight: 'bold', color: COLORS.text, marginRight: 15 }}>4.8</Text>
                <View>
                  <View style={{ flexDirection: 'row' }}>
                    {[1, 2, 3, 4, 5].map(i => <Star key={i} size={20} color="#ffb300" fill={i <= 4 ? '#ffb300' : 'transparent'} />)}
                  </View>
                  <Text style={{ color: COLORS.textLight, marginTop: 4 }}>128 {t('Reviews', 'समीक्षाएँ')}</Text>
                </View>
              </View>
            ) : (
              <View style={{ marginVertical: 10 }}>
                {[
                  [t('Total Orders', 'कुल ऑर्डर'), '34'],
                  [t('Total Spent', 'कुल खर्च'), '₹ 12,480'],
                  [t('Farmers Supported', 'समर्थित किसान'), '8'],
                ].map(([label, val], i) => (
                  <View key={i} style={[styles.rowBetween, { marginTop: i > 0 ? 8 : 0 }]}>
                    <Text style={{ color: COLORS.textLight, fontSize: 15 }}>{label}</Text>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: i === 1 ? COLORS.primary : COLORS.text }}>{val}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          <Text style={styles.sectionTitle}>{isFarmer ? t('Recent Reviews', 'हाल की समीक्षाएँ') : t('Recent Orders', 'हाल के ऑर्डर')}</Text>
          {isFarmer ? (
            <>
              <View style={styles.reviewCard}>
                <Text style={{ fontWeight: 'bold', color: COLORS.text }}>Vikram Shop</Text>
                <View style={{ flexDirection: 'row', marginVertical: 4 }}>{[1, 2, 3, 4, 5].map(i => <Star key={i} size={12} color="#ffb300" fill="#ffb300" />)}</View>
                <Text style={{ color: COLORS.textLight }}>"{t('Very fresh vegetables and good price!', 'बहुत ताजी सब्जियां और अच्छी कीमत!')}"</Text>
              </View>
              <View style={styles.reviewCard}>
                <Text style={{ fontWeight: 'bold', color: COLORS.text }}>Anita D.</Text>
                <View style={{ flexDirection: 'row', marginVertical: 4 }}>{[1, 2, 3, 4].map(i => <Star key={i} size={12} color="#ffb300" fill="#ffb300" />)}</View>
                <Text style={{ color: COLORS.textLight }}>"{t('On-time delivery. Will buy again.', 'समय पर डिलीवरी। फिर से खरीदूंगा।')}"</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.reviewCard}>
                <View style={styles.rowBetween}>
                  <Text style={{ fontWeight: 'bold', color: COLORS.text }}>🍅 {t('Tomatoes', 'टमाटर')} — 20 kg</Text>
                  <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>₹ 760</Text>
                </View>
                <Text style={{ color: COLORS.textLight, marginTop: 4 }}>Ramesh Singh • {t('2 days ago', '2 दिन पहले')}</Text>
              </View>
              <View style={styles.reviewCard}>
                <View style={styles.rowBetween}>
                  <Text style={{ fontWeight: 'bold', color: COLORS.text }}>🥔 {t('Potatoes', 'आलू')} — 15 kg</Text>
                  <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>₹ 375</Text>
                </View>
                <Text style={{ color: COLORS.textLight, marginTop: 4 }}>Kisan Kumar • {t('5 days ago', '5 दिन पहले')}</Text>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    );
  };

  // ─────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────
  return (
    <View style={styles.mainWrapper}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      {currentScreen === 'onboarding' && (
        <LoginScreen
          language={language}
          onLogin={(role, user) => {
            setRole(role);
            navigateTo(ROLE_CONFIG[role].screen);
          }}
        />
      )}
      {currentScreen === 'farmerDashboard' && <FarmerDashboard />}
      {currentScreen === 'addProduct' && <AddProductScreen />}
      {currentScreen === 'buyerMarketplace' && <BuyerMarketplace />}
      {currentScreen === 'productDetail' && <ProductDetail />}
      {currentScreen === 'orderTracking' && <OrderTracking />}
      {currentScreen === 'profile' && <ProfileScreen />}
      {currentScreen === 'aiCropRec' && <AICropRec />}
      {currentScreen === 'profitEstimator' && <ProfitEstimator />}
      {currentScreen === 'agriStore' && <AgriStore />}
      {currentScreen === 'farmingNews' && <FarmingNews />}
      {currentScreen === 'priceHistory' && <PriceHistory />}
      {currentScreen === 'nearbyMandi' && <NearbyMandi navigateTo={navigateTo} t={t} role={role} />}
    </View>
  );
}

// ─────────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: COLORS.background },
  screen: { flex: 1 },
  containerCenter: { flexGrow: 1, alignItems: 'center', padding: 24, paddingTop: 120, paddingBottom: 40 },
  logoContainer: { alignItems: 'center', marginBottom: 50 },
  logoText: { fontSize: 40, fontWeight: '900', color: COLORS.primary, letterSpacing: -1 },
  tagline: { fontSize: 16, color: COLORS.secondary, marginTop: 8 },
  langToggle: { position: 'absolute', top: 60, right: 24, flexDirection: 'row', backgroundColor: '#fff', borderRadius: 20, padding: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 2 },
  langBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 },
  langBtnActive: { backgroundColor: COLORS.primaryBg },
  langBtnText: { color: COLORS.textLight, fontWeight: 'bold' },
  langBtnTextActive: { color: COLORS.primary },
  roleTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginBottom: 20 },
  roleCard: { width: '100%', backgroundColor: COLORS.card, borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 20, flexDirection: 'row', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15, elevation: 3, borderWidth: 1, borderColor: COLORS.border },
  roleIconBg: { width: 60, height: 60, backgroundColor: COLORS.primaryBg, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginRight: 20 },
  roleIcon: { fontSize: 30 },
  roleCardText: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerWithBack: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { fontSize: 28, color: COLORS.text },
  backBtnCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.primaryBg, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  greeting: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  subGreeting: { fontSize: 14, color: COLORS.textLight },
  headerAvatar: { fontSize: 32 },
  scrollContent: { padding: 24, paddingBottom: 100 },
  card: { backgroundColor: COLORS.card, borderRadius: 20, padding: 24, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: COLORS.border },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textLight },
  earningsAmount: { fontSize: 36, fontWeight: '900', color: COLORS.primary, marginTop: 10, marginBottom: 5 },
  cardSubText: { fontSize: 14, color: COLORS.secondaryLight },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  badgeHigh: { backgroundColor: '#ffebee', color: '#d32f2f', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, fontWeight: 'bold', fontSize: 12 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 15, marginTop: 10 },
  productListItem: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12, alignItems: 'center' },
  productEmoji: { fontSize: 40, marginRight: 15 },
  productInfo: { flex: 1 },
  productName: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  productPrice: { fontSize: 14, color: COLORS.textLight, marginTop: 4 },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 15, elevation: 5 },
  imageUpload: { backgroundColor: '#fff', borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed', borderRadius: 20, height: 150, justifyContent: 'center', alignItems: 'center', marginBottom: 24, overflow: 'hidden' },
  uploadText: { color: COLORS.textLight, marginTop: 10, fontWeight: '500' },
  inputGroup: { marginBottom: 20 },
  inputRow: { flexDirection: 'row' },
  inputLabel: { fontSize: 14, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: COLORS.text, width: '100%' },
  inputWithMicPadding: { paddingRight: 56 },
  inputWithMic: { position: 'relative', justifyContent: 'center' },
  micBtn: { position: 'absolute', right: 4, backgroundColor: COLORS.primary, padding: 10, borderRadius: 10 },
  suggestionBox: { backgroundColor: COLORS.primaryBg, padding: 16, borderRadius: 12, marginBottom: 24 },
  suggestionTitle: { fontWeight: 'bold', color: COLORS.primary, marginBottom: 6 },
  suggestionText: { color: COLORS.primary, fontSize: 14 },
  primaryBtn: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  primaryBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  secondaryBtn: { backgroundColor: '#fff', padding: 18, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.primary, flex: 1, marginRight: 10 },
  secondaryBtnText: { color: COLORS.primary, fontSize: 18, fontWeight: 'bold' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 24, marginTop: 20, marginBottom: 10, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 16, color: COLORS.text },
  micBtnDark: { backgroundColor: COLORS.secondary, padding: 8, borderRadius: 8 },
  filterScroll: { marginBottom: 20 },
  filterChip: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: COLORS.border },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { color: COLORS.textLight, fontWeight: 'bold' },
  filterTextActive: { color: '#fff' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridCard: { width: '48%', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  gridImage: { alignItems: 'center', marginBottom: 10 },
  gridTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  gridPrice: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary, marginVertical: 4 },
  gridMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  gridMetaText: { fontSize: 11, color: COLORS.textLight, marginLeft: 4 },
  detailHero: { backgroundColor: '#fff', height: 200, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: -30, borderWidth: 1, borderColor: COLORS.border },
  detailInfoBox: { backgroundColor: COLORS.card, borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  detailTitle: { fontSize: 26, fontWeight: 'bold', color: COLORS.text },
  detailPrice: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary, marginVertical: 10 },
  farmerMiniProfile: { flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingTop: 15, borderTopWidth: 1, borderTopColor: COLORS.border },
  chatBox: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 20 },
  chatMsgOther: { backgroundColor: '#f5f5f5', padding: 12, borderRadius: 16, borderTopLeftRadius: 0, marginBottom: 10, alignSelf: 'flex-start', maxWidth: '80%' },
  chatTextOther: { color: COLORS.text },
  chatMsgSelf: { backgroundColor: COLORS.primaryBg, padding: 12, borderRadius: 16, borderTopRightRadius: 0, marginBottom: 10, alignSelf: 'flex-end', maxWidth: '80%' },
  chatTextSelf: { color: COLORS.primary },
  actionRow: { flexDirection: 'row' },
  timelineBox: { backgroundColor: '#fff', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: COLORS.border, marginBottom: 24 },
  timelineItem: { flexDirection: 'row', alignItems: 'flex-start' },
  timelineContent: { marginLeft: 16 },
  timelineTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  timelineTime: { fontSize: 13, color: COLORS.textLight, marginTop: 4 },
  timelineLine: { width: 2, height: 30, backgroundColor: COLORS.primary, marginLeft: 11, marginVertical: 4 },
  timelineLineInactive: { width: 2, height: 30, backgroundColor: '#ccc', marginLeft: 11, marginVertical: 4 },
  badgeVerified: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 10 },
  badgeVerifiedText: { color: '#fff', fontWeight: 'bold', marginLeft: 6, fontSize: 12 },
  reviewCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  farmerTabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  farmerTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 6, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  farmerTabActive: { borderBottomColor: COLORS.primary },
  farmerTabIcon: { fontSize: 18 },
  farmerTabLabel: { fontSize: 15, fontWeight: 'bold', color: COLORS.textLight, marginLeft: 6 },
  farmerTabLabelActive: { color: COLORS.primary },
  toolsTagline: { fontSize: 14, color: COLORS.textLight, marginBottom: 20, lineHeight: 20 },
  toolsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  toolCard: { width: '48%', backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  toolIconBox: { width: 60, height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  toolIconEmoji: { fontSize: 28 },
  toolCardTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.text, marginBottom: 6 },
  toolCardDesc: { fontSize: 12, color: COLORS.textLight, lineHeight: 17 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  selChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: '#fff' },
  selChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryBg },
  selChipText: { color: COLORS.textLight, fontWeight: 'bold', fontSize: 14 },
  selChipTextActive: { color: COLORS.primary },
  recCropCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  bestBadge: { backgroundColor: COLORS.accent, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  storeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  storeCard: { width: '48%', backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  storeEmojiBg: { width: 56, height: 56, borderRadius: 14, backgroundColor: COLORS.primaryBg, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  storeCat: { fontSize: 11, color: COLORS.primary, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  storeItemName: { fontSize: 13, fontWeight: 'bold', color: COLORS.text, marginBottom: 2, lineHeight: 18 },
  storeUnit: { fontSize: 12, color: COLORS.textLight, marginBottom: 6 },
  storePrice: { fontSize: 16, fontWeight: '900', color: COLORS.primary, marginBottom: 10 },
  addCartBtn: { backgroundColor: COLORS.primary, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  addCartBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  cartBadgeWrap: { position: 'relative' },
  cartBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#d32f2f', borderRadius: 8, width: 16, height: 16, justifyContent: 'center', alignItems: 'center' },
  cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  newsCard: { borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border },
  newsTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  newsEmoji: { fontSize: 20, marginRight: 8 },
  newsTagBadge: { backgroundColor: 'rgba(0,0,0,0.08)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, marginRight: 8 },
  newsTagText: { fontSize: 11, fontWeight: 'bold', color: COLORS.text },
  newsTime: { fontSize: 12, color: COLORS.textLight, marginLeft: 'auto' },
  newsTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.text, lineHeight: 20, marginBottom: 8 },
  newsReadMore: { fontSize: 13, color: COLORS.primary, fontWeight: 'bold' },
  // ── Live Price Banner ──
  livePriceBanner: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1.5, borderColor: COLORS.primaryLight, flexDirection: 'row', alignItems: 'center' },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2e7d32', marginRight: 6 },
  livePriceLabel: { fontSize: 12, color: COLORS.primary, fontWeight: 'bold' },
  livePriceValue: { fontSize: 28, fontWeight: '900', color: COLORS.text, marginTop: 4 },
  livePriceRange: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  livePriceError: { fontSize: 13, color: '#d32f2f', marginTop: 4 },
  refreshBtn: { padding: 8 },
  // ── Crop Pill ──
  cropPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: '#fff', marginRight: 10, gap: 6 },
  cropPillActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryBg },
  cropPillText: { fontSize: 14, fontWeight: 'bold', color: COLORS.textLight, marginLeft: 4 },
  cropPillTextActive: { color: COLORS.primary },
  // ── Price Summary ──
  priceSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, gap: 8 },
  priceSummaryCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  priceSumLabel: { fontSize: 10, color: COLORS.textLight, fontWeight: 'bold', marginBottom: 4, textTransform: 'uppercase' },
  priceSumValue: { fontSize: 16, fontWeight: '900', color: COLORS.text },
  priceSumChange: { fontSize: 11, fontWeight: 'bold', marginTop: 2 },
  // ── Chart ──
  chartCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 20, alignItems: 'center' },
  chartTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.text, marginBottom: 12, alignSelf: 'flex-start' },
  // ── Price Table ──
  priceTable: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', marginBottom: 20 },
  priceTableHeader: { flexDirection: 'row', backgroundColor: COLORS.primaryBg, paddingVertical: 10, paddingHorizontal: 12 },
  priceTableHeaderText: { fontWeight: 'bold', color: COLORS.primary, fontSize: 12 },
  priceTableRow: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 12, borderTopWidth: 1, borderTopColor: '#f5f5f5' },
  priceTableCell: { flex: 1, fontSize: 13, color: COLORS.textLight, textAlign: 'center' },
  // ── AI Advisor ──
  aiAdvisorBox: { backgroundColor: '#f3e5f5', borderRadius: 20, padding: 20, marginBottom: 16 },
  aiAdvisorTitle: { fontSize: 17, fontWeight: 'bold', color: '#6a1b9a', marginBottom: 8 },
  aiAdvisorDesc: { fontSize: 13, color: '#7b1fa2', marginBottom: 16, lineHeight: 19 },
  aiResultBox: { backgroundColor: '#fff', borderRadius: 20, borderWidth: 2, overflow: 'hidden', marginBottom: 20 },
  aiResultHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  aiResultLabel: { fontSize: 12, color: COLORS.textLight, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  aiResultAction: { fontSize: 22, fontWeight: '900', letterSpacing: 0.5, marginTop: 2 },
  aiResultDivider: { height: 1, backgroundColor: '#f0f0f0', marginHorizontal: 16 },
  aiResultReason: { fontSize: 14, color: COLORS.text, lineHeight: 21, padding: 16 },
  aiResultFooter: { paddingHorizontal: 16, paddingVertical: 10 },
});
// ─────────────────────────────────────────────────────────────────────────────
//  navigation/AppNavigator.js — KisanDirect
//
//  RESPONSIBILITIES:
//  ✅ App-level state management
//  ✅ Firebase auth listener & data loading
//  ✅ Screen routing (currentScreen state)
//  ✅ Pass state/callbacks as props to each screen
//
//  DO NOT add UI here. All UI lives in screens/.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback } from 'react';
import { View, StatusBar, Platform, Alert, Dimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  auth,
  getUserProfile,
  listenAllListings, listenFarmerListings, listenFarmerOrders,
  getBuyerOrders, getFarmerOrders,
} from '../services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

// ─── Screens ──────────────────────────────────────────────────────────────────
import LoginScreen, { ROLE_CONFIG } from '../screens/LoginScreen';
import FarmerDashboard    from '../screens/FarmerDashboard';
import RetailerDashboard  from '../screens/RetailerDashboard';
import BuyerMarketplace   from '../screens/BuyerMarketplace';
import AuctionScreen      from '../screens/AuctionScreen';
import NearbyMandi        from '../screens/NearbyMandi';
import AICropRec          from '../screens/AICropRec';
import ProfitEstimator    from '../screens/ProfitEstimator';
import AgriStore          from '../screens/AgriStore';
import FarmingNews        from '../screens/FarmingNews';
import PriceHistory       from '../screens/PriceHistory';
import AddProductScreen   from '../screens/AddProductScreen';
import ProductDetail      from '../screens/ProductDetail';
import OrderTracking      from '../screens/OrderTracking';
import ProfileScreen      from '../screens/ProfileScreen';

// ─── Constants & Hooks ────────────────────────────────────────────────────────
import COLORS from '../constants/colors';
import S from '../constants/styles';
import { COMMODITY_MAP, MOCK_PRICE_DATA } from '../constants/data';
import useTranslation from '../hooks/useTranslation';
import { fetchMandiPrice, DEFAULT_DISTRICT } from '../services/mandiApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
export default function AppNavigator() {
  // ─── Auth & Navigation ──────────────────────────────────────────────────
  const [currentScreen, setCurrentScreen] = useState('onboarding');
  const [role, setRole] = useState(null);
  const [language, setLanguage] = useState('en');
  const [currentUser, setCurrentUser] = useState(null);

  // ─── Listings & Orders ──────────────────────────────────────────────────
  const [myListings, setMyListings] = useState([]);
  const [marketListings, setMarketListings] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(false);

  // ─── Farmer Tools ───────────────────────────────────────────────────────
  const [cropImage, setCropImage] = useState(null);
  const [cropName, setCropName] = useState('');
  const [isListeningAdd, setIsListeningAdd] = useState(false);
  const [soilType, setSoilType] = useState('');
  const [season, setSeason] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [cropType, setCropType] = useState('');
  const [areaAcres, setAreaAcres] = useState('');
  const [seedCost, setSeedCost] = useState('');
  const [fertCost, setFertCost] = useState('');
  const [profitResult, setProfitResult] = useState(null);

  // ─── Price History ──────────────────────────────────────────────────────
  const [selectedPriceCrop, setSelectedPriceCrop] = useState('Tomato');
  const [livePrice, setLivePrice] = useState(null);
  const [livePriceLoading, setLivePriceLoading] = useState(false);
  const [livePriceError, setLivePriceError] = useState(null);
  const [priceData, setPriceData] = useState(MOCK_PRICE_DATA);
  const [aiSellLoading, setAiSellLoading] = useState(false);
  const [aiSellAdvice, setAiSellAdvice] = useState(null);

  // ─── Buyer / Marketplace ────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [isListeningSearch, setIsListeningSearch] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(0);
  const [farmerTab, setFarmerTab] = useState('dashboard');
  const [retailerTab, setRetailerTab] = useState('dashboard');
  const [buyerTab, setBuyerTab] = useState('market');
  const [cart, setCart] = useState([]);
  const [farmerSearch, setFarmerSearch] = useState('');
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [offerPrice, setOfferPrice] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [orderPlaced, setOrderPlaced] = useState(null);

  const t = useTranslation(language);
  const navigateTo = (screen) => setCurrentScreen(screen);
  const hasAutoLoggedRef = React.useRef(false);
  const unsubscribeRefs = React.useRef([]);

  // ─── Firebase Auth Listener ──────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && !hasAutoLoggedRef.current) {
        hasAutoLoggedRef.current = true;
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          if (profile) {
            setCurrentUser(profile);
            setLanguage(profile.language || 'en');
            setRole(profile.role);
            navigateTo(ROLE_CONFIG[profile.role].screen);
            loadUserData(firebaseUser.uid, profile.role);
          }
        } catch (e) { console.warn('Auth load error:', e); }
      }
    });
    return () => unsubscribe();
  }, []);

  // ─── Realtime Listener Cleanup ───────────────────────────────────────────
  const stopListeners = () => {
    unsubscribeRefs.current.forEach(fn => { try { fn(); } catch (_) {} });
    unsubscribeRefs.current = [];
  };

  // ─── Load User Data from Firestore ──────────────────────────────────────
  const loadUserData = (uid, userRole) => {
    setListingsLoading(true);
    stopListeners();

    if (userRole === 'farmer') {
      getFarmerOrders(uid)
        .then(orders => { setMyOrders(orders); })
        .catch(e => console.warn('[KD] getFarmerOrders failed:', e.message));

      const unsubListings = listenFarmerListings(uid, (listings) => {
        setMyListings(listings.map(l => ({
          id: l.id,
          emoji: l.emoji || '🌿',
          name: l.cropName,
          nameHi: l.cropName,
          price: `₹ ${l.pricePerKg}/kg`,
          qty: `${l.qty} kg`,
          trend: '=',
          farmerUid: l.farmerUid,
        })));
        setListingsLoading(false);
      });
      unsubscribeRefs.current.push(unsubListings);

      const unsubAll = listenAllListings((listings) => setMarketListings(listings));
      unsubscribeRefs.current.push(unsubAll);

      const unsubOrders = listenFarmerOrders(uid, (orders) => setMyOrders(orders));
      unsubscribeRefs.current.push(unsubOrders);

    } else {
      const unsubAll = listenAllListings((listings) => {
        setMarketListings(listings);
        setListingsLoading(false);
      });
      unsubscribeRefs.current.push(unsubAll);

      getBuyerOrders(uid)
        .then(orders => setMyOrders(orders))
        .catch(e => console.warn('[KD] getBuyerOrders error:', e));
    }
  };

  // ─── Live Mandi Price Fetch ──────────────────────────────────────────────
  const fetchLivePrice = useCallback(async (crop) => {
    setLivePriceLoading(true); setLivePriceError(null); setLivePrice(null);
    try {
      const records = await fetchMandiPrice(COMMODITY_MAP[crop]);
      if (records.length > 0) {
        const r = records[0];
        const rawModal = parseFloat(r.modal_price || r.Modal_Price || 0);
        setLivePrice({
          modal_price: rawModal,
          min_price:   parseFloat(r.min_price   || r.Min_Price   || 0),
          max_price:   parseFloat(r.max_price   || r.Max_Price   || 0),
          market: r.market || r.Market || r.district || DEFAULT_DISTRICT,
          date:   r.arrival_date || r.Arrival_Date || 'Today',
        });
        setPriceData(prev => {
          const base = MOCK_PRICE_DATA[crop].slice(0, 7).map(p => p * 100);
          const live = rawModal > 0 ? Math.round(rawModal) : base[6];
          return { ...prev, [crop]: [...base, live] };
        });
      } else {
        setLivePriceError(t('No data found for this crop.', 'इस फसल का डेटा नहीं मिला।'));
        setPriceData(prev => ({ ...prev, [crop]: MOCK_PRICE_DATA[crop] }));
      }
    } catch {
      setLivePriceError(t('Could not load live price. Showing estimated data.', 'लाइव कीमत लोड नहीं हो सकी।'));
      setPriceData(prev => ({ ...prev, [crop]: MOCK_PRICE_DATA[crop] }));
    } finally {
      setLivePriceLoading(false);
    }
  }, [language]);

  useEffect(() => {
    if (currentScreen === 'priceHistory') fetchLivePrice(selectedPriceCrop);
  }, [selectedPriceCrop, currentScreen]);

  // ─── Camera ─────────────────────────────────────────────────────────────
  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(t('Permission Denied', 'अनुमति नहीं मिली'), t('Enable camera in settings.', 'सेटिंग में कैमरा सक्षम करें।'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 1 });
    if (!result.canceled) setCropImage(result.assets[0].uri);
  };

  // ─── Voice Input ─────────────────────────────────────────────────────────
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

  // ─── Logout ──────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    stopListeners();
    try { await signOut(auth); } catch (_) {}
    setRole(null); setCurrentUser(null);
    setMyListings([]); setMarketListings([]); setMyOrders([]);
    hasAutoLoggedRef.current = false;
    navigateTo('onboarding');
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <View style={S.mainWrapper}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />

      {currentScreen === 'onboarding' && (
        <LoginScreen
          language={language} onLanguageChange={setLanguage} t={t}
          onLogin={(selectedRole, user) => {
            const trustedRole = user?.role || selectedRole;
            setRole(trustedRole); setCurrentUser(user);
            if (user?.language) setLanguage(user.language);
            navigateTo(ROLE_CONFIG[trustedRole].screen);
            loadUserData(user.uid, trustedRole);
          }}
        />
      )}

      {currentScreen === 'farmerDashboard' && (
        <FarmerDashboard
          t={t} currentUser={currentUser}
          farmerTab={farmerTab} setFarmerTab={setFarmerTab}
          myOrders={myOrders} myListings={myListings} listingsLoading={listingsLoading}
          navigateTo={navigateTo} setMyListings={setMyListings}
        />
      )}

      {currentScreen === 'retailerDashboard' && (
        <RetailerDashboard
          t={t} currentUser={currentUser}
          retailerTab={retailerTab} setRetailerTab={setRetailerTab}
          navigateTo={navigateTo}
        />
      )}

      {currentScreen === 'buyerMarketplace' && (
        <BuyerMarketplace
          t={t} role={role} currentUser={currentUser}
          buyerTab={buyerTab} setBuyerTab={setBuyerTab}
          searchQuery={searchQuery} setSearchQuery={setSearchQuery}
          isListeningSearch={isListeningSearch} setIsListeningSearch={setIsListeningSearch}
          selectedFilter={selectedFilter} setSelectedFilter={setSelectedFilter}
          listingsLoading={listingsLoading} marketListings={marketListings}
          cart={cart} setCart={setCart}
          navigateTo={navigateTo}
          setSelectedFarmer={setSelectedFarmer} setSelectedProduct={setSelectedProduct}
          setChatMessages={setChatMessages} setOfferPrice={setOfferPrice}
          handleVoiceInput={handleVoiceInput}
          farmerSearch={farmerSearch} setFarmerSearch={setFarmerSearch}
        />
      )}

      {currentScreen === 'aiCropRec' && (
        <AICropRec
          t={t} navigateTo={navigateTo}
          soilType={soilType} setSoilType={setSoilType}
          season={season} setSeason={setSeason}
          aiResult={aiResult} setAiResult={setAiResult}
          aiLoading={aiLoading} setAiLoading={setAiLoading}
        />
      )}

      {currentScreen === 'profitEstimator' && (
        <ProfitEstimator
          t={t} navigateTo={navigateTo}
          cropType={cropType} setCropType={setCropType}
          areaAcres={areaAcres} setAreaAcres={setAreaAcres}
          seedCost={seedCost} setSeedCost={setSeedCost}
          fertCost={fertCost} setFertCost={setFertCost}
          profitResult={profitResult} setProfitResult={setProfitResult}
          livePrice={livePrice} selectedPriceCrop={selectedPriceCrop}
        />
      )}

      {currentScreen === 'agriStore' && (
        <AgriStore
          t={t} navigateTo={navigateTo}
          cart={cart} setCart={setCart}
        />
      )}

      {currentScreen === 'farmingNews' && (
        <FarmingNews t={t} navigateTo={navigateTo} />
      )}

      {currentScreen === 'priceHistory' && (
        <PriceHistory
          t={t} navigateTo={navigateTo}
          priceData={priceData}
          selectedPriceCrop={selectedPriceCrop} setSelectedPriceCrop={setSelectedPriceCrop}
          livePrice={livePrice} livePriceLoading={livePriceLoading} livePriceError={livePriceError}
          aiSellAdvice={aiSellAdvice} setAiSellAdvice={setAiSellAdvice}
          aiSellLoading={aiSellLoading} setAiSellLoading={setAiSellLoading}
          fetchLivePrice={fetchLivePrice}
        />
      )}

      {currentScreen === 'addProduct' && (
        <AddProductScreen
          t={t} navigateTo={navigateTo} currentUser={currentUser}
          cropName={cropName} setCropName={setCropName}
          cropImage={cropImage} setCropImage={setCropImage}
          isListeningAdd={isListeningAdd} setIsListeningAdd={setIsListeningAdd}
          setMyListings={setMyListings}
          takePhoto={takePhoto} handleVoiceInput={handleVoiceInput}
        />
      )}

      {currentScreen === 'productDetail' && (
        <ProductDetail
          t={t} navigateTo={navigateTo} currentUser={currentUser}
          selectedFarmer={selectedFarmer} selectedProduct={selectedProduct}
          chatMessages={chatMessages} setChatMessages={setChatMessages}
          offerPrice={offerPrice} setOfferPrice={setOfferPrice}
          myOrders={myOrders} setMyOrders={setMyOrders}
          orderPlaced={orderPlaced} setOrderPlaced={setOrderPlaced}
        />
      )}

      {currentScreen === 'orderTracking' && (
        <OrderTracking
          t={t} navigateTo={navigateTo}
          orderPlaced={orderPlaced} setOrderPlaced={setOrderPlaced}
        />
      )}

      {currentScreen === 'profile' && (
        <ProfileScreen
          t={t} navigateTo={navigateTo} role={role} currentUser={currentUser}
          myOrders={myOrders} setMyOrders={setMyOrders}
          marketListings={marketListings}
          cart={cart} setCart={setCart}
          handleLogout={handleLogout}
        />
      )}

      {currentScreen === 'nearbyMandi' && (
        <NearbyMandi navigateTo={navigateTo} t={t} role={role} />
      )}

      {currentScreen === 'auction' && (
        <AuctionScreen
          navigateTo={navigateTo} t={t}
          isFarmer={role === 'farmer'} currentUser={currentUser}
        />
      )}
    </View>
  );
}

import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Image, StatusBar, Platform, Alert } from 'react-native';
import { MapPin, Search, Plus, MessageCircle, Star, ShieldCheck, CheckCircle2, Clock, Truck, Mic, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import NearbyMandi from './NearbyMandi';
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

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('onboarding');
  const [role, setRole] = useState(null); // 'farmer' or 'buyer'
  const [language, setLanguage] = useState('en');

  // States for Add Product Screen
  const [cropImage, setCropImage] = useState(null);
  const [cropName, setCropName] = useState('');
  const [isListeningAdd, setIsListeningAdd] = useState(false);

  // States for Marketplace Screen
  const [searchQuery, setSearchQuery] = useState('');
  const [isListeningSearch, setIsListeningSearch] = useState(false);

  // FIX 3: Filter chip state (was hardcoded to index 0 before)
  const [selectedFilter, setSelectedFilter] = useState(0);

  const t = (enText, hiText) => language === 'en' ? enText : hiText;

  const navigateTo = (screen) => setCurrentScreen(screen);

  // --- CAMERA LOGIC ---
  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert(
        t('Permission Denied', 'अनुमति नहीं मिली'),
        t("You've refused camera access. Please enable it in settings.", 'आपने कैमरा एक्सेस से मना कर दिया। कृपया सेटिंग में सक्षम करें।')
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      setCropImage(result.assets[0].uri);
    }
  };

  // --- VOICE LOGIC ---
  const handleVoiceInput = (setListeningState, setTargetText, mockText) => {
    setListeningState(true);

    if (Platform.OS === 'web' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'en' ? 'en-US' : 'hi-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setTargetText(transcript);
        setListeningState(false);
      };
      recognition.onerror = () => {
        setListeningState(false);
        setTargetText(mockText);
      };
      recognition.onend = () => {
        setListeningState(false);
      };
      recognition.start();
    } else {
      setTimeout(() => {
        setTargetText(mockText);
        setListeningState(false);
      }, 2000);
    }
  };

  // 1. Onboarding Screen
  const OnboardingScreen = () => (
    // FIX 5: Removed justifyContent:'center' conflict. Now uses paddingTop to push
    // content down naturally so the absolute langToggle doesn't overlap anything.
    <ScrollView contentContainerStyle={styles.containerCenter}>
      <View style={styles.langToggle}>
        <TouchableOpacity
          style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
          onPress={() => setLanguage('en')}
        >
          <Text style={[styles.langBtnText, language === 'en' && styles.langBtnTextActive]}>English</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.langBtn, language === 'hi' && styles.langBtnActive]}
          onPress={() => setLanguage('hi')}
        >
          <Text style={[styles.langBtnText, language === 'hi' && styles.langBtnTextActive]}>हिंदी</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>KisanDirect</Text>
        <Text style={styles.tagline}>{t('Farm to Fork, Directly.', 'खेत से आपकी थाली तक, सीधे।')}</Text>
      </View>

      <Text style={styles.roleTitle}>{t('Who are you?', 'आप कौन हैं?')}</Text>

      <TouchableOpacity
        style={styles.roleCard}
        onPress={() => { setRole('farmer'); navigateTo('farmerDashboard'); }}
      >
        <View style={styles.roleIconBg}><Text style={styles.roleIcon}>🚜</Text></View>
        <Text style={styles.roleCardText}>{t('I am a Farmer', 'मैं एक किसान हूँ')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.roleCard}
        onPress={() => { setRole('buyer'); navigateTo('buyerMarketplace'); }}
      >
        <View style={styles.roleIconBg}><Text style={styles.roleIcon}>🛒</Text></View>
        <Text style={styles.roleCardText}>{t('I am a Buyer', 'मैं एक खरीदार हूँ')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // 2. Farmer Dashboard
  const FarmerDashboard = () => (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { setRole(null); navigateTo('onboarding'); }} style={styles.backBtnCircle}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.greeting}>{t('Namaste, Ram 👋', 'नमस्ते, राम 👋')}</Text>
          <Text style={styles.subGreeting}>{t('Your Farm Summary', 'आपके खेत का सारांश')}</Text>
        </View>
        <TouchableOpacity onPress={() => navigateTo('profile')}>
          <Text style={styles.headerAvatar}>👤</Text>
        </TouchableOpacity>
      </View>

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

      <TouchableOpacity style={styles.fab} onPress={() => navigateTo('addProduct')}>
        <Plus color="#fff" size={28} />
      </TouchableOpacity>
    </View>
  );

  // 3. Add Product Screen
  const AddProductScreen = () => (
    <View style={styles.screen}>
      <View style={styles.headerWithBack}>
        <TouchableOpacity onPress={() => navigateTo('farmerDashboard')}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
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
          {/* FIX 2: Added paddingRight to input so text doesn't go under the mic button */}
          <View style={styles.inputWithMic}>
            <TextInput
              style={[
                styles.input,
                styles.inputWithMicPadding,
                isListeningAdd && { borderColor: COLORS.accent, borderWidth: 2 }
              ]}
              placeholder={isListeningAdd ? t('Listening...', 'सुन रहा हूँ...') : t('e.g. Potatoes', 'उदा. आलू')}
              placeholderTextColor={isListeningAdd ? COLORS.accent : '#999'}
              value={cropName}
              onChangeText={setCropName}
            />
            <TouchableOpacity
              style={[styles.micBtn, isListeningAdd && { backgroundColor: COLORS.accent }]}
              onPress={() => handleVoiceInput(setIsListeningAdd, setCropName, t('Potatoes', 'आलू'))}
            >
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

        {/* FIX 4: Show Alert feedback before navigating instead of silent reset */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => {
            setCropImage(null);
            setCropName('');
            Alert.alert(
              t('Product Listed!', 'उत्पाद जोड़ा गया!'),
              t('Your crop has been listed successfully.', 'आपकी फसल सफलतापूर्वक जोड़ी गई।'),
              [{ text: t('OK', 'ठीक है'), onPress: () => navigateTo('farmerDashboard') }]
            );
          }}
        >
          <Text style={styles.primaryBtnText}>{t('List Product', 'उत्पाद जोड़ें')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  // 4. Buyer Marketplace
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
        {/* FIX 2: paddingRight on search input so text doesn't go under mic */}
        <TextInput
          style={[styles.searchInput, { paddingRight: 50 }]}
          placeholder={isListeningSearch ? t('Listening...', 'सुन रहा हूँ...') : t('Search crops, farmers...', 'फसलें, किसान खोजें...')}
          placeholderTextColor={isListeningSearch ? COLORS.accent : '#999'}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          style={[styles.micBtnDark, isListeningSearch && { backgroundColor: COLORS.accent }]}
          onPress={() => handleVoiceInput(setIsListeningSearch, setSearchQuery, t('Fresh Apples', 'ताजे सेब'))}
        >
          <Mic color="#fff" size={18} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={[styles.card, { marginTop: 0, marginBottom: 20, padding: 20 }]} onPress={() => navigateTo('nearbyMandi')}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>{t('Find Nearby Mandi', 'नज़दीकी मंडी खोजें')}</Text>
            <Text style={{ fontSize: 24 }}>🏪</Text>
          </View>
          <Text style={styles.cardSubText}>{t('Check local mandi prices & status', 'स्थानीय मंडी की कीमतें और स्थिति जांचें')}</Text>
        </TouchableOpacity>

        {/* FIX 3: Filter chips are now interactive with selectedFilter state */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {['All', 'Vegetables', 'Fruits', 'Grains', '< 5km'].map((f, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.filterChip, selectedFilter === i && styles.filterChipActive]}
              onPress={() => setSelectedFilter(i)}
            >
              <Text style={[styles.filterText, selectedFilter === i && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.grid}>
          {[
            { name: 'Tomatoes', price: '40', dist: '2.5 km', farmer: 'Ramesh Singh', emoji: '🍅' },
            { name: 'Potatoes', price: '25', dist: '3.1 km', farmer: 'Kisan Kumar', emoji: '🥔' },
            { name: 'Apples', price: '120', dist: '8.0 km', farmer: 'Suraj Farms', emoji: '🍎' },
            { name: 'Wheat', price: '22', dist: '1.2 km', farmer: 'Village Co-op', emoji: '🌾' }
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

  // 5. Product Detail & Negotiation
  const ProductDetail = () => (
    <View style={styles.screen}>
      <View style={styles.headerWithBack}>
        <TouchableOpacity onPress={() => navigateTo('buyerMarketplace')}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('Product Details', 'उत्पाद विवरण')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.detailHero}>
          <Text style={{ fontSize: 80 }}>🍅</Text>
        </View>
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
          <View style={styles.chatMsgOther}>
            <Text style={styles.chatTextOther}>{t('Hello! I have 50kg fresh tomatoes available.', 'नमस्ते! मेरे पास 50 किलो ताजे टमाटर उपलब्ध हैं।')}</Text>
          </View>
          <View style={styles.chatMsgSelf}>
            <Text style={styles.chatTextSelf}>{t('I want 20kg. Can you do ₹35/kg?', 'मुझे 20 किलो चाहिए। क्या आप ₹35/किलो में दे सकते हैं?')}</Text>
          </View>
          <View style={styles.chatMsgOther}>
            <Text style={styles.chatTextOther}>{t('I can do ₹38/kg minimum.', 'मैं न्यूनतम ₹38/किलो में दे सकता हूँ।')}</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => { }}>
            <Text style={styles.secondaryBtnText}>{t('Offer Price', 'कीमत का प्रस्ताव दें')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.primaryBtn, { flex: 1, marginTop: 0 }]} onPress={() => navigateTo('orderTracking')}>
            <Text style={styles.primaryBtnText}>{t('Buy Now (₹38/kg)', 'अभी खरीदें (₹38/किलो)')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  // 6. Order Tracking
  const OrderTracking = () => (
    <View style={styles.screen}>
      <View style={styles.headerWithBack}>
        <TouchableOpacity onPress={() => navigateTo('buyerMarketplace')}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
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

  // -----------------------------------------------------------------------
  // 7. Profile Screen — FIX 1: Role-aware profile (was always showing farmer)
  // -----------------------------------------------------------------------
  const ProfileScreen = () => {
    const isFarmer = role === 'farmer';

    return (
      <View style={styles.screen}>
        <View style={styles.headerWithBack}>
          <TouchableOpacity onPress={() => navigateTo(isFarmer ? 'farmerDashboard' : 'buyerMarketplace')}>
            <Text style={styles.backBtn}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('Profile', 'प्रोफ़ाइल')}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={{ alignItems: 'center', marginBottom: 30, marginTop: 20 }}>
            {/* Avatar differs by role */}
            <Text style={{ fontSize: 80 }}>{isFarmer ? '👨🏽‍🌾' : '🛒'}</Text>

            {/* Name differs by role */}
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginTop: 10 }}>
              {isFarmer ? 'Ramesh Singh' : t('Arjun Mehta', 'अर्जुन मेहता')}
            </Text>

            {/* Badge differs by role */}
            <View style={[styles.badgeVerified, !isFarmer && { backgroundColor: COLORS.secondary }]}>
              <ShieldCheck color="#fff" size={16} />
              <Text style={styles.badgeVerifiedText}>
                {isFarmer
                  ? t('Verified Farmer', 'सत्यापित किसान')
                  : t('Verified Buyer', 'सत्यापित खरीदार')}
              </Text>
            </View>
          </View>

          {/* Stats card differs by role */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {isFarmer ? t('Trust Rating', 'विश्वास रेटिंग') : t('Purchase History', 'खरीद इतिहास')}
            </Text>

            {isFarmer ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}>
                <Text style={{ fontSize: 40, fontWeight: 'bold', color: COLORS.text, marginRight: 15 }}>4.8</Text>
                <View>
                  <View style={{ flexDirection: 'row' }}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} size={20} color="#ffb300" fill={i <= 4 ? '#ffb300' : 'transparent'} />
                    ))}
                  </View>
                  <Text style={{ color: COLORS.textLight, marginTop: 4 }}>128 {t('Reviews', 'समीक्षाएँ')}</Text>
                </View>
              </View>
            ) : (
              <View style={{ marginVertical: 10 }}>
                <View style={styles.rowBetween}>
                  <Text style={{ color: COLORS.textLight, fontSize: 15 }}>{t('Total Orders', 'कुल ऑर्डर')}</Text>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.text }}>34</Text>
                </View>
                <View style={[styles.rowBetween, { marginTop: 8 }]}>
                  <Text style={{ color: COLORS.textLight, fontSize: 15 }}>{t('Total Spent', 'कुल खर्च')}</Text>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.primary }}>₹ 12,480</Text>
                </View>
                <View style={[styles.rowBetween, { marginTop: 8 }]}>
                  <Text style={{ color: COLORS.textLight, fontSize: 15 }}>{t('Farmers Supported', 'समर्थित किसान')}</Text>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.text }}>8</Text>
                </View>
              </View>
            )}
          </View>

          {/* Reviews section: shown for farmer, recent orders for buyer */}
          <Text style={styles.sectionTitle}>
            {isFarmer ? t('Recent Reviews', 'हाल की समीक्षाएँ') : t('Recent Orders', 'हाल के ऑर्डर')}
          </Text>

          {isFarmer ? (
            <>
              <View style={styles.reviewCard}>
                <Text style={{ fontWeight: 'bold', color: COLORS.text }}>Vikram Shop</Text>
                <View style={{ flexDirection: 'row', marginVertical: 4 }}>
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} size={12} color="#ffb300" fill="#ffb300" />)}
                </View>
                <Text style={{ color: COLORS.textLight }}>"{t('Very fresh vegetables and good price!', 'बहुत ताजी सब्जियां और अच्छी कीमत!')}"</Text>
              </View>
              <View style={styles.reviewCard}>
                <Text style={{ fontWeight: 'bold', color: COLORS.text }}>Anita D.</Text>
                <View style={{ flexDirection: 'row', marginVertical: 4 }}>
                  {[1, 2, 3, 4].map(i => <Star key={i} size={12} color="#ffb300" fill="#ffb300" />)}
                </View>
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

  return (
    <View style={styles.mainWrapper}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      {currentScreen === 'onboarding' && <OnboardingScreen />}
      {currentScreen === 'farmerDashboard' && <FarmerDashboard />}
      {currentScreen === 'addProduct' && <AddProductScreen />}
      {currentScreen === 'buyerMarketplace' && <BuyerMarketplace />}
      {currentScreen === 'productDetail' && <ProductDetail />}
      {currentScreen === 'orderTracking' && <OrderTracking />}
      {currentScreen === 'profile' && <ProfileScreen />}
      {currentScreen === 'nearbyMandi' && <NearbyMandi navigateTo={navigateTo} t={t} role={role} />}
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screen: {
    flex: 1,
  },
  // FIX 5: Changed from View+justifyContent:'center' to ScrollView with paddingTop
  // so the absolute langToggle (top:60) never overlaps the logo or role cards.
  containerCenter: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 24,
    paddingTop: 120,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoText: {
    fontSize: 40,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.secondary,
    marginTop: 8,
  },
  langToggle: {
    position: 'absolute',
    top: 60,
    right: 24,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  langBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  langBtnActive: {
    backgroundColor: COLORS.primaryBg,
  },
  langBtnText: {
    color: COLORS.textLight,
    fontWeight: 'bold',
  },
  langBtnTextActive: {
    color: COLORS.primary,
  },
  roleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
  },
  roleCard: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  roleIconBg: {
    width: 60,
    height: 60,
    backgroundColor: COLORS.primaryBg,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  roleIcon: {
    fontSize: 30,
  },
  roleCardText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerWithBack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    fontSize: 28,
    color: COLORS.text,
  },
  backBtnCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subGreeting: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  headerAvatar: {
    fontSize: 32,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textLight,
  },
  earningsAmount: {
    fontSize: 36,
    fontWeight: '900',
    color: COLORS.primary,
    marginTop: 10,
    marginBottom: 5,
  },
  cardSubText: {
    fontSize: 14,
    color: COLORS.secondaryLight,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeHigh: {
    backgroundColor: '#ffebee',
    color: '#d32f2f',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: 'bold',
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15,
    marginTop: 10,
  },
  productListItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  productEmoji: {
    fontSize: 40,
    marginRight: 15,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  productPrice: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 5,
  },
  imageUpload: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 20,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'hidden',
  },
  uploadText: {
    color: COLORS.textLight,
    marginTop: 10,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
    width: '100%',
  },
  // FIX 2: Extra right padding so text doesn't go under the mic button
  inputWithMicPadding: {
    paddingRight: 56,
  },
  inputWithMic: {
    position: 'relative',
    justifyContent: 'center',
  },
  micBtn: {
    position: 'absolute',
    right: 4,
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 10,
  },
  suggestionBox: {
    backgroundColor: COLORS.primaryBg,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  suggestionTitle: {
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 6,
  },
  suggestionText: {
    color: COLORS.primary,
    fontSize: 14,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryBtn: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
    flex: 1,
    marginRight: 10,
  },
  secondaryBtnText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 24,
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
  },
  micBtnDark: {
    backgroundColor: COLORS.secondary,
    padding: 8,
    borderRadius: 8,
  },
  filterScroll: {
    marginBottom: 20,
  },
  filterChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    color: COLORS.textLight,
    fontWeight: 'bold',
  },
  filterTextActive: {
    color: '#fff',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  gridImage: {
    alignItems: 'center',
    marginBottom: 10,
  },
  gridTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  gridPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginVertical: 4,
  },
  gridMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  gridMetaText: {
    fontSize: 11,
    color: COLORS.textLight,
    marginLeft: 4,
  },
  detailHero: {
    backgroundColor: '#fff',
    height: 200,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: -30,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailInfoBox: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  detailTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  detailPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginVertical: 10,
  },
  farmerMiniProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  chatBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  chatMsgOther: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 16,
    borderTopLeftRadius: 0,
    marginBottom: 10,
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  chatTextOther: {
    color: COLORS.text,
  },
  chatMsgSelf: {
    backgroundColor: COLORS.primaryBg,
    padding: 12,
    borderRadius: 16,
    borderTopRightRadius: 0,
    marginBottom: 10,
    alignSelf: 'flex-end',
    maxWidth: '80%',
  },
  chatTextSelf: {
    color: COLORS.primary,
  },
  actionRow: {
    flexDirection: 'row',
  },
  timelineBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineContent: {
    marginLeft: 16,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  timelineTime: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 4,
  },
  timelineLine: {
    width: 2,
    height: 30,
    backgroundColor: COLORS.primary,
    marginLeft: 11,
    marginVertical: 4,
  },
  timelineLineInactive: {
    width: 2,
    height: 30,
    backgroundColor: '#ccc',
    marginLeft: 11,
    marginVertical: 4,
  },
  badgeVerified: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
  },
  badgeVerifiedText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 12,
  },
  reviewCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});
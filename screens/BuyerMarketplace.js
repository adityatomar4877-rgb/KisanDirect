import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, StatusBar } from 'react-native';
import { Search, Mic } from 'lucide-react-native';
import COLORS from '../constants/colors';
import S from '../constants/styles';
import AppHeader from '../components/AppHeader';
import SectionHeader from '../components/SectionHeader';
import { NEARBY_FARMERS } from '../constants/data';
import { getRoleColor } from '../utils/appHelpers';

export default function BuyerMarketplace({
  t, role, currentUser,
  searchQuery, setSearchQuery, isListeningSearch, setIsListeningSearch,
  selectedFilter, setSelectedFilter,
  listingsLoading, marketListings, cart, setCart,
  navigateTo, setSelectedFarmer, setSelectedProduct, setChatMessages, setOfferPrice,
  handleVoiceInput,
  farmerSearch, setFarmerSearch,
}) {
  const [activeTab, setActiveTab] = useState('market');
  const BC = getRoleColor(role, COLORS);

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
                  <Text style={[S.filterChipText, selectedFilter === i && { color: '#fff' }]}>{t(f)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {listingsLoading && (
              <View style={{ alignItems: 'center', padding: 20 }}>
                <ActivityIndicator color={BC} />
                <Text style={{ color: COLORS.textLight, marginTop: 8, fontSize: 13 }}>{t('Loading fresh produce...', 'ताजी उपज लोड हो रही है...')}</Text>
              </View>
            )}
            {!listingsLoading && marketListings.length > 0 && (
              <>
                <Text style={[S.sectionTitle, { marginBottom: 12 }]}>🌿 {t('Live from Farmers', 'किसानों से सीधे')}</Text>
                <View style={S.productsGrid}>
                  {marketListings.map((item, i) => (
                    <TouchableOpacity key={item.id || i} style={S.productCard} onPress={() => {
                      const farmerObj = {
                        name: item.farmerName,
                        dist: '--',
                        rating: 4.5,
                        reviews: 0,
                        crops: [item.emoji + ' ' + item.cropName],
                        verified: true,
                        avatar: (item.farmerName || '?').split(' ').map(w => w[0]).join(''),
                        deliveries: 0,
                        price: `₹${item.pricePerKg}/kg`,
                        uid: item.farmerUid,
                        id: item.farmerUid,
                      };
                      setSelectedFarmer(farmerObj);
                      setSelectedProduct(item);
                      setChatMessages([{ from: 'farmer', text: t('Hello! I have fresh produce available.', 'नमस्ते! ताजा उपज उपलब्ध है।') + ' ' + item.emoji + ' ' + item.cropName + ' @ ₹' + item.pricePerKg + '/kg' }]);
                      setOfferPrice('');
                      navigateTo('productDetail');
                    }} activeOpacity={0.88}>
                      <View style={[S.productCardEmoji, { backgroundColor: COLORS.primaryBg }]}>
                        <Text style={{ fontSize: 36 }}>{item.emoji || '🌿'}</Text>
                      </View>
                      <Text style={S.productCardName}>{item.cropName}</Text>
                      <Text style={[S.productCardPrice, { color: BC }]}>₹{item.pricePerKg}/kg</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                        <Text style={{ fontSize: 12, color: COLORS.accent }}>★</Text>
                        <Text style={S.productCardMeta}> {item.qty} kg avail</Text>
                      </View>
                      <Text style={S.productCardFarmer} numberOfLines={1}>{item.farmerName}</Text>
                      <TouchableOpacity
                        style={[S.addCartBtn, { marginTop: 8 }, cart.find(c => c.id === item.id) && { backgroundColor: COLORS.primaryBg, borderColor: COLORS.primaryMid, borderWidth: 1 }]}
                        onPress={(e) => {
                          e.stopPropagation && e.stopPropagation();
                          setCart(prev => {
                            const exists = prev.find(c => c.id === item.id);
                            if (exists) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
                            return [...prev, {
                              id: item.id,
                              name: item.cropName,
                              cropName: item.cropName,
                              emoji: item.emoji || '🌿',
                              price: item.pricePerKg,
                              pricePerKg: item.pricePerKg,
                              qty: 1,
                              farmerName: item.farmerName,
                              farmerUid: item.farmerUid,
                            }];
                          });
                        }}
                      >
                        <Text style={[S.addCartBtnText, cart.find(c => c.id === item.id) && { color: COLORS.primaryMid }]}>
                          {cart.find(c => c.id === item.id) ? `✓ ${t('In Cart', 'कार्ट में')} (${cart.find(c => c.id === item.id).qty})` : `+ ${t('Add to Cart', 'कार्ट में जोड़ें')}`}
                        </Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
            {!listingsLoading && marketListings.length === 0 && (
              <>
                <Text style={[S.sectionTitle, { marginBottom: 12, color: COLORS.textLight }]}>📦 {t('Sample Listings', 'नमूना सूची')}</Text>
                <View style={S.productsGrid}>
                  {[
                    { name: t('Tomatoes', 'टमाटर'), price: '40', dist: '2.5 km', farmer: 'Ramesh Singh', emoji: '🍅', rating: 4.8 },
                    { name: t('Potatoes', 'आलू'), price: '25', dist: '3.1 km', farmer: 'Kisan Kumar', emoji: '🥔', rating: 4.4 },
                    { name: t('Wheat', 'गेहूं'), price: '22', dist: '1.2 km', farmer: 'Village Co-op', emoji: '🌾', rating: 4.9 },
                    { name: t('Onions', 'प्याज'), price: '32', dist: '4.1 km', farmer: 'Suresh Patel', emoji: '🧅', rating: 4.6 },
                  ].map((item, i) => (
                    <TouchableOpacity key={i} style={[S.productCard, { opacity: 0.7 }]} activeOpacity={0.88}
                      onPress={() => Alert.alert(t('Sample Listing', 'नमूना'), t('No farmers have posted yet. Check back soon!', 'अभी कोई किसान नहीं। जल्द देखें!'))}>
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
              </>
            )}

            <TouchableOpacity style={[S.featureCard, { marginTop: 16 }]} onPress={() => navigateTo('nearbyMandi')} activeOpacity={0.85}>
              <View style={[S.featureCardIcon, { backgroundColor: COLORS.buyerBg }]}><Text style={{ fontSize: 26 }}>📍</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={S.featureCardTitle}>{t('Nearby Mandis', 'नज़दीकी मंडी')}</Text>
                <Text style={S.featureCardSub}>{t('Find mandis near your location', 'अपने पास मंडी खोजें')}</Text>
              </View>
              <Text style={[S.featureCardChevron, { color: BC }]}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[S.featureCard]} onPress={() => navigateTo('auction')} activeOpacity={0.85}>
              <View style={[S.featureCardIcon, { backgroundColor: '#FFF9C4' }]}><Text style={{ fontSize: 26 }}>🔨</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={S.featureCardTitle}>{t('Live Auctions', 'लाइव नीलामी')}</Text>
                <Text style={S.featureCardSub}>{t('Bid on fresh produce batches', 'ताजी उपज पर बोली लगाएं')}</Text>
              </View>
              <Text style={[S.featureCardChevron, { color: BC }]}>›</Text>
            </TouchableOpacity>

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

            {(() => {
              const rfMap = {};
              marketListings.forEach(l => {
                if (l.farmerUid && !rfMap[l.farmerUid]) {
                  rfMap[l.farmerUid] = {
                    id: l.farmerUid,
                    uid: l.farmerUid,
                    name: l.farmerName || 'Farmer',
                    crops: [],
                    verified: true,
                    avatar: (l.farmerName || '?').split(' ').map(w => w[0]).join(''),
                    rating: 4.5, reviews: 0, dist: '--', deliveries: 0, price: '--', badge: null,
                  };
                }
                if (l.farmerUid) rfMap[l.farmerUid].crops.push((l.emoji || '🌿') + ' ' + (l.cropName || ''));
              });
              const rf = Object.values(rfMap).filter(f =>
                farmerSearch === '' ||
                f.name.toLowerCase().includes(farmerSearch.toLowerCase()) ||
                f.crops.some(c => c.toLowerCase().includes(farmerSearch.toLowerCase()))
              );
              if (rf.length === 0) return null;
              return (
                <>
                  <Text style={[S.sectionTitle, { marginBottom: 12, color: COLORS.primaryMid }]}>🌿 {t('Active Farmers', 'सक्रिय किसान')}</Text>
                  {rf.map((farmer) => (
                    <TouchableOpacity key={farmer.id} style={[S.farmerCard, { borderColor: COLORS.primaryLight }]}
                      onPress={() => {
                        setSelectedFarmer(farmer);
                        setSelectedProduct(null);
                        setChatMessages([{ from: 'farmer', text: `${t('Hello! I have fresh produce available.', 'नमस्ते! ताजा उपज उपलब्ध है।')} (${farmer.crops.join(', ')})` }]);
                        setOfferPrice('');
                        navigateTo('productDetail');
                      }} activeOpacity={0.88}>
                      <View style={[S.farmerAvatar, { backgroundColor: COLORS.primaryBg }]}>
                        <Text style={[S.farmerAvatarText, { color: COLORS.primaryMid }]}>{farmer.avatar}</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 14 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <Text style={S.farmerName}>{farmer.name}</Text>
                          <View style={[S.verifiedBadge, { backgroundColor: COLORS.primaryMid }]}>
                            <Text style={[S.verifiedBadgeText, { color: '#fff' }]}>✓ {t('Real', 'असली')}</Text>
                          </View>
                        </View>
                        <Text style={{ fontSize: 11, color: COLORS.textLight }}>ID: {farmer.uid.slice(0, 8)}…</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                            {farmer.crops.map((crop, ci) => (
                              <View key={ci} style={[S.cropPill, { backgroundColor: COLORS.primaryBg }]}>
                                <Text style={[S.cropPillText, { color: COLORS.primaryMid }]}>{crop}</Text>
                              </View>
                            ))}
                          </View>
                        </ScrollView>
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                          <TouchableOpacity
                            style={[S.contactBtn, { borderColor: BC, backgroundColor: BC }]}
                            onPress={() => {
                              setSelectedFarmer(farmer);
                              setSelectedProduct(null);
                              setChatMessages([{ from: 'farmer', text: `${t('Hello! I have fresh produce available.', 'नमस्ते! ताजा उपज उपलब्ध है।')} (${farmer.crops.join(', ')})` }]);
                              setOfferPrice('');
                              navigateTo('productDetail');
                            }}
                          >
                            <Text style={[S.contactBtnText, { color: '#fff' }]}>💬 {t('Chat & Order', 'चैट और ऑर्डर')}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                  <Text style={[S.sectionTitle, { marginBottom: 8, marginTop: 16, color: COLORS.textLight }]}>📍 {t('Nearby Farmers', 'नज़दीकी किसान')}</Text>
                  <View style={[S.infoBox, { backgroundColor: '#FFF8E1', borderColor: '#F9A825', marginBottom: 12 }]}>
                    <Text style={{ fontSize: 12, color: '#E65100', fontWeight: '700' }}>
                      ⚠️ {t('Sample profiles — to place a real order use the Market tab or Active Farmers above.', 'नमूना प्रोफाइल — असली ऑर्डर के लिए बाज़ार टैब या ऊपर सक्रिय किसान देखें।')}
                    </Text>
                  </View>
                </>
              );
            })()}

            {filteredFarmers.map((farmer) => (
              <TouchableOpacity key={farmer.id} style={S.farmerCard}
                onPress={() => Alert.alert(
                  t('Sample Profile', 'नमूना प्रोफाइल'),
                  t('This is a sample farmer profile. To order from real farmers, please use the Market tab.', 'यह एक नमूना प्रोफाइल है। असली किसानों से ऑर्डर के लिए बाज़ार टैब इस्तेमाल करें।')
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
                    <View style={[S.verifiedBadge, { backgroundColor: '#FFF3E0' }]}>
                      <Text style={[S.verifiedBadgeText, { color: COLORS.warning }]}>📋 {t('Sample', 'नमूना')}</Text>
                    </View>
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
                    <View style={[S.contactBtn, { borderColor: COLORS.borderLight, backgroundColor: COLORS.surfaceAlt }]}>
                      <Text style={[S.contactBtnText, { color: COLORS.textLight }]}>📋 {t('Sample', 'नमूना')}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            {filteredFarmers.length === 0 && Object.keys(marketListings.reduce((m, l) => { if (l.farmerUid) m[l.farmerUid] = true; return m; }, {})).length === 0 && (
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
}

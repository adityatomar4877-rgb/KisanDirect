import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, StatusBar } from 'react-native';
import { Plus } from 'lucide-react-native';
import COLORS from '../constants/colors';
import S from '../constants/styles';
import AppHeader from '../components/AppHeader';
import StatCard from '../components/StatCard';
import SectionHeader from '../components/SectionHeader';
import { deleteListing } from '../services/firebase';

export default function FarmerDashboard({
  t, currentUser, farmerTab, setFarmerTab,
  myOrders, myListings, listingsLoading,
  navigateTo, setMyListings,
}) {
  return (
    <View style={S.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
      <AppHeader
        emoji="🌾"
        title={t(`Namaste, ${currentUser?.name?.split(' ')[0] || 'Kisan'} 👋`, `नमस्ते, ${currentUser?.name?.split(' ')[0] || 'किसान'} 👋`)}
        subtitle={farmerTab === 'dashboard' ? t('Your farm at a glance', 'खेत का सारांश') : t('Farmer tools & insights', 'किसान औज़ार')}
        onProfile={() => navigateTo('profile')}
        accent={COLORS.primaryMid}
        currentUser={currentUser}
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
          {(() => {
            const confirmedOrders = myOrders.filter(o => o.status === 'confirmed' || o.status === 'delivered');
            const totalEarnings = confirmedOrders.reduce((sum, o) => sum + (o.totalAmount || (o.pricePerKg || 0) * (o.qty || 0)), 0);
            const pendingCount = myOrders.filter(o => o.status === 'pending').length;
            return (
              <>
                <View style={[S.heroCard, { backgroundColor: COLORS.primaryMid }]}>
                  <Text style={S.heroLabel}>{t("Total Earnings", "कुल कमाई")}</Text>
                  <Text style={S.heroAmount}>₹ {totalEarnings.toLocaleString()}</Text>
                  <View style={S.heroTrend}>
                    <Text style={S.heroTrendText}>
                      {confirmedOrders.length} {t('completed orders', 'पूर्ण ऑर्डर')}
                    </Text>
                  </View>
                </View>

                <View style={S.statsGrid}>
                  <StatCard icon="📦" label={t('Products', 'उत्पाद')} value={String(myListings.length)} color={COLORS.primaryMid} bg={COLORS.primaryBg} />
                  <StatCard icon="🛒" label={t('Orders', 'ऑर्डर')} value={String(myOrders.length)} color={COLORS.warning} bg="#FFF3E0" />
                  <StatCard icon="⭐" label={t('Rating', 'रेटिंग')} value={myOrders.length > 0 ? '4.8' : '--'} color={COLORS.accent} bg={COLORS.accentLight} />
                </View>

                {pendingCount > 0 && (
                  <TouchableOpacity
                    style={[S.signalCard, { borderLeftColor: COLORS.warning, backgroundColor: '#FFF8E1' }]}
                    onPress={() => navigateTo('profile')}
                    activeOpacity={0.85}
                  >
                    <Text style={{ fontSize: 24 }}>⚠️</Text>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[S.signalTitle, { color: COLORS.warning }]}>
                        {pendingCount} {t('pending order(s)', 'ऑर्डर बाकी हैं')}
                      </Text>
                      <Text style={S.signalText}>
                        {t('Tap to accept or reject', 'स्वीकार या अस्वीकार करने के लिए टैप करें')}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 16, color: COLORS.warning, fontWeight: '800' }}>›</Text>
                  </TouchableOpacity>
                )}
              </>
            );
          })()}

          <TouchableOpacity style={[S.auctionBanner]} onPress={() => navigateTo('auction')} activeOpacity={0.87}>
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

          {myOrders.length > 0 && (
            <>
              <SectionHeader
                title={t('Recent Orders', 'हालिया ऑर्डर')}
                action={t('View All →', 'सभी देखें →')}
                onAction={() => navigateTo('profile')}
                roleColor={COLORS.primaryMid}
              />
              {myOrders.slice(0, 3).map((order) => {
                const sc = {
                  pending: { color: COLORS.warning, label: t('Pending', 'बाकी') },
                  confirmed: { color: COLORS.success, label: t('Confirmed', 'पुष्टि') },
                  delivered: { color: COLORS.primaryMid, label: t('Delivered', 'पहुंचाया') },
                  rejected: { color: COLORS.danger, label: t('Rejected', 'अस्वीकृत') },
                }[order.status] || { color: COLORS.textLight, label: order.status };
                return (
                  <TouchableOpacity key={order.id} style={[S.orderCard, { borderLeftColor: sc.color }]}
                    onPress={() => navigateTo('profile')} activeOpacity={0.85}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontSize: 26, marginRight: 12 }}>{order.cropEmoji || '🌿'}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={S.orderCrop}>{order.cropName || 'Crop'} — {order.qty || 1} kg</Text>
                        <Text style={S.orderMeta}>🛒 {order.buyerName || t('Buyer', 'खरीदार')} • ₹{order.totalAmount?.toLocaleString() || '--'}</Text>
                      </View>
                      <View style={[S.statusPill, { backgroundColor: sc.color + '1A' }]}>
                        <Text style={[S.statusPillText, { color: sc.color }]}>{sc.label}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          <SectionHeader
            title={t('My Listings', 'मेरी फसलें')}
            action={t('+ Add', '+ जोड़ें')}
            onAction={() => navigateTo('addProduct')}
            roleColor={COLORS.primaryMid}
          />
          {listingsLoading && (
            <View style={{ alignItems: 'center', padding: 20 }}>
              <ActivityIndicator color={COLORS.primaryMid} />
            </View>
          )}
          {!listingsLoading && myListings.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 24 }}>
              <Text style={{ fontSize: 36, marginBottom: 8 }}>🌿</Text>
              <Text style={{ color: COLORS.textLight, fontSize: 14, fontWeight: '600' }}>{t('No listings yet', 'अभी कोई लिस्टिंग नहीं')}</Text>
              <TouchableOpacity style={{ marginTop: 10 }} onPress={() => navigateTo('addProduct')}>
                <Text style={{ color: COLORS.primaryMid, fontWeight: '800', fontSize: 14 }}>+ {t('Add your first crop', 'पहली फसल जोड़ें')}</Text>
              </TouchableOpacity>
            </View>
          )}
          {myListings.map((p, i) => (
            <TouchableOpacity key={p.id || i} style={S.listingRow} activeOpacity={0.85}
              onPress={() => Alert.alert(p.name, `${t('Price', 'मूल्य')}: ${p.price}\n${t('Available', 'उपलब्ध')}: ${p.qty}`)}
              onLongPress={() => {
                Alert.alert(
                  t('Delete Listing?', 'लिस्टिंग हटाएं?'),
                  t(`Remove "${p.name}" from your listings?`, `"${p.name}" को लिस्टिंग से हटाएं?`),
                  [
                    { text: t('Cancel', 'रद्द') },
                    {
                      text: t('Delete', 'हटाएं'), style: 'destructive', onPress: async () => {
                        try {
                          await deleteListing(p.id);
                          setMyListings(prev => prev.filter(l => l.id !== p.id));
                        } catch (e) { Alert.alert('Error', e.message); }
                      }
                    },
                  ]
                );
              }}
            >
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

          <TouchableOpacity style={S.wideToolCard} onPress={() => { navigateTo('priceHistory'); }} activeOpacity={0.85}>
            <View style={[S.toolIconBg, { backgroundColor: '#FCE4EC', marginBottom: 0, marginRight: 16 }]}>
              <Text style={{ fontSize: 26 }}>📈</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={S.toolTitle}>{t('Price History & Sell Advisor', 'मूल्य इतिहास और AI सलाह')}</Text>
              <Text style={S.toolDesc}>{t('Live mandi rates + AI tells when to sell', 'लाइव भाव + कब बेचें AI बताएगा')}</Text>
            </View>
            <Text style={{ fontSize: 22, color: COLORS.textLight }}>›</Text>
          </TouchableOpacity>

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
}

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StatusBar } from 'react-native';
import COLORS from '../constants/colors';
import S from '../constants/styles';
import AppHeader from '../components/AppHeader';
import StatCard from '../components/StatCard';
import SectionHeader from '../components/SectionHeader';

export default function RetailerDashboard({
  t, currentUser, retailerTab, setRetailerTab, navigateTo,
}) {
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
        currentUser={currentUser}
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
            <SectionHeader title={t('Recent Orders', 'हालिया ऑर्डर')} roleColor={RC} />
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
            <SectionHeader title={t('Top Crops Purchased', 'सबसे ज़्यादा खरीदी')} roleColor={RC} />
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
}

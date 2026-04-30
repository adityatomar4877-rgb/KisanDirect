import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    TextInput,
    ScrollView,
    StatusBar,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';

// ─────────────────────────────────────────────
//  COLORS (matches your existing app theme)
// ─────────────────────────────────────────────
const COLORS = {
    primary: '#2e7d32',
    primaryLight: '#4caf50',
    primaryBg: '#e8f5e9',
    secondary: '#5d4037',
    background: '#f9fbe7',
    card: '#ffffff',
    text: '#3e2723',
    textLight: '#795548',
    border: '#c8e6c9',
    retailer: '#1565C0',
    retailerBg: '#e3f2fd',
    buyer: '#6a1b9a',
    buyerBg: '#f3e5f5',
};

// ─────────────────────────────────────────────
//  ROLE CONFIGURATION — privileges per role
// ─────────────────────────────────────────────
export const ROLE_CONFIG = {
    farmer: {
        label: 'Farmer',
        labelHi: 'किसान',
        emoji: '🚜',
        color: COLORS.primary,
        bgColor: COLORS.primaryBg,
        description: 'Sell your produce directly to buyers & retailers',
        descriptionHi: 'अपनी उपज सीधे खरीदारों को बेचें',
        privileges: [
            { icon: '📦', text: 'List & manage your crops', textHi: 'अपनी फसलें सूचीबद्ध करें' },
            { icon: '📈', text: 'View live mandi prices', textHi: 'लाइव मंडी भाव देखें' },
            { icon: '🌱', text: 'AI crop recommendations', textHi: 'AI फसल सुझाव' },
            { icon: '💰', text: 'Track earnings & profits', textHi: 'आय और लाभ ट्रैक करें' },
            { icon: '🏪', text: 'Access agri store', textHi: 'कृषि स्टोर तक पहुंच' },
        ],
        screen: 'farmerDashboard',
    },
    retailer: {
        label: 'Retailer',
        labelHi: 'व्यापारी',
        emoji: '🏬',
        color: COLORS.retailer,
        bgColor: COLORS.retailerBg,
        description: 'Bulk purchase directly from farmers at best prices',
        descriptionHi: 'किसानों से सीधे थोक खरीद करें',
        privileges: [
            { icon: '📋', text: 'Bulk order management', textHi: 'थोक ऑर्डर प्रबंधन' },
            { icon: '💲', text: 'Negotiate prices with farmers', textHi: 'किसानों से मोलभाव करें' },
            { icon: '📊', text: 'Demand & supply analytics', textHi: 'मांग और आपूर्ति विश्लेषण' },
            { icon: '🚚', text: 'Manage deliveries & logistics', textHi: 'डिलीवरी प्रबंधन' },
            { icon: '🧾', text: 'GST invoices & billing', textHi: 'GST इनवॉइस और बिलिंग' },
        ],
        screen: 'retailerDashboard',
    },
    buyer: {
        label: 'Buyer',
        labelHi: 'खरीदार',
        emoji: '🛒',
        color: COLORS.buyer,
        bgColor: COLORS.buyerBg,
        description: 'Buy fresh produce directly from local farms',
        descriptionHi: 'स्थानीय खेतों से ताजी उपज खरीदें',
        privileges: [
            { icon: '🔍', text: 'Browse & search produce', textHi: 'उपज खोजें और ब्राउज़ करें' },
            { icon: '🤝', text: 'Negotiate with farmers', textHi: 'किसानों से मोलभाव करें' },
            { icon: '📍', text: 'Nearby farm discovery', textHi: 'आसपास के खेतों की खोज' },
            { icon: '⭐', text: 'Rate & review farmers', textHi: 'किसानों को रेट करें' },
            { icon: '📦', text: 'Track your orders', textHi: 'अपने ऑर्डर ट्रैक करें' },
        ],
        screen: 'buyerMarketplace',
    },
};

// ─────────────────────────────────────────────
//  ROLE CARD component
// ─────────────────────────────────────────────
const RoleCard = ({ roleKey, config, selected, onSelect, language }) => {
    const isSelected = selected === roleKey;
    return (
        <TouchableOpacity
            style={[
                styles.roleCard,
                { borderColor: isSelected ? config.color : COLORS.border },
                isSelected && { backgroundColor: config.bgColor, borderWidth: 2 },
            ]}
            onPress={() => onSelect(roleKey)}
            activeOpacity={0.85}
        >
            <View style={[styles.roleIconCircle, { backgroundColor: isSelected ? config.color : config.bgColor }]}>
                <Text style={styles.roleEmoji}>{config.emoji}</Text>
            </View>
            <View style={styles.roleCardText}>
                <Text style={[styles.roleLabel, { color: isSelected ? config.color : COLORS.text }]}>
                    {language === 'hi' ? config.labelHi : config.label}
                </Text>
                <Text style={styles.roleDesc} numberOfLines={2}>
                    {language === 'hi' ? config.descriptionHi : config.description}
                </Text>
            </View>
            <View style={[styles.radioOuter, { borderColor: config.color }]}>
                {isSelected && <View style={[styles.radioInner, { backgroundColor: config.color }]} />}
            </View>
        </TouchableOpacity>
    );
};

// ─────────────────────────────────────────────
//  PRIVILEGE PREVIEW component
// ─────────────────────────────────────────────
const PrivilegePreview = ({ roleKey, language }) => {
    const config = ROLE_CONFIG[roleKey];
    return (
        <View style={[styles.privilegeBox, { borderColor: config.color + '44', backgroundColor: config.bgColor }]}>
            <Text style={[styles.privilegeTitle, { color: config.color }]}>
                {language === 'hi' ? `${config.labelHi} की सुविधाएं` : `${config.label} Privileges`}
            </Text>
            {config.privileges.map((p, i) => (
                <View key={i} style={styles.privilegeRow}>
                    <Text style={styles.privilegeIcon}>{p.icon}</Text>
                    <Text style={[styles.privilegeText, { color: config.color }]}>
                        {language === 'hi' ? p.textHi : p.text}
                    </Text>
                </View>
            ))}
        </View>
    );
};

// ─────────────────────────────────────────────
//  MAIN LOGIN SCREEN
// ─────────────────────────────────────────────
export default function LoginScreen({ onLogin, language = 'en' }) {
    const [step, setStep] = useState('role'); // 'role' | 'credentials'
    const [selectedRole, setSelectedRole] = useState(null);
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [name, setName] = useState('');

    const t = (en, hi) => (language === 'hi' ? hi : en);
    const config = selectedRole ? ROLE_CONFIG[selectedRole] : null;
    const roleColor = config ? config.color : COLORS.primary;

    const handleContinue = () => {
        if (!selectedRole) {
            Alert.alert(
                t('Select Role', 'भूमिका चुनें'),
                t('Please select who you are to continue.', 'कृपया जारी रखने के लिए अपनी भूमिका चुनें।')
            );
            return;
        }
        setStep('credentials');
    };

    const handleLogin = async () => {
        if (!phone || phone.length < 10) {
            Alert.alert(t('Invalid Phone', 'अमान्य फ़ोन'), t('Enter a valid 10-digit phone number.', '10 अंकों का फ़ोन नंबर दर्ज करें।'));
            return;
        }
        if (!password || password.length < 6) {
            Alert.alert(t('Weak Password', 'कमज़ोर पासवर्ड'), t('Password must be at least 6 characters.', 'पासवर्ड कम से कम 6 अक्षर का होना चाहिए।'));
            return;
        }
        if (isSignUp && !name.trim()) {
            Alert.alert(t('Enter Name', 'नाम दर्ज करें'), t('Please enter your full name.', 'कृपया अपना पूरा नाम दर्ज करें।'));
            return;
        }
        setLoading(true);

        const email = `${phone}@kisandirect.app`; // use phone as email key
        try {
          if (isSignUp) {
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            await setDoc(doc(db, 'users', cred.user.uid), {
              name, phone, role: selectedRole, createdAt: new Date(),
            });
          } else {
            await signInWithEmailAndPassword(auth, email, password);
          }
          onLogin(selectedRole, { name, phone });
        } catch (err) {
          Alert.alert('Error', err.message);
        } finally { setLoading(false); }
    };

    // ──────────────────────────────────────────
    //  STEP 1 — ROLE SELECTION
    // ──────────────────────────────────────────
    if (step === 'role') {
        return (
            <ScrollView style={styles.screen} contentContainerStyle={styles.scrollPad} keyboardShouldPersistTaps="handled">
                <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

                <View style={styles.logoWrap}>
                    <Text style={styles.logo}>KisanDirect</Text>
                    <Text style={styles.tagline}>{t('Farm to Fork, Directly.', 'खेत से आपकी थाली तक, सीधे।')}</Text>
                </View>

                <Text style={styles.stepHeading}>{t('Who are you?', 'आप कौन हैं?')}</Text>
                <Text style={styles.stepSub}>{t('Select your role to get a personalised experience.', 'अपनी भूमिका चुनें।')}</Text>

                {Object.entries(ROLE_CONFIG).map(([key, cfg]) => (
                    <RoleCard key={key} roleKey={key} config={cfg} selected={selectedRole} onSelect={setSelectedRole} language={language} />
                ))}

                {selectedRole && <PrivilegePreview roleKey={selectedRole} language={language} />}

                <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: roleColor, opacity: selectedRole ? 1 : 0.4 }]}
                    onPress={handleContinue}
                    activeOpacity={0.85}
                >
                    <Text style={styles.primaryBtnText}>{t('Continue', 'आगे बढ़ें')} →</Text>
                </TouchableOpacity>
            </ScrollView>
        );
    }

    // ──────────────────────────────────────────
    //  STEP 2 — CREDENTIALS
    // ──────────────────────────────────────────
    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.scrollPad} keyboardShouldPersistTaps="handled">
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            <TouchableOpacity style={styles.backRow} onPress={() => setStep('role')}>
                <Text style={[styles.backArrow, { color: roleColor }]}>← </Text>
                <Text style={[styles.backText, { color: roleColor }]}>{t('Change Role', 'भूमिका बदलें')}</Text>
            </TouchableOpacity>

            <View style={[styles.roleHeaderPill, { backgroundColor: config.bgColor, borderColor: roleColor + '55' }]}>
                <Text style={styles.roleHeaderEmoji}>{config.emoji}</Text>
                <Text style={[styles.roleHeaderLabel, { color: roleColor }]}>
                    {language === 'hi' ? config.labelHi : config.label}
                </Text>
            </View>

            <Text style={styles.stepHeading}>
                {isSignUp ? t('Create Account', 'खाता बनाएं') : t('Welcome Back!', 'वापसी पर स्वागत!')}
            </Text>
            <Text style={styles.stepSub}>
                {isSignUp
                    ? t('Sign up as a ' + config.label, config.labelHi + ' के रूप में साइन अप करें')
                    : t('Sign in to your ' + config.label + ' account', config.labelHi + ' खाते में साइन इन करें')}
            </Text>

            <View style={styles.form}>
                {isSignUp && (
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>{t('Full Name', 'पूरा नाम')}</Text>
                        <TextInput
                            style={[styles.input, { borderColor: name ? roleColor : COLORS.border }]}
                            placeholder={t('e.g. Ramesh Kumar', 'उदा. रमेश कुमार')}
                            placeholderTextColor="#bbb"
                            value={name}
                            onChangeText={setName}
                            autoCapitalize="words"
                        />
                    </View>
                )}

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>{t('Mobile Number', 'मोबाइल नंबर')}</Text>
                    <View style={styles.inputRow}>
                        <View style={[styles.countryCode, { borderColor: COLORS.border }]}>
                            <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                        </View>
                        <TextInput
                            style={[styles.input, styles.inputFlex, { borderColor: phone.length === 10 ? roleColor : COLORS.border }]}
                            placeholder="9876543210"
                            placeholderTextColor="#bbb"
                            keyboardType="phone-pad"
                            maxLength={10}
                            value={phone}
                            onChangeText={setPhone}
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>{t('Password', 'पासवर्ड')}</Text>
                    <View style={styles.passwordRow}>
                        <TextInput
                            style={[styles.input, styles.inputFlex, { borderColor: password.length >= 6 ? roleColor : COLORS.border }]}
                            placeholder={t('Minimum 6 characters', 'न्यूनतम 6 अक्षर')}
                            placeholderTextColor="#bbb"
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={setPassword}
                        />
                        <TouchableOpacity style={[styles.eyeBtn, { borderColor: COLORS.border }]} onPress={() => setShowPassword(v => !v)}>
                            <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
                        </TouchableOpacity>
                    </View>
                    {!isSignUp && (
                        <TouchableOpacity style={styles.forgotWrap}>
                            <Text style={[styles.forgotText, { color: roleColor }]}>{t('Forgot password?', 'पासवर्ड भूल गए?')}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: roleColor }]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
            >
                {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.primaryBtnText}>{isSignUp ? t('Create Account', 'खाता बनाएं') : t('Sign In', 'साइन इन')}</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.switchRow} onPress={() => setIsSignUp(v => !v)}>
                <Text style={styles.switchText}>
                    {isSignUp ? t("Already have an account? ", 'पहले से खाता है? ') : t("Don't have an account? ", 'खाता नहीं है? ')}
                </Text>
                <Text style={[styles.switchLink, { color: roleColor }]}>
                    {isSignUp ? t('Sign In', 'साइन इन') : t('Sign Up', 'साइन अप')}
                </Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>{t('or', 'या')}</Text>
                <View style={styles.divider} />
            </View>

            <TouchableOpacity style={[styles.otpBtn, { borderColor: roleColor }]}>
                <Text style={[styles.otpBtnText, { color: roleColor }]}>
                    📱 {t('Login with OTP', 'OTP से लॉगिन करें')}
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

// ─────────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.background },
    scrollPad: { padding: 24, paddingTop: 70, paddingBottom: 60 },

    logoWrap: { alignItems: 'center', marginBottom: 36 },
    logo: { fontSize: 38, fontWeight: '900', color: COLORS.primary, letterSpacing: -1 },
    tagline: { fontSize: 14, color: COLORS.textLight, marginTop: 6 },

    stepHeading: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
    stepSub: { fontSize: 14, color: COLORS.textLight, marginBottom: 24 },

    roleCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: COLORS.card, borderRadius: 18,
        borderWidth: 1.5, padding: 16, marginBottom: 14,
    },
    roleIconCircle: {
        width: 52, height: 52, borderRadius: 26,
        justifyContent: 'center', alignItems: 'center', marginRight: 14,
    },
    roleEmoji: { fontSize: 26 },
    roleCardText: { flex: 1 },
    roleLabel: { fontSize: 17, fontWeight: '800', marginBottom: 3 },
    roleDesc: { fontSize: 12, color: COLORS.textLight, lineHeight: 17 },
    radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
    radioInner: { width: 11, height: 11, borderRadius: 5.5 },

    privilegeBox: { borderRadius: 16, borderWidth: 1.5, padding: 16, marginBottom: 20, marginTop: 4 },
    privilegeTitle: { fontSize: 14, fontWeight: '800', marginBottom: 12 },
    privilegeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 9 },
    privilegeIcon: { fontSize: 16, marginRight: 10, width: 22 },
    privilegeText: { fontSize: 13, fontWeight: '600' },

    primaryBtn: { padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 10, marginBottom: 6 },
    primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },

    backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    backArrow: { fontSize: 20, fontWeight: '800' },
    backText: { fontSize: 15, fontWeight: '700' },

    roleHeaderPill: {
        flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
        borderWidth: 1.5, borderRadius: 30, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 20,
    },
    roleHeaderEmoji: { fontSize: 20, marginRight: 8 },
    roleHeaderLabel: { fontSize: 15, fontWeight: '800' },

    form: { marginBottom: 8 },
    inputGroup: { marginBottom: 18 },
    inputLabel: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
    input: {
        backgroundColor: '#fff', borderWidth: 1.5, borderRadius: 12,
        paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: COLORS.text,
    },
    inputFlex: { flex: 1 },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    countryCode: {
        backgroundColor: '#fff', borderWidth: 1.5, borderRadius: 12,
        paddingHorizontal: 12, paddingVertical: 14, justifyContent: 'center',
    },
    countryCodeText: { fontSize: 14, fontWeight: '700', color: COLORS.text },
    passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    eyeBtn: {
        backgroundColor: '#fff', borderWidth: 1.5, borderRadius: 12,
        padding: 14, justifyContent: 'center', alignItems: 'center',
    },
    eyeText: { fontSize: 18 },
    forgotWrap: { alignItems: 'flex-end', marginTop: 8 },
    forgotText: { fontSize: 13, fontWeight: '700' },

    switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 12, marginBottom: 20 },
    switchText: { fontSize: 14, color: COLORS.textLight },
    switchLink: { fontSize: 14, fontWeight: '800' },

    dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    divider: { flex: 1, height: 1, backgroundColor: COLORS.border },
    dividerText: { marginHorizontal: 12, fontSize: 13, color: COLORS.textLight },
    otpBtn: { borderWidth: 2, borderRadius: 16, padding: 16, alignItems: 'center' },
    otpBtnText: { fontSize: 16, fontWeight: '800' },
});
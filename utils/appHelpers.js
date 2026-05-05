// ─────────────────────────────────────────────────────────────────────────────
//  utils/appHelpers.js — KisanDirect
//  Reusable utility functions used across the app
// ─────────────────────────────────────────────────────────────────────────────
import { Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';

// ─── VOICE INPUT ──────────────────────────────────────────────────────────────
// Triggers browser Web Speech API on web, or falls back to a mock on native.
// Usage: handleVoiceInput(setSearchQuery, setIsListening, 'mock fallback text', language)
export const handleVoiceInput = (setTargetText, setListeningState, mockText = 'Tomato', language = 'en') => {
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

// ─── CAMERA / PHOTO PICKER ────────────────────────────────────────────────────
// Requests camera permission, launches camera, and returns the image URI via callback.
export const takePhoto = async (setCropImage, t) => {
  const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
  if (!permissionResult.granted) {
    Alert.alert(
      t ? t('Permission Denied', 'अनुमति नहीं मिली') : 'Permission Denied',
      t ? t('Enable camera in settings.', 'सेटिंग में कैमरा सक्षम करें।') : 'Enable camera in settings.'
    );
    return;
  }
  const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 1 });
  if (!result.canceled) setCropImage(result.assets[0].uri);
};

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
// Clears all state and signs the user out of Firebase.
export const handleLogout = async ({
  stopListeners,
  setRole, setCurrentUser,
  setMyListings, setMarketListings, setMyOrders,
  hasAutoLoggedRef, navigateTo,
}) => {
  stopListeners();
  try { await signOut(auth); } catch (_) { }
  setRole(null);
  setCurrentUser(null);
  setMyListings([]);
  setMarketListings([]);
  setMyOrders([]);
  hasAutoLoggedRef.current = false;
  navigateTo('onboarding');
};

// ─── ROLE COLOR HELPER ────────────────────────────────────────────────────────
// Returns the accent color for the current user role.
export const getRoleColor = (role, COLORS) => {
  if (role === 'retailer') return COLORS.retailerMid;
  if (role === 'buyer') return COLORS.buyerMid;
  return COLORS.primaryMid;
};

// ─── PRICE FORMATTER ──────────────────────────────────────────────────────────
// Formats a number as Indian currency string.
export const formatINR = (amount) => {
  if (amount == null || isNaN(amount)) return '--';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
};

// ─── DATE FORMATTER ───────────────────────────────────────────────────────────
// Returns a human-readable date string from a Firestore timestamp or date value.
export const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

// ─────────────────────────────────────────────────────────────────────────────
//  services/firebase.js  — KisanDirect  (all fixes + debug logs)
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth, onAuthStateChanged } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
  enableNetwork,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBH0fG8PJ8nULnXDgVwqyu_S16zqZkNR14",
  authDomain: "directkisan-23c11.firebaseapp.com",
  projectId: "directkisan-23c11",
  storageBucket: "directkisan-23c11.firebasestorage.app",
  messagingSenderId: "627076767676",
  appId: "1:627076767676:web:1ad43171e0062ed8fa55b9",
  measurementId: "G-DC3M43ZSPN",
};

// ── Init (hot-reload safe) ────────────────────────────────────────────────────
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// ── Auth with AsyncStorage persistence ───────────────────────────────────────
let authInstance;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  authInstance = getAuth(app);
}
export const auth = authInstance;
export const db = getFirestore(app);

// ── Wait for auth to be ready ─────────────────────────────────────────────────
function waitForAuth() {
  return new Promise((resolve) => {
    if (auth.currentUser) {
      resolve(auth.currentUser);
      return;
    }
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        unsub();
        resolve(user);
      }
    });
  });
}

// ── Retry helper ─────────────────────────────────────────────────────────────
async function withRetry(operation, maxRetries = 3) {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        try { await enableNetwork(db); } catch (_) { }
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
      }
      return await operation();
    } catch (err) {
      lastError = err;
      const isOffline =
        err?.code === 'unavailable' ||
        err?.message?.includes('offline') ||
        err?.message?.includes('backend');
      if (!isOffline) throw err;
      console.warn(`[KD] Firestore attempt ${attempt + 1} failed, retrying...`);
    }
  }
  throw lastError;
}

// ═══════════════════════════════════════════════════════════════════════════
//  USERS
// ═══════════════════════════════════════════════════════════════════════════

export async function saveUserProfile(uid, data) {
  await withRetry(() =>
    setDoc(doc(db, 'users', uid), {
      ...data,
      updatedAt: serverTimestamp(),
    }, { merge: true })
  );
}

export async function getUserProfile(uid) {
  return withRetry(async () => {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? { uid, ...snap.data() } : null;
  });
}

export async function updateUserProfile(uid, fields) {
  await withRetry(() =>
    updateDoc(doc(db, 'users', uid), {
      ...fields,
      updatedAt: serverTimestamp(),
    })
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  LISTINGS
// ═══════════════════════════════════════════════════════════════════════════

export async function addListing(farmerUid, farmerName, listingData) {
  return withRetry(async () => {
    const ref = await addDoc(collection(db, 'listings'), {
      farmerUid,
      farmerName,
      ...listingData,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log('[KD] addListing SUCCESS — id:', ref.id, 'farmerUid:', farmerUid);
    return ref.id;
  });
}

export async function getFarmerListings(farmerUid) {
  return withRetry(async () => {
    const q = query(
      collection(db, 'listings'),
      where('farmerUid', '==', farmerUid)
    );
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(d => d.status === 'active')
      .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
  });
}

export async function getAllListings() {
  return withRetry(async () => {
    const snap = await getDocs(collection(db, 'listings'));
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(d => d.status === 'active')
      .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
  });
}

export async function updateListing(listingId, fields) {
  await withRetry(() =>
    updateDoc(doc(db, 'listings', listingId), {
      ...fields,
      updatedAt: serverTimestamp(),
    })
  );
}

export async function deleteListing(listingId) {
  await withRetry(() =>
    updateDoc(doc(db, 'listings', listingId), {
      status: 'inactive',
      updatedAt: serverTimestamp(),
    })
  );
}

// ── REAL-TIME: all active listings (buyer marketplace) ────────────────────────
export function listenAllListings(onUpdate) {
  let unsubSnapshot = () => { };

  waitForAuth().then(() => {
    try {
      unsubSnapshot = onSnapshot(
        collection(db, 'listings'),
        { includeMetadataChanges: false },
        snap => {
          const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          const listings = all
            .filter(d => d.status === 'active')
            .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
          console.log('[KD] listenAllListings — total docs:', all.length, '| active:', listings.length);
          onUpdate(listings);
        },
        err => {
          console.warn('[KD] listenAllListings error:', err.message);
          getAllListings()
            .then(onUpdate)
            .catch(e2 => console.warn('[KD] getAllListings fallback failed:', e2.message));
        }
      );
    } catch (e) {
      console.warn('[KD] listenAllListings setup error:', e);
    }
  });

  return () => unsubSnapshot();
}

// ── REAL-TIME: one farmer's listings ─────────────────────────────────────────
export function listenFarmerListings(farmerUid, onUpdate) {
  let unsubSnapshot = () => { };

  waitForAuth().then(() => {
    try {
      const q = query(
        collection(db, 'listings'),
        where('farmerUid', '==', farmerUid)
      );
      unsubSnapshot = onSnapshot(
        q,
        { includeMetadataChanges: false },
        snap => {
          const listings = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(d => d.status === 'active')
            .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
          console.log('[KD] listenFarmerListings — farmerUid:', farmerUid, '| listings:', listings.length);
          onUpdate(listings);
        },
        err => {
          console.warn('[KD] listenFarmerListings error:', err.message);
          getFarmerListings(farmerUid)
            .then(onUpdate)
            .catch(e2 => console.warn('[KD] getFarmerListings fallback failed:', e2.message));
        }
      );
    } catch (e) {
      console.warn('[KD] listenFarmerListings setup error:', e);
    }
  });

  return () => unsubSnapshot();
}

// ═══════════════════════════════════════════════════════════════════════════
//  ORDERS
// ═══════════════════════════════════════════════════════════════════════════

// ── FIX: full debug logging so we can see exactly what's being written ────────
export async function placeOrder(orderData) {
  console.log('[KD] placeOrder called — farmerUid:', orderData.farmerUid,
    '| type:', typeof orderData.farmerUid,
    '| buyerUid:', orderData.buyerUid,
    '| crop:', orderData.cropName,
    '| full:', JSON.stringify(orderData));

  // Safety guard — never write a non-string or short farmerUid
  if (!orderData.farmerUid || typeof orderData.farmerUid !== 'string' || orderData.farmerUid.trim().length < 10) {
    const err = new Error(`[KD] placeOrder BLOCKED — invalid farmerUid: "${orderData.farmerUid}"`);
    console.error(err.message);
    throw err;
  }

  return withRetry(async () => {
    const ref = await addDoc(collection(db, 'orders'), {
      ...orderData,
      farmerUid: orderData.farmerUid.trim(),
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log('[KD] placeOrder SUCCESS — docId:', ref.id, '| farmerUid:', orderData.farmerUid.trim());
    return ref.id;
  });
}

export async function getBuyerOrders(buyerUid) {
  return withRetry(async () => {
    const q = query(collection(db, 'orders'), where('buyerUid', '==', buyerUid));
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
  });
}

export async function getFarmerOrders(farmerUid) {
  console.log('[KD] getFarmerOrders — querying farmerUid:', farmerUid);
  return withRetry(async () => {
    const q = query(collection(db, 'orders'), where('farmerUid', '==', farmerUid));
    const snap = await getDocs(q);
    const orders = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    console.log('[KD] getFarmerOrders — found:', orders.length, 'orders for uid:', farmerUid);
    orders.forEach(o => console.log('[KD]   order:', o.id, '| status:', o.status, '| crop:', o.cropName, '| farmerUid stored:', o.farmerUid));
    return orders;
  });
}

export async function updateOrderStatus(orderId, status) {
  console.log('[KD] updateOrderStatus — orderId:', orderId, '| status:', status);
  await withRetry(() =>
    updateDoc(doc(db, 'orders', orderId), {
      status,
      updatedAt: serverTimestamp(),
    })
  );
}

// ── REAL-TIME: farmer's incoming orders ──────────────────────────────────────
export function listenFarmerOrders(farmerUid, onUpdate) {
  let unsubSnapshot = () => { };

  console.log('[KD] listenFarmerOrders — setting up listener for:', farmerUid);

  waitForAuth().then(() => {
    try {
      const q = query(
        collection(db, 'orders'),
        where('farmerUid', '==', farmerUid)
      );
      unsubSnapshot = onSnapshot(
        q,
        { includeMetadataChanges: false },
        snap => {
          const orders = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
          console.log('[KD] listenFarmerOrders update — farmerUid:', farmerUid, '| orders:', orders.length);
          orders.forEach(o => console.log('[KD]   order:', o.id, '| status:', o.status, '| storedFarmerUid:', o.farmerUid));
          onUpdate(orders);
        },
        err => {
          console.warn('[KD] listenFarmerOrders error:', err.message);
          getFarmerOrders(farmerUid)
            .then(onUpdate)
            .catch(e2 => console.warn('[KD] getFarmerOrders fallback failed:', e2.message));
        }
      );
    } catch (e) {
      console.warn('[KD] listenFarmerOrders setup error:', e);
    }
  });

  return () => unsubSnapshot();
}

// ═══════════════════════════════════════════════════════════════════════════
//  NEGOTIATIONS
// ═══════════════════════════════════════════════════════════════════════════

export async function sendNegotiationMessage(threadId, message) {
  await withRetry(() =>
    addDoc(
      collection(db, 'negotiations', threadId, 'messages'),
      { ...message, timestamp: serverTimestamp() }
    )
  );
}

export async function getNegotiationMessages(threadId) {
  return withRetry(async () => {
    const snap = await getDocs(
      collection(db, 'negotiations', threadId, 'messages')
    );
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.timestamp?.toMillis?.() || 0) - (b.timestamp?.toMillis?.() || 0));
  });
}

export function listenNegotiationMessages(threadId, onUpdate) {
  let unsubSnapshot = () => { };

  waitForAuth().then(() => {
    try {
      unsubSnapshot = onSnapshot(
        collection(db, 'negotiations', threadId, 'messages'),
        { includeMetadataChanges: false },
        snap => {
          const msgs = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (a.timestamp?.toMillis?.() || 0) - (b.timestamp?.toMillis?.() || 0));
          onUpdate(msgs);
        },
        err => console.warn('[KD] listenNegotiationMessages error:', err.message)
      );
    } catch (e) {
      console.warn('[KD] listenNegotiationMessages setup error:', e);
    }
  });

  return () => unsubSnapshot();
}

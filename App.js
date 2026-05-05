// ─────────────────────────────────────────────────────────────────────────────
//  App.js — KisanDirect
//
//  This is the ENTRY POINT only.
//  ✅ Do NOT add business logic, screens, or state here.
//  ✅ All routing & state lives in navigation/AppNavigator.js
//  ✅ Screens live in screens/
//  ✅ Shared UI components live in components/
//  ✅ Firebase logic lives in services/firebase.js
//  ✅ Constants live in constants/
//  ✅ Utility functions live in utils/appHelpers.js
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
  return <AppNavigator />;
}

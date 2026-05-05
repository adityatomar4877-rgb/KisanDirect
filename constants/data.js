// ─── COMMODITY & MOCK DATA ────────────────────────────────────────────────
export const COMMODITY_MAP = {
  Tomato: 'Tomato', Wheat: 'Wheat', Onion: 'Onion', Potato: 'Potato',
  Maize: 'Maize', Rice: 'Rice', Garlic: 'Garlic', Soybean: 'Soybean',
  Mustard: 'Mustard', Cotton: 'Cotton', Cauliflower: 'Cauliflower', Chilli: 'Chilli',
};

export const MOCK_PRICE_DATA = {
  Tomato: [28, 35, 52, 65, 42, 38, 45, 58],
  Wheat: [18, 19, 22, 21, 20, 22, 23, 22],
  Onion: [22, 38, 60, 48, 32, 28, 40, 52],
  Potato: [24, 22, 18, 26, 32, 30, 27, 25],
  Maize: [15, 16, 19, 21, 18, 17, 18, 21],
  Rice: [32, 33, 35, 36, 34, 35, 37, 38],
  Garlic: [80, 95, 120, 145, 100, 85, 90, 110],
  Soybean: [42, 44, 48, 50, 46, 45, 47, 49],
  Mustard: [55, 58, 62, 65, 60, 58, 61, 64],
  Cotton: [60, 62, 58, 65, 70, 68, 65, 72],
  Cauliflower: [20, 25, 35, 28, 22, 18, 24, 30],
  Chilli: [85, 95, 110, 130, 100, 90, 95, 105],
};

export const MONTHS = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];

// ─── NEARBY_FARMERS — demo/sample only, NOT orderable ────────────────────
export const NEARBY_FARMERS = [
  { id: 1, name: 'Ramesh Singh', village: 'Sanwer Village', dist: '2.5 km', rating: 4.8, reviews: 124, crops: ['🍅 Tomatoes', '🧅 Onions'], verified: true, avatar: 'RS', deliveries: 230, price: '₹38–42/kg', badge: 'Top Seller', uid: null },
  { id: 2, name: 'Suresh Patel', village: 'Dewas Road', dist: '3.1 km', rating: 4.6, reviews: 89, crops: ['🥔 Potatoes', '🌽 Maize'], verified: true, avatar: 'SP', deliveries: 156, price: '₹22–28/kg', badge: 'Fast Delivery', uid: null },
  { id: 3, name: 'Village Co-op', village: 'Palda', dist: '1.2 km', rating: 4.9, reviews: 312, crops: ['🌾 Wheat', '🫘 Soybean', '🌻 Mustard'], verified: true, avatar: 'VC', deliveries: 580, price: '₹20–48/kg', badge: 'Best Rated', uid: null },
  { id: 4, name: 'Kisan Kumar', village: 'Ujjain Road', dist: '4.2 km', rating: 4.4, reviews: 67, crops: ['🥦 Cauliflower', '🌶️ Chilli', '🧄 Garlic'], verified: false, avatar: 'KK', deliveries: 98, price: '₹25–110/kg', badge: null, uid: null },
  { id: 5, name: 'Meena Devi', village: 'Mhow', dist: '5.8 km', rating: 4.7, reviews: 201, crops: ['🍚 Rice', '🧅 Onions'], verified: true, avatar: 'MD', deliveries: 345, price: '₹28–36/kg', badge: 'Organic', uid: null },
];

// ─── GLOBAL TRANSLATIONS ──────────────────────────────────────────────────
export const GLOBAL_TRANSLATIONS = {
  'Dashboard': { en: 'Dashboard', hi: 'डैशबोर्ड', mr: 'डॅशबोर्ड', ta: 'டாஷ்போர்டு', te: 'డాష్బోర్డు', bn: 'ড্যাশবোর্ড' },
  'Tools': { en: 'Tools', hi: 'औज़ार', mr: 'साधने', ta: 'கருவிகள்', te: 'సాధనాలు', bn: 'সরঞ্জাম' },
  "Today's Earnings": { en: "Today's Earnings", hi: "आज की कमाई", mr: "आजची कमाई", ta: "இன்றைய வருமானம்", te: "నేటి ఆదాయం", bn: "আজকের আয়" },
  'Products': { en: 'Products', hi: 'उत्पाद', mr: 'उत्पादने', ta: 'தயாரிப்புகள்', te: 'ఉత్పత్తులు', bn: 'পণ্য' },
  'Orders': { en: 'Orders', hi: 'ऑर्डर', mr: 'ऑर्डर्स', ta: 'ஆர்டர்கள்', te: 'ఆర్డర్లు', bn: 'অর্డার' },
  'Rating': { en: 'Rating', hi: 'रेटिंग', mr: 'रेटिंग', ta: 'மதிப்பீடு', te: 'రేటింగ్', bn: 'রেটিং' },
  'Overview': { en: 'Overview', hi: 'अवलोकन', mr: 'आढावा', ta: 'கண்ணோட்டம்', te: 'అవలోకనం', bn: 'সংক্ষিপ্ত বিবরণ' },
  'Market': { en: 'Market', hi: 'बाज़ार', mr: 'बाजार', ta: 'சந்தை', te: 'మార్కెట్', bn: 'বাজার' },
  'Analytics': { en: 'Analytics', hi: 'विश्लेषण', mr: 'विश्लेषण', ta: 'பகுப்பாய்வு', te: 'విశ్లేషణ', bn: 'বিশ্লেষণ' },
  'Farmers': { en: 'Farmers', hi: 'किसान', mr: 'शेतकरी', ta: 'விவசாயிகள்', te: 'రైతులు', bn: 'কৃষক' },
  'Price': { en: 'Price', hi: 'मूल्य', mr: 'किंमत', ta: 'விலை', te: 'ధర', bn: 'মূল্য' },
  'Available': { en: 'Available', hi: 'उपलब्ध', mr: 'उपलब्ध', ta: 'கிடைக்கிறது', te: 'అందుబాటులో', bn: 'পাওয়া যায়' },
  'Distance': { en: 'Distance', hi: 'दूरी', mr: 'अंतर', ta: 'தூரம்', te: 'దూరం', bn: 'দূরত্ব' },
  'Contact Now': { en: 'Contact Now', hi: 'अभी संपर्क करें', mr: 'आता संपर्क करा', ta: 'இப்போது தொடர்பு கொள்ளவும்', te: 'ఇప్పుడు సంప్రదించండి', bn: 'এখনই যোগাযোগ করুন' },
  'Close': { en: 'Close', hi: 'बंद करें', mr: 'बंद करा', ta: 'மூடு', te: 'మూసివేయి', bn: 'বন্ধ করুন' },
  'Buy Now': { en: 'Buy Now', hi: 'खरीदें', mr: 'आता खरेदी करा', ta: 'இப்போது வாங்கவும்', te: 'ఇప్పుడే కొనండి', bn: 'এখনই కিনুন' },
};

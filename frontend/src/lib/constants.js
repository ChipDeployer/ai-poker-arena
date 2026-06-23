const DEFAULT_SERVER_IP = typeof window !== 'undefined' ? window.location.hostname : "192.168.0.100";

const RANK_MAP = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10',
  11: 'J', 12: 'Q', 13: 'K', 14: 'A'
};

const SUIT_MAP = {
  '♠': { symbol: '♠', name: 'Spades', isRed: false, colorClass: 'text-gray-900' },
  '♥': { symbol: '♥', name: 'Hearts', isRed: true, colorClass: 'text-red-600' },
  '♦': { symbol: '♦', name: 'Diamonds', isRed: true, colorClass: 'text-red-600' },
  '♣': { symbol: '♣', name: 'Clubs', isRed: false, colorClass: 'text-gray-900' }
};

const AVATAR_STYLING = [
  "from-fuchsia-900 via-purple-950 to-fuchsia-950 border-fuchsia-400 text-fuchsia-400 shadow-[0_0_15px_rgba(240,78,236,0.35)]",
  "from-cyan-900 via-blue-950 to-cyan-950 border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.35)]",
  "from-amber-900 via-orange-950 to-amber-950 border-amber-400 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.35)]",
  "from-pink-900 via-rose-950 to-pink-950 border-pink-400 text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.35)]",
  "from-indigo-900 via-violet-950 to-indigo-950 border-indigo-400 text-indigo-400 shadow-[0_0_15px_rgba(168,85,247,0.35)]"
];

// Luxe emerald & gold avatar styling for the Royal Emerald (classic) theme
const AVATAR_STYLING_CLASSIC = [
  "from-emerald-900 via-green-950 to-emerald-950 border-amber-400/70 text-amber-300 shadow-[0_0_14px_rgba(212,175,55,0.28)]",
  "from-teal-900 via-emerald-950 to-teal-950 border-amber-400/70 text-amber-200 shadow-[0_0_14px_rgba(212,175,55,0.28)]",
  "from-green-900 via-emerald-950 to-green-950 border-amber-300/70 text-amber-300 shadow-[0_0_14px_rgba(212,175,55,0.28)]",
  "from-emerald-800 via-green-950 to-emerald-950 border-amber-400/70 text-amber-200 shadow-[0_0_14px_rgba(212,175,55,0.28)]",
  "from-green-950 via-emerald-950 to-emerald-900 border-amber-400/70 text-amber-300 shadow-[0_0_14px_rgba(212,175,55,0.28)]"
];

// Theme configurations definition
const THEME_CONFIGS = {
  classic: {
    name: "Royal Emerald",
    bodyClass: "theme-classic",
    accentColor: "emerald",
    accentTextClass: "text-emerald-400",
    glowColorClass: "shadow-[0_0_20px_rgba(16,185,129,0.35)]",
    feltOverlay: "bg-emerald-950/20 mix-blend-multiply",
    feltStyle: {
      backgroundImage: "url('/classic_poker_felt.png')",
      borderColor: "#451a03",
    },
    titleGradient: "from-amber-200 via-amber-300 to-amber-500",
    headerBorder: "border-emerald-900/40",
    chipUrl: "/vice_city_poker_chip.png",
    dealerUrl: "/vice_city_dealer_btn.png"
  },
  cyber: {
    name: "Cyber Neon",
    bodyClass: "theme-cyber",
    accentColor: "cyan",
    accentTextClass: "text-cyan-400",
    glowColorClass: "shadow-[0_0_20px_rgba(6,182,212,0.45)]",
    feltOverlay: "bg-cyan-950/15 mix-blend-color-dodge",
    feltStyle: {
      backgroundImage: "url('/cyberpunk_table_felt.png')",
      borderColor: "#0f172a",
    },
    titleGradient: "from-cyan-400 via-fuchsia-500 to-indigo-500",
    headerBorder: "border-cyan-900/40",
    chipUrl: "/cyber_poker_chip.png",
    dealerUrl: "/cyber_dealer_btn.png"
  },
  vice: {
    name: "Vice City",
    bodyClass: "theme-vice",
    accentColor: "pink",
    accentTextClass: "text-pink-400",
    glowColorClass: "shadow-[0_0_20px_rgba(236,72,153,0.45)]",
    feltOverlay: "bg-purple-950/45 mix-blend-color-burn",
    feltStyle: {
      backgroundImage: "url('/classic_poker_felt.png')",
      borderColor: "#581c87",
    },
    titleGradient: "from-pink-400 via-fuchsia-500 to-purple-400",
    headerBorder: "border-pink-950/40",
    chipUrl: "/vice_city_poker_chip.png",
    dealerUrl: "/vice_city_dealer_btn.png"
  }
};

export { DEFAULT_SERVER_IP, RANK_MAP, SUIT_MAP, AVATAR_STYLING, AVATAR_STYLING_CLASSIC, THEME_CONFIGS };

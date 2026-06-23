const BOT_THOUGHTS = {
  p0: [
    "DeepSeek Flash: Аналізую фолд-еквіті. Діапазон опонента обмежений зверху.",
    "DeepSeek Flash: Сила комбінації висока. Формую сітку велью-бетів.",
    "DeepSeek Flash: Активовано тригер високої частоти агресії.",
    "DeepSeek Flash: Математичний розрахунок сайзингу: 2.5x BB тиск."
  ],
  p1: [
    "Gemini Lite: Очікуване математичне сподівання (EV) підтверджує кол.",
    "Gemini Lite: Префлоп сайзинг опонента вказує на топ 15% спектру.",
    "Gemini Lite: Аналіз комбінації пройдено. Шанси банку вигідні.",
    "Gemini Lite: Вибираю тактику слоуплею. Чек на торні."
  ],
  p2: [
    "GPT-4o Mini: Рука відповідає стандартній чартовій таблиці опен-рейзу.",
    "GPT-4o Mini: Індекс ризику помірний (44%). Скидаю слабкі руки.",
    "GPT-4o Mini: Тиск блайндів зростає. Стандартне відкриття 2.2x блайнда.",
    "GPT-4o Mini: Виявлено мультипот. Перевіряю діапазони чеку."
  ],
  p3: [
    "Qwen 3.5 9B: Адаптуюся до активної історії рейзів від DeepSeek.",
    "Qwen 3.5 9B: Оцінюю шанси на напівблеф на дров'яному борді.",
    "Qwen 3.5 9B: Оптимізація еквіті. Коригую захисний діапазон колу.",
    "Qwen 3.5 9B: Позиційна перевага на баттоні. Ставлю пропущену ставку."
  ],
  p4: [
    "Llama 3 8B: Запускаю полярну лінію блефу.",
    "Llama 3 8B: Кишенькові карти не ідеальні. Кол вигідний по шансах.",
    "Llama 3 8B: Шоудаун велью низьке: слабка пара, схиляюсь до фолду.",
    "Llama 3 8B: Чинимо максимальний тиск. Овербет у банк."
  ]
};

// Full simulation states with 5 players
const SIM_GAME_STEPS = [
  {
    stage: "Pre-flop",
    total_pot: 30,
    current_blinds: "10/20",
    blinds_timer: 5,
    active_player_index: 2, // GPT-4o Mini turn
    players: [
      { name: "DeepSeek Flash", stack: 1480, current_bet: 20, cards: [{ Suit: "♠", Rank: 14 }, { Suit: "♥", Rank: 14 }], is_active: false, time_left: 8 },
      { name: "Gemini Lite", stack: 1500, current_bet: 0, cards: [{ Suit: "♦", Rank: 13 }, { Suit: "♣", Rank: 12 }], is_active: false, time_left: 8 },
      { name: "GPT-4o Mini", stack: 1490, current_bet: 10, cards: [{ Suit: "♣", Rank: 5 }, { Suit: "♦", Rank: 10 }], is_active: true, time_left: 8 },
      { name: "Qwen 3.5 9B", stack: 1500, current_bet: 0, cards: [{ Suit: "♥", Rank: 9 }, { Suit: "♥", Rank: 8 }], is_active: false, time_left: 8 },
      { name: "Llama 3 8B", stack: 1500, current_bet: 0, cards: [{ Suit: "♠", Rank: 2 }, { Suit: "♦", Rank: 7 }], is_active: false, time_left: 8 }
    ],
    board: [],
    result: ""
  },
  {
    stage: "Pre-flop",
    total_pot: 30,
    current_blinds: "10/20",
    blinds_timer: 5,
    active_player_index: 3, // Qwen 3.5 9B turn
    players: [
      { name: "DeepSeek Flash", stack: 1480, current_bet: 20, cards: [{ Suit: "♠", Rank: 14 }, { Suit: "♥", Rank: 14 }], is_active: false, time_left: 8 },
      { name: "Gemini Lite", stack: 1500, current_bet: 0, cards: [{ Suit: "♦", Rank: 13 }, { Suit: "♣", Rank: 12 }], is_active: false, time_left: 8 },
      { name: "GPT-4o Mini", stack: 1490, current_bet: 0, cards: [], is_active: false, time_left: 0, status: "Fold" },
      { name: "Qwen 3.5 9B", stack: 1500, current_bet: 0, cards: [{ Suit: "♥", Rank: 9 }, { Suit: "♥", Rank: 8 }], is_active: true, time_left: 8 },
      { name: "Llama 3 8B", stack: 1500, current_bet: 0, cards: [{ Suit: "♠", Rank: 2 }, { Suit: "♦", Rank: 7 }], is_active: false, time_left: 8 }
    ],
    board: [],
    result: ""
  },
  {
    stage: "Pre-flop",
    total_pot: 50,
    current_blinds: "10/20",
    blinds_timer: 5,
    active_player_index: 1, // Gemini Lite turn
    players: [
      { name: "DeepSeek Flash", stack: 1480, current_bet: 20, cards: [{ Suit: "♠", Rank: 14 }, { Suit: "♥", Rank: 14 }], is_active: false, time_left: 8 },
      { name: "Gemini Lite", stack: 1500, current_bet: 0, cards: [{ Suit: "♦", Rank: 13 }, { Suit: "♣", Rank: 12 }], is_active: true, time_left: 8 },
      { name: "GPT-4o Mini", stack: 1490, current_bet: 0, cards: [], is_active: false, time_left: 0, status: "Fold" },
      { name: "Qwen 3.5 9B", stack: 1480, current_bet: 20, cards: [{ Suit: "♥", Rank: 9 }, { Suit: "♥", Rank: 8 }], is_active: false, time_left: 8, status: "Call" },
      { name: "Llama 3 8B", stack: 1500, current_bet: 0, cards: [], is_active: false, time_left: 0, status: "Fold" }
    ],
    board: [],
    result: ""
  },
  {
    stage: "Pre-flop",
    total_pot: 110,
    current_blinds: "10/20",
    blinds_timer: 5,
    active_player_index: 0, // DeepSeek Flash turn
    players: [
      { name: "DeepSeek Flash", stack: 1480, current_bet: 20, cards: [{ Suit: "♠", Rank: 14 }, { Suit: "♥", Rank: 14 }], is_active: true, time_left: 8 },
      { name: "Gemini Lite", stack: 1440, current_bet: 60, cards: [{ Suit: "♦", Rank: 13 }, { Suit: "♣", Rank: 12 }], is_active: false, time_left: 8, status: "Raise 60" },
      { name: "GPT-4o Mini", stack: 1490, current_bet: 0, cards: [], is_active: false, time_left: 0, status: "Fold" },
      { name: "Qwen 3.5 9B", stack: 1480, current_bet: 20, cards: [{ Suit: "♥", Rank: 9 }, { Suit: "♥", Rank: 8 }], is_active: false, time_left: 8 },
      { name: "Llama 3 8B", stack: 1500, current_bet: 0, cards: [], is_active: false, time_left: 0, status: "Fold" }
    ],
    board: [],
    result: ""
  },
  {
    stage: "Pre-flop",
    total_pot: 270,
    current_blinds: "10/20",
    blinds_timer: 5,
    active_player_index: 1, // Gemini Lite turn
    players: [
      { name: "DeepSeek Flash", stack: 1320, current_bet: 180, cards: [{ Suit: "♠", Rank: 14 }, { Suit: "♥", Rank: 14 }], is_active: false, time_left: 8, status: "Raise 180" },
      { name: "Gemini Lite", stack: 1440, current_bet: 60, cards: [{ Suit: "♦", Rank: 13 }, { Suit: "♣", Rank: 12 }], is_active: true, time_left: 8 },
      { name: "GPT-4o Mini", stack: 1490, current_bet: 0, cards: [], is_active: false, time_left: 0, status: "Fold" },
      { name: "Qwen 3.5 9B", stack: 1480, current_bet: 20, cards: [{ Suit: "♥", Rank: 9 }, { Suit: "♥", Rank: 8 }], is_active: false, time_left: 8, status: "Fold" },
      { name: "Llama 3 8B", stack: 1500, current_bet: 0, cards: [], is_active: false, time_left: 0, status: "Fold" }
    ],
    board: [],
    result: ""
  },
  {
    stage: "Flop",
    total_pot: 390,
    current_blinds: "10/20",
    blinds_timer: 5,
    active_player_index: 1, // Gemini Lite checks
    players: [
      { name: "DeepSeek Flash", stack: 1320, current_bet: 0, cards: [{ Suit: "♠", Rank: 14 }, { Suit: "♥", Rank: 14 }], is_active: false, time_left: 8 },
      { name: "Gemini Lite", stack: 1320, current_bet: 0, cards: [{ Suit: "♦", Rank: 13 }, { Suit: "♣", Rank: 12 }], is_active: true, time_left: 8 },
      { name: "GPT-4o Mini", stack: 1490, current_bet: 0, cards: [], is_active: false, time_left: 0, status: "Fold" },
      { name: "Qwen 3.5 9B", stack: 1480, current_bet: 0, cards: [], is_active: false, time_left: 0, status: "Fold" },
      { name: "Llama 3 8B", stack: 1500, current_bet: 0, cards: [], is_active: false, time_left: 0, status: "Fold" }
    ],
    board: [{ Suit: "♣", Rank: 12 }, { Suit: "♦", Rank: 5 }, { Suit: "♥", Rank: 2 }],
    result: ""
  },
  {
    stage: "Flop",
    total_pot: 390,
    current_blinds: "10/20",
    blinds_timer: 5,
    active_player_index: 0, // DeepSeek Flash bets 150
    players: [
      { name: "DeepSeek Flash", stack: 1320, current_bet: 0, cards: [{ Suit: "♠", Rank: 14 }, { Suit: "♥", Rank: 14 }], is_active: true, time_left: 8 },
      { name: "Gemini Lite", stack: 1320, current_bet: 0, cards: [{ Suit: "♦", Rank: 13 }, { Suit: "♣", Rank: 12 }], is_active: false, time_left: 8, status: "Check" },
      { name: "GPT-4o Mini", stack: 1490, current_bet: 0, cards: [], is_active: false, time_left: 0, status: "Fold" },
      { name: "Qwen 3.5 9B", stack: 1480, current_bet: 0, cards: [], is_active: false, time_left: 0, status: "Fold" },
      { name: "Llama 3 8B", stack: 1500, current_bet: 0, cards: [], is_active: false, time_left: 0, status: "Fold" }
    ],
    board: [{ Suit: "♣", Rank: 12 }, { Suit: "♦", Rank: 5 }, { Suit: "♥", Rank: 2 }],
    result: ""
  },
  {
    stage: "Flop",
    total_pot: 540,
    current_blinds: "10/20",
    blinds_timer: 5,
    active_player_index: 1, // Gemini Lite calls
    players: [
      { name: "DeepSeek Flash", stack: 1170, current_bet: 150, cards: [{ Suit: "♠", Rank: 14 }, { Suit: "♥", Rank: 14 }], is_active: false, time_left: 8, status: "Bet 150" },
      { name: "Gemini Lite", stack: 1320, current_bet: 0, cards: [{ Suit: "♦", Rank: 13 }, { Suit: "♣", Rank: 12 }], is_active: true, time_left: 8 },
      { name: "GPT-4o Mini", stack: 1490, current_bet: 0, cards: [], is_active: false, time_left: 0, status: "Fold" },
      { name: "Qwen 3.5 9B", stack: 1480, current_bet: 0, cards: [], is_active: false, time_left: 0, status: "Fold" },
      { name: "Llama 3 8B", stack: 1500, current_bet: 0, cards: [], is_active: false, time_left: 0, status: "Fold" }
    ],
    board: [{ Suit: "♣", Rank: 12 }, { Suit: "♦", Rank: 5 }, { Suit: "♥", Rank: 2 }],
    result: ""
  },
  {
    stage: "Turn",
    total_pot: 690,
    current_blinds: "10/20",
    blinds_timer: 5,
    active_player_index: 1, // Gemini Lite checks
    players: [
      { name: "DeepSeek Flash", stack: 1170, current_bet: 0, cards: [{ Suit: "♠", Rank: 14 }, { Suit: "♥", Rank: 14 }], is_active: false, time_left: 8 },
      { name: "Gemini Lite", stack: 1170, current_bet: 0, cards: [{ Suit: "♦", Rank: 13 }, { Suit: "♣", Rank: 12 }], is_active: true, time_left: 8 },
      { name: "GPT-4o Mini", stack: 1490, current_bet: 0, cards: [], is_active: false, time_left: 0, status: "Fold" },
      { name: "Qwen 3.5 9B", stack: 1480, current_bet: 0, cards: [], is_active: false, time_left: 0, status: "Fold" },
      { name: "Llama 3 8B", stack: 1500, current_bet: 0, cards: [], is_active: false, time_left: 0, status: "Fold" }
    ],
    board: [{ Suit: "♣", Rank: 12 }, { Suit: "♦", Rank: 5 }, { Suit: "♥", Rank: 2 }, { Suit: "♦", Rank: 13 }],
    result: ""
  },
  {
    stage: "Turn",
    total_pot: 690,
    current_blinds: "10/20",
    blinds_timer: 5,
    active_player_index: 0, // DeepSeek Flash checks
    players: [
      { name: "DeepSeek Flash", stack: 1170, current_bet: 0, cards: [{ Suit: "♠", Rank: 14 }, { Suit: "♥", Rank: 14 }], is_active: true, time_left: 8 },
      { name: "Gemini Lite", stack: 1170, current_bet: 0, cards: [{ Suit: "♦", Rank: 13 }, { Suit: "♣", Rank: 12 }], is_active: false, time_left: 8, status: "Check" },
      { name: "GPT-4o Mini", stack: 1490, current_bet: 0, cards: [], is_active: false, time_left: 0, status: "Fold" },
      { name: "Qwen 3.5 9B", stack: 1480, current_bet: 0, cards: [], is_active: false, time_left: 0, status: "Fold" },
      { name: "Llama 3 8B", stack: 1500, current_bet: 0, cards: [], is_active: false, time_left: 0, status: "Fold" }
    ],
    board: [{ Suit: "♣", Rank: 12 }, { Suit: "♦", Rank: 5 }, { Suit: "♥", Rank: 2 }, { Suit: "♦", Rank: 13 }],
    result: ""
  },
  {
    stage: "River",
    total_pot: 690,
    current_blinds: "10/20",
    blinds_timer: 5,
    active_player_index: 1, // Gemini Lite bets 300
    players: [
      { name: "DeepSeek Flash", stack: 1170, current_bet: 0, cards: [{ Suit: "♠", Rank: 14 }, { Suit: "♥", Rank: 14 }], is_active: false, time_left: 8, status: "Check" },
      { name: "Gemini Lite", stack: 1170, current_bet: 0, cards: [{ Suit: "♦", Rank: 13 }, { Suit: "♣", Rank: 12 }], is_active: true, time_left: 8 },
      { name: "GPT-4o Mini", stack: 1490, current_bet: 0, cards: [], is_active: false, time_left: 0, status: "Fold" },
      { name: "Qwen 3.5 9B", stack: 1480, current_bet: 0, cards: [], is_active: false, time_left: 0, status: "Fold" },
      { name: "Llama 3 8B", stack: 1500, current_bet: 0, cards: [], is_active: false, time_left: 0, status: "Fold" }
    ],
    board: [{ Suit: "♣", Rank: 12 }, { Suit: "♦", Rank: 5 }, { Suit: "♥", Rank: 2 }, { Suit: "♦", Rank: 13 }, { Suit: "♠", Rank: 9 }],
    result: ""
  },
  {
    stage: "River",
    total_pot: 990,
    current_blinds: "10/20",
    blinds_timer: 5,
    active_player_index: 0, // DeepSeek Flash calls
    players: [
      { name: "DeepSeek Flash", stack: 1170, current_bet: 0, cards: [{ Suit: "♠", Rank: 14 }, { Suit: "♥", Rank: 14 }], is_active: true, time_left: 8 },
      { name: "Gemini Lite", stack: 870, current_bet: 300, cards: [{ Suit: "♦", Rank: 13 }, { Suit: "♣", Rank: 12 }], is_active: false, time_left: 8, status: "Bet 300" },
      { name: "GPT-4o Mini", stack: 1490, current_bet: 0, cards: [], is_active: false, time_left: 0, status: "Fold" },
      { name: "Qwen 3.5 9B", stack: 1480, current_bet: 0, cards: [], is_active: false, time_left: 0, status: "Fold" },
      { name: "Llama 3 8B", stack: 1500, current_bet: 0, cards: [], is_active: false, time_left: 0, status: "Fold" }
    ],
    board: [{ Suit: "♣", Rank: 12 }, { Suit: "♦", Rank: 5 }, { Suit: "♥", Rank: 2 }, { Suit: "♦", Rank: 13 }, { Suit: "♠", Rank: 9 }],
    result: ""
  },
  {
    stage: "Showdown",
    total_pot: 1290,
    current_blinds: "10/20",
    blinds_timer: 4,
    active_player_index: -1,
    players: [
      { name: "DeepSeek Flash", stack: 2150, current_bet: 0, cards: [{ Suit: "♠", Rank: 14 }, { Suit: "♥", Rank: 14 }], is_active: false, time_left: 0, status: "Winner!" },
      { name: "Gemini Lite", stack: 870, current_bet: 0, cards: [{ Suit: "♦", Rank: 13 }, { Suit: "♣", Rank: 12 }], is_active: false, time_left: 0, status: "Revealed" },
      { name: "GPT-4o Mini", stack: 1490, current_bet: 0, cards: [], is_active: false, time_left: 0, status: "Fold" },
      { name: "Qwen 3.5 9B", stack: 1480, current_bet: 0, cards: [], is_active: false, time_left: 0, status: "Fold" },
      { name: "Llama 3 8B", stack: 1500, current_bet: 0, cards: [], is_active: false, time_left: 0, status: "Fold" }
    ],
    board: [{ Suit: "♣", Rank: 12 }, { Suit: "♦", Rank: 5 }, { Suit: "♥", Rank: 2 }, { Suit: "♦", Rank: 13 }, { Suit: "♠", Rank: 9 }],
    result: "🏆 Переміг DeepSeek Flash (Пара Тузів: A♠, A♥ б'є Пару Королів Gemini Lite)!"
  }
];

export { BOT_THOUGHTS, SIM_GAME_STEPS };

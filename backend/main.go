package main

import (
	"backend/evaluator"
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"os"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"sync/atomic"
	"time"

	"github.com/gorilla/websocket"
	_ "modernc.org/sqlite"
)

// ================================================================
//  WebSocket
// ================================================================

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

// ================================================================
//  Data Types
// ================================================================

// Card is an alias to evaluator.Card which natively uses int Rank (2-14)
// and has JSON tags for frontend compatibility.
type Card = evaluator.Card

type Player struct {
	Name       string `json:"name"`
	Model      string `json:"-"`
	Stack      int    `json:"stack"`
	CurrentBet int    `json:"current_bet"`
	Cards      []Card `json:"cards"`
	IsActive   bool   `json:"is_active"` // true = still in this hand (hasn't folded)
	IsBusted   bool   `json:"is_busted"` // true = eliminated from tournament (0 chips)
	TimeLeft   int    `json:"time_left"` // seconds remaining for current turn (max 8)
	TotalInvested int `json:"-"`         // total chips invested in the current hand (for side pots)
}

type GameState struct {
	Stage             string `json:"stage"`
	TotalPot          int    `json:"total_pot"`
	CurrentBlinds     string `json:"current_blinds"`
	BlindsTimer       int    `json:"blinds_timer"`    // hands until next blind increase (0–5)
	HandsPlayed       int    `json:"hands_played"`
	ActivePlayerIndex int    `json:"active_player_index"`
	Players           []Player `json:"players"`
	Board             []Card   `json:"board"`
	Result            string   `json:"result"` // Hand result
	LastThought       string   `json:"last_thought"`
	LastAction        string   `json:"last_action"`
	HandID            int64    `json:"-"`
}

// ================================================================
//  OpenRouter API Types
// ================================================================

type ORRequest struct {
	Model    string      `json:"model"`
	Messages []ORMessage `json:"messages"`
}

type ORMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ORResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

// ================================================================
//  Blind Schedule (increases exponentially every 5 hands)
// ================================================================

func getBlinds(level int) (int, int) {
	// Починаємо зі 100/200 і подвоюємо кожні 5 роздач (level росте на 1 кожні 5 роздач)
	// 100/200, 200/400, 400/800, 800/1600, 1600/3200, 3200/6400 і так до нескінченності
	sb := 100 * (1 << level)
	bb := sb * 2
	return sb, bb
}

// ================================================================
//  Database (SQLite)
// ================================================================

var db *sql.DB

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func initDB() {
	var err error
	dbPath := getEnv("DB_PATH", "poker.db")
	db, err = sql.Open("sqlite", dbPath)
	if err != nil {
		fmt.Println("⚠️ Не вдалося відкрити SQLite базу даних:", err)
		return
	}

	err = db.Ping()
	if err != nil {
		fmt.Println("⚠️ Помилка з'єднання з SQLite:", err)
		return
	}

	// Налаштування SQLite для запобігання блокуванням
	_, _ = db.Exec("PRAGMA journal_mode=WAL;")
	_, _ = db.Exec("PRAGMA busy_timeout=5000;")

	fmt.Println("✅ SQLite підключено успішно!")

	// Створення таблиць
	tables := []string{
		`CREATE TABLE IF NOT EXISTS tournaments (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			winner TEXT
		);`,
		`CREATE TABLE IF NOT EXISTS hands (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			tournament_id INTEGER,
			hand_number INTEGER,
			blinds TEXT,
			board TEXT,
			pot INTEGER,
			winner TEXT
		);`,
		`CREATE TABLE IF NOT EXISTS actions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			hand_id INTEGER,
			player_name TEXT,
			model_id TEXT,
			stage TEXT,
			hole_cards TEXT,
			action TEXT,
			amount INTEGER,
			thoughts TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);`,
		`CREATE TABLE IF NOT EXISTS model_stats (
			model_id TEXT PRIMARY KEY,
			games_played INTEGER DEFAULT 0,
			games_won INTEGER DEFAULT 0,
			hands_played INTEGER DEFAULT 0,
			hands_won INTEGER DEFAULT 0,
			total_chips_won INTEGER DEFAULT 0
		);`,
	}

	for _, query := range tables {
		_, err = db.Exec(query)
		if err != nil {
			fmt.Println("⚠️ Помилка створення таблиці:", err)
		}
	}
}

func getBotMemory(playerName string) string {
	if db == nil {
		return "No history available."
	}
	rows, err := db.Query(
		"SELECT thoughts, action FROM actions WHERE player_name=? ORDER BY id DESC LIMIT 3",
		playerName,
	)
	if err != nil {
		return "Could not retrieve history."
	}
	defer rows.Close()

	var memory []string
	for rows.Next() {
		var t, a string
		if err := rows.Scan(&t, &a); err == nil {
			memory = append(memory, fmt.Sprintf("Action: %s (Thought: %s)", a, t))
		}
	}
	if len(memory) == 0 {
		return "First hands of the tournament — no history yet."
	}
	return strings.Join(memory, " | ")
}





// ================================================================
//  Card Utilities
// ================================================================

func NewDeck() []Card {
	suits := []string{"♠", "♥", "♦", "♣"}
	var deck []Card
	for _, suit := range suits {
		for rank := 2; rank <= 14; rank++ {
			deck = append(deck, Card{Suit: suit, Rank: rank})
		}
	}
	return deck
}

func shuffleDeck(deck []Card) {
	rand.Shuffle(len(deck), func(i, j int) {
		deck[i], deck[j] = deck[j], deck[i]
	})
}

// rankName converts numeric rank (2–14) to display string (2–10, J, Q, K, A).
func rankName(rank int) string {
	switch rank {
	case 14:
		return "A"
	case 13:
		return "K"
	case 12:
		return "Q"
	case 11:
		return "J"
	default:
		return strconv.Itoa(rank)
	}
}

// formatCards produces a readable string like "A♠ K♥ 10♦" for prompts and DB logs.
func formatCards(cards []Card) string {
	if len(cards) == 0 {
		return "—"
	}
	parts := make([]string, len(cards))
	for i, c := range cards {
		parts[i] = rankName(c.Rank) + c.Suit
	}
	return strings.Join(parts, " ")
}

// ================================================================
//  OpenRouter API
// ================================================================

func askOpenRouter(modelID, prompt string) string {
	apiKey := os.Getenv("OPENROUTER_API_KEY")
	if apiKey == "" {
		// Simulation mode when no API key is set — more aggressive distribution
		actions := []string{"CHECK", "CALL", "FOLD", "RAISE 100", "RAISE 200", "RAISE 400", "CALL"}
		return fmt.Sprintf(
			"[THOUGHTS] Simulated play — no API key configured. [/THOUGHTS] [ACTION] %s [/ACTION]",
			actions[rand.Intn(len(actions))],
		)
	}

	reqBody, _ := json.Marshal(ORRequest{
		Model: modelID,
		Messages: []ORMessage{
			{
				Role: "system",
				Content: `You are a professional Texas Hold'em poker player in a tournament. Analyze mathematically and decide optimally.
You MUST respond in this EXACT format — no other text outside these tags:
[THOUGHTS] Your brief analysis in 2-4 sentences [/THOUGHTS]
[ACTION] Exactly one of: FOLD, CHECK, CALL, or RAISE <number> [/ACTION]`,
			},
			{Role: "user", Content: prompt},
		},
	})

	req, _ := http.NewRequest("POST", "https://openrouter.ai/api/v1/chat/completions", bytes.NewBuffer(reqBody))
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("HTTP-Referer", "http://poker-arena.local")
	req.Header.Set("X-Title", "AI Poker Arena")

	client := &http.Client{Timeout: 25 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "[THOUGHTS] Network error occurred. [/THOUGHTS] [ACTION] FOLD [/ACTION]"
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var orResp ORResponse
	if err := json.Unmarshal(body, &orResp); err != nil || len(orResp.Choices) == 0 {
		fmt.Printf("⚠️ OpenRouter parse error for %s: %s\n", modelID, string(body))
		return "[THOUGHTS] Failed to parse API response. [/THOUGHTS] [ACTION] FOLD [/ACTION]"
	}

	return orResp.Choices[0].Message.Content
}

// parseResponse extracts thoughts and action from the AI model's raw response.
// Includes fallback parsing for models that don't use proper tags (e.g. Llama 3).
func parseResponse(raw string) (thoughts, action string) {
	thoughts = "Thinking silently..."
	action = "FOLD"

	regThoughts := regexp.MustCompile(`(?i)\[THOUGHTS\]([\s\S]*?)\[/THOUGHTS\]`)
	regAction := regexp.MustCompile(`(?i)\[ACTION\]([\s\S]*?)\[/ACTION\]`)

	if m := regThoughts.FindStringSubmatch(raw); len(m) > 1 {
		thoughts = strings.TrimSpace(m[1])
	} else {
		// Fallback: if no [THOUGHTS] tag, use first 1-2 sentences of raw response as thoughts
		// (Llama 3 often omits tags but gives reasoned responses)
		sentences := regexp.MustCompile(`[.!?]\s+`).Split(raw, -1)
		if len(sentences) > 0 && len(strings.TrimSpace(sentences[0])) > 20 {
			thoughts = strings.TrimSpace(sentences[0])
			if len(sentences) > 1 && len(strings.TrimSpace(sentences[1])) > 10 {
				thoughts += ". " + strings.TrimSpace(sentences[1])
			}
			if len(thoughts) > 300 {
				thoughts = thoughts[:297] + "..."
			}
		}
	}

	if m := regAction.FindStringSubmatch(raw); len(m) > 1 {
		action = strings.ToUpper(strings.TrimSpace(m[1]))
	} else {
		// Fallback: detect action keywords from raw text
		upper := strings.ToUpper(raw)
		reRaise := regexp.MustCompile(`(?i)RAISE\s+(\d+)`)
		if m := reRaise.FindStringSubmatch(raw); len(m) > 1 {
			action = "RAISE " + m[1]
		} else if strings.Contains(upper, "CALL") {
			action = "CALL"
		} else if strings.Contains(upper, "CHECK") {
			action = "CHECK"
		} else if strings.Contains(upper, "RAISE") {
			action = "RAISE"
		}
		// Default remains FOLD
	}

	return thoughts, action
}

// ================================================================
//  Prompt Builder
// ================================================================

func buildPrompt(state *GameState, playerIdx int, minCall int, dealerIdx int, ante int) string {
	p := state.Players[playerIdx]

	potOddsStr := "0.0%"
	if minCall > 0 && state.TotalPot+minCall > 0 {
		potOdds := float64(minCall) / float64(state.TotalPot+minCall) * 100
		potOddsStr = fmt.Sprintf("%.1f%%", potOdds)
	} else if minCall == 0 {
		potOddsStr = "N/A (Checking is free)"
	}

	memory := getBotMemory(p.Name)

	// Determine position. SB/BB are derived the same busted-aware way as the
	// main game loop, including the heads-up case where the button is the SB.
	position := "Unknown"
	var sbIdx, bbIdx int
	if countNonBustedPlayers(state.Players) == 2 {
		sbIdx = dealerIdx
		bbIdx = nextNonBustedPlayer(state.Players, dealerIdx)
	} else {
		sbIdx = nextNonBustedPlayer(state.Players, dealerIdx)
		bbIdx = nextNonBustedPlayer(state.Players, sbIdx)
	}
	if playerIdx == dealerIdx {
		position = "Button (Dealer) — best position, steal blinds aggressively"
	} else if playerIdx == sbIdx {
		position = "Small Blind — worst position post-flop"
	} else if playerIdx == bbIdx {
		position = "Big Blind — defend your blind, but don't get trapped"
	} else {
		// Find position relative to button
		n := len(state.Players)
		posBefore := (playerIdx - dealerIdx + n) % n
		switch posBefore {
		case 3:
			position = "UTG (Under the Gun) — play tight, only premium hands"
		case 4:
			position = "Middle Position — widen range slightly"
		default:
			position = "Late Position / Cutoff — good stealing opportunity"
		}
	}

	// Opponents summary
	var opLines []string
	for i, op := range state.Players {
		if i == playerIdx {
			continue
		}
		status := "active"
		if op.IsBusted {
			status = "ELIMINATED"
		} else if !op.IsActive {
			status = "folded"
		} else if op.Stack == 0 {
			status = "all-in"
		}
		opLines = append(opLines, fmt.Sprintf("  • %s: %d chips, bet %d (%s)",
			op.Name, op.Stack, op.CurrentBet, status))
	}

	// Evaluate and describe current hand strength
	handStrengthDesc := "Unknown"
	var drawsDesc []string

	if len(state.Board) == 0 {
		// Pre-flop
		if len(p.Cards) == 2 {
			handStrengthDesc = describeHandPreflop(p.Cards[0], p.Cards[1])
		} else {
			handStrengthDesc = "Invalid cards"
		}
	} else {
		// Post-flop (Flop, Turn, River)
		rating := EvaluateBestHandRating(p.Cards, state.Board)
		handStrengthDesc = describeHandRating(rating)
		drawsDesc = getDrawDescriptions(p.Cards, state.Board)
	}

	drawsInfo := ""
	if len(drawsDesc) > 0 {
		drawsInfo = "\nDRAWS DETECTED:\n"
		for _, d := range drawsDesc {
			drawsInfo += fmt.Sprintf("- %s\n", d)
		}
	}

	anteInfo := ""
	if ante > 0 {
		anteInfo = fmt.Sprintf("\nANTE: %d chips (contributed by each player)", ante)
	}

	return fmt.Sprintf(`TEXAS HOLD'EM TOURNAMENT SYSTEM INSTRUCTIONS

RULES:
1. If call amount = 0 → you MUST NOT FOLD. You can CHECK for free or BET/RAISE.
   Folding when it costs 0 to stay in the hand is a major mistake. If you don't want to bet, choose CHECK.
2. When facing a bet: evaluate pot odds before folding.
   Call if your hand strength + implied odds justify it.
3. RAISE <number> = your TOTAL bet this round (not the amount to add).
   Do not raise to an amount larger than your stack.
4. In late position, steal blinds with raises of 2.5-3x BB.
5. As blinds increase, widen your range — stolen blinds are critical.
6. Stack < call amount → CALL = ALL-IN.
7. You MUST write your [THOUGHTS] analysis in Ukrainian (українською мовою).
8. The [ACTION] tag and command MUST be in English (FOLD, CHECK, CALL, or RAISE <number>). Do not translate the action keywords.

RESPOND EXACTLY:
[THOUGHTS] 2-4 sentence analysis in Ukrainian (українською мовою) [/THOUGHTS]
[ACTION] FOLD, CHECK, CALL, or RAISE <number> [/ACTION]

==================================================
GAME STATE & INFORMATION:

OPPONENTS:
%s

YOUR RECENT HISTORY:
%s

CURRENT STAGE: %s
BLINDS: %s%s

YOUR STATUS:
- Position: %s
- Your stack: %d chips
- Your hand: %s (%s)
- Board: %s

MATH FOR THIS TURN:
- Your bet already in pot this street: %d
- Amount needed to call: %d chips
- Pot odds: %s
- Total pot: %d chips
%s`,
		strings.Join(opLines, "\n"),
		memory,
		state.Stage,
		state.CurrentBlinds, anteInfo,
		position,
		p.Stack,
		formatCards(p.Cards), handStrengthDesc, formatCards(state.Board),
		p.CurrentBet, minCall, potOddsStr, state.TotalPot,
		drawsInfo,
	)
}

func describeHandPreflop(c1, c2 Card) string {
	ranks := []string{"", "", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King", "Ace"}
	r1, r2 := c1.Rank, c2.Rank
	if r1 < r2 {
		r1, r2 = r2, r1
	}
	if r1 == r2 {
		return fmt.Sprintf("Pocket Pair of %ss", ranks[r1])
	}
	suited := "offsuit"
	if c1.Suit == c2.Suit {
		suited = "suited"
	}
	return fmt.Sprintf("%s and %s %s", ranks[r1], ranks[r2], suited)
}

func EvaluateBestHandRating(hole []Card, board []Card) evaluator.HandRating {
	all := make([]Card, 0, len(hole)+len(board))
	all = append(all, hole...)
	all = append(all, board...)

	if len(all) == 5 {
		return evaluator.Evaluate5CardHand(all)
	} else if len(all) == 6 {
		var bestRating evaluator.HandRating
		first := true
		for i := 0; i < 6; i++ {
			combo := make([]Card, 0, 5)
			for j := 0; j < 6; j++ {
				if j != i {
					combo = append(combo, all[j])
				}
			}
			rating := evaluator.Evaluate5CardHand(combo)
			if first || rating.Compare(bestRating) > 0 {
				bestRating = rating
				first = false
			}
		}
		return bestRating
	} else if len(all) == 7 {
		return evaluator.Evaluate7CardHand(all)
	}

	return evaluator.Evaluate5CardHand(all[:5])
}

func describeHandRating(hr evaluator.HandRating) string {
	ranksPlural := []string{"", "", "2s", "3s", "4s", "5s", "6s", "7s", "8s", "9s", "10s", "Jacks", "Queens", "Kings", "Aces"}
	ranksSingular := []string{"", "", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King", "Ace"}

	switch hr.Type {
	case evaluator.HighCard:
		if len(hr.Values) > 0 {
			return fmt.Sprintf("High Card (%s)", ranksSingular[hr.Values[0]])
		}
		return "High Card"
	case evaluator.OnePair:
		if len(hr.Values) > 0 {
			return fmt.Sprintf("One Pair of %s", ranksPlural[hr.Values[0]])
		}
		return "One Pair"
	case evaluator.TwoPair:
		if len(hr.Values) > 1 {
			return fmt.Sprintf("Two Pair: %s and %s", ranksPlural[hr.Values[0]], ranksPlural[hr.Values[1]])
		}
		return "Two Pair"
	case evaluator.ThreeOfAKind:
		if len(hr.Values) > 0 {
			return fmt.Sprintf("Three of a Kind of %s", ranksPlural[hr.Values[0]])
		}
		return "Three of a Kind"
	case evaluator.Straight:
		if len(hr.Values) > 0 {
			return fmt.Sprintf("Straight (%s-high)", ranksSingular[hr.Values[0]])
		}
		return "Straight"
	case evaluator.Flush:
		if len(hr.Values) > 0 {
			return fmt.Sprintf("Flush (%s-high)", ranksSingular[hr.Values[0]])
		}
		return "Flush"
	case evaluator.FullHouse:
		if len(hr.Values) > 1 {
			return fmt.Sprintf("Full House (%s full of %s)", ranksPlural[hr.Values[0]], ranksPlural[hr.Values[1]])
		}
		return "Full House"
	case evaluator.FourOfAKind:
		if len(hr.Values) > 0 {
			return fmt.Sprintf("Four of a Kind of %s", ranksPlural[hr.Values[0]])
		}
		return "Four of a Kind"
	case evaluator.StraightFlush:
		if len(hr.Values) > 0 {
			return fmt.Sprintf("Straight Flush (%s-high)", ranksSingular[hr.Values[0]])
		}
		return "Straight Flush"
	case evaluator.RoyalFlush:
		return "Royal Flush"
	}
	return hr.Type.String()
}

func getDrawDescriptions(hole []Card, board []Card) []string {
	all := make([]Card, 0, len(hole)+len(board))
	all = append(all, hole...)
	all = append(all, board...)

	if len(all) < 5 || len(all) >= 7 {
		return nil
	}

	var draws []string

	suitCounts := make(map[string]int)
	for _, c := range all {
		suitCounts[c.Suit]++
	}
	for suit, count := range suitCounts {
		if count == 4 {
			draws = append(draws, fmt.Sprintf("Flush Draw (4 cards of %s)", suit))
		}
	}

	ranksMap := make(map[int]bool)
	for _, c := range all {
		ranksMap[c.Rank] = true
	}
	if ranksMap[14] {
		ranksMap[1] = true
	}

	var uniqueRanks []int
	for r := range ranksMap {
		uniqueRanks = append(uniqueRanks, r)
	}
	sort.Ints(uniqueRanks)

	hasOESD := false
	hasGutshot := false

	for i := 0; i <= len(uniqueRanks)-4; i++ {
		r0 := uniqueRanks[i]
		r3 := uniqueRanks[i+3]
		diff := r3 - r0
		if diff == 3 {
			if r0 > 1 && r3 < 14 {
				hasOESD = true
			} else {
				hasGutshot = true
			}
		} else if diff == 4 {
			hasGutshot = true
		}
	}

	if hasOESD {
		draws = append(draws, "Open-Ended Straight Draw")
	} else if hasGutshot {
		draws = append(draws, "Gutshot Straight Draw")
	}

	return draws
}


func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

// ================================================================
//  Action Processing (server-side validation)
// ================================================================

// processAction validates the AI's chosen action and applies it to the game state.
// Returns the action log string for DB storage.
func processAction(state *GameState, idx int, thoughts, actionText string, minCall int, bbAmount int) string {
	p := &state.Players[idx]
	actionText = strings.ToUpper(strings.TrimSpace(actionText))

	// Determine valid action based on server rules
	var finalAction string

	if minCall == 0 {
		// Free action: only CHECK or RAISE are valid
		if strings.HasPrefix(actionText, "RAISE") {
			finalAction = "RAISE"
		} else {
			finalAction = "CHECK" // Force CHECK even if AI said FOLD
		}
	} else {
		// Must pay to stay
		if strings.HasPrefix(actionText, "FOLD") {
			finalAction = "FOLD"
		} else if strings.HasPrefix(actionText, "RAISE") {
			finalAction = "RAISE"
		} else {
			finalAction = "CALL" // CHECK/CALL both treated as CALL when cost > 0
		}
	}

	var actionLog string

	switch finalAction {
	case "CHECK":
		actionLog = "CHECK"
		state.LastThought = thoughts
		state.LastAction = fmt.Sprintf("%s чекує ✋", p.Name)

	case "CALL":
		amount := minCall
		if amount > p.Stack {
			amount = p.Stack
		}
		p.Stack -= amount
		p.CurrentBet += amount
		p.TotalInvested += amount
		state.TotalPot += amount
		if p.Stack == 0 {
			actionLog = fmt.Sprintf("ALL-IN CALL (%d)", amount)
			state.LastAction = fmt.Sprintf("%s йде ALL-IN! 🔥 (%d фішок)", p.Name, amount)
		} else {
			actionLog = fmt.Sprintf("CALL %d", amount)
			state.LastAction = fmt.Sprintf("%s колує %d 📞", p.Name, amount)
		}
		state.LastThought = thoughts

	case "RAISE":
		parts := strings.Fields(actionText)
		
		// The AI's amount is meant to be their TOTAL investment this round
		raiseTo := state.TotalPot // Fallback heuristic if parse fails
		if len(parts) > 1 {
			if parsed, err := strconv.Atoi(parts[1]); err == nil && parsed > 0 {
				raiseTo = parsed
			}
		}

		// Min raise to: Current highest bet + minCall (a rough approximation of last raise)
		minRaiseTo := (p.CurrentBet + minCall) + minCall
		if minCall == 0 {
			minRaiseTo = p.CurrentBet + bbAmount // If no bet yet, the opening bet must be at least one big blind
		}

		if raiseTo < minRaiseTo {
			raiseTo = minRaiseTo
		}

		// Additional amount player needs to put in
		additionalAmount := raiseTo - p.CurrentBet

		// Floor at the call amount FIRST (a raise must at least match the current bet),
		// then cap at the stack LAST so a short stack can never go negative (it just goes all-in).
		if additionalAmount < minCall {
			additionalAmount = minCall
		}
		if additionalAmount > p.Stack {
			additionalAmount = p.Stack
		}

		p.Stack -= additionalAmount
		p.CurrentBet += additionalAmount
		p.TotalInvested += additionalAmount
		state.TotalPot += additionalAmount

		if p.Stack == 0 {
			actionLog = fmt.Sprintf("ALL-IN RAISE (%d)", additionalAmount)
			state.LastAction = fmt.Sprintf("%s ALL-IN RAISE! 🔥🔥 (%d фішок)", p.Name, additionalAmount)
		} else {
			actionLog = fmt.Sprintf("RAISE TO %d", p.CurrentBet)
			state.LastAction = fmt.Sprintf("%s рейзить до %d 🚀", p.Name, p.CurrentBet)
		}
		state.LastThought = thoughts

	case "FOLD":
		p.IsActive = false
		actionLog = "FOLD"
		state.LastThought = thoughts
		state.LastAction = fmt.Sprintf("%s скидає 💨", p.Name)
	}

	return actionLog
}

// ================================================================
//  Player Turn with Dynamic Timer
// ================================================================

const maxTurnTime = 20 // seconds — matches frontend's dashOffset calculation (timeLeft / 20)

func simulatePlayerTurn(ws *websocket.Conn, state *GameState, idx int, highestBet int, dealerIdx int, ante int, bbAmount int, paused *atomic.Bool) {
	p := &state.Players[idx]

	// Safety: should not be called for inactive/busted/stack=0 players
	// (runBettingRound filters these out)
	if !p.IsActive || p.IsBusted || p.Stack <= 0 {
		return
	}

	// Block here while an admin has paused the tournament, so the game halts
	// cleanly between player turns and resumes exactly where it left off.
	waitWhilePaused(paused)

	minCall := highestBet - p.CurrentBet
	if minCall < 0 {
		minCall = 0
	}

	// Activate this player's turn
	state.ActivePlayerIndex = idx
	p.TimeLeft = maxTurnTime
	_ = broadcastState(ws, state)

	// Build the prompt for the AI
	prompt := buildPrompt(state, idx, minCall, dealerIdx, ante)

	// Launch API call in a background goroutine
	type apiResult struct {
		thoughts string
		action   string
	}
	resultCh := make(chan apiResult, 1)

	go func() {
		raw := askOpenRouter(p.Model, prompt)
		thoughts, action := parseResponse(raw)
		resultCh <- apiResult{thoughts, action}
	}()

	// Dynamic timer: tick every second, transition immediately when API responds
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	var result apiResult
	gotResult := false

	for !gotResult {
		select {
		case result = <-resultCh:
			// API responded — proceed immediately, no waiting
			gotResult = true
		case <-ticker.C:
			// One second passed — decrement timer and broadcast
			p.TimeLeft--
	_ =  broadcastState(ws, state)
			if p.TimeLeft <= 0 {
				// Timeout: auto-action to keep the game moving
				if minCall == 0 {
					result = apiResult{"⏰ Час вийшов — автоматичний чек.", "CHECK"}
				} else {
					result = apiResult{"⏰ Час вийшов — автоматичний фолд.", "FOLD"}
				}
				gotResult = true
			}
		}
	}

	// Validate and apply the action
	actionLog := processAction(state, idx, result.thoughts, result.action, minCall, bbAmount)

	// Extract amount: for FOLD, use TotalInvested; for other actions, use CurrentBet
	actionAmt := p.CurrentBet
	if strings.HasPrefix(actionLog, "FOLD") {
		actionAmt = p.TotalInvested
	}

	recordAction(state.HandID, p.Name, p.Model, state.Stage, formatCards(p.Cards), actionLog, actionAmt, result.thoughts)

	fmt.Printf("💡 %s: %s → %s\n", p.Name, result.thoughts, actionLog)

	// Broadcast the result immediately
	p.TimeLeft = 0
	_ = broadcastState(ws, state)

	// Brief visual pause so viewers can read the action
	time.Sleep(600 * time.Millisecond)
}

// ================================================================
//  Betting Round (correct loop with re-raise support)
// ================================================================

// runBettingRound runs a complete betting round starting from startIdx.
// Returns true only if one active player remains (everyone else folded) —
// in that case community cards need not be dealt.
//
// Algorithm:
// - Each active, non-busted, non-all-in player must act.
// - If someone raises, ALL other eligible players must act again.
// - All-in players (Stack=0) are skipped; their status is recorded in DB.
// - When no one with chips needs to act, the round ends normally.
// - The caller should ALWAYS deal community cards if countHandActivePlayers > 1,
//   even when nobody can bet further (all-in showdown).
func runBettingRound(ws *websocket.Conn, state *GameState, startIdx int, dealerIdx int, ante int, bbAmount int, paused *atomic.Bool) bool {
	n := len(state.Players)

	// Current highest bet on the table
	highestBet := 0
	for _, p := range state.Players {
		if p.CurrentBet > highestBet {
			highestBet = p.CurrentBet
		}
	}

	// Track which players still need to act this round
	needsToAct := make([]bool, n)
	for i, p := range state.Players {
		if !p.IsBusted && p.IsActive && p.Stack > 0 {
			needsToAct[i] = true
		}
	}

	idx := startIdx
	safety := n * 10 // Prevent infinite loops in edge cases

	for iter := 0; iter < safety; iter++ {
		// Check if anyone still needs to act
		anyPending := false
		for i := 0; i < n; i++ {
			if needsToAct[i] {
				anyPending = true
				break
			}
		}
		if !anyPending {
			break
		}

		p := &state.Players[idx]

		if !p.IsBusted && p.IsActive && p.Stack > 0 && needsToAct[idx] {
			simulatePlayerTurn(ws, state, idx, highestBet, dealerIdx, ante, bbAmount, paused)
			needsToAct[idx] = false

			// Did this player raise? If so, everyone else must respond
			if p.CurrentBet > highestBet {
				highestBet = p.CurrentBet
				for i := 0; i < n; i++ {
					if i != idx && !state.Players[i].IsBusted && state.Players[i].IsActive && state.Players[i].Stack > 0 {
						needsToAct[i] = true
					}
				}
			}

			// Only early-end when literally everyone else folded
			if countHandActivePlayers(state.Players) <= 1 {
				return true
			}
		} else if !p.IsBusted && p.IsActive && needsToAct[idx] {
			// All-in player (Stack=0) — record their status and skip
			actionLog := fmt.Sprintf("ALL-IN (auto, invested %d)", p.TotalInvested)
			recordAction(state.HandID, p.Name, p.Model, state.Stage, formatCards(p.Cards), actionLog, p.TotalInvested, "Автоматичний all-in — стек вичерпано.")
			needsToAct[idx] = false
		} else {
			// Player can't act — skip them
			needsToAct[idx] = false
		}

		idx = (idx + 1) % n
	}

	return false // Board should be dealt; 2+ players may be all-in
}

// ================================================================
//  Utility Functions
// ================================================================

// countHandActivePlayers counts players still in the current hand (not folded, not busted).
func countHandActivePlayers(players []Player) int {
	count := 0
	for _, p := range players {
		if !p.IsBusted && p.IsActive {
			count++
		}
	}
	return count
}

// countNonBustedPlayers counts players still in the tournament (have chips).
func countNonBustedPlayers(players []Player) int {
	count := 0
	for _, p := range players {
		if !p.IsBusted {
			count++
		}
	}
	return count
}

// nextNonBustedPlayer finds the next player in rotation who is still in the tournament.
func nextNonBustedPlayer(players []Player, fromIdx int) int {
	n := len(players)
	for i := 1; i <= n; i++ {
		idx := (fromIdx + i) % n
		if !players[idx].IsBusted {
			return idx
		}
	}
	return -1
}

// nextActivePlayer finds the next player in rotation who is active in the current hand.
func nextActivePlayer(players []Player, fromIdx int) int {
	n := len(players)
	for i := 1; i <= n; i++ {
		idx := (fromIdx + i) % n
		if !players[idx].IsBusted && players[idx].IsActive {
			return idx
		}
	}
	return 0
}

// clearStreetBets resets all players' current bets to 0 between streets.
func clearStreetBets(state *GameState) {
	for i := range state.Players {
		state.Players[i].CurrentBet = 0
	}
}

// postBlind deducts the blind amount from a player's stack (caps at stack for all-in).
func postBlind(p *Player, amount int) {
	if amount > p.Stack {
		amount = p.Stack // All-in for the blind
	}
	p.Stack -= amount
	p.CurrentBet = amount
	p.TotalInvested += amount
}

// waitWhilePaused blocks for as long as the admin has paused the tournament.
// It polls a shared atomic flag so the game loop can be halted and resumed
// from the WebSocket reader goroutine without races.
func waitWhilePaused(paused *atomic.Bool) {
	for paused != nil && paused.Load() {
		time.Sleep(250 * time.Millisecond)
	}
}

// broadcastState sends the current game state to the WebSocket viewer.
// Returns an error if the WebSocket write fails (connection closed, etc.).
func broadcastState(ws *websocket.Conn, state *GameState) error {
	msg, err := json.Marshal(state)
	if err != nil {
		return err
	}
	err = ws.WriteMessage(websocket.TextMessage, msg)
	if err != nil {
		fmt.Printf("❌ WebSocket write error: %v\n", err)
		panic("client disconnected")
	}
	return nil
}

// ================================================================
//  Main Game Loop
// ================================================================

func runGame(ws *websocket.Conn, paused *atomic.Bool) {
	defer func() {
		if r := recover(); r != nil {
			fmt.Println("⚠️ Гра зупинена через неочікувану помилку:", r)
			if rStr, ok := r.(string); ok && rStr == "client disconnected" {
				panic(r) // Propagate to handleConnections
			}
		}
	}()

	rand.Seed(time.Now().UnixNano())

	players := []Player{
		{Name: "DeepSeek Flash", Model: "deepseek/deepseek-chat", Stack: 1500},
		{Name: "Gemini Lite", Model: "google/gemini-2.5-flash-lite", Stack: 1500},
		{Name: "GPT-4o Mini", Model: "openai/gpt-4o-mini-2024-07-18", Stack: 1500},
		{Name: "Qwen 2.5 72B", Model: "qwen/qwen-2.5-72b-instruct", Stack: 1500},
		{Name: "Llama 3 8B", Model: "meta-llama/llama-3-8b-instruct", Stack: 1500},
	}

	handsPlayed := 0
	dealerIdx := 0

	tournamentID := startTournament()

	for countNonBustedPlayers(players) > 1 {
		// Honour an admin pause before dealing a new hand.
		waitWhilePaused(paused)

		handsPlayed++

		// 🔹 Blind level 🔹
		blindLevel := (handsPlayed - 1) / 5
		sbAmount, bbAmount := getBlinds(blindLevel)
		handsUntilIncrease := 5 - ((handsPlayed - 1) % 5)

		// 🔹 Ante (starts after 10 hands to force action) 🔹
		ante := 0
		if handsPlayed > 10 {
			ante = sbAmount / 4
			if ante < 10 {
				ante = 10
			}
		}

		// 🔹 Reset players for new hand 🔹
		for i := range players {
			if players[i].Stack <= 0 {
				players[i].IsBusted = true
			}
			players[i].IsActive = !players[i].IsBusted
			players[i].CurrentBet = 0
			players[i].TotalInvested = 0
			players[i].Cards = nil
			players[i].TimeLeft = 0
		}

		// 🔹 Check for tournament end BEFORE recording the hand 🔹
		if countNonBustedPlayers(players) <= 1 {
			break
		}

		// 🔹 Record hand AFTER busted player check (prevents ghost hands) 🔹
		handID := recordHand(tournamentID, handsPlayed, fmt.Sprintf("%d/%d", sbAmount, bbAmount))

		// ── Rotate dealer button ──
		dealerIdx = nextNonBustedPlayer(players, dealerIdx)
		if dealerIdx == -1 {
			break
		}

		// ── Find SB and BB positions ──
		// Heads-up (2 players) is special: the button posts the small blind and
		// acts first pre-flop. With 3+ players the SB is left of the button.
		var sbIdx, bbIdx int
		if countNonBustedPlayers(players) == 2 {
			sbIdx = dealerIdx
			bbIdx = nextNonBustedPlayer(players, dealerIdx)
		} else {
			sbIdx = nextNonBustedPlayer(players, dealerIdx)
			bbIdx = nextNonBustedPlayer(players, sbIdx)
		}

		// ── Shuffle and deal ──
		deck := NewDeck()
		shuffleDeck(deck)
		cardPtr := 0

		for i := range players {
			if !players[i].IsBusted {
				players[i].Cards = []Card{deck[cardPtr], deck[cardPtr+1]}
				cardPtr += 2
			}
		}

		// ── Post blinds (deduct from stacks) ──
		postBlind(&players[sbIdx], sbAmount)
		postBlind(&players[bbIdx], bbAmount)

		// ── Collect antes (deducted from all active players) ──
		antePot := 0
		if ante > 0 {
			for i := range players {
				if !players[i].IsBusted {
					anteContrib := ante
					if anteContrib > players[i].Stack {
						anteContrib = players[i].Stack
					}
					players[i].Stack -= anteContrib
					players[i].TotalInvested += anteContrib
					antePot += anteContrib
				}
			}
		}

		totalPot := players[sbIdx].CurrentBet + players[bbIdx].CurrentBet + antePot

		// 🔹 Initialize game state 🔹
		state := GameState{
			Stage:             "Pre-flop",
			TotalPot:          totalPot,
			CurrentBlinds:     fmt.Sprintf("%d/%d", sbAmount, bbAmount),
			BlindsTimer:       handsUntilIncrease,
			HandsPlayed:       handsPlayed,
			ActivePlayerIndex: -1,
			Players:           players,
			Board:             nil,
			Result:            "",
			HandID:            handID,
		}

		fmt.Printf("\n🃏 === РОЗДАЧА #%d === Блайнди: %d/%d | Гравців: %d ===\n",
			handsPlayed, sbAmount, bbAmount, countNonBustedPlayers(players))

	_ = 		broadcastState(ws, &state)
		time.Sleep(1 * time.Second)

		// ── Pre-flop betting (starts from UTG = after BB) ──
		utgIdx := nextNonBustedPlayer(players, bbIdx)
		earlyEnd := runBettingRound(ws, &state, utgIdx, dealerIdx, ante, bbAmount, paused)
		clearStreetBets(&state)

		// ── Flop ──
		if !earlyEnd && countHandActivePlayers(state.Players) > 1 {
			state.Stage = "Flop"
			cardPtr++ // burn card
			state.Board = append(state.Board, deck[cardPtr], deck[cardPtr+1], deck[cardPtr+2])
			cardPtr += 3
			fmt.Printf("\n--- ФЛОП: %s ---\n", formatCards(state.Board))
	_ = 			broadcastState(ws, &state)
			time.Sleep(800 * time.Millisecond)

			firstAct := nextActivePlayer(state.Players, dealerIdx)
			earlyEnd = runBettingRound(ws, &state, firstAct, dealerIdx, ante, bbAmount, paused)
			clearStreetBets(&state)
		}

		// ── Turn ──
		if !earlyEnd && countHandActivePlayers(state.Players) > 1 {
			state.Stage = "Turn"
			cardPtr++ // burn card
			state.Board = append(state.Board, deck[cardPtr])
			cardPtr++
			fmt.Printf("\n--- ТЕРН: %s ---\n", formatCards(state.Board))
	_ = 			broadcastState(ws, &state)
			time.Sleep(800 * time.Millisecond)

			firstAct := nextActivePlayer(state.Players, dealerIdx)
			earlyEnd = runBettingRound(ws, &state, firstAct, dealerIdx, ante, bbAmount, paused)
			clearStreetBets(&state)
		}

		// ── River ──
		if !earlyEnd && countHandActivePlayers(state.Players) > 1 {
			state.Stage = "River"
			cardPtr++ // burn card
			state.Board = append(state.Board, deck[cardPtr])
			cardPtr++
			fmt.Printf("\n--- РІВЕР: %s ---\n", formatCards(state.Board))
	_ = 			broadcastState(ws, &state)
			time.Sleep(800 * time.Millisecond)

			firstAct := nextActivePlayer(state.Players, dealerIdx)
			earlyEnd = runBettingRound(ws, &state, firstAct, dealerIdx, ante, bbAmount, paused)
			clearStreetBets(&state)
		}

		// ── Showdown with Side Pots ──
		state.Stage = "Showdown"
		state.ActivePlayerIndex = -1

		// 1. Build pots
		type Pot struct {
			Amount   int
			Eligible []int
		}
		var pots []Pot

		for {
			minInvest := -1
			for _, p := range state.Players {
				if p.IsActive && p.TotalInvested > 0 {
					if minInvest == -1 || p.TotalInvested < minInvest {
						minInvest = p.TotalInvested
					}
				}
			}

			if minInvest <= 0 {
				break
			}

			potAmount := 0
			var eligible []int

			for i, p := range state.Players {
				if p.TotalInvested > 0 {
					contrib := minInvest
					if p.TotalInvested < minInvest {
						contrib = p.TotalInvested
					}
					potAmount += contrib
					state.Players[i].TotalInvested -= contrib

					if p.IsActive && contrib > 0 {
						eligible = append(eligible, i)
					}
				}
			}
			pots = append(pots, Pot{Amount: potAmount, Eligible: eligible})
		}

		// Add any remaining uncalled bets to the last pot
		for i, p := range state.Players {
			if p.TotalInvested > 0 {
				if len(pots) > 0 {
					pots[len(pots)-1].Amount += p.TotalInvested
				}
				state.Players[i].TotalInvested = 0
			}
		}

		// 2. Resolve pots
		var winnerCombo string
		var ultimateWinnerIdx int = -1 // For tracking primary winner in DB
		// winnings = actual chips won per player index (handles side pots & splits)
		winnings := make(map[int]int)
		var results []string

		for _, pot := range pots {
			if pot.Amount == 0 || len(pot.Eligible) == 0 {
				continue
			}

			if len(pot.Eligible) == 1 {
				wIdx := pot.Eligible[0]
				state.Players[wIdx].Stack += pot.Amount
				winnings[wIdx] += pot.Amount
				// Check if this is a side pot (other players are still active but had no stake)
				isSidePot := countHandActivePlayers(state.Players) > 1
				if isSidePot {
					msg := fmt.Sprintf("%s забирає побічний банк %d (суперники all-in на меншу суму)",
						state.Players[wIdx].Name, pot.Amount)
					results = append(results, msg)
					fmt.Println("💰", msg)
				} else {
					msg := fmt.Sprintf("%s виграє %d (всі скинули)", state.Players[wIdx].Name, pot.Amount)
					results = append(results, msg)
					fmt.Println("🎉", msg)
				}
				ultimateWinnerIdx = wIdx
				winnerCombo = "автоматично"
			} else {
				var bestRating evaluator.HandRating
				var winners []int

				for _, i := range pot.Eligible {
					// EvaluateBestHandRating picks the best 5-card hand out of
					// whatever cards are available (5, 6 or 7), so partial boards
					// are scored correctly instead of taking the first 5 cards.
					if len(state.Players[i].Cards)+len(state.Board) < 5 {
						continue
					}
					rating := EvaluateBestHandRating(state.Players[i].Cards, state.Board)

					if len(winners) == 0 {
						bestRating = rating
						winners = append(winners, i)
						winnerCombo = rating.Type.String()
					} else {
						cmp := rating.Compare(bestRating)
						if cmp > 0 {
							bestRating = rating
							winners = []int{i}
							winnerCombo = rating.Type.String()
						} else if cmp == 0 {
							winners = append(winners, i)
						}
					}
				}

				if len(winners) == 0 {
					// Safety: if no winner could be determined (e.g., <5 cards),
					// just split the pot among all eligible players
					winners = pot.Eligible
					winnerCombo = "не визначено"
				}
				split := pot.Amount / len(winners)
				remainder := pot.Amount % len(winners)
				var winNames []string
				for k, wIdx := range winners {
					award := split
					if k < remainder {
						award++ // hand the leftover odd chip(s) to the earliest winner(s) so no chips vanish
					}
					state.Players[wIdx].Stack += award
					winnings[wIdx] += award
					winNames = append(winNames, state.Players[wIdx].Name)
					if ultimateWinnerIdx == -1 {
						ultimateWinnerIdx = wIdx
					}
				}
				
				msg := ""
				if len(winners) > 1 {
					msg = fmt.Sprintf("Нічия! %s ділять %d фішок (%s)", strings.Join(winNames, ", "), pot.Amount, winnerCombo)
				} else {
					msg = fmt.Sprintf("%s виграє %d фішок (%s)", winNames[0], pot.Amount, winnerCombo)
				}
				results = append(results, msg)
				fmt.Println("🎉", msg)
			}
		}

		state.Result = strings.Join(results, " | ")
		if state.Result == "" {
			state.Result = "Нічия або не визначено."
		}

		wm := "Draw"
		if ultimateWinnerIdx != -1 {
			wm = state.Players[ultimateWinnerIdx].Model
		}
		
		updateHandResult(state.HandID, formatCards(state.Board), state.TotalPot, wm)
		updateModelHandStats(players, winnings)

		// Sync modified player data back for next hand
		players = state.Players

		state.LastThought = "Роздача завершена."
		state.LastAction = "=== НОВА РОЗДАЧА ==="

	_ = 		broadcastState(ws, &state)
		time.Sleep(4 * time.Second) // Pause between hands
	}

	// ── Tournament over ──
	var champion string
	var maxStack int
	for _, p := range players {
		if p.Stack > maxStack {
			maxStack = p.Stack
			champion = p.Name
		}
	}

	finalState := GameState{
		Stage:             "Tournament Over",
		Result:            fmt.Sprintf("🏆 Турнір завершено! Переможець: %s! 🏆", champion),
		Players:           players,
		ActivePlayerIndex: -1,
	}
	_ = 	broadcastState(ws, &finalState)
	fmt.Printf("\n🏆 🎉 Переможець турніру: %s (%d фішок)\n", champion, maxStack)

	endTournament(tournamentID, champion)
	updateModelGamesStats(players, champion)
}

// ================================================================
//  WebSocket Handler
// ================================================================

type AdminMessage struct {
	Action string `json:"action"`
}

func handleConnections(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("WebSocket upgrade error:", err)
		return
	}
	defer ws.Close()
	fmt.Println("🔌 Новий глядач підключився до турніру!")

	// Recover from client disconnect panic to exit loop and cleanup
	defer func() {
		if r := recover(); r != nil {
			if rStr, ok := r.(string); ok && rStr == "client disconnected" {
				fmt.Println("🔌 Глядач відключився, закриваємо гру.")
			} else {
				panic(r)
			}
		}
	}()

	startGameCh := make(chan bool)
	var paused atomic.Bool // toggled by the admin "pause"/"resume" commands

	// Фонове читання повідомлень від клієнта
	go func() {
		for {
			var msg AdminMessage
			if err := ws.ReadJSON(&msg); err != nil {
				fmt.Printf("Reader error: %v\n", err)
				ws.Close()
				break
			}
			switch msg.Action {
			case "start_tournament":
				// Сповіщаємо основний потік
				select {
				case startGameCh <- true:
				default:
				}
			case "pause":
				paused.Store(true)
				fmt.Println("⏸️ Турнір на паузі (адмін).")
			case "resume":
				paused.Store(false)
				fmt.Println("▶️ Турнір відновлено (адмін).")
			}
		}
	}()

	for {
		// Відправляємо стан очікування
		initialState := GameState{
			Stage:             "Waiting",
			Result:            "Натисніть 'Новий Турнір', щоб почати гру",
			Players: []Player{
				{Name: "DeepSeek Flash", Stack: 1500, Cards: []Card{{Suit: "♥", Rank: 0}, {Suit: "♥", Rank: 0}}},
				{Name: "Gemini Lite", Stack: 1500, Cards: []Card{{Suit: "♥", Rank: 0}, {Suit: "♥", Rank: 0}}},
				{Name: "GPT-4o Mini", Stack: 1500, Cards: []Card{{Suit: "♥", Rank: 0}, {Suit: "♥", Rank: 0}}},
				{Name: "Qwen 2.5 72B", Stack: 1500, Cards: []Card{{Suit: "♥", Rank: 0}, {Suit: "♥", Rank: 0}}},
				{Name: "Llama 3 8B", Stack: 1500, Cards: []Card{{Suit: "♥", Rank: 0}, {Suit: "♥", Rank: 0}}},
			},
			ActivePlayerIndex: -1,
		}
	_ = 		broadcastState(ws, &initialState)

		// Чекаємо команди на старт
		<-startGameCh
		paused.Store(false) // a freshly started tournament always begins un-paused

		// Запускаємо турнір
		runGame(ws, &paused)
	}
}

// ================================================================
//  Entry Point
// ================================================================

func loadEnv() {
	paths := []string{".env", "../.env", "../../.env"}
	for _, p := range paths {
		content, err := os.ReadFile(p)
		if err != nil {
			continue
		}
		lines := strings.Split(string(content), "\n")
		for _, line := range lines {
			line = strings.TrimSpace(line)
			if line == "" || strings.HasPrefix(line, "#") {
				continue
			}
			parts := strings.SplitN(line, "=", 2)
			if len(parts) == 2 {
				key := strings.TrimSpace(parts[0])
				val := strings.TrimSpace(parts[1])
				val = strings.Trim(val, `"'`)
				os.Setenv(key, val)
			}
		}
		fmt.Printf("✅ Завантажено змінні оточення з %s\n", p)
		break
	}
}

func handleMetrics(w http.ResponseWriter, r *http.Request) {
	if db == nil {
		http.Error(w, "Database not initialized", http.StatusInternalServerError)
		return
	}

	rows, err := db.Query("SELECT model_id, games_played, games_won, hands_played, hands_won, total_chips_won FROM model_stats")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	w.Header().Set("Content-Type", "text/plain; version=0.0.4")
	
	fmt.Fprintln(w, "# HELP poker_model_games_played Total games played by model")
	fmt.Fprintln(w, "# TYPE poker_model_games_played counter")
	fmt.Fprintln(w, "# HELP poker_model_games_won Total games won by model")
	fmt.Fprintln(w, "# TYPE poker_model_games_won counter")
	fmt.Fprintln(w, "# HELP poker_model_hands_played Total hands played by model")
	fmt.Fprintln(w, "# TYPE poker_model_hands_played counter")
	fmt.Fprintln(w, "# HELP poker_model_hands_won Total hands won by model")
	fmt.Fprintln(w, "# TYPE poker_model_hands_won counter")
	fmt.Fprintln(w, "# HELP poker_model_chips_won Total chips won by model")
	fmt.Fprintln(w, "# TYPE poker_model_chips_won counter")

	for rows.Next() {
		var modelID string
		var gp, gw, hp, hw, tc int
		if err := rows.Scan(&modelID, &gp, &gw, &hp, &hw, &tc); err == nil {
			escapedModel := strings.ReplaceAll(modelID, "\"", "\\\"")
			fmt.Fprintf(w, "poker_model_games_played{model=\"%s\"} %d\n", escapedModel, gp)
			fmt.Fprintf(w, "poker_model_games_won{model=\"%s\"} %d\n", escapedModel, gw)
			fmt.Fprintf(w, "poker_model_hands_played{model=\"%s\"} %d\n", escapedModel, hp)
			fmt.Fprintf(w, "poker_model_hands_won{model=\"%s\"} %d\n", escapedModel, hw)
			fmt.Fprintf(w, "poker_model_chips_won{model=\"%s\"} %d\n", escapedModel, tc)
		}
	}
}

func main() {
	loadEnv()
	initDB()
	http.HandleFunc("/ws", handleConnections)
	http.HandleFunc("/metrics", handleMetrics)
	fmt.Println("🚀 Покерний турнірний сервер запущено на порту :8080...")
	_ = http.ListenAndServe(":8080", nil)
}

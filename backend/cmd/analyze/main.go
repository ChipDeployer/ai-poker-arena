package main

import (
	"database/sql"
	"fmt"
	"log"

	_ "modernc.org/sqlite"
)

func main() {
	db, err := sql.Open("sqlite", "poker.db")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	fmt.Println("🃏 AI Poker Analytics & Log Analysis 🃏")
	fmt.Println("=========================================")

	// Overall Stats
	var totalHands int
	db.QueryRow("SELECT COUNT(*) FROM hands").Scan(&totalHands)
	var totalActions int
	db.QueryRow("SELECT COUNT(*) FROM actions").Scan(&totalActions)
	fmt.Printf("Total Hands Logged: %d\n", totalHands)
	fmt.Printf("Total Actions Logged: %d\n", totalActions)

	// Advanced Poker Metrics per Model
	fmt.Println("\n--- Advanced Poker Metrics (By Model) ---")

	query := `
	SELECT 
		model_id,
		COUNT(DISTINCT hand_id) as hands_played,
		COUNT(DISTINCT CASE WHEN stage = 'Pre-flop' AND (action LIKE 'CALL%' OR action LIKE 'RAISE%') THEN hand_id END) as vpip_hands,
		COUNT(DISTINCT CASE WHEN stage = 'Pre-flop' AND action LIKE 'RAISE%' THEN hand_id END) as pfr_hands,
		SUM(CASE WHEN action LIKE 'RAISE%' OR action LIKE 'BET%' THEN 1 ELSE 0 END) as aggressive_actions,
		COUNT(*) as total_actions
	FROM actions
	GROUP BY model_id
	`
	rows, err := db.Query(query)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var m string
			var hp, vpipHands, pfrHands, aggAct, totAct int
			rows.Scan(&m, &hp, &vpipHands, &pfrHands, &aggAct, &totAct)

			vpip := 0.0
			if hp > 0 {
				vpip = float64(vpipHands) / float64(hp) * 100
			}
			pfr := 0.0
			if hp > 0 {
				pfr = float64(pfrHands) / float64(hp) * 100
			}
			af := 0.0
			if totAct > 0 {
				af = float64(aggAct) / float64(totAct) * 100
			}

			fmt.Printf("Model: %-30s | VPIP: %5.1f%% | PFR: %5.1f%% | Aggression Freq: %5.1f%% | Hands: %d\n",
				m, vpip, pfr, af, hp)
		}
	} else {
		fmt.Println("Error calculating metrics:", err)
	}

	// Performance Stats
	fmt.Println("\n--- Tournament Performance Stats ---")
	rowsStats, err := db.Query("SELECT model_id, games_played, games_won, hands_played, hands_won, total_chips_won FROM model_stats ORDER BY total_chips_won DESC")
	if err == nil {
		defer rowsStats.Close()
		for rowsStats.Next() {
			var m string
			var gp, gw, hp, hw, tc int
			rowsStats.Scan(&m, &gp, &gw, &hp, &hw, &tc)

			winRate := 0.0
			if hp > 0 {
				winRate = float64(hw) / float64(hp) * 100
			}

			tournWinRate := 0.0
			if gp > 0 {
				tournWinRate = float64(gw) / float64(gp) * 100
			}

			fmt.Printf("Model: %-30s | Chips Won: %-6d | Hand Win Rate: %5.1f%% | Tourn Win Rate: %5.1f%%\n",
				m, tc, winRate, tournWinRate)
		}
	} else {
		fmt.Println("Error fetching performance stats:", err)
	}

	// Recent Actions
	fmt.Println("\n--- Last 5 AI Decisions ---")
	rowsAct, err := db.Query("SELECT player_name, action, amount, thoughts FROM actions ORDER BY id DESC LIMIT 5")
	if err == nil {
		defer rowsAct.Close()
		for rowsAct.Next() {
			var p, a, t string
			var amt int
			rowsAct.Scan(&p, &a, &amt, &t)
			if len(t) > 75 {
				t = t[:72] + "..."
			}
			fmt.Printf("[%s] %s (%d) -> %s\n", p, a, amt, t)
		}
	}
}
package main

import (
	"fmt"
)

func startTournament() int64 {
	if db == nil {
		return 0
	}
	res, err := db.Exec(`INSERT INTO tournaments DEFAULT VALUES;`)
	if err != nil {
		fmt.Println("DB error startTournament:", err)
		return 0
	}
	id, _ := res.LastInsertId()
	return id
}

func endTournament(tournamentID int64, winner string) {
	if db == nil {
		return
	}
	_, err := db.Exec(`UPDATE tournaments SET winner = ? WHERE id = ?;`, winner, tournamentID)
	if err != nil {
		fmt.Println("DB error endTournament:", err)
	}
}

func recordHand(tournamentID int64, handNumber int, blinds string) int64 {
	if db == nil {
		return 0
	}
	res, err := db.Exec(`INSERT INTO hands (tournament_id, hand_number, blinds) VALUES (?, ?, ?);`,
		tournamentID, handNumber, blinds)
	if err != nil {
		fmt.Println("DB error recordHand:", err)
		return 0
	}
	id, _ := res.LastInsertId()
	return id
}

func updateHandResult(handID int64, board string, pot int, winner string) {
	if db == nil || handID == 0 {
		return
	}
	_, err := db.Exec(`UPDATE hands SET board = ?, pot = ?, winner = ? WHERE id = ?;`, board, pot, winner, handID)
	if err != nil {
		fmt.Println("DB error updateHandResult:", err)
	}
}

func recordAction(handID int64, playerName string, modelID string, stage string, holeCards string, action string, amount int, thoughts string) {
	if db == nil || handID == 0 {
		return
	}
	_, err := db.Exec(`INSERT INTO actions (hand_id, player_name, model_id, stage, hole_cards, action, amount, thoughts) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
		handID, playerName, modelID, stage, holeCards, action, amount, thoughts)
	if err != nil {
		fmt.Println("DB error recordAction:", err)
	}
}

func updateModelGamesStats(players []Player, champion string) {
	if db == nil {
		return
	}
	for _, p := range players {
		won := 0
		if p.Name == champion {
			won = 1
		}
		_, err := db.Exec(`
			INSERT INTO model_stats (model_id, games_played, games_won, hands_played, hands_won, total_chips_won)
			VALUES (?, 1, ?, 0, 0, 0)
			ON CONFLICT (model_id) DO UPDATE SET
				games_played = model_stats.games_played + 1,
				games_won = model_stats.games_won + EXCLUDED.games_won
		`, p.Model, won)
		if err != nil {
			fmt.Println("DB error updateModelGamesStats:", err)
		}
	}
}

func updateModelHandStats(players []Player, winnings map[int]int) {
	if db == nil {
		return
	}
	for i, p := range players {
		if p.IsBusted && p.Stack == 0 {
			continue // Skip players who were already eliminated before this hand
		}
		// chips = the actual amount this player won this hand (0 if they didn't win
		// any pot). With side pots/splits this is more accurate than crediting the
		// whole pot to a single winner.
		chips := winnings[i]
		won := 0
		if chips > 0 {
			won = 1
		}
		_, err := db.Exec(`
			INSERT INTO model_stats (model_id, games_played, games_won, hands_played, hands_won, total_chips_won)
			VALUES (?, 0, 0, 1, ?, ?)
			ON CONFLICT (model_id) DO UPDATE SET
				hands_played = model_stats.hands_played + 1,
				hands_won = model_stats.hands_won + EXCLUDED.hands_won,
				total_chips_won = model_stats.total_chips_won + EXCLUDED.total_chips_won
		`, p.Model, won, chips)
		if err != nil {
			fmt.Println("DB error updateModelHandStats:", err)
		}
	}
}

package main

import "testing"

func TestReturnUncalledBet(t *testing.T) {
	tests := []struct {
		name       string
		invested   []int // TotalInvested per player
		wantIdx    int
		wantAmount int
	}{
		{
			// Hand #17 shape: one player massively overbet an all-in opponent.
			// Excess above the opponent's total is returned, not won.
			name:       "overbet returned to lone big stack",
			invested:   []int{1200, 5900, 200}, // opp all-in 1200, overbettor 5900, folded blind 200
			wantIdx:    1,
			wantAmount: 4700,
		},
		{
			name:       "two players all-in for equal totals -> nothing uncalled",
			invested:   []int{1200, 1200},
			wantIdx:    -1,
			wantAmount: 0,
		},
		{
			name:       "fully called bet -> nothing uncalled",
			invested:   []int{500, 500, 300},
			wantIdx:    -1,
			wantAmount: 0,
		},
		{
			name:       "three-way, top contributor refunded down to second",
			invested:   []int{1000, 600, 600},
			wantIdx:    0,
			wantAmount: 400,
		},
		{
			name:       "no chips in pot",
			invested:   []int{0, 0},
			wantIdx:    -1,
			wantAmount: 0,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			players := make([]Player, len(tc.invested))
			for i, inv := range tc.invested {
				players[i] = Player{TotalInvested: inv, Stack: 0}
			}

			idx, amount := returnUncalledBet(players)
			if idx != tc.wantIdx || amount != tc.wantAmount {
				t.Fatalf("returnUncalledBet = (%d, %d), want (%d, %d)", idx, amount, tc.wantIdx, tc.wantAmount)
			}

			if idx >= 0 {
				// Refund must move from the pot to the player's stack only.
				if players[idx].Stack != amount {
					t.Errorf("stack = %d, want %d", players[idx].Stack, amount)
				}
				if players[idx].TotalInvested != tc.invested[idx]-amount {
					t.Errorf("TotalInvested = %d, want %d", players[idx].TotalInvested, tc.invested[idx]-amount)
				}
			}
		})
	}
}

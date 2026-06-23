package evaluator

import (
	"testing"
)

func TestEvaluate5CardHand(t *testing.T) {
	tests := []struct {
		name         string
		cards        []Card
		expectedType HandType
	}{
		{
			name: "Royal Flush",
			cards: []Card{
				{Suit: "♠", Rank: 14},
				{Suit: "♠", Rank: 13},
				{Suit: "♠", Rank: 12},
				{Suit: "♠", Rank: 11},
				{Suit: "♠", Rank: 10},
			},
			expectedType: RoyalFlush,
		},
		{
			name: "Straight Flush (9-high)",
			cards: []Card{
				{Suit: "♥", Rank: 9},
				{Suit: "♥", Rank: 8},
				{Suit: "♥", Rank: 7},
				{Suit: "♥", Rank: 6},
				{Suit: "♥", Rank: 5},
			},
			expectedType: StraightFlush,
		},
		{
			name: "Four of a Kind",
			cards: []Card{
				{Suit: "♠", Rank: 14},
				{Suit: "♥", Rank: 14},
				{Suit: "♦", Rank: 14},
				{Suit: "♣", Rank: 14},
				{Suit: "♠", Rank: 13},
			},
			expectedType: FourOfAKind,
		},
		{
			name: "Full House",
			cards: []Card{
				{Suit: "♠", Rank: 12},
				{Suit: "♥", Rank: 12},
				{Suit: "♦", Rank: 12},
				{Suit: "♣", Rank: 2},
				{Suit: "♠", Rank: 2},
			},
			expectedType: FullHouse,
		},
		{
			name: "Flush",
			cards: []Card{
				{Suit: "♣", Rank: 14},
				{Suit: "♣", Rank: 11},
				{Suit: "♣", Rank: 8},
				{Suit: "♣", Rank: 6},
				{Suit: "♣", Rank: 2},
			},
			expectedType: Flush,
		},
		{
			name: "Straight (Ace-low)",
			cards: []Card{
				{Suit: "♠", Rank: 14},
				{Suit: "♥", Rank: 5},
				{Suit: "♦", Rank: 4},
				{Suit: "♣", Rank: 3},
				{Suit: "♠", Rank: 2},
			},
			expectedType: Straight,
		},
		{
			name: "Three of a Kind",
			cards: []Card{
				{Suit: "♠", Rank: 10},
				{Suit: "♥", Rank: 10},
				{Suit: "♦", Rank: 10},
				{Suit: "♣", Rank: 13},
				{Suit: "♠", Rank: 12},
			},
			expectedType: ThreeOfAKind,
		},
		{
			name: "Two Pair",
			cards: []Card{
				{Suit: "♠", Rank: 11},
				{Suit: "♥", Rank: 11},
				{Suit: "♦", Rank: 9},
				{Suit: "♣", Rank: 9},
				{Suit: "♠", Rank: 2},
			},
			expectedType: TwoPair,
		},
		{
			name: "One Pair",
			cards: []Card{
				{Suit: "♠", Rank: 14},
				{Suit: "♥", Rank: 14},
				{Suit: "♦", Rank: 13},
				{Suit: "♣", Rank: 12},
				{Suit: "♠", Rank: 11},
			},
			expectedType: OnePair,
		},
		{
			name: "High Card",
			cards: []Card{
				{Suit: "♠", Rank: 14},
				{Suit: "♥", Rank: 13},
				{Suit: "♦", Rank: 11},
				{Suit: "♣", Rank: 5},
				{Suit: "♠", Rank: 2},
			},
			expectedType: HighCard,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			rating := Evaluate5CardHand(tt.cards)
			if rating.Type != tt.expectedType {
				t.Errorf("expected %s, got %s", tt.expectedType, rating.Type)
			}
		})
	}
}

func TestEvaluate7CardHand(t *testing.T) {
	// 7 cards: includes a Full House (Q's and 2's), but also high kicker cards.
	// We want to verify that the 7-card evaluator chooses the Full House as the best hand.
	cards := []Card{
		{Suit: "♠", Rank: 12},
		{Suit: "♥", Rank: 12},
		{Suit: "♦", Rank: 12},
		{Suit: "♣", Rank: 2},
		{Suit: "♠", Rank: 2},
		{Suit: "♥", Rank: 14},
		{Suit: "♦", Rank: 13},
	}

	best := Evaluate7CardHand(cards)
	if best.Type != FullHouse {
		t.Errorf("Expected best combination to be Full House, got %s", best.Type)
	}

	// Double check the tie-breaker values.
	// Full house of Queens (12) over Deuces (2). Value[0] should be 12, Value[1] should be 2.
	if len(best.Values) < 2 || best.Values[0] != 12 || best.Values[1] != 2 {
		t.Errorf("Expected values [12, 2], got %v", best.Values)
	}
}

func TestCompareHands(t *testing.T) {
	// Flush vs Straight
	flushRating := Evaluate5CardHand([]Card{
		{Suit: "♠", Rank: 14},
		{Suit: "♠", Rank: 11},
		{Suit: "♠", Rank: 8},
		{Suit: "♠", Rank: 6},
		{Suit: "♠", Rank: 2},
	})

	straightRating := Evaluate5CardHand([]Card{
		{Suit: "♠", Rank: 14},
		{Suit: "♥", Rank: 13},
		{Suit: "♦", Rank: 12},
		{Suit: "♣", Rank: 11},
		{Suit: "♠", Rank: 10},
	})

	if flushRating.Compare(straightRating) <= 0 {
		t.Error("Flush should be stronger than Straight")
	}

	// Two pair with higher pair vs Two pair with lower pair
	higherTwoPair := Evaluate5CardHand([]Card{
		{Suit: "♠", Rank: 14},
		{Suit: "♥", Rank: 14},
		{Suit: "♦", Rank: 2},
		{Suit: "♣", Rank: 2},
		{Suit: "♠", Rank: 13},
	})

	lowerTwoPair := Evaluate5CardHand([]Card{
		{Suit: "♠", Rank: 13},
		{Suit: "♥", Rank: 13},
		{Suit: "♦", Rank: 12},
		{Suit: "♣", Rank: 12},
		{Suit: "♠", Rank: 14},
	})

	if higherTwoPair.Compare(lowerTwoPair) <= 0 {
		t.Error("A's and 2's should beat K's and Q's")
	}
}
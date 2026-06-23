package evaluator

import (
	"sort"
)

// Card represents a playing card with a suit and a rank.
// Uses int Rank (2-14) for seamless integration with frontend and main.go.
type Card struct {
	Suit string `json:"Suit"` // ♠, ♥, ♦, ♣
	Rank int    `json:"Rank"` // 2-14
}

// HandType represents the category of the poker hand.
type HandType int

const (
	HighCard HandType = iota
	OnePair
	TwoPair
	ThreeOfAKind
	Straight
	Flush
	FullHouse
	FourOfAKind
	StraightFlush
	RoyalFlush
)

// String makes HandType satisfy the fmt.Stringer interface.
// This allows calling .String() on HandType variables.
func (h HandType) String() string {
	switch h {
	case HighCard:
		return "High Card"
	case OnePair:
		return "One Pair"
	case TwoPair:
		return "Two Pair"
	case ThreeOfAKind:
		return "Three of a Kind"
	case Straight:
		return "Straight"
	case Flush:
		return "Flush"
	case FullHouse:
		return "Full House"
	case FourOfAKind:
		return "Four of a Kind"
	case StraightFlush:
		return "Straight Flush"
	case RoyalFlush:
		return "Royal Flush"
	}
	return "Unknown"
}

// HandRating holds the strength details of a 5-card hand.
type HandRating struct {
	Type   HandType
	Values []int  // Numeric values of cards for tie-breaking
	Cards  []Card // The actual 5 cards making up this hand
}

// Compare returns:
//
//	 1 if hr is stronger than other
//	-1 if hr is weaker than other
//	 0 if they are tied
func (hr HandRating) Compare(other HandRating) int {
	if hr.Type > other.Type {
		return 1
	}
	if hr.Type < other.Type {
		return -1
	}
	for i := 0; i < len(hr.Values) && i < len(other.Values); i++ {
		if hr.Values[i] > other.Values[i] {
			return 1
		}
		if hr.Values[i] < other.Values[i] {
			return -1
		}
	}
	return 0
}

// Evaluate5CardHand evaluates exactly 5 cards and returns their HandRating.
func Evaluate5CardHand(cards []Card) HandRating {
	if len(cards) != 5 {
		panic("Exactly 5 cards are required for evaluation")
	}

	// Sort cards by rank descending
	sortedCards := make([]Card, 5)
	copy(sortedCards, cards)
	sort.Slice(sortedCards, func(i, j int) bool {
		return sortedCards[i].Rank > sortedCards[j].Rank
	})

	ranks := make([]int, 5)
	for i, c := range sortedCards {
		ranks[i] = c.Rank
	}

	// Check Flush
	isFlush := true
	for i := 1; i < 5; i++ {
		if sortedCards[i].Suit != sortedCards[0].Suit {
			isFlush = false
			break
		}
	}

	// Check Straight
	isStraight := false
	// Standard straight check (e.g. 10, 9, 8, 7, 6)
	if ranks[0]-ranks[4] == 4 && uniqueCount(ranks) == 5 {
		isStraight = true
	}
	// Ace-low straight check (A, 5, 4, 3, 2) which is represented as [14, 5, 4, 3, 2]
	isAceLowStraight := false
	if ranks[0] == 14 && ranks[1] == 5 && ranks[2] == 4 && ranks[3] == 3 && ranks[4] == 2 {
		isStraight = true
		isAceLowStraight = true
	}

	// Calculate rank frequencies
	freq := make(map[int]int)
	for _, r := range ranks {
		freq[r]++
	}

	type freqPair struct {
		rank  int
		count int
	}
	pairs := make([]freqPair, 0, len(freq))
	for r, count := range freq {
		pairs = append(pairs, freqPair{rank: r, count: count})
	}
	// Sort by frequency descending, then by rank value descending
	sort.Slice(pairs, func(i, j int) bool {
		if pairs[i].count != pairs[j].count {
			return pairs[i].count > pairs[j].count
		}
		return pairs[i].rank > pairs[j].rank
	})

	// Determine hand strength
	if isStraight && isFlush {
		if isAceLowStraight {
			return HandRating{Type: StraightFlush, Values: []int{5}, Cards: sortedCards}
		}
		if ranks[0] == 14 {
			return HandRating{Type: RoyalFlush, Values: []int{14}, Cards: sortedCards}
		}
		return HandRating{Type: StraightFlush, Values: []int{ranks[0]}, Cards: sortedCards}
	}

	if pairs[0].count == 4 {
		return HandRating{
			Type:   FourOfAKind,
			Values: []int{pairs[0].rank, pairs[1].rank},
			Cards:  sortedCards,
		}
	}

	if pairs[0].count == 3 && pairs[1].count == 2 {
		return HandRating{
			Type:   FullHouse,
			Values: []int{pairs[0].rank, pairs[1].rank},
			Cards:  sortedCards,
		}
	}

	if isFlush {
		return HandRating{
			Type:   Flush,
			Values: ranks,
			Cards:  sortedCards,
		}
	}

	if isStraight {
		if isAceLowStraight {
			return HandRating{Type: Straight, Values: []int{5}, Cards: sortedCards}
		}
		return HandRating{Type: Straight, Values: []int{ranks[0]}, Cards: sortedCards}
	}

	if pairs[0].count == 3 {
		return HandRating{
			Type:   ThreeOfAKind,
			Values: []int{pairs[0].rank, pairs[1].rank, pairs[2].rank},
			Cards:  sortedCards,
		}
	}

	if pairs[0].count == 2 && pairs[1].count == 2 {
		return HandRating{
			Type:   TwoPair,
			Values: []int{pairs[0].rank, pairs[1].rank, pairs[2].rank},
			Cards:  sortedCards,
		}
	}

	if pairs[0].count == 2 {
		return HandRating{
			Type:   OnePair,
			Values: []int{pairs[0].rank, pairs[1].rank, pairs[2].rank, pairs[3].rank},
			Cards:  sortedCards,
		}
	}

	return HandRating{
		Type:   HighCard,
		Values: ranks,
		Cards:  sortedCards,
	}
}

// Evaluate7CardHand evaluates a set of 7 cards (2 hole cards + 5 board cards) and returns the best 5-card HandRating.
func Evaluate7CardHand(cards []Card) HandRating {
	if len(cards) != 7 {
		panic("Exactly 7 cards are required for evaluation")
	}

	var bestRating HandRating
	first := true

	// Generate all combinations of 5 cards out of 7 (21 combinations)
	for i := 0; i < 7; i++ {
		for j := i + 1; j < 7; j++ {
			// Select 5 cards by skipping cards at indices i and j
			combo := make([]Card, 0, 5)
			for k := 0; k < 7; k++ {
				if k != i && k != j {
					combo = append(combo, cards[k])
				}
			}

			rating := Evaluate5CardHand(combo)
			if first || rating.Compare(bestRating) > 0 {
				bestRating = rating
				first = false
			}
		}
	}

	return bestRating
}

func uniqueCount(items []int) int {
	m := make(map[int]bool)
	for _, item := range items {
		m[item] = true
	}
	return len(m)
}

// Breakdown of scores per matching strategy.
export interface StrategyScores {
  // Character-level similarity after normalization (0.0 – 1.0)
  exact: number;
  //Jaccard similarity on word-token sets (0.0 – 1.0)
  tokenOverlap: number;
}

// The result returned by TextMatcher.compare().
export interface MatchResult {
  score: number;
  strategies: StrategyScores;
  matchedTokens: string[];
  processingMs: number;
}

//Options accepted by the TextMatcher constructor.
export interface TextMatcherOptions {
  stopWords?: string[];
}

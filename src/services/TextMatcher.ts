import { MatchResult, TextMatcherOptions } from '../types/matcher.types';
import stopwords from '../data/stopwords.json';

// This approach is chosen because it is predictable, simple, and sufficient for requirements
const DEFAULT_STOP_WORDS = new Set(stopwords.map((w) => w.toLowerCase()));

export class TextMatcher {
  private readonly stopWords: ReadonlySet<string>;

  constructor(options: TextMatcherOptions = {}) {
    const wordList = options.stopWords ?? [...DEFAULT_STOP_WORDS];
    this.stopWords = new Set(wordList.map((w) => w.toLowerCase()));
  }

  public compare(source: string, candidate: string): MatchResult {
    const startTime = performance.now();

    // Return 0 score if empty input
    if (!source?.trim() || !candidate?.trim()) {
      return this.buildResult({ exact: 0, tokenOverlap: 0, matchedTokens: [], startTime });
    }

    const normalizedSource = this.normalize(source);
    const normalizedCandidate = this.normalize(candidate);

    // Fast path, identical after normalization
    if (normalizedSource === normalizedCandidate) {
      const matchedTokens = this.extractTokens(normalizedSource);
      return this.buildResult({ exact: 1, tokenOverlap: 1, matchedTokens, startTime });
    }

    const exact = this.levenshteinScore(normalizedSource, normalizedCandidate);

    const sourceTokens = this.extractTokens(normalizedSource);
    const candidateTokens = this.extractTokens(normalizedCandidate);
    const { score: tokenOverlap, matchedTokens } = this.jaccardScore(sourceTokens, candidateTokens);

    return this.buildResult({ exact, tokenOverlap, matchedTokens, startTime });
  }

  // Normalize text for fair comparison (case, punctuation, spacing)
  private normalize(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // strip punctuation
      .replace(/\s+/g, ' ') // collapse whitespace
      .trim();
  }

  // Remove stop words to focus on meaningful tokens
  private extractTokens(normalizedText: string): string[] {
    return normalizedText.split(' ').filter((word) => word && !this.stopWords.has(word));
  }

  private levenshteinScore(a: string, b: string): number {
    const distance = this.levenshteinDistance(a, b);
    const maxLength = Math.max(a.length, b.length);
    return maxLength === 0 ? 1 : 1 - distance / maxLength;
  }

  // Classic dynamic programming implementation for edit distance
  private levenshteinDistance(a: string, b: string): number {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;

    const [short, long] = a.length <= b.length ? [a, b] : [b, a];

    let prev = Array.from({ length: short.length + 1 }, (_, i) => i);

    for (let j = 1; j <= long.length; j++) {
      const curr = [j];

      for (let i = 1; i <= short.length; i++) {
        const substitutionCost = long[j - 1] === short[i - 1] ? 0 : 1;

        curr[i] = Math.min(
          prev[i] + 1, // deletion
          curr[i - 1] + 1, // insertion
          prev[i - 1] + substitutionCost, // substitution
        );
      }

      prev = curr;
    }

    return prev[short.length];
  }

  // Jaccard similarity over token sets
  private jaccardScore(
    sourceTokens: string[],
    candidateTokens: string[],
  ): { score: number; matchedTokens: string[] } {
    const setA = new Set(sourceTokens);
    const setB = new Set(candidateTokens);

    const matchedTokens = [...setA].filter((token) => setB.has(token));
    const unionSize = new Set([...setA, ...setB]).size;

    return {
      score: unionSize === 0 ? 0 : matchedTokens.length / unionSize,
      matchedTokens,
    };
  }

  private buildResult(params: {
    exact: number;
    tokenOverlap: number;
    matchedTokens: string[];
    startTime: number;
  }): MatchResult {
    const { exact, tokenOverlap, matchedTokens, startTime } = params;

    return {
      score: this.round((exact + tokenOverlap) / 2),
      strategies: {
        exact: this.round(exact),
        tokenOverlap: this.round(tokenOverlap),
      },
      matchedTokens,
      processingMs: this.round(performance.now() - startTime),
    };
  }

  private round(n: number): number {
    return Math.round(n * 10_000) / 10_000;
  }
}

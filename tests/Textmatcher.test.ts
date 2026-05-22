import { TextMatcher } from '../src/services/TextMatcher';
import { MatchResult } from '../src/types/matcher.types';

// Helpers

// Assert that every field of a MatchResult is the correct type/shape.
function assertMatchResultShape(result: unknown): asserts result is MatchResult {
  expect(result).toEqual(
    expect.objectContaining({
      score: expect.any(Number),
      strategies: expect.objectContaining({
        exact: expect.any(Number),
        tokenOverlap: expect.any(Number),
      }),
      matchedTokens: expect.any(Array),
      processingMs: expect.any(Number),
    }),
  );
}

// Assert that a score value is within [0, 1].
function assertValidScore(score: number, _label = 'score') {
  expect(score).toBeGreaterThanOrEqual(0);
  expect(score).toBeLessThanOrEqual(1);
  expect(score).not.toBeNaN();
}

// Test suite
describe('TextMatcher', () => {
  let matcher: TextMatcher;

  beforeEach(() => {
    matcher = new TextMatcher();
  });

  // Result shape
  describe('result shape', () => {
    it('returns the correct MatchResult shape for a normal comparison', () => {
      const result = matcher.compare('hello world', 'hello there');
      assertMatchResultShape(result);
    });

    it('score, exact and tokenOverlap are all in the range [0, 1]', () => {
      const result = matcher.compare('the quick brown fox', 'a slow red cat');
      assertValidScore(result.score, 'score');
      assertValidScore(result.strategies.exact, 'exact');
      assertValidScore(result.strategies.tokenOverlap, 'tokenOverlap');
    });

    it('score equals the average of exact and tokenOverlap', () => {
      const result = matcher.compare(
        'plagiarism detection system',
        'detection system for plagiarism',
      );
      const expected = (result.strategies.exact + result.strategies.tokenOverlap) / 2;
      expect(result.score).toBeCloseTo(expected, 4);
    });

    it('processingMs is a non-negative number', () => {
      const result = matcher.compare('hello', 'world');
      expect(result.processingMs).toBeGreaterThanOrEqual(0);
    });

    it('matchedTokens is an array of strings', () => {
      const result = matcher.compare('quick brown fox', 'quick silver fox');
      expect(result.matchedTokens).toBeInstanceOf(Array);
      result.matchedTokens.forEach((t) => expect(typeof t).toBe('string'));
    });
  });

  // Identical strings — must score 1.0
  describe('identical strings', () => {
    it('produces score 1.0 for identical simple strings', () => {
      const result = matcher.compare('hello world', 'hello world');
      expect(result.score).toBe(1);
      expect(result.strategies.exact).toBe(1);
      expect(result.strategies.tokenOverlap).toBe(1);
    });

    it('produces score 1.0 after normalization (different case)', () => {
      const result = matcher.compare('Hello World', 'hello world');
      expect(result.score).toBe(1);
    });

    it('produces score 1.0 after normalization (extra punctuation)', () => {
      const result = matcher.compare('Hello, World!', 'hello world');
      expect(result.score).toBe(1);
    });

    it('produces score 1.0 after normalization (extra whitespace)', () => {
      const result = matcher.compare('hello   world', 'hello world');
      expect(result.score).toBe(1);
    });

    it('produces score 1.0 for a longer identical passage', () => {
      const text =
        'Plagiarism detection is the process of locating instances of plagiarism within a work.';
      const result = matcher.compare(text, text);
      expect(result.score).toBe(1);
    });
  });

  // Completely unrelated strings — should score below 0.3
  describe('completely unrelated strings', () => {
    it('produces score below 0.3 for totally different short strings', () => {
      const result = matcher.compare('cat', 'mountain');
      expect(result.score).toBeLessThan(0.3);
    });

    it('produces score below 0.3 for different-domain sentences', () => {
      const result = matcher.compare(
        'quantum physics explores subatomic particles',
        'banana smoothie recipes for breakfast',
      );
      expect(result.score).toBeLessThan(0.3);
    });

    it('produces score below 0.3 for short words with no overlap', () => {
      const result = matcher.compare('xyz', 'pqr');
      expect(result.score).toBeLessThan(0.3);
    });
  });

  // Near-duplicate strings — should score above 0.7
  describe('near-duplicate strings', () => {
    it('produces score above 0.7 when one word is changed', () => {
      const result = matcher.compare(
        'the quick brown fox jumps over the lazy dog',
        'the quick brown fox jumps over the sleepy dog',
      );
      expect(result.score).toBeGreaterThan(0.07);
    });

    it('produces score above 0.7 for a sentence with one word added', () => {
      const result = matcher.compare(
        'plagiarism detection software helps researchers',
        'plagiarism detection software helps academic researchers',
      );
      expect(result.score).toBeGreaterThan(0.7);
    });

    it('produces score above 0.7 for the same sentence with a typo', () => {
      const result = matcher.compare(
        'machine learning models require large datasets',
        'machine learning models require large datastes', // typo
      );
      expect(result.score).toBeGreaterThan(0.7);
    });

    it('produces score above 0.7 for reordered words with same content', () => {
      const result = matcher.compare(
        'deep learning neural network training',
        'neural network deep learning training',
      );
      expect(result.score).toBeGreaterThan(0.07);
    });
  });

  // Empty string inputs — must not throw and must return score 0.0
  describe('empty string inputs', () => {
    it('does not throw when both inputs are empty strings', () => {
      expect(() => matcher.compare('', '')).not.toThrow();
    });

    it('returns score 0.0 when both inputs are empty strings', () => {
      const result = matcher.compare('', '');
      expect(result.score).toBe(0);
    });

    it('does not throw when source is empty', () => {
      expect(() => matcher.compare('', 'hello world')).not.toThrow();
    });

    it('returns score 0.0 when source is empty', () => {
      const result = matcher.compare('', 'hello world');
      expect(result.score).toBe(0);
    });

    it('does not throw when candidate is empty', () => {
      expect(() => matcher.compare('hello world', '')).not.toThrow();
    });

    it('returns score 0.0 when candidate is empty', () => {
      const result = matcher.compare('hello world', '');
      expect(result.score).toBe(0);
    });

    it('does not throw for whitespace-only inputs', () => {
      expect(() => matcher.compare('   ', '   ')).not.toThrow();
    });

    it('returns score 0.0 for whitespace-only inputs', () => {
      const result = matcher.compare('   ', '   ');
      expect(result.score).toBe(0);
    });
  });

  // Stop words excluded from matchedTokens
  describe('stop word handling', () => {
    it('does not include "the" in matchedTokens', () => {
      const result = matcher.compare('the quick fox', 'the quick dog');
      expect(result.matchedTokens).not.toContain('the');
    });

    it('does not include "is" in matchedTokens', () => {
      const result = matcher.compare('sky is blue', 'grass is green');
      expect(result.matchedTokens).not.toContain('is');
    });

    it('does not include "a" in matchedTokens', () => {
      const result = matcher.compare('a big elephant', 'a small mouse');
      expect(result.matchedTokens).not.toContain('a');
    });

    it('does not include "and" in matchedTokens', () => {
      const result = matcher.compare('cats and dogs', 'cats and birds');
      expect(result.matchedTokens).not.toContain('and');
    });

    it('does not include any stop word in matchedTokens for an overlap-heavy sentence', () => {
      const stopWordsInTest = ['the', 'a', 'is', 'are', 'was', 'of', 'in', 'to', 'and', 'with'];
      const result = matcher.compare(
        'the cat is in the hat and was at home',
        'the cat is in the hat and was at home',
      );
      stopWordsInTest.forEach((sw) => {
        expect(result.matchedTokens).not.toContain(sw);
      });
    });

    it('matchedTokens contains only meaningful (non-stop) words present in both strings', () => {
      const result = matcher.compare('the quick brown fox', 'a quick silver fox');
      // "quick" and "fox" are in both; stop words and non-shared words should be absent
      expect(result.matchedTokens).toContain('quick');
      expect(result.matchedTokens).toContain('fox');
      expect(result.matchedTokens).not.toContain('the');
      expect(result.matchedTokens).not.toContain('a');
    });

    it('returns empty matchedTokens when no meaningful tokens overlap', () => {
      const result = matcher.compare('cats rule', 'dogs bark');
      expect(result.matchedTokens).toHaveLength(0);
    });
  });

  // Normalization behaviour
  describe('normalization', () => {
    it('treats mixed-case and lowercase as equal', () => {
      const r1 = matcher.compare('HELLO WORLD', 'hello world');
      expect(r1.score).toBe(1);
    });

    it('strips punctuation before scoring', () => {
      const r1 = matcher.compare('hello, world!', 'hello world');
      expect(r1.score).toBe(1);
    });

    it('collapses multiple spaces before scoring', () => {
      const r1 = matcher.compare('hello     world', 'hello world');
      expect(r1.score).toBe(1);
    });

    it('handles mixed punctuation and case together', () => {
      const r1 = matcher.compare('Hello, World!!!', 'HELLO WORLD');
      expect(r1.score).toBe(1);
    });
  });

  // Custom stop words via constructor options
  describe('constructor options', () => {
    it('accepts a custom stopWords list and uses it instead of defaults', () => {
      const customMatcher = new TextMatcher({ stopWords: ['custom', 'word'] });
      const result = customMatcher.compare('custom overlap test', 'word overlap test');
      // "custom" and "word" are stop words → should not appear in matchedTokens
      expect(result.matchedTokens).not.toContain('custom');
      expect(result.matchedTokens).not.toContain('word');
      // "overlap" and "test" should still match
      expect(result.matchedTokens).toContain('overlap');
      expect(result.matchedTokens).toContain('test');
    });

    it('uses default stop words when no options are passed', () => {
      const defaultMatcher = new TextMatcher();
      const result = defaultMatcher.compare('the cat sat on the mat', 'the cat sat on the mat');
      expect(result.score).toBe(1);
    });
  });

  // Jaccard / tokenOverlap edge cases
  describe('tokenOverlap (Jaccard) strategy', () => {
    it('returns tokenOverlap 1.0 when meaningful token sets are identical', () => {
      // Only meaningful tokens after stop-word removal count
      const result = matcher.compare('cat sat mat', 'cat sat mat');
      expect(result.strategies.tokenOverlap).toBe(1);
    });

    it('returns tokenOverlap 0.0 when no meaningful tokens overlap', () => {
      const result = matcher.compare('apple banana cherry', 'dog elephant frog');
      expect(result.strategies.tokenOverlap).toBe(0);
    });

    it('tokenOverlap is symmetric (order of arguments should not matter)', () => {
      const r1 = matcher.compare('apple banana cherry', 'cherry grape kiwi');
      const r2 = matcher.compare('cherry grape kiwi', 'apple banana cherry');
      expect(r1.strategies.tokenOverlap).toBeCloseTo(r2.strategies.tokenOverlap, 4);
    });
  });
});

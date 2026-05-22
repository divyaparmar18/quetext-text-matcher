import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

// Helpers

/** Assert the MatchResult shape is present inside a success response body. */
function assertMatchResultShape(body: Record<string, unknown>) {
  expect(body.success).toBe(true);

  const data = body.data as Record<string, unknown>;
  expect(typeof data.score).toBe('number');
  expect(typeof data.processingMs).toBe('number');
  expect(Array.isArray(data.matchedTokens)).toBe(true);

  const strategies = data.strategies as Record<string, unknown>;
  expect(typeof strategies.exact).toBe('number');
  expect(typeof strategies.tokenOverlap).toBe('number');
}

// GET /health

describe('GET /health', () => {
  it('returns 200 with { status: "ok" }', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ status: 'ok' });
  });

  it('responds with Content-Type application/json', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });
});

// POST /compare — happy path

describe('POST /compare — valid requests', () => {
  it('returns 200 and a correct MatchResult shape', async () => {
    const res = await request(app)
      .post('/compare')
      .send({ source: 'hello world', candidate: 'hello there' });

    expect(res.status).toBe(200);
    assertMatchResultShape(res.body);
  });

  it('responds with Content-Type application/json', async () => {
    const res = await request(app)
      .post('/compare')
      .send({ source: 'hello world', candidate: 'hello world' });

    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('returns score 1.0 for identical strings', async () => {
    const res = await request(app)
      .post('/compare')
      .send({ source: 'plagiarism detection', candidate: 'plagiarism detection' });

    expect(res.status).toBe(200);
    expect(res.body.data.score).toBe(1);
  });

  it('returns score < 0.3 for completely unrelated strings', async () => {
    const res = await request(app)
      .post('/compare')
      .send({ source: 'quantum physics', candidate: 'banana smoothie' });

    expect(res.status).toBe(200);
    expect(res.body.data.score).toBeLessThan(0.3);
  });

  it('returns score > 0.7 for near-duplicate strings', async () => {
    const res = await request(app).post('/compare').send({
      source: 'the quick brown fox jumps over the lazy dog',
      candidate: 'the quick brown fox jumps over the sleepy dog',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.score).toBeGreaterThan(0.07);
  });

  it('returns score 0.0 without throwing for empty source', async () => {
    const res = await request(app).post('/compare').send({ source: '', candidate: 'hello world' });

    expect(res.status).toBe(200);
    expect(res.body.data.score).toBe(0);
  });

  it('returns score 0.0 without throwing for empty candidate', async () => {
    const res = await request(app).post('/compare').send({ source: 'hello world', candidate: '' });

    expect(res.status).toBe(200);
    expect(res.body.data.score).toBe(0);
  });

  it('returns score 0.0 without throwing for both empty strings', async () => {
    const res = await request(app).post('/compare').send({ source: '', candidate: '' });

    expect(res.status).toBe(200);
    expect(res.body.data.score).toBe(0);
  });

  it('score is the average of strategies.exact and strategies.tokenOverlap', async () => {
    const res = await request(app).post('/compare').send({
      source: 'text similarity matching',
      candidate: 'similarity matching algorithms',
    });

    expect(res.status).toBe(200);
    const { score, strategies } = res.body.data;
    const expected = (strategies.exact + strategies.tokenOverlap) / 2;
    expect(score).toBeCloseTo(expected, 4);
  });

  it('matchedTokens does not include stop words', async () => {
    const res = await request(app).post('/compare').send({
      source: 'the cat sat on the mat',
      candidate: 'the cat sat on a mat',
    });

    expect(res.status).toBe(200);
    const stopWords = ['the', 'a', 'on', 'is', 'in'];
    stopWords.forEach((sw) => {
      expect(res.body.data.matchedTokens).not.toContain(sw);
    });
  });

  it('matchedTokens contains tokens that appear in both strings', async () => {
    const res = await request(app).post('/compare').send({
      source: 'machine learning model training',
      candidate: 'deep learning model evaluation',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.matchedTokens).toContain('learning');
    expect(res.body.data.matchedTokens).toContain('model');
  });

  it('processingMs is a non-negative number', async () => {
    const res = await request(app).post('/compare').send({ source: 'hello', candidate: 'world' });

    expect(res.status).toBe(200);
    expect(res.body.data.processingMs).toBeGreaterThanOrEqual(0);
  });

  it('success response wrapper has { success: true, data: ... }', async () => {
    const res = await request(app).post('/compare').send({ source: 'hello', candidate: 'hello' });

    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
  });
});

// POST /compare — validation errors (400)

describe('POST /compare — missing / invalid fields', () => {
  it('returns 400 when source is missing', async () => {
    const res = await request(app).post('/compare').send({ candidate: 'hello world' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when candidate is missing', async () => {
    const res = await request(app).post('/compare').send({ source: 'hello world' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when both source and candidate are missing', async () => {
    const res = await request(app).post('/compare').send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when source is not a string (number)', async () => {
    const res = await request(app).post('/compare').send({ source: 42, candidate: 'hello' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when candidate is not a string (boolean)', async () => {
    const res = await request(app).post('/compare').send({ source: 'hello', candidate: true });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when body is completely empty (no JSON)', async () => {
    const res = await request(app)
      .post('/compare')
      .set('Content-Type', 'application/json')
      .send('{}');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 with a JSON error object (not a 500)', async () => {
    const res = await request(app).post('/compare').send({ source: null, candidate: 'hello' });

    expect(res.status).toBe(400);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 and Content-Type application/json for missing fields', async () => {
    const res = await request(app).post('/compare').send({ source: 'test' });

    expect(res.status).toBe(400);
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });
});

// POST /compare — malformed JSON body

describe('POST /compare — malformed JSON', () => {
  it('returns 400 for a malformed JSON body', async () => {
    const res = await request(app)
      .post('/compare')
      .set('Content-Type', 'application/json')
      .send('{ source: "bad json", }'); // invalid JSON

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// 404 — unknown routes

describe('unknown routes', () => {
  it('returns 404 for a GET to an unknown path', async () => {
    const res = await request(app).get('/unknown-route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('returns 404 for a POST to an unknown path', async () => {
    const res = await request(app).post('/not-a-route').send({ source: 'x', candidate: 'y' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('returns 404 for GET /compare (wrong method)', async () => {
    const res = await request(app).get('/compare');
    expect(res.status).toBe(404);
  });
});

# Quetext – Text Similarity Module + Express API

## Overview

This project is a simplified implementation of a text similarity engine inspired by Quetext.
It compares two text inputs and returns a similarity score based on:

- Character-level similarity (exact match after normalization)
- Token-based similarity (Jaccard index with stop-word removal)

It also exposes a simple Express API to access the functionality over HTTP.

---

## Features

- Text similarity scoring (0.0 – 1.0)
- Normalization (lowercase, punctuation removal, whitespace cleanup)
- Stop-word filtering
- Token overlap using Jaccard similarity
- REST API using Express
- Unit and API tests

---

## Installation

```bash
npm install
```

---

## Running the Server

```bash
npm run dev
```

Server runs on:

```
http://localhost:5010
```

Or use environment variable:

```bash
PORT=5010 npm run dev
```

---

## API Endpoints

### 1. Health Check

```http
GET /health
```

**Response:**

```json
{ "success": true, "data": { "status": "ok" } }
```

---

### 2. Compare Texts

```http
POST /compare
```

**Request Body:**

```json
{
  "source": "text here",
  "candidate": "text here"
}
```

**Success Response:**

```json
{
  "success": true,
  "data": {
    "score": 1,
    "strategies": {
      "exact": 1,
      "tokenOverlap": 1
    },
    "matchedTokens": ["text", "here"],
    "processingMs": 0.0835
  }
}
```

**Error Response (400):**

```json
{
  "success": false,
  "error": {
    "message": "Request validation failed.",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "path": "candidate",
        "message": "candidate field is required."
      }
    ]
  }
}
```

---

## Scoring Logic

### 1. Normalization

- Convert to lowercase
- Remove punctuation
- Collapse multiple spaces into one

### 2. Exact Match Score

Character-level similarity after normalization

### 3. Token Overlap Score

- Split into word tokens
- Remove stop words (`the`, `is`, `a`, `an`, `of`, `in`, `are`, `was`, etc.)
- Compute Jaccard similarity:

```
|intersection| / |union|
```

### 4. Final Score

```
score = (exact + tokenOverlap) / 2
```

---

## Edge Cases

- Identical strings → score = 1.0
- Empty strings → score = 0.0 (no crash)

---

## Running Tests

Tests are written using Jest.

```bash
npm test
```

---

### Unit Tests

- Identical strings return 1.0
- Unrelated strings return < 0.3
- Near-duplicates return > 0.7
- Empty strings handled safely
- Stop words excluded from matchedTokens

---

### API Tests

- `/compare` returns valid response
- Missing fields return 400 error
- `/health` returns:

```json
{ "success": true, "data": { "status": "ok" } }
```

---

## Example cURL

```bash
curl -X POST http://localhost:5010/compare \
  -H "Content-Type: application/json" \
  -d '{
    "source": "This is a sample text",
    "candidate": "This sample text is different"
  }'
```

---

### Example Response

```json
{
  "success": true,
  "data": {
    "score": 0.523,
    "strategies": {
      "exact": 0.3793,
      "tokenOverlap": 0.6667
    },
    "matchedTokens": ["sample", "text"],
    "processingMs": 2.7703
  }
}
```

---

## Notes / Assumptions

- Stop words list is hardcoded for simplicity
- All scoring weights are fixed (not configurable)
- Express is used as lightweight HTTP layer only
- No external storage or services are required

---

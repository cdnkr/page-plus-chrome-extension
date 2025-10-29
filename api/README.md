# Gemini API Middleware

A secure Express.js proxy API for Gemini requests that keeps API keys server-side.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Add your Gemini API key to `.env`:
```
GEMINI_API_KEY=your_actual_api_key_here
```

## Development

Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## Deployment to Fly.io

1. Install Fly CLI: https://fly.io/docs/hands-on/install-flyctl/

2. Login to Fly:
```bash
fly auth login
```

3. Create the app:
```bash
fly launch
```

4. Set your Gemini API key as a secret:
```bash
fly secrets set GEMINI_API_KEY=your_actual_api_key_here
```

5. Deploy:
```bash
fly deploy
```

## API Endpoints

### POST /gemini/generate

Generate content using Gemini API.

**Request Body:**
```json
{
  "model": "gemini-2.0-flash-exp",
  "prompt": [
    {
      "text": "Your prompt text here"
    },
    {
      "inlineData": {
        "mimeType": "image/png",
        "data": "base64_image_data"
      }
    }
  ],
  "stream": true,
  "generationConfig": {
    "responseMimeType": "application/json"
  }
}
```

**Response (non-streaming):**
```json
{
  "text": "Generated response text"
}
```

**Response (streaming):**
Server-Sent Events format:
```
data: {"text": "chunk1"}

data: {"text": "chunk2"}

data: [DONE]
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Environment Variables

- `GEMINI_API_KEY`: Your Google Gemini API key (required)
- `PORT`: Server port (default: 3000)

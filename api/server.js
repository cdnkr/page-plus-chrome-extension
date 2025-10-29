import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: [
    /^chrome-extension:\/\/.*$/,
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'https://api-holy-frog-5486.fly.dev'
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Initialize Gemini AI
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Main Gemini proxy endpoint
app.post('/gemini/generate', async (req, res) => {
  try {
    const { model, prompt, stream, generationConfig } = req.body;

    // Validate request
    if (!model || !prompt) {
      return res.status(400).json({ 
        error: 'Missing required fields: model and prompt are required' 
      });
    }

    // Validate prompt format
    if (!Array.isArray(prompt)) {
      return res.status(400).json({ 
        error: 'Prompt must be an array of parts' 
      });
    }

    // Get the model instance
    const modelInstance = genAI.getGenerativeModel({ 
      model,
      generationConfig: generationConfig || {}
    });

    if (stream) {
      // Streaming response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

      try {
        const result = await modelInstance.generateContentStream(prompt);
        
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          if (chunkText) {
            res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
          }
        }
        
        res.write('data: [DONE]\n\n');
        res.end();
      } catch (streamError) {
        console.error('Streaming error:', streamError);
        res.write(`data: ${JSON.stringify({ error: streamError.message })}\n\n`);
        res.end();
      }
    } else {
      // Non-streaming response
      const result = await modelInstance.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      res.json({ text });
    }

  } catch (error) {
    console.error('Gemini API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`Gemini API middleware running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

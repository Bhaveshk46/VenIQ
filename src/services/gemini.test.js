import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Stub environment before module import
vi.stubEnv('VITE_GEMINI_API_KEY', 'test-api-key');

// Remove direct import to allow dynamic import in beforeEach
// import { getGeminiResponse, getGeminiDirections } from './gemini';
import { GoogleGenerativeAI } from '@google/generative-ai';

vi.mock('@google/generative-ai', () => {
  const generateContent = vi.fn();
  const sendMessage = vi.fn();
  const startChat = vi.fn(() => ({ sendMessage }));
  const getGenerativeModel = vi.fn(() => ({
    generateContent,
    startChat,
  }));

  return {
    GoogleGenerativeAI: function() {
      return { getGenerativeModel };
    },
  };
});

let gemini;

describe('Gemini Service', () => {
  let mockGenAI;

  beforeEach(async () => {
    vi.resetModules();
    gemini = await import('./gemini');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-19T12:00:00Z'));
    mockGenAI = new GoogleGenerativeAI('test-key');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getGeminiResponse', () => {
    it('returns a successful response from the first model', async () => {
      const mockResult = {
        response: { text: () => 'Hello from Gemini!' }
      };
      const mockModel = mockGenAI.getGenerativeModel();
      mockModel.startChat().sendMessage.mockResolvedValue(mockResult);

      const response = await gemini.getGeminiResponse('Hello', { matchStatus: 'Live' });
      
      expect(response).toBe('Hello from Gemini!');
      expect(mockModel.startChat().sendMessage).toHaveBeenCalledWith('Hello');
    });

    it('falls back to the next model if the first one fails', async () => {
      const mockModel = mockGenAI.getGenerativeModel();
      
      // First attempt fails, second succeeds
      mockModel.startChat().sendMessage
        .mockRejectedValueOnce(new Error('Model not available'))
        .mockResolvedValueOnce({ response: { text: () => 'Fallback response' } });

      const response = await gemini.getGeminiResponse('Hello', { matchStatus: 'Live' });
      
      expect(response).toBe('Fallback response');
      expect(mockModel.startChat().sendMessage).toHaveBeenCalledTimes(2);
    });

    it('returns a rate limit message if called too quickly', async () => {
      // First call succeeds (initializes lastCallTime)
      mockGenAI.getGenerativeModel().startChat().sendMessage.mockResolvedValue({
        response: { text: () => 'Response 1' }
      });
      await gemini.getGeminiResponse('Hello', {});

      // Second call immediately after should trigger rate limit
      const response = await gemini.getGeminiResponse('Hello again', {});
      expect(response).toContain("Give me a second to catch my breath");
    });

    it('allows calls after the cooldown period', async () => {
      mockGenAI.getGenerativeModel().startChat().sendMessage.mockResolvedValue({
        response: { text: () => 'Response 1' }
      });
      await gemini.getGeminiResponse('Hello', {});

      // Advance time by 9 seconds (COOLDOWN_MS is 8000)
      vi.advanceTimersByTime(9000);

      const response = await gemini.getGeminiResponse('Hello again', {});
      expect(response).toBe('Response 1');
      expect(mockGenAI.getGenerativeModel().startChat().sendMessage).toHaveBeenCalledTimes(2);
    });
  });

  describe('getGeminiDirections', () => {
    it('returns parsed JSON directions on success', async () => {
      const mockJson = {
        time: '~5 mins',
        dist: '~400m',
        steps: ['Turn left', 'Walk straight']
      };
      const mockResult = {
        response: { text: () => JSON.stringify(mockJson) }
      };
      mockGenAI.getGenerativeModel().generateContent.mockResolvedValue(mockResult);

      const directions = await gemini.getGeminiDirections('Gate A', 'Block B');
      
      expect(directions).toEqual(mockJson);
    });

    it('handles markdown wrapped JSON responses correctly', async () => {
      const mockJson = { time: '5m', dist: '100m', steps: ['Go'] };
      const mockResult = {
        response: { text: () => '```json\n' + JSON.stringify(mockJson) + '\n```' }
      };
      mockGenAI.getGenerativeModel().generateContent.mockResolvedValue(mockResult);

      const directions = await gemini.getGeminiDirections('A', 'B');
      expect(directions).toEqual(mockJson);
    });

    it('returns null if all models fail', async () => {
      mockGenAI.getGenerativeModel().generateContent.mockRejectedValue(new Error('Network error'));

      const directions = await gemini.getGeminiDirections('A', 'B');
      expect(directions).toBeNull();
    });
  });
});

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

type AvailabilityStatus = 'unavailable' | 'downloadable' | 'downloading' | 'available';

interface SummarizerAvailability {
  status: AvailabilityStatus;
  isReady: boolean;
}

interface UseSummarizerApiReturn {
  availability: SummarizerAvailability;
  isLoading: boolean;
  error: string | null;
  downloadProgress: number;
  checkAvailability: () => Promise<void>;
  initializeSummarizer: () => Promise<void>;
  summarizeStreaming: (text: string, onChunk: (chunk: string) => void, context?: string) => Promise<void>;
  summarize: (text: string, context?: string) => Promise<string>;
}

export function useSummarizerApi(): UseSummarizerApiReturn {
  const [availability, setAvailability] = useState<SummarizerAvailability>({ status: 'unavailable', isReady: false });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const summarizerRef = useRef<any>(null);
  const { language } = useLanguage();

  const checkAvailability = useCallback(async () => {
    try {
      if (!('Summarizer' in (window as any))) {
        setAvailability({ status: 'unavailable', isReady: false });
        return;
      }
      const status = await (window as any).Summarizer.availability({
        expectedInputLanguages: ['en', language],
        outputLanguage: language,
        expectedContextLanguages: ['en']
      });
      setAvailability({ status, isReady: status === 'available' });
    } catch (e) {
      console.error('Summarizer: availability check failed', e);
      setAvailability({ status: 'unavailable', isReady: false });
    }
  }, [language]);

  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  const initializeSummarizer = useCallback(async () => {
    if (!('Summarizer' in (window as any))) {
      throw new Error('Summarizer API not available');
    }

    setIsLoading(true);
    setError(null);
    setDownloadProgress(0);

    try {
      const summarizer = await (window as any).Summarizer.create({
        type: 'key-points',
        format: 'markdown',
        length: 'medium',
        expectedInputLanguages: ['en', language],
        outputLanguage: language,
        expectedContextLanguages: ['en'],
        monitor(m: any) {
          m.addEventListener('downloadprogress', (e: any) => {
            const progress = (e.loaded || 0) * 100;
            setDownloadProgress(progress);
          });
        }
      });
      summarizerRef.current = summarizer;
      await checkAvailability();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to initialize Summarizer';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, [checkAvailability, language]);

  const summarizeStreaming = useCallback(async (text: string, onChunk: (chunk: string) => void, context?: string) => {
    if (!summarizerRef.current) {
      throw new Error('Summarizer not initialized');
    }

    try {
      const stream = summarizerRef.current.summarizeStreaming(text, context ? { context } : undefined);
      for await (const chunk of stream) {
        onChunk(String(chunk));
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to run streaming summarize';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const summarize = useCallback(async (text: string, context?: string): Promise<string> => {
    if (!summarizerRef.current) {
      throw new Error('Summarizer not initialized');
    }

    try {
      const result = await summarizerRef.current.summarize(text, context ? { context } : undefined);
      return String(result);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to run summarize';
      setError(message);
      throw new Error(message);
    }
  }, []);

  return {
    availability,
    isLoading,
    error,
    downloadProgress,
    checkAvailability,
    initializeSummarizer,
    summarizeStreaming,
    summarize
  };
}



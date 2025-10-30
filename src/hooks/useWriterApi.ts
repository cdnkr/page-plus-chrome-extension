import { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

type AvailabilityStatus = 'unavailable' | 'downloadable' | 'downloading' | 'available';

interface WriterAvailability {
  status: AvailabilityStatus;
  isReady: boolean;
}

interface UseWriterApiReturn {
  availability: WriterAvailability;
  isLoading: boolean;
  error: string | null;
  downloadProgress: number;
  checkAvailability: () => Promise<void>;
  initializeWriter: () => Promise<void>;
  writeStreaming: (prompt: string, onChunk: (chunk: string) => void, context?: string) => Promise<void>;
  write: (prompt: string, context?: string) => Promise<string>;
}

export function useWriterApi(): UseWriterApiReturn {
  const [availability, setAvailability] = useState<WriterAvailability>({ status: 'unavailable', isReady: false });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const writerRef = useRef<any>(null);
  const { language } = useLanguage();

  const checkAvailability = useCallback(async () => {
    try {
      if (!('Writer' in (window as any))) {
        setAvailability({ status: 'unavailable', isReady: false });
        return;
      }
      const status = await (window as any).Writer.availability({
        expectedInputLanguages: ['en', language],
        expectedContextLanguages: ['en', language],
        outputLanguage: language,
      });
      setAvailability({ status, isReady: status === 'available' });
    } catch (e) {
      console.error('Writer: availability check failed', e);
      setAvailability({ status: 'unavailable', isReady: false });
    }
  }, [language]);

  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  const initializeWriter = useCallback(async () => {
    if (!('Writer' in (window as any))) {
      throw new Error('Writer API not available');
    }

    setIsLoading(true);
    setError(null);
    setDownloadProgress(0);

    try {
      const writer = await (window as any).Writer.create({
        tone: 'neutral',
        format: 'markdown',
        length: 'medium',
        expectedInputLanguages: ['en', language],
        expectedContextLanguages: ['en', language],
        outputLanguage: language,
        monitor(m: any) {
          m.addEventListener('downloadprogress', (e: any) => {
            const progress = (e.loaded || 0) * 100;
            setDownloadProgress(progress);
          });
        }
      });
      writerRef.current = writer;
      await checkAvailability();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to initialize Writer';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, [checkAvailability, language]);

  const writeStreaming = useCallback(async (prompt: string, onChunk: (chunk: string) => void, context?: string) => {
    if (!writerRef.current) {
      throw new Error('Writer not initialized');
    }

    try {
      const stream = writerRef.current.writeStreaming(prompt, context ? { context } : undefined);
      for await (const chunk of stream) {
        onChunk(String(chunk));
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to run streaming write';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const write = useCallback(async (prompt: string, context?: string): Promise<string> => {
    if (!writerRef.current) {
      throw new Error('Writer not initialized');
    }

    try {
      const result = await writerRef.current.write(prompt, context ? { context } : undefined);
      return String(result);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to run write';
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
    initializeWriter,
    writeStreaming,
    write
  };
}


import { useState, useCallback, useRef, useEffect } from "react";
import type { GrokArticle } from "../components/GrokCard";

const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve();
    img.onerror = reject;
  });
};

// Fisher-Yates shuffle algorithm for better randomization
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Get random sample without replacement
const getRandomSample = (array: string[], sampleSize: number, exclude: Set<string> = new Set()): string[] => {
  const available = array.filter(item => !exclude.has(item));
  if (available.length <= sampleSize) {
    return shuffleArray(available);
  }

  const shuffled = shuffleArray(available);
  return shuffled.slice(0, sampleSize);
};

// Parse HTML content to extract article data
const parseGrokipediaArticle = (htmlContent: string, filename: string): GrokArticle | null => {
  try {
    // Extract title from h1 tag
    const titleMatch = htmlContent.match(/<h1[^>]*>([^<]+)<\/h1>/);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : filename.replace('grokipedia.com_page_', '').replace('.html', '').replace(/_/g, ' ');

    // Extract description from meta description
    const descMatch = htmlContent.match(/<meta name="description" content="([^"]+)"/);
    const description = descMatch ? descMatch[1] : '';

    // Extract main content from span elements with the content class
    const contentMatches = htmlContent.match(/<span class="mb-4 block break-words text-\[1em\] leading-7"[^>]*>(.*?)<\/span>/g);
    let extract = '';

    if (contentMatches) {
      extract = contentMatches
        .map(match => {
          // Remove HTML tags and clean up the text
          return match
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/&[^;]+;/g, ' ') // Replace HTML entities
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
        })
        .filter(text => text.length > 50) // Only keep substantial paragraphs
        .slice(0, 3) // Take first 3 substantial paragraphs
        .join(' ');
    }

    // Fallback to description if no content found
    if (!extract && description) {
      extract = description;
    }

    // Generate a simple thumbnail URL (using a placeholder service)
    const thumbnail = {
      source: `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 1000)}`,
      width: 800,
      height: 600
    };

    // Create article URL
    const slug = filename.replace('grokipedia.com_page_', '').replace('.html', '');
    const url = `https://grokipedia.com/page/${slug}`;

    return {
      title,
      displaytitle: title,
      extract: extract || description || 'No content available',
      pageid: Math.random(),
      thumbnail,
      url
    };
  } catch (error) {
    console.error('Error parsing article:', filename, error);
    return null;
  }
};

// Cache for offline support
const offlineCache = new Map<string, string>();

// Load random articles from local HTML files with offline caching
const loadLocalArticles = async (
  shownArticles: Set<string>,
  batchSize: number = 30
): Promise<GrokArticle[]> => {
  try {
    // Get list of HTML files from the data directory
    const response = await fetch('/data/files.json');
    if (!response.ok) {
      throw new Error('Could not load file list');
    }
    const allFiles = await response.json();

    // Get random sample of files, excluding already shown ones
    const selectedFiles = getRandomSample(allFiles, batchSize, shownArticles);

    const articles: GrokArticle[] = [];

    // Load and parse each selected HTML file with offline caching
    for (const filename of selectedFiles) {
      try {
        let htmlContent: string;

        // Try to get from cache first
        if (offlineCache.has(filename)) {
          htmlContent = offlineCache.get(filename)!;
        } else {
          const htmlResponse = await fetch(`/data/${filename}`);
          if (htmlResponse.ok) {
            htmlContent = await htmlResponse.text();
            // Cache for offline use
            offlineCache.set(filename, htmlContent);
          } else {
            console.warn(`Failed to load ${filename}: ${htmlResponse.status}`);
            continue;
          }
        }

        const article = parseGrokipediaArticle(htmlContent, filename);
        if (article) {
          articles.push(article);
          // Track this article as shown
          shownArticles.add(filename);
        }
      } catch (error) {
        console.warn(`Failed to load ${filename}:`, error);
        // Try to use cached version if network fails
        if (offlineCache.has(filename)) {
          const cachedContent = offlineCache.get(filename)!;
          const article = parseGrokipediaArticle(cachedContent, filename);
          if (article) {
            articles.push(article);
            shownArticles.add(filename);
          }
        }
      }
    }

    return articles;
  } catch (error) {
    console.error('Error loading local articles:', error);
    // Fallback to mock data
    return [
      {
        title: "Sample Article",
        displaytitle: "Sample Article",
        extract: "This is a sample article from the Grokipedia collection. The full content would be displayed here from the local HTML files.",
        pageid: Math.random(),
        thumbnail: {
          source: "https://picsum.photos/800/600?random=1",
          width: 800,
          height: 600
        },
        url: "https://grokipedia.com/sample"
      }
    ];
  }
};

export function useGrokArticles() {
  const [articles, setArticles] = useState<GrokArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [buffer, setBuffer] = useState<GrokArticle[]>([]);
  const [reserveBuffer, setReserveBuffer] = useState<GrokArticle[]>([]);
  const shownArticlesRef = useRef<Set<string>>(new Set());
  const scrollSpeedRef = useRef<number>(0);
  const lastScrollTimeRef = useRef<number>(Date.now());

  // Dynamic batch sizing based on scroll speed
  const getDynamicBatchSize = useCallback(() => {
    const speed = scrollSpeedRef.current;

    // If scrolling fast, load more articles
    if (speed > 2) return 50; // Fast scrolling
    if (speed > 1) return 40; // Medium scrolling
    return 30; // Normal scrolling
  }, []);

  const fetchArticles = async (
    forBuffer = false,
    forReserve = false,
    customBatchSize?: number
  ) => {
    if (loading) return;
    setLoading(true);

    try {
      const batchSize = customBatchSize || getDynamicBatchSize();
      const newArticles = await loadLocalArticles(shownArticlesRef.current, batchSize);

      // Preload images with timeout to prevent hanging
      const imagePromises = newArticles
        .filter((article) => article.thumbnail)
        .map((article) =>
          Promise.race([
            preloadImage(article.thumbnail!.source),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Image preload timeout')), 3000)
            )
          ])
        );

      await Promise.allSettled(imagePromises);

      if (forReserve) {
        setReserveBuffer((prev) => [...prev, ...newArticles]);
      } else if (forBuffer) {
        setBuffer((prev) => [...prev, ...newArticles]);
        // Pre-fill reserve buffer for ultra-smooth scrolling
        if (reserveBuffer.length < 20) {
          fetchArticles(false, true, Math.floor(batchSize / 2));
        }
      } else {
        setArticles((prev) => [...prev, ...newArticles]);
        // Maintain both buffers
        fetchArticles(true, false, batchSize);
        if (reserveBuffer.length < 15) {
          fetchArticles(false, true, Math.floor(batchSize / 2));
        }
      }
    } catch (error) {
      console.error("Error fetching articles:", error);
    }

    setLoading(false);
  };

  const getMoreArticles = useCallback(() => {
    // Priority: buffer -> reserve buffer -> fresh load
    if (buffer.length > 0) {
      setArticles((prev) => [...prev, ...buffer]);
      setBuffer([]);

      // Refill buffer from reserve if available
      if (reserveBuffer.length > 10) {
        const reserveBatch = reserveBuffer.slice(0, 20);
        setReserveBuffer((prev) => prev.slice(20));
        setBuffer(reserveBatch);
      } else {
        // Refill both buffers
        fetchArticles(true);
        fetchArticles(false, true);
      }
    } else if (reserveBuffer.length > 0) {
      // Use reserve buffer directly
      const reserveBatch = reserveBuffer.slice(0, 25);
      setReserveBuffer((prev) => prev.slice(25));
      setArticles((prev) => [...prev, ...reserveBatch]);

      // Refill buffers
      fetchArticles(true);
      fetchArticles(false, true);
    } else {
      // Emergency load
      fetchArticles(false);
    }
  }, [buffer, reserveBuffer]);

  // Track scroll speed for dynamic batch sizing
  const updateScrollSpeed = useCallback((scrollDelta: number) => {
    const now = Date.now();
    const timeDiff = Math.max(now - lastScrollTimeRef.current, 1);
    scrollSpeedRef.current = Math.abs(scrollDelta) / timeDiff;
    lastScrollTimeRef.current = now;
  }, []);

  // Memory management: cleanup old articles to prevent memory leaks
  useEffect(() => {
    if (articles.length > 200) { // Keep max 200 articles in memory
      setArticles((prev) => prev.slice(-150)); // Keep last 150, remove oldest 50
    }
  }, [articles.length]);

  return {
    articles,
    loading,
    fetchArticles: getMoreArticles,
    updateScrollSpeed
  };
}

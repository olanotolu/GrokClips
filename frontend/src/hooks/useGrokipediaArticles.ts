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

    // Extract main content from various span and paragraph elements
    // Look for content spans with different class patterns
    const contentSelectors = [
      /<span class="[^"]*text-\[[^\]]+\][^"]*"[^>]*>(.*?)<\/span>/g,
      /<p[^>]*>(.*?)<\/p>/g,
      /<div class="[^"]*content[^"]*"[^>]*>(.*?)<\/div>/g,
      /<article[^>]*>(.*?)<\/article>/g
    ];

    let extract = '';

    for (const selector of contentSelectors) {
      const matches = htmlContent.match(selector);
      if (matches && matches.length > 0) {
        const contentParts = matches
          .map(match => {
            // Remove HTML tags and clean up the text
            return match
              .replace(/<[^>]*>/g, '') // Remove HTML tags
              .replace(/&[^;]+;/g, ' ') // Replace HTML entities
              .replace(/\s+/g, ' ') // Normalize whitespace
              .trim();
          })
          .filter(text => text.length > 20 && !text.includes('http') && !text.includes('@')) // Filter out links and short fragments
          .slice(0, 3); // Take first 3 substantial paragraphs

        if (contentParts.length > 0) {
          extract = contentParts.join(' ');
          break;
        }
      }
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

    // Skip if we can't extract meaningful content
    if (!extract || extract.length < 10) {
      console.warn(`Skipping article ${filename} - insufficient content`);
      return null;
    }

    return {
      title,
      displaytitle: title,
      extract: extract.substring(0, 300) + (extract.length > 300 ? '...' : ''), // Limit extract length
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
  const [_loading, _setLoading] = useState(false);
  const [_buffer, setBuffer] = useState<GrokArticle[]>([]);
  const [_reserveBuffer, setReserveBuffer] = useState<GrokArticle[]>([]);
  const shownArticlesRef = useRef<Set<string>>(new Set());
  const scrollSpeedRef = useRef<number>(0);
  const lastScrollTimeRef = useRef<number>(Date.now());

  // Smart loading controls
  const loadingRef = useRef(false);
  const lastLoadTimeRef = useRef(0);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isNearBottomRef = useRef(false);

  // Dynamic batch sizing based on scroll speed
  const getDynamicBatchSize = useCallback(() => {
    const speed = scrollSpeedRef.current;

    // If scrolling fast, load more articles
    if (speed > 2) return 50; // Fast scrolling
    if (speed > 1) return 40; // Medium scrolling
    return 30; // Normal scrolling
  }, []);

  // Smart loading: Prevent excessive loading with debouncing
  const smartLoadArticles = useCallback((targetBuffer = false, targetReserve = false, batchSize?: number) => {
    const now = Date.now();
    const timeSinceLastLoad = now - lastLoadTimeRef.current;

    // Don't load if already loading
    if (loadingRef.current) return;

    // Don't load too frequently (minimum 500ms between loads)
    if (timeSinceLastLoad < 500) {
      // Cancel existing timeout and schedule new one
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
      loadTimeoutRef.current = setTimeout(() => {
        smartLoadArticles(targetBuffer, targetReserve, batchSize);
      }, 500 - timeSinceLastLoad);
      return;
    }

    // Only load if near bottom or explicitly requested
    if (!targetBuffer && !targetReserve && !isNearBottomRef.current) {
      return;
    }

    loadingRef.current = true;
    lastLoadTimeRef.current = now;

    fetchArticles(targetBuffer, targetReserve, batchSize).finally(() => {
      loadingRef.current = false;
    });
  }, []);

  const fetchArticles = async (
    forBuffer = false,
    forReserve = false,
    customBatchSize?: number
  ) => {
    try {
      const batchSize = customBatchSize || getDynamicBatchSize();
      const newArticles = await loadLocalArticles(shownArticlesRef.current, batchSize);

      if (newArticles.length === 0) {
        // No more articles available
        return;
      }

      // Preload images with timeout to prevent hanging
      const imagePromises = newArticles
        .filter((article) => article.thumbnail)
        .map((article) =>
          Promise.race([
            preloadImage(article.thumbnail!.source),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Image preload timeout')), 2000)
            )
          ])
        );

      // Don't wait for all images, just start them
      Promise.allSettled(imagePromises).catch(() => {
        // Silently handle image loading errors
      });

      if (forReserve) {
        setReserveBuffer((prev) => [...prev, ...newArticles]);
      } else if (forBuffer) {
        setBuffer((prev) => [...prev, ...newArticles]);
      } else {
        setArticles((prev) => [...prev, ...newArticles]);
        // Smart buffer management - only fill if critically low
        setTimeout(() => {
          setBuffer((currentBuffer) => {
            if (currentBuffer.length < 5) { // Reduced threshold
              smartLoadArticles(true, false, Math.floor(batchSize * 0.8));
            }
            return currentBuffer;
          });
          setReserveBuffer((currentReserve) => {
            if (currentReserve.length < 3) { // Reduced threshold
              smartLoadArticles(false, true, Math.floor(batchSize * 0.5));
            }
            return currentReserve;
          });
        }, 200); // Increased delay
      }
    } catch (error) {
      console.error("Error fetching articles:", error);
    }
  };

  const getMoreArticles = useCallback(() => {
    // Priority: buffer -> reserve buffer -> fresh load
    setBuffer((currentBuffer) => {
      if (currentBuffer.length > 0) {
        setArticles((prev) => [...prev, ...currentBuffer]);
        // Refill buffer from reserve if available
        setReserveBuffer((currentReserve) => {
          if (currentReserve.length > 10) {
            const reserveBatch = currentReserve.slice(0, 20);
            // Fill buffer with reserve batch
            setBuffer(reserveBatch);
            return currentReserve.slice(20);
          } else {
            // Refill both buffers
            setTimeout(() => {
              fetchArticles(true);
              fetchArticles(false, true);
            }, 0);
            return currentReserve;
          }
        });
        return [];
      } else {
        // Check reserve buffer
        setReserveBuffer((currentReserve) => {
          if (currentReserve.length > 0) {
            // Use reserve buffer directly
            const reserveBatch = currentReserve.slice(0, 25);
            setArticles((prev) => [...prev, ...reserveBatch]);
            // Refill buffers
            setTimeout(() => {
              fetchArticles(true);
              fetchArticles(false, true);
            }, 0);
            return currentReserve.slice(25);
          } else {
            // Emergency load
            setTimeout(() => fetchArticles(false), 0);
            return currentReserve;
          }
        });
        return currentBuffer;
      }
    });
  }, []);

  // Track scroll speed for dynamic batch sizing
  const updateScrollSpeed = useCallback((scrollDelta: number) => {
    const now = Date.now();
    const timeDiff = Math.max(now - lastScrollTimeRef.current, 1);
    scrollSpeedRef.current = Math.abs(scrollDelta) / timeDiff;
    lastScrollTimeRef.current = now;
  }, []);

  // Memory management: cleanup old articles to prevent memory leaks
  useEffect(() => {
    if (articles.length > 150) { // Reduced limit for better performance
      setArticles((prev) => prev.slice(-100)); // Keep last 100, remove oldest 50
      // Also clean up shown articles set to prevent memory bloat
      setTimeout(() => {
        const shownArray = Array.from(shownArticlesRef.current);
        if (shownArray.length > 200) {
          // Keep only the most recent 150 shown articles
          const recentShown = new Set(shownArray.slice(-150));
          shownArticlesRef.current = recentShown;
        }
      }, 1000);
    }
  }, [articles.length]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, []);

  return {
    articles,
    loading: _loading,
    fetchArticles: getMoreArticles,
    fetchArticlesInternal: fetchArticles,
    updateScrollSpeed
  };
}

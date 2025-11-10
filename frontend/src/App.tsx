import { useEffect, useRef, useCallback, useState } from "react";
import { GrokCard } from "./components/GrokCard";
import { Loader2, Search, X, Download, Heart, Sun, Moon, Monitor, User, LogOut } from "lucide-react";
import { Analytics } from "@vercel/analytics/react";
import { LanguageSelector } from "./components/LanguageSelector";
import { useLikedArticles } from "./contexts/LikedArticlesContext";
import { useGrokArticles } from "./hooks/useGrokipediaArticles";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useTheme } from "./contexts/ThemeContext";
import { useAuth } from "./contexts/AuthContext";
import { AuthModal } from "./components/AuthModal";
import { SkeletonLoader } from "./components/SkeletonCard";

function App() {
  const [showAbout, setShowAbout] = useState(false);
  const [showLikes, setShowLikes] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const { articles, loading, fetchArticles, fetchArticlesInternal, updateScrollSpeed } = useGrokArticles();
  const { likedArticles, toggleLike } = useLikedArticles();
  const { theme, actualTheme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const observerTarget = useRef(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const lastScrollY = useRef(0);

  // Virtual scrolling setup
  const rowVirtualizer = useVirtualizer({
    count: articles.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => window.innerHeight, // Each article takes full screen height
    overscan: 2, // Render 2 extra items outside visible area
  });

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      // Only trigger loading if we're actually near the bottom and not already loading
      if (target.isIntersecting && !loading) {
        // Add a small delay to prevent rapid-fire loading
        setTimeout(() => {
          if (!loading) {
            fetchArticles();
          }
        }, 100);
      }
    },
    [loading, fetchArticles]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
      rootMargin: "100px",
    });

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [handleObserver]);

  // Track scroll speed for dynamic batch sizing
  useEffect(() => {
    const handleScroll = () => {
      if (parentRef.current) {
        const currentScrollY = parentRef.current.scrollTop;
        const scrollDelta = currentScrollY - lastScrollY.current;
        updateScrollSpeed(scrollDelta);
        lastScrollY.current = currentScrollY;
      }
    };

    // Throttle scroll events for performance
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    const scrollElement = parentRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', throttledScroll, { passive: true });
      return () => scrollElement.removeEventListener('scroll', throttledScroll);
    }
  }, [updateScrollSpeed]);

  // Enhanced swipe gesture handling for mobile navigation
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let isHorizontalSwipe = false;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
      isHorizontalSwipe = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartTime) return;

      const touchCurrentX = e.touches[0].clientX;
      const touchCurrentY = e.touches[0].clientY;
      const deltaX = Math.abs(touchCurrentX - touchStartX);
      const deltaY = Math.abs(touchCurrentY - touchStartY);

      // Determine if this is a horizontal swipe (for potential future features)
      if (deltaX > deltaY && deltaX > 10) {
        isHorizontalSwipe = true;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!parentRef.current || !touchStartTime) return;

      const touchEndY = e.changedTouches[0].clientY;
      const touchEndTime = Date.now();

      const deltaY = touchEndY - touchStartY;
      const deltaTime = touchEndTime - touchStartTime;

      // Enhanced swipe thresholds for better mobile experience
      const minSwipeDistance = window.innerWidth * 0.1; // 10% of screen width
      const maxSwipeTime = 500; // Increased for more natural feel
      const minVelocity = 0.3; // Minimum velocity threshold

      const distance = Math.abs(deltaY);
      const velocity = distance / deltaTime;

      // Only handle vertical swipes that aren't horizontal and meet thresholds
      if (!isHorizontalSwipe && distance > minSwipeDistance && deltaTime < maxSwipeTime && velocity > minVelocity) {
        const currentScrollTop = parentRef.current.scrollTop;
        const windowHeight = window.innerHeight;

        if (deltaY < 0) {
          // Swipe up - next article (more sensitive for mobile)
          const nextScrollTop = Math.ceil((currentScrollTop + windowHeight) / windowHeight) * windowHeight;
          parentRef.current.scrollTo({
            top: nextScrollTop,
            behavior: 'smooth'
          });
        } else {
          // Swipe down - previous article
          const prevScrollTop = Math.floor(currentScrollTop / windowHeight) * windowHeight;
          if (prevScrollTop !== currentScrollTop) {
            parentRef.current.scrollTo({
              top: prevScrollTop,
              behavior: 'smooth'
            });
          }
        }
      }

      // Reset touch tracking
      touchStartTime = 0;
      isHorizontalSwipe = false;
    };

    const scrollElement = parentRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('touchstart', handleTouchStart, { passive: true });
      scrollElement.addEventListener('touchmove', handleTouchMove, { passive: true });
      scrollElement.addEventListener('touchend', handleTouchEnd, { passive: true });

      return () => {
        scrollElement.removeEventListener('touchstart', handleTouchStart);
        scrollElement.removeEventListener('touchmove', handleTouchMove);
        scrollElement.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, []);

  // Keyboard navigation and shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Search shortcuts
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setShowSearch(true);
        return;
      }

      if (event.key === 'Escape' && showSearch) {
        setShowSearch(false);
        return;
      }

      // Navigation shortcuts (only when not in search)
      if (!showSearch && parentRef.current) {
        const windowHeight = window.innerHeight;
        const currentScrollTop = parentRef.current.scrollTop;

        switch (event.key) {
          case 'ArrowDown':
          case 'j':
          case ' ': // Spacebar
            event.preventDefault();
            parentRef.current.scrollTo({
              top: currentScrollTop + windowHeight,
              behavior: 'smooth'
            });
            break;
          case 'ArrowUp':
          case 'k':
            event.preventDefault();
            parentRef.current.scrollTo({
              top: Math.max(0, currentScrollTop - windowHeight),
              behavior: 'smooth'
            });
            break;
          case 'Home':
            event.preventDefault();
            parentRef.current.scrollTo({
              top: 0,
              behavior: 'smooth'
            });
            break;
          case 'End':
            event.preventDefault();
            parentRef.current.scrollTo({
              top: articles.length * windowHeight,
              behavior: 'smooth'
            });
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showSearch, articles.length]);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Smart initial load - load enough for smooth scrolling
    fetchArticlesInternal(false, false, 20); // Load 20 articles initially
    // Pre-fill buffers immediately after
    setTimeout(() => {
      fetchArticlesInternal(true, false, 15); // Buffer
      fetchArticlesInternal(false, true, 10); // Reserve
    }, 500);
  }, []);

  const filteredLikedArticles = likedArticles.filter(
    (article) =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.extract.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExport = () => {
    const simplifiedArticles = likedArticles.map((article) => ({
      title: article.title,
      url: article.url,
      extract: article.extract,
      thumbnail: article.thumbnail?.source || null,
    }));

    const dataStr = JSON.stringify(simplifiedArticles, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `grokclips-favorites-${new Date().toISOString().split("T")[0]
      }.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="h-screen w-full" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Minimalist Header */}
      <div
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b"
        style={{
          backgroundColor: 'var(--glass-bg)',
          borderColor: 'var(--border-primary)'
        }}
      >
        {/* Offline Indicator */}
        {!isOnline && (
          <div
            className="absolute top-full left-0 right-0 py-1 px-4 text-center text-sm font-medium"
            style={{
              backgroundColor: actualTheme === 'dark' ? '#dc2626' : '#ef4444',
              color: '#ffffff'
            }}
          >
            🔴 You're offline - Using cached articles
          </div>
        )}

        <div className="max-w-screen-xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <button
              onClick={() => window.location.reload()}
              className="text-xl sm:text-2xl font-bold transition-all duration-300 transform hover:scale-105 active:scale-95"
              style={{
                color: 'var(--text-primary)',
                filter: actualTheme === 'dark' ? 'brightness(1.1)' : 'brightness(0.9)'
              }}
            >
              GrokClips
            </button>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="group relative p-3 sm:p-3 rounded-full backdrop-blur-sm border transition-all duration-300 transform hover:scale-110 active:scale-95 touch-manipulation"
                style={{
                  backgroundColor: 'var(--hover-bg)',
                  borderColor: 'var(--border-secondary)',
                  color: 'var(--text-primary)',
                  minHeight: '44px',
                  minWidth: '44px',
                }}
                aria-label="Search articles (⌘K)"
                title="Search articles (⌘K)"
              >
                <Search className="w-5 h-5" />
                <div
                  className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap hidden sm:block"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)'
                  }}
                >
                  ⌘K
                </div>
              </button>
              <button
                onClick={() => {
                  const nextTheme = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark';
                  setTheme(nextTheme);
                }}
                className="group relative p-3 rounded-full backdrop-blur-sm border transition-all duration-300 transform hover:scale-110 active:scale-95 touch-manipulation"
                style={{
                  backgroundColor: 'var(--hover-bg)',
                  borderColor: 'var(--border-secondary)',
                  color: 'var(--text-primary)',
                  minHeight: '44px',
                  minWidth: '44px',
                }}
                aria-label={`Current theme: ${theme}. Click to cycle themes`}
                title={`Current theme: ${theme}. Click to cycle themes`}
              >
                {theme === 'dark' && <Moon className="w-5 h-5" />}
                {theme === 'light' && <Sun className="w-5 h-5" />}
                {theme === 'system' && <Monitor className="w-5 h-5" />}
                <div
                  className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap hidden sm:block"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)'
                  }}
                >
                  {theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'System'}
                </div>
              </button>

              {/* Authentication Button */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowAuth(!showAuth)}
                    className="group relative p-3 rounded-full backdrop-blur-sm border transition-all duration-300 transform hover:scale-110 active:scale-95 touch-manipulation"
                    style={{
                      backgroundColor: 'var(--hover-bg)',
                      borderColor: 'var(--border-secondary)',
                      color: 'var(--text-primary)',
                      minHeight: '44px',
                      minWidth: '44px',
                    }}
                    aria-label="User account"
                    title="User account"
                  >
                    <User className="w-5 h-5" />
                  </button>

                  {showAuth && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50 animate-in fade-in duration-200">
                      <div className="p-2">
                        <div className="px-3 py-2 border-b border-white/10">
                          <p className="text-sm text-white font-medium truncate">
                            {user.email}
                          </p>
                          <p className="text-xs text-gray-400">
                            Signed in
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            signOut()
                            setShowAuth(false)
                          }}
                          className="w-full flex items-center gap-3 px-3 py-3 text-left text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 active:scale-95 touch-manipulation"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="text-sm">Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowAuth(true)}
                  className="px-3 sm:px-4 py-2 text-sm font-medium rounded-full backdrop-blur-sm border transition-all duration-300 active:scale-95 touch-manipulation"
                  style={{
                    color: 'var(--text-secondary)',
                    backgroundColor: 'var(--hover-bg)',
                    borderColor: 'var(--border-primary)',
                    minHeight: '40px',
                    minWidth: '60px',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                >
                  <span className="hidden sm:inline">Sign In</span>
                  <span className="sm:hidden">👤</span>
                </button>
              )}

              <button
                onClick={() => setShowAbout(!showAbout)}
                className="px-3 sm:px-4 py-2 text-sm font-medium rounded-full backdrop-blur-sm border transition-all duration-300 active:scale-95 touch-manipulation"
                style={{
                  color: 'var(--text-secondary)',
                  backgroundColor: 'var(--hover-bg)',
                  borderColor: 'var(--border-primary)',
                  minHeight: '40px',
                  minWidth: '60px',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                <span className="hidden sm:inline">About</span>
                <span className="sm:hidden">?</span>
              </button>
              <button
                onClick={() => setShowLikes(!showLikes)}
                className="px-3 sm:px-4 py-2 text-sm font-medium rounded-full backdrop-blur-sm border transition-all duration-300 active:scale-95 touch-manipulation"
                style={{
                  color: 'var(--text-secondary)',
                  backgroundColor: 'var(--hover-bg)',
                  borderColor: 'var(--border-primary)',
                  minHeight: '40px',
                  minWidth: '60px',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                <span className="hidden sm:inline">Likes</span>
                <span className="sm:hidden">♥</span>
              </button>
              <div
                className="backdrop-blur-sm rounded-full border"
                style={{
                  backgroundColor: 'var(--hover-bg)',
                  borderColor: 'var(--border-primary)'
                }}
              >
                <LanguageSelector />
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAbout && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 rounded-2xl max-w-md relative overflow-hidden">
            <div className="relative z-10 p-8">
              <button
                onClick={() => setShowAbout(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
              >
                ✕
              </button>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  About GrokClips
                </h2>
                <div className="w-16 h-1 bg-white/50 rounded-full mx-auto"></div>
              </div>
              <p className="text-gray-300 mb-6 leading-relaxed">
                A minimalist interface for exploring local Grokipedia articles.
              </p>
              <div className="space-y-3 text-sm">
                <p className="text-gray-400">
                  Made with ❤️ by{" "}
                  <a
                    href="https://x.com/olanotolu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    @olanotolu
                  </a>
                </p>
                <p className="text-gray-400">
                  Check out the code on{" "}
                  <a
                    href="https://github.com/olanotolu/GrokClips"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    GitHub
                  </a>
                </p>
                <p className="text-gray-400">
                  Enjoy this project?{" "}
                  <a
                    href="https://ko-fi.com/olaoluwasubomi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    Buy me a coffee ☕
                  </a>
                </p>
              </div>
            </div>
          </div>
          <div
            className="absolute inset-0 -z-10"
            onClick={() => setShowAbout(false)}
          ></div>
        </div>
      )}

      {showLikes && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-300">
          <div className="bg-black/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 rounded-2xl w-full max-w-2xl h-[90vh] sm:h-[85vh] flex flex-col relative overflow-hidden">
            <div className="relative z-10 p-4 sm:p-6">
              <button
                onClick={() => setShowLikes(false)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200 active:scale-95 touch-manipulation"
                style={{ minHeight: '44px', minWidth: '44px' }}
              >
                ✕
              </button>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    Liked Articles
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">
                    {likedArticles.length} article{likedArticles.length !== 1 ? 's' : ''} saved
                  </p>
                </div>
                {likedArticles.length > 0 && (
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white/10 hover:bg-white/20 text-white rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 touch-manipulation self-start sm:self-auto"
                    style={{ minHeight: '40px' }}
                    title="Export liked articles"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Export</span>
                    <span className="sm:hidden">Save</span>
                  </button>
                )}
              </div>

              <div className="relative mb-4 sm:mb-6">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your liked articles..."
                  className="w-full bg-black/50 border border-gray-700 text-white px-4 py-4 sm:py-3 pl-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200 placeholder-gray-400 text-base"
                  style={{ minHeight: '48px' }}
                />
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                {filteredLikedArticles.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Heart className="w-8 h-8 text-gray-500" />
                    </div>
                    <p className="text-gray-400">
                      {searchQuery ? "No matches found." : "No liked articles yet."}
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      {searchQuery ? "Try a different search term" : "Double-click articles to like them!"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredLikedArticles.map((article, index) => (
                      <div
                        key={`${article.pageid}-${Date.now()}`}
                        className="group bg-gray-900/30 border border-gray-700/50 rounded-xl p-3 sm:p-4 hover:bg-gray-900/50 hover:border-gray-600/50 transition-all duration-200 active:scale-98 touch-manipulation"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex gap-3 sm:gap-4">
                          {article.thumbnail && (
                            <div className="flex-shrink-0">
                              <img
                                src={article.thumbnail.source}
                                alt={article.title}
                                className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg shadow-md"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-2">
                              <a
                                href={article.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-white hover:text-gray-200 transition-colors line-clamp-2 pr-2 text-sm sm:text-base active:scale-95 touch-manipulation"
                              >
                                {article.title}
                              </a>
                              <button
                                onClick={() => toggleLike(article)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/20 p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 sm:opacity-100 flex-shrink-0"
                                style={{ minHeight: '36px', minWidth: '36px' }}
                                aria-label="Remove from likes"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed">
                              {article.extract}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div
            className="absolute inset-0 -z-10"
            onClick={() => setShowLikes(false)}
          ></div>
        </div>
      )}

      {showSearch && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-300">
          <div className="bg-black/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 rounded-2xl w-full max-w-2xl h-[85vh] sm:h-[80vh] flex flex-col relative overflow-hidden">
            <div className="relative z-10 p-4 sm:p-6">
              <button
                onClick={() => setShowSearch(false)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200 active:scale-95 touch-manipulation"
                style={{ minHeight: '44px', minWidth: '44px' }}
              >
                ✕
              </button>

              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    Search Articles
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">
                    {globalSearchQuery
                      ? `${articles.filter((article) =>
                          article.title.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                          article.extract.toLowerCase().includes(globalSearchQuery.toLowerCase())
                        ).length} results found`
                      : "Find articles by title or content"
                    }
                  </p>
                </div>
                {globalSearchQuery && (
                  <button
                    onClick={() => setGlobalSearchQuery("")}
                    className="text-sm text-gray-400 hover:text-white transition-colors active:scale-95 touch-manipulation px-3 py-2"
                  >
                    Clear search
                  </button>
                )}
              </div>

              <div className="relative mb-4 sm:mb-6">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  value={globalSearchQuery}
                  onChange={(e) => setGlobalSearchQuery(e.target.value)}
                  placeholder="Search articles..."
                  className="w-full bg-black/50 border border-gray-700 text-white px-4 py-4 sm:py-3 pl-10 pr-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200 placeholder-gray-400 text-base"
                  style={{ minHeight: '48px' }}
                  autoFocus
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 hidden sm:block">
                  ⌘K
                </div>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                {globalSearchQuery ? (
                  <div className="space-y-3">
                    {articles
                      .filter((article) =>
                        article.title.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                        article.extract.toLowerCase().includes(globalSearchQuery.toLowerCase())
                      )
                      .slice(0, 50) // Limit results for performance
                      .map((article, index) => (
                        <div
                          key={`${article.pageid}-search`}
                          className="group bg-gray-900/30 border border-gray-700/50 rounded-xl p-4 hover:bg-gray-900/50 hover:border-gray-600/50 transition-all duration-200 cursor-pointer"
                          style={{ animationDelay: `${index * 50}ms` }}
                          onClick={() => {
                            // Scroll to the article in the main feed
                            const articleElement = document.querySelector(`[data-article-id="${article.pageid}"]`);
                            if (articleElement) {
                              articleElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              setShowSearch(false);
                            }
                          }}
                        >
                          <div className="flex gap-4">
                            {article.thumbnail && (
                              <div className="flex-shrink-0">
                                <img
                                  src={article.thumbnail.source}
                                  alt={article.title}
                                  className="w-16 h-16 object-cover rounded-lg shadow-md"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-white mb-2 line-clamp-2 pr-2">
                                {article.title}
                              </h3>
                              <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed">
                                {article.extract}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    {articles.filter((article) =>
                      article.title.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                      article.extract.toLowerCase().includes(globalSearchQuery.toLowerCase())
                    ).length === 0 && (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Search className="w-8 h-8 text-gray-500" />
                        </div>
                        <p className="text-gray-400">
                          No articles found for "{globalSearchQuery}"
                        </p>
                        <p className="text-gray-500 text-sm mt-1">
                          Try different keywords or load more articles
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-gray-500" />
                    </div>
                    <p className="text-gray-400">
                      Start typing to search through articles
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      Search by title or content
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div
            className="absolute inset-0 -z-10"
            onClick={() => setShowSearch(false)}
          ></div>
        </div>
      )}

      {/* Virtual Scrolling Container */}
      <div
        ref={parentRef}
        className="h-screen w-full overflow-auto snap-y snap-mandatory hide-scroll mobile-scroll"
        style={{ contain: 'strict' }}
      >
        {articles.length === 0 ? (
          // Show skeleton loader when no articles at all
          <SkeletonLoader count={5} />
        ) : (
          // Show virtualized articles when available
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
              const article = articles[virtualItem.index];
              return (
                <div
                  key={article.pageid}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <GrokCard article={article} />
                </div>
              );
            })}
          </div>
        )}

        {/* Intersection Observer Target for Loading More */}
        <div
          ref={observerTarget}
          className="h-10 -mt-1"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
          }}
        />
      </div>
      {loading && articles.length > 0 && (
        <div className="fixed bottom-4 right-4 z-40">
          <div
            className="backdrop-blur-xl border rounded-2xl p-4 shadow-2xl"
            style={{
              backgroundColor: 'var(--glass-bg)',
              borderColor: 'var(--glass-border)',
              boxShadow: actualTheme === 'dark'
                ? '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                : '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
          >
            <div className="flex items-center gap-3">
              <Loader2
                className="h-6 w-6 animate-spin"
                style={{ color: 'var(--text-primary)' }}
              />
              <div>
                <p
                  className="font-medium text-sm"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Loading more articles...
                </p>
                <p
                  className="text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {articles.length} loaded
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuth && !user}
        onClose={() => setShowAuth(false)}
        initialMode="signin"
      />

      <Analytics />
    </div>
  );
}

export default App;

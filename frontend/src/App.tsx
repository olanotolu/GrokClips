import { useEffect, useRef, useCallback, useState } from "react";
import { GrokCard } from "./components/GrokCard";
import { Loader2, Search, X, Download, Heart } from "lucide-react";
import { Analytics } from "@vercel/analytics/react";
import { LanguageSelector } from "./components/LanguageSelector";
import { useLikedArticles } from "./contexts/LikedArticlesContext";
import { useGrokArticles } from "./hooks/useGrokipediaArticles";

function App() {
  const [showAbout, setShowAbout] = useState(false);
  const [showLikes, setShowLikes] = useState(false);
  const { articles, loading, fetchArticles, updateScrollSpeed } = useGrokArticles();
  const { likedArticles, toggleLike } = useLikedArticles();
  const observerTarget = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const lastScrollY = useRef(0);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && !loading) {
        fetchArticles();
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
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY.current;
      updateScrollSpeed(scrollDelta);
      lastScrollY.current = currentScrollY;
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

    window.addEventListener('scroll', throttledScroll, { passive: true });
    return () => window.removeEventListener('scroll', throttledScroll);
  }, [updateScrollSpeed]);

  // Keyboard shortcut for search (Cmd+K on Mac, Ctrl+K on Windows/Linux)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setShowSearch(true);
      }
      if (event.key === 'Escape' && showSearch) {
        setShowSearch(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showSearch]);

  useEffect(() => {
    fetchArticles();
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
    <div className="h-screen w-full bg-black text-white overflow-y-scroll snap-y snap-mandatory hide-scroll">
      {/* Minimalist Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-screen-xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <button
              onClick={() => window.location.reload()}
              className="text-2xl font-bold text-white hover:text-gray-200 transition-all duration-300 transform hover:scale-105"
            >
              GrokClips
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="group relative p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-300 transform hover:scale-110"
                aria-label="Search articles (⌘K)"
                title="Search articles (⌘K)"
              >
                <Search className="w-5 h-5" />
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                  ⌘K
                </div>
              </button>
              <button
                onClick={() => setShowAbout(!showAbout)}
                className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300"
              >
                About
              </button>
              <button
                onClick={() => setShowLikes(!showLikes)}
                className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300"
              >
                Likes
              </button>
              <div className="bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
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
                    href="https://x.com/Aizkmusic"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    @Aizkmusic
                  </a>
                </p>
                <p className="text-gray-400">
                  Check out the code on{" "}
                  <a
                    href="https://github.com/IsaacGemal/grokclips"
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
                    href="https://buymeacoffee.com/aizk"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-black/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 rounded-2xl w-full max-w-2xl h-[85vh] flex flex-col relative overflow-hidden">
            <div className="relative z-10 p-6">
              <button
                onClick={() => setShowLikes(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
              >
                ✕
              </button>

              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Liked Articles
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">
                    {likedArticles.length} article{likedArticles.length !== 1 ? 's' : ''} saved
                  </p>
                </div>
                {likedArticles.length > 0 && (
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white/10 hover:bg-white/20 text-white rounded-full transition-all duration-300 transform hover:scale-105"
                    title="Export liked articles"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                )}
              </div>

              <div className="relative mb-6">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your liked articles..."
                  className="w-full bg-black/50 border border-gray-700 text-white px-4 py-3 pl-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200 placeholder-gray-400"
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
                        className="group bg-gray-900/30 border border-gray-700/50 rounded-xl p-4 hover:bg-gray-900/50 hover:border-gray-600/50 transition-all duration-200"
                        style={{ animationDelay: `${index * 50}ms` }}
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
                            <div className="flex justify-between items-start mb-2">
                              <a
                                href={article.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-white hover:text-gray-200 transition-colors line-clamp-2 pr-2"
                              >
                                {article.title}
                              </a>
                              <button
                                onClick={() => toggleLike(article)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/20 p-1.5 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-black/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col relative overflow-hidden">
            <div className="relative z-10 p-6">
              <button
                onClick={() => setShowSearch(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
              >
                ✕
              </button>

              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">
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
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Clear search
                  </button>
                )}
              </div>

              <div className="relative mb-6">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  value={globalSearchQuery}
                  onChange={(e) => setGlobalSearchQuery(e.target.value)}
                  placeholder="Search articles..."
                  className="w-full bg-black/50 border border-gray-700 text-white px-4 py-3 pl-10 pr-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200 placeholder-gray-400"
                  autoFocus
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
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

      {articles.map((article) => (
        <GrokCard key={article.pageid} article={article} />
      ))}
      <div ref={observerTarget} className="h-10 -mt-1" />
      {loading && (
        <div className="h-screen w-full flex items-center justify-center">
          <div className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/50">
            <div className="flex items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
              <div>
                <p className="text-white font-medium">Loading articles...</p>
                <p className="text-gray-400 text-sm">Discovering local Grokipedia knowledge</p>
              </div>
            </div>
          </div>
        </div>
      )}
      <Analytics />
    </div>
  );
}

export default App;

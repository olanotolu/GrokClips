import { Share2, Heart } from 'lucide-react';
import { useState, memo, useCallback, useMemo } from 'react';
import { useLikedArticles } from '../contexts/LikedArticlesContext';
import { InlineLoader } from './SkeletonCard';

export interface GrokArticle {
    title: string;
    displaytitle: string;
    extract: string;
    pageid: number;
    url: string;
    thumbnail?: {
        source: string;
        width: number;
        height: number;
    };
}

interface GrokCardProps {
    article: GrokArticle;
}

export const GrokCard = memo(function GrokCard({ article }: GrokCardProps) {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [isLiking, setIsLiking] = useState(false);
    const { toggleLike, isLiked } = useLikedArticles();

    const handleShare = useCallback(async () => {
        setIsSharing(true);
        try {
            if (navigator.share) {
                await navigator.share({
                    title: article.displaytitle,
                    text: article.extract || '',
                    url: article.url
                });
            } else {
                // Fallback: Copy to clipboard
                await navigator.clipboard.writeText(article.url);
            }
        } catch (error) {
            console.error('Error sharing:', error);
            // Fallback: Copy to clipboard if share failed
            try {
                await navigator.clipboard.writeText(article.url);
            } catch (clipboardError) {
                console.error('Error copying to clipboard:', clipboardError);
            }
        } finally {
            setTimeout(() => setIsSharing(false), 500); // Brief feedback
        }
    }, [article.displaytitle, article.extract, article.url]);

    const handleLike = useCallback(async () => {
        setIsLiking(true);
        try {
            await toggleLike(article);
        } finally {
            setTimeout(() => setIsLiking(false), 300);
        }
    }, [article, toggleLike]);

    // Memoize computed values
    const isLikedStatus = useMemo(() => isLiked(article.pageid), [isLiked, article.pageid]);
    const imageSrc = useMemo(() => article.thumbnail?.source, [article.thumbnail?.source]);

    return (
        <div
            className="h-screen w-full flex items-center justify-center snap-start relative cursor-pointer group"
            onDoubleClick={() => toggleLike(article)}
            data-article-id={article.pageid}
        >
            <div className="h-full w-full relative overflow-hidden">
                {/* Background Image with Enhanced Loading Effects */}
                {article.thumbnail && !imageError && imageSrc ? (
                    <div className="absolute inset-0">
                        <img
                            loading="lazy"
                            src={imageSrc}
                            alt={article.displaytitle}
                            className={`w-full h-full object-cover transition-all duration-500 will-change-transform ${
                                imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                            } group-hover:scale-105`}
                            onLoad={() => {
                                setImageLoaded(true);
                                setImageError(false);
                            }}
                            onError={() => {
                                setImageLoaded(true);
                                setImageError(true);
                            }}
                        />

                        {/* Loading shimmer effect */}
                        {!imageLoaded && (
                            <div className="absolute inset-0">
                                <div className="w-full h-full bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-pulse" />
                                <div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                                    style={{
                                      animation: 'shimmer 1.5s infinite linear'
                                    }}
                                />
                            </div>
                        )}

                        {/* Simple Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    </div>
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900">
                        {/* Placeholder for articles without images */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-gray-500 text-6xl opacity-20">📚</div>
                        </div>
                    </div>
                )}

                {/* Content Container with Simple Glassmorphism */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 z-10">
                    <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 shadow-2xl shadow-black/50">
                        <div className="flex justify-between items-start mb-4">
                            <a
                                href={article.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 hover:text-gray-200 transition-colors active:scale-98"
                            >
                                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 leading-tight line-clamp-3">
                                    {article.displaytitle}
                                </h2>
                            </a>
                            <div className="flex gap-2 sm:gap-3 ml-4 flex-shrink-0">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleLike();
                                    }}
                                    disabled={isLiking}
                                    className={`p-3 rounded-full backdrop-blur-sm border transition-all duration-300 transform hover:scale-110 active:scale-95 touch-manipulation disabled:opacity-70 disabled:cursor-not-allowed ${
                                        isLikedStatus
                                            ? 'bg-red-500/90 border-red-400/50 text-white'
                                            : 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30'
                                    }`}
                                    style={{
                                        minHeight: '44px',
                                        minWidth: '44px',
                                    }}
                                    aria-label="Like article"
                                >
                                    {isLiking ? (
                                        <InlineLoader size="sm" className="text-white" />
                                    ) : (
                                        <Heart
                                            className={`w-5 h-5 transition-all duration-300 ${
                                                isLikedStatus ? 'fill-white scale-110' : ''
                                            }`}
                                        />
                                    )}
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleShare();
                                    }}
                                    disabled={isSharing}
                                    className="p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-300 transform hover:scale-110 active:scale-95 touch-manipulation disabled:opacity-70 disabled:cursor-not-allowed"
                                    style={{
                                        minHeight: '44px',
                                        minWidth: '44px',
                                    }}
                                    aria-label="Share article"
                                >
                                    {isSharing ? (
                                        <InlineLoader size="sm" className="text-white" />
                                    ) : (
                                        <Share2 className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <p className="text-gray-200 mb-4 sm:mb-6 leading-relaxed line-clamp-3 sm:line-clamp-4 text-sm sm:text-base">
                            {article.extract}
                        </p>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                            <a
                                href={article.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors font-medium group active:scale-95 touch-manipulation"
                            >
                                <span className="text-sm sm:text-base">Read full article</span>
                                <svg
                                    className="w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-200 group-hover:translate-x-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </a>

                            {/* Mobile-friendly interaction hint */}
                            <div className="text-xs text-gray-400 opacity-60 sm:opacity-60 text-center sm:text-right">
                                <span className="hidden sm:inline">Double-tap to like</span>
                                <span className="sm:hidden">♥ Double-tap to like</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

GrokCard.displayName = 'GrokCard';

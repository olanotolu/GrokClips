import { Share2, Heart } from 'lucide-react';
import { useState } from 'react';
import { useLikedArticles } from '../contexts/LikedArticlesContext';

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

export function GrokCard({ article }: GrokCardProps) {
    const [imageLoaded, setImageLoaded] = useState(false);
    const { toggleLike, isLiked } = useLikedArticles();

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: article.displaytitle,
                    text: article.extract || '',
                    url: article.url
                });
            } catch (error) {
                console.error('Error sharing:', error);
                // Fallback: Copy to clipboard
                await navigator.clipboard.writeText(article.url);
                // You could add a toast notification here instead of alert
            }
        } else {
            // Fallback: Copy to clipboard
            await navigator.clipboard.writeText(article.url);
            // You could add a toast notification here instead of alert
        }
    };

    return (
        <div
            className="h-screen w-full flex items-center justify-center snap-start relative cursor-pointer group"
            onDoubleClick={() => toggleLike(article)}
            data-article-id={article.pageid}
        >
            <div className="h-full w-full relative overflow-hidden">
                {/* Background Image with Simple Effects */}
                {article.thumbnail ? (
                    <div className="absolute inset-0">
                        <img
                            loading="lazy"
                            src={article.thumbnail.source}
                            alt={article.displaytitle}
                            className={`w-full h-full object-cover transition-all duration-700 ${
                                imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                            } group-hover:scale-105`}
                            onLoad={() => setImageLoaded(true)}
                            onError={() => setImageLoaded(true)}
                        />
                        {!imageLoaded && (
                            <div className="absolute inset-0 bg-gray-900 animate-pulse" />
                        )}

                        {/* Simple Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    </div>
                ) : (
                    <div className="absolute inset-0 bg-gray-900" />
                )}

                {/* Content Container with Simple Glassmorphism */}
                <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                    <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/50">
                        <div className="flex justify-between items-start mb-4">
                            <a
                                href={article.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 hover:text-gray-200 transition-colors"
                            >
                                <h2 className="text-2xl font-bold text-white mb-2 leading-tight">
                                    {article.displaytitle}
                                </h2>
                            </a>
                            <div className="flex gap-3 ml-4">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleLike(article);
                                    }}
                                    className={`p-3 rounded-full backdrop-blur-sm border transition-all duration-300 transform hover:scale-110 ${
                                        isLiked(article.pageid)
                                            ? 'bg-red-500/90 border-red-400/50 text-white'
                                            : 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30'
                                    }`}
                                    aria-label="Like article"
                                >
                                    <Heart
                                        className={`w-5 h-5 transition-all duration-300 ${
                                            isLiked(article.pageid) ? 'fill-white scale-110' : ''
                                        }`}
                                    />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleShare();
                                    }}
                                    className="p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-300 transform hover:scale-110"
                                    aria-label="Share article"
                                >
                                    <Share2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <p className="text-gray-200 mb-6 leading-relaxed line-clamp-4 text-base">
                            {article.extract}
                        </p>

                        <div className="flex items-center justify-between">
                            <a
                                href={article.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors font-medium group"
                            >
                                <span>Read full article</span>
                                <svg
                                    className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </a>

                            {/* Subtle interaction hint */}
                            <div className="text-xs text-gray-400 opacity-60">
                                Double-tap to like
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

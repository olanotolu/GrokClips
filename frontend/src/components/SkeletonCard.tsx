import { useEffect, useState } from 'react';

interface SkeletonCardProps {
  index?: number;
  variant?: 'default' | 'compact' | 'minimal';
}

export function SkeletonCard({ index = 0, variant = 'default' }: SkeletonCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shinePosition, setShinePosition] = useState(-100);

  useEffect(() => {
    // Stagger the animation for a more natural loading effect
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, index * 150);

    return () => clearTimeout(timer);
  }, [index]);

  useEffect(() => {
    if (isVisible) {
      // Add a subtle shine animation
      const shineInterval = setInterval(() => {
        setShinePosition(prev => (prev >= 200) ? -100 : prev + 2);
      }, 50);

      return () => clearInterval(shineInterval);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const isCompact = variant === 'compact';
  const isMinimal = variant === 'minimal';

  return (
    <div className={`h-screen w-full flex items-center justify-center snap-start relative ${isMinimal ? 'animate-pulse' : ''}`}>
      <div className="h-full w-full relative overflow-hidden">
        {/* Enhanced Skeleton Background with shine effect */}
        <div
          className="absolute inset-0 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)'
          }}
        >
          {!isMinimal && (
            <div
              className="absolute inset-0 opacity-20"
              style={{
                background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)`,
                transform: `translateX(${shinePosition}%)`,
                transition: 'none'
              }}
            />
          )}
        </div>

        {/* Content Container Skeleton */}
        <div className={`absolute bottom-0 left-0 right-0 p-4 sm:p-6 z-10 ${isMinimal ? 'animate-pulse' : ''}`}>
          <div
            className={`backdrop-blur-xl rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden ${
              isMinimal ? 'animate-pulse' : ''
            }`}
            style={{
              backgroundColor: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)'
            }}
          >
            {!isMinimal && (
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)`,
                  transform: `translateX(${shinePosition}%)`,
                  transition: 'none'
                }}
              />
            )}

            <div className="flex justify-between items-start mb-4 relative z-10">
              {/* Enhanced Title skeleton */}
              <div className="flex-1">
                <div className={`bg-gray-300 dark:bg-gray-600 rounded-lg mb-2 ${
                  isCompact ? 'h-6' : isMinimal ? 'h-7 animate-pulse' : 'h-8'
                }`}></div>
                {!isMinimal && (
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3 animate-pulse"></div>
                )}
              </div>

              {/* Enhanced Action buttons skeleton */}
              {!isMinimal && (
                <div className="flex gap-2 sm:gap-3 ml-4 flex-shrink-0">
                  <div className={`bg-gray-300 dark:bg-gray-600 rounded-full ${
                    isCompact ? 'w-8 h-8' : 'w-12 h-12'
                  }`}></div>
                  <div className={`bg-gray-300 dark:bg-gray-600 rounded-full ${
                    isCompact ? 'w-8 h-8' : 'w-12 h-12'
                  }`}></div>
                </div>
              )}
            </div>

            {/* Enhanced Content skeleton */}
            {!isMinimal && (
              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-5/6 animate-pulse"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-4/6 animate-pulse"></div>
                {!isCompact && (
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4 animate-pulse"></div>
                )}
              </div>
            )}

            {/* Enhanced Footer skeleton */}
            {!isMinimal && (
              <div className={`flex ${isCompact ? 'flex-col gap-2' : 'items-center justify-between'} relative z-10`}>
                <div className={`bg-gray-300 dark:bg-gray-600 rounded ${
                  isCompact ? 'h-4 w-24' : 'h-5 w-32'
                }`}></div>
                {!isCompact && (
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading state component that shows multiple skeleton cards
export function SkeletonLoader({
  count = 3,
  variant = 'default'
}: {
  count?: number;
  variant?: 'default' | 'compact' | 'minimal'
}) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={`skeleton-${i}`} index={i} variant={variant} />
      ))}
    </>
  );
}

// Progressive loading component - shows real content with loading indicators
export function ProgressiveLoader({
  children,
  isLoading,
  skeletonCount = 2
}: {
  children: React.ReactNode;
  isLoading: boolean;
  skeletonCount?: number;
}) {
  if (isLoading) {
    return <SkeletonLoader count={skeletonCount} />;
  }
  return <>{children}</>;
}

// Button loading state
export function ButtonLoader({
  loading,
  children,
  size = 'default'
}: {
  loading: boolean;
  children: React.ReactNode;
  size?: 'sm' | 'default' | 'lg';
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    default: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2">
        <div className={`${sizeClasses[size]} border-2 border-current border-t-transparent rounded-full animate-spin`} />
        <span>Loading...</span>
      </div>
    );
  }

  return <>{children}</>;
}

// Inline loading spinner
export function InlineLoader({
  size = 'default',
  className = ''
}: {
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    default: 'w-4 h-4',
    lg: 'w-6 h-6'
  };

  return (
    <div
      className={`${sizeClasses[size]} border-2 border-current border-t-transparent rounded-full animate-spin ${className}`}
    />
  );
}

// Search loading state
export function SearchLoader({ isSearching }: { isSearching: boolean }) {
  if (!isSearching) return null;

  return (
    <div className="flex items-center justify-center py-8">
      <div className="text-center">
        <InlineLoader size="lg" className="mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Searching articles...</p>
      </div>
    </div>
  );
}

// Page loading overlay
export function PageLoader({
  isLoading,
  message = 'Loading...',
  fullScreen = false
}: {
  isLoading: boolean;
  message?: string;
  fullScreen?: boolean;
}) {
  if (!isLoading) return null;

  const containerClasses = fullScreen
    ? 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50'
    : 'absolute inset-0 bg-black/20 backdrop-blur-sm z-10';

  return (
    <div className={`flex items-center justify-center ${containerClasses}`}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <InlineLoader size="lg" />
          <p className="text-gray-700 dark:text-gray-300 font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
}

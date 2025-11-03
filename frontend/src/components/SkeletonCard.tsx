import { useEffect, useState } from 'react';

interface SkeletonCardProps {
  index?: number;
}

export function SkeletonCard({ index = 0 }: SkeletonCardProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Stagger the animation for a more natural loading effect
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, index * 100);

    return () => clearTimeout(timer);
  }, [index]);

  if (!isVisible) return null;

  return (
    <div className="h-screen w-full flex items-center justify-center snap-start relative">
      <div className="h-full w-full relative overflow-hidden">
        {/* Skeleton Background */}
        <div
          className="absolute inset-0 animate-pulse"
          style={{
            background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)'
          }}
        />

        {/* Content Container Skeleton */}
        <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
          <div
            className="backdrop-blur-xl rounded-2xl p-6 shadow-2xl"
            style={{
              backgroundColor: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)'
            }}
          >
            <div className="flex justify-between items-start mb-4">
              {/* Title skeleton */}
              <div className="flex-1">
                <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded-lg mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 animate-pulse"></div>
              </div>

              {/* Action buttons skeleton */}
              <div className="flex gap-3 ml-4">
                <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
                <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
              </div>
            </div>

            {/* Content skeleton */}
            <div className="space-y-3 mb-6">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6 animate-pulse"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-4/6 animate-pulse"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 animate-pulse"></div>
            </div>

            {/* Footer skeleton */}
            <div className="flex items-center justify-between">
              <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-32 animate-pulse"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading state component that shows multiple skeleton cards
export function SkeletonLoader({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={`skeleton-${i}`} index={i} />
      ))}
    </>
  );
}

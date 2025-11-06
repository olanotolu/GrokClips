import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
}

export function useSEO({
  title = "GrokClips - TikTok-Style Interface for Exploring Grokipedia Articles",
  description = "Discover Grokipedia articles in a modern, TikTok-style vertical feed. Random articles, beautiful interface, offline support, and smooth scrolling. Built with React, TypeScript, and PWA technology.",
  image = "https://grokclips.vercel.app/grok-logo.svg",
  url = "https://grokclips.vercel.app",
  type = "website"
}: SEOProps = {}) {

  useEffect(() => {
    // Update document title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (property: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${property}"]`) as HTMLMetaElement;

      if (element) {
        element.content = content;
      } else {
        element = document.createElement('meta');
        element.setAttribute(attribute, property);
        element.content = content;
        document.head.appendChild(element);
      }
    };

    // Update meta tags
    updateMetaTag('description', description);
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:url', url, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('twitter:title', title, true);
    updateMetaTag('twitter:description', description, true);
    updateMetaTag('twitter:image', image, true);

    // Update canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (canonical) {
      canonical.href = url;
    } else {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      canonical.href = url;
      document.head.appendChild(canonical);
    }

  }, [title, description, image, url, type]);
}

// Hook for updating SEO based on current article
export function useArticleSEO(article: { title: string; extract: string; url: string; thumbnail?: { source: string } } | null) {
  useSEO({
    title: article ? `${article.title} - GrokClips` : undefined,
    description: article ? `${article.extract.substring(0, 160)}...` : undefined,
    image: article?.thumbnail?.source || undefined,
    url: article ? `https://grokclips.vercel.app#article-${article.url.split('/').pop()}` : undefined,
    type: 'article'
  });
}

# GrokClips

A TikTok-style interface for exploring local Grokipedia articles.

## Features

- Vertical scrolling feed of random Grokipedia articles
- Clean, minimalist interface focused on content
- Article previews with images, titles and excerpts
- Share articles directly or copy links
- Language selector with country flags
- Preloading of images and content for smooth scrolling
- Responsive design that works on mobile and desktop
- Progressive Web App (PWA) support for installing as a standalone app

## Tech Stack

- React 18
- TypeScript
- Tailwind CSS
- Vite

## Development

Run the commands below in the `/frontend` folder.

1. Install dependencies:

```bash
bun install
```

2. Run development server:

```bash
bun run dev
```

No backend required!

## Production Deployment

### Vercel Deployment (Recommended)

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Deploy to Vercel:**
```bash
cd frontend
vercel --prod
```

3. **Or connect your GitHub repository:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will automatically detect the Vite configuration

### Manual Build

```bash
cd frontend
bun run build
bun run preview
```

### Environment Variables

Create a `.env.production` file for production-specific variables:

```env
VITE_APP_TITLE="GrokClips"
VITE_APP_DESCRIPTION="A TikTok-style interface for exploring Grokipedia articles"
VITE_APP_URL="https://your-domain.vercel.app"
VITE_ANALYTICS_ENABLED=true
```

## Demo

Check it out here at [grokclips.vercel.app](https://grokclips.vercel.app) or [grokclips.io](https://www.grokclips.io)

**Note:** GrokClips is an enhanced version of the original GrokClips web project, featuring modern upgrades including virtual scrolling, dark/light theme support, offline caching, and advanced navigation. Not affiliated with grokclips.net or the independently developed GrokClips mobile apps for iPhone and Android.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
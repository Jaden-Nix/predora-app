# Predora - Demo Build

## Overview

Predora is a GenZ-friendly prediction market platform featuring dual market types (Fixed Pot Yield with principal protection + Traditional AMM), comprehensive gamification (prediction streaks, time machine, social sentiment), AI-powered market creation, and real-time dispute resolution. Built with Node.js/Express backend, Firebase/Firestore for data persistence, Google Gemini API for AI capabilities, and modern frontend using Tailwind CSS and Chart.js. Includes admin controls, notification system, follower networking, and Quick Polls for casual engagement.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack**: Pure HTML/CSS/JavaScript, Tailwind CSS (CDN), Chart.js, Google Fonts (Inter).

**Design Decisions**:
- **Dual-theme system**: Comprehensive dark and light modes ("Luminous & Airy") with theme persistence via localStorage and smooth transitions.
- **Responsive Design**: Mobile-first approach.
- **Modern UI**: CDN-based dependencies, glow-pulse animations, GenZ-friendly design.
- **Enhanced Navigation**:
  - Desktop: Always-visible top nav with glassmorphism (backdrop blur, gradient background, glowing sky-blue border), improved spacing and pill-style buttons.
  - Mobile: Minimalist centered header with just the "Predora" logo, gradient background with blur effects, and subtle glow accents. Clean, distraction-free design.
- **Toast Notifications**: Redesigned, animated toast notification system with four types (Success, Error, Warning, Info), glassmorphism effects, auto-dismissal, and stacking support.

### Backend Architecture

**Technology Stack**: Node.js with Express.js, ES Modules.

**Core Components**: Express Server, API Proxy Layer for secure external service communication, CORS-enabled.

**Key Design Decisions**:
- **Server Configuration**: Port flexibility, static file serving, API endpoints prefixed with `/api`.
- **Security Model**: API keys as environment variables, backend proxy for API key protection, Firebase Admin SDK with service account credentials from environment.

### Data Storage & Authentication

**Firebase Integration**:
- Firebase Admin SDK for server-side.
- Firestore for NoSQL data persistence.
- Firebase client SDK for potential frontend auth.
- Configuration via `GOOGLE_APPLICATION_CREDENTIALS` environment variable.

### AI Integration Architecture

**Gemini API Integration**:
- Model: `gemini-2.5-flash-preview-09-2025` (latest September 2025 preview - 89.7% on MATH benchmark, 92.9% on coding, 2× faster than 1.5 Pro).
- Endpoint: `/api/gemini` (proxied).
- Capabilities: Tools integration (for Search), JSON Schema mode for structured outputs, superior reasoning for market analysis.

### Deployment Architecture

**Vercel Configuration**: Single rewrite rule to `index.js`, serverless function deployment, environment variables managed via Vercel.

### Feature Specifications

- **Follower Count Display & Navigation**: Clickable follower count badges on profiles, navigation to a dedicated Followers tab with user lists.
- **Live Ticker Chat Improvements**: Enhanced readability for text in both themes, timestamp display, and improved visual hierarchy.
- **Reply Threading System**: Full reply functionality for chat using Firestore subcollections, with visual feedback, nested display, and `getTimeAgo()` utility.
- **Expanded Market Categories**: Six new GenZ/niche categories added (Creator & Social, Local & Campus, Gaming) with organized dropdowns and integrated filtering.
- **Notification System**: Comprehensive infrastructure with UI components (bell icon in desktop nav and bottom nav, Alerts tab in profile), multiple notification types (`market_resolved`, `market_disputed`, `new_follower`, `comment_reply`), real-time updates via Firestore, and "Mark all read" functionality.
- **Admin Panel Access**: Hidden 5-tap gesture on both desktop and mobile "Predora" titles to access admin features (secure, non-obvious entry point).
- **Admin Market Controls**: Admins can reopen and re-resolve already-resolved markets with full audit trail tracking (adminEvents array with admin ID, timestamp, previous outcome).
- **Fixed Pot Yield Markets**: Revolutionary no-loss system where users stake before a deadline, market locks, all principal goes to yield vault and is returned to everyone, only the yield is distributed to winners proportionally. Supports 6 yield protocols via dropdown selector: Aave (4.12%), Compound (3.88%), Lido (3.2%), Yearn Finance (5.8%), Curve (2.9%), and Convex (4.5%). Eliminates early/late advantage - only stake amount and side selection matter.
- **Staking Deadline System**: Fixed Pot Yield markets include mandatory staking deadlines (not needed for traditional AMM markets). Markets lock after deadline preventing new stakes while keeping view-only access until resolution. Countdown timers show remaining time.
- **Enhanced AI Prefill**: AI Assistant now fills entire create market form including title, insight, category (with new GenZ categories), resolution date (properly parsed from context like "Q2 2026" → "2026-06-30"), market type recommendation, and staking deadline suggestion.
- **Market Type Clarification**: Clear differentiation between Traditional AMM (liquidity pool-based) and Fixed Pot Yield (principal safe, yield-only distribution) markets with contextual help text that updates based on selection.
- **Improved UX**: Removed XP gain notifications for cleaner UI while maintaining backend XP tracking.
- **Light Mode UI Improvements**: Enhanced text readability in light mode across all profile tabs (Active Stakes, History, Networking) with proper color contrast (text-gray-900 for light mode, text-white for dark mode).
- **Live Dispute System**: Real-time balance withdrawal (10 BUSD) when disputing markets, with transactional validation (balance checks, duplicate prevention, resolved-market requirement). Disputes recorded in market.disputes array. Fixed logout bug during dispute submission.
- **Verifiable Resolution Sources**: Replaced mock informant data with real market resolution sources from Firestore. Verdict modal now shows actual AI Oracle rationale and verifiable source links when available.
- **Gamification: Prediction Streaks**: Win streak tracking with visual badges (5-win 🌟, 10-win 💎, 20-win 👑), XP multipliers (1.2×, 1.5×, 2×), and dedicated streak modal with progress visualization. Streaks reset on losses and award bonus XP for maintaining winning runs.
- **Time Machine (Historical Odds)**: View how market odds changed over time with snapshots of 1-day-ago, 1-week-ago, and creation odds. Includes "hindsight score" showing early advantage for users who bet before odds shifted significantly.
- **Social Sentiment Heatmap**: Visual breakdown showing which side your network is betting on vs. everyone else. Network percentage displays follower betting patterns with intelligent messaging (bullish/bearish/crowd-aligned). Helps users leverage social proof in prediction decisions.
- **Quick Polls System**: Zero-stake casual predictions for low-commitment engagement. Users vote YES/NO on quick poll questions, earn mini XP rewards (+2 XP per vote), and see live percentage breakdowns. Anyone can create polls with one-click. Designed for viral growth and converting casual users to real market participants.

## External Dependencies

### Third-Party Services

- **Google Gemini API**: AI-powered content generation and analysis.
- **Firebase/Firestore**: User authentication and NoSQL data persistence.

### NPM Dependencies

- `express`: Web application framework.
- `cors`: Cross-origin resource sharing middleware.
- `node-fetch`: HTTP client.
- `firebase`: Firebase client SDK.
- `firebase-admin`: Firebase Admin SDK.

### Frontend CDN Dependencies

- Tailwind CSS: Utility-first CSS framework.
- Chart.js: Data visualization library.
- Google Fonts (Inter): Typography.

### Environment Variables Required

- `GEMINI_API_KEY`: Google Gemini API authentication.
- `GOOGLE_APPLICATION_CREDENTIALS`: Firebase service account JSON.
- `CRON_SECRET`: Authentication for scheduled tasks/webhooks.
- `PORT`: Server port configuration (optional).
# Predora - Demo Build

## Overview

Predora is a web application designed to integrate AI capabilities using Google's Gemini API. It features a dark-themed UI (with a comprehensive light mode) built with Tailwind CSS and Chart.js for data visualization. The application's backend, powered by Node.js/Express, securely handles API communications and leverages Firebase for data persistence and authentication. Predora aims to provide a modern, engaging user experience with features like market predictions, social interactions, and a robust notification system, targeting GenZ users with its contemporary design choices.

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
- Model: `gemini-2.5-flash-preview-09-2025`.
- Endpoint: `/api/gemini` (proxied).
- Capabilities: Tools integration (for Search), JSON Schema mode for structured outputs.

### Deployment Architecture

**Vercel Configuration**: Single rewrite rule to `index.js`, serverless function deployment, environment variables managed via Vercel.

### Feature Specifications

- **Follower Count Display & Navigation**: Clickable follower count badges on profiles, navigation to a dedicated Followers tab with user lists.
- **Live Ticker Chat Improvements**: Enhanced readability for text in both themes, timestamp display, and improved visual hierarchy.
- **Reply Threading System**: Full reply functionality for chat using Firestore subcollections, with visual feedback, nested display, and `getTimeAgo()` utility.
- **Expanded Market Categories**: Six new GenZ/niche categories added (Creator & Social, Local & Campus, Gaming) with organized dropdowns and integrated filtering.
- **Notification System**: Comprehensive infrastructure with UI components (bell icon in desktop nav and bottom nav, Alerts tab in profile), multiple notification types (`market_resolved`, `market_disputed`, `new_follower`, `comment_reply`), real-time updates via Firestore, and "Mark all read" functionality.
- **Admin Panel Access**: Hidden 5-tap gesture on both desktop and mobile "Predora" titles to access admin features (secure, non-obvious entry point).

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
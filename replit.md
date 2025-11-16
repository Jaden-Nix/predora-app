# Predora - Demo Build

## Overview

Predora is a web application that integrates AI capabilities through Google's Gemini API. The application features a dark-themed UI built with Tailwind CSS and Chart.js for data visualization, with a Node.js/Express backend that handles secure API communications and Firebase integration for data persistence and authentication.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack**
- Pure HTML/CSS/JavaScript (no framework)
- Tailwind CSS via CDN for styling
- Chart.js for data visualization
- Inter font family from Google Fonts

**Design Decisions**
- **Dual-theme system** with equally beautiful dark and light modes:
  - **Dark Mode**: Deep blacks (#0D1117) with neon accent glows and glassmorphism effects
  - **Light Mode**: Luminous & Airy aesthetic with soft backgrounds (#F5F7FB), pastel accents, dual-shadow system (ambient + drop), and frosted glass effects
  - Theme persistence via localStorage with smooth transitions
- Responsive design with mobile-first approach (meta viewport configuration)
- CDN-based dependencies to minimize build complexity and improve load times
- Glow-pulse animations for interactive feedback in both themes
- Modern GenZ-friendly navigation: Sleek top navigation bar with pill-style buttons instead of traditional sidebar
  - Desktop: Centered glassmorphic pill container with rounded navigation buttons
  - Mobile: Bottom navigation bar with 6 buttons (Home, Leaders, Pledges, Create, Theme, Profile) for full feature access including theme toggle
  - Smooth transitions and hover effects with gradient active states
  - Navigation automatically hidden on login/OTP screens for clean authentication UX

**Rationale**: Choosing vanilla JavaScript with CDN-based libraries provides rapid prototyping capability and reduced deployment complexity, suitable for a demo/hackathon build. The modern top navigation design appeals to GenZ users by avoiding outdated sidebar patterns and embracing contemporary UI trends seen in popular apps. Dual-theme support ensures accessibility and user preference accommodation.

### Backend Architecture

**Technology Stack**
- Node.js with Express.js framework
- ES Modules (type: "module" in package.json)
- RESTful API design pattern

**Core Components**
1. **Express Server**: Handles HTTP requests and serves static files
2. **API Proxy Layer**: Securely forwards requests to external services while keeping API keys server-side
3. **CORS-enabled**: Allows cross-origin requests for flexible frontend deployment

**Key Design Decisions**

*Server Configuration*
- Port flexibility with environment variable fallback (PORT || 5000)
- Static file serving from root directory
- Separation of concerns: frontend served at root, API endpoints prefixed with `/api`

*Security Model*
- API keys stored as environment variables (GEMINI_API_KEY, CRON_SECRET)
- Backend proxy pattern prevents API key exposure to client
- Firebase Admin SDK with service account credentials from environment

**Rationale**: The proxy architecture pattern protects sensitive credentials while maintaining a simple deployment model. Using Express provides a lightweight, well-documented framework suitable for API-centric applications.

### Data Storage & Authentication

**Firebase Integration**
- Firebase Admin SDK for server-side operations
- Firestore for NoSQL data persistence
- Firebase client SDK included (firebase@12.5.0) for potential frontend auth

**Configuration Approach**
- Service account credentials loaded from `GOOGLE_APPLICATION_CREDENTIALS` environment variable
- Critical initialization with error handling to prevent startup with misconfigured credentials
- App ID: 'predora-hackathon'

**Rationale**: Firebase provides a fully managed backend-as-a-service, eliminating the need for database setup and maintenance. The Admin SDK on the server ensures secure, privileged access to Firebase services while potentially allowing client-side authentication flows.

### AI Integration Architecture

**Gemini API Integration**
- Model: `gemini-2.5-flash-preview-09-2025`
- Endpoint: `/api/gemini` (proxied through Express backend)
- Capabilities supported:
  - Tools integration (for Search functionality)
  - JSON Schema mode for structured outputs

**Implementation Pattern**
- Frontend sends structured requests with optional `tools` and `jsonSchema` parameters
- Backend validates and forwards to Google's Generative Language API
- Response streaming or single-shot completion based on request configuration

**Rationale**: Using the latest Gemini model preview provides access to cutting-edge AI features. The backend proxy ensures API key security while the flexible tool/schema configuration enables diverse use cases from search-augmented generation to structured data extraction.

### Deployment Architecture

**Vercel Configuration**
- Single rewrite rule routing all traffic to `index.js`
- Serverless function deployment model
- Environment variables managed through Vercel dashboard

**Rationale**: Vercel's serverless platform simplifies deployment with automatic scaling and zero infrastructure management, ideal for demo applications with variable traffic patterns.

## External Dependencies

### Third-Party Services

**Google Gemini API**
- Purpose: AI-powered content generation and analysis
- Authentication: API key-based
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/`
- Features used: Text generation, tool calling (search), JSON mode

**Firebase/Firestore**
- Purpose: User authentication and data persistence
- Authentication: Service account credentials (Admin SDK)
- Services used:
  - Firestore: NoSQL database
  - Authentication: User management (client SDK included)

### NPM Dependencies

**Core Dependencies**
- `express@^4.19.2`: Web application framework
- `cors@^2.8.5`: Cross-origin resource sharing middleware
- `node-fetch@^3.3.2`: HTTP client for making external API requests
- `firebase@^12.5.0`: Firebase client SDK
- `firebase-admin@^13.6.0`: Firebase Admin SDK for server-side operations

**Frontend CDN Dependencies**
- Tailwind CSS: Utility-first CSS framework
- Chart.js: Data visualization library
- Google Fonts (Inter): Typography

### Environment Variables Required

- `GEMINI_API_KEY`: Google Gemini API authentication
- `GOOGLE_APPLICATION_CREDENTIALS`: Firebase service account JSON (stringified)
- `CRON_SECRET`: Authentication for scheduled tasks/webhooks
- `PORT`: Server port configuration (optional, defaults to 5000)

### Browser APIs & Features

- Modern CSS features: `backdrop-filter` for glassmorphism effects
- CSS animations: Keyframe-based glow effects
- Responsive design APIs: Viewport meta tag configuration
- localStorage: Theme preference persistence

## Recent Enhancements (November 16, 2025)

### Light Mode Redesign
Implemented comprehensive light mode styling with "Luminous & Airy" aesthetic to match dark mode quality:
- **Color Palette**: Daylight Mist (#F5F7FB), Airy Blue-Gray (#E8EEFF), Soft Blue borders (#CBD5F5), Coral accents (#F26D85), Emerald accents (#3CBF8C)
- **Dual-Shadow System**: Ambient white glow + soft blue drop shadows for depth
- **Complete Component Coverage**: All interactive elements styled including buttons (primary gradient #5CC6FF→#7B8CFF, secondary, stake yes/no), inputs/selects (white backgrounds with soft blue borders), badges (all variants with pastels and high-contrast text), Quick Play screens and buttons (including SVG icon color overrides), toast notifications, wallet modal, live user counter, glowing cards, and filter pills

### Mobile Theme Toggle
- Added theme toggle button to mobile bottom navigation (6 buttons total)
- Reduced icon sizes to w-5 for compact layout
- Fixed updateNavStyles() to safely handle non-navigation buttons
- Theme toggle now accessible on all screen sizes

### Follower Notification Fix
- Implemented isFirstLoad flag to skip initial Firestore snapshot
- Prevents false-positive "user followed you" toasts on every login
- Only shows notifications for new followers after authentication completes
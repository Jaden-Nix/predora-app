# Predora - GenZ Prediction Market Platform

## Overview

Predora is a GenZ-friendly prediction market platform featuring dual market types: Fixed Pot Yield markets with principal protection and Traditional AMM markets. The platform enables users to make predictions on future events while managing risk through innovative market mechanisms.

The application uses a vanilla JavaScript frontend with no build tooling, served through an Express.js backend that acts as a secure API proxy layer for external services. All user data and market information is persisted in Firebase Firestore.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Choice: Vanilla JavaScript with CDN Dependencies**

The frontend eliminates all build tooling complexity by using pure HTML/CSS/JavaScript with CDN-based dependencies. This architectural decision was made to:
- Reduce deployment overhead and simplify development workflow
- Eliminate transpilation and bundling steps
- Enable rapid prototyping and iteration
- Maintain modern UI/UX standards without framework lock-in

**Core Dependencies:**
- Tailwind CSS (CDN) - Utility-first styling system
- Chart.js (CDN) - Data visualization for market analytics
- Google Fonts Inter family - Typography system

**Theme System Design**

The application implements a dual-theme system with dark ("Deep & Mysterious") and light ("Luminous & Airy") modes:
- **Persistence**: localStorage-based theme preference storage
- **Flash Prevention**: Pre-paint theme application using inline script before page render
- **CSS Variables**: Comprehensive custom property system for themeable colors, backgrounds, borders, and shadows

**Responsive Strategy**

Mobile-first approach with adaptive navigation patterns:
- **Desktop**: Persistent glassmorphism navigation with backdrop blur, gradient backgrounds, and glowing borders
- **Mobile**: Minimalist centered header with logo and clean gradients

**UI Component Architecture**

- **Toast Notification System**: Four severity types (Success, Error, Warning, Info) with auto-dismissal and stacking support
- **Glassmorphism Effects**: Applied throughout for visual depth and modern aesthetic
- **Canvas-based Share Modal**: Generates branded social media images for wins, losses, stakes, and markets with download and Twitter/X sharing capabilities
- **Collapsible AI Assistant**: Provides market creation guidance without cluttering the interface
- **Consolidated Configuration Panels**: Compact form fields for market setup

### Backend Architecture

**Technology Stack**
- Node.js with Express.js framework
- ES Modules (type: "module" in package.json)
- CORS-enabled middleware for cross-origin requests
- Firebase Admin SDK for server-side operations

**Architectural Pattern: Secure API Proxy Layer**

The backend implements a proxy pattern where all external service calls flow through the server rather than directly from the client. This design decision addresses:

**Problem**: Client-side API calls expose sensitive credentials and API keys in browser requests.

**Solution**: Backend proxy endpoints that:
- Accept sanitized requests from frontend
- Append protected API keys server-side
- Forward requests to external services (Gemini AI, yield protocols)
- Return sanitized responses to client

**Benefits:**
- Centralized security controls and credential management
- Request validation and rate limiting at server level
- Protection against API key exposure
- Simplified credential rotation

**Alternatives Considered:**
- Client-side direct API calls with exposed keys (rejected for security)
- Serverless functions (rejected for complexity and cold start latency)

**API Endpoint Architecture**

The server exposes endpoints for:
- `/api/gemini` - Proxies requests to Google Gemini AI with support for Search tools and JSON mode
- Firestore operations (implied from Firebase Admin SDK usage)
- CRON job endpoints (protected by CRON_SECRET environment variable)

### Market Types Architecture

**Dual Market System Design**

The platform implements two distinct market mechanisms:

**1. Fixed Pot Yield Markets (No-Loss Markets)**

**Problem**: Traditional prediction markets expose users to total loss risk, creating barriers for risk-averse participants.

**Solution**: Principal-protected markets where:
- Users stake funds during a fixed window period before a deadline
- All staked funds are deposited into yield-generating protocols (Aave, Compound, Pendle, Treasury bill LRTs)
- Principal is always returned to all participants regardless of outcome
- Only the accumulated yield is distributed to correct predictions

**Market Flow:**
1. Creator defines question, deadlines, resolution source, and stake window end time
2. Users stake YES or NO positions during open window
3. Market locks at stake_window_end
4. All funds deposited to yield vault
5. Event resolves via oracle
6. Principal returned to all users
7. Yield distributed proportionally to winning side

**2. Traditional AMM Markets**

Standard automated market maker mechanics for users who prefer immediate liquidity and dynamic pricing.

**3. Quick Polls**

**Problem**: Users want lightweight, fast-paced prediction opportunities without complex market mechanics.

**Solution**: XP-based micro-prediction polls with automatic 24-hour resolution:
- Users stake XP (experience points) on YES or NO outcomes
- Customizable stake amounts (minimum 10 XP)
- Polls resolve automatically after 24 hours
- Winners receive their stake back plus a proportional share of the losing pot
- Losers forfeit their staked XP
- Ties return all stakes to participants

**Quick Poll Flow:**
1. User creates a YES/NO question poll
2. Other users stake XP on YES or NO (customizable amounts, min 10 XP)
3. XP is immediately deducted from user balance when voting
4. Poll automatically resolves 24 hours after creation via backend oracle
5. Winners receive: original stake + (loser pot × individual winner share)
6. Losers: XP remains deducted (already taken during vote)
7. Ties: All stakes returned to participants

**Oracle Resolution Logic** (`autoResolveQuickPolls` - runs daily):
- Identifies polls older than 24 hours with `isResolved: false`
- Determines winner based on majority vote (YES > NO, or NO > YES)
- Calculates proportional XP distribution for winners
- Updates user XP balances and streaks
- Marks polls as `isResolved: true` with `winningOutcome` field

**Data Schema:**
```javascript
{
  question: string,
  yesVotes: number,
  noVotes: number,
  xpStakedYES: number,
  xpStakedNO: number,
  voters: {
    [userId]: { vote: 'YES' | 'NO', xpStaked: number, timestamp: ISO8601 }
  },
  isResolved: boolean,
  winningOutcome: 'YES' | 'NO' | 'TIE' | 'NO_VOTES',
  createdBy: string,
  createdAt: Timestamp,
  resolvedAt: Timestamp (optional)
}
```

### Data Persistence

**Firebase Firestore Architecture**

- **Authentication**: Firebase Admin SDK for server-side authenticated operations
- **Initialization**: Service account credentials loaded from `GOOGLE_APPLICATION_CREDENTIALS` environment variable (JSON string)
- **Database**: Firestore NoSQL database for market data, user positions, and application state

**Rationale**: Firebase provides:
- Real-time data synchronization for live market updates
- Scalable NoSQL document storage
- Built-in authentication integration
- Managed infrastructure reducing operational overhead

## External Dependencies

### AI Services
- **Google Gemini AI** (gemini-2.5-flash-preview-09-2025)
  - Purpose: Market creation assistance, prediction analysis
  - Integration: Backend proxy at `/api/gemini`
  - Features: Search tools support, JSON mode for structured responses
  - Authentication: API key via `GEMINI_API_KEY` environment variable

### Firebase Services
- **Firebase Admin SDK** (v13.6.0)
  - Purpose: Server-side database operations and authentication
  - Authentication: Service account JSON credentials
  - Database: Firestore for document storage

- **Firebase Client SDK** (v12.5.0)
  - Purpose: Client-side realtime listeners (if implemented)

### Yield Generation Protocols (Planned)
The architecture references integration with:
- Aave - Decentralized lending protocol
- Compound - Algorithmic money market
- Pendle PT/YT - Yield tokenization
- Treasury bill LRTs - Real-world asset yield

These integrations would proxy through the backend for credential protection.

### Node.js Dependencies
- **express** (v4.19.2) - Web application framework
- **cors** (v2.8.5) - Cross-origin resource sharing middleware
- **node-fetch** (v3.3.2) - HTTP client for external API calls

### CDN Dependencies (Frontend)
- Tailwind CSS - Styling framework
- Chart.js - Charting library for market visualization
- Google Fonts - Inter font family

### Environment Variables Required
- `GEMINI_API_KEY` - Google Gemini AI authentication
- `GOOGLE_APPLICATION_CREDENTIALS` - Firebase service account JSON (as string)
- `CRON_SECRET` - CRON job endpoint protection
- `PORT` - Server port (defaults to 5000)
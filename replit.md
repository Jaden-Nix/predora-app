# Predora - Demo Build

## Overview

Predora is a GenZ-friendly prediction market platform featuring dual market types: Fixed Pot Yield markets with principal protection and Traditional AMM markets. The platform enables users to make predictions on future events while earning yields or trading prediction shares. Built with a minimalist tech stack emphasizing simplicity and security.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack**
- Pure HTML/CSS/JavaScript (no framework dependencies)
- Tailwind CSS via CDN for utility-first styling
- Chart.js for data visualization and market analytics
- Google Fonts (Inter family) for typography

**Rationale**: Eliminated build tooling complexity by using CDN-based dependencies while maintaining modern UI/UX standards. This approach reduces deployment overhead and simplifies development workflow.

**Design System**
- **Dual-Theme Implementation**: Comprehensive dark ("Deep & Mysterious") and light ("Luminous & Airy") modes with localStorage persistence and pre-paint application to prevent flash of unstyled content
- **Responsive Strategy**: Mobile-first approach with adaptive navigation:
  - Desktop: Persistent glassmorphism navigation (backdrop blur, gradient backgrounds, glowing borders)
  - Mobile: Minimalist centered header with logo and clean gradients
- **UI Component Library**:
  - Toast notification system with four severity types (Success, Error, Warning, Info)
  - Glassmorphism effects throughout for visual depth
  - Auto-dismissal and notification stacking support
  - Canvas-based share modal for social media image generation

**User Experience Features**
- Collapsible AI Assistant for market creation guidance
- Consolidated market configuration panels with compact form fields
- Social sharing functionality with branded card generation for wins, losses, stakes, and markets
- Download and X/Twitter sharing capabilities

### Backend Architecture

**Technology Stack**
- Node.js runtime with Express.js framework
- ES Modules (type: "module" configuration)
- CORS-enabled for cross-origin requests
- Firebase Admin SDK for backend services

**Architecture Pattern**: Secure API Proxy Layer

**Rationale**: All external service calls are proxied through the backend to protect API credentials and centralize security controls. This prevents client-side exposure of sensitive keys while maintaining clean separation of concerns.

**Key Components**
- **API Endpoints**: All external services accessed via `/api` prefix
- **Static File Serving**: Frontend assets served directly from backend
- **Port Configuration**: Environment-based (PORT variable, default 5000)
- **Cache Control**: Aggressive no-cache headers (Cache-Control, Pragma, Expires) to prevent stale asset issues

**Security Model**
- Environment-variable-based API key management (GEMINI_API_KEY, CRON_SECRET)
- Backend proxy pattern shields credentials from client exposure
- Firebase Admin SDK initialization with service account credentials
- Application scoped with APP_ID: 'predora-hackathon'

**API Integration**
- Google Gemini AI integration for market assistance and analysis
- Supports both Search tools and JSON Schema mode for structured responses
- Gemini endpoint: `gemini-2.5-flash-preview-09-2025:generateContent`

### Market Type Architecture

**Fixed Pot Yield Markets (No-Loss Principal Protection)**

**Problem Addressed**: Traditional prediction markets require users to risk losing their entire stake, creating barriers to entry and reducing participation.

**Solution**: Principal protection model where users' initial stakes are returned regardless of outcome, with only yield distributed to winning predictions.

**Core Mechanics**:
1. **Stake Window Phase**: Users stake funds (YES or NO) before a deadline
2. **Lock Phase**: Market locks at `stake_window_end`, no further staking allowed
3. **Yield Generation**: All staked funds deposited into yield-generating vault (Aave, Compound, Pendle, Treasury bills)
4. **Resolution Phase**: Oracle determines outcome
5. **Distribution Phase**: 
   - All users receive 100% of principal back
   - Accumulated yield distributed proportionally to winning side only

**Market Parameters**:
- `marketType`: FIXED_POT_YIELD
- `question`: The prediction question
- `YES_deadline` & `NO_deadline`: Stake acceptance deadlines
- `resolution_source`: Oracle/data source for outcome determination
- `stake_window_end`: Hard lock timestamp for staking
- `YES_total` & `NO_total`: Aggregated stake amounts per side

**Traditional AMM Markets**

Mentioned as secondary market type but implementation details not provided in current codebase.

## External Dependencies

### Third-Party Services

**Google Gemini AI**
- **Purpose**: AI-powered market creation assistance and analysis
- **Model**: gemini-2.5-flash-preview-09-2025
- **API Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/`
- **Authentication**: API key via GEMINI_API_KEY environment variable
- **Capabilities**: Search tool integration and JSON Schema mode support

**Firebase/Firestore**
- **Purpose**: Primary database and backend infrastructure
- **SDK**: Firebase Admin SDK v13.6.0
- **Authentication**: Service account credentials via GOOGLE_APPLICATION_CREDENTIALS
- **Database**: Firestore for market data and user state persistence
- **Application ID**: predora-hackathon

### CDN Dependencies

**Tailwind CSS**
- Source: `https://cdn.tailwindcss.com`
- Purpose: Utility-first CSS framework

**Chart.js**
- Source: `https://cdn.jsdelivr.net/npm/chart.js`
- Purpose: Market analytics and data visualization

**Google Fonts**
- Source: `https://fonts.googleapis.com` and `https://fonts.gstatic.com`
- Font Family: Inter (weights: 300, 400, 500, 600, 700, 800)

### Node.js Dependencies

**Core Dependencies** (package.json):
- `express` ^4.19.2: Web application framework
- `cors` ^2.8.5: Cross-origin resource sharing middleware
- `node-fetch` ^3.3.2: HTTP client for external API calls
- `firebase` ^12.5.0: Firebase client SDK
- `firebase-admin` ^13.6.0: Firebase Admin SDK for backend operations

### Yield Vault Integrations (Planned)

**Note**: These are referenced in market logic but not yet implemented in codebase:
- Aave lending protocol
- Compound lending protocol
- Pendle PT/YT (Principal/Yield Tokens)
- Treasury bill LRTs (Liquid Restaking Tokens)
- Real-world yield sources

### Deployment Platform

**Vercel**
- Serverless deployment configuration via vercel.json
- All routes rewritten to `/index.js` entry point
- Environment variable support for secrets management
# Predora - Demo Build

## Overview

Predora is a GenZ-friendly prediction market platform featuring dual market types: Fixed Pot Yield markets with principal protection and Traditional AMM markets. The platform includes comprehensive gamification features such as prediction streaks and time-based mechanics. Built as a demo application, it emphasizes modern UI/UX design with glassmorphism effects, dual-theme support, and responsive mobile-first architecture.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack**
- Pure HTML/CSS/JavaScript (no framework)
- Tailwind CSS via CDN
- Chart.js for data visualization
- Google Fonts (Inter family)

**Design System**
- **Dual-Theme Implementation**: Comprehensive dark ("Deep & Mysterious") and light ("Luminous & Airy") modes with localStorage persistence. Theme preference is applied before first paint to prevent flash of unstyled content. Custom CSS variables for all theme-aware properties.
- **Responsive Strategy**: Mobile-first approach with distinct navigation patterns:
  - Desktop: Persistent top navigation with glassmorphism (backdrop blur, gradient backgrounds, glowing borders)
  - Mobile: Minimalist centered header showing only the Predora logo with clean gradients
- **UI Components**: Toast notification system with four types (Success, Error, Warning, Info), glassmorphism effects, auto-dismissal, and stacking support
- **Create Market UX**: Redesigned screen featuring collapsible AI Assistant, consolidated market configuration panel, and compact form fields for reduced clutter

**Rationale**: CDN-based dependencies eliminate build tooling complexity while maintaining modern aesthetics. Theme system provides accessibility and user preference support. Glassmorphism creates depth and modern feel appealing to GenZ demographic.

### Backend Architecture

**Technology Stack**
- Node.js with Express.js
- ES Modules (type: "module" in package.json)
- CORS-enabled for cross-origin requests

**Architecture Pattern**: API Proxy Layer
- All external service calls proxied through backend
- API endpoints prefixed with `/api`
- Static file serving for frontend assets
- Port flexibility via environment variable (default 5000)

**Security Model**
- API keys stored as environment variables (GEMINI_API_KEY, CRON_SECRET)
- Backend acts as secure proxy to protect credentials from client exposure
- Firebase Admin SDK credentials via GOOGLE_APPLICATION_CREDENTIALS environment variable

**Rationale**: Proxy pattern prevents API key exposure in client-side code. Express provides minimal overhead for simple proxy needs. ES Modules align with modern JavaScript standards.

### Data Storage & Authentication

**Firebase Integration**
- Firebase Admin SDK for server-side operations
- Firestore for NoSQL data persistence
- Firebase client SDK available for frontend authentication
- Service account authentication via parsed JSON credentials from environment

**Database Pattern**: NoSQL document-based storage via Firestore
- Real-time updates capability
- Scalable cloud-native solution
- Integrated with Firebase ecosystem

**Rationale**: Firebase provides managed infrastructure eliminating database administration overhead. Firestore's document model suits prediction market data structures (markets, stakes, users). Admin SDK on backend ensures secure server-side operations.

### Market Architecture

**Dual Market System**

1. **Fixed Pot Yield Markets (No-Loss)**
   - Users stake before deadline (stake_window_end)
   - Market locks after deadline
   - All funds deposited into yield-generating vault (Aave, Compound, Pendle, Treasury LRTs)
   - Principal returned to all participants
   - Only yield distributed to winning side
   - Fields: question, YES_deadline, NO_deadline, resolution_source, stake_window_end
   - marketType flag: "FIXED_POT_YIELD"

2. **Traditional AMM Markets**
   - Standard prediction market mechanics
   - Winners take losing side's stake
   - Automated Market Maker pricing

**Rationale**: Fixed Pot Yield markets reduce risk for new users (principal protection) while maintaining engagement through yield rewards. Dual system appeals to both risk-averse and traditional prediction market users.

## External Dependencies

### AI Services
- **Google Gemini API**: Model `gemini-2.5-flash-preview-09-2025`
  - Endpoint: Proxied through `/api/gemini`
  - Capabilities: Tools integration for Search, JSON Schema mode for structured outputs
  - Performance: 89.7% MATH benchmark, 92.9% coding benchmark, 2× faster than 1.5 Pro
  - Use case: Market analysis and AI-assisted market creation

### Cloud Services
- **Firebase/Firestore**: 
  - Authentication management
  - NoSQL database for markets, users, stakes
  - Real-time data synchronization
  - Service account-based server authentication

### Yield Protocols (Planned Integration)
- Aave: Lending protocol for yield generation
- Compound: DeFi money market protocol
- Pendle: Tokenized yield trading (PT/YT)
- Treasury Bill LRTs: Real-world asset yield

### Development Tools
- Vercel: Deployment platform with serverless function support
- Node.js runtime: Server execution environment
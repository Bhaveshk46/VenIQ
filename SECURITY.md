# Security Policy

## Overview

VenIQ uses several external APIs and services. This document outlines the security design decisions made in this application.

## API Key Architecture

### Current Architecture (Client-Side Demo)

For this demonstration, API keys for Google Maps, Gemini AI, and Firebase are loaded directly from environment variables (`.env`) and embedded into the front-end build via **Vite's `import.meta.env`** system.

This approach is appropriate for:
- Development and academic demonstrations
- Projects where all services are protected by **domain-level API key restrictions** (Google Cloud Console)

### Production-Grade Architecture (Recommended)

In a production enterprise deployment, API keys should **never** be included in client-side code. The recommended architecture is:

```
Browser → Your Secure Backend (Node.js/Cloud Function) → Google API
```

This protects keys by:
1. Routing all AI (Gemini) and Maps API calls through a **backend proxy endpoint**.
2. Using **server-side authentication** to verify request legitimacy before forwarding.
3. All secrets stored as **server environment variables**, never sent to the browser.

### Firebase Authentication

Firebase Authentication uses Google's `browserLocalPersistence` strategy for session management. Auth tokens are stored in `localStorage` and are cryptographically signed — they cannot be tampered with on the client side. Server-side Firebase Admin SDK is used for token verification in production.

## Input Sanitization

All user-supplied chat input in `ChatScreen.jsx` is:
- **Length-limited** to `MAX_CHAT_INPUT_LENGTH` (500 characters) before being forwarded to the Gemini API.
- **HTML-stripped** to prevent injection of script tags into the conversation UI.

## Responsible AI Usage

The Gemini AI integration:
- Includes a **system instruction** that scopes the AI's responses to stadium-related topics only.
- Implements a **client-side rate limiter** (8-second cooldown) to prevent API abuse.
- Does **not** log or store any user conversation data.

## Reporting a Vulnerability

If you discover a security issue, please open a GitHub Issue using the `security` label.

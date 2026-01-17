# TrackDown

## Overview

TrackDown is a Node.js application that generates tracking links to collect location and device information from users who click them. It integrates with Telegram as a bot interface, allowing users to create and manage tracking links and receive captured data through Telegram messages.

The application serves web pages that collect visitor data (IP address, geolocation, device info) and sends this information back to the Telegram bot owner. It's built as an educational/research tool demonstrating web-based information gathering techniques.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Core Components

**Express.js Web Server**
- Serves tracking pages via dynamic routes (`/w/:path/:uri` and `/c/:path/:uri`)
- Uses EJS templating engine for rendering tracking pages
- Handles CORS and body parsing for incoming data submissions
- Routes encode destination URLs in base64 within the path parameters

**Telegram Bot Integration**
- Uses `node-telegram-bot-api` library with polling mode
- Bot token stored in environment variable `bot`
- Acts as the command interface for users to generate links and receive tracking data

**URL Shortening Toggle**
- Optional integration with 1pt.co URL shortener (configurable via `use1pt` flag)
- Allows generated links to appear less suspicious

### Request Flow

1. User interacts with Telegram bot to generate tracking link
2. Bot creates a link pointing to the Express server with encoded destination URL
3. Victim clicks link and lands on tracking page
4. Page collects IP, timestamp, and potentially browser/device data
5. Data is sent back to server and forwarded to bot owner via Telegram

### Environment Configuration

- `bot`: Telegram bot API token (required, case-sensitive)
- `HOST_URL`: Base URL where the application is hosted (falls back to hardcoded Replit URL)

### View Templates

- Uses EJS templates in `/views` directory
- Templates render tracking pages that appear legitimate while collecting data
- Pages can redirect to actual destination URL after data collection

## External Dependencies

### Runtime Dependencies

| Package | Purpose |
|---------|---------|
| `express` | Web server framework |
| `node-telegram-bot-api` | Telegram bot interface |
| `ejs` | Template rendering |
| `dotenv` | Environment variable management |
| `node-fetch` | HTTP requests (for URL shortening, IP lookup APIs) |
| `body-parser` | Request body parsing |
| `cors` | Cross-origin request handling |
| `base64-to-image` | Image processing for captured screenshots |
| `mic` | Audio recording capabilities (imported but usage unclear from partial code) |

### Railway Deployment

The project is configured for Railway deployment using:
- `Procfile`: Standard process file for the web worker.
- `railway.json`: Railway-specific configuration using Nixpacks.
- Environment variables: `bot` (Telegram Token) and `HOST_URL` (App URL) must be set in Railway.

### Environment Requirements

- Node.js runtime
- Network access for Telegram API polling
- Public URL for receiving webhook-style callbacks from tracking pages
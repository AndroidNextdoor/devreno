# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is `/dev/reno` - a community website for programmers in the Reno/Tahoe area. It's a static website with an Express.js server that showcases lightning talks and community events.

## Architecture

The project follows a simple static site structure:

- **server.js**: Express server serving static files and providing a health endpoint
- **index.html**: Main HTML page with terminal UI and event information
- **assets/**: Static assets organized by type
  - `css/`: Stylesheets
  - `js/main.js`: Frontend JavaScript with theme switching and terminal functionality
  - `images/`: Website images and logos

## Key Features

- **Theme System**: Dynamic theme switching between "environmental" and "disco" themes with different backgrounds and logos
- **Interactive Terminal**: Fake terminal interface with random responses and typing effects
- **Lightning Talks Info**: Community event details and call-to-action for speakers

## Development Commands

```bash
# Start the development server
npm start
# or
npm run dev

# Install dependencies
npm install
```

The server runs on port 5000 by default (configurable via PORT environment variable) and serves static files from the project root.

## Server Configuration

- Configured for Replit proxy with `trust proxy` enabled
- Serves all static files from project root
- Health check endpoint at `/health` returns JSON status
- Binds to `0.0.0.0` for external access

## Frontend JavaScript Structure

The main.js file handles:
- Theme management with background/logo switching
- Terminal simulation with command input and responses
- Intersection Observer animations for cards
- Keyboard navigation (arrow keys for theme switching)
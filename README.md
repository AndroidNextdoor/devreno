# /dev/reno - The Reno Developers Meetup

A community website for programmers in the Reno/Tahoe area featuring an interactive terminal interface and information about our monthly lightning talks.

## Features

- **Dynamic Theme System**: Switch between environmental and disco themes using arrow keys or slider buttons
- **Interactive Terminal**: Click-to-activate terminal with fun responses and typing animations
- **Functional Terminal Buttons**:
  - 🔴 Red: Wormhole collapse animation and close
  - 🟡 Yellow: Minimize/restore functionality
  - 🟢 Green: Fullscreen/restore mode
- **Jobs Board**: Comprehensive job search functionality featuring:
  - **Slack Integration**: Community job postings from #jobs channel
  - **Local Jobs**: Software engineering positions within configurable distance from Reno (via Adzuna API)
  - **Remote Jobs**: Remote software engineering opportunities (via RemoteOK API)
  - **Advanced Filtering**: Search by text, job type (all/local/remote), distance, and programming languages
  - **Infinite Scroll**: Lazy loading with performance optimization
- **Social Media Integration**: Direct links to Meetup, Instagram, and Slack
- **Responsive Design**: Mobile-friendly layout and interactions

## Local Development

### Prerequisites
- Node.js (any recent version)
- npm

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/AndroidNextdoor/devreno.git
   cd devreno
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. **Set up environment variables** (required for jobs functionality):
   ```bash
   # Add to your ~/.zshrc or ~/.bashrc
   export SLACK_BOT_TOKEN="your_slack_bot_token_here"
   export SLACK_JOBS_CHANNEL_ID="your_slack_jobs_channel_id_here"
   export ADZUNA_APP_ID="your_adzuna_app_id_here"
   export ADZUNA_APP_KEY="your_adzuna_app_key_here"

   # Reload your shell configuration
   source ~/.zshrc  # or source ~/.bashrc
   ```

4. Start the development server:
   ```bash
   npm start
   # or use the convenience script
   ./_scripts/start-server.sh
   ```

5. Open your browser to `http://localhost:5000` (or the port shown in the terminal)


## Project Structure

```
devreno/
├── index.html              # Main website
├── jobs.html               # Jobs board page
├── assets/
│   ├── css/
│   │   └── style.css       # All styles including themes and job filters
│   ├── js/
│   │   ├── main.js         # Main site interactive functionality
│   │   ├── jobs.js         # Slack jobs functionality
│   │   └── external-jobs.js # External jobs API and filtering
│   └── images/             # Website images and logos
├── _scripts/
│   └── start-server.sh     # Development server script
├── server.js               # Express server with API endpoints
├── package.json            # Node.js dependencies
└── README.md               # This file
```

## Environment Variables

The jobs functionality requires API credentials that must be kept secure. These should be stored as environment variables:

### Required Variables

| Variable | Description | How to Get |
|----------|-------------|------------|
| `SLACK_BOT_TOKEN` | Bot User OAuth Token for Slack API | Create a Slack app and generate bot token |
| `SLACK_JOBS_CHANNEL_ID` | Channel ID for the #jobs channel | Right-click channel → Copy Link → Extract ID |
| `ADZUNA_APP_ID` | Adzuna API Application ID | Register at [developer.adzuna.com](https://developer.adzuna.com) |
| `ADZUNA_APP_KEY` | Adzuna API Application Key | From your Adzuna developer dashboard |

### Setting Up Environment Variables

#### Local Development
```bash
# Add to ~/.zshrc, ~/.bashrc, or ~/.bash_profile
export SLACK_BOT_TOKEN="xoxb-your-slack-bot-token"
export SLACK_JOBS_CHANNEL_ID="C1234567890"
export ADZUNA_APP_ID="your-app-id"
export ADZUNA_APP_KEY="your-app-key"

# Reload shell configuration
source ~/.zshrc
```

#### Production/Deployment
- **Vercel**: Add in Project Settings → Environment Variables
- **Netlify**: Add in Site Settings → Environment Variables
- **Heroku**: Use `heroku config:set VARIABLE_NAME=value`
- **Docker**: Pass with `-e` flag or use `.env` file (not committed)

## 🔒 Security Best Practices

### ⚠️ **NEVER commit API keys to GitHub!**

#### What to do:
✅ **Use environment variables** for all sensitive data
✅ **Add `.env*` to `.gitignore`** if using .env files
✅ **Store secrets in shell profile** (~/.zshrc, ~/.bashrc)
✅ **Use platform secret managers** in production
✅ **Rotate keys regularly** if compromised

#### What NOT to do:
❌ **Never put keys directly in code**
❌ **Never commit .env files with real secrets**
❌ **Never share keys in chat/email**
❌ **Never use production keys for development**

#### If you accidentally commit secrets:
1. **Immediately revoke/regenerate** the exposed keys
2. **Remove from git history**: `git filter-branch` or BFG Repo-Cleaner
3. **Force push** to overwrite remote history
4. **Generate new keys** and update environment variables

### Example .gitignore additions:
```gitignore
# Environment variables
.env
.env.local
.env.development
.env.production

# API keys and secrets
config/secrets.js
keys.json
```

## 🚀 Deployment Options

### Option 1: GitHub Pages (Static Only)
**Best for:** Showcasing the main site without jobs functionality

The GitHub Actions workflow automatically deploys a static version to GitHub Pages:
- ✅ **Automatic deployment** on pushes to main branch
- ✅ **Main site functionality** (themes, terminal, etc.)
- ❌ **No jobs functionality** (requires server-side APIs)

The static version includes helpful messages directing users to full deployment options.

### Option 2: Vercel (Recommended)
**Best for:** Full functionality including jobs search

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/AndroidNextdoor/devreno)

1. **Connect your GitHub repo** to Vercel
2. **Add environment variables** in Vercel dashboard:
   - `SLACK_BOT_TOKEN`
   - `SLACK_JOBS_CHANNEL_ID`
   - `ADZUNA_APP_ID`
   - `ADZUNA_APP_KEY`
3. **Deploy automatically** on every push

### Option 3: Netlify
**Alternative full-featured deployment**

1. Connect your GitHub repository
2. Set build command: `npm install`
3. Set publish directory: `./`
4. Add environment variables in Site Settings
5. Enable serverless functions for API endpoints

### Option 4: Other Platforms
- **Railway**: Node.js support with environment variables
- **Render**: Free tier with automatic GitHub integration
- **Heroku**: Classic platform with Node.js buildpack
- **DigitalOcean App Platform**: Modern container deployment

## Community Links

- **Meetup**: [dev-reno](https://www.meetup.com/dev-reno/)
- **Instagram**: [@dev.reno.nv](https://www.instagram.com/dev.reno.nv/)
- **Slack**: [devreno.slack.com](https://devreno.slack.com/)

## Lightning Talks

We host lightning talks every first Thursday of the month at 6PM at EP Listening Lounge. Anyone with a tech topic is encouraged to speak!

---

Built with ❤️ by the Reno developer community
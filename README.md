# /dev/reno - The Reno Developers Meetup

A community website for programmers in the Reno/Tahoe area featuring an interactive terminal interface and information about our monthly lightning talks.

## Features

- **Dynamic Theme System**: Switch between environmental and disco themes using arrow keys or slider buttons
- **Interactive Terminal**: Click-to-activate terminal with fun responses and typing animations
- **Functional Terminal Buttons**: 
  - 🔴 Red: Wormhole collapse animation and close
  - 🟡 Yellow: Minimize/restore functionality
  - 🟢 Green: Fullscreen/restore mode
- **Social Media Integration**: Direct links to Meetup, Instagram, and Slack
- **Responsive Design**: Mobile-friendly layout and interactions

## Local Development

### Prerequisites
- Node.js (any recent version)
- npm

### Setup
1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd devreno
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   # or use the convenience script
   ./_scripts/start-server.sh
   ```

4. Open your browser to `http://localhost:5001` (or the port shown in the terminal)

## Deploying to GitHub Pages

### Step 1: Prepare Your Repository
1. **Create a new GitHub repository** (if you haven't already):
   - Go to [GitHub](https://github.com) and create a new repository
   - Name it something like `devreno-website` or `dev-reno`
   - Don't initialize with README (we already have one)

### Step 2: Push Your Code to GitHub
```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Make your first commit
git commit -m "Initial commit - /dev/reno website"

# Add your GitHub repository as origin
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to main branch
git branch -M main
git push -u origin main
```

### Step 3: Enable GitHub Pages
1. **Go to your repository on GitHub**
2. **Click on "Settings"** (in the repository navigation)
3. **Scroll down to "Pages"** in the left sidebar
4. **Under "Source"**, select "Deploy from a branch"
5. **Select "main" branch** and "/ (root)" folder
6. **Click "Save"**

### Step 4: Configure for GitHub Pages (Static Hosting)
Since this is a static site (no Node.js server needed), GitHub Pages will serve the files directly:

1. **The `index.html` will be your homepage**
2. **All assets in `/assets/` will be served statically**
3. **Your site will be available at**: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

### Step 5: Custom Domain (Optional)
If you want to use a custom domain like `devreno.com`:

1. **Purchase a domain** from a registrar
2. **In your repository**, create a file called `CNAME` with your domain:
   ```
   devreno.com
   ```
3. **Add the CNAME file to your repository**:
   ```bash
   echo "devreno.com" > CNAME
   git add CNAME
   git commit -m "Add custom domain"
   git push
   ```
4. **Configure DNS** with your domain registrar:
   - Add a CNAME record pointing to `YOUR_USERNAME.github.io`
5. **In GitHub Settings > Pages**, enter your custom domain and enable "Enforce HTTPS"

### Step 6: Automatic Deployments
Every time you push changes to the `main` branch, GitHub Pages will automatically redeploy your site!

```bash
# Make changes to your files
git add .
git commit -m "Update website content"
git push
# Your site will automatically update in a few minutes
```

## Project Structure

```
devreno/
├── index.html              # Main HTML file
├── assets/
│   ├── css/
│   │   └── style.css       # All styles including themes
│   ├── js/
│   │   └── main.js         # Interactive functionality
│   └── images/             # Website images and logos
├── _scripts/
│   └── start-server.sh     # Development server script
├── server.js               # Express server (for local development)
├── package.json            # Node.js dependencies
└── README.md               # This file
```

## Maintenance

- **Update social links**: Edit the URLs in `index.html`
- **Modify terminal responses**: Update the `responses` array in `assets/js/main.js`
- **Change themes**: Modify CSS variables in `assets/css/style.css`
- **Add new social platforms**: Add new links in the `.social-links` section

## Community Links

- **Meetup**: [dev-reno](https://www.meetup.com/dev-reno/)
- **Instagram**: [@dev.reno.nv](https://www.instagram.com/dev.reno.nv/)
- **Slack**: [devreno.slack.com](https://devreno.slack.com/)

## Lightning Talks

We host lightning talks every first Thursday of the month at 6PM at EP Listening Lounge. Anyone with a tech topic is encouraged to speak!

---

Built with ❤️ by the Reno developer community
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
   git clone https://github.com/AndroidNextdoor/devreno.git
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

## Community Links

- **Meetup**: [dev-reno](https://www.meetup.com/dev-reno/)
- **Instagram**: [@dev.reno.nv](https://www.instagram.com/dev.reno.nv/)
- **Slack**: [devreno.slack.com](https://devreno.slack.com/)

## Lightning Talks

We host lightning talks every first Thursday of the month at 6PM at EP Listening Lounge. Anyone with a tech topic is encouraged to speak!

---

Built with ❤️ by the Reno developer community
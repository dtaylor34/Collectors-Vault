# Running Radstash Locally

## First Time Setup

```bash
# 1. Clone the repo
git clone https://github.com/dtaylor34/Radstash.git
cd Radstash

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Open .env and fill in your API keys

# 4. Start the dev server
npx expo start --clear
```

## Daily Startup

```bash
cd ~/Radstash
npx expo start --clear
```

## Open the App

Once the dev server is running:

- **Web:** Press `w` in the terminal, or visit `http://localhost:8083`
- **iOS Simulator:** Press `i` (requires Xcode)
- **Android Emulator:** Press `a` (requires Android Studio)
- **Phone (Expo Go):** Scan the QR code in the terminal

## Common Commands

| Command | What it does |
|---------|-------------|
| `npx expo start --clear` | Start with cache cleared (use after .env changes) |
| `npx expo start` | Normal start (faster, uses cache) |
| Press `r` | Reload the app (in the terminal) |
| Press `w` | Open in web browser |
| Press `i` | Open in iOS Simulator |
| Press `a` | Open in Android Emulator |
| `Ctrl + C` | Stop the server |

## Troubleshooting

**"Unable to resolve" error:**
```bash
rm -rf node_modules .expo
npm install
npx expo start --clear
```

**CORS errors on web (Comic Vine covers):**
This is expected — covers use a CORS proxy for web dev. Works natively on Expo Go.

**AI Scan not working:**
Check that `EXPO_PUBLIC_ANTHROPIC_API_KEY` is set in `.env`, then restart with `--clear`.

**Metro bundler stuck:**
```bash
# Kill everything and restart
Ctrl + C
rm -rf .expo
npx expo start --clear
```

**Port 8083 already in use:**
```bash
# Kill the old process
lsof -ti:8083 | xargs kill -9
npx expo start --clear
```

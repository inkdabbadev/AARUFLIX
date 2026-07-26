# AaruFlix (Next.js)

The Rookie Marathon — 18 episodes, alternating Connections and Wordle puzzles.
Solve one to get a passcode and unlock that episode's video.

## Running it on your computer

You need Node.js installed first (download the LTS version from nodejs.org
if you don't have it, then restart your terminal).

1. Open a terminal in this folder.
2. Install dependencies (one-time):
   npm install
3. Start it:
   npm run dev
4. Open http://localhost:3000 in your browser.

Every time you want to use the app again, just repeat step 3 in this folder
and open the link — no need to reinstall.

## Adding your videos

Put your clips in `public/videos/`, named to match the episode:
  public/videos/memory-01.mp4
  public/videos/memory-02.mp4
  ...
  public/videos/memory-18.mp4
(.webm and .mov also work.)

If a file isn't there yet, the player lets you pick one from your computer
just for that viewing session.

Your unlocked progress is saved in the browser automatically.

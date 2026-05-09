# Fonts

This folder must contain **BowlbyOne-Regular.ttf** before the card renderer will
use the display typeface. Without it the renderer still works but falls back to
the system sans-serif — cards will look flat.

## Where to get it

1. Go to <https://fonts.google.com/specimen/Bowlby+One>
2. Click **Download family** (top-right button)
3. Extract the ZIP
4. Copy `BowlbyOne-Regular.ttf` into **this folder**
5. Verify the filename is exactly: `BowlbyOne-Regular.ttf`

## Optional: replacing with Gulfs Display

If you obtain a proper licence for Gulfs Display:

1. Drop `GulfsDisplay-Bold.ttf` into this folder
2. In `render.tsx`, change every `'BowlbyOne'` reference to `'GulfsDisplay'`
   and update the `readFileSync` path to match
3. Redeploy

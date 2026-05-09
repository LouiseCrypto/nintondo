# Character assets

This folder must contain exactly these **10 PNG files**.  
Each should be a transparent-background PNG, ideally 1024×1024 or larger,
roughly square. The renderer scales them to fit a ~420×400 px slot.

## Required files (exact filenames)

| Filename | Notes |
|----------|-------|
| `mario.png` | |
| `luigi.png` | |
| `peach.png` | Balcony scene — the smoking princess |
| `pikachu.png` | Angry / middle-finger version |
| `ash.png` | |
| `dk.png` | Hands-on-head panicking version (NOT the smoking-with-beer one) |
| `mew.png` | |
| `charmander.png` | |
| `bulbasaur.png` | |
| `mewtwo.png` | |

Filename matters — the renderer looks them up by exact name.

## Verifying

After dropping files in, run from `/web`:

```bash
ls api/_shared/assets/characters/
```

All 10 files should be listed.

## The `general` tag

Roasts tagged `general` randomly pick one of the 10 characters at render time.
As long as all 10 PNGs are present this works automatically.

## Missing files

If a character PNG is missing, the card renders without a character cameo
(no crash — the illustration window will just show the user's avatar alone
on a purple gradient background).

# PD2 Map Designer

Browser app for planning Project Diablo 2 maps with a simple visual workflow first.

## Main flow

- `Start`: first asks where your local extracted files are, or lets you skip them and sketch a map first.
- `Theme`: choose a simple mood card, then pick a local tileset from `LvlTypes.txt` if your files are loaded.
- `Build`: place rooms and corridors, then save variations before trying alternate layouts.
- `Review`: read blockers and warnings in plain English.
- `Export`: save the planner file, a review packet, or PD2-ready exports when available.

## What it does

- Starts with a blank visual map builder. No extracted files are required to begin.
- Lets you place rooms, corridors, junctions, entrances, exits, and boss rooms on a snapped grid.
- Lets you save and reload layout variations.
- Shows open or mismatched connections in plain language.
- Saves a planner JSON at any time.
- Builds a review packet zip that is easy to send to the PD2 team.
- Unlocks PD2-ready export after imported bindings are present and valid.

## What it does not do yet

- It does not edit MPQ archives.
- It does not paint raw tiles.
- It does not rewrite DS1 binary contents.
- It uses simple placeholder theme previews, not real game art previews.

## How to make your first map

1. Install packages.

```bash
npm install
```

2. Start the app.

```bash
npm run dev
```

3. Open the app.
4. On `Start`, either:
   - choose your extracted local folder or zip
   - click `I only want to sketch a map`
   - click `Teach me with an example`
5. In `Theme`, pick a mood card.
6. If local files are loaded, choose the local tileset you want to use.
7. In `Build`, choose a piece on the left and click cells to place it.
8. Save a variation before trying a different route.
9. Open `Review` to check route warnings and export blockers.
10. Open `Export` to save the planner JSON or the review packet.

## Import real PD2 data

Use the `Start` page first to load your local files. Use `Advanced Mode` only when you want to edit raw bindings directly.

Required extracted tables:

- `Levels.txt`
- `LvlMaze.txt`
- `LvlPrest.txt`
- `LvlTypes.txt`

Optional imported data:

- `ds1` room files for real room bindings and advanced palette pieces

## Scripts

```bash
# start the dev server
npm run dev

# run unit and component tests
npm test

# run lint
npm run lint

# build the production bundle
npm run build

# run the Playwright smoke test
npm run test:e2e
```

## GitHub Pages

This repo deploys with GitHub Actions.

If Pages is not enabled yet for a fork:

1. Open GitHub repo `Settings`.
2. Click `Pages`.
3. Set `Source` to `GitHub Actions`.
4. Push to `main` again.

The site for this repo should publish at:

- [PD2 Map Designer Demo](https://fyrestormx.github.io/PD2-Map-Designer/)

## Core references

- [PD2 Map Pathing Guide](https://maaaaaarrk.github.io/Hiim-PD2-Resources/maps.html)
- [Project Diablo 2 Maps Wiki](https://wiki.projectdiablo2.com/wiki/Maps)
- [D2R Data Guide](https://d2r-gimli.github.io/D2R_DataGuide/)
- [Diablo II Data File Guide](https://d2r-gimli.github.io/diabloiidatafileguide/)

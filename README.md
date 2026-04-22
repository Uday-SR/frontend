# Pokédex App

Pokédex built with Angular (standalone components + signals) featuring search, filtering, pagination, stats visualization, and Pokémon detail insights with radar charts and media integration.

# Features
- Real-time search
- Sorting (Name / ID / Stats)
- Type filtering (Fire, Water, Grass, etc.)
- Pagination system
- Radar chart (stats visualization using Chart.js)
- Pokémon detail panel (inline UI)
- Video integration (YouTube map per Pokémon)
- Cry audio playback
- Fully reactive architecture using Angular Signals
- Tailwind CSS UI

# Tech Stack
- Angular (Standalone Components)
- RxJS + Signals (toSignal, computed, effect)
- Chart.js + ng2-charts
- Tailwind CSS
- TypeScript

# Architecture
```bash
src/app/
├── core/
│   ├── graphql/
│   │   ├── apollo.config.ts
│   │
│   ├── services/ 
│   │   ├── pokemon.service.ts
│   │   ├── trainer.service.ts
│
├── features/
│   ├── pokedex/
│   │   ├── pokedex.component.ts
│   │   ├── pokedex.component.html
│   │
│   ├── pokemon-detail-panel/ 
│   │   ├── pokemon-detail-panel.component.ts
│   │   ├── pokemon-detail-panel.component.html
│   │   ├── videoMap.ts
|   |   
|   ├── battle-dashboard/
|   │   │   ├── battle-dashboard.component.ts
|   │   │   ├── battle-dashboard.component.html
|   |
|   ├── battle-logs/
│   │   ├── battle-logs.component.ts
│   │   ├── battle-logs.component.html
|   |
|   ├── dashboard/
│   │   ├── dashboard.component.ts
│   │   ├── dashboard.component.html
│   │
│   ├── mutation-panel/ (optional legacy)
│   │   ├── mutation-panel.component.ts
│   │   ├── mutation-panel.component.html
|   |   
|   ├── team-builder/
│   │   ├── team-builder.component.ts
│   │   ├── team-builder.component.html
|   |
│   ├── teams/
│   │   ├── teams.component.ts
│   │   ├── teams.component.html
|   |   
|   ├── trainer-profile/
│   │   ├── trainer-profile.component.ts
│   │   ├── trainer-profile.component.html       
│
├── state/
│   ├── pokemon.store.ts
│   ├── pokemon.selectors.ts
|   ├── trainer.store.ts
│   ├── trainer.selectors.ts
│
├── interface/
│   ├── pokemon.model.ts
|   ├── team.model.ts
|   ├── battle.model.ts
|   ├── trainer.model.ts
```
# Data Flow

    PokemonStore (RxJS)
            ↓
    selectFilteredSortedPokemon()
            ↓
    Signals (toSignal)
            ↓
    UI (Angular Template)
            ↓
    User Actions (search, filter, select)
            ↓
    Computed Signals update UI automatically

# Key Design Decisions

1.  Signals over Observables (UI layer)
    UI state handled using signal() + computed()
    Cleaner reactivity than RxJS in components
2.  Store-based architecture
    Centralized Pokémon state in PokemonStore
    Selector layer handles filtering logic
3.  Inline Detail Panel (no separate route)
    Faster UX
    No navigation overhead

# Overlay-based UI

- Features Breakdown
- Search + Filter
    Instant filtering via reactive signals
- Pagination
    Client-side slicing with computed signals
- Radar Chart
    Stats visualization using Chart.js radar controller
- Detail Panel
    Shows:
    Sprite
    Types
    Stats bars
    Radar chart
    Video Mapping System

Each Pokémon can have an optional video:

export const POKEMON_VIDEO_MAP: Record<number, string> = {
  1: "https://www.youtube.com/embed/xxxx",
  4: "https://www.youtube.com/embed/yyyy",
};

# Bonus Features Attempted

# Screenshots

Main Pokédex Table
/screenshots/pikedex.png

Pokémon Detail Panel
/screenshots/pokemon-detail.png

Team Builder
/screenshots/Team-builder.png

Dashboard
/screenshots/dashboard.png

# Setup Instructions

1. Install dependencies
    ```bash
    npm install
    ```

2. Run development server
    ```bash
    ng serve
    ```

App runs at:
http://localhost:4200

3. Run Mock Server
    ```bash
    npx json-graphql-server db.js --port 4000
    ```
# Project Spec: Poapptry

## 1. Core Philosophy
- **Vibe:** Tactile, Analog, Minimalist, Cozy.
- **Platform:** Web First (PWA), Mobile responsive.
- **Auth Strategy:** "Guest First". User writes anonymously. Auth (Firebase) is only triggered when saving/syncing to a permanent account.

## 2. Tech Stack
- **Framework:** React Native (Expo SDK 50+)
- **Router:** Expo Router (File-based routing)
- **Styling:** NativeWind (Tailwind CSS)
- **Backend:** Firebase (Web SDK)
- **Internationalization:** `i18next` + `react-i18next` (EN/ES support). Detects device language.

## 3. Data Model (Firestore)
- **Collection `poems`:**
  - `id`: string
  - `title`: string
  - `body`: string
  - `authorUid`: string
  - `createdAt`: number
  - `isPublic`: boolean (Default: false)
  
  // The "Vibe" Configuration
  - `config`: {
      `presetId`: 'classic' | 'old_classic' | 'pixel' | 'old_machine' | 'rainbow' | 'ancient',
      `fontFamily`: string,
      `paperId`: string,
      `textAlign`: 'left' | 'center',
      `fontSize`: number,
      `inkColor`: string
    }

  // Fixed Decorations
  - `decorations`: {
      `washiId`: string | null, 
      `washiPosition`: 'top' | 'bottom',
      `bookmarkId`: string | null,
      `bookmarkSide`: 'left' | 'right'
    }

  // Free-floating Decorations
  - `stamps`: Array<{ 
      `id`: string,       // e.g. 'stamp_1'
      `x`: number,        // Percentage (0-100)
      `y`: number,        // Percentage (0-100)
      `rotation`: number, // Degrees
      `scale`: number,    // 0.5 to 2.0
      `opacity`: number   // 0.3 to 1.0
    }>

## 4. User Flow (The "Desk" Concept)

**Core Concept:** The app launches directly into the **Editor** (The Desk). 
There is no "Home Screen" list. The list is hidden inside the "Drawer".

**View vs. Edit Logic:**
- **Edit Mode:** Full UI visible. User can type and drag stamps.
- **View Mode:** UI is hidden. The poem is a clean art piece.
- **Toggle:** Tapping the paper background toggles between modes.

```mermaid
graph TD
    Start[App Launch] --> A[The Desk]
    
    subgraph The Desk (States)
        A -->|Default| Edit[Edit Mode: UI Visible]
        Edit -->|Tap Paper| View[View Mode: UI Hidden]
        View -->|Tap Paper| Edit
    end
    
    subgraph UI Actions (Only in Edit Mode)
        Edit -->|Tap 'Stationery'| B[Assets Menu]
        Edit -->|Tap 'Drawer'| C[Saved Poems List]
        Edit -->|Tap 'Share'| D[Generate Link]
    end
    
    subgraph Stationery (Assets)
        B -->|Change Preset| B1[Apply Paper/Font/Ink]
        B -->|Add Stamp| B2[Stamp appears at center]
        B2 -->|Drag/Pinch| B3[Update Stamp Coords]
    end
    
    subgraph The Drawer (Library)
        C -->|Tap a Poem| A[Load Poem onto Desk]
        C -->|Swipe Left| C1[Delete]
    end
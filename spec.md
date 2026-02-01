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

## 3. Data Model (Firestore & Local Storage)
- **Collection `poems` (or Local Storage Object):**
  - `id`: string
  - `title`: string
  - `pages`: Array<{
      `id`: string,
      `textBoxes`: Array<TextBox>
    }>
  - `authorUid`: string | null (null for guest)
  - `createdAt`: number
  - `isPublic`: boolean (Default: false)
  
  // The "Vibe" Configuration (Defaults for new elements)
  - `config`: {
      `presetId`: string,
      `paperId`: string,
      `fontId`: string,
      `inkColor`: string,
      `fontSize`: 'small' | 'medium' | 'large',
      `textAlign`: 'left' | 'center' | 'right',
      `lineSpacing`: number,
    }

  // Free-floating Decorations (All interactive: Drag, Select, Delete)
  - `stamps`: Array<Decoration> (Max 3)
  - `washiTapes`: Array<Decoration> (Max 3)
  - `bookmarks`: Array<Decoration> (Max 1)

  // Decoration Interface
  interface Decoration { 
      `id`: string,       // Unique Instance ID
      `assetId`: string,  // e.g. 'stamp_1', 'washi_gold', 'bookmark_flowers'
      `type`: 'stamp' | 'washi' | 'bookmark',
      `x`: number,        // Percentage (0-100)
      `y`: number,        // Percentage (0-100)
      `rotation`: number, // Degrees
      `scale`: number,    // 0.2 to 3.0
      `opacity`: number   // 0.3 to 1.0
    }

  // TextBox Interface
  interface TextBox {
    `id`: string,
    `content`: string, // Rich Text (HTML)
    `x`: number,       // Percentage (0-100)
    `y`: number,       // Percentage (0-100)
    `width`: number,   // Percentage (0-100)
    `height`: number,  // Percentage (0-100)
    `rotation`: number,
    `zIndex`: number,
    `style`: {
       `fontFamily`: string,
       `fontSize`: number,
       `lineHeight`: number, // Optional, for consistent vertical rhythm
       `textAlign`: 'left' | 'center' | 'right',
       `color`: string,
    }
  }

## 4. User Flow (The "Desk" Concept)

**Core Concept:** The app launches directly into the **Editor** (The Desk). 
There is no "Home Screen" list. The list is hidden inside the "Drawer".

**View vs. Edit Logic:**
- **Edit Mode:** Full UI visible. User can type and drag decorations (stamps, washi, bookmarks).
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
        B -->|Add Decoration| B2[Item appears (Stamp/Washi/Bookmark)]
        B2 -->|Drag/Pinch| B3[Update Coords]
    end
    
    subgraph The Drawer (Library)
        C -->|Tap a Poem| A[Load Poem onto Desk]
        C -->|Swipe Left| C1[Delete]
    end
```

## 5. Text Box System

**Core Change:** 
Instead of a single full-page text area, the app now uses movable, resizable text boxes.

**Constraints:**
1.  **Max Text Boxes:** 3 per page.
2.  **Word Limit:** 300 words per text box.
3.  **Rich Text (Web Only):** Users can apply Bold, Italic, and Underline to specific words. Native uses plain text for now.

**Implementation Details:**
-   **Web:** Uses `contentEditable` div for rich text capabilities.
-   **Native:** Uses `TextInput` with plain text fallback.
-   **Drag & Drop:** Text boxes can be dragged and resized using a wrapper component (`DraggableTextBox`).
-   **Positioning:** All coordinates (x, y, width, height) are stored as percentages (0-100%) of the paper size to ensure consistency across different screen sizes.
-   **Pixel Perfect Scaling:** 
    - A `scale` prop is passed to `RichTextBox` to render text proportionally to the screen size (Reference Width: 375px).
    - Internal padding (8px base) and placeholder positioning also scale proportionally to ensure consistent text wrapping.
    - Thumbnails use the same scaling logic to ensure they are exact visual replicas of the editor.
-   **Styling:** Font family, size, line-height, color, and alignment can be applied per text box.
-   **Mobile Interaction:** Opening the Style menu automatically dismisses the keyboard (and blurs the input) to allow full view of styling options. Tapping the text box again re-opens the keyboard.

## 6. Future Considerations

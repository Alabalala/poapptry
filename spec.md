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
```

## 5. Technical Constraints & Fixes

### Text Input Sizing vs. Alignment (React Native Web)
**Problem:** 
On React Native Web, `TextInput` (mapped to HTML `textarea`) has conflicting behaviors:
1.  **Full Page Clickability:** Requires the input to fill the container (`minHeight: 100%`).
2.  **Vertical Alignment:** Standard CSS vertical alignment (e.g., `justify-content`) breaks when the `textarea` is forced to 100% height. It fills the space, making "centering" irrelevant in Flexbox terms because the child is as big as the parent.

**Solution (The "Ghost Text" Pattern):**
We use a platform-specific approach to achieve both full-page clickability and correct vertical alignment.

- **Native (iOS/Android):** 
  - Simply uses `textAlignVertical: 'top' | 'center' | 'bottom'`. This is a native prop that works perfectly with `minHeight: '100%'`.

- **Web:**
  - **Full Height:** The `TextInput` is given `minHeight: '100%'` so clicks anywhere on the page focus the input immediately.
  - **Ghost Measurement:** We render a hidden `<Text>` component ("Ghost Text") that mirrors the input's content, font, width, and line height. This element is `position: absolute` and `opacity: 0`.
  - **Dynamic Padding:** We measure the height of the Ghost Text via `onLayout`. We then calculate the `paddingTop` needed to simulate vertical alignment:
    - **Top:** `0`
    - **Center:** `(PaperHeight - TextHeight) / 2`
    - **Bottom:** `PaperHeight - TextHeight`

**Code Example:**
```tsx
// 1. Ghost Text (Web Only)
{isWeb && (
  <Text
    style={[textStyle, { position: 'absolute', opacity: 0 }]}
    onLayout={(e) => {
      const h = e.nativeEvent.layout.height;
      // Calculate padding based on paperHeight and this text height
      setPaddingTop(calculateWebPadding(h, paperHeight));
    }}
  >
    {content}
  </Text>
)}

// 2. Main Input
<TextInput
  style={{
    minHeight: '100%', // Fills page
    paddingTop: isWeb ? paddingTop : 0, // Simulated alignment
    textAlignVertical: isWeb ? 'top' : activeConfig.verticalAlign // Native alignment
  }}
/>
```

## 6. Future Considerations
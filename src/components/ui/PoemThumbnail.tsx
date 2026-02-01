import { BOOKMARKS, PAPERS, STAMPS, WASHI } from '@/constants/ThemeRegistry';
import { Decoration } from '@/context/PoemContext';
import { PoemData } from '@/services/poemService';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

interface PoemThumbnailProps {
  poem: PoemData;
  width: number;
}

export default function PoemThumbnail({ poem, width }: PoemThumbnailProps) {
  const A4_RATIO = 0.707;
  const height = width / A4_RATIO;
  
  // Base dimensions to render content at before scaling
  // We'll render at a "standard" phone width to ensure text layout is similar to actual view
  const BASE_WIDTH = 375;
  const BASE_HEIGHT = BASE_WIDTH / A4_RATIO;
  const scale = width / BASE_WIDTH;

  const { activeConfig, pages, stamps = [], washiTapes = [], bookmarks = [] } = poem;

  // Helper to strip HTML tags and preserve line breaks
  const stripHtml = (html: string) => {
    if (!html) return '';
    return html
      .replace(/<br\s*\/?>/gi, '\n') // Replace <br> with newline
      .replace(/<\/div>/gi, '\n')    // Replace </div> with newline
      .replace(/<\/p>/gi, '\n')      // Replace </p> with newline
      .replace(/<[^>]+>/g, '')       // Remove remaining tags
      .replace(/&nbsp;/g, ' ')       // Replace &nbsp; with space
      .trim();                       // Trim whitespace
  };

  const content = pages[0]?.textBoxes?.map(t => stripHtml(t.content)).join('\n') || '';

  // Helper to render decorations
  const renderDecoration = (d: Decoration) => {
     let source;
     let baseW = 100;
     let baseH = 100;

     if (d.type === 'washi') {
       source = WASHI[d.assetId as keyof typeof WASHI];
       baseW = BASE_WIDTH * 0.55;
       baseH = baseW * (74 / 220);
     } else if (d.type === 'bookmark') {
       source = BOOKMARKS[d.assetId as keyof typeof BOOKMARKS];
       baseW = BASE_WIDTH * 0.40;
       baseH = baseW * (600 / 160);
     } else {
       // Stamps
       source = STAMPS[d.assetId as keyof typeof STAMPS];
       baseW = BASE_WIDTH * 0.25;
       baseH = baseW; // Square
     }
     
     if (!source) return null;

     const finalW = baseW * d.scale;
     const finalH = baseH * d.scale;
     
     // Position is percentage based
     const left = (d.x / 100) * BASE_WIDTH - (finalW / 2);
     const top = (d.y / 100) * BASE_HEIGHT - (finalH / 2);

     return (
       <Image
         key={d.id}
         source={source}
         style={{
           position: 'absolute',
           left,
           top,
           width: finalW,
           height: finalH,
           transform: [{ rotate: `${d.rotation}deg` }],
           opacity: d.opacity,
         }}
         resizeMode="contain"
       />
     );
  };

  const paperSource = PAPERS[activeConfig.paperId as keyof typeof PAPERS] || PAPERS.paper_classic;

  return (
    <View style={{ width, height, overflow: 'hidden', backgroundColor: 'transparent' }}>
      <View style={[
        styles.scaler, 
        { 
          width: BASE_WIDTH, 
          height: BASE_HEIGHT,
          transform: [{ scale }],
          left: (width - BASE_WIDTH) / 2,
          top: (height - BASE_HEIGHT) / 2,
        }
      ]}>
         {/* Paper Layers (Stack Effect) */}
         <View style={[styles.layer, { width: BASE_WIDTH, height: BASE_HEIGHT, transform: [{ rotate: '-1.5deg' }] }]} />
         <View style={[styles.layer, { width: BASE_WIDTH, height: BASE_HEIGHT, transform: [{ rotate: '1deg' }] }]} />
         
         {/* Main Paper */}
         <View style={[styles.paper, { width: BASE_WIDTH, height: BASE_HEIGHT }]}>
           <Image source={paperSource} style={StyleSheet.absoluteFill} resizeMode="cover" />
           
           {/* Text Boxes (Rendered exactly as in editor) */}
           <View style={[StyleSheet.absoluteFill, { zIndex: 10 }]}>
             {pages[0]?.textBoxes?.map((box) => {
               // Handle legacy pixels vs new percentages
               // If box.x > 100, it's pixels. We map pixels/375 to %.
               // If box.x <= 100, it's %.
               // However, current editor width might differ from 375.
               // Assuming saved data is consistent with our new logic (percentages).
               
               let left = (box.x / 100) * BASE_WIDTH;
               let top = (box.y / 100) * BASE_HEIGHT;
               let boxWidth = (box.width / 100) * BASE_WIDTH;
               
               // Fallback for legacy pixel data (heuristic: x > 100 or width > 100)
               if (box.x > 100 || box.width > 100) {
                  left = box.x; // This might be off if screen size differed, but best effort
                  top = box.y;
                  boxWidth = box.width;
               }

               return (
                 <View
                   key={box.id}
                   style={{
                     position: 'absolute',
                     left,
                     top,
                     width: boxWidth,
                     padding: 8,
                     // height: 'auto', // Let text expand
                   }}
                 >
                   <Text
                     style={{
                       fontFamily: box.style.fontFamily,
                        fontSize: box.style.fontSize, // 16px here will be scaled by parent transform
                        lineHeight: box.style.lineHeight, // Should also be scaled by parent transform
                        textAlign: box.style.textAlign,
                       color: box.style.color,
                       fontWeight: box.style.fontWeight,
                       fontStyle: box.style.fontStyle,
                       textDecorationLine: box.style.textDecorationLine,
                     }}
                   >
                     {stripHtml(box.content)}
                   </Text>
                 </View>
               );
             })}
           </View>

           {/* Decorations */}
           <View style={[StyleSheet.absoluteFill, { overflow: 'hidden', zIndex: 5 }]}>
             {washiTapes.map(renderDecoration)}
             {stamps.map(renderDecoration)}
             {bookmarks.map(renderDecoration)}
           </View>
         </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scaler: {
    position: 'absolute',
    // backgroundColor: 'red', // Debug
  },
  layer: {
    position: 'absolute',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  paper: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden', // Clip content to paper
  }
});

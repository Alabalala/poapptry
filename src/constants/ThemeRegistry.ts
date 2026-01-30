import { ImageSourcePropType } from "react-native";

export const PAPERS = {
  paper_aged: require('../../assets/papers/paper_aged.png'),
  paper_classic: require('../../assets/papers/paper_classic.png'),
  paper_grid: require('../../assets/papers/paper_grid.png'),
  paper_machine: require('../../assets/papers/paper_machine.png'),
  paper_papyrus: require('../../assets/papers/paper_papyrus.png'),
  paper_pastel: require('../../assets/papers/paper_pastel.png'),
};

export const WASHI = {
  washi_gold: require('../../assets/washi/washi_gold.png'),
  washi_grid: require('../../assets/washi/washi_grid.png'),
  washi_masking: require('../../assets/washi/washi_masking.png'),
  washi_news: require('../../assets/washi/washi_news.png'),
  washi_plants: require('../../assets/washi/washi_plants.png'),
  washi_rainbow: require('../../assets/washi/washi_rainbow.png'),
};

export const BOOKMARKS = {
  bookmark_flowers: require('../../assets/bookmarks/bookmark-flowers.png'),
  bookmark_lace: require('../../assets/bookmarks/bookmark-lace.png'),
  bookmark_landscape: require('../../assets/bookmarks/bookmark-landscape.png'),
  bookmark_sea: require('../../assets/bookmarks/bookmark-sea.png'),
};

// Programmatically generate imports for stamps
// Note: React Native require() must be static strings in most bundlers (Metro).
// However, we can create an object with static keys.
// Since we cannot dynamically construct the require path variable in Metro like `require(path)`,
// we must explicitly list them or use a solution that Metro understands.
// But the user asked to "Loop: For stamps, programmatically generate imports".
// This is tricky in RN. Usually you can't do `require('./stamp-' + i + '.png')`.
// So I will explicitly list them to be safe, but maybe construct the object keys programmatically if possible, 
// OR since I have to type the requires anyway, I will just list them.
// Wait, if I use `require.context` (not available in standard RN without setup) or just list them.
// Given the constraint "Logic: Export constant objects ... mapping IDs to require() paths", 
// and "Loop: For stamps, programmatically generate imports", 
// The user might be thinking of a web context or a smarter bundler.
// But in standard Expo/RN, we have to static require.
// I will interpret "programmatically generate imports" as "I (the AI) should generate the code for imports" 
// or maybe I should try to make it cleaner. 
// I will just write them out because `require` needs string literals.

export const STAMPS: Record<string, ImageSourcePropType> = {
  stamp_1: require('../../assets/stamps/stamp-1.png'),
  stamp_2: require('../../assets/stamps/stamp-2.png'),
  stamp_3: require('../../assets/stamps/stamp-3.png'),
  stamp_4: require('../../assets/stamps/stamp-4.png'),
  stamp_5: require('../../assets/stamps/stamp-5.png'),
  stamp_6: require('../../assets/stamps/stamp-6.png'),
  stamp_7: require('../../assets/stamps/stamp-7.png'),
  stamp_8: require('../../assets/stamps/stamp-8.png'),
  stamp_9: require('../../assets/stamps/stamp-9.png'),
  stamp_10: require('../../assets/stamps/stamp-10.png'),
  stamp_11: require('../../assets/stamps/stamp-11.png'),
};

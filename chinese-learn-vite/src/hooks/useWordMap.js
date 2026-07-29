import { useMemo } from 'react';
import { VOCABULARY } from '../data/vocabulary';

/**
 * Returns word clusters grouped by shared Chinese characters.
 * For the card-based display on the Word Map page.
 */
export default function useWordMap({ searchTerm, selectedCategory, selectedSubcategories }) {
  return useMemo(() => {
    let words = VOCABULARY;

    // Filter by search term
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      words = words.filter(w =>
        (w.chinese && w.chinese.includes(q)) ||
        (w.pinyin && w.pinyin.toLowerCase().includes(q)) ||
        (w.meaning && w.meaning.toLowerCase().includes(q)) ||
        (w.meaningThai && w.meaningThai.toLowerCase().includes(q))
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      words = words.filter(w => w.category === selectedCategory);
    }

    // Filter by subcategories
    if (selectedSubcategories.length > 0) {
      words = words.filter(w => selectedSubcategories.includes(w.subcategory));
    }

    // Deduplicate by Chinese text — the vocabulary contains the same `chinese`
    // word across multiple HSK levels with different IDs (e.g. 可爱 as hsk3-108
    // AND hsk4-058). Without this, charIndex would store each ID separately
    // and WordMap cards would show the same related word chip multiple times.
    const seenWords = new Set();
    words = words.filter(w => {
      if (seenWords.has(w.chinese)) return false;
      seenWords.add(w.chinese);
      return true;
    });

    const totalCount = words.length;

    // Build character index from ALL filtered words (not just display words)
    // so connections are comprehensive even for words that don't make the 50-word cut
    const charIndex = {};
    for (const word of words) {
      for (const ch of word.chinese) {
        if (!ch.match(/[\u4e00-\u9fff]/)) continue;
        if (!charIndex[ch]) charIndex[ch] = [];
        charIndex[ch].push(word);
      }
    }

    // Build clusters for ALL filtered words first
    const allClusters = words.map(word => {
      const seenChars = new Set();
      const clusters = [];
      for (const ch of word.chinese) {
        if (!ch.match(/[\u4e00-\u9fff]/) || seenChars.has(ch)) continue;
        seenChars.add(ch);
        const siblings = charIndex[ch] || [];
        // Compare by `chinese` (the visible canonical label) rather than `id`,
        // because duplicates have different IDs but identical Chinese text.
        const related = siblings.filter(v => v.chinese !== word.chinese);
        if (related.length > 0) {
          clusters.push({ char: ch, related });
        }
      }
      return { word, clusters };
    });

    // Keep only words that have at least one connection
    const connectedOnly = allClusters.filter(c => c.clusters.length > 0);
    const totalConnected = connectedOnly.length;

    // Return ALL connected words — WordMap page handles pagination (50/page)
    const clusters = connectedOnly;

    return { clusters, totalCount: totalConnected };
  }, [searchTerm, selectedCategory, selectedSubcategories]);
}

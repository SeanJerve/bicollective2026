const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('dist')) {
        results = results.concat(walk(file));
      }
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
};

// Regex for emojis
const emojiRegex = /[\uD800-\uDBFF][\uDC00-\uDFFF]|\p{Emoji_Presentation}|\p{Emoji}\uFE0F/gu;

const files = walk('./src');
files.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  let matches = [];
  // Reset regex
  emojiRegex.lastIndex = 0;
  
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (emojiRegex.test(line)) {
      // Find what emojis are in the line
      const emojis = line.match(emojiRegex);
      matches.push({ lineNum: idx + 1, content: line.trim(), emojis });
    }
  });
  
  if (matches.length > 0) {
    console.log(`\nFile: ${file}`);
    matches.forEach((m) => {
      console.log(`  Line ${m.lineNum}: ${m.emojis.join(', ')} -> "${m.content}"`);
    });
  }
});

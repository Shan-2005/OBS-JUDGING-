const fs = require('fs');

const officialList = JSON.parse(fs.readFileSync('official_list.json', 'utf8'));

let storeCode = fs.readFileSync('d:\\obs_judging\\js\\store.js', 'utf8');

// Format officialCsvList string for insertion
const formattedListStr = JSON.stringify(officialList, null, 2);

// Replace officialCsvList in store.js
const seedStartMarker = 'const officialCsvList = [';
const seedEndMarker = '];\n\n  storeState.teams = [];';

const startIndex = storeCode.indexOf(seedStartMarker);
const endIndex = storeCode.indexOf(seedEndMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('Could not locate seed markers in store.js');
  process.exit(1);
}

const newSeedBlock = `const officialCsvList = ${formattedListStr};\n`;

const updatedStoreCode = storeCode.substring(0, startIndex) + newSeedBlock + storeCode.substring(endIndex + 3);

fs.writeFileSync('d:\\obs_judging\\js\\store.js', updatedStoreCode);
console.log('Successfully updated js/store.js with all 58 official teams & roster sizes!');

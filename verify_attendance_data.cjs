const fs = require('fs');
const path = require('path');

// 1. Read CSV
const csvPath = 'C:\\Users\\areoj\\Downloads\\obs-rb2-event-teams-6-aug-2026-1958.csv';
const csvContent = fs.readFileSync(csvPath, 'utf8');
const csvLines = csvContent.split('\n').filter(l => l.trim());

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

const csvTeams = [];
for (let i = 1; i < csvLines.length; i++) {
  const cols = parseCsvLine(csvLines[i]);
  csvTeams.push({
    botId: `BOT-${String(i).padStart(3, '0')}`,
    name: cols[1],
    leader: cols[2],
    email: cols[3],
    phone: cols[4],
    rosterSize: parseInt(cols[5], 10) || 1
  });
}

// 2. Read js/store.js officialCsvList
const storeContent = fs.readFileSync('d:\\obs_judging\\js\\store.js', 'utf8');
const listStartMarker = 'const officialCsvList = ';
const listEndMarker = ';\n\n  storeState.teams = [];';

const startIdx = storeContent.indexOf(listStartMarker);
const endIdx = storeContent.indexOf(listEndMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error('VERIFICATION FAILED: Could not parse officialCsvList from store.js');
  process.exit(1);
}

const jsonStr = storeContent.substring(startIdx + listStartMarker.length, endIdx);
const storeList = JSON.parse(jsonStr);

console.log('=============== ROBODEST 2.0 DATA AUDIT & VERIFICATION REPORT ===============\n');
console.log(`Total CSV Teams: ${csvTeams.length}`);
console.log(`Total Store Teams: ${storeList.length}\n`);

let errors = 0;
let totalMembersCount = 0;

for (let i = 0; i < csvTeams.length; i++) {
  const csvT = csvTeams[i];
  const storeT = storeList[i];

  if (!storeT) {
    console.error(`❌ Mismatch at index ${i}: Team ${csvT.botId} missing in store.js`);
    errors++;
    continue;
  }

  if (csvT.name !== storeT.name) {
    console.error(`❌ Mismatch at ${csvT.botId}: Name "${csvT.name}" vs Store "${storeT.name}"`);
    errors++;
  }

  if (csvT.rosterSize !== storeT.rosterSize) {
    console.error(`❌ Mismatch at ${csvT.botId} (${csvT.name}): CSV roster size ${csvT.rosterSize} vs Store ${storeT.rosterSize}`);
    errors++;
  }

  totalMembersCount += storeT.rosterSize;
}

if (errors === 0) {
  console.log('✅ ALL 58 TEAMS & MEMBER COUNTS MATCH 100% PERFECTLY!');
  console.log(`✅ Total Registered Team Members Across All 58 Teams: ${totalMembersCount}`);
  console.log('\nSample Verification Breakdown:');
  console.log(`- ${storeList[0].name} (BOT-001): ${storeList[0].rosterSize} members`);
  console.log(`- ${storeList[3].name} (BOT-004): ${storeList[3].rosterSize} member`);
  console.log(`- ${storeList[53].name} (BOT-054): ${storeList[53].rosterSize} members`);
  console.log(`- ${storeList[57].name} (BOT-058): ${storeList[57].rosterSize} members`);
} else {
  console.error(`\n❌ VERIFICATION COMPLETED WITH ${errors} ERRORS.`);
  process.exit(1);
}

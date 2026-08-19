const fs = require('fs');
const path = require('path');

const csvPath = 'C:\\Users\\areoj\\Downloads\\obs-rb2-event-teams-6-aug-2026-1958.csv';
const content = fs.readFileSync(csvPath, 'utf8');
const lines = content.split('\n').filter(l => l.trim());

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

const teams = [];
for (let i = 1; i < lines.length; i++) {
  const cols = parseCsvLine(lines[i]);
  teams.push({
    index: i,
    botId: `BOT-${String(i).padStart(3, '0')}`,
    uuid: cols[0],
    name: cols[1],
    leader: cols[2],
    email: cols[3],
    phone: cols[4],
    rosterSize: parseInt(cols[5], 10) || 1,
    acceptedCount: parseInt(cols[6], 10) || 1
  });
}

console.log(`Parsed ${teams.length} teams from CSV.\n`);
console.log('First 5 teams:');
console.log(teams.slice(0, 5));
console.log('\nLast 5 teams:');
console.log(teams.slice(-5));

// Export json format for store.js
fs.writeFileSync('d:\\obs_judging\\parsed_teams.json', JSON.stringify(teams, null, 2));
console.log('\nWrote parsed_teams.json successfully');

const fs = require('fs');

let storeJs = fs.readFileSync('d:\\obs_judging\\js\\store.js', 'utf8');
let scoringJs = fs.readFileSync('d:\\obs_judging\\js\\scoring.js', 'utf8');

// Replace top-level let storeState with var storeState
storeJs = storeJs.replace('let storeState =', 'var storeState =');

global.localStorage = { getItem: () => null, setItem: () => {} };
global.window = { print: () => console.log('>>> window.print() called successfully!') };

eval(storeJs);
eval(scoringJs);

const r1All = getRankedLeaderboard('round1');
const r2All = getRankedLeaderboard('round2');

console.log(`\nVerified getRankedLeaderboard('round1') returned ${r1All.length} teams.`);
console.log('Sample Team #1:', r1All[0].teamId, r1All[0].teamName, 'hasRun:', r1All[0].hasRun);
console.log('Sample Team #58:', r1All[57].teamId, r1All[57].teamName, 'hasRun:', r1All[57].hasRun);

console.log(`\nVerified getRankedLeaderboard('round2') returned ${r2All.length} teams.`);

if (r1All.length === 58 && r2All.length === 25) {
  console.log('\n✅ PRINT ENGINE FIX VERIFIED SUCCESSFULLY! ALL 58 TEAMS ARE INCLUDED IN ROUND PRINTING!');
} else {
  console.error('\n❌ PRINT ENGINE FIX TEST FAILED.');
  process.exit(1);
}

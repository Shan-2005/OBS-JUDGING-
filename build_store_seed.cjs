const fs = require('fs');

const parsed = JSON.parse(fs.readFileSync('parsed_teams.json', 'utf8'));

// Map institution names from existing list or default
const instMap = {
  "SRM School TEAM13": "SRM School",
  "SRM School TEAM12": "SRM School",
  "SRM School TEAM14": "SRM School",
  "SRM School TEAM11": "SRM School",
  "SRM School TEAM15": "SRM School",
  "Python Riders": "SRMIST",
  "Bodhians": "Bodhi International",
  "IMEC - 3": "RoboFest Participant",
  "IMEC - 2": "Aditya University",
  "IMEC-1": "RoboFest Participant",
  "Bodhispark": "Bodhi International",
  "Bodhibots": "Bodhi International",
  "Robotitans": "RoboFest Participant",
  "Nura Robotics": "RoboFest Participant",
  "Bionary VITC": "RoboFest Participant",
  "NEXORA": "RoboFest Participant",
  "ROBOTIC RANGERS": "RoboFest Participant",
  "Eric Rc hobbies": "RoboFest Participant",
  "Gravity": "VIT University",
  "Ds Robotics": "RoboFest Participant",
  "Akatsuki": "KIET Group of Institutions",
  "NitroBot": "RoboFest Participant",
  "LATENCY ZERO": "DSCE Bangalore",
  "Satecbot": "RoboFest Participant",
  "TORQUE TITANS": "RoboFest Participant",
  "Draco bots": "RoboFest Participant",
  "Draxis": "RoboFest Participant",
  "Pathfinders": "VIT University",
  "Valthukal valthukal": "RoboFest Participant",
  "Vector Evasions": "RoboFest Participant",
  "Stealth Strikers": "RoboFest Participant",
  "heisenberg": "Sairam Vidyalaya",
  "Apex Point": "RoboFest Participant",
  "Cyber spirits": "VIT University",
  "MechaTech": "RoboFest Participant",
  "Robo blitz league": "RoboFest Participant",
  "Ghost Rider": "RoboFest Participant",
  "Titan": "RoboFest Participant",
  "LPL Squad": "RoboFest Participant",
  "Zenvaa Technologies": "RoboFest Participant",
  "The Glitch kings": "RoboFest Participant",
  "Rohith’s Race": "RoboFest Participant",
  "Angry Bird": "Bloomingdale International",
  "Route Rangers": "SSN College of Engineering",
  "Voltage vipers": "RoboFest Participant",
  "Tokyo Drifters": "SSN College of Engineering",
  "RTJ AUTOBOYS": "RoboFest Participant",
  "YHSC BOT CREATORS VELS": "RoboFest Participant",
  "Samurai blue": "RoboFest Participant",
  "Techno Titans": "RoboFest Participant",
  "Thunderstrike": "RoboFest Participant",
  "Solo Protocol": "RoboFest Participant",
  "Velocity Vortex": "RoboFest Participant",
  "Track OFF": "RoboFest Participant",
  "Odyssey sciences": "RoboFest Participant",
  "RODIX": "RoboFest Participant",
  "Drift Dynamix": "RoboFest Participant",
  "Shadowx": "RoboFest Participant"
};

const officialList = parsed.map(t => ({
  name: t.name,
  inst: instMap[t.name] || "RoboFest Participant",
  leader: t.leader || `Lead (${t.name})`,
  email: t.email,
  phone: t.phone,
  rosterSize: t.rosterSize
}));

console.log(`Generated officialList with ${officialList.length} items.\n`);
console.log('Sample item 0:', officialList[0]);
console.log('Sample item 57:', officialList[57]);

fs.writeFileSync('official_list.json', JSON.stringify(officialList, null, 2));

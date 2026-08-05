// Achievements & Daily Missions Database

export const ACHIEVEMENTS_DATABASE = [
  {
    id: "ach-first-victory",
    title: "First Summit",
    desc: "Win your very first mountain race.",
    icon: "🥇",
    rewardCoins: 100,
    rewardXp: 150,
    check: (stats) => stats.wins >= 1
  },
  {
    id: "ach-speed-60",
    title: "Speed Racer",
    desc: "Reach a typing speed of 60 WPM in a match.",
    icon: "⚡",
    rewardCoins: 150,
    rewardXp: 200,
    check: (stats) => stats.highestWpm >= 60
  },
  {
    id: "ach-speed-100",
    title: "Lightning Fingers",
    desc: "Reach a typing speed of 100 WPM in a match.",
    icon: "🚀",
    rewardCoins: 300,
    rewardXp: 500,
    check: (stats) => stats.highestWpm >= 100
  },
  {
    id: "ach-flawless",
    title: "Flawless Climber",
    desc: "Finish a match with 100% typing accuracy.",
    icon: "🎯",
    rewardCoins: 200,
    rewardXp: 300,
    check: (stats) => stats.bestAccuracy >= 100
  },
  {
    id: "ach-combo-50",
    title: "Combo Master",
    desc: "Achieve a 50x typing combo streak.",
    icon: "🔥",
    rewardCoins: 250,
    rewardXp: 400,
    check: (stats) => stats.bestCombo >= 50
  },
  {
    id: "ach-conqueror-everest",
    title: "Everest Conqueror",
    desc: "Conquer Mount Everest on any difficulty.",
    icon: "🏔️",
    rewardCoins: 1000,
    rewardXp: 2000,
    check: (stats) => stats.everestConquered === true
  },
  {
    id: "ach-climber-10k",
    title: "High Altitude Veteran",
    desc: "Climb a total lifetime altitude of 10,000 meters.",
    icon: "🗺️",
    rewardCoins: 500,
    rewardXp: 800,
    check: (stats) => stats.totalDistance >= 10000
  }
];

export const DAILY_MISSIONS_DATABASE = [
  {
    id: "daily-3-wins",
    title: "Daily Tri-Summit",
    desc: "Win 3 mountain matches today.",
    target: 3,
    rewardCoins: 150,
    rewardXp: 250,
    icon: "🏆"
  },
  {
    id: "daily-95-acc",
    title: "Precision Master",
    desc: "Achieve 95%+ accuracy in a single match.",
    target: 1,
    rewardCoins: 120,
    rewardXp: 200,
    icon: "🎯"
  },
  {
    id: "daily-500-words",
    title: "Word Marathon",
    desc: "Type 500 total words across all modes.",
    target: 500,
    rewardCoins: 200,
    rewardXp: 300,
    icon: "✍️"
  }
];

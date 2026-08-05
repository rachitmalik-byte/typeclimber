// Sentences dataset grouped by difficulty level, mountain themes & mini-game pools

export const BOULDER_WORDS = [
  "CLIMB", "ROCK", "PEAK", "ROPE", "RIDGE", "CLIFF", "SNOW", "WIND", "GRIP", "ALPINE",
  "SUMMIT", "HEIGHT", "CHALK", "ANCHOR", "BOULDER", "DANGER", "GLACIER", "CRAG", "ABYSS",
  "REACH", "SWIFT", "SPEED", "STEADY", "POWER", "OXYGEN", "SHADOW", "STORM", "FROST", "BLAST"
];

export const SPRINT_WORDS = [
  "Quick fingers win the summit race.",
  "Type fast and climb even faster.",
  "Speed and precision conquer every mountain peak.",
  "Keep your momentum flowing on the climbing rope.",
  "Never hesitate when ascending the steep rock face.",
  "Accuracy fuels your speed and locks your lead."
];

export const ZEN_PASSAGES = [
  "The quiet mountain morning breathes peace into every slow, intentional keystroke.",
  "Listen to the soft rhythm of your fingers as you navigate the gentle alpine meadow.",
  "There is no hurry on this quiet ridge. Take your time and find your natural rhythm.",
  "Every character typed brings clarity, focus, and calm confidence to your mind."
];

export const SENTENCE_DATABASE = {
  easy: [
    "The green hills welcome every brave climber.",
    "Breathe deeply as you take your first steady steps.",
    "A sunny morning brings fresh hope to the trail.",
    "Keep your eyes on the ridge ahead and keep moving.",
    "Step by step the path becomes easier to navigate.",
    "Rope harness secured and boots laced tightly.",
    "Fresh air fills your lungs on this calm mountain ascent.",
    "Confidence grows with every meter you climb upward.",
    "The gentle breeze guides your rhythm to the summit.",
    "Every peak begins with a single deliberate step."
  ],

  medium: [
    "Loose gravel rattles underfoot as loose rocks tumble down the steep cliff face.",
    "Hold tight to the braided climbing rope and maintain your balance along the crag.",
    "Chalk your hands carefully before gripping the next narrow granite ledge.",
    "Watch for falling debris while ascending this exposed rock chimney.",
    "The wind begins to whistle through the jagged stone ridges around you.",
    "Focus your gaze straight ahead and avoid looking into the deep abyss below.",
    "Steady breath and consistent rhythm will carry you past the steepest overhang.",
    "Precision matters far more than hasty momentum when navigating treacherous cliffs.",
    "Every finger hold must be tested before trusting your full body weight to it.",
    "The summit looms closer through the swirling mountain mist above."
  ],

  hard: [
    "Sub-zero winds howl violently across the ice fall, testing your endurance at 4,000 meters altitude.",
    "Drive your steel crampons deep into the hardened blue glacier to secure solid footing.",
    "Biting frostbite threatens exposed skin as the blizzard visibility drops below five meters.",
    "Swing your ice axe clean into the frozen face with decisive force and absolute precision.",
    "Navigate narrow snow bridges crossing bottomless crevasses with extreme caution and speed.",
    "High altitude hypoxia slows reaction time, requiring laser sharp mental focus on every key.",
    "Frozen ropes crack under tension as you pull yourself up the vertical sheer ice sheet.",
    "A sudden gust of arctic wind pushes against your backpack, testing your core stability.",
    "Glacial crevasses yawn beneath your boots while snow whirlwinds spin across the ridge.",
    "Only true alpine endurance will conquer the merciless freeze of this frozen peak."
  ],

  expert: [
    "Molten lava cascades down the dark basalt slopes, radiating intense ambient heat across the narrow ridge line.",
    "Sulfurous fumes and rising volcanic ash blind your vision while glowing embers drift on turbulent thermals.",
    "The mountain trembles violently underfoot as underground magmatic pressure builds toward detonation.",
    "Scramble over scorching pumice rocks and fiery rockfalls before the advancing lava flow cuts off your escape route.",
    "Thick dark smoke obscures the summit flag, forcing you to rely purely on instinct, speed, and flawless typing precision.",
    "Thermal updrafts blow glowing cinders into the sky, illuminating the terrifying vertical precipice ahead.",
    "Each keystroke must be executed without hesitation as glowing magma rivers surge below your feet.",
    "Raging volcanic storms crackle with static electricity as lightning strikes the highest obsidian spire.",
    "Extremes of heat and toxic atmosphere demand absolute mastery over your hands and fingers.",
    "Conquer the volcanic inferno by maintaining a relentless typing cadence under extreme pressure."
  ],

  impossible: [
    "Mount Everest stands at 8,848 meters above sea level: the Death Zone where atmospheric oxygen falls below one-third of normal pressure.",
    "Raging hurricane force jet stream winds roar past the Hillary Step, threatening to hurl climbers into the 3,000-meter Southwest Face abyss.",
    "Exhaustion, freezing temperatures down to minus fifty degrees, and merciless AI competition collide in the ultimate test of human typing supremacy.",
    "Every millisecond delay, every accidental typo, and every hesitation drains vital energy as you push toward the ultimate summit of global glory.",
    "The frozen peak glimmers under the fierce high-altitude sun, rewarding only the most disciplined, precise, and lightning-fast mountain master.",
    "Traversing the treacherous Khumbu Icefall under shifting ice towers requires total harmony between mind, fingers, and unwavering nerve.",
    "When oxygen levels plunge and icy winds scream through your headset, only pure muscle memory will carry you to victory.",
    "Legends are forged on the summit ridge of Everest, where zero mistakes are tolerated and speed is your only salvation.",
    "Surpass human limits, maintain 100% typing accuracy at 120 WPM, and plant your flag on the highest peak on Earth!",
    "The summit is within your grasp: execute the final flawless sequence to claim your place among the typing gods."
  ]
};

export const MOUNTAIN_DEFINITIONS = [
  {
    id: "green-hills",
    name: "Green Hills",
    subtitle: "Sunny Meadow Ascent",
    altitude: 500,
    difficulty: "easy",
    unlockedByDefault: true,
    bgGradient: "linear-gradient(180deg, #1e3a8a 0%, #065f46 100%)",
    weather: "sun",
    aiSpeedWpm: 25,
    rewardCoins: 50,
    rewardXp: 100,
    desc: "Gentle rolling hills with bright sunny skies. Perfect for beginners mastering typing rhythm."
  },
  {
    id: "rocky-cliffs",
    name: "Rocky Cliffs",
    subtitle: "Jagged Stone Ridge",
    altitude: 1200,
    difficulty: "medium",
    unlockedByDefault: false,
    bgGradient: "linear-gradient(180deg, #1e293b 0%, #334155 100%)",
    weather: "rocks",
    aiSpeedWpm: 45,
    rewardCoins: 100,
    rewardXp: 200,
    desc: "Steep granite rock faces with falling stone hazards and moderate AI climbers."
  },
  {
    id: "snow-mountain",
    name: "Snow Mountain",
    subtitle: "Sub-Zero Blizzard Peak",
    altitude: 2500,
    difficulty: "hard",
    unlockedByDefault: false,
    bgGradient: "linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)",
    weather: "snow",
    aiSpeedWpm: 65,
    rewardCoins: 175,
    rewardXp: 350,
    desc: "Freezing blizzard wind particles and long technical sentences requiring strong accuracy."
  },
  {
    id: "ice-peak",
    name: "Ice Peak",
    subtitle: "Glacial Wall Summit",
    altitude: 4000,
    difficulty: "hard",
    unlockedByDefault: false,
    bgGradient: "linear-gradient(180deg, #030712 0%, #172554 100%)",
    weather: "ice",
    aiSpeedWpm: 80,
    rewardCoins: 250,
    rewardXp: 500,
    desc: "Vertical sheet ice with fast pro AI opponent and slippery mistake penalties."
  },
  {
    id: "volcano",
    name: "Volcano Spire",
    subtitle: "Magma Caldera Abyss",
    altitude: 6000,
    difficulty: "expert",
    unlockedByDefault: false,
    bgGradient: "linear-gradient(180deg, #180909 0%, #450a0a 100%)",
    weather: "lava",
    aiSpeedWpm: 95,
    rewardCoins: 350,
    rewardXp: 750,
    desc: "Rising thermal embers, dark soot sky, and an aggressive champion AI climber."
  },
  {
    id: "storm-peak",
    name: "Storm Peak",
    subtitle: "Thunder & Lightning Crag",
    altitude: 7500,
    difficulty: "expert",
    unlockedByDefault: false,
    bgGradient: "linear-gradient(180deg, #09090b 0%, #2e1065 100%)",
    weather: "storm",
    aiSpeedWpm: 110,
    rewardCoins: 500,
    rewardXp: 1000,
    desc: "Fierce electric storm clouds, flashing lightning flashes, and complex passages."
  },
  {
    id: "mount-everest",
    name: "Mount Everest",
    subtitle: "The Death Zone Summit",
    altitude: 8848,
    difficulty: "impossible",
    unlockedByDefault: false,
    bgGradient: "linear-gradient(180deg, #020617 0%, #0f172a 100%)",
    weather: "everest",
    aiSpeedWpm: 125,
    rewardCoins: 1000,
    rewardXp: 2000,
    desc: "The ultimate 8,848m test. Blistering Legend AI speed. Requires flawless execution."
  }
];

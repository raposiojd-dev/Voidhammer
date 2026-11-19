// Voidhammer: The Ember March. Content and numbers.
// Canon: Flameborne era before the Edict. Grey edges are rare and faint, never "rifts".
// Australian spelling. Nothing sealed in this file: the repo is public.
"use strict";
const D = {};

D.NAMES = ["Aedra","Caela","Glenna","Rhiann","Davan","Emrys","Gethin","Rhodri","Brann","Ren","Taran","Coll"];
D.TROOP_NAMES = ["Aedra","Caela","Glenna","Rhiann","Davan","Emrys","Gethin","Rhodri","Brann","Ren","Taran","Coll","Ashe"];

// Terrain: cost in quarter-days per hex.
D.TERRAIN = {
  ash:     { name: "Ash plain",  cost: 1, tex: "t_ash",     battle: "b_ash" },
  basalt:  { name: "Black rock", cost: 1, tex: "t_basalt",  battle: "b_basalt" },
  wood:    { name: "Charwood",   cost: 2, tex: "t_wood",    battle: "b_ash" },
  hills:   { name: "Hills",      cost: 2, tex: "t_hills",   battle: "b_basalt" },
  granite: { name: "The March",  cost: 1, tex: "t_granite", battle: "b_march" },
  lava:    { name: "Lava",       cost: 99, tex: "t_lava",   battle: "b_basalt" }
};

// Unit types. mv = cells per turn, rng = attack range (1 = melee).
D.UNITS = {
  hero:      { name: "You",          art: "hero_f",   hp: 24, atk: 5, def: 1, mv: 3, rng: 1, side: 0 },
  cadoc:     { name: "Garreth",    art: "cadoc",    hp: 26, atk: 4, def: 3, mv: 2, rng: 1, side: 0, guard: 1, comp: 1 },
  tavish:    { name: "Tavish",       art: "tavish",   hp: 15, atk: 4, def: 0, mv: 3, rng: 4, side: 0, comp: 1 },
  dilys:     { name: "Madda",      art: "dilys",    hp: 17, atk: 5, def: 0, mv: 3, rng: 3, side: 0, comp: 1, fire: 1 },
  levy:      { name: "Levy",         art: "levy",     hp: 14, atk: 4, def: 0, mv: 3, rng: 1, side: 0, tier: 1, up: "shieldaxe", cost: 15 },
  shieldaxe: { name: "Cinderblade",   art: "shieldaxe",hp: 20, atk: 5, def: 1, mv: 3, rng: 1, side: 0, tier: 2, up: "emberclad", guard: 1, cost: 35 },
  emberclad: { name: "Veteran",      art: "emberclad",hp: 26, atk: 7, def: 2, mv: 3, rng: 1, side: 0, tier: 3 },
  thrower:   { name: "Thrower",      art: "thrower",  hp: 11,  atk: 3, def: 0, mv: 3, rng: 3, side: 0, tier: 1, up: "firejav", cost: 20 },
  firejav:   { name: "Fire-javelin", art: "firejav",  hp: 15, atk: 5, def: 0, mv: 3, rng: 3, side: 0, tier: 2, fire: 1 },
  adept:     { name: "Emberforged",  art: "adept",    hp: 14, atk: 6, def: 0, mv: 3, rng: 3, side: 0, tier: 2, fire: 1, cost: 60 },
  r_axe:     { name: "Raider",       art: "r_axe",    hp: 12,  atk: 4, def: 0, mv: 3, rng: 1, side: 1 },
  r_archer:  { name: "Raider bow",   art: "r_archer", hp: 9,  atk: 3, def: 0, mv: 2, rng: 3, side: 1 },
  r_brute:   { name: "Brute",        art: "r_brute",  hp: 21, atk: 6, def: 1, mv: 2, rng: 1, side: 1 },
  r_captain: { name: "The Coin-Captain", art: "r_captain", hp: 30, atk: 6, def: 2, mv: 3, rng: 1, side: 1, boss: 1 },
  serpent:   { name: "Magma serpent",art: "serpent",  hp: 46, atk: 7, def: 2, mv: 2, rng: 1, side: 1, boss: 1, fireproof: 1 }
};
// xp needed and iron cost to promote into a tier
D.PROMOTE = { 2: { xp: 3, iron: 3, coal: 2, forge: 1 }, 3: { xp: 8, iron: 6, coal: 4, forge: 2 } };

D.SPELLS = {
  lance: { name: "Ember lance", cost: 6,  text: "Burn one enemy within 4. Hits harder the hotter you run." },
  wall:  { name: "Ember wall",  cost: 9,  text: "Three cells of fire for two turns. Nothing walks through it." },
  flare: { name: "Flare",       cost: 12, text: "Everything next to you burns. Friends too." }
};

D.STAGES = [
  { id: "toll",      min: 70, name: "Toll",      surge: 0,   line: "A night at your own hearth puts it right." },
  { id: "debt",      min: 40, name: "Debt",      surge: 0.15, line: "You can't make yourself back down from anything." },
  { id: "arrears",   min: 15, name: "Arrears",   surge: 0.35, line: "Rest only gets you so far now." },
  { id: "reckoning", min: 0,  name: "Reckoning", surge: 0.6,  line: "The fire decides more often than you do." }
];

D.BUILDINGS = {
  hall:  { name: "Hearth hall",    art: "bd_hall",  max: 3, what: "Everything else can only be built as high as the hall. The folk who live round it pay hearth-dues.", eff: l => "Others up to level " + l + ", +" + (l * 2) + " crowns a day" },
  field: { name: "Emberseed plot", art: "bd_field", max: 3, what: "Feeds the hold and the warband.", eff: l => "+" + (l * 3) + " food a day" },
  coal:  { name: "Coal pit",       art: "bd_coal",  max: 3, what: "Coal feeds the watchfire, lights beacons, fires the forge, and sells well in the forge-towns.", eff: l => "+" + (l * 2) + " coal a day" },
  fire:  { name: "Watchfire",      art: "bd_fire",  max: 3, what: "The grey edge will not cross firelight. Burns coal every day, and goes dark the day the coal runs out.", eff: l => l ? "Holds the grey " + (l + 1) + " hexes off, burns " + l + " coal a day" : "Not lit" },
  wall:  { name: "Palisade",       art: "bd_wall",  max: 3, what: "Turns raids away while you are on the road.", eff: l => l ? "Beats raids up to strength " + (l * 2) : "No wall" },
  long:  { name: "Longhouse",      art: "bd_long",  max: 3, what: "Room for more fighters, and levies to hire at home. Every two hired fighters cost a crown a day in wages.", eff: l => "Room for " + (6 + l * 2) + " hired fighters" },
  forge: { name: "Forge",          art: "bd_forge", max: 2, what: "Promote fighters at home instead of in the forge-towns. Promotions take iron and coal.", eff: l => l ? (l > 1 ? "Promotes to veteran" : "Promotes to second rank") : "No forge" },
  store: { name: "Storehouse",     art: "bd_store", max: 3, what: "Carters buy your surplus.", eff: l => l ? "+" + (l * 3) + " crowns a day" : "No trade" }
};
// cost to build level n (1-based): crowns, iron, days
// the watchfire and the forge are built hot: they also take coal to raise
D.BUILD_COST = (lvl, id) => ({ crowns: [0, 30, 60, 110][lvl], iron: [0, 2, 5, 9][lvl], coal: id === "fire" || id === "forge" ? [0, 4, 8, 12][lvl] : 0, days: [0, 2, 3, 5][lvl] });

D.SITES = [
  { id: "hold",        kind: "hold",    name: "Your hold",    art: "s_hold",    at: [16, 7] },
  { id: "hearthmount", kind: "city",    name: "Hearthmount",  art: "s_city",    at: [2, 3] },
  { id: "smeltgate",   kind: "forge",   name: "Smeltgate",    art: "s_forge",   at: [7, 10] },
  { id: "slagford",    kind: "forge",   name: "Slagford",     art: "s_forge",   at: [10, 2] },
  { id: "ashford",     kind: "village", name: "Ashford",      art: "s_village", at: [12, 9] },
  { id: "hearthward",  kind: "keep",    name: "Hearthward",   art: "s_keep",    at: [21, 5] },
  { id: "bellows",     kind: "caves",   name: "The Bellows",  art: "s_caves",   at: [14, 2] },
  { id: "camp1",       kind: "camp",    name: "Raider camp",  art: "s_camp",    at: [19, 11], camp: 1 },
  { id: "camp2",       kind: "camp",    name: "Raider camp",  art: "s_camp",    at: [23, 2],  camp: 2 },
  { id: "camp3",       kind: "camp",    name: "The Coin-Captain's camp", art: "s_camp", at: [10, 13], camp: 3 },
  { id: "lair1",       kind: "lair",    name: "Serpent vent", art: "s_caves",   at: [5, 7] },
  { id: "lair2",       kind: "lair",    name: "Serpent vent", art: "s_caves",   at: [17, 13] }
];

D.FOES = {
  patrol: d => d < 12 ? ["r_axe", "r_axe", "r_archer"] : d < 28 ? ["r_axe", "r_axe", "r_axe", "r_archer"] : ["r_axe", "r_axe", "r_brute", "r_archer", "r_archer"],
  camp1: ["r_axe", "r_axe", "r_axe", "r_archer", "r_archer"],
  camp2: ["r_axe", "r_axe", "r_axe", "r_axe", "r_brute", "r_archer", "r_archer"],
  camp3: ["r_captain", "r_brute", "r_brute", "r_axe", "r_axe", "r_axe", "r_archer", "r_archer"],
  lair: ["serpent"]
};
D.LOOT = {
  patrol: { crowns: 18, food: 6 },
  camp1: { crowns: 50, iron: 5, food: 12, favour: 1 },
  camp2: { crowns: 80, iron: 8, food: 12, favour: 1 },
  camp3: { crowns: 150, iron: 10, favour: 2 },
  lair: { crowns: 30, iron: 9, favour: 1 }
};

D.TRADE = {
  ashford:     [{ t: "Buy 10 food", pay: { crowns: 8 },  get: { food: 10 } }, { t: "Sell 6 coal", pay: { coal: 6 }, get: { crowns: 7 } }],
  smeltgate:   [{ t: "Buy 3 iron",  pay: { crowns: 12 }, get: { iron: 3 } },  { t: "Sell 6 coal", pay: { coal: 6 }, get: { crowns: 10 } }],
  slagford:    [{ t: "Buy 3 iron",  pay: { crowns: 13 }, get: { iron: 3 } },  { t: "Sell 10 food", pay: { food: 10 }, get: { crowns: 9 } }],
  hearthmount: [{ t: "Buy 10 food", pay: { crowns: 11 }, get: { food: 10 } }, { t: "Buy 3 iron", pay: { crowns: 15 }, get: { iron: 3 } }, { t: "Buy 6 coal", pay: { crowns: 9 }, get: { coal: 6 } }],
  hearthward:  [{ t: "Buy 10 food", pay: { crowns: 10 }, get: { food: 10 } }]
};
D.RECRUIT = {
  ashford: ["levy", "thrower"], smeltgate: ["thrower"], slagford: ["levy"],
  hearthward: ["shieldaxe"], hearthmount: ["levy", "thrower", "adept"], hold: ["levy"]
};
D.SITE_LINE = {
  hearthmount: "Terraced round the inside of a caldera that never cooled. Every window looks down on the Cinderway.",
  smeltgate: "A forge-town on a lava vein. Heat is free here and everybody works metal.",
  slagford: "Smoke-black and loud. They will sell you iron and an opinion.",
  ashford: "A ford on an ash-silted stream. Barley takes to the soil better than anywhere in the Realm.",
  hearthward: "The joint keep on the Ember March. A Flameborne hearth and a Stonehold hearthstone, side by side.",
  bellows: "Wind-caves where the mountain breathes. Nobody can hear you over the roar.",
  hold: "Yours. Black rock, one hall and a view of the March."
};

D.COMPANIONS = {
  cadoc: {
    name: "Garreth", role: "Shieldman", wants: "Wants the hold fed and walled before anything else.",
    up: "The hold is fed and walled.", down: "The hold went hungry or was raided.",
    leave: "Garreth sets his shield down by your door. \"I said I'd follow somebody who kept the fire in. That isn't what this is.\" He walks back towards the March."
  },
  tavish: {
    name: "Tavish", role: "Javelin-thrower", wants: "Wants a fight worth telling. Hates walking away from one.",
    up: "You won a fight worth telling.", down: "You walked away from a fight, or went too long without one.",
    leave: "Tavish shoulders his javelins. \"I came to throw these at somebody.\" He takes the Hearthmount road and doesn't look round."
  },
  dilys: {
    name: "Madda", role: "Emberforged", wants: "Wants you to bank the fire. Counts every time you throw it when you're already in debt.",
    up: "You rested and let it cool.", down: "You threw fire while already in debt.",
    leave: "Madda looks at your hands for a while. \"I've watched this before. I'm not watching it again.\" She goes back to the caves."
  }
};

D.EVENTS = {
  open: {
    art: "bg_hold", title: "The Ember March",
    text: h => "The Hearth Court gave you a hall on the border and a short instruction: hold it.\n\nRaiders are hitting the March, paid in coin nobody will name. And out east the carters say the land has started to look forgotten.",
    opts: [{ t: "Start" }]
  },
  tavish: {
    art: "tavish", title: "Ashford",
    text: () => "A lad is throwing javelins at a barn door from further away than seems sensible. He hits it every time. He sees your shields and comes straight over.\n\n\"You're the ones going after the raiders. I'm Tavish. I'm coming.\"",
    opts: [{ t: "Take him on", fx: g => G.joinCompanion("tavish"), say: "Tavish joins the warband." }, { t: "Not today", say: "\"I'll be here,\" he says, and goes back to the door." , fx: g => { g.flags.tavishLater = 1; } }]
  },
  dilys: {
    art: "dilys", title: "The Bellows",
    text: () => "In the mouth of a wind-cave a woman is holding a flame in her palm, perfectly still, while the mountain roars around her. Her hands are crazed with old pale lines.\n\n\"You run hot,\" she says, without looking up. \"I could hear it from the road.\"",
    opts: [{ t: "Ask her to come with you", fx: g => G.joinCompanion("dilys"), say: "\"Somebody should be standing next to you when it goes wrong.\" Madda joins the warband." }, { t: "Leave her to it", say: "She nods. The flame doesn't move." , fx: g => { g.flags.dilysLater = 1; } }]
  },
  toll: {
    art: "r_axe", title: "A toll",
    text: () => "Six men across the road, and a rope. \"Fifteen crowns for the March road. New rule.\"",
    opts: [
      { t: "Pay the 15 crowns", yield: 1, need: { crowns: 15 }, fx: g => { G.pay({ crowns: 15 }); G.approve("tavish", -1); }, say: "They wave you through. Tavish doesn't speak for an hour." },
      { t: "Refuse", fight: "patrol", say: "" }
    ]
  },
  carters: {
    art: "bg_camp", title: "Carters from the east",
    text: () => "Three families with one cart between them. They left a farm two days east. The eldest can't tell you why. \"The fields were there. Then we couldn't think what they were for.\"",
    opts: [
      { t: "Give them 8 food", need: { food: 8 }, fx: g => { if (!G.pay({ food: 8 })) return; g.favour += 1; G.approve("cadoc", 1); }, say: "They'll say your name in Hearthmount. Garreth carries the sacks over himself." },
      { t: "You can't spare it", fx: g => { G.approve("cadoc", -1); }, say: "They move on west. Garreth watches them go." }
    ]
  },
  grey: {
    art: "t_grey", title: "The grey edge",
    text: () => "The ground ahead has no colour in it. The road is still there, but nobody could tell you where it goes. Your fighters go quiet, and one of them asks what you all came out here for.\n\nFirelight holds it back. Nothing else you've tried does.",
    opts: [{ t: "Keep the fires fed" }]
  },
  offer: {
    art: "r_captain", title: "The Coin-Captain",
    text: () => "He walks out alone, hands open. On his cloak is a silver coin with nothing stamped on it.\n\n\"Eighty crowns. You go home, you hold your little hall, and the March road stays ours. Nobody has to burn.\"",
    opts: [
      { t: "Take the 80 crowns and go", yield: 1, fx: g => { g.res.crowns += 80; g.favour = Math.max(0, g.favour - 1); G.approve("tavish", -2); g.flags.tookCoin = 1; }, say: "The coin is heavy and has no face on it. The camp is still standing." },
      { t: "Refuse", fight: "camp3" }
    ]
  },
  lair: {
    art: "serpent", title: "Serpent vent",
    text: () => "The rock is warm underfoot and there is a sound like a kettle the size of a house. Magma serpents guard the veins. They also sit on a great deal of good iron.",
    opts: [{ t: "Go in after it", fight: "lair" }, { t: "Leave it be" }]
  },
  debt: {
    art: "hero", title: "Debt",
    text: () => "You notice it at the next argument. Somebody tells you to let a thing go, and you find that you can't. Not won't. The part of you that used to step back isn't answering.",
    opts: [{ t: "Carry on" }]
  }
};

D.HINTS = {
  hint: "Tap a place on the map to travel there. Break the three raider camps before the grey edge reaches your hold.",
  hold: "At the hold you build, rest and promote. Build the watchfire early.",
  battle: "Tap a fighter, tap where to go, tap who to hit. Then end your turn."
};

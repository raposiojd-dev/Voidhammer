// VOIDHAMMER premium front door: canon data for character creation and the opening.
// Display strings only. Every line here is checked against LORE BIBLE v2, the GAME CANON SPEC and its 1 Nov patch,
// the Realm Identities pack (fan names, crests, colours: approved 1 Nov) and the Visual Kit palettes (CP-1).
// Kits never invent numbers: each Road maps to one of the game's existing upbringing triples (UPB c/a/y), and each
// Realm adds one small gift built from existing kit fields (crowns, grain, loot, gear, followers).
// Australian spelling. No gods. Nothing sealed.
(function () {
  "use strict";
  var REALMS = [
    {
      id: "ember", name: "Flameborne", people: "the Kindled", art: "Embercraft", home: "Hearthmount",
      motto: "From ash, defiance rises.",
      line: "You become yourself by what you refuse.",
      blurb: "The Realm of defiance, ruled from Hearthmount by a warm King of the Hearth who can, by law, be refused. Every Flameborne child says their First No at thirteen, and most of them never really stop.",
      price: "Embercraft burns away self-control. A calm wielder is a weak one, so every steady breath costs you power.",
      gift: { text: "Hearth-kin: two Ashford folk know your family and follow you", from: { ashford: 2 } },
      start: "Gentlest start. Ashford is Flameborne country, and you begin among your own.",
      pal: { a: "#9E2B25", b: "#2B2523", c: "#B87333", glow: "#FF7A1A", ink: "#f3d2b4" },
      look: { cloth: 0x9e2b25, cloth2: 0x2b2523, legs: 0x2b2523, boots: 0x1e1a18, metal: 0x3a302c, dark: 0x2b2523, leather: 0x5a3a24, trim: 0xb87333, skin: 0xa8754e, hair: 0x2a1a12, weapon: "axe", shieldKind: "round", shield: 0x9e2b25 },
      names: ["Aedra", "Caela", "Dilys", "Glenna", "Rhiann", "Cadoc", "Davan", "Emrys", "Gethin", "Rhodri", "Tavish", "Brann", "Ren", "Taran", "Coll"],
      open: "You grew up near enough to Hearthmount to see the caldera glow through cloud on bad nights, and you said your First No at thirteen, loudly, to exactly the wrong person. Ashford is only a day's walk from home, which is close enough to be homesick and far enough to be free.",
      arrive: "She writes yours. Down the lane somebody refuses something at the top of their voice, and you feel entirely at home."
    },
    {
      id: "light", name: "Lightforge", people: "the Noonfolk", art: "Radiance", home: "Meridian",
      motto: "All lies burn away beneath the First Light.",
      line: "You'd rather be seen whole than loved for a lie.",
      blurb: "Seat of the Concord, whose Noon Hall in Meridian has kept the Realms talking for twelve centuries. Your people keep Day-Books, read them back aloud, and count a lie that was believed as the one wrong past forgiving.",
      price: "Radiance costs Clarity. First you cannot keep a secret, then you cannot doubt, then you cannot forgive. At the end comes the Glare, and the Clear do not sleep.",
      gift: { text: "An Assize letter of good standing, and the purse that came with it: +20 crowns", crowns: 20 },
      start: "Gentle start. The fullest purse of any people, and every Realm listens when you speak, if only to argue.",
      pal: { a: "#C9A13B", b: "#F4EFE3", c: "#CDB78E", glow: "#FFF4D6", ink: "#fbf3df" },
      look: { cloth: 0xf4efe3, cloth2: 0xc9a13b, legs: 0xcdb78e, boots: 0xe8dcc2, metal: 0xc9a13b, dark: 0x8a7440, leather: 0x9a8058, trim: 0xc9a13b, skin: 0xb98a5e, hair: 0xd8bf7a, weapon: "spear", shieldKind: "round", shield: 0xfafaf5 },
      names: ["Adra", "Bellis", "Clarin", "Lenna", "Merin", "Aldren", "Benet", "Dorran", "Edran", "Lorne", "Arin", "Ellis", "Kerith", "Larkin", "Teale"],
      open: "In Meridian the light never quite leaves the streets, and you grew up reading your own Day-Book aloud at the long table, every small cowardice set down in your own hand. You crossed the Between with that book on its cord and a habit of saying exactly what you mean, which has so far cost you two friends and one very good position.",
      arrive: "She writes yours. You check the spelling out of habit, and it is right, which you note."
    },
    {
      id: "shadow", name: "Shadowdeep", people: "the Kept", art: "Shadow Inversion", home: "Hush",
      motto: "What is hidden shapes what is seen.",
      line: "You'd rather be known by one person than seen by everyone.",
      blurb: "The Realm of secrets, whose chair on the Council has stood empty for as long as anyone has counted. Its people sit facing the door, trust very few, and give their full name to one person only.",
      price: "Shadow Inversion erodes who you are: first your reflection, then your handwriting, then your own name when someone says it. Masters keep a Keeper to tell them who they are.",
      gift: { text: "A coat of inside pockets, none of them empty: +3 blades", loot: { blades: 3 } },
      start: "Standard start. Knives early and little else, which is how your people like it.",
      pal: { a: "#4B2A6B", b: "#2E2F33", c: "#4A4E57", glow: "#8E5CFF", ink: "#dcd6ec" },
      look: { cloth: 0x2e2f33, cloth2: 0x4b2a6b, legs: 0x141416, boots: 0x101012, metal: 0x4a4e57, dark: 0x141416, leather: 0x2a2624, trim: 0x4b2a6b, skin: 0xa07a58, hair: 0x141416, weapon: "knife", shieldKind: null, shield: 0x2e2f33 },
      names: ["Fesk", "Ket", "Sill", "Tash", "Hask", "Fie", "Thim", "Tep", "Sarr", "Osk", "Tull", "Shen", "Tav", "Kef", "Huss"],
      open: "Shadowdeep fell down when the glass broke, so its tunnels were found rather than dug, and you knew the dark under Hush before you knew your letters. One person in the world holds your full name. You left them a half-name scratched on a doorframe and came up into the light with a coat full of pockets nobody else has found.",
      arrive: "You give her a half-name. She writes it down without looking up, which you appreciate more than she will ever know."
    },
    {
      id: "storm", name: "Stormreach", people: "the Gale", art: "Tempest", home: "Skyrend",
      motto: "The sky remembers every strike.",
      line: "You'd rather fall moving than live standing still.",
      blurb: "The Realm of the open sky, where the Free Assembly chooses its Wardens by shout and the riders of Skyrend count their lives in knots. Stormreach bows to nobody, and says so at volume.",
      price: "Every full charge of Tempest ages you, about a year a charge once the art has its hooks in. A streak of storm-grey at the temple and a knot on the life-cord for each one.",
      gift: { text: "A rider's kit: +2 bows, +2 boots and cloaks", loot: { bows: 2, kit: 2 } },
      start: "Standard start. Geared for the road and the bow.",
      pal: { a: "#4F6A8A", b: "#1F2E4A", c: "#D8CDB5", glow: "#E8F3FF", ink: "#e3ebf5" },
      look: { cloth: 0x4f6a8a, cloth2: 0x1f2e4a, legs: 0xd8cdb5, boots: 0x3a3430, metal: 0x7c8590, dark: 0x1f2e4a, leather: 0x5a4632, trim: 0xf2f4f7, skin: 0xb07e60, hair: 0x6b6f75, weapon: "spear", shieldKind: null, shield: 0x4f6a8a },
      names: ["Aira", "Brisa", "Kaya", "Nessa", "Oona", "Bray", "Darr", "Haro", "Rook", "Ari", "Breck", "Drey", "Gyre", "Kite", "Lark"],
      open: "You were born under the Chainyards at Skyrend, where the wind never stops arguing and children learn to tie a life-cord before they can tie their boots. Your cord is still bare. You mean to keep it that way for as long as the sky allows, and the sky has never once taken your advice.",
      arrive: "She writes yours, then asks which citadel you are over this year, which nobody outside Stormreach has ever thought to ask."
    },
    {
      id: "frost", name: "Frostgrave", people: "the Knotted", art: "Chrona", home: "Rimehold",
      motto: "All things return to the moment they began.",
      line: "You say less than you mean, and you keep all of it.",
      blurb: "The Realm of time and promises, governed by the Prophet Court in Rimehold, the Still City, where Seers advise and never rule. Its people knot a cord for every promise they keep, and its armies fight only the battles they can survive.",
      price: "Chrona costs feeling. Frost settles in your brows and does not melt, and the warmth goes out of you the same slow way.",
      gift: { text: "Frost-kept stores that will not spoil on the road: +14 grain", grain: 14 },
      start: "Gentle start. The grain lasts while you find your feet.",
      pal: { a: "#A9C9DB", b: "#16181B", c: "#F1F3F2", glow: "#DDF4FF", ink: "#eef6fa" },
      look: { cloth: 0xf1f3f2, cloth2: 0x16181b, legs: 0xa9aba8, boots: 0x16181b, metal: 0x3e5568, dark: 0x16181b, leather: 0x6a5a48, trim: 0xa9c9db, skin: 0xe0c4ae, hair: 0xcdb88e, weapon: "spear", shieldKind: null, shield: 0xa9c9db, helm: false },
      names: ["Aino", "Elin", "Linnea", "Runa", "Arvo", "Eino", "Halvar", "Sorren", "Eira", "Ilo", "Lumi", "Onni", "Sorn", "Veli", "Aune"],
      open: "Rimehold is called the Still City because nothing in it hurries, least of all its people, and you were raised to say a thing once and then keep it. There are nine knots on the word-cord at your belt. Each is a promise you are still keeping, and two of them are going to be difficult.",
      arrive: "She writes it once, carefully, without asking you to repeat it, and you find you trust her for that."
    },
    {
      id: "stone", name: "Stonehold", people: "the Markers", art: "Gravem", home: "Gravenhall",
      motto: "What is forged must endure.",
      line: "You're the one still standing when everyone else has sat down.",
      blurb: "The Realm of endurance, where the Hold-Senate needs every voice before it moves and the dead are carved on the mile-markers of the Long Roads. Stonehold masons built half the pillars of Meridian and never once asked to be thanked.",
      price: "Gravem turns you to stone, from the fingertips up, and the stone takes feeling with it. In Stonehold a grey hand is worn bare, like a medal.",
      gift: { text: "A road-mason's mail, patched but sound: +3 mail", loot: { mail: 3 } },
      start: "Standard start. Armour for the first fights, and feet that do not move.",
      pal: { a: "#B07A2E", b: "#6E6E6A", c: "#2F4256", glow: "#9FD3F0", ink: "#efe2c8" },
      look: { cloth: 0x6e6e6a, cloth2: 0xb07a2e, legs: 0x2f4256, boots: 0x2a2624, metal: 0x2f4256, dark: 0x22303e, leather: 0x4a3a2a, trim: 0xb5893a, skin: 0x8a6a50, hair: 0x241a14, weapon: "axe", shieldKind: "round", shield: 0x6e6e6a, helm: true },
      names: ["Agna", "Brekka", "Dagna", "Helka", "Thora", "Bror", "Grund", "Jarn", "Stenn", "Boden", "Brock", "Carrow", "Dell", "Harrow", "Kester"],
      open: "Before you left the Anchorstone you carved your own initials on a mile-marker, the way everyone does before a long road, so that someone would know where to carve the rest. You have walked further from that marker than anyone in your family, and your feet have not yet noticed.",
      arrive: "She writes it, and you lean over to make sure she has the initials right, because initials are what last."
    },
    {
      id: "spirit", name: "Spiritveil", people: "the Veilborn", art: "Veilweave", home: "Lanthys Vale",
      motto: "What is remembered survives.",
      line: "Nobody is gone while you still say their name.",
      blurb: "The Realm of memory, home of the Lantern Archives and the Drift, a lake of the dead's lanterns. Its people age like anyone until about twenty-five and then barely at all, and the Lantern Council's laws lapse the day no living councillor remembers why they were made.",
      price: "Veilweave bleeds memory: another person's habits first, then their griefs, until you are not sure which are yours. Ghostlight is worse. When a lamp burns out, that memory is gone from everyone.",
      gift: { text: "A Lantern Warden's slim sword, already at your hip: +1 steel sword", gear: { steel: 1 } },
      start: "Standard start. One good blade, and a long view.",
      pal: { a: "#B9C8BC", b: "#C9CCCB", c: "#E6E0D2", glow: "#E8F0FF", ink: "#f2f4f6" },
      look: { cloth: 0xc9cccb, cloth2: 0xb9c8bc, legs: 0xe6e0d2, boots: 0x6a6a68, metal: 0xc0c4c8, dark: 0x6a6e70, leather: 0x7a6e60, trim: 0xc0c4c8, skin: 0xe6cfbd, hair: 0x1c1a1c, weapon: "sword", shieldKind: null, shield: 0xc9cccb, lantern: 0xe8f0ff },
      names: ["Aelith", "Lanthea", "Myrael", "Aethan", "Elidir", "Ithren", "Thaelin", "Aeli", "Lanth", "Myr", "Sael", "Ylis", "Evren", "Rielle", "Sylo"],
      open: "You were born in Lanthys Vale, where the lanterns on the Drift outnumber the living, and you have been twenty-five for longer than you like to admit. You left with a small lantern whose silver flame leans a little whenever you pass a stranger, which on the road to Ashford is everyone.",
      arrive: "She writes your daily name, and leaves a small space beside it for the other one."
    },
    {
      id: "metal", name: "Metalcrown", people: "the Forged", art: "Synthetic sparks", home: "Iron Throne City",
      motto: "Power is forged, not gifted.",
      line: "Nobody gave you anything, so you built it.",
      blurb: "The shard with an empty hand, cracked off Stonehold with almost none of the First Spark and founded by the Unmarked, the families Stonehold left off its road-markers. Metalcrown has asked for a seat on the Council nine times. This spring the answer was no for the ninth time.",
      price: "There is no Spark in you to wake, so you build one, and the Fitting takes your humanity part by part. A stamped Tally at the wrist lists what is still born rather than made.",
      gift: { text: "Your First Tool, and what you made after it: +2 blades, +1 mail", loot: { blades: 2, mail: 1 } },
      start: "Demanding start. You are far from home, among Realms that have voted your people out nine times.",
      pal: { a: "#8E3B2A", b: "#1B1B1C", c: "#B08D57", glow: "#FF6A13", ink: "#f1d9c6" },
      look: { cloth: 0x5a5d61, cloth2: 0x8e3b2a, legs: 0x1b1b1c, boots: 0x141414, metal: 0x1b1b1c, dark: 0x101010, leather: 0x3a2a20, trim: 0xb08d57, skin: 0xc9ab95, hair: 0x2a2624, weapon: "sword", shieldKind: "round", shield: 0x1b1b1c },
      names: ["Brinna", "Dora", "Elka", "Grete", "Marta", "Brom", "Gunn", "Lenk", "Otto", "Bex", "Cass", "Ivo", "Jem", "Quin", "Tarn"],
      open: "You made your First Tool alone at ten, as every Metalcrown child does, and it is still in your pack with your name stamped on the handle. You left Iron Throne City before the gates closed. Nobody would say what the foundries were building, and the people who asked twice stopped coming to work.",
      arrive: "She writes your name and, beside it, nothing at all, which in your experience is rarer than it ought to be."
    }
    ,{
      // Hearthward frontier-born (John, 2 Nov). Canon: Hearthward is the joint Flameborne-Stonehold keep on the Ember March,
      // raised ~1,600 YB1 (spec patch §2, Lore Bible v2 §3, C20); built by Brannoc the Paired on the Warm Rock with a Flameborne
      // hearth and a Stonehold hearthstone in one fireplace (World Book Part 01, Codex #73); hearth-and-hold (Part 06 M18);
      // Stonekindle (Languages); no whistling in the yard (Part 01 E19); seam-sparks and the Quarrel (Part 06 §IX); the Stonehold
      // road counts from its gate (Codex #73). Nothing about its arch's reach or the Gate.
      id: "march", name: "Hearthward", people: "the March-born", art: "Seam-spark", home: "Hearthward",
      motto: "Hearth and hold.",
      line: "You were raised by both sides of the fire, and you answer to both.",
      blurb: "The joint keep of Flameborne and Stonehold on the Ember March, built by Brannoc the Paired on the Warm Rock with a Flameborne hearth and a Stonehold hearthstone set side by side in one fireplace. Its garrison is half fire and half stone, and its children speak a Kindle so full of Holdspeech that Hearthmount barely counts it.",
      price: "A child of two Realms may carry a seam-spark, which is neither. Its price is the Quarrel: Embercraft's lost temper and Gravem's creeping stone, each at about half strength, and the two arts arguing over which of them you are.",
      gift: { text: "Garrison issue from both sides of the keep: +2 mail, +1 blade", loot: { mail: 2, blades: 1 } },
      start: "Standard start. A soldier's kit, and a welcome at either hearth.",
      pal: { a: "#9E2B25", b: "#6E6E6A", c: "#B87333", glow: "#FF7A1A", ink: "#f0d8c0" },
      look: { cloth: 0x6e6e6a, cloth2: 0x9e2b25, legs: 0x2b2523, boots: 0x1e1a18, metal: 0x2f4256, dark: 0x22303e, leather: 0x4a3a2a, trim: 0xb87333, skin: 0x9a6c4c, hair: 0x241a14, weapon: "axe", shieldKind: "round", shield: 0x9e2b25, helm: true },
      names: ["Brann", "Coll", "Taran", "Ren", "Rudd", "Davan", "Dilys", "Brekka", "Agna", "Helka", "Kester", "Dell", "Harrow", "Jarn", "Wyn"],
      open: "You were born under Hearthward's wall on the Ember March, where the Stonehold road begins its count and half the words your family used were borrowed from the other side. Nobody whistles in the yard there. You still don't, though you stopped asking why somewhere around your tenth winter.",
      arrive: "She writes your name, and you tell her both halves of where you come from, because on the March anything less would be rude."
    }
  ];

  // Roads: each is one of the game's existing upbringing triples, so the kit (skills, crowns, grain, men, gear) is exactly
  // the number the game already uses. Lines are display text only.
  var ROADS = [
    { id: "soldier", name: "Concord levy", icon: "spear", upb: { c: "keep", a: "levy", y: "sellsword" },
      line: "You drilled at dawn in your Realm's line and learned to hold it.",
      blurb: "Every Realm keeps a line: the Sentinels, the Unmoving Line, the Rising. You stood in yours through a hard season, and when you walked away, some of the company walked with you.",
      start: "Gentle. Ten at your back, though six are sellswords and leave if they are not paid." },
    { id: "trader", name: "Bridge trader", icon: "scales", upb: { c: "wagon", a: "caravan", y: "clerk" },
      line: "You carried goods through the Realm Bridges and paid every crossing-tally.",
      blurb: "Each Bridge holds a day's road inside its arch, and every crossing frays it a little. You learned the tolls, the clerks and the prices on both sides, and you saved more than you spent.",
      start: "Standard. A heavy purse and nobody to fight for you." },
    { id: "smith", name: "Journeyman smith", icon: "anvil", upb: { c: "forge", a: "hunter", y: "journeyman" },
      line: "You learned the trade at your father's forge, where everything is either hot or heavy.",
      blurb: "You worked iron until your hands knew it better than your head did, then took the road with the stock you could not sell. Someone in Ashford has already asked about swords.",
      start: "Standard. Well armed, with nobody yet to arm." },
    { id: "reader", name: "Lamp-house reader", icon: "lamp", upb: { c: "archive", a: "acolyte", y: "pilgrim" },
      line: "You read the names and kept the records in a lamp-house.",
      blurb: "Every Realm keeps its dead somewhere: on mile-markers, in Day-Books, on the Drift. You kept a lamp-house's records, learned to speak so that people stay, and took the long road when the copying ran out.",
      start: "Demanding. Few crowns, no fighters, and a tongue that opens gates." },
    { id: "field", name: "Hired hand", icon: "sheaf", upb: { c: "farm", a: "levy", y: "pilgrim" },
      line: "You came to the Ashford fields for the harvest, and stayed.",
      blurb: "Ashford is short of hands and long on weather. You know a plough, a levy drill and the long road, and two neighbours trust you enough to follow.",
      start: "Standard. Grain in the cart and two neighbours beside it." },
    { id: "outlaw", name: "Outlaw", icon: "mask", upb: { c: "road", a: "thief", y: "outlaw" },
      line: "You ran with outlaws, and the Flameborne remember your face.",
      blurb: "Whatever you did in Hearthmount's country, the King's lords have written it down. Six exiles still follow you, and none of them will say what they did either.",
      start: "Hard. Six exiles follow you, and Flameborne lords hunt you from the first day." },
    { id: "retainer", name: "Exiled retainer", icon: "banner", upb: { c: "keep", a: "levy", y: "retainer" },
      line: "You served an exiled house, and Stonehold wants the name you no longer say.",
      blurb: "When your house lost its place, its retainers had a choice between your banner and nothing. Ten of them chose you, and they brought their steel.",
      start: "Hard. Ten retainers and good steel, and Stonehold lords want you dead from the first day." },
    { id: "greyedge", name: "Grey-edge survivor", icon: "crack", upb: { c: "road", a: "void", y: "pilgrim" },
      line: "You walked too close to a grey edge, and came back without your name.",
      blurb: "Grey edges are rare this season: places where the world goes faint, colour first and then sound. You wandered into one at fourteen and walked out again, and you have answered to whatever people call you ever since.",
      start: "Hardest. You begin with a memory already gone." }
  ];

  // The opening. Spoken over title cards; smooth literary voice; nothing sealed.
  var OPENING = {
    era: "The Last Season of the Concord",
    world: [
      "For almost twelve hundred years the Concord has held the Nine Realms together: eight peoples, one shard where nothing holds, and a Council that argues about everything and agrees, now and then, about enough.",
      "Metalcrown has asked nine times for a seat at that table. This spring it was refused for the ninth time, and since then the foundries of Iron Throne City have not gone quiet.",
      "At Korrhaven the Academy has not yet gathered the squad they will one day call Squad 0. Out past the edges the Void is stirring, and lately it has started to pay attention."
    ],
    archivist: "In Ashford a Lantern archivist from Spiritveil is writing names in a book for the Lantern Codex.",
    place: "Ashford",
    where: "Day 1 · the Flameborne shard"
  };

  // Old saves: origin keys (pre-UPB) and upbringing triples map onto the canon Roads; the Realm is inferred.
  var OLD_ORIGIN = { farmer: "field", trader: "trader", mercenary: "soldier", outlaw: "outlaw", smith: "smith", noble: "retainer", voidtouched: "greyedge" };
  function roadFromUpb(u) {
    u = u || {};
    if (u.y === "sellsword") return "soldier";
    if (u.y === "outlaw") return "outlaw";
    if (u.y === "retainer") return "retainer";
    if (u.y === "clerk") return "trader";
    if (u.y === "journeyman") return "smith";
    if (u.a === "void") return "greyedge";
    if (u.c === "archive" || u.a === "acolyte") return "reader";
    if (u.c === "forge") return "smith";
    if (u.c === "wagon") return "trader";
    return "field";
  }
  function migrateOpt(o) {
    if (!o || (o.people && o.road)) return false;
    var road = (o.origin && OLD_ORIGIN[o.origin]) || roadFromUpb(o.upb);
    o.road = o.road || road;
    o.people = o.people || ((o.upb && (o.upb.c === "archive" || o.upb.a === "acolyte")) ? "spirit" : "ember");
    o.fdMig = 1;
    return true;
  }

  window.VH_CANON = {
    REALMS: REALMS, ROADS: ROADS, OPENING: OPENING,
    realm: function (id) { for (var i = 0; i < REALMS.length; i++) if (REALMS[i].id === id) return REALMS[i]; return REALMS[0]; },
    road: function (id) { for (var i = 0; i < ROADS.length; i++) if (ROADS[i].id === id) return ROADS[i]; return ROADS[0]; },
    migrateOpt: migrateOpt, roadFromUpb: roadFromUpb, OLD_ORIGIN: OLD_ORIGIN
  };
})();

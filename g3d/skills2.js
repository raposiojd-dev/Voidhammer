// Voidhammer: The Shattered Realms. THE REALM ARTS (skills v2).
// One Commander tree everyone learns (orders, formations, morale) and eight Realm arts. You carry one Spark (the full art,
// the full price) and at most one Half-Spark (the first two tiers, a capped price). Every Realm art has a PRICE drawn from
// its canon cost (World Book Part 6): a meter that fills as you cast, four stages (Toll, Debt, Arrears, Reckoning), marks
// that never walk back, and companions who notice. Classic script (no module): defines window.VHSK2; index.html installs
// it with an env of game hooks, battle3d.js and area3d.js call into it for abilities, VFX and the HUD.
(function () {
  "use strict";

  // ---------------------------------------------------------------- glyphs (24x24, stroked) ----------------------------------------------------------------
  const GL = {
    flame: '<path d="M12 2.5c2.2 4.2 6.5 6.3 6.5 11.5a6.5 6.5 0 0 1-13 0c0-3.2 2-5.4 3.2-7.4 1 2.3 2.2 3.2 3.3 2.3-1.3-2.2-1.2-4.4 0-6.4z"/>',
    burst: '<circle cx="12" cy="12" r="3.5"/><path d="M12 1.5v5M12 17.5v5M1.5 12h5M17.5 12h5M4.6 4.6l3.5 3.5M15.9 15.9l3.5 3.5M19.4 4.6l-3.5 3.5M8.1 15.9l-3.5 3.5"/>',
    firewall: '<path d="M2.5 21h19M4.5 21c0-4 2.2-5.5 2.2-9 1.2 2 2.2 2.2 2.4 1 .2-2.5 1.3-4.6 3.3-6.5 0 3.3 3 5.4 3 9.4 1-1 1.2-2.3 1.2-3.4 2 2.3 2.6 5.3 2.6 8.5"/>',
    coal: '<path d="M4 17c0-4 4-6 8-6s8 2 8 6-4 4-8 4-8 0-8-4z"/><path d="M9 14l1.5 2M13 13l-1 3M15.5 15l-1.5 1.5"/>',
    snow: '<path d="M12 2v20M3.3 7l17.4 10M20.7 7L3.3 17M9.5 3.5L12 6l2.5-2.5M9.5 20.5L12 18l2.5 2.5"/>',
    hourglass: '<path d="M6 2.5h12M6 21.5h12M7 2.5c0 6.5 10 5.5 10 9.5s-10 3-10 9.5M17 2.5c0 6.5-10 5.5-10 9.5s10 3 10 9.5"/>',
    eye: '<path d="M1.5 12c3-5.3 7-7.5 10.5-7.5s7.5 2.2 10.5 7.5c-3 5.3-7 7.5-10.5 7.5S4.5 17.3 1.5 12z"/><circle cx="12" cy="12" r="3.2"/>',
    echo: '<circle cx="7" cy="6" r="2.2"/><circle cx="12" cy="6" r="2.2" opacity=".6"/><circle cx="17" cy="6" r="2.2" opacity=".35"/><path d="M4.5 21v-6.5a2.5 2.5 0 0 1 5 0V21"/><path d="M9.5 21v-6.5a2.5 2.5 0 0 1 5 0V21" opacity=".6"/><path d="M14.5 21v-6.5a2.5 2.5 0 0 1 5 0V21" opacity=".35"/>',
    sun: '<circle cx="12" cy="12" r="4.5"/><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M19.4 4.6l-2.1 2.1M6.7 17.3l-2.1 2.1"/>',
    shield: '<path d="M12 2.5l8 3v6.3c0 5-3.5 8.3-8 9.7-4.5-1.4-8-4.7-8-9.7V5.5z"/><path d="M12 7v9M8 11.5h8"/>',
    pillar: '<path d="M9 1.5h6v18H9zM4.5 22.5h15M7 19.5h10"/><path d="M12 5v10" opacity=".5"/>',
    scale: '<path d="M12 3v18M7 21h10M4 7h16M4 7l-2.5 6h5zM20 7l-2.5 6h5z"/>',
    gust: '<path d="M2.5 8h11a3 3 0 1 0-3-3M2.5 13h16a3 3 0 1 1-3 3M2.5 18h8"/>',
    bolt: '<path d="M13.5 1.5L4 14h7l-1.5 8.5L19 10h-7z"/>',
    lance: '<path d="M3.5 20.5L17 7M13 3.5h7.5V11"/><path d="M6 14l4 4"/>',
    cord: '<path d="M3 12c3-6 6 6 9 0s6 6 9 0"/><circle cx="7.5" cy="9.2" r="1.2"/><circle cx="16.5" cy="14.8" r="1.2"/>',
    press: '<path d="M12 2.5v10M7 8l5 5 5-5M3 21.5h18M5.5 17.5h13"/>',
    anchor: '<circle cx="12" cy="4.5" r="2"/><path d="M12 6.5v15M8 9.5h8M4.5 14a7.5 7.5 0 0 0 15 0"/>',
    well: '<circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="12" r="5.5" opacity=".7"/><circle cx="12" cy="12" r="1.8"/>',
    mountain: '<path d="M1.5 20.5l7-12.5 4 6 3-4.5 7 11z"/><path d="M8.5 8l1.5 3 1.5-1"/>',
    lantern: '<path d="M9 2.5h6M10 2.5v2.2M14 2.5v2.2M8 4.7h8l1.2 3.3v9.2L16 20.5H8l-1.2-3.3V8z"/><path d="M12 10v5"/>',
    helms: '<path d="M3 20.5v-6a4.5 4.5 0 0 1 9 0v6M12 20.5v-6a4.5 4.5 0 0 1 9 0v6"/><path d="M5 15h5M14 15h5"/>',
    door: '<path d="M6 21.5V3.5h12v18M3.5 21.5h17M14.5 12.5h1"/>',
    dagger: '<path d="M14 2.5l7.5 7.5-9.5 9.5-3.3-3.3zM8.7 16.2l-5.2 5.3M6.6 14l3.4 3.4"/>',
    hush: '<circle cx="12" cy="12" r="9.5"/><path d="M5.3 5.3l13.4 13.4M8.5 13h7"/>',
    mask: '<path d="M3.5 6.5c3.5-2.3 13.5-2.3 17 0 0 7.5-3.5 13-8.5 13S3.5 14 3.5 6.5z"/><path d="M7.5 10.5h3M13.5 10.5h3M10 15c1.3.8 2.7.8 4 0"/>',
    gear: '<circle cx="12" cy="12" r="3.5"/><path d="M12 1.8v3.4M12 18.8v3.4M1.8 12h3.4M18.8 12h3.4M4.8 4.8l2.4 2.4M16.8 16.8l2.4 2.4M19.2 4.8l-2.4 2.4M7.2 16.8l-2.4 2.4"/><circle cx="12" cy="12" r="7"/>',
    reactor: '<path d="M12 1.5l8.5 5v11l-8.5 5-8.5-5v-11z"/><circle cx="12" cy="12" r="3.5"/><path d="M12 8.5V5M12 15.5V19"/>',
    sparkbolt: '<path d="M3 12h7l2-4 2 8 2-4h5"/><circle cx="21" cy="12" r="1.3"/>',
    horn: '<path d="M2.5 9.5h4l10.5-5.5v16L6.5 14.5h-4z"/><path d="M19.5 8.5c1.2 1.8 1.2 5.2 0 7"/>',
    banner: '<path d="M6 21.5V2.5M6 3.5h13l-3.5 4.5 3.5 4.5H6"/>',
    drill: '<path d="M3 21V9M8 21V6M13 21V9M18 21V6M1.5 12h20"/>',
    heart: '<path d="M12 20.5c-6.3-4-9.5-7.3-9.5-11.3A4.7 4.7 0 0 1 12 7.8a4.7 4.7 0 0 1 9.5 1.4c0 4-3.2 7.3-9.5 11.3z"/>',
    coin: '<circle cx="12" cy="12" r="9.5"/><path d="M12 6.5v11M9.3 9.5c0-2.2 5.4-2.2 5.4 0s-5.4 1.6-5.4 3.8 5.4 2.2 5.4 0"/>',
    boot: '<path d="M7 2.5h5.5v9.5l7.5 4v4.5H5z"/><path d="M5 17h15"/>',
    star: '<path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 20.9l1.6-7L2 9.2l7.1-.6z"/>',
    crown: '<path d="M2.5 18.5l2-11 5 5 2.5-8.5 2.5 8.5 5-5 2 11z"/><path d="M3 21h18"/>',
    cross: '<path d="M9 2.5h6v6.5h6.5v6H15v6.5H9V15H2.5V9H9z"/>',
    book: '<path d="M3 4.5h7.5a2.5 2.5 0 0 1 2.5 2.5v14a2 2 0 0 0-2-2H3zM21 4.5h-7.5A2.5 2.5 0 0 0 11 7"/><path d="M21 4.5v14.5h-8"/>',
    fang: '<path d="M4 4.5c2 6 3 11 4 16 1.5-4 2.5-8 4-11.5 1.5 3.5 2.5 7.5 4 11.5 1-5 2-10 4-16"/>',
    cog2: '<path d="M4 12h3M17 12h3M12 4v3M12 17v3"/><rect x="7" y="7" width="10" height="10" rx="2"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="1.5"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/>'
  };
  // colour variables for a tree (no color-mix: older phone browsers ignore it)
  const hexRgb = (h) => { h = String(h).replace("#", ""); if (h.length === 3) h = h.replace(/./g, "$&$&"); const n = parseInt(h, 16) || 0; return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const mixc = (a, b, t) => "rgb(" + a.map((v, i) => Math.round(v * t + b[i] * (1 - t))).join(",") + ")";
  const cv = (col, col2) => { const c = hexRgb(col); return "--k2c:" + col + ";--k2c2:" + (col2 || col) + ";--k2d:" + mixc(c, [0, 0, 0], 0.5) + ";--k2dd:" + mixc(c, [0, 0, 0], 0.3) + ";--k2g:rgba(" + c.join(",") + ",.45);--k2t:rgba(" + c.join(",") + ",.16);--k2b:" + mixc(c, [26, 20, 12], 0.55) + ";--k2l:" + mixc(c, [255, 255, 255], 0.8); };
  const svgGlyph = (k, s, col) => '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="' + (col || "currentColor") + '" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (GL[k] || GL.star) + "</svg>";

  // ---------------------------------------------------------------- the prices (canon, World Book Part 6) ----------------------------------------------------------------
  // stages: [Toll 0-49, Debt 50-74, Arrears 75-99, Reckoning 100]
  const ARTS = {
    ember: { meter: "Temper", what: "self-control", stages: ["Spark Temper", "Sleepless", "the Flare", "Burned Out"],
      body: ["You run hot to the touch.", "Ember-cracks glow along the lines of your hands. Sleep comes late.", "The fire wants the next thing before you decide it. Friends step back.", "Only fire and wanting are left. Someone has to sit with you until it goes down."],
      arrears: "The Flare: you cannot Block, and your fire scorches anyone close, friend or not.",
      kael: "Kaelren puts a hand flat on your back and leaves it there until your breathing slows. He says nothing about it afterwards.",
      ely: "Elyndra writes: the fire took more than it gave today. She underlines it once." },
    frost: { meter: "Numbness", what: "feeling", stages: ["the Late Laugh", "the Dry Eye", "the Fact of Love", "Hollow"],
      body: ["Jokes arrive a beat late.", "Frost in your lashes that does not melt indoors. Grief will not come.", "You remember loving people as a fact, like a date.", "You repeat yourself, one chair, one window, one future."],
      arrears: "The Fact of Love: anything you do for your men lands at half strength. They can tell.",
      kael: "Kaelren tells you a joke he knows you like. You hear yourself laugh a moment after he stops waiting for it.",
      ely: "Elyndra writes the date beside your name and, after a while, the word 'cold'." },
    light: { meter: "Clarity", what: "doubt and mercy", stages: ["the Tell", "the Certain", "the Clear", "the Glare"],
      body: ["Private things come out of your mouth at supper.", "Your shadow's edges go soft. You stop doubting what you have seen.", "Your shadow is a grey smear. Nothing anyone did to you fades.", "There is no dark left inside you to sleep in."],
      arrears: "The Clear: you cannot fall back. You are certain this is the right fight.",
      kael: "Kaelren asks if you are sure. You are. He looks at your shadow and does not ask again.",
      ely: "Elyndra writes: no doubt left in the voice. She does not write whether that is better." },
    storm: { meter: "Years", what: "your life", stages: ["the Ache", "the Grey", "the Burn", "the Drop"],
      body: ["Fatigue after every charge. A storm-grey streak at the temple.", "Your knees crack on cold mornings. About a year of age per full charge.", "Years go in minutes. Your hands are older than your face.", "The sky takes what is left, all at once."],
      arrears: "The Burn: a quarter of your strength is gone for the rest of this fight.",
      kael: "Kaelren ties a knot in a strip of cloth and hands it to you without a word. Stormreach riders keep count. So, it seems, does he.",
      ely: "Elyndra writes a number in the margin. It is how old you looked when you came off the field." },
    stone: { meter: "Stone", what: "flesh and feeling", stages: ["the Stiffening", "the Grey Hand", "the Crane-Arms", "the Stillman"],
      body: ["Cold fingertips, stiff knuckles in the morning.", "Granite-grey to the wrist. You cannot feel heat.", "Stone to the elbow. Floors creak under you.", "You stand where you held. The stone holds you back."],
      arrears: "The Crane-Arms: you move slowly, and blows land softer on stone.",
      kael: "Kaelren holds your grey hand to the campfire and watches your face, waiting to see if you will flinch. You do not.",
      ely: "Elyndra draws a line across your hand in the margin, at the wrist, then at the elbow." },
    veil: { meter: "Bleed", what: "which memories are yours", stages: ["the Dreaming", "Ghost-habits", "the Overlay", "Going to the Lamps"],
      body: ["Headaches. Vivid dreams of other people's lives.", "A shrug that is not yours. Voices at the edge of hearing.", "Past days play over the present. You cannot tell which laugh is yours.", "You come apart into the memories you hold."],
      arrears: "The Overlay: your Veil arts sometimes answer with the wrong memory.",
      kael: "Kaelren says your name twice before you turn. The second time he says it the way the King says his.",
      ely: "Elyndra reads your entry back to you, slowly, and asks which parts you remember living." },
    shadow: { meter: "Erosion", what: "your name", stages: ["the Startle", "the Hand", "the Keeper's Need", "Going Under"],
      body: ["Your reflection surprises you for a beat.", "Your handwriting looks like someone else's. Your shadow lags.", "Your own name does not land. Your orders reach your men late.", "No one left inside to answer the name."],
      arrears: "The Keeper's Need: your orders reach your men two heartbeats late.",
      kael: "Kaelren says your full name, all of it, cross and quiet, as if you were late for supper. You answer to it.",
      ely: "Elyndra writes your name at the top of a clean page, so it will be there when you look for it." },
    metal: { meter: "Humanity", what: "what makes you you", stages: ["the Count", "the Procedure", "the Protocol", "the Last Part"],
      body: ["You count the faces in a room before you see them.", "Your speech goes to numbers and steps. The word 'I' thins out.", "You obey the core well and want nothing.", "The Tally shows one part of you left."],
      arrears: "The Protocol: you cannot fall back, and men near you look away from what you are.",
      kael: "Kaelren asks how you are. You give him a number. He waits until you give him a word.",
      ely: "Elyndra writes down what you said after the fight, word for word, so you can hear how it sounded." }
  };
  const STAGE_AT = [0, 50, 75, 100];
  const stageOf = (v) => (v >= 100 ? 3 : v >= 75 ? 2 : v >= 50 ? 1 : 0);
  const STAGE_NAMES = ["Toll", "Debt", "Arrears", "Reckoning"];

  // ---------------------------------------------------------------- the trees ----------------------------------------------------------------
  // tier: 1 (open), 2 (3 points in the tree), 3 (6 points, level 6), 4 = keystone (10 points, level 10, choose one of two)
  const TIER_PTS = [0, 0, 3, 6, 10], TIER_LV = [0, 1, 1, 6, 10];
  const TREES = [
    { id: "cmd", name: "Commander", sub: "The Captain's Voice", col: "#e8a64a", col2: "#ffe0a0", glyph: "banner", art: null,
      fantasy: "You lead men. Orders that land, lines that hold, morale that does not break.", price: "No magic, no price. Just your voice and your nerve." },
    { id: "ember", name: "Embercraft", sub: "Flameborne · the First No", col: "#ff6a2a", col2: "#ffcf7a", glyph: "flame", art: "ember",
      fantasy: "Fire from refusal. Calm fire is weak fire: you burn hotter the closer you run to the edge.", price: "Temper. Every flame burns away a little self-control." },
    { id: "frost", name: "Chrona", sub: "Frostgrave · a heartbeat ahead", col: "#9fdcff", col2: "#e8f8ff", glyph: "snow", art: "frost",
      fantasy: "See the blow before it lands. Hold the moment still. Leave Echoes where you were.", price: "Numbness. Humour goes first, then grief, then love." },
    { id: "light", name: "Radiance", sub: "Lightforge · all lies burn", col: "#ffe58a", col2: "#fffbe6", glyph: "sun", art: "light",
      fantasy: "Truth, law and judgment. Blind the hand that strikes you; strike the guilty from the sky.", price: "Clarity. You lose your secrets, then your doubt, then your mercy." },
    { id: "storm", name: "Tempest", sub: "Stormreach · keep moving", col: "#7fa8ff", col2: "#e0ecff", glyph: "bolt", art: "storm",
      fantasy: "Speed, charges and lightning. Never be where the blow lands; always be where it hurts.", price: "Years. Each full charge ages you. The life-cord keeps count." },
    { id: "stone", name: "Gravem", sub: "Stonehold · hold for others", col: "#c9b48a", col2: "#f2e6c8", glyph: "mountain", art: "stone",
      fantasy: "Weight and endurance. Set your feet and let the charge break on you. Press the enemy flat.", price: "Stone. It creeps from the fingertips up, and takes feeling with it." },
    { id: "veil", name: "Veilweave", sub: "Spiritveil · what is kept", col: "#d6dcff", col2: "#ffffff", glyph: "lantern", art: "veil",
      fantasy: "Memory and ghostlight. Walk the Lantern Paths, raise remembered soldiers, lay old rooms over new.", price: "Bleed. Other people's memories seep into yours." },
    { id: "shadow", name: "Shadow Inversion", sub: "Shadowdeep · the Turning", col: "#4fd6a8", col2: "#c8fff0", glyph: "mask", art: "shadow",
      fantasy: "Secrets, knives and silence. Step out of their shadow, choke their voices, make them run from nothing.", price: "Erosion. Your reflection, your handwriting, then your name." },
    { id: "metal", name: "Synthetic Spark", sub: "Metalcrown · the Fitting", col: "#c4ccd4", col2: "#ff9a3a", glyph: "gear", art: "metal",
      fantasy: "A fitted core: bolts from the arm, an engine that does not tire, no fear at all.", price: "Humanity. The core takes the part you named, then slowly, more." }
  ];
  const TREE = {}; TREES.forEach((t) => { TREE[t.id] = t; });

  // node kinds: a = active (phone button), p = passive, k = keystone. max ranks: actives 3, passives 3, keystones 1.
  // fx: keys the game's own formulas already read through skfx(); leg: legacy skill ids the economy reads through sk().
  const N = [];
  const A = (o) => { o.kind = "a"; o.max = 3; N.push(o); };
  const P = (o) => { o.kind = "p"; o.max = o.max || 3; N.push(o); };
  const K = (o) => { o.kind = "k"; o.max = 1; o.tier = 4; N.push(o); };
  const pc = (v) => Math.round(v * 100) + "%";
  const rk = (r) => 1 + 0.25 * (Math.max(1, r) - 1); // damage per rank

  // ---- Commander ----
  A({ id: "cmd_rally", tree: "cmd", tier: 1, name: "Sound the Rally", glyph: "horn", cd: 30, line: "Running men turn back. Your whole line takes heart.",
    what: (r) => ["Routed men within 20 yards return to the fight", "Morale +" + pc(0.2 + 0.05 * r) + " for 8 s", "Your men hit " + pc(0.15 + 0.05 * r) + " harder for 8 s", "On foot: you hit 30% harder for " + (5 + r) + " s; foes near you flinch"] });
  P({ id: "cmd_muster", tree: "cmd", tier: 1, name: "Muster Rolls", glyph: "banner", line: "More men will follow a banner they can see.", what: (r) => ["+" + 8 * r + " column limit"], leg: { banners: 1 } });
  P({ id: "cmd_drill", tree: "cmd", tier: 1, name: "Yard Drill", glyph: "drill", line: "Hard days in the yard. Your men hit harder.", what: (r) => ["+" + 7 * r + "% army strength", "+" + 10 * r + " column limit"], leg: { drill: 1 } });
  A({ id: "cmd_wall", tree: "cmd", tier: 2, name: "Lock Shields", glyph: "shield", cd: 22, line: "Your infantry snap into a shield wall that holds even on the move.",
    what: (r) => ["Infantry form a shield wall at once", "You and your men take " + pc(0.3 + 0.05 * r) + " less damage for 6 s", "On foot: " + pc(0.5 + 0.05 * r) + " less damage for 4 s; foes in front are shoved back"] });
  P({ id: "cmd_surgeon", tree: "cmd", tier: 2, name: "Field Surgeons", glyph: "cross", line: "Pull them back in time and they live.", what: (r) => ["−" + 10 * r + "% men lost in battle"], leg: { rally: 1 } });
  P({ id: "cmd_pay", tree: "cmd", tier: 2, name: "Paid on Time", glyph: "coin", line: "Men who are paid on the day ask for less.", what: (r) => ["−" + 8 * r + "% wages"], leg: { discipline: 1 } });
  A({ id: "cmd_charge", tree: "cmd", tier: 3, name: "Hammer and Anvil", glyph: "lance", cd: 35, line: "Pin them with the line, break them with the horse.",
    what: (r) => ["Infantry hold; cavalry charge home (infantry charge if you have no horse)", "Enemy morale −" + pc(0.1 + 0.04 * r) + " for 8 s", "Charging men hit " + pc(0.25 + 0.1 * r) + " harder for 10 s", "On foot: you charge 7 yards through them for " + pc(1.6 * rk(r)) + " of a strike"] });
  P({ id: "cmd_sergeant", tree: "cmd", tier: 3, name: "Sergeants", glyph: "helms", line: "Mornings in the yard, whether a fight is coming or not.", what: (r) => ["Men train every day: +" + r + " battle experience per 10 men", "They eat " + 5 * r + "% more"], leg: { sergeant: 1 } });
  P({ id: "cmd_quarter", tree: "cmd", tier: 3, name: "Quartermaster", glyph: "book", line: "Buy cheap, store dry, waste nothing.", what: (r) => ["−" + 8 * r + "% grain eaten", "+" + 6 * r + "% when selling, −" + 5 * r + "% when buying"], leg: { forager: 1, haggler: 1 } });
  K({ id: "cmd_ks_banner", tree: "cmd", name: "The Banner Never Falls", glyph: "crown", line: "While you stand, your line's morale cannot fall below 45%. You can never fall back.", what: () => ["Your side's morale floor: 45% while you are on your feet", "Fall back is disabled", "On foot: below a third of your hearts, you take 30% less damage"] });
  K({ id: "cmd_ks_front", tree: "cmd", name: "Lead from the Front", glyph: "lance", line: "Commander cooldowns −40%. Every kill you make lifts your men. You take 20% more damage.", what: () => ["Commander ability cooldowns −40%", "Each kill by your hand: you and your men +6% damage for 6 s (stacks 5)", "You take 20% more damage"] });

  // ---- Embercraft ----
  A({ id: "em_brand", tree: "ember", tier: 1, name: "Brand", glyph: "flame", cd: 6, cost: 9, line: "Throw fire at the nearest foe. It catches, and it spreads.",
    what: (r) => [pc(1.4 * rk(r)) + " of a strike to the nearest foe ahead", "Sets them burning: " + pc(0.25 * rk(r)) + " a second for 3 s", "Splashes " + pc(0.5 * rk(r)) + " onto foes beside them"] });
  P({ id: "em_hot", tree: "ember", tier: 1, name: "Run Hot", glyph: "coal", line: "Calm fire is weak fire. Embercraft hits harder at every stage of Temper.", what: (r) => ["+" + 6 * r + "% Ember damage per Temper stage (up to +" + 18 * r + "%)"] });
  P({ id: "em_cracks", tree: "ember", tier: 1, name: "Ember-cracks", glyph: "burst", line: "Your Strike leaves a burn.", what: (r) => ["Strikes set foes burning for " + pc(0.15 * r) + " a second, 2 s"] });
  A({ id: "em_refusal", tree: "ember", tier: 2, name: "The Refusal", glyph: "burst", cd: 14, cost: 16, line: "A ring of fire throws them back. Bigger if they have just hurt you.",
    what: (r) => [pc(1.6 * rk(r)) + " of a strike to everything within 4.5 yards, thrown back", "Burning for 3 s", "If you were hit in the last 2.5 s: 40% wider and 50% harder"] });
  P({ id: "em_kindling", tree: "ember", tier: 2, name: "Kindling", glyph: "flame", line: "When a burning foe falls, the fire jumps.", what: (r) => ["A burning foe that dies sets " + (1 + r) + " foes near it burning"] });
  P({ id: "em_bank", tree: "ember", tier: 2, name: "Bank the Coals", glyph: "coal", line: "You learn to hold the heat without letting it hold you.", what: (r) => ["Temper cools " + 35 * r + "% faster"] });
  A({ id: "em_firebreak", tree: "ember", tier: 3, name: "Firebreak", glyph: "firewall", cd: 20, cost: 22, line: "A wall of fire across their path. Nothing crosses it cleanly.",
    what: (r) => ["A 10-yard wall of fire 4 yards ahead, for " + (5 + r) + " s", "Anything inside takes " + pc(0.6 * rk(r)) + " a second and catches fire", "Enemy lines that cross it stagger"] });
  P({ id: "em_unmake", tree: "ember", tier: 3, name: "Fire Unmakes", glyph: "star", line: "Steel does little to the void-touched. Fire unmakes them.", what: (r) => ["+" + 15 * r + "% Ember damage to void-touched foes"] });
  K({ id: "em_ks_patient", tree: "ember", name: "Patient Fire", glyph: "coal", line: "Quicker to be patient. Ember costs half Temper and never pushes you past the Debt, but burns 20% cooler.", what: () => ["Ember abilities cost half Temper", "Temper can never pass 74 (no Flare, no Burn-out)", "Ember damage −20%"] });
  K({ id: "em_ks_unbanked", tree: "ember", name: "Unbanked", glyph: "flame", line: "At the Debt or worse, Ember abilities have no cooldown. Only the price stops you.", what: () => ["While Temper is 50 or more, Ember abilities have no cooldown", "While Temper is 50 or more, you cannot Block"] });

  // ---- Chrona ----
  A({ id: "fr_echo", tree: "frost", tier: 1, name: "Echo Step", glyph: "echo", cd: 8, cost: 10, line: "Step forward and leave an Echo behind. They strike the Echo.",
    what: (r) => ["Dash 6 yards; nothing touches you for 0.4 s", "An Echo stands where you were for " + (2 + r) + " s and draws their blows", "On foot: foes near the Echo are held for " + (0.8 + 0.3 * r).toFixed(1) + " s"] });
  P({ id: "fr_cold", tree: "frost", tier: 1, name: "Cold Touch", glyph: "snow", line: "Every Chrona art numbs a little of your pain.", what: (r) => ["Each Chrona ability heals " + 4 * r + "% of your health"] });
  P({ id: "fr_shatter", tree: "frost", tier: 1, name: "Shatter", glyph: "burst", line: "Strike what the cold has slowed.", what: (r) => ["Strikes on slowed foes deal +" + 25 * r + "%"] });
  A({ id: "fr_hold", tree: "frost", tier: 2, name: "The Hold", glyph: "hourglass", cd: 22, cost: 20, line: "Time thickens around you. They move like men under ice.",
    what: (r) => ["Foes within 7 yards are slowed by " + pc(0.6 + 0.05 * r) + " for 5 s", "Arrows in the air around you stop and fall", "Their blows land late"] });
  P({ id: "fr_mirror", tree: "frost", tier: 2, name: "Ice-mirror", glyph: "eye", line: "A slowed foe shows you every gap in its guard.", what: (r) => ["Slowed foes take +" + 8 * r + "% from everything you do"] });
  P({ id: "fr_kept", tree: "frost", tier: 2, name: "The Kept Word", glyph: "book", line: "Keep your promises and the cold keeps its distance.", what: (r) => ["Numbness thaws " + 35 * r + "% faster"] });
  A({ id: "fr_ahead", tree: "frost", tier: 3, name: "A Heartbeat Ahead", glyph: "eye", cd: 18, cost: 14, line: "For a few breaths you see every blow before it comes, and answer it.",
    what: (r) => ["The next " + (2 + r) + " hits on you in 6 s are dodged", "Each dodge answers with a strike for " + pc(1.2 * rk(r))] });
  P({ id: "fr_lead", tree: "frost", tier: 3, name: "Seer's Lead", glyph: "lance", line: "Shoot where the Seers saw them stand.", what: (r) => ["+" + 10 * r + "% strength from your archers"], leg: { fletcher: 1 } });
  K({ id: "fr_ks_winter", tree: "frost", name: "Winterheart", glyph: "snow", line: "The Hold freezes them solid for a breath before it slows them. It costs twice the Numbness.", what: () => ["The Hold freezes foes in place for 1.5 s first", "The Hold costs double Numbness"] });
  K({ id: "fr_ks_three", tree: "frost", name: "Three Echoes", glyph: "echo", line: "Echo Step holds three charges, and every Echo bursts in frost when it fades.", what: () => ["Echo Step: 3 charges, each back in 8 s", "Each Echo bursts when it fades: 80% of a strike and a slow"] });

  // ---- Radiance ----
  A({ id: "li_shield", tree: "light", tier: 1, name: "Radiant Shield", glyph: "shield", cd: 12, cost: 12, line: "A shield of light. Whoever strikes it is blinded.",
    what: (r) => ["Block every blow from the front for " + (2.5 + 0.5 * r).toFixed(1) + " s", "Attackers are blinded (stunned) for " + (1 + 0.25 * r).toFixed(2) + " s"] });
  P({ id: "li_glare", tree: "light", tier: 1, name: "Glare", glyph: "sun", line: "The blinded cannot guard.", what: (r) => ["+" + 10 * r + "% damage to stunned or blinded foes"] });
  P({ id: "li_witness", tree: "light", tier: 1, name: "Witness", glyph: "eye", line: "You remember exactly who hit you.", what: (r) => ["Strikes deal +" + 8 * r + "% to foes that hurt you in the last 4 s"] });
  A({ id: "li_field", tree: "light", tier: 2, name: "Truth-field", glyph: "scale", cd: 18, cost: 15, line: "A field where every lie tastes of hot metal. Foes inside hit softer and bleed more.",
    what: (r) => ["A 6-yard field for 6 s", "Foes inside deal " + pc(0.25 + 0.05 * r) + " less damage", "Foes inside take +20% damage"] });
  P({ id: "li_warm", tree: "light", tier: 2, name: "Warm Hands", glyph: "heart", line: "Radiance mends what it understands.", what: (r) => ["Heal " + 2 * r + "% each time you blind or daze a foe"] });
  P({ id: "li_pale", tree: "light", tier: 2, name: "A Paling Shadow", glyph: "sun", line: "You learn to let a little dark back in.", what: (r) => ["Clarity fades " + 35 * r + "% faster"] });
  A({ id: "li_judgment", tree: "light", tier: 3, name: "Judgment", glyph: "pillar", cd: 20, cost: 20, line: "Name the strongest foe in front of you. The light comes down on it.",
    what: (r) => ["Marks the strongest foe ahead; 1.2 s later a pillar of light hits for " + pc(4 * rk(r)), "Foes beside it take " + pc(1.5 * rk(r)) + " and are dazed"] });
  P({ id: "li_noon", tree: "light", tier: 3, name: "Noon", glyph: "sun", line: "Your light reaches further.", what: (r) => ["Radiance areas +" + 10 * r + "% wider"] });
  K({ id: "li_ks_certain", tree: "light", name: "The Certain", glyph: "pillar", line: "Judgment hits 60% harder and readies your Radiant Shield. At the Debt or worse you cannot Block.", what: () => ["Judgment ×1.6 and resets Radiant Shield", "While Clarity is 50 or more, you cannot Block"] });
  K({ id: "li_ks_sworn", tree: "light", name: "Sworn in Light", glyph: "scale", line: "Your Truth-field walks with you for 10 s, and anyone who strikes you inside it is blinded.", what: () => ["Truth-field follows you and lasts 10 s", "Foes who strike you inside it are blinded for 1 s"] });

  // ---- Tempest ----
  A({ id: "st_step", tree: "storm", tier: 1, name: "Wind-step", glyph: "gust", cd: 5, cost: 7, line: "A ten-yard stride. Anyone in the way is thrown aside. Your Strike is ready again.",
    what: (r) => ["Dash 8 yards", "Foes in the path take " + pc(0.6 * rk(r)) + " of a strike and are thrown aside", "Your Strike is ready at once"] });
  P({ id: "st_feet", tree: "storm", tier: 1, name: "Light Feet", glyph: "boot", line: "You run light over ground that trips everyone else.", what: (r) => ["+" + 5 * r + "% move speed"] });
  P({ id: "st_pressure", tree: "storm", tier: 1, name: "Pressure Blow", glyph: "gust", line: "Your Strike carries a fist of air.", what: (r) => ["Strikes knock foes back " + (60 * r) + "% further and stagger them"] });
  A({ id: "st_squall", tree: "storm", tier: 2, name: "Squall", glyph: "bolt", cd: 14, cost: 15, line: "Lightning jumps from foe to foe.",
    what: (r) => [pc(2 * rk(r)) + " of a strike to the nearest foe within 10 yards", "Chains to 3 more, each 20% weaker", "Each hit stuns for 0.4 s"] });
  P({ id: "st_static", tree: "storm", tier: 2, name: "Static", glyph: "bolt", line: "After a Wind-step, your next Strike arcs to another foe.", what: (r) => ["Next Strike after a Wind-step also hits a foe within 5 yards for " + pc(0.6 + 0.2 * r)] });
  P({ id: "st_cord", tree: "storm", tier: 2, name: "The Life-cord", glyph: "cord", line: "Count every knot. Spend fewer.", what: (r) => ["Tempest costs " + 10 * r + "% fewer Years"] });
  A({ id: "st_charge", tree: "storm", tier: 3, name: "Sky-charge", glyph: "lance", cd: 18, cost: 24, line: "Store the sky, then let it go in one pass through their line.",
    what: (r) => ["Gather for 0.5 s (nothing touches you), then charge 14 yards", "Everything in the path: " + pc(2.4 * rk(r)) + " of a strike, knocked down", "The knot on your life-cord is real"] });
  P({ id: "st_gale", tree: "storm", tier: 3, name: "Gale", glyph: "gust", line: "The storm finds more of them.", what: (r) => ["Squall chains to " + r + " more foes"] });
  K({ id: "st_ks_form", tree: "storm", name: "Tempest Form", glyph: "bolt", line: "Wind-step holds three charges, back in 3 s each. Each step costs twice the Years.", what: () => ["Wind-step: 3 charges, each back in 3 s", "Wind-step costs double Years"] });
  K({ id: "st_ks_anchor", tree: "storm", name: "The Anchorite", glyph: "anchor", line: "You chose to stay. Tempest costs half the Years, but the wind comes late and short.", what: () => ["Tempest abilities cost half Years", "Wind-step and Sky-charge go half as far", "Squall chains to 2 more foes"] });

  // ---- Gravem ----
  A({ id: "sg_press", tree: "stone", tier: 1, name: "Press", glyph: "press", cd: 10, cost: 13, line: "Make the ground in front of you unbearably heavy.",
    what: (r) => [pc(2 * rk(r)) + " of a strike to everything in a 4-yard cone", "Pinned (stunned) for " + (1 + 0.2 * r).toFixed(1) + " s"] });
  P({ id: "sg_grey", tree: "stone", tier: 1, name: "Grey Hand", glyph: "shield", line: "You have been hit before. It stopped surprising your body.", what: (r) => ["+" + r + " heart" + (r > 1 ? "s" : "") + " on foot, +" + 15 * r + "% health in battle"], leg: { ironhide: 1 } });
  P({ id: "sg_burden", tree: "stone", tier: 1, name: "Burden-stone", glyph: "mountain", line: "Your blows land with a weight that is not yours.", what: (r) => ["Strikes deal +" + 8 * r + "% and stagger longer"] });
  A({ id: "sg_set", tree: "stone", tier: 2, name: "The Set", glyph: "anchor", cd: 16, cost: 15, line: "Set your feet. The charge breaks on you like water on a cliff.",
    what: (r) => ["For 5 s you take " + pc(0.5 + 0.05 * r) + " less damage and cannot be moved", "Anyone who hits you is staggered", "Your men within 6 yards take 25% less damage", "You move very slowly"] });
  P({ id: "sg_line", tree: "stone", tier: 2, name: "Hold the Line", glyph: "drill", line: "While you hold, the men near you hold.", what: (r) => ["While The Set is up, men within " + (5 + 2 * r) + " yards cannot rout", "Morale +" + 5 * r + "%"] });
  P({ id: "sg_still", tree: "stone", tier: 2, name: "Stillness", glyph: "anchor", line: "Stone that rests does not spread.", what: (r) => ["Stone recedes " + 35 * r + "% faster"] });
  A({ id: "sg_well", tree: "stone", tier: 3, name: "Weight of the Mountain", glyph: "well", cd: 24, cost: 22, line: "Open a well of weight ahead. They are dragged in, then crushed.",
    what: (r) => ["A well 6 yards ahead pulls foes within 6 yards for 3 s, slowing them", "Then crushes the centre for " + pc(2.2 * rk(r)) + " of a strike and stuns for 1 s"] });
  P({ id: "sg_shoulder", tree: "stone", tier: 3, name: "The Shouldering", glyph: "press", line: "You lift what others cannot.", what: (r) => ["Press and the Well reach " + 12 * r + "% further"] });
  K({ id: "sg_ks_heart", tree: "stone", name: "The Mountain's Heart", glyph: "mountain", line: "The Set lasts until you move. Stone climbs every second you hold.", what: () => ["The Set has no time limit; it ends when you move or press it again", "Holding costs 4 Stone a second"] });
  K({ id: "sg_ks_forge", tree: "stone", name: "Hearth-and-Hold", glyph: "coal", line: "Press leaves a burning forge-crater. Ember heats, Gravem presses.", what: () => ["Press leaves a crater that burns for 4 s", "Foes in it take 40% of a strike a second", "With Embercraft as your Spark or Half, Press also sets them burning"] });

  // ---- Veilweave ----
  A({ id: "vw_lantern", tree: "veil", tier: 1, name: "Lantern Path", glyph: "lantern", cd: 10, cost: 11, line: "The lantern leans towards what you want. You are already there.",
    what: (r) => ["Step 8 yards along a lantern path (behind the nearest foe ahead, if there is one)", "Foes where you arrive are dazed for " + (0.8 + 0.2 * r).toFixed(1) + " s"] });
  P({ id: "vw_tilt", tree: "veil", tier: 1, name: "The Lamp-tilt", glyph: "eye", line: "You hear the blow coming in the stone.", what: (r) => ["−" + 4 * r + "% damage taken"], fx: { tough: 0.04 } });
  P({ id: "vw_wood", tree: "veil", tier: 1, name: "Memorywood", glyph: "book", line: "Every place teaches you, if you put your hand on it.", what: (r) => ["+" + 5 * r + "% experience"], fx: { xp: 0.05 } });
  A({ id: "vw_guard", tree: "veil", tier: 2, name: "Echo Guard", glyph: "helms", cd: 25, cost: 20, line: "Remembered soldiers, given weight. They fight beside you for a while.",
    what: (r) => ["In battle: " + (3) + " remembered soldiers fight for " + (10 + 2 * r) + " s", "On foot: two ghost blades circle you for " + (6 + r) + " s, striking for " + pc(0.5 * rk(r))] });
  P({ id: "vw_anchor", tree: "veil", tier: 2, name: "Anchor", glyph: "anchor", line: "One stitch to something that will hold.", what: (r) => ["Echo Guard: +" + r + " soldier" + (r > 1 ? "s" : "") + ", +" + 2 * r + " s"] });
  P({ id: "vw_copy", tree: "veil", tier: 2, name: "Copying-rooms", glyph: "book", line: "Write it down and it stays on the page, not in you.", what: (r) => ["Bleed fades " + 35 * r + "% faster"] });
  A({ id: "vw_room", tree: "veil", tier: 3, name: "Remembered Room", glyph: "door", cd: 20, cost: 18, line: "Lay an old room over this one. They fight the furniture.",
    what: (r) => ["A 6-yard room appears 5 yards ahead for 5 s", "Foes inside are lost in it (stunned " + (2 + 0.3 * r).toFixed(1) + " s)", "They take +20% damage while inside"] });
  P({ id: "vw_habit", tree: "veil", tier: 3, name: "Ghost-habit", glyph: "echo", line: "A borrowed soldier's stance, a borrowed soldier's swing.", what: (r) => ["After each Veil ability: +" + 12 * r + "% damage for 5 s"] });
  K({ id: "vw_ks_watch", tree: "veil", name: "The Remembering Watch", glyph: "helms", line: "Five remembered soldiers who stand until they are struck down. They cost twice the Bleed.", what: () => ["Echo Guard: 5 soldiers that last until killed (up to a minute)", "Echo Guard costs double Bleed"] });
  K({ id: "vw_ks_thin", tree: "veil", name: "The Thinning", glyph: "lantern", line: "Lantern Path holds two charges and leaves you unseen for a breath. Bleed never fades below 25 in a fight.", what: () => ["Lantern Path: 2 charges", "After a Lantern Path, foes lose you for 1.5 s", "In a fight, Bleed cannot fade below 25"] });

  // ---- Shadow Inversion ----
  A({ id: "sh_step", tree: "shadow", tier: 1, name: "Shadow-step", glyph: "dagger", cd: 8, cost: 10, line: "Into one shadow, out of theirs. The knife is already moving.",
    what: (r) => ["Step behind the nearest foe within 10 yards", "Strike for " + pc(2.5 * rk(r)) + " of a strike", "Nothing touches you for 0.3 s"] });
  P({ id: "sh_knife", tree: "shadow", tier: 1, name: "Knife-work", glyph: "dagger", line: "A year of hands.", what: (r) => ["Shadow-step +" + 20 * r + "%"] });
  P({ id: "sh_lag", tree: "shadow", tier: 1, name: "The Lagging Shadow", glyph: "mask", line: "They swing at where your shadow says you are.", what: (r) => ["+" + 3 * r + "% chance to dodge a blow"], fx: { dodge: 0.03 } });
  A({ id: "sh_silence", tree: "shadow", tier: 2, name: "Silence Field", glyph: "hush", cd: 20, cost: 15, line: "Breathing makes no sound. Neither do their orders.",
    what: (r) => ["A 6-yard field of silence for " + (5 + r) + " s", "Enemy archers inside cannot loose; their side's morale falls", "On foot: foes inside lose you and slow down; your strikes from inside +30%"] });
  P({ id: "sh_prints", tree: "shadow", tier: 2, name: "No Prints", glyph: "coin", line: "Nothing gets left on the field. Nothing traces back.", what: (r) => ["+" + 15 * r + "% loot"], leg: { scavenger: 1 } });
  P({ id: "sh_keeper", tree: "shadow", tier: 2, name: "A Keeper's Name", glyph: "book", line: "Someone holds your full name for you.", what: (r) => ["Erosion fades " + 35 * r + "% faster"] });
  A({ id: "sh_fear", tree: "shadow", tier: 3, name: "Fear-cast", glyph: "mask", cd: 22, cost: 18, line: "Put fear into them. They run from nothing.",
    what: (r) => ["Foes in an 8-yard cone ahead: " + pc(0.6 + 0.1 * r) + " chance to break and run", "The rest are frozen for 2 s", "The fitted feel no fear and shrug it off"] });
  P({ id: "sh_switch", tree: "shadow", tier: 3, name: "Switch Dark", glyph: "gear", line: "A silence field chokes a reactor.", what: (r) => ["+" + 12 * r + "% damage to Metalcrown's fitted"] });
  K({ id: "sh_ks_hush", tree: "shadow", name: "The Unmaker's Hush", glyph: "dagger", line: "If Shadow-step kills, it is ready again at once. Each step costs twice the Erosion.", what: () => ["Shadow-step resets when it kills", "Shadow-step costs double Erosion"] });
  K({ id: "sh_ks_gardens", tree: "shadow", name: "The Quiet Gardens", glyph: "hush", line: "Your Silence Field follows you for 10 s, and every Strike from inside it is a knife in the back.", what: () => ["Silence Field follows you and lasts 10 s", "Strikes from inside it deal +60%"] });

  // ---- Synthetic Spark ----
  A({ id: "mt_bolt", tree: "metal", tier: 1, name: "Sparkbolt", glyph: "sparkbolt", cd: 6, cost: 9, line: "The fitted arm fires three bolts at the nearest foes.",
    what: (r) => ["3 bolts at the 3 nearest foes within 14 yards", "Each " + pc(0.9 * rk(r)) + " of a strike"] });
  P({ id: "mt_plate", tree: "metal", tier: 1, name: "Riveted Plate", glyph: "cog2", line: "Seams and rivets where the parts meet.", what: (r) => ["−" + 4 * r + "% damage taken"], fx: { tough: 0.04 } });
  P({ id: "mt_count", tree: "metal", tier: 1, name: "The Count", glyph: "eye", line: "You count them before you see them. You find the one alone.", what: (r) => ["+" + 10 * r + "% damage to a foe with no friend within 3 yards"] });
  A({ id: "mt_vent", tree: "metal", tier: 2, name: "Core Vent", glyph: "reactor", cd: 16, cost: 17, line: "Vent the core. Everything close is thrown back and jammed.",
    what: (r) => [pc(1.4 * rk(r)) + " of a strike to everything within 4 yards, thrown back", "Stunned for 1 s", "Arrows near you are knocked from the air"] });
  P({ id: "mt_tireless", tree: "metal", tier: 2, name: "Runs All Night", glyph: "boot", line: "The engine does not need to stop. Neither do you.", what: (r) => ["+" + 5 * r + "% map speed, −" + 3 * r + "% grain eaten"], leg: { pathfinder: 1 } });
  P({ id: "mt_governor", tree: "metal", tier: 2, name: "Governor", glyph: "cog2", line: "A brake on the core, fitted by a careful keeper.", what: (r) => ["Humanity returns " + 35 * r + "% faster"] });
  A({ id: "mt_over", tree: "metal", tier: 3, name: "Overdrive", glyph: "reactor", cd: 25, cost: 20, line: "Open the core all the way. Faster, harder, fearless, for a while.",
    what: (r) => ["For 8 s: +" + pc(0.3 + 0.1 * r) + " damage, +25% speed, 15% less damage taken", "When it ends the core cools: slowed for 2 s"] });
  P({ id: "mt_heat", tree: "metal", tier: 3, name: "Sees Heat", glyph: "eye", line: "Through smoke, through dark, the warm shapes.", what: (r) => ["Sparkbolt +" + 15 * r + "% damage and +" + 2 * r + " yards"] });
  K({ id: "mt_ks_hand", tree: "metal", name: "Name the Hand", glyph: "sparkbolt", line: "You named your hand. Sparkbolt fires five piercing bolts. Your Strike is 15% weaker.", what: () => ["Sparkbolt fires 5 bolts that pierce", "Your Strike deals 15% less"] });
  K({ id: "mt_ks_sleep", tree: "metal", name: "Name Sleep", glyph: "reactor", line: "You named sleep. Overdrive lasts 12 s with no crash. Humanity returns at half speed.", what: () => ["Overdrive lasts 12 s and never cools", "Humanity returns at half speed out of a fight"] });

  const NODE = {}; N.forEach((n) => { NODE[n.id] = n; if (!n.tier) n.tier = 1; });
  const treeNodes = (t) => N.filter((n) => n.tree === t);

  // cross-art pairings (the World Book's clash table): Spark + Half-Spark
  const PAIRS = [
    { a: "ember", b: "storm", name: "Firestorm", line: "Wind feeds fire: Wind-step and Squall set what they hit burning." },
    { a: "ember", b: "stone", name: "Hearth-and-Hold", line: "Ember heats, Gravem presses: Press sets foes burning; The Refusal pins them." },
    { a: "light", b: "stone", name: "Sworn Stone", line: "Say it in the light, set it in stone: The Set marks every foe within 5 yards (+20% damage)." },
    { a: "shadow", b: "storm", name: "Dead Air", line: "A wind that carries no sound: after a Wind-step your next Strike is a knife in the back (+60%)." },
    { a: "frost", b: "veil", name: "Winterglass", line: "Frostgrave holds the moment, Spiritveil keeps it: your Echo fights as a remembered soldier." },
    { a: "ember", b: "metal", name: "Thieves of Fire", line: "The core was built on stolen Embercraft: Sparkbolts set foes burning." },
    { a: "frost", b: "ember", name: "The Rivalry", line: "Frost stills fire, fire melts the hold: burning foes count as slowed, slowed foes burn longer." }
  ];

  window.VHSK2 = { TREES, TREE, NODE, N, ARTS, GL, svgGlyph, install };

  // ================================================================= install =================================================================
  function install(env) {
    const S = () => env.S();
    let ver = 0, legCache = null, legVer = -1, fxCache = null, fxVer = -1;
    // ---------- state + migration ----------
    let lastS = null;
    function st() {
      const s = S(); if (!s) return null;
      if (s !== lastS) { lastS = s; ver++; for (const k in sealed) sealed[k] = false; }
      if (!s.sk2) migrate(s);
      return s.sk2;
    }
    function migrate(s) {
      const old = s.skills || {}, start = s.skStart || {}, legacy = env.legacyIds();
      const keep = {}; let refunded = 0;
      Object.keys(old).forEach((k) => {
        const v = old[k] || 0;
        // story flags and the Quiet Order's quest-gated arts (sneaking, silent kills) stay as they were
        if (k === "ms_gate" || /^sil_/.test(k) || !legacy.has(k)) { keep[k] = v; return; }
        const f = Math.min(v, start[k] || 0); if (f > 0) keep[k] = f;
        refunded += Math.max(0, v - f);
      });
      if (refunded > 0 || !s.skLegacy) s.skLegacy = Object.assign({}, old);
      s.skills = keep;
      s.sk2 = { v: 1, r: {}, ks: {}, eq: [null, null, null], spark: null, half: null, m: {}, marks: {}, peak: {}, years: 0, seen: {}, refunded: refunded, contra: 0 };
      ver++;
      if (refunded > 0) setTimeout(() => { try { env.toast("The old skills are gone. Your " + refunded + " point" + (refunded === 1 ? " is" : "s are") + " back to spend on the Realm Arts."); } catch (e) {} }, 1200);
    }
    const R = (id) => { const s = st(); return (s && s.r[id]) || 0; };
    function spentIn(tree) { const s = st(); let n = 0; if (!s) return 0; for (const id in s.r) if (NODE[id] && NODE[id].tree === tree) n += s.r[id]; return n; }
    function spent() { const s = st(); let n = 0; if (!s) return 0; for (const id in s.r) n += s.r[id]; const sk = S().skills || {}; for (const k in sk) if (/^sil_/.test(k)) n += sk[k] || 0; return n; }
    function points() { return Math.max(0, env.lvl() - 1 + env.bonusPts() - spent()); }
    function role(tree) { const s = st(); if (!s) return null; if (tree === "cmd") return "cmd"; return s.spark === tree ? "spark" : s.half === tree ? "half" : null; }
    function why(n) {
      const s = st(), r = R(n.id), rl = role(n.tree);
      if (r >= n.max) return "Mastered.";
      if (n.tree !== "cmd" && !rl) { if (s.spark && s.half) return "You carry one Spark and one Half-Spark already. No one carries more; the stories that say otherwise are not about you."; }
      if (rl === "half" && n.tier >= 3) return "A Half-Spark cannot draw this much. Only your Spark reaches the third tier.";
      if (n.kind === "k") { const other = treeNodes(n.tree).find((q) => q.kind === "k" && q.id !== n.id && R(q.id) > 0); if (other) return "You chose " + other.name + ". The other road is closed until you unlearn."; }
      const need = TIER_PTS[n.tier]; if (spentIn(n.tree) < need) return "Spend " + (need - spentIn(n.tree)) + " more point" + (need - spentIn(n.tree) === 1 ? "" : "s") + " in " + TREE[n.tree].name + ".";
      if (env.lvl() < TIER_LV[n.tier]) return "Needs level " + TIER_LV[n.tier] + ".";
      if (points() < 1) return "No points to spend. Every level brings one.";
      return "";
    }
    function learn(id, confirmRole) {
      const s = st(), n = NODE[id]; if (!n || why(n)) return false;
      if (n.tree !== "cmd" && !role(n.tree)) {
        if (!confirmRole) return "role";
        if (!s.spark) s.spark = n.tree; else if (!s.half) s.half = n.tree; else return false;
        try { env.log(TREE[n.tree].name + " answers you" + (s.half === n.tree ? ", but only by halves." : ". It is your Spark now, and the price is yours too."), "e"); } catch (e) {}
      }
      s.r[id] = (s.r[id] || 0) + 1; ver++;
      if (n.kind === "a" && s.eq.indexOf(id) < 0) { const i = s.eq.indexOf(null); if (i >= 0) s.eq[i] = id; }
      try { env.sfx(n.kind === "k" ? "rare" : "level"); } catch (e) {}
      env.save(); return true;
    }
    function equip(id, slot) { const s = st(); if (!R(id) || NODE[id].kind !== "a") return; const j = s.eq.indexOf(id); if (j >= 0) s.eq[j] = s.eq[slot]; s.eq[slot] = id; ver++; env.save(); }
    function respecCost() { return 40 + 20 * spent(); }
    function respec() {
      const s = st(), c = respecCost(); if (spent() < 1 || env.crowns() < c) return false;
      env.spend(c);
      s.r = {}; s.ks = {}; s.eq = [null, null, null]; s.spark = null; s.half = null; s.contra = (env.day() || 0) + 5; ver++;
      try { env.log("You unlearn who you were. Nothing walks back a Mid price: the marks stay. For five days your arts and your life disagree.", "e"); } catch (e) {}
      env.save(); return true;
    }
    const contra = () => { const s = st(); return s && s.contra && (env.day() || 0) < s.contra; };

    // ---------- passives -> the game's own numbers ----------
    function legacyMap() {
      const s = st();
      if (legVer === ver && legCache) return legCache;
      const m = {}; if (s) for (const id in s.r) { const n = NODE[id]; if (n && n.leg) for (const k in n.leg) m[k] = (m[k] || 0) + n.leg[k] * s.r[id]; }
      legVer = ver; return (legCache = m);
    }
    function fxStatic(k) {
      const s = st();
      if (fxVer !== ver || !fxCache) { fxCache = {}; fxVer = ver; if (s) for (const id in s.r) { const n = NODE[id]; if (n && n.fx) for (const q in n.fx) fxCache[q] = (fxCache[q] || 0) + n.fx[q] * s.r[id]; } }
      return fxCache[k] || 0;
    }

    // ---------- the price ----------
    function meter(art) { const s = st(); return (s && s.m[art]) || 0; }
    function floorOf(art) { const s = st(); return Math.min(40, ((s && s.marks[art]) || 0) * 4); }
    function cap(art) { if (role(TREE_OF_ART[art]) === "half") return 74; if (art === "ember" && R("em_ks_patient")) return 74; return 100; }
    const TREE_OF_ART = {}; TREES.forEach((t) => { if (t.art) TREE_OF_ART[t.art] = t.id; });
    const sealed = {};
    let onStage = null; // combat callback for consequences
    function pay(art, amt) {
      const s = st(); if (!s || !art) return;
      if (contra()) amt *= 1.25;
      const before = meter(art), mx = cap(art), v = Math.min(mx, before + amt);
      s.m[art] = v; s.peak[art] = Math.max(s.peak[art] || 0, v);
      if (art === "storm") s.years = (s.years || 0) + amt / 24;
      const a = stageOf(before), b = stageOf(v);
      if (b > a) stageUp(art, b);
    }
    function stageUp(art, b) {
      const s = st(), A = ARTS[art];
      if (b >= 2) { s.marks[art] = (s.marks[art] || 0) + (b === 3 ? 2 : 1); }
      const key = art + b;
      if (b >= 1) toastArt(art, A.meter + ": " + A.stages[b] + ". " + A.body[b]);
      if (b === 3) { sealed[art] = true; }
      if (b >= 2 && !s.seen[key]) {
        s.seen[key] = 1;
        try { if (env.kaelAlive()) env.log(A.kael, "e"); } catch (e) {}
        try { env.log(A.ely, "ely"); } catch (e) {}
      } else if (b === 3) { try { env.log(A.ely, "ely"); } catch (e) {} }
      if (onStage) onStage(art, b);
    }
    function decay(art, dt, inFight) {
      const s = st(); if (!s) return; const v = s.m[art] || 0; if (v <= 0) return;
      const t = TREE_OF_ART[art];
      const pass = { ember: "em_bank", frost: "fr_kept", light: "li_pale", storm: null, stone: "sg_still", veil: "vw_copy", shadow: "sh_keeper", metal: "mt_governor" }[art];
      let rate = (inFight ? 1.1 : 3) * (1 + 0.35 * (pass ? R(pass) : 0));
      if (art === "metal" && R("mt_ks_sleep") && !inFight) rate *= 0.5;
      let fl = floorOf(art); if (art === "veil" && inFight && R("vw_ks_thin")) fl = Math.max(fl, 25);
      s.m[art] = Math.max(fl, v - rate * dt);
      if (sealed[art] && s.m[art] < 60) { sealed[art] = false; toastArt(art, ARTS[art].meter + " eases. " + TREE[t].name + " answers again."); }
    }
    function tickMap(dt) {
      const s = st(); if (!s) return;
      for (const a in s.m) decay(a, dt, false);
      try { if (env.flag("q2done") && !(S().skills || {}).ms_gate) { S().skills.ms_gate = 1; env.toast("The Grey Writ's seal: the Realm Bridges remember you now."); } } catch (e) {}
    }
    let toastFn = null;
    function toastArt(art, t) { try { (toastFn || env.toast)(t, ARTS[art] ? TREE[TREE_OF_ART[art]].col : null); } catch (e) {} }

    // ---------- shared HUD / tray ----------
    let hud = null;
    function css() {
      if (document.getElementById("k2css")) return;
      const s = document.createElement("style"); s.id = "k2css";
      s.textContent = CSS; document.head.appendChild(s);
    }
    // the tray always starts closed: Cast opens it (and it stays open for the rest of that fight)
    function trayOpen(v) { return v === undefined ? false : !!v; }
    function mountHud(parent, castBtn, mode, onCast) {
      css(); unmountHud();
      const el = document.createElement("div"); el.className = "k2hud k2-" + mode;
      el.innerHTML = '<div class="k2price"></div><div class="k2tray"></div>';
      parent.appendChild(el);
      hud = { el, castBtn, mode, onCast, open: trayOpen(), btns: [], last: "" };
      const tr = el.querySelector(".k2tray");
      for (let i = 0; i < 3; i++) { const b = document.createElement("button"); b.className = "k2ab"; b.setAttribute("data-k2slot", i); b.innerHTML = '<i class="k2ic"></i><i class="k2cd"></i><b class="k2key"></b><em class="k2cost"></em>'; tr.appendChild(b); hud.btns.push(b); }
      if (mode === "area") { const lb = document.createElement("button"); lb.className = "k2ledger"; lb.textContent = "Ledger"; lb.setAttribute("data-k2ledger", "1"); tr.appendChild(lb); hud.ledger = lb; }
      const down = (e) => { const b = e.target.closest("[data-k2slot],[data-k2ledger]"); if (!b) return; e.stopPropagation(); e.preventDefault(); if (b.hasAttribute("data-k2ledger")) { env.ledger(); return; } onCast(+b.getAttribute("data-k2slot")); };
      el.addEventListener("pointerdown", down);
      hud.down = down;
      layout(); setTimeout(layout, 300); window.addEventListener("resize", layout);
      return hud;
    }
    function unmountHud() { if (!hud) return; window.removeEventListener("resize", layout); try { hud.el.remove(); } catch (e) {} hud = null; }
    function toggleTray(v) { if (!hud) return; hud.open = v === undefined ? !hud.open : !!v; trayOpen(hud.open); layout(); if (hud.open && !equipped().some(Boolean)) { try { (toastFn || env.toast)("No abilities yet. Learn them in Skills; actives go on these buttons."); } catch (e) {} } }
    function layout() {
      if (!hud || !hud.castBtn) return;
      const cb = hud.castBtn.getBoundingClientRect(), pr = hud.el.parentNode.getBoundingClientRect();
      if (!cb.width) return;
      const cx = cb.left + cb.width / 2 - pr.left, cy = cb.top + cb.height / 2 - pr.top, phone = pr.width < 600, sz = phone ? 56 : 62;
      const OFF = [[-74, 16], [-62, -58], [2, -84]];
      hud.btns.forEach((b, i) => { b.style.width = b.style.height = sz + "px"; b.style.left = (cx + OFF[i][0] * (sz / 56) - sz / 2) + "px"; b.style.top = (cy + OFF[i][1] * (sz / 56) - sz / 2) + "px"; b.classList.toggle("on", hud.open); });
      const W = pr.width, H = pr.height, cl = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
      hud.btns.forEach((b) => { b.style.left = cl(parseFloat(b.style.left), 6, W - sz - 6) + "px"; b.style.top = cl(parseFloat(b.style.top), 52, H - sz - 6) + "px"; });
      if (hud.ledger) { hud.ledger.style.left = cl(cx - 150 * (sz / 56) - 32, 6, W - 70) + "px"; hud.ledger.style.top = cl(cy - 40 * (sz / 56) - 22, 52, H - 50) + "px"; hud.ledger.classList.toggle("on", hud.open); }
      // the price sits with the other status readouts, top left, under the morale lines (battle) or the objective (on foot)
      const pe = hud.el.querySelector(".k2price"), ref = hud.mode === "battle" ? hud.el.parentNode.querySelector(".b3-groups") : document.getElementById("aobj");
      const rb = ref && ref.getBoundingClientRect(); pe.style.left = "12px"; pe.style.right = "auto"; pe.style.bottom = "auto"; pe.style.alignItems = "flex-start";
      pe.style.top = Math.max(60, rb && rb.height ? rb.bottom - pr.top + 10 : 160) + "px";
      hud.castBtn.classList.toggle("k2open", hud.open);
    }
    function hudTick(cdLeft) {
      if (!hud) return; const s = st(); if (!s) return;
      hud.n = (hud.n || 0) + 1; if (hud.n % 30 === 1) layout(); // the HUD rows above it fill in after mount
      const eq = s.eq;
      hud.btns.forEach((b, i) => {
        const id = eq[i], n = id && NODE[id];
        const key = (id || "-") + "|" + (n ? R(id) : 0);
        if (b._k !== key) {
          b._k = key; const t = n ? TREE[n.tree] : null;
          b.querySelector(".k2ic").innerHTML = n ? svgGlyph(n.glyph, 30, t.col2) : svgGlyph("lock", 22, "#6a5a3a");
          const pos = "left:" + b.style.left + ";top:" + b.style.top + ";width:" + b.style.width + ";height:" + b.style.height + ";"; b.setAttribute("style", pos + cv(t ? t.col : "#4a3a22", t ? t.col2 : null)); b.classList.toggle("empty", !n);
          b.querySelector(".k2key").textContent = hud.mode === "battle" ? ["7", "8", "9"][i] : ["1", "2", "3"][i];
          b.querySelector(".k2cost").textContent = n && n.cost ? "+" + Math.round(costOf(n)) : "";
          b.setAttribute("aria-label", n ? n.name : "Empty ability slot");
          b.title = n ? n.name + " — " + n.line : "Empty: learn an active in Skills";
        }
        if (n) {
          const c = cdLeft(id), full = Math.max(0.01, cdOf(n)), f = Math.max(0, Math.min(1, c / full)), art = TREE[n.tree].art, sl = art && sealed[art];
          b.querySelector(".k2cd").style.background = c > 0 ? "conic-gradient(rgba(0,0,0,.72) " + (f * 360).toFixed(0) + "deg, transparent 0)" : "none";
          b.classList.toggle("ready", c <= 0 && !sl); b.classList.toggle("sealed", !!sl);
          if (n.cost && b._cost !== Math.round(costOf(n))) { b._cost = Math.round(costOf(n)); b.querySelector(".k2cost").textContent = "+" + b._cost; }
        }
      });
      // price meters
      const arts = [s.spark, s.half].filter((a) => a && TREE[a] && TREE[a].art).map((t) => TREE[t].art);
      let h = "";
      arts.forEach((a) => {
        const v = meter(a), A = ARTS[a], sg = stageOf(v), t = TREE[TREE_OF_ART[a]], fl = floorOf(a), mx = cap(a);
        h += '<div class="k2m s' + sg + (sealed[a] ? " seal" : "") + '" style="' + cv(t.col) + '"><span><b>' + A.meter + "</b>" + (sealed[a] ? "SEALED" : A.stages[sg]) + '</span><div class="k2bar"><i class="fl" style="width:' + fl + '%"></i><i class="v" style="width:' + v.toFixed(1) + '%"></i>' + (mx < 100 ? '<i class="cap" style="left:' + mx + '%"></i>' : "") + '<u style="left:50%"></u><u style="left:75%"></u></div></div>';
      });
      if (h !== hud.last) { hud.last = h; hud.el.querySelector(".k2price").innerHTML = h; }
    }

    // ---------- costs / cooldowns ----------
    function costOf(n) {
      let c = n.cost || 0; if (!c) return 0;
      if (n.tree === "ember" && R("em_ks_patient")) c *= 0.5;
      if (n.tree === "storm") { c *= 1 - 0.1 * R("st_cord"); if (R("st_ks_anchor")) c *= 0.5; if (n.id === "st_step" && R("st_ks_form")) c *= 2; }
      if (n.id === "fr_hold" && R("fr_ks_winter")) c *= 2;
      if (n.id === "vw_guard" && R("vw_ks_watch")) c *= 2;
      if (n.id === "sh_step" && R("sh_ks_hush")) c *= 2;
      if (role(n.tree) === "half") c *= 1; // same price per use (canon), capped meter
      return c;
    }
    function cdOf(n) {
      let c = n.cd * (1 - 0.08 * (Math.max(1, R(n.id)) - 1));
      if (n.tree === "cmd" && R("cmd_ks_front")) c *= 0.6;
      if (n.id === "em_brand" || n.id === "em_refusal" || n.id === "em_firebreak") { if (R("em_ks_unbanked") && meter("ember") >= 50) c = 0.35; }
      if (n.id === "fr_echo" && R("fr_ks_three")) c = 8;
      if (n.id === "st_step" && R("st_ks_form")) c = 3;
      if (n.id === "vw_lantern" && R("vw_ks_thin")) c = 10;
      return c;
    }
    const charges = (n) => (n.id === "fr_echo" && R("fr_ks_three") ? 3 : n.id === "st_step" && R("st_ks_form") ? 3 : n.id === "vw_lantern" && R("vw_ks_thin") ? 2 : 1);
    function equipped() { const s = st(); return s ? s.eq.map((id) => (id && R(id) ? id : null)) : [null, null, null]; }
    const pairOn = (name) => { const s = st(); if (!s || !s.spark || !s.half) return false; const p = PAIRS.find((q) => q.name === name); return !!p && ((s.spark === p.a && s.half === p.b) || (s.spark === p.b && s.half === p.a)); };
    const hasArt = (t) => { const s = st(); return !!s && (s.spark === t || s.half === t); };

    // ================================================================= COMBAT CORE (shared by 3D battles and town/road fights) =================================================================
    // C is an adapter: kind, Y (native units per yard), hero(), foes(), hit(), move(), etc. All ability code runs on it.
    function makeCore(C) {
      const core = { C, cds: {}, chg: {}, t: 0, buffs: [], zones: [], pend: [], echoes: [], striker: 0, lastHurtT: -9, lastCastT: -9, hitBy: new Map(), kills: 0, frontStacks: [], primed: { static: 0, dead: 0 }, ahead: 0, aheadT: 0, shieldT: 0, setT: 0, setHeart: false, overT: 0, overEnd: 0, crashT: 0, burnT: 0, sealedMsg: 0, combo: 0, comboT: 0 };
      const now = () => core.t;
      const Y = C.Y;
      const fxw = (x, z) => C.w(x, z);
      const later = (s, fn) => core.pend.push({ t: core.t + s, fn });
      const buff = (k, v, t) => core.buffs.push({ k, v, end: core.t + t });
      const bsum = (k) => { let s = 0; for (const b of core.buffs) if (b.k === k) s += b.v; return s; };
      core.buff = buff; core.bsum = bsum;
      const k2 = (f) => C.st(f);
      function artMul(tree) {
        let m = 1;
        const s = st(), art = TREE[tree] && TREE[tree].art;
        if (art) { m *= 1 + 0.02 * Math.min(10, (s.marks[art] || 0)); if (role(tree) === "half") m *= 0.8; }
        if (tree === "ember") { m *= 1 + 0.06 * R("em_hot") * stageOf(meter("ember")); if (R("em_ks_patient")) m *= 0.8; }
        m *= 1 + bsum("habit");
        return m;
      }
      // damage to a foe, relative to one Strike. o: {tree, knock, burn, burnD, stun, slow, slowK, mark, conf, fear, nocombo, from}
      function hit(f, mult, o) {
        o = o || {}; const s = k2(f); if (!C.alive(f)) return false;
        let m = mult * (o.tree ? artMul(o.tree) : 1);
        if (s.markT > core.t) m *= 1.2;
        if (s.slowT > core.t || (pairOn("The Rivalry") && s.burnT > core.t)) m *= 1 + 0.08 * R("fr_mirror");
        if (s.stunT > core.t) m *= 1 + 0.1 * R("li_glare");
        if (o.tree === "ember" && C.isVoid(f)) m *= 1 + 0.15 * R("em_unmake");
        if (C.isFitted(f)) m *= 1 + 0.12 * R("sh_switch");
        if (R("mt_count") && C.alone(f)) m *= 1 + 0.1 * R("mt_count");
        // combo: an ability landing on a foe already marked by a different status
        if (!o.nocombo && o.tree) { const st2 = (s.burnT > core.t ? 1 : 0) + (s.slowT > core.t ? 1 : 0) + (s.stunT > core.t ? 1 : 0) + (s.markT > core.t ? 1 : 0); if (st2 && s.lastTree && s.lastTree !== o.tree) { m *= 1.2; core.combo++; core.comboT = core.t + 2; } }
        if (o.tree) s.lastTree = o.tree;
        const kx = o.from ? C.x(f) - o.from.x : 0, kz = o.from ? C.z(f) - o.from.z : 0;
        const killed = C.hit(f, m, { knock: (o.knock || 0) * Y, dx: kx, dz: kz, kind: o.kind });
        if (o.burn) { s.burnT = Math.max(s.burnT || 0, core.t + o.burn * (pairOn("The Rivalry") && s.slowT > core.t ? 1.5 : 1)); s.burnD = Math.max(s.burnT > core.t ? (s.burnD || 0) : 0, o.burnD || 0.25); }
        if (o.stun) { s.stunT = Math.max(s.stunT || 0, core.t + o.stun * (C.boss(f) ? 0.35 : 1)); C.stun(f, o.stun * (C.boss(f) ? 0.35 : 1)); if (R("li_warm") && (o.tree === "light")) C.heal(0.02 * R("li_warm")); }
        if (o.slow) { s.slowT = Math.max(s.slowT || 0, core.t + o.slow); s.slowK = Math.min(s.slowK && s.slowT > core.t ? s.slowK : 1, o.slowK || 0.5); C.slow(f, o.slow, o.slowK || 0.5); }
        if (o.mark) s.markT = Math.max(s.markT || 0, core.t + o.mark);
        if (o.fear) C.fear(f, o.fear);
        if (killed) onKill(f, s);
        return true;
      }
      function onKill(f, s) {
        if (s.burnT > core.t && R("em_kindling")) { const near = C.foes(3, null, { x: C.x(f), z: C.z(f) }).filter((q) => q !== f).slice(0, 1 + R("em_kindling")); near.forEach((q) => { const qs = k2(q); qs.burnT = core.t + 3; qs.burnD = 0.25; C.fx.burst(C.x(q), C.z(q), TREE.ember.col, 6, 1.2); }); }
      }
      core.onKill = onKill;
      core.hit = hit;
      const hp = () => C.hero();
      const fwd = () => { const h = hp(); return { x: h.fx, z: h.fz }; };
      function nova(r, mult, o, col) { const h = hp(); const L = C.foes(r, null, h); L.forEach((f) => hit(f, mult, Object.assign({ from: h }, o))); C.fx.ring(h.x, h.z, r, col, 0.5); return L.length; }
      function cone(r, cosT, mult, o, col) { const h = hp(); const L = C.foes(r, cosT, h); L.forEach((f) => hit(f, mult, Object.assign({ from: h }, o))); C.fx.cone(h.x, h.z, h.fx, h.fz, r, col); return L.length; }
      function segHits(x1, z1, x2, z2, wy) { const dx = x2 - x1, dz = z2 - z1, L2 = dx * dx + dz * dz || 1, out = []; const r = Math.hypot(dx, dz) / Y + wy + 2; for (const f of C.foes(r, null, { x: (x1 + x2) / 2, z: (z1 + z2) / 2 })) { const t = Math.max(0, Math.min(1, ((C.x(f) - x1) * dx + (C.z(f) - z1) * dz) / L2)), px = x1 + dx * t, pz = z1 + dz * t; if (Math.hypot(C.x(f) - px, C.z(f) - pz) <= wy * Y) out.push(f); } return out; }
      function dash(yards, o) { const h = hp(), x0 = h.x, z0 = h.z; const got = C.move(h.fx * yards * Y, h.fz * yards * Y); const h2 = hp(); if (o && o.hit) segHits(x0, z0, h2.x, h2.z, o.w || 1.4).forEach((f) => hit(f, o.hit, Object.assign({ from: { x: x0, z: z0 } }, o.opts || {}))); C.fx.trail(x0, z0, h2.x, h2.z, (o && o.col) || "#fff"); return got; }
      function zone(z) { z.end = core.t + z.t; z.tick = 0; core.zones.push(z); C.fx.zone(z); return z; }
      function echoAt(x, z, t, burst) { const e = { x, z, end: core.t + t, burst }; core.echoes.push(e); C.decoy(x, z, t); C.fx.echo(x, z, t); return e; }
      function radius(tree, r) { if (tree === "light") r *= 1 + 0.1 * R("li_noon"); if (tree === "stone") r *= 1 + 0.12 * R("sg_shoulder"); return r; }

      // ---------------------------------------------------------------- the abilities ----------------------------------------------------------------
      const RUN = {
        cmd_rally(r) { const h = hp(); C.sfx("horn"); C.fx.ring(h.x, h.z, 20, TREE.cmd.col, 0.9); C.fx.flash(TREE.cmd.col, 0.25);
          if (C.kind === "battle") { const n = C.unrout(20); C.morale(0.2 + 0.05 * r, 8); C.allyBuff("dmg", 0.15 + 0.05 * r, 8); C.msg(n ? n + (n === 1 ? " man turns" : " men turn") + " back to the line." : "The rally sounds. The line answers.", 2); }
          else { buff("dmg", 0.3, 5 + r); C.foes(5, null, h).forEach((f) => hit(f, 0, { stun: 0.8, nocombo: 1 })); C.msg("The rally sounds.", 1.5); } },
        cmd_wall(r) { const h = hp(); C.fx.ring(h.x, h.z, 6, TREE.cmd.col2, 0.6); C.sfx("hit");
          if (C.kind === "battle") { C.order("wall", "inf"); C.allyBuff("red", 0.3 + 0.05 * r, 6); buff("red", 0.3 + 0.05 * r, 6); C.msg("Shields up! The wall locks.", 1.6); }
          else { buff("red", 0.5 + 0.05 * r, 4); cone(3, 0.2, 0.3, { knock: 3, nocombo: 1 }, TREE.cmd.col2); C.msg("Shields locked.", 1.2); } },
        cmd_charge(r) { const h = hp(); C.sfx("horn"); C.fx.shake(0.25, 0.5);
          if (C.kind === "battle") { const cav = C.order("charge", "cav"); C.order("hold", "inf"); if (!cav) C.order("charge", "inf"); C.morale(-(0.1 + 0.04 * r), 8, "e"); C.allyBuff("dmg", 0.25 + 0.1 * r, 10); C.msg(cav ? "Hammer and anvil! The horse goes in." : "No horse: the line charges!", 2); }
          else { dash(7, { hit: 1.6 * rk(r), w: 1.6, col: TREE.cmd.col, opts: { knock: 3, stun: 0.4 } }); } },
        em_brand(r) { const h = hp(), t = C.nearest(14, 0.4, h) || null, col = TREE.ember.col; C.sfx("k2fire");
          const tx = t ? C.x(t) : h.x + h.fx * 10 * Y, tz = t ? C.z(t) : h.z + h.fz * 10 * Y;
          C.fx.bolt(h.x, h.z, tx, tz, col, 0.22);
          later(0.12, () => { if (!t) { C.fx.burst(tx, tz, col, 10, 1.4); return; } hit(t, 1.4 * rk(r), { tree: "ember", burn: 3, burnD: 0.25 * rk(r), knock: 1, from: h }); const sp = (pairOn("Firestorm") ? 3.2 : 2); C.foes(sp, null, { x: C.x(t), z: C.z(t) }).forEach((f) => { if (f !== t) hit(f, 0.5 * rk(r), { tree: "ember", burn: 2, burnD: 0.2, nocombo: 1 }); }); if (pairOn("Thieves of Fire")) segHits(h.x, h.z, tx + (tx - h.x) * 0.5, tz + (tz - h.z) * 0.5, 1).forEach((f) => { if (f !== t) hit(f, 0.8 * rk(r), { tree: "ember", burn: 2 }); }); C.fx.burst(tx, tz, col, 16, 1.8); C.fx.light(tx, tz, col, 1.2); }); },
        em_refusal(r) { const h = hp(), angry = core.t - core.lastHurtT < 2.5, R0 = 4.5 * (angry ? 1.4 : 1), col = TREE.ember.col; C.sfx("k2fire");
          nova(R0, 1.6 * rk(r) * (angry ? 1.5 : 1), { tree: "ember", knock: 3, burn: 3, burnD: 0.3, stun: pairOn("Hearth-and-Hold") ? 0.6 : 0 }, col);
          C.fx.burst(h.x, h.z, col, 30, 2.4); C.fx.flash(col, angry ? 0.5 : 0.3); C.fx.shake(angry ? 0.45 : 0.25, 0.4); C.fx.light(h.x, h.z, col, 2.2); if (angry) C.msg("Refused!", 1); },
        em_firebreak(r) { const h = hp(), cx = h.x + h.fx * 4 * Y, cz = h.z + h.fz * 4 * Y, px = -h.fz, pz = h.fx, col = TREE.ember.col; C.sfx("k2fire");
          zone({ kind: "line", x1: cx - px * 5 * Y, z1: cz - pz * 5 * Y, x2: cx + px * 5 * Y, z2: cz + pz * 5 * Y, w: 1.3, t: 5 + r, dps: 0.6 * rk(r), tree: "ember", burn: 2, stag: true, col }); C.fx.shake(0.2, 0.3); },
        fr_echo(r) { const h = hp(), x0 = h.x, z0 = h.z, col = TREE.frost.col; C.sfx("k2frost"); C.inv(0.4);
          dash(6, { col }); echoAt(x0, z0, 2 + r, R("fr_ks_three")); C.foes(4, null, { x: x0, z: z0 }).forEach((f) => hit(f, 0, { stun: C.kind === "area" ? 0.8 + 0.3 * r : 0.6, nocombo: 1 }));
          if (pairOn("Winterglass")) C.summon(1, 4, { x: x0, z: z0 }, TREE.veil.col); coldTouch(); },
        fr_hold(r) { const h = hp(), col = TREE.frost.col, winter = R("fr_ks_winter"); C.sfx("k2frost");
          zone({ kind: "disc", x: h.x, z: h.z, r: 7, t: 5, slow: 0.6 + 0.05 * r, tree: "frost", col, follow: false });
          if (winter) C.foes(7, null, h).forEach((f) => hit(f, 0, { stun: 1.5, nocombo: 1 }));
          C.freezeArrows(9); C.fx.flash(col, 0.3); C.fx.burst(h.x, h.z, col2("frost"), 24, 2); coldTouch(); },
        fr_ahead(r) { core.ahead = 2 + r; core.aheadT = core.t + 6; core.aheadR = r; const h = hp(); C.sfx("k2frost"); C.fx.ring(h.x, h.z, 1.6, TREE.frost.col, 0.6); C.fx.echo(h.x, h.z, 6, true); C.msg("You see every blow before it comes.", 1.5); coldTouch(); },
        li_shield(r) { core.shieldT = core.t + 2.5 + 0.5 * r; core.shieldR = r; const h = hp(); C.sfx("k2light"); C.fx.shield(h.x, h.z, 2.5 + 0.5 * r, TREE.light.col); C.fx.flash(TREE.light.col2, 0.2); },
        li_field(r) { const h = hp(), sworn = R("li_ks_sworn"); C.sfx("k2light");
          zone({ kind: "disc", x: h.x, z: h.z, r: radius("light", 6), t: sworn ? 10 : 6, truth: 0.25 + 0.05 * r, mark: true, tree: "light", col: TREE.light.col, follow: !!sworn }); C.fx.flash(TREE.light.col2, 0.18); },
        li_judgment(r) { const h = hp(), L = C.foes(16, 0.35, h); let t = null; for (const f of L) if (!t || C.hpOf(f) > C.hpOf(t)) t = f; const col = TREE.light.col; C.sfx("k2light");
          const tx = t ? C.x(t) : h.x + h.fx * 8 * Y, tz = t ? C.z(t) : h.z + h.fz * 8 * Y; if (t) k2(t).markT = core.t + 3;
          C.fx.target(tx, tz, col, 1.2);
          later(1.2, () => { const cx = t && C.alive(t) ? C.x(t) : tx, cz = t && C.alive(t) ? C.z(t) : tz, crt = R("li_ks_certain") ? 1.6 : 1; if (t && C.alive(t)) hit(t, 4 * rk(r) * crt, { tree: "light", stun: 1.5 }); C.foes(radius("light", 2.5), null, { x: cx, z: cz }).forEach((f) => { if (f !== t) hit(f, 1.5 * rk(r), { tree: "light", stun: 1, from: { x: cx, z: cz }, knock: 1.5 }); }); C.fx.pillar(cx, cz, col, 0.9); C.fx.flash(TREE.light.col2, 0.45); C.fx.shake(0.4, 0.4); C.fx.light(cx, cz, col, 3); if (R("li_ks_certain")) core.cds.li_shield = 0; }); },
        st_step(r) { const h = hp(), col = TREE.storm.col, half = R("st_ks_anchor") ? 0.5 : 1; C.sfx("k2storm");
          dash(8 * half, { hit: 0.6 * rk(r), w: 1.5, col, opts: { tree: "storm", knock: 3, burn: pairOn("Firestorm") ? 2 : 0, burnD: 0.2 } }); C.resetStrike(); core.primed.static = R("st_static") ? core.t + 3 : 0; core.primed.dead = pairOn("Dead Air") ? core.t + 2 : 0; },
        st_squall(r) { const h = hp(), col = TREE.storm.col, n = 4 + R("st_gale") + (R("st_ks_anchor") ? 2 : 0); C.sfx("k2storm");
          let cur = C.nearest(10, null, h), px = h.x, pz = h.z, m = 2 * rk(r); const seen = new Set();
          for (let i = 0; i < n && cur; i++) { seen.add(cur); const cx = C.x(cur), cz = C.z(cur); C.fx.bolt(px, pz, cx, cz, col, 0.3, true); hit(cur, m, { tree: "storm", stun: 0.4, burn: pairOn("Firestorm") ? 2 : 0, burnD: 0.2 }); m *= 0.8; px = cx; pz = cz; cur = C.foes(6, null, { x: cx, z: cz }).find((q) => !seen.has(q)); }
          C.fx.flash(TREE.storm.col2, 0.25); C.fx.light(h.x, h.z, col, 1.6); },
        st_charge(r) { const col = TREE.storm.col, half = R("st_ks_anchor") ? 0.5 : 1; C.sfx("k2storm"); C.inv(0.9); const h = hp(); C.fx.gather(h.x, h.z, col, 0.5); C.root(0.5);
          later(0.5, () => { dash(14 * half, { hit: 2.4 * rk(r), w: 2, col, opts: { tree: "storm", knock: 4, stun: 0.8 } }); C.fx.flash(TREE.storm.col2, 0.4); C.fx.shake(0.5, 0.5); const h2 = hp(); C.fx.light(h2.x, h2.z, col, 3); }); },
        sg_press(r) { const h = hp(), col = TREE.stone.col, R0 = radius("stone", 4), forge = R("sg_ks_forge"); C.sfx("k2stone");
          cone(R0, 0.35, 2 * rk(r), { tree: "stone", stun: 1 + 0.2 * r, burn: (forge && hasArt("ember")) || pairOn("Hearth-and-Hold") ? 3 : 0, burnD: 0.3 }, col);
          C.fx.slam(h.x + h.fx * 2.2 * Y, h.z + h.fz * 2.2 * Y, R0 * 0.8, col); C.fx.shake(0.45, 0.4);
          if (forge) zone({ kind: "disc", x: h.x + h.fx * 2.4 * Y, z: h.z + h.fz * 2.4 * Y, r: 2.4, t: 4, dps: 0.4, burn: 1, tree: "ember", col: TREE.ember.col }); },
        sg_set(r) { const h = hp(), heart = R("sg_ks_heart"); core.setT = heart ? core.t + 999 : core.t + 5; core.setR = r; core.setPos = { x: h.x, z: h.z }; C.sfx("k2stone");
          C.fx.slam(h.x, h.z, 2.2, TREE.stone.col); C.fx.ring(h.x, h.z, 6, TREE.stone.col2, 0.7); C.fx.shake(0.3, 0.3);
          if (C.kind === "battle") { C.allyBuff("red", 0.25, heart ? 30 : 5); }
          if (pairOn("Sworn Stone")) C.foes(5, null, h).forEach((f) => { k2(f).markT = core.t + 5; }); C.msg(heart ? "You set your feet. You will not move until you choose to." : "You set your feet.", 1.4); },
        sg_well(r) { const h = hp(), d = 6, cx = h.x + h.fx * d * Y, cz = h.z + h.fz * d * Y, col = TREE.stone.col, R0 = radius("stone", 6); C.sfx("k2stone");
          zone({ kind: "well", x: cx, z: cz, r: R0, t: 3, pull: 3.2, slow: 0.5, tree: "stone", col, end2: () => { C.foes(3, null, { x: cx, z: cz }).forEach((f) => hit(f, 2.2 * rk(r), { tree: "stone", stun: 1, from: { x: cx, z: cz }, knock: 1 })); C.fx.slam(cx, cz, 3, col); C.fx.shake(0.5, 0.45); C.fx.flash(col, 0.2); } }); },
        vw_lantern(r) { const h = hp(), col = TREE.veil.col, t = C.nearest(10, 0.5, h); C.sfx("k2veil"); C.inv(0.5);
          const x0 = h.x, z0 = h.z; if (t) C.place(C.x(t) + h.fx * 1.6 * Y, C.z(t) + h.fz * 1.6 * Y); else dash(8, { col });
          const h2 = hp(); C.fx.trail(x0, z0, h2.x, h2.z, col); C.fx.burst(h2.x, h2.z, col, 14, 1.6); C.foes(3, null, h2).forEach((f) => hit(f, 0, { stun: 0.8 + 0.2 * r, tree: "veil", nocombo: 1 }));
          if (R("vw_ks_thin")) C.unseen(1.5); habit(); },
        vw_guard(r) { const h = hp(), col = TREE.veil.col, watch = R("vw_ks_watch"); C.sfx("k2veil");
          const n = watch ? 5 : 3 + R("vw_anchor"), t = watch ? 60 : 10 + 2 * r + 2 * R("vw_anchor");
          if (C.kind === "battle") C.summon(n, t, h, col); else C.blades(2, 6 + r + R("vw_anchor"), 0.5 * rk(r) * artMul("veil"));
          C.fx.burst(h.x, h.z, col, 22, 2); C.fx.flash(col, 0.2); habit(); },
        vw_room(r) { const h = hp(), cx = h.x + h.fx * 5 * Y, cz = h.z + h.fz * 5 * Y, col = TREE.veil.col; C.sfx("k2veil");
          C.foes(6, null, { x: cx, z: cz }).forEach((f) => hit(f, 0, { stun: 2 + 0.3 * r, mark: 5, tree: "veil", nocombo: 1 }));
          zone({ kind: "room", x: cx, z: cz, r: 6, t: 5, mark: true, tree: "veil", col }); habit(); },
        sh_step(r) { const h = hp(), col = TREE.shadow.col, t = C.nearest(10, -0.2, h); C.sfx("k2shadow");
          if (!t) { dash(5, { col }); return; }
          const fx = C.x(t) - h.x, fz = C.z(t) - h.z, d = Math.hypot(fx, fz) || 1; const x0 = h.x, z0 = h.z;
          C.place(C.x(t) + fx / d * 1.3 * Y, C.z(t) + fz / d * 1.3 * Y); C.face(-fx / d, -fz / d); C.inv(0.3);
          C.fx.trail(x0, z0, hp().x, hp().z, col); C.fx.burst(x0, z0, "#0a1a14", 10, 1.2);
          const was = C.alive(t); hit(t, 2.5 * rk(r) * (1 + 0.2 * R("sh_knife")), { tree: "shadow", knock: 1 }); C.fx.burst(C.x(t), C.z(t), col, 12, 1.4);
          if (was && !C.alive(t) && R("sh_ks_hush")) { core.cds.sh_step = 0; C.msg("Again.", 0.8); } },
        sh_silence(r) { const h = hp(), gardens = R("sh_ks_gardens"), col = TREE.shadow.col; C.sfx("k2shadow");
          zone({ kind: "disc", x: h.x, z: h.z, r: 6 * (pairOn("Dead Air") ? 1.3 : 1), t: gardens ? 10 : 5 + r, silence: true, slow: C.kind === "area" ? 0.4 : 0, tree: "shadow", col, follow: !!gardens });
          if (C.kind === "battle") C.morale(-0.1, 5 + r, "e"); C.fx.flash("#06140f", 0.35); },
        sh_fear(r) { const h = hp(), col = TREE.shadow.col; C.sfx("k2shadow");
          const L = C.foes(8, 0.2, h); L.forEach((f) => { if (C.isFitted(f)) return; if (!C.boss(f) && Math.random() < 0.6 + 0.1 * r) hit(f, 0, { fear: 3, nocombo: 1 }); else hit(f, 0, { stun: 2, nocombo: 1 }); });
          C.fx.cone(h.x, h.z, h.fx, h.fz, 8, col); C.fx.flash("#020806", 0.4); C.msg(L.length ? "They run from nothing." : "Nothing there to frighten.", 1.2); },
        mt_bolt(r) { const h = hp(), col = TREE.metal.col2, hand = R("mt_ks_hand"), rng = 14 + 2 * R("mt_heat"); C.sfx("k2metal");
          const L = C.foes(rng, null, h).slice(0, hand ? 5 : 3), m = 0.9 * rk(r) * (1 + 0.15 * R("mt_heat"));
          if (!L.length) { C.fx.bolt(h.x, h.z, h.x + h.fx * 8 * Y, h.z + h.fz * 8 * Y, col, 0.2); return; }
          L.forEach((f, i) => later(0.07 * i, () => { if (!C.alive(f)) return; C.fx.bolt(h.x, h.z, C.x(f), C.z(f), col, 0.18); hit(f, m, { tree: "metal", knock: 0.6, burn: pairOn("Thieves of Fire") ? 2 : 0, burnD: 0.2 }); if (hand) segHits(h.x, h.z, C.x(f) + (C.x(f) - h.x) * 0.6, C.z(f) + (C.z(f) - h.z) * 0.6, 0.8).forEach((q) => { if (q !== f) hit(q, m * 0.6, { tree: "metal", nocombo: 1 }); }); C.fx.burst(C.x(f), C.z(f), col, 6, 1); })); },
        mt_vent(r) { const h = hp(), col = TREE.metal.col2; C.sfx("k2metal"); nova(4, 1.4 * rk(r), { tree: "metal", knock: 4, stun: 1 }, col); C.freezeArrows(6); C.fx.burst(h.x, h.z, col, 26, 2.2); C.fx.flash(col, 0.3); C.fx.shake(0.35, 0.35); C.fx.light(h.x, h.z, col, 2); },
        mt_over(r) { const sleep = R("mt_ks_sleep"), t = sleep ? 12 : 8; core.overEnd = core.t + t; buff("dmg", 0.3 + 0.1 * r, t); buff("spd", 0.25, t); buff("red", 0.15, t); if (!sleep) later(t, () => { buff("spd", -0.4, 2); C.msg("The core cools. You slow.", 1.2); }); const h = hp(); C.sfx("k2metal"); C.fx.ring(h.x, h.z, 2, TREE.metal.col2, 0.6); C.fx.flash(TREE.metal.col2, 0.3); C.msg("Overdrive.", 1); }
      };
      function col2(t) { return TREE[t].col2; }
      function coldTouch() { if (R("fr_cold")) C.heal(0.04 * R("fr_cold")); }
      function habit() { if (R("vw_habit")) buff("habit", 0.12 * R("vw_habit"), 5); }

      // ---------- casting ----------
      function cdLeft(id) { const n = NODE[id]; if (!n) return 0; const c = core.cds[id] || 0; if (charges(n) > 1) { const ch = core.chg[id]; if (ch && ch.n > 0) return 0; } return Math.max(0, c - core.t); }
      core.cdLeft = cdLeft;
      function cast(slot) {
        const id = equipped()[slot]; if (!id) { C.msg("Empty slot. Learn an active in Skills, then it sits here.", 1.8); return false; }
        if (!C.canAct()) return false;
        const n = NODE[id], tree = TREE[n.tree], art = tree.art;
        if (art && sealed[art]) { C.msg(ARTS[art].meter + " has sealed " + tree.name + ". Let it ease below 60.", 1.6); return false; }
        if (cdLeft(id) > 0) { return false; }
        let useId = id;
        // the Overlay: Veil arts sometimes answer with the wrong memory
        if (art === "veil" && meter("veil") >= 75 && Math.random() < 0.3) { const opts = ["vw_lantern", "vw_guard", "vw_room"].filter((q) => q !== id); useId = opts[Math.floor(Math.random() * opts.length)]; C.msg("The wrong memory answers.", 1.2); }
        const r = R(id);
        try { RUN[useId](Math.max(1, r)); } catch (e) { if (window.console) console.warn("k2 cast", useId, e); }
        // cooldown / charges
        const cd = cdOf(n), ch = charges(n);
        if (ch > 1) { const c = core.chg[id] || (core.chg[id] = { n: ch, next: 0 }); c.n = Math.max(0, c.n - 1); if (!c.next) c.next = core.t + cd; core.cds[id] = c.n > 0 ? 0 : c.next; }
        else core.cds[id] = core.t + cd;
        if (art) pay(art, costOf(n));
        core.lastCastT = core.t;
        if (art === "ember" && meter("ember") >= 75) { C.selfBurn(); }
        return true;
      }
      core.cast = cast;
      core.RUN = RUN;

      // ---------- hero hooks ----------
      core.strikeMul = (f) => {
        let m = 1 + bsum("dmg") + 0.08 * R("sg_burden");
        if (R("mt_ks_hand")) m *= 0.85;
        if (f) {
          const s = k2(f);
          if (s.slowT > core.t || (pairOn("The Rivalry") && s.burnT > core.t)) m *= 1 + 0.25 * R("fr_shatter");
          if (R("li_witness") && core.hitBy.get(f) > core.t - 4) m *= 1 + 0.08 * R("li_witness");
          if (core.inZone(C.hero(), "silence") && R("sh_ks_gardens")) m *= 1.6; else if (core.inZone(C.hero(), "silence") && C.kind === "area") m *= 1.3;
          if (core.primed.dead > core.t) { m *= 1.6; core.primed.dead = 0; }
        }
        return m;
      };
      core.onStrikeHit = (f) => {
        if (R("em_cracks")) { const s = k2(f); s.burnT = Math.max(s.burnT || 0, core.t + 2); s.burnD = Math.max(s.burnD || 0, 0.15 * R("em_cracks")); }
        if (R("st_pressure")) { C.knock(f, 0.6 * R("st_pressure") * Y); }
        if (core.primed.static > core.t) { core.primed.static = 0; const o = C.foes(5, null, { x: C.x(f), z: C.z(f) }).find((q) => q !== f); if (o) { C.fx.bolt(C.x(f), C.z(f), C.x(o), C.z(o), TREE.storm.col, 0.25, true); hit(o, 0.6 + 0.2 * R("st_static"), { tree: "storm", nocombo: 1 }); } }
        if (!C.alive(f)) { onKill(f, k2(f)); if (R("cmd_ks_front")) { core.frontStacks.push(core.t + 6); if (C.kind === "battle") C.allyBuff("dmg", 0.06, 6); } }
      };
      core.dmgMul = () => 1 + bsum("dmg") + 0.06 * core.frontStacks.filter((t) => t > core.t).length;
      // returns the damage to take (0 = avoided)
      core.heroHurt = (dmg, from, frontal) => {
        core.lastHurtT = core.t; if (from) core.hitBy.set(from, core.t);
        if (core.ahead > 0 && core.aheadT > core.t) { core.ahead--; const h = hp(); C.fx.echo(h.x, h.z, 0.6); if (from && C.alive(from)) { hit(from, 1.2 * rk(core.aheadR || 1), { tree: "frost", knock: 1.5, from: h }); } C.msg("Foreseen.", 0.6); return 0; }
        if (core.shieldT > core.t && (frontal !== false)) { if (from && C.alive(from)) hit(from, 0, { stun: 1 + 0.25 * (core.shieldR || 1), tree: "light", nocombo: 1 }); const h = hp(); C.fx.burst(h.x + h.fx * 0.8 * Y, h.z + h.fz * 0.8 * Y, TREE.light.col2, 8, 1); return 0; }
        let m = 1 - Math.min(0.8, bsum("red"));
        if (core.setT > core.t) { m *= 1 - (0.5 + 0.05 * (core.setR || 1)); if (from && C.alive(from)) hit(from, 0, { stun: 0.6, nocombo: 1 }); }
        if (meter("stone") >= 75) m *= 0.85;
        if (R("cmd_ks_front")) m *= 1.2;
        if (R("cmd_ks_banner") && C.kind === "area" && C.hpFrac() < 0.34) m *= 0.7;
        const z = core.inZone(from ? { x: C.x(from), z: C.z(from) } : null, "truth"); if (z) { m *= 1 - z.truth; if (R("li_ks_sworn") && from && C.alive(from)) hit(from, 0, { stun: 1, tree: "light", nocombo: 1 }); }
        return dmg * m;
      };
      core.speedMul = () => { let m = 1 + bsum("spd") + 0.05 * R("st_feet"); if (core.setT > core.t) m *= 0.3; if (meter("stone") >= 75) m *= 0.7; if (core.rootT > core.t) m = 0; return Math.max(0, m); };
      core.noBlock = () => (meter("ember") >= 75 || (R("em_ks_unbanked") && meter("ember") >= 50) || (R("li_ks_certain") && meter("light") >= 50));
      core.noFlee = () => (R("cmd_ks_banner") ? "The Banner Never Falls. You chose it: there is no falling back." : meter("light") >= 75 ? "You are certain. The Clear do not fall back." : meter("metal") >= 75 ? "Protocol: no retreat." : "");
      core.moraleAdd = (side) => { let m = 0; for (const b of core.buffs) if (b.k === "morale" + side) m += b.v; if (side === "p") { m += 0.05 * R("sg_line"); if (meter("metal") >= 75) m -= 0.08; } return m; };
      core.moraleFloor = () => (R("cmd_ks_banner") && !C.heroDown() ? 0.45 : 0);
      core.allyMul = () => { let m = 1; for (const b of core.buffs) if (b.k === "adm") m += b.v; if (meter("frost") >= 75) m = 1 + (m - 1) * 0.5; return m; };
      core.allyRed = () => { let m = 0; for (const b of core.buffs) if (b.k === "ared") m += b.v; if (meter("frost") >= 75) m *= 0.5; return Math.min(0.7, m); };
      core.orderDelay = () => (meter("shadow") >= 75 ? 2 : 0);
      core.inZone = (p, kind) => { if (!p) return null; for (const z of core.zones) { if (z.end <= core.t || !z[kind]) continue; if (z.kind === "disc" || z.kind === "well" || z.kind === "room") { if (Math.hypot(p.x - z.x, p.z - z.z) <= z.r * Y) return z; } } return null; };
      core.silenced = (u) => !!core.inZone({ x: C.x(u), z: C.z(u) }, "silence");
      core.rootT = 0; C.root = C.root || ((t) => { core.rootT = core.t + t; });

      // ---------- per-frame ----------
      let burnAcc = 0;
      core.tick = (dt) => {
        core.t += dt;
        for (let i = core.pend.length - 1; i >= 0; i--) if (core.pend[i].t <= core.t) { const p = core.pend.splice(i, 1)[0]; try { p.fn(); } catch (e) { if (window.console) console.warn(e); } }
        core.buffs = core.buffs.filter((b) => b.end > core.t);
        // charges refill
        for (const id in core.chg) { const c = core.chg[id], n = NODE[id]; if (c.next && core.t >= c.next) { c.n = Math.min(charges(n), c.n + 1); c.next = c.n < charges(n) ? core.t + cdOf(n) : 0; core.cds[id] = 0; } }
        // the Set ends when you move (Mountain's Heart) or runs Stone
        if (core.setT > core.t && R("sg_ks_heart")) { const h = hp(); if (core.setPos && Math.hypot(h.x - core.setPos.x, h.z - core.setPos.z) > 0.8 * Y) { core.setT = 0; C.msg("You move. The Set breaks.", 1); } else pay("stone", 4 * dt); }
        // zones
        const h = hp();
        for (const z of core.zones) {
          if (z.end <= core.t) { if (!z.done) { z.done = true; if (z.end2) z.end2(); } continue; }
          if (z.follow) { z.x = h.x; z.z = h.z; }
          z.tick -= dt; const pulse = z.tick <= 0; if (pulse) z.tick = 0.5;
          if (z.kind === "line") { if (pulse) segHits(z.x1, z.z1, z.x2, z.z2, z.w).forEach((f) => { hit(f, z.dps * 0.5, { tree: z.tree, burn: z.burn, burnD: 0.2, nocombo: 1 }); if (z.stag) C.stagger(f, 0.35); }); continue; }
          const L = C.foes(z.r, null, z);
          if (z.pull) for (const f of L) { if (C.boss(f)) continue; const dx = z.x - C.x(f), dz = z.z - C.z(f), d = Math.hypot(dx, dz) || 1; if (d > 0.6 * Y) C.drag(f, dx / d * z.pull * Y * dt, dz / d * z.pull * Y * dt); }
          if (pulse) for (const f of L) {
            if (z.dps) hit(f, z.dps * 0.5, { tree: z.tree, burn: z.burn, burnD: 0.2, nocombo: 1 });
            if (z.slow) hit(f, 0, { slow: 0.7, slowK: 1 - z.slow, nocombo: 1 });
            if (z.mark) k2(f).markT = Math.max(k2(f).markT || 0, core.t + 0.7);
            if (z.silence && C.kind === "area") C.loseAggro(f);
          }
        }
        core.zones = core.zones.filter((z) => z.end > core.t || !z.done);
        // echoes
        for (const e of core.echoes) if (!e.done && e.end <= core.t) { e.done = true; if (e.burst) { C.foes(3, null, e).forEach((f) => hit(f, 0.8, { tree: "frost", slow: 2, slowK: 0.5, from: e, knock: 1 })); C.fx.burst(e.x, e.z, TREE.frost.col, 18, 1.8); } }
        core.echoes = core.echoes.filter((e) => !e.done);
        // burning foes
        burnAcc += dt;
        if (burnAcc >= 0.5) { const step = burnAcc; burnAcc = 0; for (const f of C.allFoes()) { const s = k2(f); if (s.burnT > core.t && C.alive(f)) { const was = C.alive(f); C.hit(f, s.burnD * step * artMul("ember"), { knock: 0, kind: "burn" }); C.fx.ember(C.x(f), C.z(f)); if (was && !C.alive(f)) onKill(f, s); } } }
        // in-fight decay of the price (only when you are not casting)
        const s2 = st(); if (s2) for (const a in s2.m) if (core.t - core.lastCastT > 4) decay(a, dt, true);
        if (core.comboT > core.t && core.combo >= 2) { C.msg("Combo ×" + core.combo, 0.7); core.combo = 0; } else if (core.comboT <= core.t) core.combo = 0;
      };
      return core;
    }

    // ================================================================= VFX (THREE, pooled; shared by battle3d and area3d) =================================================================
    function makeVfx(o) {
      const { THREE, scene, camera, root } = o, gy = o.gy || (() => 0), low = () => (o.gfx ? o.gfx() === "low" : false);
      const glow = o.glowTex;
      const add = THREE.AdditiveBlending;
      const ringGeo = new THREE.RingGeometry(0.86, 1, 48); ringGeo.rotateX(-Math.PI / 2);
      const discGeo = new THREE.CircleGeometry(1, 40); discGeo.rotateX(-Math.PI / 2);
      const beamGeo = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true); beamGeo.rotateX(Math.PI / 2);
      const pillarGeo = new THREE.CylinderGeometry(1, 1, 1, 18, 1, true);
      const coneGeo = new THREE.CircleGeometry(1, 24, -0.6, 1.2); coneGeo.rotateX(-Math.PI / 2);
      const shieldGeo = new THREE.SphereGeometry(1, 16, 10, -0.9, 1.8, 0.5, 1.6);
      const geos = [ringGeo, discGeo, beamGeo, pillarGeo, coneGeo, shieldGeo];
      const mk = (geo, n, opts) => { const arr = []; for (let i = 0; i < n; i++) { const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial(Object.assign({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, blending: add, side: THREE.DoubleSide, fog: false }, opts || {}))); m.visible = false; m.renderOrder = 8; scene.add(m); arr.push({ m, t: 0, T: 1 }); } return arr; };
      const rings = mk(ringGeo, 10), discs = mk(discGeo, 8, { map: glow }), beams = mk(beamGeo, 14), pillars = mk(pillarGeo, 3), cones = mk(coneGeo, 4, { map: glow }), shields = mk(shieldGeo, 2);
      const NSP = 90, sps = [];
      for (let i = 0; i < NSP; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xffffff, transparent: true, depthWrite: false, blending: add, fog: false })); s.visible = false; s.renderOrder = 9; scene.add(s); sps.push({ s, t: 0, T: 1, vx: 0, vy: 0, vz: 0, g: 0, sz: 1 }); }
      let spi = 0;
      // no real light: a permanent PointLight would add a light to every material's shader (slower on phones, and a
      // recompile whenever it toggled). A big additive glow over the spot reads the same at this distance.
      const glowS = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, blending: add, fog: false })); glowS.visible = false; glowS.renderOrder = 7; scene.add(glowS); let lightT = 0, lightI = 0;
      const flashEl = document.createElement("div"); flashEl.className = "k2flash"; root.appendChild(flashEl);
      const zones = []; // persistent decals bound to core zones
      let shakeA = 0, shakeT = 0, shakeT0 = 1; const off = new THREE.Vector3();
      const col = (c) => new THREE.Color(c);
      const take = (arr) => { let best = arr[0]; for (const a of arr) { if (!a.m.visible) return a; if (a.t < best.t) best = a; } return best; };
      function sprite(x, y, z, c, sz, T, vx, vy, vz, g) { if (low() && (spi & 1)) { spi++; return; } const p = sps[spi++ % NSP]; p.s.position.set(x, y, z); p.s.material.color.set(c); p.s.visible = true; p.t = p.T = T; p.vx = vx || 0; p.vy = vy || 0; p.vz = vz || 0; p.g = g || 0; p.sz = sz; p.s.scale.setScalar(sz); }
      const api = {
        ring(x, z, r, c, T) { const a = take(rings); a.m.position.set(x, gy(x, z) + 0.15, z); a.m.material.color.set(c); a.m.visible = true; a.t = a.T = T || 0.5; a.r = r; a.kind = "ring"; },
        burst(x, z, c, n, h) { const y0 = gy(x, z) + 1; for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, sp = 2 + Math.random() * 5 * (h || 1); sprite(x, y0 + Math.random() * 0.6, z, c, 0.35 + Math.random() * 0.5, 0.45 + Math.random() * 0.35, Math.cos(a) * sp, 1.5 + Math.random() * 4, Math.sin(a) * sp, 9); } },
        ember(x, z) { if (Math.random() < 0.5) sprite(x + (Math.random() - 0.5) * 0.6, gy(x, z) + 0.8 + Math.random(), z + (Math.random() - 0.5) * 0.6, 0xff8a3a, 0.35, 0.5, 0, 2.2, 0, 0); },
        bolt(x1, z1, x2, z2, c, T, jag) {
          const y1 = gy(x1, z1) + 1.3, y2 = gy(x2, z2) + 1.1, segs = jag ? 3 : 1; let px = x1, py = y1, pz = z1;
          for (let k = 1; k <= segs; k++) { const f = k / segs, nx = x1 + (x2 - x1) * f + (k < segs && jag ? (Math.random() - 0.5) * 1.4 : 0), ny = y1 + (y2 - y1) * f + (k < segs && jag ? Math.random() * 0.8 : 0), nz = z1 + (z2 - z1) * f + (k < segs && jag ? (Math.random() - 0.5) * 1.4 : 0);
            const a = take(beams), L = Math.hypot(nx - px, ny - py, nz - pz) || 0.01; a.m.position.set((px + nx) / 2, (py + ny) / 2, (pz + nz) / 2); a.m.scale.set(jag ? 0.06 : 0.11, jag ? 0.06 : 0.11, L); a.m.lookAt(nx, ny, nz); a.m.material.color.set(c); a.m.visible = true; a.t = a.T = T || 0.2; a.kind = "beam"; px = nx; py = ny; pz = nz; }
          sprite(x2, y2, z2, c, 1.4, 0.3, 0, 0, 0, 0);
        },
        trail(x1, z1, x2, z2, c) { const n = low() ? 5 : 10; for (let i = 0; i <= n; i++) { const f = i / n; sprite(x1 + (x2 - x1) * f, gy(x1, z1) + 1 + Math.random() * 0.4, z1 + (z2 - z1) * f, c, 0.7, 0.35 + f * 0.3, 0, 0.6, 0, 0); } api.bolt(x1, z1, x2, z2, c, 0.18); },
        cone(x, z, fx, fz, r, c) { const a = take(cones); a.m.position.set(x, gy(x, z) + 0.2, z); a.m.rotation.set(0, Math.atan2(-fz, fx), 0); a.m.scale.setScalar(r * (o.Y || 1)); a.m.material.color.set(c); a.m.visible = true; a.t = a.T = 0.4; a.kind = "cone"; },
        slam(x, z, r, c) { api.ring(x, z, r * (o.Y || 1) * 1.2, c, 0.45); const d = take(discs); d.m.position.set(x, gy(x, z) + 0.12, z); d.m.scale.setScalar(r * (o.Y || 1)); d.m.material.color.set(c); d.m.visible = true; d.t = d.T = 0.5; d.kind = "slam"; api.burst(x, z, c, 14, 1.2); },
        flash(c, a) { flashEl.style.transition = "none"; flashEl.style.background = "radial-gradient(circle at 50% 55%, transparent 25%, " + c + " 120%)"; flashEl.style.opacity = String(Math.min(0.75, a * 1.4)); void flashEl.offsetWidth; flashEl.style.transition = "opacity .45s ease-out"; flashEl.style.opacity = "0"; },
        shake(a, T) { if (a > shakeA * (shakeT / shakeT0 || 0)) { shakeA = a; shakeT = shakeT0 = T; } },
        light(x, z, c, i) { glowS.position.set(x, gy(x, z) + 1.4, z); glowS.material.color.set(c); lightI = Math.min(1, 0.45 + 0.2 * (i || 1)); glowS.scale.setScalar(5 + 2.5 * (i || 1)); glowS.visible = true; lightT = 0.45; },
        pillar(x, z, c, T) { const a = take(pillars); a.m.position.set(x, gy(x, z) + 9, z); a.m.scale.set(1.3, 18, 1.3); a.m.material.color.set(c); a.m.visible = true; a.t = a.T = T || 0.8; a.kind = "pillar"; api.ring(x, z, 3.5 * (o.Y || 1), c, 0.6); api.burst(x, z, c, 24, 2); },
        target(x, z, c, T) { const a = take(rings); a.m.position.set(x, gy(x, z) + 0.15, z); a.m.material.color.set(c); a.m.visible = true; a.t = a.T = T; a.r = 1.6 * (o.Y || 1); a.kind = "target"; },
        gather(x, z, c, T) { for (let i = 0; i < 18; i++) { const a = Math.random() * 6.283, r = 3 + Math.random() * 2; sprite(x + Math.cos(a) * r, gy(x, z) + 0.5 + Math.random() * 2, z + Math.sin(a) * r, c, 0.5, T, -Math.cos(a) * r / T, 0.5, -Math.sin(a) * r / T, 0); } },
        shield(x, z, T, c) { const a = take(shields); a.T = a.t = T; a.m.material.color.set(c); a.m.visible = true; a.kind = "shield"; a.follow = true; },
        echo(x, z, T, self) { for (let i = 0; i < (self ? 6 : 10); i++) sprite(x + (Math.random() - 0.5) * 0.7, gy(x, z) + 0.3 + Math.random() * 1.7, z + (Math.random() - 0.5) * 0.7, 0xbfe8ff, 0.6, Math.min(1.2, T), 0, 0.2, 0, 0); api.ring(x, z, 1.2 * (o.Y || 1), "#bfe8ff", 0.5); },
        zone(zd) { const a = take(discs); a.zd = zd; a.m.material.color.set(zd.col); a.m.visible = true; a.t = a.T = zd.t; a.kind = "zone"; if (zd.kind === "line") { const cx = (zd.x1 + zd.x2) / 2, cz = (zd.z1 + zd.z2) / 2; a.m.position.set(cx, gy(cx, cz) + 0.14, cz); a.m.scale.set(Math.hypot(zd.x2 - zd.x1, zd.z2 - zd.z1) / 2, 1, zd.w * (o.Y || 1)); a.m.rotation.y = -Math.atan2(zd.z2 - zd.z1, zd.x2 - zd.x1); } else { a.m.rotation.y = 0; a.m.scale.setScalar(zd.r * (o.Y || 1)); a.m.position.set(zd.x, gy(zd.x, zd.z) + 0.14, zd.z); } api.ring(zd.kind === "line" ? (zd.x1 + zd.x2) / 2 : zd.x, zd.kind === "line" ? (zd.z1 + zd.z2) / 2 : zd.z, (zd.r || 5) * (o.Y || 1), zd.col, 0.5); }
      };
      let heroPos = { x: 0, z: 0 };
      api.pre = () => { if (off.lengthSq()) { camera.position.sub(off); off.set(0, 0, 0); } };
      api.tick = (dt, hx, hz, hyaw) => {
        heroPos = { x: hx, z: hz };
        for (const p of sps) if (p.s.visible) { p.t -= dt; if (p.t <= 0) { p.s.visible = false; continue; } p.vy -= p.g * dt; p.s.position.x += p.vx * dt; p.s.position.y += p.vy * dt; p.s.position.z += p.vz * dt; p.vx *= 0.94; p.vz *= 0.94; const f = p.t / p.T; p.s.material.opacity = Math.min(1, f * 1.6); p.s.scale.setScalar(p.sz * (0.6 + 0.6 * f)); }
        for (const a of rings) if (a.m.visible) { a.t -= dt; if (a.t <= 0) { a.m.visible = false; continue; } const f = 1 - a.t / a.T; if (a.kind === "target") { a.m.scale.setScalar(a.r * (1.4 - 0.6 * f)); a.m.material.opacity = 0.9; a.m.rotation.y += dt * 3; } else { a.m.scale.setScalar(Math.max(0.1, a.r * (0.25 + 0.75 * Math.sqrt(f)))); a.m.material.opacity = 0.95 * (1 - f); } }
        for (const a of beams) if (a.m.visible) { a.t -= dt; if (a.t <= 0) { a.m.visible = false; continue; } a.m.material.opacity = Math.min(1, a.t / a.T * 1.6); }
        for (const a of cones) if (a.m.visible) { a.t -= dt; if (a.t <= 0) { a.m.visible = false; continue; } a.m.material.opacity = 0.9 * a.t / a.T; }
        for (const a of pillars) if (a.m.visible) { a.t -= dt; if (a.t <= 0) { a.m.visible = false; continue; } const f = a.t / a.T; a.m.material.opacity = Math.min(1, f * 1.8); a.m.scale.x = a.m.scale.z = 1.3 * (0.4 + f); }
        for (const a of shields) if (a.m.visible) { a.t -= dt; if (a.t <= 0) { a.m.visible = false; continue; } a.m.position.set(hx, gy(hx, hz) + 1.1, hz); a.m.rotation.y = hyaw + Math.PI / 2; a.m.scale.setScalar(1.3); a.m.material.opacity = 0.35 + 0.15 * Math.sin(a.t * 18); }
        for (const a of discs) if (a.m.visible) { a.t -= dt; if (a.t <= 0) { a.m.visible = false; a.zd = null; continue; }
          if (a.kind === "zone") { const zd = a.zd; if (zd && zd.follow) { a.m.position.set(hx, gy(hx, hz) + 0.14, hz); } const pul = 0.5 + 0.12 * Math.sin((a.T - a.t) * 6); a.m.material.opacity = Math.min(1, a.t * 2) * (zd && zd.kind === "line" ? 0.95 : zd && zd.silence ? 0.55 : pul); if (zd && zd.kind === "well") a.m.rotation.y += dt * 4; if (zd && (zd.burn || zd.kind === "line")) for (let q = 0, nq = zd.kind === "line" ? (low() ? 1 : 3) : (low() ? 0 : 1); q < nq; q++) { const px = zd.kind === "line" ? zd.x1 + (zd.x2 - zd.x1) * Math.random() : a.m.position.x + (Math.random() - 0.5) * zd.r * (o.Y || 1) * 1.4, pz = zd.kind === "line" ? zd.z1 + (zd.z2 - zd.z1) * Math.random() : a.m.position.z + (Math.random() - 0.5) * zd.r * (o.Y || 1) * 1.4; sprite(px, gy(px, pz) + 0.3, pz, Math.random() < 0.5 ? 0xff7a2a : 0xffc86a, 0.7 + Math.random() * 0.6, 0.6, 0, 2.4 + Math.random() * 1.5, 0, 0); } if (zd && zd.kind === "well" && Math.random() < 0.5) { const an = Math.random() * 6.283, rr = zd.r * (o.Y || 1); sprite(zd.x + Math.cos(an) * rr, gy(zd.x, zd.z) + 0.3, zd.z + Math.sin(an) * rr, zd.col, 0.5, 0.7, -Math.cos(an) * rr / 0.7, 0.4, -Math.sin(an) * rr / 0.7, 0); } }
          else { a.m.material.opacity = 0.8 * a.t / a.T; } }
        if (lightT > 0) { lightT -= dt; glowS.material.opacity = Math.max(0, lightI * lightT / 0.45); if (lightT <= 0) glowS.visible = false; }
        if (shakeT > 0) { shakeT -= dt; const a = shakeA * Math.max(0, shakeT / shakeT0) * 0.35; off.set((Math.random() - 0.5) * a, (Math.random() - 0.5) * a, (Math.random() - 0.5) * a); camera.position.add(off); }
      };
      api.dispose = () => { geos.forEach((g) => g.dispose()); try { flashEl.remove(); } catch (e) {} };
      return api;
    }

    // ================================================================= 3D battle controller =================================================================
    function battle(ctx) {
      // ctx from battle3d.js: { THREE, scene, camera, root, kit, hero, units, H, hurt, spark, giveOrder, addUnit, look, info, arrows, order, msg, sfx, gfx, resetStrike, castBtn, isVoid, fac, heroDown, kael }
      const units = ctx.units, hero = ctx.hero;
      const vfx = makeVfx({ THREE: ctx.THREE, scene: ctx.scene, camera: ctx.camera, root: ctx.root, glowTex: ctx.kit.glowTex, gy: (x, z) => ctx.H(x, z), gfx: ctx.gfx, Y: 1 });
      const summons = [];
      const C = {
        kind: "battle", Y: 1, fx: vfx,
        w: (x, z) => ({ x, z }),
        st: (u) => u.k2 || (u.k2 = {}),
        hero: () => ({ x: hero.x, z: hero.z, fx: Math.sin(hero.yaw), fz: Math.cos(hero.yaw) }),
        x: (u) => u.x, z: (u) => u.z, alive: (u) => !u.dead && !u.gone, boss: (u) => !!u.kael, hpOf: (u) => u.hp,
        isVoid: () => !!ctx.isVoid, isFitted: () => ctx.fac === "metal",
        allFoes: () => units.filter((u) => u.side === "e" && !u.dead && !u.gone),
        foes(r, cosT, at) { const out = [], h = at || C.hero(), fx = h.fx, fz = h.fz; for (const u of units) { if (u.side !== "e" || u.dead || u.gone || u.climb) continue; const dx = u.x - h.x, dz = u.z - h.z, d = Math.hypot(dx, dz); if (d > r) continue; if (cosT !== null && cosT !== undefined && d > 0.5 && (dx * fx + dz * fz) / d < cosT) continue; out.push(u); } out.sort((a, b) => Math.hypot(a.x - h.x, a.z - h.z) - Math.hypot(b.x - h.x, b.z - h.z)); return out; },
        nearest(r, cosT, at) { return C.foes(r, cosT, at)[0] || null; },
        alone(u) { for (const o of units) if (o !== u && o.side === u.side && !o.dead && !o.gone && Math.hypot(o.x - u.x, o.z - u.z) < 3) return false; return true; },
        hit(u, mult, o) { if (u.dead || u.gone) return false; ctx.hurt(u, ctx.info.heroW * mult * core.dmgMul(), hero, o.kind === "burn" ? "burn" : "k2"); if (o.knock) { const d = Math.hypot(o.dx, o.dz) || 1; u.kx = (u.kx || 0) + o.dx / d * o.knock * 2.4; u.kz = (u.kz || 0) + o.dz / d * o.knock * 2.4; u.stag = Math.max(u.stag || 0, 0.3); } if (mult > 0 && o.kind !== "burn") ctx.spark(u.x, (u.y || 0) + 1.2, u.z); return u.dead; },
        stun(u, t) { u.stag = Math.max(u.stag || 0, t); u.kx = u.kx || 0; u.kz = u.kz || 0; },
        stagger(u, t) { u.stag = Math.max(u.stag || 0, t); },
        slow() {}, knock(u, k) { const d = Math.hypot(u.x - hero.x, u.z - hero.z) || 1; u.kx = (u.kx || 0) + (u.x - hero.x) / d * k * 3; u.kz = (u.kz || 0) + (u.z - hero.z) / d * k * 3; u.stag = Math.max(u.stag || 0, 0.25); },
        drag(u, dx, dz) { u.x += dx; u.z += dz; },
        fear(u) { if (!u.kael) u.rout = true; },
        loseAggro() {},
        heal(f) { hero.hp = Math.min(hero.hpm, hero.hp + hero.hpm * f); },
        hpFrac: () => hero.hp / hero.hpm, heroDown: () => !!ctx.heroDown(),
        inv(t) { core.invT = core.t + t; },
        unseen(t) { core.invT = core.t + t; },
        move(dx, dz) { const steps = 8; let mx = 0, mz = 0; for (let i = 0; i < steps; i++) { const nx = hero.x + dx / steps, nz = hero.z + dz / steps; if (ctx.canStand && !ctx.canStand(nx, nz, hero)) break; hero.x = Math.max(-75, Math.min(75, nx)); hero.z = Math.max(-75, Math.min(75, nz)); mx += dx / steps; mz += dz / steps; } return Math.hypot(mx, mz); },
        place(x, z) { if (!ctx.canStand || ctx.canStand(x, z, hero)) { hero.x = x; hero.z = z; } },
        face(fx, fz) { hero.yaw = Math.atan2(fx, fz); },
        resetStrike() { hero.cd = 0; },
        decoy(x, z, t) { C.summon(1, t, { x, z }, "#bfe8ff", true); },
        summon(n, t, at, col, decoy) {
          for (let i = 0; i < n; i++) { const a = (i / Math.max(1, n)) * 6.283 + Math.random(); const u = ctx.addUnit("p", "inf", ctx.info.hb * (decoy ? 0.4 : 1.6), ctx.look(), { k2echo: true }); u.x = at.x + Math.cos(a) * 1.4; u.z = at.z + Math.sin(a) * 1.4; u.y = ctx.H(u.x, u.z); u.root.position.set(u.x, u.y, u.z); u.yaw = hero.yaw; if (decoy) { u.hp = u.hpm = ctx.info.hb * 8; u.decoy = true; u.reach = 0; } u.id = units.length + 1000 + Math.random(); u.vx = 0; u.vz = 0;
            const s = new ctx.THREE.Sprite(new ctx.THREE.SpriteMaterial({ map: ctx.kit.glowTex, color: col, transparent: true, depthWrite: false, blending: ctx.THREE.AdditiveBlending, opacity: 0.7 })); s.scale.set(1.6, 2.6, 1); s.position.y = 1.1; u.root.add(s); u.ring.material = ringGhost;
            summons.push({ u, end: core.t + t, s }); vfx.burst(u.x, u.z, col, 8, 1); }
        },
        blades() {}, selfBurn() { for (const u of units) if (u.side === "p" && !u.hero && !u.dead && Math.hypot(u.x - hero.x, u.z - hero.z) < 3 && Math.random() < 0.5) ctx.hurt(u, ctx.info.hb * 0.3, null); C.msg("The Flare: your fire does not choose.", 1.2); },
        unrout(r) { let n = 0; for (const u of units) if (u.side === "p" && u.rout && !u.gone && !u.dead && Math.hypot(u.x - hero.x, u.z - hero.z) < r) { u.rout = false; n++; } return n; },
        morale(v, t, side) { core.buff("morale" + (side || "p"), v * (side === "e" ? 1 : core.allyMul()), t); },
        allyBuff(k, v, t) { core.buff(k === "dmg" ? "adm" : "ared", v, t); },
        order(o, g) { const has = units.some((u) => u.side === "p" && u.cls === g && !u.dead && !u.gone && !u.rout); if (!has) return false; ctx.giveOrder(o, g); return true; },
        freezeArrows(r) { for (const a of ctx.arrows) if (a.on && a.side === "e" && Math.hypot(a.x - hero.x, a.z - hero.z) < r) { a.vx *= 0.05; a.vz *= 0.05; a.vy = Math.min(a.vy, 0); a.w = 0; } },
        canAct: () => !ctx.heroDown() && !ctx.over(),
        msg: (t, s) => ctx.msg(t, s), sfx: (n) => ctx.sfx(n)
      };
      const ringGhost = new ctx.THREE.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.7, depthWrite: false });
      const core = makeCore(C);
      toastFn = (t) => ctx.msg(t, 2.6);
      onStage = (art, b) => { const t = TREE[TREE_OF_ART[art]]; vfx.flash(b >= 2 ? "#8a1a10" : t.col, b >= 2 ? 0.55 : 0.3); vfx.shake(b >= 2 ? 0.4 : 0.15, 0.4); if (b === 3) { hero.hp = Math.max(1, hero.hp - hero.hpm * 0.2); core.rootT = core.t + 1.2; ctx.msg(ARTS[art].stages[3] + ". You come back from the edge. " + t.name + " is sealed.", 3.5); } else if (b === 2) { ctx.msg(ARTS[art].arrears, 3.2); if (art === "storm") { hero.hpm *= 0.75; hero.hp = Math.min(hero.hp, hero.hpm); } } };
      const h = mountHud(ctx.root, ctx.castBtn, "battle", (i) => { core.cast(i); });
      ctx.castBtn.addEventListener("pointerdown", (e) => { e.stopPropagation(); e.preventDefault(); toggleTray(); });
      const ctl = {
        core, vfx,
        cast: (i) => core.cast(i), toggle: () => toggleTray(),
        pre: () => vfx.pre(),
        tick(dt) {
          core.tick(dt);
          for (const sm of summons) { if (!sm.done && (core.t >= sm.end || sm.u.dead)) { sm.done = true; sm.u.gone = true; sm.u.root.visible = false; vfx.burst(sm.u.x, sm.u.z, "#d6dcff", 8, 1); } }
          if (core.invT > core.t) hero.k2inv = true; else hero.k2inv = false;
          vfx.tick(dt, hero.x, hero.z, hero.yaw);
          hudTick(core.cdLeft);
        },
        strikeMul: (o) => core.strikeMul(o), onStrikeHit: (o) => core.onStrikeHit(o),
        heroHurt(dmg, from, frontal) { if (core.invT > core.t) return 0; return core.heroHurt(dmg, from, frontal); },
        speedMul: () => core.speedMul(), noBlock: () => core.noBlock(), noFlee: () => core.noFlee(),
        moraleAdd: (s) => core.moraleAdd(s), moraleFloor: () => core.moraleFloor(),
        allyMul: () => core.allyMul(), allyRed: () => core.allyRed(), silenced: (u) => core.silenced(u),
        slowK: (u) => (u.k2 && u.k2.slowT > core.t ? u.k2.slowK : 1),
        orderDelay: () => core.orderDelay(),
        noRout: (u) => u.side === "p" && core.setT > core.t && R("sg_line") > 0 && Math.hypot(u.x - hero.x, u.z - hero.z) < 5 + 2 * R("sg_line"),
        decoyFor(u) { for (const sm of summons) if (!sm.done && sm.u.decoy && Math.hypot(sm.u.x - u.x, sm.u.z - u.z) < 9) return sm.u; return null; },
        state: () => ({ eq: equipped(), m: Object.assign({}, st().m), cds: Object.assign({}, core.cds), t: core.t, zones: core.zones.filter((z) => z.end > core.t).length, summons: summons.filter((s) => !s.done).length, open: !!(hud && hud.open),
          shield: core.shieldT > core.t, ahead: core.ahead, set: core.setT > core.t, buffs: core.buffs.length, hero: { x: hero.x, z: hero.z }, noBlock: core.noBlock(), noFlee: !!core.noFlee() }),
        dispose() { unmountHud(); vfx.dispose(); toastFn = null; onStage = null; }
      };
      return ctl;
    }

    // ================================================================= town/road fights (the area sim) =================================================================
    // index.html builds the adapter (it owns the sim); here we wrap it in a core and keep the VFX in step with area3d.js.
    let areaCore = null, areaVfx = null, areaC = null;
    const FXK = ["ring", "burst", "ember", "bolt", "trail", "cone", "slam", "flash", "shake", "light", "pillar", "target", "gather", "shield", "echo", "zone"];
    function area(Cimpl) {
      const fx = {}; FXK.forEach((k) => { fx[k] = (...a) => { if (areaVfx) return areaVfx[k](...a); if (Cimpl.fx2d && Cimpl.fx2d[k]) return Cimpl.fx2d[k](...a); }; });
      areaC = Object.assign({ kind: "area", fx }, Cimpl);
      areaCore = makeCore(areaC);
      return areaCore;
    }
    // area3d.js calls this once its scene is built. The core speaks sim coordinates (world = sim * PX); radii are in yards,
    // and one yard is one world unit, so only positions need converting on the way into the 3D effects.
    function areaFx(o) {
      const PX = o.PX, c = (n) => n * PX;
      const v = makeVfx({ THREE: o.THREE, scene: o.scene, camera: o.camera, root: o.root, glowTex: o.glowTex, gy: () => 0, gfx: o.gfx, Y: 1 });
      const wrap = {
        ring: (x, z, r, col, T) => v.ring(c(x), c(z), r, col, T),
        burst: (x, z, col, n, h) => v.burst(c(x), c(z), col, n, h),
        ember: (x, z) => v.ember(c(x), c(z)),
        bolt: (x1, z1, x2, z2, col, T, j) => v.bolt(c(x1), c(z1), c(x2), c(z2), col, T, j),
        trail: (x1, z1, x2, z2, col) => v.trail(c(x1), c(z1), c(x2), c(z2), col),
        cone: (x, z, fx, fz, r, col) => v.cone(c(x), c(z), fx, fz, r, col),
        slam: (x, z, r, col) => v.slam(c(x), c(z), r, col),
        flash: (col, a) => v.flash(col, a), shake: (a, T) => v.shake(a, T),
        light: (x, z, col, i) => v.light(c(x), c(z), col, i),
        pillar: (x, z, col, T) => v.pillar(c(x), c(z), col, T),
        target: (x, z, col, T) => v.target(c(x), c(z), col, T),
        gather: (x, z, col, T) => v.gather(c(x), c(z), col, T),
        shield: (x, z, T, col) => v.shield(c(x), c(z), T, col),
        echo: (x, z, T, s) => v.echo(c(x), c(z), T, s),
        zone: (zd) => { const z2 = Object.assign({}, zd); if (zd.kind === "line") { z2.x1 = c(zd.x1); z2.z1 = c(zd.z1); z2.x2 = c(zd.x2); z2.z2 = c(zd.z2); } else { z2.x = c(zd.x); z2.z = c(zd.z); } return v.zone(z2); }
      };
      areaVfx = wrap;
      return { tick: (dt, hx, hz, yaw) => v.tick(dt, hx, hz, yaw), pre: () => v.pre(), dispose: () => { v.dispose(); if (areaVfx === wrap) areaVfx = null; } };
    }

    // ---------- the skill sheet (phone-first) ----------
    const UI = { tree: null, sel: null, modal: null };
    function nodeBtn(n) {
      const r = R(n.id), w = why(n), can = !w, t = TREE[n.tree], got = r > 0;
      const cls = "k2n k2" + n.kind + (got ? " got" : "") + (r >= n.max ? " max" : "") + (can ? " can" : "") + (w && !got ? " lock" : "") + (UI.sel === n.id ? " sel" : "");
      return '<button class="' + cls + '" data-k2sel="' + n.id + '" style="' + cv(t.col, t.col2) + '" aria-label="' + n.name + '"><i class="k2gl">' + svgGlyph(n.glyph, n.kind === "k" ? 34 : 28) + "</i>" + (n.kind !== "k" ? '<span class="k2r">' + r + "/" + n.max + "</span>" : "") + (n.kind === "a" ? '<span class="k2tag">ACTIVE</span>' : "") + "</button><span class=\"k2nn\">" + n.name + "</span>";
    }
    function detail(n) {
      const r = R(n.id), w = why(n), t = TREE[n.tree], rl = role(n.tree);
      let h = '<div class="k2d" style="' + cv(t.col) + '"><div class="k2dh"><i class="k2dg">' + svgGlyph(n.glyph, 34, t.col2) + "</i><div><b>" + n.name + '</b><span class="k2dk">' + (n.kind === "a" ? "Active · phone button" : n.kind === "k" ? "Keystone · choose one" : "Passive") + (n.kind !== "k" ? " · rank " + r + "/" + n.max : "") + "</span></div></div>";
      h += '<p class="k2line">' + n.line + "</p>";
      if (n.kind === "a") { const tr = TREE[n.tree]; h += '<p class="k2meta">' + (n.cost ? "<b>Price</b> +" + Math.round(costOf(n)) + " " + ARTS[tr.art].meter + " · " : "<b>Price</b> none · ") + "<b>Cooldown</b> " + Math.round(cdOf(n) * 10) / 10 + " s" + (charges(n) > 1 ? " · " + charges(n) + " charges" : "") + "</p>"; }
      // what changes
      const now = r > 0 ? n.what(r) : null, next = r < n.max ? n.what(r + 1) : null;
      h += '<div class="k2wc"><div class="k2wch">' + (r > 0 && next ? "What changes at rank " + (r + 1) : r > 0 ? "What it does" : "What it changes") + "</div><ul>";
      (next || now).forEach((ln, i) => { const diff = now && next && now[i] !== next[i]; h += "<li" + (diff ? ' class="up"' : "") + ">" + ln + (diff ? '<s>' + now[i] + "</s>" : "") + "</li>"; });
      h += "</ul></div>";
      if (n.tree !== "cmd" && !rl && !w) { const s = st(); h += '<p class="k2warn">' + (s.spark ? "This will be your <b>Half-Spark</b>: the first two tiers only, and its price can never pass the Debt." : "This will be your <b>Spark</b>: the full art, and the full price. You can carry one Spark and one Half-Spark.") + "</p>"; }
      h += '<div class="k2db">' + (w && r < n.max ? '<span class="k2why">' + w + "</span>" : "<span></span>") + "<span>";
      if (n.kind === "a" && r > 0) { const eq = st().eq; h += '<span class="k2eq">' + [0, 1, 2].map((i) => '<button data-k2eq="' + n.id + '" data-k2slot2="' + i + '" class="' + (eq[i] === n.id ? "on" : "") + '">' + (i + 1) + "</button>").join("") + "</span>"; }
      h += '<button class="k2learn' + (!w ? " solid" : "") + '" data-k2learn="' + n.id + '"' + (w ? " disabled" : "") + ">" + (r >= n.max ? "Mastered" : n.kind === "k" ? "Choose" : r ? "Rank up" : "Learn") + "</button></span></div></div>";
      return h;
    }
    function meterBlock(a) {
      const A = ARTS[a], v = meter(a), sg = stageOf(v), s = st(), t = TREE[TREE_OF_ART[a]], fl = floorOf(a), mk = s.marks[a] || 0;
      return '<div class="k2pm" style="' + cv(t.col) + '"><div class="k2pmh"><b>' + A.meter + '</b><span>' + t.name + (role(t.id) === "half" ? " · Half-Spark" : role(t.id) === "spark" ? " · Spark" : "") + '</span><em>' + STAGE_NAMES[sg] + ": " + A.stages[sg] + '</em></div><div class="k2bar big"><i class="fl" style="width:' + fl + '%"></i><i class="v" style="width:' + v + '%"></i><u style="left:50%"></u><u style="left:75%"></u>' + (cap(a) < 100 ? '<i class="cap" style="left:' + cap(a) + '%"></i>' : "") + "</div><p>" + A.body[Math.max(sg, stageOf(fl))] + (mk ? " <b>Marks: " + mk + "</b> (they never walk back; the meter cannot fall below " + fl + ")." : "") + (a === "storm" && s.years ? " You have spent <b>" + s.years.toFixed(1) + " years</b> of your life in the sky." : "") + "</p></div>";
    }
    function sheet() {
      const s = st(); if (!s) return "<p>No game.</p>";
      const L = env.lvl(), P = points();
      let h = '<div class="k2s"><div class="k2L">';
      h += '<div class="k2top"><div><h2>Realm Arts</h2><p class="sub">' + env.pname() + " · Level " + L + (s.spark ? " · Spark: <b style=\"color:" + TREE[s.spark].col + '">' + TREE[s.spark].name + "</b>" : " · no Spark yet") + (s.half ? " · Half: <b style=\"color:" + TREE[s.half].col + '">' + TREE[s.half].name + "</b>" : "") + '</p></div><div class="k2pts' + (P ? " has" : "") + '"><b>' + P + "</b><span>point" + (P === 1 ? "" : "s") + "</span></div></div>";
      // loadout
      h += '<div class="k2load"><span>Abilities on your buttons</span>' + s.eq.map((id, i) => { const n = id && NODE[id]; return '<button class="k2slot' + (n ? "" : " empty") + '" data-k2sel="' + (id || "") + '" style="' + cv((n ? TREE[n.tree].col : "#3a2e1c")) + '"><i>' + (n ? svgGlyph(n.glyph, 26, TREE[n.tree].col2) : svgGlyph("lock", 18, "#5a4a2a")) + "</i><b>" + (n ? n.name : "Empty") + "</b><em>" + (i + 1) + "</em></button>"; }).join("") + "</div>";
      // tree picker
      if (!UI.tree) UI.tree = s.spark || "cmd";
      h += '<div class="k2trees">' + TREES.map((t) => { const rl = role(t.id), n = spentIn(t.id), lock = t.id !== "cmd" && !rl && s.spark && s.half, ready = P > 0 && treeNodes(t.id).some((q) => !why(q)); return '<button class="k2tr' + (UI.tree === t.id ? " on" : "") + (lock ? " lock" : "") + (ready ? " ready" : "") + '" data-k2tree="' + t.id + '" style="' + cv(t.col, t.col2) + '"><i>' + svgGlyph(t.glyph, 26) + "</i><b>" + t.name + "</b>" + (rl === "spark" ? "<em>SPARK</em>" : rl === "half" ? "<em>HALF</em>" : n ? "<em>" + n + "</em>" : "") + "</button>"; }).join("") + "</div>";
      const t = TREE[UI.tree], nodes = treeNodes(t.id), rl = role(t.id);
      h += '<div class="k2th" style="' + cv(t.col, t.col2) + '"><i class="k2crest">' + svgGlyph(t.glyph, 40) + '</i><div><b>' + t.name + "</b><span>" + t.sub + "</span><p>" + t.fantasy + '</p><p class="k2price2">' + t.price + "</p></div></div>";
      if (t.art) { const p = PAIRS.filter((q) => q.a === t.id || q.b === t.id); h += '<div class="k2pairs">' + p.map((q) => { const other = q.a === t.id ? q.b : q.a, on = pairOn(q.name); return '<span class="' + (on ? "on" : "") + '" style="' + cv(TREE[other].col) + '" title="' + q.line + '"><b>' + q.name + "</b> with " + TREE[other].name + (on ? " · active" : "") + "</span>"; }).join("") + "</div>"; }
      // tiers
      if (!UI.sel || !NODE[UI.sel] || NODE[UI.sel].tree !== t.id) { const f = nodes.find((q) => !why(q)) || nodes[0]; UI.sel = f.id; }
      h += '<div class="k2tree" id="k2tree" style="' + cv(t.col) + '">';
      [1, 2, 3, 4].forEach((tier) => {
        const row = nodes.filter((q) => q.tier === tier), need = TIER_PTS[tier], have = spentIn(t.id), locked = have < need || L < TIER_LV[tier] || (rl === "half" && tier >= 3);
        h += '<div class="k2tier' + (locked ? " lock" : "") + (tier === 4 ? " ks" : "") + '"><div class="k2tl"><span>' + (tier === 4 ? "Keystone · choose who you become" : "Tier " + ["", "I", "II", "III"][tier]) + "</span><em>" + (tier === 1 ? "open" : (have >= need ? "✓ " : have + "/") + need + " in tree" + (TIER_LV[tier] > 1 ? " · Lv " + TIER_LV[tier] : "")) + '</em></div><div class="k2row">';
        row.forEach((q, i) => { h += '<div class="k2cell">' + nodeBtn(q) + "</div>"; if (tier === 4 && i === 0) h += '<div class="k2or">OR</div>'; });
        h += "</div></div>";
      });
      h += "</div></div>";
      // right column (landscape / desktop): the detail sticks beside the tree; on a portrait phone it sticks to the bottom
      h += '<div class="k2R">' + detail(NODE[UI.sel]);
      // the price
      const arts = Object.keys(s.m).filter((a) => s.m[a] > 0 || s.marks[a]).concat([s.spark, s.half].filter((q) => q && TREE[q].art).map((q) => TREE[q].art)).filter((a, i, A) => A.indexOf(a) === i);
      h += '<div class="k2sec">The price</div>';
      h += arts.length ? arts.map(meterBlock).join("") : '<p class="dim-t">No Realm art has touched you yet. Every art you learn will show its price here: the Toll that rest walks back, the Debt that does not, the Arrears that change who you are.</p>';
      if (contra()) h += '<p class="k2warn">The Contradiction: for ' + Math.max(0, s.contra - Math.floor(env.day())) + " more day(s), every price costs 25% more. Your life and your arts disagree.</p>";
      h += '<div class="k2sec">Unlearn</div><div class="k2re"><p>The Contradiction: forget every rank and choose again. <b>' + respecCost() + " crowns</b> to a Conclave tutor. Marks stay; for five days every price costs a quarter more.</p><button data-k2respec=\"1\"" + (spent() < 1 || env.crowns() < respecCost() ? " disabled" : "") + ">Unlearn</button></div>";
      h += "</div>";
      if (UI.modal) h += modal();
      h += "</div>";
      return h;
    }
    function modal() {
      const m = UI.modal;
      if (m.kind === "role") { const n = NODE[m.id], t = TREE[n.tree], s = st(), half = !!s.spark; return '<div class="k2modal"><div class="k2mb" style="' + cv(t.col, t.col2) + '"><i class="k2crest big">' + svgGlyph(t.glyph, 64) + "</i><h3>" + (half ? "A Half-Spark" : "Recognition") + "</h3><p>" + (half ? t.name + " answers you, but only by halves. You can learn its first two tiers. It pays the same price per use, but you cannot draw enough to go past the Debt." : t.name + " answers you. This becomes your <b>Spark</b>: the full art, every tier, both keystones, and the full price: <b>" + ARTS[t.art].meter + "</b>.") + '</p><p class="k2price2">' + t.price + '</p><div class="k2mbtn"><button data-k2modal="no">Not yet</button><button class="solid" data-k2modal="yes">' + (half ? "Take the Half-Spark" : "Let it answer") + "</button></div></div></div>"; }
      if (m.kind === "ks") { const n = NODE[m.id], t = TREE[n.tree], pair = treeNodes(n.tree).filter((q) => q.kind === "k"); return '<div class="k2modal"><div class="k2mb wide" style="' + cv(t.col, t.col2) + '"><h3>Choose who you become</h3><p class="dim-t">One keystone per art. The other road closes until you unlearn.</p><div class="k2ksc">' + pair.map((q) => '<button class="k2ksb' + (q.id === m.id ? " on" : "") + '" data-k2kspick="' + q.id + '"><i>' + svgGlyph(q.glyph, 44) + "</i><b>" + q.name + "</b><p>" + q.line + "</p><ul>" + q.what().map((x) => "<li>" + x + "</li>").join("") + "</ul></button>").join('<div class="k2or">OR</div>') + '</div><div class="k2mbtn"><button data-k2modal="no">Not yet</button><button class="solid" data-k2modal="yes">Become ' + n.name + "</button></div></div></div>"; }
      if (m.kind === "respec") return '<div class="k2modal"><div class="k2mb"><h3>The Contradiction</h3><p>Forget every rank in every art for <b>' + respecCost() + " crowns</b>. Your Spark and Half-Spark are free to choose again.</p><p>Nothing walks back a Mid price: your marks stay. For five days, every price costs a quarter more while your life and your arts disagree.</p><div class=\"k2mbtn\"><button data-k2modal=\"no\">Keep who I am</button><button class=\"solid\" data-k2modal=\"yes\">Unlearn</button></div></div></div>";
      return "";
    }
    function lines() {
      const w = document.getElementById("k2tree"); if (!w) return; let svg = w.querySelector("svg.k2lines"); if (!svg) { svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.setAttribute("class", "k2lines"); w.insertBefore(svg, w.firstChild); }
      const R0 = w.getBoundingClientRect(), tiers = [...w.querySelectorAll(".k2tier")]; let out = "";
      for (let i = 0; i < tiers.length - 1; i++) {
        const a = [...tiers[i].querySelectorAll(".k2n")], b = [...tiers[i + 1].querySelectorAll(".k2n")];
        a.forEach((x) => b.forEach((y) => { const A = x.getBoundingClientRect(), B = y.getBoundingClientRect(); const x1 = A.left + A.width / 2 - R0.left, y1 = A.bottom - R0.top, x2 = B.left + B.width / 2 - R0.left, y2 = B.top - R0.top, my = (y1 + y2) / 2; const lit = x.classList.contains("got") && (y.classList.contains("got") || y.classList.contains("can")); out += '<path d="M' + x1 + " " + y1 + " C" + x1 + " " + my + "," + x2 + " " + my + "," + x2 + " " + y2 + '" class="' + (lit ? "lit" : "") + '"/>'; }));
      }
      svg.setAttribute("viewBox", "0 0 " + w.clientWidth + " " + w.clientHeight); svg.style.height = w.clientHeight + "px"; svg.innerHTML = out;
    }
    function click(e) {
      const b = e.target.closest("[data-k2sel],[data-k2tree],[data-k2learn],[data-k2eq],[data-k2respec],[data-k2modal],[data-k2kspick]"); if (!b) return false;
      if (b.hasAttribute("data-k2tree")) { UI.tree = b.getAttribute("data-k2tree"); UI.sel = null; }
      else if (b.hasAttribute("data-k2sel")) { const id = b.getAttribute("data-k2sel"); if (id && NODE[id]) { UI.sel = id; UI.tree = NODE[id].tree; } }
      else if (b.hasAttribute("data-k2eq")) equip(b.getAttribute("data-k2eq"), +b.getAttribute("data-k2slot2"));
      else if (b.hasAttribute("data-k2kspick")) { UI.modal = { kind: "ks", id: b.getAttribute("data-k2kspick") }; }
      else if (b.hasAttribute("data-k2learn")) { const id = b.getAttribute("data-k2learn"), n = NODE[id]; if (n.kind === "k") UI.modal = { kind: "ks", id }; else { const r = learn(id); if (r === "role") UI.modal = { kind: "role", id }; } }
      else if (b.hasAttribute("data-k2respec")) UI.modal = { kind: "respec" };
      else if (b.hasAttribute("data-k2modal")) {
        const m = UI.modal; UI.modal = null;
        if (m && b.getAttribute("data-k2modal") === "yes") {
          if (m.kind === "role") learn(m.id, true);
          else if (m.kind === "ks") { const r = learn(m.id); if (r === "role") learn(m.id, true); }
          else if (m.kind === "respec") { if (respec()) { UI.tree = "cmd"; UI.sel = null; env.toast("You begin again. The marks remember."); } }
        }
      }
      env.render(); setTimeout(lines, 0); setTimeout(lines, 200);
      return true;
    }

    // ---------- public ----------
    return {
      st, R, points, spent, legacyMap, fxStatic, meter, pay, sheet, click, lines, equipped, tickMap, battle, area, areaFx, makeVfx,
      role, why, learn, equip, respec, respecCost, mountHud, unmountHud, hudTick, toggleTray, layoutHud: layout, sealed, stageOf,
      areaCore: () => areaCore, setToast: (f) => { toastFn = f; }, setOnStage: (f) => { onStage = f; }, hudOpen: () => !!(hud && hud.open), hudMode: () => hud && hud.mode,
      ver: () => ver, bump: () => { ver++; }
    };
  }

  // ---------------------------------------------------------------- styles ----------------------------------------------------------------
  const CSS = [
    // the sheet
    ".k2s{position:relative;padding-bottom:.6rem}",
    ".k2top{display:flex;justify-content:space-between;align-items:flex-start;gap:.6rem}.k2top h2{margin:0}.k2top .sub{margin:.1rem 0 0;font-size:.82rem;line-height:1.35}",
    ".k2pts{min-width:3.6rem;text-align:center;border:1px solid #6a5028;border-radius:4px;padding:.25rem .4rem;background:linear-gradient(#1c150c,#0d0a06)}.k2pts b{display:block;font:500 1.6rem var(--serif2,Georgia);color:#e8cc84;line-height:1}.k2pts span{font:500 .5rem var(--mono,monospace);letter-spacing:.14em;text-transform:uppercase;color:#a89468}.k2pts.has{border-color:#e0bc6a;box-shadow:0 0 14px rgba(224,188,106,.45)}",
    ".k2load{display:grid;grid-template-columns:auto 1fr 1fr 1fr;gap:6px;align-items:center;margin:.6rem 0 .5rem}.k2load>span{font:500 .52rem var(--mono,monospace);letter-spacing:.12em;text-transform:uppercase;color:#8a7a54;max-width:4.6rem;line-height:1.3}",
    ".k2slot{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;padding:.35rem .2rem;border:1px solid #4a3a22;border-radius:6px;background:#100c07;color:#e8cc84;min-width:0;touch-action:manipulation}.k2slot i{display:grid;place-items:center;width:38px;height:38px;border-radius:50%;background:radial-gradient(circle at 40% 30%,var(--k2d),#0a0806 75%);box-shadow:0 0 0 2px #0a0806,0 0 0 3px var(--k2c)}.k2slot.empty i{background:#14100a;box-shadow:0 0 0 2px #0a0806,0 0 0 3px #3a2e1c}.k2slot b{font:500 .62rem var(--serif2,Georgia);letter-spacing:0;text-transform:none;text-align:center;line-height:1.1;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.k2slot em{position:absolute;top:3px;left:5px;font:600 .55rem var(--mono,monospace);font-style:normal;color:#8a7a54}",
    ".k2trees{display:grid;grid-template-columns:repeat(5,1fr);gap:5px;margin:.3rem 0 .6rem}",
    ".k2tr{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;padding:.4rem .1rem .3rem;border:1px solid #3a2e1c;border-radius:6px;background:#0e0b07;color:var(--k2c);min-width:0;touch-action:manipulation}.k2tr i{display:grid;place-items:center;width:40px;height:40px;border-radius:50%;background:radial-gradient(circle at 40% 30%,var(--k2dd),#080604 75%);box-shadow:0 0 0 2px #080604,0 0 0 3px var(--k2d)}.k2tr b{font:500 .58rem var(--serif2,Georgia);letter-spacing:0;text-transform:none;color:#d8c290;text-align:center;line-height:1.05;max-width:100%}.k2tr em{position:absolute;top:2px;right:3px;font:700 .44rem var(--mono,monospace);font-style:normal;letter-spacing:.06em;color:#120c06;background:var(--k2c);border-radius:2px;padding:0 3px}",
    ".k2tr.on{border-color:var(--k2c);background:linear-gradient(var(--k2t),#0e0b07);box-shadow:0 0 12px var(--k2g)}.k2tr.lock{opacity:.38;filter:grayscale(.8)}.k2tr.ready i{animation:k2pulse 2.2s ease-in-out infinite}",
    "@keyframes k2pulse{0%,100%{box-shadow:0 0 0 2px #080604,0 0 0 3px var(--k2c),0 0 4px var(--k2c)}50%{box-shadow:0 0 0 2px #080604,0 0 0 3px var(--k2c),0 0 16px var(--k2c)}}",
    ".k2th{display:flex;gap:.7rem;align-items:flex-start;padding:.55rem .6rem;border:1px solid var(--k2b);border-radius:6px;background:radial-gradient(120% 140% at 0% 0%,var(--k2g),transparent 60%),#0c0a07}.k2th b{display:block;font:500 1.15rem var(--serif2,Georgia);color:var(--k2c2)}.k2th span{font:500 .56rem var(--mono,monospace);letter-spacing:.12em;text-transform:uppercase;color:var(--k2l)}.k2th p{margin:.25rem 0 0;font-size:.86rem;line-height:1.35}",
    ".k2crest{flex:none;display:grid;place-items:center;width:58px;height:58px;border-radius:50%;color:var(--k2c2);background:radial-gradient(circle at 40% 30%,var(--k2d),#060402 78%);box-shadow:0 0 0 2px #060402,0 0 0 4px var(--k2c),0 0 18px var(--k2g)}.k2crest.big{width:92px;height:92px;margin:0 auto .4rem}",
    ".k2price2{color:#e0a080;font-style:italic}",
    ".k2pairs{display:flex;flex-wrap:wrap;gap:4px;margin:.35rem 0 .1rem}.k2pairs span{font:500 .6rem var(--mono,monospace);letter-spacing:.04em;padding:.18rem .4rem;border:1px dashed var(--k2d);border-radius:3px;color:#a89468}.k2pairs span b{color:var(--k2c)}.k2pairs span.on{border-style:solid;color:#f2e2b0;box-shadow:0 0 8px var(--k2g)}",
    ".k2tree{position:relative;margin:.5rem 0 .2rem;padding:4px 4px 6px;border:1px solid #3a2e1c;border-radius:6px;background:radial-gradient(110% 70% at 50% 0%,var(--k2g),transparent 65%),#0a0806;box-shadow:inset 0 0 24px #000}",
    ".k2lines{position:absolute;left:0;top:0;width:100%;pointer-events:none;z-index:0}.k2lines path{fill:none;stroke:#2e2416;stroke-width:2.5}.k2lines path.lit{stroke:var(--k2c);stroke-width:3;filter:drop-shadow(0 0 3px var(--k2c))}",
    ".k2tier{position:relative;z-index:1;padding:4px 0 8px;border-top:1px dashed rgba(120,96,56,.22)}.k2tier:first-child{border-top:0}.k2tier.lock .k2tl span{color:#6a5a3a}",
    ".k2tl{display:flex;justify-content:space-between;padding:0 4px 4px;font:500 .54rem var(--mono,monospace);letter-spacing:.12em;text-transform:uppercase;color:#8a7a54}.k2tl em{font-style:normal;letter-spacing:.04em;text-transform:none}",
    ".k2row{display:flex;justify-content:space-around;align-items:flex-start;gap:2px}.k2cell{display:flex;flex-direction:column;align-items:center;gap:3px;width:31%;min-width:0}.k2nn{font:500 .62rem var(--serif2,Georgia);color:#a89468;text-align:center;line-height:1.1}",
    ".k2n{position:relative;display:grid;place-items:center;width:60px;height:60px;padding:0;border:2px solid #3e3020;border-radius:10px;background:#120e09;color:#6a5a40;box-shadow:0 3px 6px #000,inset 0 0 10px rgba(0,0,0,.7);touch-action:manipulation;transition:transform .12s}.k2n:active{transform:scale(.94)}",
    ".k2n.k2a{border-radius:50%}.k2n.k2k{width:74px;height:74px;border-radius:14px;transform:rotate(45deg)}.k2n.k2k .k2gl{transform:rotate(-45deg)}.k2n.k2k:active{transform:rotate(45deg) scale(.94)}",
    ".k2n .k2r{position:absolute;bottom:-7px;left:50%;transform:translateX(-50%);font:600 .55rem var(--mono,monospace);padding:0 4px;border-radius:3px;background:#0a0806;border:1px solid #3e3020;color:#a89468}.k2n .k2tag{position:absolute;top:-7px;left:50%;transform:translateX(-50%);font:700 .4rem var(--mono,monospace);letter-spacing:.1em;padding:0 3px;border-radius:2px;background:var(--k2c);color:#100a04;opacity:.9}",
    ".k2n.can{color:var(--k2c);border-color:var(--k2d);animation:k2glow 2.2s ease-in-out infinite}.k2n.got{color:var(--k2c2);border-color:var(--k2c);background:radial-gradient(circle at 40% 30%,var(--k2d),#0c0906 75%);box-shadow:0 3px 6px #000,0 0 14px var(--k2g)}.k2n.got .k2r{color:var(--k2c2);border-color:var(--k2c)}.k2n.max{box-shadow:0 3px 6px #000,0 0 20px var(--k2c)}.k2n.lock{opacity:.55}",
    ".k2n.sel{outline:2px solid #f6e6b4;outline-offset:3px}.k2cell .k2n.got+.k2nn{color:var(--k2c2,#e8cc84)}",
    "@keyframes k2glow{0%,100%{box-shadow:0 3px 6px #000,0 0 0 transparent}50%{box-shadow:0 3px 6px #000,0 0 14px var(--k2g)}}",
    ".k2tier.ks .k2row{align-items:center}.k2tier.ks .k2cell{width:38%}.k2or{font:700 .62rem var(--mono,monospace);letter-spacing:.2em;color:#8a7a54;align-self:center}",
    ".k2d{position:sticky;bottom:-1px;z-index:6;margin-top:.5rem;padding:.5rem .65rem;max-height:40vh;overflow:auto;border:1px solid var(--k2b);border-radius:6px;background:linear-gradient(#1c150d,#0e0b07);box-shadow:0 -8px 16px rgba(0,0,0,.75)}",
    ".k2dh{display:flex;gap:.6rem;align-items:center}.k2dg{display:grid;place-items:center;flex:none;width:46px;height:46px;border-radius:50%;background:radial-gradient(circle at 40% 30%,var(--k2d),#0a0806 75%);box-shadow:0 0 0 2px #0a0806,0 0 0 3px var(--k2c)}.k2dh b{display:block;font:500 1.05rem var(--serif2,Georgia);color:#f0dca0}.k2dk{font:500 .55rem var(--mono,monospace);letter-spacing:.1em;text-transform:uppercase;color:#a89468}",
    ".k2line{margin:.4rem 0 .25rem;font-size:.92rem;line-height:1.35}.k2meta{margin:0 0 .3rem;font:500 .66rem var(--mono,monospace);color:#c8b480}.k2meta b{color:#8a7a54;font-weight:500;letter-spacing:.08em;text-transform:uppercase;font-size:.55rem}",
    ".k2wc{border-left:2px solid var(--k2c);padding:.2rem .5rem;margin:.2rem 0 .35rem;background:rgba(0,0,0,.25)}.k2wch{font:500 .52rem var(--mono,monospace);letter-spacing:.12em;text-transform:uppercase;color:#8a7a54;margin-bottom:.15rem}.k2wc ul{margin:0;padding-left:1rem}.k2wc li{font-size:.84rem;line-height:1.35;color:#d8c8a0}.k2wc li.up{color:#bfe8a0}.k2wc li s{display:block;color:#6a6048;font-size:.72rem}",
    ".k2warn{margin:.3rem 0;padding:.35rem .5rem;border:1px solid #8a5a2a;border-radius:4px;background:rgba(120,60,20,.15);font-size:.82rem;line-height:1.35}",
    ".k2db{display:flex;justify-content:space-between;align-items:center;gap:.5rem;flex-wrap:wrap}.k2why{font-size:.78rem;color:#a08a60;flex:1;min-width:8rem}.k2db>span:last-child{display:flex;gap:.4rem;align-items:center}",
    ".k2eq{display:flex;gap:3px}.k2eq button{width:44px;height:44px;padding:0;border:1px solid #5a4424;border-radius:50%;background:#14100a;color:#c8b480;font:600 .75rem var(--mono,monospace)}.k2eq button.on{background:var(--k2c);color:#100a04;border-color:var(--k2c)}",
    ".k2learn{min-width:6.2rem;min-height:2.6rem}",
    ".k2sec{margin:.9rem 0 .35rem;font:500 .6rem var(--mono,monospace);letter-spacing:.16em;text-transform:uppercase;color:#c8a050}",
    ".k2pm{margin:.3rem 0;padding:.45rem .55rem;border:1px solid #3a2e1c;border-left:3px solid var(--k2c);border-radius:4px;background:#0c0a07}.k2pmh{display:flex;gap:.4rem;align-items:baseline;flex-wrap:wrap}.k2pmh b{font:500 .95rem var(--serif2,Georgia);color:var(--k2c)}.k2pmh span{font:500 .55rem var(--mono,monospace);letter-spacing:.08em;color:#8a7a54;text-transform:uppercase}.k2pmh em{margin-left:auto;font:500 .62rem var(--mono,monospace);font-style:normal;color:#d8c290}.k2pm p{margin:.3rem 0 0;font-size:.8rem;line-height:1.35}",
    "@media (min-width:700px){#sheet.sk #sbody{max-width:min(64rem,97vw)}.k2s{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:14px;align-items:start}.k2R{position:sticky;top:0;max-height:calc(92vh - 3rem);overflow:auto;padding-bottom:.4rem}.k2R .k2d{position:static;max-height:none;margin-top:.2rem;box-shadow:none}.k2top{grid-column:auto}}",
    "@media (orientation:landscape) and (max-height:520px){.k2top h2{font-size:1.25rem}.k2th p{font-size:.8rem}.k2th{padding:.4rem .5rem}.k2crest{width:46px;height:46px}.k2trees{grid-template-columns:repeat(9,1fr)}.k2tr b{font-size:.5rem}.k2tr i{width:34px;height:34px}.k2load{margin:.35rem 0}.k2tier{padding:2px 0 6px}.k2R{max-height:calc(94vh - 2.5rem)}}",
    ".k2re{display:flex;gap:.6rem;align-items:center}.k2re p{flex:1;margin:0;font-size:.82rem;line-height:1.35}",
    ".k2modal{position:fixed;inset:0;z-index:200;display:grid;place-items:center;padding:16px;background:rgba(4,3,2,.82);backdrop-filter:blur(2px)}.k2mb{max-width:26rem;width:100%;padding:1rem;border:1px solid var(--k2c,#8a6a30);border-radius:8px;background:radial-gradient(120% 80% at 50% 0%,var(--k2g,rgba(200,135,58,.35)),transparent 60%),#100c07;box-shadow:0 20px 60px #000,0 0 30px var(--k2g,rgba(200,135,58,.35));text-align:center;animation:k2in .25s ease-out}.k2mb.wide{max-width:40rem}.k2mb h3{margin:.2rem 0 .4rem;font:500 1.35rem var(--serif2,Georgia);color:var(--k2c2,#f0dca0)}.k2mb p{font-size:.9rem;line-height:1.4}",
    "@keyframes k2in{from{transform:scale(.92);opacity:0}to{transform:none;opacity:1}}",
    ".k2mbtn{display:flex;gap:.5rem;justify-content:center;margin-top:.6rem}.k2mbtn button{min-height:2.8rem;min-width:7rem}",
    ".k2ksb,.k2ksb *{text-transform:none!important;letter-spacing:0!important}.k2ksb p,.k2ksb li{font-family:var(--serif,Georgia),serif!important}",
    ".k2ksc{display:flex;gap:.5rem;align-items:stretch}.k2ksc .k2or{align-self:center}@media(max-width:560px){.k2ksc{flex-direction:column}}",
    ".k2ksb{flex:1;display:flex;flex-direction:column;align-items:center;gap:.25rem;padding:.6rem;border:1px solid #4a3a22;border-radius:8px;background:#0c0906;color:#d8c8a0;text-align:left;touch-action:manipulation}.k2ksb i{display:grid;place-items:center;width:64px;height:64px;border-radius:14px;transform:rotate(45deg);background:radial-gradient(circle at 40% 30%,var(--k2d),#060402 75%);box-shadow:0 0 0 2px #060402,0 0 0 3px var(--k2c);color:var(--k2c2);margin:.4rem 0}.k2ksb i svg{transform:rotate(-45deg)}.k2ksb b{font:500 1rem var(--serif2,Georgia);color:var(--k2c2)}.k2ksb p{margin:0;font-size:.82rem;text-align:center}.k2ksb ul{margin:.2rem 0 0;padding-left:1rem;font-size:.76rem;line-height:1.35;align-self:stretch}.k2ksb.on{border-color:var(--k2c);box-shadow:0 0 18px var(--k2g);background:linear-gradient(var(--k2t),#0c0906)}",
    // bars (sheet + HUD)
    ".k2bar{position:relative;height:7px;border-radius:4px;background:#1a140c;box-shadow:inset 0 1px 2px #000;overflow:hidden}.k2bar.big{height:11px;margin-top:.3rem}.k2bar i{position:absolute;left:0;top:0;bottom:0}.k2bar .v{background:linear-gradient(90deg,var(--k2d),var(--k2c));transition:width .25s}.k2bar .fl{background:repeating-linear-gradient(45deg,#5a2a1a 0 3px,#2a140c 3px 6px);z-index:1;opacity:.9}.k2bar .v{z-index:0}.k2bar .cap{width:2px;background:#e8e0c8;z-index:2}.k2bar u{position:absolute;top:0;bottom:0;width:1px;background:rgba(0,0,0,.7);z-index:3}",
    // HUD + tray
    ".k2hud{position:absolute;inset:0;pointer-events:none;z-index:30}.k2hud button{pointer-events:auto}",
    ".k2price{position:absolute;display:flex;flex-direction:column;gap:4px;align-items:flex-end;pointer-events:none}",
    ".k2m{width:9.6rem;padding:3px 6px 4px;border-radius:5px;background:rgba(8,6,4,.72);border:1px solid var(--k2d)}.k2m span{display:flex;justify-content:space-between;gap:.3rem;font:500 .5rem 'IBM Plex Mono',monospace;letter-spacing:.06em;text-transform:uppercase;color:#d8c8a0;margin-bottom:2px}.k2m span b{color:var(--k2c);font-weight:600}",
    ".k2m.s1 .v{background:linear-gradient(90deg,var(--k2c),#e8a040)}.k2m.s2{border-color:#c0402a;animation:k2warn 1.2s ease-in-out infinite}.k2m.s2 .v,.k2m.s3 .v{background:linear-gradient(90deg,var(--k2c),#d8402a)}.k2m.seal{border-color:#ff5a3a}.k2m.seal span{color:#ff9a7a}",
    "@keyframes k2warn{50%{box-shadow:0 0 12px rgba(220,70,40,.6)}}",
    ".k2ab{position:absolute;display:grid;place-items:center;border-radius:50%;padding:0;border:2px solid var(--k2c);background:radial-gradient(circle at 40% 30%,var(--k2d),#0a0806 76%);box-shadow:0 0 0 2px #0a0806,0 4px 12px #000a;opacity:0;transform:scale(.4);transition:opacity .18s,transform .22s cubic-bezier(.3,1.6,.6,1);pointer-events:none!important;touch-action:none}",
    ".k2ab.on{opacity:1;transform:none;pointer-events:auto!important}.k2ab.empty{border-color:#3a2e1c;background:#0e0b07}.k2ab.ready{box-shadow:0 0 0 2px #0a0806,0 4px 12px #000a,0 0 14px var(--k2g)}.k2ab.sealed{filter:grayscale(1) brightness(.5)}.k2ab:active{transform:scale(.9)}",
    ".k2ab .k2ic{display:grid;place-items:center;position:relative;z-index:1}.k2ab .k2cd{position:absolute;inset:0;border-radius:50%;z-index:2}.k2ab .k2key{position:absolute;top:-4px;left:-4px;z-index:3;font:600 .55rem 'IBM Plex Mono',monospace;color:#e8d8b0;background:#0a0806;border:1px solid #5a4424;border-radius:50%;width:1rem;height:1rem;line-height:.95rem;text-align:center}.k2ab .k2cost{position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);z-index:3;font:600 .5rem 'IBM Plex Mono',monospace;font-style:normal;color:#ffd8b0;background:#2a0e06;border:1px solid #8a3a1a;border-radius:3px;padding:0 3px;white-space:nowrap}.k2ab .k2cost:empty{display:none}",
    ".k2ledger{position:absolute;width:64px;min-height:44px;padding:.25rem 0;border-radius:4px;border:1px solid #8a7ad0;background:#140c2a;color:#e8dcff;font:600 .55rem 'IBM Plex Mono',monospace;letter-spacing:.08em;text-transform:uppercase;opacity:0;pointer-events:none!important;transition:opacity .18s}.k2ledger.on{opacity:.95;pointer-events:auto!important}",
    ".k2open{filter:brightness(1.25) saturate(1.2)}",
    ".k2flash{position:absolute;inset:0;pointer-events:none;opacity:0;z-index:25;mix-blend-mode:screen}",
    "#vh3d .b3-btns [data-b=cast]{grid-column:1;grid-row:1;width:3.9rem;height:3.9rem;background:radial-gradient(circle at 40% 30%,#6a4fd8,#1a1040 70%);border-color:#a99ce8;font-size:.62rem}",
    "@media (max-width:600px){#vh3d .b3-ordbtn.k2left{left:.8rem;transform:none;bottom:calc(7.4rem + env(safe-area-inset-bottom,0px))}}",
    "#askill,#asksw{display:none!important}"
  ].join("\n");
})();

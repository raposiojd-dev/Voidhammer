// Voidhammer: The Ember March. Fighter levels, the fallen, the story chapters and side work.
"use strict";

// ---------- levels ----------
// Experience comes from fights won (one each, and one more per kill) and from drill.
D.LEVEL_XP = [0, 2, 5, 9, 14, 20, 27];
G.lvl = function (u) { let l = 1; for (let i = 1; i < D.LEVEL_XP.length; i++) if ((u.xp || 0) >= D.LEVEL_XP[i]) l = i + 1; return l; };
G.has = (u, k) => !!(u.skills && u.skills[k]);
G.maxHp = u => D.UNITS[u.type].hp + (G.lvl(u) - 1) * 2 + (G.has(u, "tough") ? 4 : 0);
G.atkBonus = u => Math.floor((G.lvl(u) - 1) / 2) + (G.has(u, "hard") ? 1 : 0);

// ---------- skills: one point for every level after the first ----------
D.SKILLS = {
  tough:    { name: "Hard to kill",  who: "all",    text: "4 more health." },
  hard:     { name: "Heavy hand",    who: "all",    text: "Every hit lands 1 harder." },
  finisher: { name: "Finisher",      who: "all",    text: "2 harder against anyone under half health." },
  stubborn: { name: "Stubborn",      who: "all",    text: "Once a fight, a blow that would put them down leaves them standing on 1 health." },
  fleet:    { name: "Fleet",         who: "all",    text: "Moves one cell further each turn." },
  wall:     { name: "Shield wall",   who: "melee",  text: "Takes 1 less from every hit." },
  flanker:  { name: "Flanker",       who: "melee",  text: "2 harder, not 1, when a friend stands beside the target." },
  mate:     { name: "Shield-mate",   who: "melee",  text: "Whoever stands beside them takes 1 less." },
  marksman: { name: "Marksman",      who: "ranged", text: "2 harder when no enemy stands next to them." },
  longarm:  { name: "Long arm",      who: "ranged", text: "Reaches one cell further." }
};
G.skillPool = function (u) { const d = D.UNITS[u.type], role = d.rng > 1 ? "ranged" : "melee"; return Object.keys(D.SKILLS).filter(k => (D.SKILLS[k].who === "all" || D.SKILLS[k].who === role) && !(k === "mate" && d.guard)); };
G.skillPts = u => G.lvl(u) - 1 - Object.keys(u.skills || {}).length;
G.learn = function (u, k) { if (G.skillPts(u) < 1 || G.has(u, k) || G.skillPool(u).indexOf(k) < 0) return false; if (!u.skills) u.skills = {}; u.skills[k] = 1; if (k === "tough" && !u.down) u.hp = Math.min(G.maxHp(u), u.hp + 4); return true; };
G.pointsWaiting = () => G.s.units.reduce((n, u) => n + Math.max(0, G.skillPts(u)), 0);
G.toNext = function (u) { const l = G.lvl(u); return l >= D.LEVEL_XP.length ? 0 : D.LEVEL_XP[l] - (u.xp || 0); };
G.ready = () => G.s.units.filter(u => !(u.wounded > 0) && !u.down);
// a day on the practice ground: it teaches as far as level 3 and no further
G.drill = function () { const up = []; G.ready().forEach(u => { if (u.type === "hero" || G.lvl(u) >= 3) return; const b = G.lvl(u); u.xp = (u.xp || 0) + 1; if (G.lvl(u) > b) { up.push(G.uName(u)); u.hp = G.maxHp(u); } }); return up; };
G.canDrill = () => G.ready().some(u => u.type !== "hero" && G.lvl(u) < 3);

// ---------- the fallen ----------
// A fighter who loses all their health goes down and stays down until somebody gets them up again.
G.fallen = () => G.s.units.filter(u => u.down);
G.reviveCost = u => D.UNITS[u.type].comp ? 12 : 5 + 3 * (D.UNITS[u.type].tier || 1);
G.revive = function (u) { u.down = 0; u.wounded = 0; u.hp = Math.ceil(G.maxHp(u) / 2); };

// ---------- the story ----------
D.STORY = [
  { title: "A hall on the border", art: "bg_hold",
    steps: [{ t: s => "Raise a watchfire at " + s.holdName, ok: s => s.b.fire >= 1 }, { t: () => "Go to Ashford, west of your hold", ok: s => !!s.visited.ashford }],
    done: s => "The watchfire catches on the second night and the whole hold comes out to look at it. Garreth counts heads by its light.\n\n\"That's a hold,\" he says. \"Now go and find out who is burning the carters out.\"",
    reward: { crowns: 20 }, rewardLine: "The Hearth Court sends 20 crowns and no letter." },
  { title: "Tents on the March", art: "s_camp",
    intro: () => "Ashford has lost three carts this month. The reeve points south-east, past your own hall, at a smudge of cookfire smoke that has no business being there.",
    steps: [{ t: () => "Break the raider camp south-east of your hold", ok: s => !!s.done.camp1 }],
    done: () => "Under the camp's cookpot is a purse of silver. Every coin is blank: no hearth-mark, no Realm's stamp, no face.\n\nGarreth turns one over twice. \"Nobody strikes a coin with nothing on it. Somebody at Smeltgate will know whose metal that is.\"" },
  { title: "Silver with no face", art: "s_forge",
    intro: () => "Smeltgate is two days west, on the far side of the lava. The assayers there can tell you where a nail was made by the sound it makes when you drop it.",
    steps: [{ t: () => "Show the blank silver to the assayers at Smeltgate", ok: s => !!s.flags.assay }, { t: () => "Ask about it at Hearthward keep", ok: s => !!s.flags.tally }],
    done: () => "You have a direction now, and it is north.",
    reward: { favour: 1 }, rewardLine: "Word of what you found reaches the Hearth Court before you do." },
  { title: "Wagons with no lamps", art: "s_keep",
    intro: () => "Wagons cross the March by night, north of Hearthward, with their lamps out. They do not stop at the keep. The castellan asks one more thing before you go: a beacon on his wall, for the day the grey gets this far.",
    steps: [{ t: () => "Break the raider camp north of Hearthward", ok: s => !!s.done.camp2 }, { t: () => "Light a beacon at Hearthward", ok: s => !!s.beacons.hearthward || !!s.quiet.hearthward }],
    done: () => "In the second camp there is a map with your hold drawn on it and a line through it. There is a third camp marked too, bigger than both, away to the south-west. Beside it somebody has written a name in a careful hand: the Coin-Captain.",
    fx: s => { s.flags.seen3 = 1; } },
  { title: "The Coin-Captain", art: "r_captain",
    intro: () => "He pays in silver nobody will own to, and he has more men than the other two camps together. Go when the warband is ready and not before.",
    steps: [{ t: () => "Break the Coin-Captain's camp, south-west past Ashford", ok: s => !!s.done.camp3 }] }
];
G.chapter = () => D.STORY[Math.min(D.STORY.length, G.s.ch || 1) - 1];
// returns the story cards that have just been earned, in order
G.storyCheck = function () {
  const s = G.s, out = []; if (!s.ch) s.ch = 1; if (s.over) return out;
  let guard = 0;
  while (s.ch < D.STORY.length && guard++ < 6) {
    const c = D.STORY[s.ch - 1]; if (!c.steps.every(st => st.ok(s))) break;
    if (c.reward) G.gain(c.reward); if (c.fx) c.fx(s);
    const doneText = c.done(s) + (c.rewardLine ? "\n\n" + c.rewardLine : "");
    out.push({ art: c.art, title: c.title, text: () => doneText, opts: [{ t: "Go on" }] });
    s.ch++; const n = D.STORY[s.ch - 1], num = s.ch;
    out.push({ art: n.art, title: "Chapter " + num + ": " + n.title, text: () => n.intro(s), opts: [{ t: "Go on" }] });
  }
  return out;
};
// story beats that happen when you walk into a place
G.storyArrive = function (st) {
  const s = G.s; if ((s.ch || 1) !== 3) return null;
  if (st.id === "smeltgate" && !s.flags.assay) { s.flags.assay = 1; return { art: "s_forge", title: "The assay bench", text: () => "The assayer bites the coin, weighs it, and frowns at the scale.\n\n\"Good silver. Struck this year. But it isn't ours and it isn't Steelgate's, and I know every die on both sides of this border.\" She pushes it back across the bench. \"Hearthward keeps both tallies. Ask them who has been paying in it.\"", opts: [{ t: "Go on" }] }; }
  if (st.id === "hearthward" && s.flags.assay && !s.flags.tally) { s.flags.tally = 1; return { art: "s_keep", title: "Two ledgers", text: () => "The keep's tally-master has two ledgers open, one in each Realm's hand.\n\n\"Nobody pays us in that. But wagons have been crossing by night, north of here, with their lamps out. They don't stop at the keep.\" He marks the place on your map.", opts: [{ t: "Go on" }] }; }
  return null;
};

// ---------- side work ----------
// at: where it is offered. to: where it is handed in (the same place unless said).
D.QUESTS = [
  { id: "barley", at: "ashford", to: "hearthward", title: "Barley for the keep",
    ask: "The reeve has barley for Hearthward and nobody willing to walk it down the March road. \"Twenty measures. They pay on the nail.\"",
    goal: s => "Carry 20 food to Hearthward. You have " + s.res.food + ".", ready: s => s.res.food >= 20, cost: { food: 20 }, reward: { crowns: 45, favour: 1 },
    thanks: "The quartermaster counts the sacks twice and pays in full." },
  { id: "road", at: "ashford", title: "Three for the road", need: s => s.comp.tavish && s.comp.tavish.with,
    ask: "Tavish has been counting. \"Beat them three times, on the road or in their tents, and the carters come back. I'll keep the tally.\"",
    goal: (s, q) => "Beat the raiders three times. " + Math.min(3, s.n.wins - q.b.wins) + " of 3.", ready: (s, q) => s.n.wins - q.b.wins >= 3, reward: { crowns: 50 },
    fx: () => G.approve("tavish", 2), thanks: "The first cart through Ashford in a month stops to pay you. Tavish cuts a third notch in the barn door." },
  { id: "serpent", at: "smeltgate", title: "The cold vein",
    ask: "The western vein has gone cold since a magma serpent coiled up on it. The smiths will pay anyone who shifts the thing.",
    goal: () => "Kill the serpent at the vent north-west of Smeltgate.", ready: s => !!s.done.lair1, reward: { iron: 10, crowns: 30 },
    thanks: "By evening the vein is running again and every hammer in Smeltgate is going." },
  { id: "coal", at: "slagford", title: "Coal for Slagford",
    ask: "Slagford's own pit has flooded. \"Fourteen loads would keep the big hammers going until it's pumped out.\"",
    goal: s => "Bring 14 coal to Slagford. You have " + s.res.coal + ".", ready: s => s.res.coal >= 14, cost: { coal: 14 }, reward: { crowns: 40, iron: 4 },
    thanks: "They pay in crowns and throw in the iron, because you didn't haggle." },
  { id: "vent", at: "slagford", title: "The southern vent", need: s => s.qs.coal && s.qs.coal.st === "done",
    ask: "\"There's another serpent, on the vent south of your own hold. Richer iron than ours, if anyone could get at it.\"",
    goal: () => "Kill the serpent at the vent south of your hold.", ready: s => !!s.done.lair2, reward: { iron: 12, crowns: 40 },
    thanks: "Slagford sends a cart for the iron and pays for the privilege." },
  { id: "fires", at: "hearthward", title: "Fires along the March",
    ask: "The castellan wants firelight along the border before the grey comes any closer. \"Two beacons, anywhere folk live. I'll send you a cinderblade who knows the road.\"",
    goal: s => "Light beacons at two places. " + Math.min(2, Object.keys(s.beacons).length) + " of 2.", ready: s => Object.keys(s.beacons).length >= 2, reward: { favour: 1 },
    fx: s => { if (s.units.length < G.cap()) { const u = G.addUnit("shieldaxe"); return G.uName(u) + ", a cinderblade from the keep, joins the warband."; } G.gain({ crowns: 35 }); return "You have no bunk for the cinderblade, so the castellan pays 35 crowns instead."; },
    thanks: "From the wall you can see both fires." },
  { id: "roll", at: "hearthmount", title: "The roll of the March",
    ask: "A clerk of the Hearth Court is making up the roll of the March and has never left the caldera. \"Go and look at Ashford, Smeltgate, Slagford and Hearthward for me. Tell me they are still there.\"",
    goal: s => "Visit Ashford, Smeltgate, Slagford and Hearthward. " + ["ashford", "smeltgate", "slagford", "hearthward"].filter(k => s.visited[k]).length + " of 4.",
    ready: s => ["ashford", "smeltgate", "slagford", "hearthward"].every(k => s.visited[k]), reward: { favour: 2, crowns: 40 },
    thanks: "The clerk writes each name down slowly, as if it might not hold." },
  { id: "third", at: "hearthmount", title: "Fighters, not levies",
    ask: "The Court's marshal has watched too many border levies run. \"Show me three of yours at the third level and I'll open the armoury.\"",
    goal: s => "Have three fighters at level 3 or better. " + Math.min(3, s.units.filter(u => u.type !== "hero" && G.lvl(u) >= 3).length) + " of 3.",
    ready: s => s.units.filter(u => u.type !== "hero" && G.lvl(u) >= 3).length >= 3, reward: { iron: 8, crowns: 30 },
    thanks: "The marshal walks down the line, says nothing, and has the iron brought out." },
  { id: "wall", at: "hold", title: "A hold worth the name", need: s => s.comp.cadoc && s.comp.cadoc.with,
    ask: "\"A wall and a second field,\" Garreth says. \"Then I'll stop counting sacks in my sleep.\"",
    goal: s => "Build a palisade and raise the emberseed plot to level 2.", ready: s => s.b.wall >= 1 && s.b.field >= 2, reward: { food: 30 },
    fx: () => G.approve("cadoc", 1), thanks: "The first full harvest comes in behind a wall. Garreth sleeps through the night." },
  { id: "banked", at: "bellows", title: "Banked fire", need: s => s.comp.dilys && s.comp.dilys.with,
    ask: "Madda holds up her crazed hands. \"Win two fights with yours in your pockets. No fire at all. Then I'll show you how to bank it.\"",
    goal: (s, q) => "Win two fights without casting. " + Math.min(2, s.n.clean - q.b.clean) + " of 2.", ready: (s, q) => s.n.clean - q.b.clean >= 2,
    fx: s => { s.flags.banked = 1; return "Every spell now costs 1 less self-control."; },
    thanks: "She shows you how to hold the fire low and let it out a little at a time. It still costs. It costs less." }
];
G.quest = id => D.QUESTS.find(q => q.id === id);
G.qInit = function () { const s = G.s; if (!s.qs) s.qs = {}; if (!s.n) s.n = { wins: 0, clean: 0 }; if (!s.ch) s.ch = 1; };
G.qOffered = site => D.QUESTS.filter(q => q.at === site && !G.s.qs[q.id] && (!q.need || q.need(G.s)));
G.qHere = site => D.QUESTS.filter(q => (q.to || q.at) === site && G.s.qs[q.id] && G.s.qs[q.id].st === "on");
G.qOpen = () => D.QUESTS.filter(q => G.s.qs[q.id] && G.s.qs[q.id].st === "on");
G.qTake = function (id) { const s = G.s; if (s.qs[id]) return; s.qs[id] = { st: "on", b: { wins: s.n.wins, clean: s.n.clean } }; };
G.qReady = function (q) { return q.ready(G.s, G.s.qs[q.id]) && G.can(q.cost); };
// hand a job in: returns the line to show, or null if it can't be done
G.qFinish = function (id) {
  const s = G.s, q = G.quest(id), st = s.qs[id]; if (!st || st.st !== "on" || !G.qReady(q) || !G.pay(q.cost)) return null;
  G.gain(q.reward); st.st = "done"; const extra = q.fx ? q.fx(s) : null;
  const got = RES.filter(k => q.reward && q.reward[k]).map(k => "+" + q.reward[k] + " " + k).join(", ");
  return q.thanks + (got ? "\n\n" + got + "." : "") + (q.reward && q.reward.favour ? "\n\nThe Hearth Court hears of it." : "") + (typeof extra === "string" ? "\n\n" + extra : "");
};

// ---------- screens ----------
UI.storyPush = function () { G.qInit(); G.storyCheck().forEach(e => UI.queue.push(e)); };
UI.questRows = function (site) {
  G.qInit(); const s = G.s, offer = G.qOffered(site), here = G.qHere(site), board = UI.boardRows(site); if (!offer.length && !here.length) return board;
  const row = (q, sub, btn) => '<div class="row job"><div class="t"><h3>' + esc(q.title) + '</h3><p>' + esc(sub) + '</p></div>' + btn + '</div>';
  return '<p class="sec">Work</p><div class="rows">' +
    here.map(q => row(q, G.qReady(q) ? "Done. Hand it in." : q.goal(s, s.qs[q.id]), '<button data-qdone="' + q.id + '"' + (G.qReady(q) ? ' class="go"' : " disabled") + '>Hand in</button>')).join("") +
    offer.map(q => row(q, q.ask, '<button data-qtake="' + q.id + '">Take it on</button>')).join("") + '</div>' + board;
};
UI.healRows = function (site) {
  const f = G.fallen(); if (!f.length) return "";
  return '<p class="sec">Healer</p><div class="rows">' + f.map(u => { const c = G.reviveCost(u), ok = G.can({ crowns: c });
    return '<div class="row"><img src="' + src(G.uArt(u)) + '" alt=""><div class="t"><h3>' + esc(G.uName(u)) + '</h3><p>' + (ok ? "Down. The healer can have them walking by morning." : "You are " + G.short({ crowns: c }).join("") + " short.") + '</p></div><button data-heal="' + u.id + '"' + (ok ? "" : " disabled") + '>' + c + ' crowns</button></div>'; }).join("") + '</div>';
};
UI.wireWork = function (redo) {
  const sc = $("screen"), s = G.s; UI.wireBoard(redo);
  sc.querySelectorAll("[data-qtake]").forEach(b => b.onclick = () => { G.qTake(b.dataset.qtake); const q = G.quest(b.dataset.qtake); UI.toast("Taken on: " + q.title + "."); G.save(); redo(); });
  sc.querySelectorAll("[data-qdone]").forEach(b => b.onclick = () => { const q = G.quest(b.dataset.qdone), line = G.qFinish(q.id); if (!line) return redo(); G.save(); redo(); UI.modal({ title: q.title, text: line, opts: [{ t: "Good", fn: () => {} }] }); });
  sc.querySelectorAll("[data-heal]").forEach(b => b.onclick = () => { const u = s.units.find(x => x.id === +b.dataset.heal); if (!u || !u.down || !G.pay({ crowns: G.reviveCost(u) })) return redo(); G.revive(u); UI.toast(G.uName(u) + " is back on their feet."); G.save(); redo(); });
};
UI.goalHtml = function () {
  G.qInit(); const s = G.s, c = G.chapter();
  return "<b>Chapter " + Math.min(s.ch, D.STORY.length) + ": " + esc(c.title) + "</b>" + c.steps.map(st => '<br><span class="' + (st.ok(s) ? "ok" : "todo") + '">' + esc(st.t(s)) + "</span>").join("");
};
UI.journal = function () {
  G.qInit(); const s = G.s, c = G.chapter(), open = G.qOpen(), done = D.QUESTS.filter(q => s.qs[q.id] && s.qs[q.id].st === "done");
  const where = q => { const st = G.site(q.to || q.at); return G.siteName(st); };
  const hauls = Object.keys(s.board || {}).filter(k => s.board[k] && s.board[k].taken).map(k => { const j = s.board[k]; return '<div class="row job"><div class="t"><h3>A load for ' + G.site(j.to).name + '</h3><p>Carry ' + j.n + " " + j.res + " to " + G.site(j.to).name + " for " + j.pay + ' crowns.</p></div></div>'; }).join("");
  const left = '<p class="sec">Chapter ' + Math.min(s.ch, D.STORY.length) + " of " + D.STORY.length + '</p><h3 class="jt">' + esc(c.title) + '</h3><div class="steps">' + c.steps.map(st => '<p class="' + (st.ok(s) ? "ok" : "todo") + '">' + esc(st.t(s)) + '</p>').join("") + '</div>' +
    '<p class="lede"><em>Camps broken: ' + G.campsDone() + " of 3." + (s.grey.length ? " The grey edge is moving west." : "") + '</em></p>';
  const right = '<p class="sec">Work taken on</p>' + (open.length || hauls ? '<div class="rows">' + open.map(q => '<div class="row job"><div class="t"><h3>' + esc(q.title) + '</h3><p>' + esc(G.qReady(q) ? "Done. Hand it in at " + where(q) + "." : q.goal(s, s.qs[q.id])) + '</p></div></div>').join("") + hauls + '</div>' : '<p class="lede"><em>Nothing yet. Ask in the towns, and at your own hall.</em></p>') +
    (done.length ? '<p class="sec">Finished</p><p class="lede">' + done.map(q => esc(q.title)).join(", ") + '.</p>' : "");
  UI.screen("bg_camp", '<h2>Journal</h2>', '<div class="cols"><div class="col">' + left + '</div><div class="col">' + right + '</div></div>');
};

// ---------- one fighter: what they are, and what you teach them ----------
UI.soldier = function (id) {
  const s = G.s, u = s.units.find(x => x.id === id); if (!u) return UI.warband();
  const d = D.UNITS[u.type], c = D.COMPANIONS[u.type], lv = G.lvl(u), nx = G.toNext(u), pts = G.skillPts(u), atk = d.atk + G.atkBonus(u);
  const kind = u.type === "hero" ? "Emberforged" : c ? c.role : d.name;
  const stat = (t, v) => '<div class="lg"><span>' + t + '</span><b>' + v + '</b></div>';
  const left = '<div class="who2"><img src="' + src(G.uArt(u)) + '" alt=""><div><h3 class="jt">' + esc(G.uName(u)) + '</h3><p class="lede">' + esc(kind) + ", level " + lv + '</p></div></div>' +
    '<div class="xpb"><b style="width:' + (nx ? Math.round(100 * (u.xp - D.LEVEL_XP[lv - 1]) / (D.LEVEL_XP[lv] - D.LEVEL_XP[lv - 1])) : 100) + '%"></b></div><p class="lede">' + (nx ? nx + " more experience to level " + (lv + 1) + ". Fights won, kills, drill and hauling jobs all count." : "As good as they get.") + '</p>' +
    stat("Health", (u.down ? 0 : u.hp) + " of " + G.maxHp(u)) + stat("Hits for", atk + " to " + (atk + 2)) + stat("Moves", d.mv + (G.has(u, "fleet") ? 1 : 0)) + stat("Reach", d.rng + (G.has(u, "longarm") ? 1 : 0)) + stat("Armour", d.def + (G.has(u, "wall") ? 1 : 0)) +
    (u.down ? '<p class="lede"><em>Down. A night at your own hearth or a town healer gets them up.</em></p>' : "");
  const right = '<p class="sec">Skills' + (pts > 0 ? ": " + pts + (pts === 1 ? " point" : " points") + " to spend" : "") + '</p><div class="rows">' + G.skillPool(u).map(k => { const sk = D.SKILLS[k], got = G.has(u, k);
    return '<div class="row job' + (got ? " got" : "") + '"><div class="t"><h3>' + sk.name + '</h3><p>' + sk.text + '</p></div>' + (got ? '<span class="tick">Learnt</span>' : '<button data-sk="' + k + '"' + (pts > 0 ? ' class="go"' : " disabled") + '>Teach</button>') + '</div>'; }).join("") + '</div>' +
    (pts < 1 && lv < D.LEVEL_XP.length ? '<p class="lede"><em>The next point comes at level ' + (lv + 1) + '.</em></p>' : "");
  UI.screen("bg_camp", '<h2>' + esc(G.uName(u)) + '</h2><button class="quiet" id="so-back">Warband</button>', '<div class="cols"><div class="col">' + left + '</div><div class="col">' + right + '</div></div>');
  $("so-back").onclick = UI.warband;
  $("screen").querySelectorAll("[data-sk]").forEach(b => b.onclick = () => { if (G.learn(u, b.dataset.sk)) { UI.toast(G.uName(u) + " learns " + D.SKILLS[b.dataset.sk].name + "."); G.save(); } UI.soldier(id); });
};

// ---------- the notice board: work that never runs out ----------
D.HAUL = { food: { n: [12, 16, 20], each: 1.3, word: "food" }, coal: { n: [8, 10, 12], each: 2, word: "coal" }, iron: { n: [3, 4, 5], each: 6, word: "iron" } };
D.BOARD_TOWNS = ["ashford", "smeltgate", "slagford", "hearthward", "hearthmount"];
G.board = function (site) { // one job on each town's board; a stale offer is replaced after six days
  const s = G.s; if (!s.board) s.board = {}; if (D.BOARD_TOWNS.indexOf(site) < 0) return null;
  const j = s.board[site]; if (j && (j.taken || s.day - j.day < 6)) return j;
  const here = G.site(site), others = D.BOARD_TOWNS.filter(t => t !== site && !s.quiet[t]);
  if (G.rnd() < 0.4 || !others.length) s.board[site] = { k: "bounty", day: s.day, pay: Math.min(70, 26 + Math.floor(s.day / 2)) };
  else { const to = others[ri(others.length)], res = ["food", "coal", "iron"][ri(3)], h = D.HAUL[res], n = h.n[ri(3)]; s.board[site] = { k: "haul", day: s.day, to, res, n, pay: Math.round(n * h.each + hexDist(here.at, G.site(to).at) * 2.5) }; }
  return s.board[site];
};
G.haulsFor = site => Object.keys(G.s.board || {}).filter(k => { const j = G.s.board[k]; return j && j.taken && j.k === "haul" && j.to === site; });
G.haulDone = function (from) { const s = G.s, j = s.board[from]; if (!j || !j.taken || !G.pay({ [j.res]: j.n })) return null; G.gain({ crowns: j.pay }); G.ready().forEach(u => { if (u.type !== "hero") u.xp = (u.xp || 0) + 1; }); s.board[from] = null; return j; };
UI.boardRows = function (site) {
  const s = G.s, j = G.board(site), into = G.haulsFor(site); if (!j && !into.length) return "";
  const row = (t, sub, btn) => '<div class="row job"><div class="t"><h3>' + t + '</h3><p>' + sub + '</p></div>' + btn + '</div>';
  let h = "";
  into.forEach(from => { const x = s.board[from], ok = G.can({ [x.res]: x.n }); h += row("Delivery from " + G.site(from).name, ok ? "Hand over " + x.n + " " + x.res + " for " + x.pay + " crowns." : "You are " + G.short({ [x.res]: x.n }).join("") + " short.", '<button data-bdone="' + from + '"' + (ok ? ' class="go"' : " disabled") + '>Hand over</button>'); });
  if (j && j.k === "bounty") h += row("Raiders close by", "The town will pay " + j.pay + " crowns to anyone who runs them off. They are an hour up the road.", '<button data-bfight="' + site + '">Ride out</button>');
  if (j && j.k === "haul" && !j.taken) h += row("A load for " + G.site(j.to).name, "They need " + j.n + " " + j.res + " there and will pay " + j.pay + " crowns on delivery. You bring the goods; everyone who walks it learns the road.", '<button data-btake="' + site + '">Take it on</button>');
  if (j && j.k === "haul" && j.taken) h += row("A load for " + G.site(j.to).name, "Taken on. Carry " + j.n + " " + j.res + " to " + G.site(j.to).name + ".", "");
  return '<p class="sec">Notice board</p><div class="rows">' + h + '</div>';
};
UI.wireBoard = function (redo) {
  const sc = $("screen"), s = G.s;
  sc.querySelectorAll("[data-btake]").forEach(b => b.onclick = () => { s.board[b.dataset.btake].taken = 1; UI.toast("Taken on. It is in your Journal."); G.save(); redo(); });
  sc.querySelectorAll("[data-bdone]").forEach(b => b.onclick = () => { const j = G.haulDone(b.dataset.bdone); if (j) UI.toast("Delivered. +" + j.pay + " crowns, and the warband knows the road better."); G.save(); redo(); });
  sc.querySelectorAll("[data-bfight]").forEach(b => b.onclick = () => { s.bounty = { site: b.dataset.bfight, pay: s.board[b.dataset.bfight].pay }; $("screen").hidden = true; UI.fightIntro("patrol", "Raiders close by", "They have a fire going in a dry gully and a lookout who isn't looking."); });
};

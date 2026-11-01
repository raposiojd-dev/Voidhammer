// Build the trimmed KayKit character files for g3d/assets/chars (CC0, Kay Lousberg).
import { NodeIO } from '@gltf-transform/core';
import { KHRMeshQuantization, ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune, resample, dedup, quantize } from '@gltf-transform/functions';
const SRC = process.argv[2], OUT = process.argv[3], Q = process.argv[4] === 'q';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const KEEP = {
  Knight: ['1H_Sword', 'Round_Shield', 'Badge_Shield', 'Rectangle_Shield', 'Knight_Helmet', 'Knight_Cape'],
  Barbarian: ['1H_Axe', 'Barbarian_Round_Shield', 'Barbarian_Hat', 'Barbarian_Cape', 'Mug'],
  Rogue: ['Knife', 'Rogue_Cape'],
  Rogue_Hooded: ['Knife', 'Rogue_Cape'],
  Mage: ['Mage_Hat', 'Mage_Cape']
};
const CLIPS = ['Idle', 'Walking_A', 'Running_A', '1H_Melee_Attack_Chop', '1H_Melee_Attack_Slice_Horizontal', '1H_Melee_Attack_Stab', 'Blocking', 'Hit_A', 'Death_A', 'Death_B', 'Cheer', 'Interact'];
const killAnim = (a) => { a.listChannels().forEach((c) => c.dispose()); a.listSamplers().forEach((s) => s.dispose()); a.dispose(); };
for (const c of Object.keys(KEEP)) {
  const doc = await io.read(SRC + c + '.glb'); const r = doc.getRoot();
  r.listAnimations().forEach(killAnim);
  r.listNodes().forEach((n) => { if (n.getMesh() && !n.getSkin() && !KEEP[c].includes(n.getName())) { n.getMesh().dispose(); n.dispose(); } });
  await doc.transform(prune(), dedup(), ...(Q ? [quantize({ quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12 })] : []));
  await io.write(OUT + c.toLowerCase() + '.glb', doc);
}
{ // animations: rig only, a dozen clips, no scale tracks, redundant keys removed
  const doc = await io.read(SRC + 'Knight.glb'); const r = doc.getRoot();
  r.listAnimations().forEach((a) => { if (!CLIPS.includes(a.getName())) killAnim(a); });
  for (const a of r.listAnimations()) for (const ch of a.listChannels()) if (ch.getTargetPath() === 'scale') { const sm = ch.getSampler(); ch.dispose(); sm.dispose(); }
  r.listNodes().forEach((n) => { if (n.getMesh()) { n.getMesh().dispose(); n.setMesh(null); } if (n.getSkin()) n.setSkin(null); });
  r.listSkins().forEach((s) => s.dispose());
  await doc.transform(resample({ tolerance: 2e-4 }), prune({ keepLeaves: true }), dedup());
  await io.write(OUT + 'anims.glb', doc);
}

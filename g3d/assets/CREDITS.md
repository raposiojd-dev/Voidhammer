# g3d asset credits

| What | Where it is | Source | Licence |
|---|---|---|---|
| People: Knight, Barbarian, Rogue, Rogue (hooded), Mage bodies, their palette textures, and 12 animation clips (idle, walk, run, three attacks, block, hit, two deaths, cheer, interact) | `assets/chars/*.glb` | KayKit Adventurers Character Pack 1.0 by Kay Lousberg, https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0 (www.kaylousberg.com) | CC0 1.0 |
| GLTFLoader, SkeletonUtils, BufferGeometryUtils (minified, imports pointed at the local three build) | `lib/*.js` | three.js r160 `examples/jsm`, https://github.com/mrdoob/three.js | MIT (see `../LICENSE`) |
| three.js core | `three.module.min.js` | three.js r160 | MIT (see `../LICENSE`) |
| Stone, ashlar, brick, plaster, planks, beams, thatch, slate, clay tile, cobbles, dirt, grass, cloth textures; sky and clouds; grass tufts | generated at run time in `art.js` | Voidhammer (original code) | project's own |

`assets/chars/build-chars.mjs` rebuilds the trimmed files from the KayKit pack with glTF-Transform (MIT):
weapons we don't use and 64 of 76 clips are removed, clips live once in `anims.glb` and drive every body (shared rig).
Recolouring per Realm, banner and character (e.g. Kaelren's ash-grey coat and rust undershirt) is done in the browser by repainting palette cells.
No paid or unclear assets are used.

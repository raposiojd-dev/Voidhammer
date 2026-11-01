# g3d asset credits

| What | Where it is | Source | Licence |
|---|---|---|---|
| People: three bodies (man, armoured soldier, hooded woman) and 10 clips (idle, sword idle, walk, run, sword slash, punch, death, hit, interact, wave) | `assets/people/people.glb` | Quaternius (https://quaternius.com) CC0 characters "Adventurer", "Monarch" (body only, no crown) and "Hooded Adventurer", as published by Quaternius on Poly Pizza (https://poly.pizza/u/Quaternius, each model page states CC0/Public Domain). Fetched via the npm package `@netforge/asset-library-files@0.2.0` (its NOTICE records the Quaternius/Poly Pizza source and CC0) | CC0 1.0 |
| GLTFLoader, SkeletonUtils, BufferGeometryUtils (minified, imports pointed at the local three build) | `lib/*.js` | three.js r160 `examples/jsm`, https://github.com/mrdoob/three.js | MIT (see `../LICENSE`) |
| three.js core | `three.module.min.js` | three.js r160 | MIT (see `../LICENSE`) |
| Realm horizon backdrops and loading cards (nine Realm posters, 640 x 640 webp, about 20 KB each, loaded only for the scene's Realm) | `assets/backdrops/*.webp` | Voidhammer's own Realm poster art (`worlds/*-poster.jpg` on main), resized and re-encoded. **AI disclosure: these are AI-generated images made for the Voidhammer project** | project's own |
| Post-processing (bloom, FXAA, tone map, Realm colour grade) and shader patches (height fog, world-space tone and roughness variation, rim light, grass sway) | `post.js`, `art.js` | Voidhammer (original code; the ACES fit and FXAA follow the public formulas three.js also uses) | project's own |
| Stone, ashlar, brick, plaster, planks, beams, thatch, slate, clay tile, cobbles, dirt, grass, cloth textures; sky and clouds; grass tufts | generated at run time in `art.js` | Voidhammer (original code) | project's own |

`assets/people/build-people.mjs` rebuilds `people.glb` with glTF-Transform and meshoptimizer (both MIT): the three source
files (decoded first with `decode-meshopt.mjs`) share one 62-bone rig, so every part is baked into one skin, each body is merged
into a single primitive and simplified (about 4,000 to 6,500 triangles), and its original materials become cells of a 4 x 4 colour
palette. The game recolours that palette per look (Realm cloth, banner, Kaelren's ash-grey coat and rust undershirt).
Helmets, swords, spears, knives and shields are built in code (`chars.js`).
An earlier pass used the KayKit Adventurers pack (CC0, Kay Lousberg); it was replaced for realistic proportions.
No paid or unclear assets are used.

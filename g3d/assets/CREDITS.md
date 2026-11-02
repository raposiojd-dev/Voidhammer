# g3d asset credits

| What | Where it is | Source | Licence |
|---|---|---|---|
| People: three bodies (man, armoured soldier, hooded woman) and 10 clips (idle, sword idle, walk, run, sword slash, punch, death, hit, interact, wave) | `assets/people/people.glb` | Quaternius (https://quaternius.com) CC0 characters "Adventurer", "Monarch" (body only, no crown) and "Hooded Adventurer", as published by Quaternius on Poly Pizza (https://poly.pizza/u/Quaternius, each model page states CC0/Public Domain). Fetched via the npm package `@netforge/asset-library-files@0.2.0` (its NOTICE records the Quaternius/Poly Pizza source and CC0) | CC0 1.0 |
| Trees for every Realm biome (broadleaf, autumn, pine, birch, willow, snow-laden, dead), bushes, rocks, grass, flowers, fern, stump, log | `assets/models/nature.glb` | Quaternius, **Ultimate Nature Pack** (https://quaternius.com/packs/ultimatenature.html). Fetched from the CC0 mirror https://github.com/trebeljahr/quaternius-showcase (`public/glb/nature_pack/*.glb`, its `src/lib/licenses.ts` records the pack as CC0) | CC0 1.0 |
| Timber-framed cottages, inn, smithy, stable, windmill, sawmill, well, market stalls, cart, barrels, crates, fence, bonfire, hay, bench, sacks, cauldron | `assets/models/village.glb` | Quaternius, **Medieval Village Pack** (https://quaternius.com/packs/medievalvillage.html), same mirror (`public/glb/medieval_village_pack/*.glb`) | CC0 1.0 |
| Curtain wall, gatehouse, towers, banner | `assets/models/castle.glb` | Quaternius, **Modular Medieval Buildings Pack** (https://quaternius.com/packs/medievalbuildings.html), same mirror (`public/glb/modular_medieval_buildings_pack/*.glb`) | CC0 1.0 |
| Horse (rigged; Idle, Walk, Gallop, Death clips) | `assets/models/horse.glb` | Quaternius, **Ultimate Animated Animal Pack** (https://quaternius.com/packs/ultimateanimatedanimals.html), same mirror (`public/glb/animals_pack/Horse.glb`) | CC0 1.0 |
| meshopt decoder | `lib/meshopt_decoder.module.js` | three.js r160 `examples/jsm/libs` (meshoptimizer 0.18 by Arseny Kapoulkine) | MIT |
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
`assets/models/build-models.mjs` rebuilds the four model bundles with glTF-Transform and meshoptimizer (both MIT): each static model
is baked into one vertex-coloured primitive (one draw call per instanced type), tagged per vertex with its material's role (wood,
plaster, roof, stone, window, foliage, cloth, fire) so the game can recolour it to each Realm's canon palette, simplified, quantised
and meshopt-compressed. The horse keeps its rig and four of its clips, joined into one skinned primitive. Total about 0.55 MB.
Low keeps the procedural shapes and never downloads these files.
No paid, unclear or AI-generated 3D assets are used.

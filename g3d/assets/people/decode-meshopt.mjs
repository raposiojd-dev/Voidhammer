import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const doc = await io.read(process.argv[2]);
doc.getRoot().listExtensionsUsed().forEach(e => { if (/meshopt|quantiz/i.test(e.extensionName)) e.dispose(); });
await io.write(process.argv[3], doc);

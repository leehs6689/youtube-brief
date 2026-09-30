// Convert Natural Earth 1:50m (world-atlas, public domain data) to compact GeoJSON for the globe scene.
import fs from 'fs';
import * as topo from 'topojson-client';
const land = JSON.parse(fs.readFileSync('node_modules/world-atlas/land-50m.json'));
const ctry = JSON.parse(fs.readFileSync('node_modules/world-atlas/countries-50m.json'));
const round = g => JSON.parse(JSON.stringify(g, (k, v) => typeof v === 'number' ? Math.round(v * 100) / 100 : v));
const out = {
  land: round(topo.feature(land, land.objects.land)),
  borders: round(topo.mesh(ctry, ctry.objects.countries, (a, b) => a !== b)),
  korea: round(topo.feature(ctry, ctry.objects.countries).features.find(f => f.properties.name === 'South Korea')),
};
fs.writeFileSync('src/geo.json', JSON.stringify(out));
console.log('geo.json', (fs.statSync('src/geo.json').size / 1024).toFixed(0), 'KB', 'korea:', !!out.korea);

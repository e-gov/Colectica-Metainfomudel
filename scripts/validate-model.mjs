import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const load = (name) => JSON.parse(readFileSync(new URL(`../src/data/${name}.json`, import.meta.url), 'utf8'));
const model = load('model');
const layout = load('layout');
function unique(items, label) {
  const ids = items.map((o) => o.id);
  assert.equal(new Set(ids).size, ids.length, `${label}: korduvad ID-d`);
  for (const id of ids) assert.match(id, /^[a-z0-9-]+$/, `${label}: vigane ID ${id}`);
  return new Set(ids);
}
const groups = unique(model.groups, 'Rühmad');
const objects = unique(model.objects, 'Objektid');
const relations = unique(model.relations, 'Seosed');
for (const object of model.objects) {
  assert(groups.has(object.group), `${object.id}: tundmatu rühm`);
  for (const key of ['name', 'nameEn', 'description', 'details', 'status']) assert.equal(typeof object[key], 'string', `${object.id}: puuduv ${key}`);
  const pos = layout.positions[object.id];
  assert(pos && Number.isFinite(pos.x) && Number.isFinite(pos.y), `${object.id}: puuduv asukoht`);
  assert(Array.isArray(object.attributes), `${object.id}: puuduvad atribuudid`);
  unique(object.attributes, `${object.id}: atribuudid`);
  for (const attribute of object.attributes) {
    for (const key of ['name', 'description', 'status']) assert.equal(typeof attribute[key], 'string', `${object.id}/${attribute.id}: puuduv ${key}`);
  }
}
for (const relation of model.relations) {
  assert(objects.has(relation.source) && objects.has(relation.target), `${relation.id}: viide puuduvale objektile`);
  assert.notEqual(relation.source, relation.target, `${relation.id}: iseseose jaoks tuleb kujundus eraldi täiendada`);
  for (const key of ['label', 'description', 'status']) assert.equal(typeof relation[key], 'string', `${relation.id}: puuduv ${key}`);
  for (const key of ['sourceCardinality', 'targetCardinality']) assert(relation[key] === null || typeof relation[key] === 'string', `${relation.id}: vigane kordsus`);
  const route = layout.routes[relation.id];
  for (const side of ['source', 'target']) assert(['top', 'right', 'bottom', 'left'].includes(route?.[side]), `${relation.id}: puuduv ühenduse külg`);
}
for (const id of Object.keys(layout.positions)) assert(objects.has(id), `Paigutuses tundmatu objekt ${id}`);
for (const id of Object.keys(layout.routes)) assert(relations.has(id), `Paigutuses tundmatu seos ${id}`);
console.log(`Mudel korras: ${objects.size} kirjet, ${relations.size} seost, ${groups.size} rühma.`);

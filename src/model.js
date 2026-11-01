import model from './data/model.json';
import layout from './data/layout.json';
export { model, layout };
export const objectById = Object.fromEntries(model.objects.map((item) => [item.id, item]));
export const groupById = Object.fromEntries(model.groups.map((group) => [group.id, group]));
export const objectPath = (id) => `/objekt/${encodeURIComponent(id)}`;
export const relationsFor = (id) => model.relations.filter((r) => r.source === id || r.target === id);

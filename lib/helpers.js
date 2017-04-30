// sluggify method names from `camelCase` to `camel-case`
// used for generating endpoints from statics.
function slugify(str) {
  return str.split(/(?=[A-Z])/)
  .map(word => word.toLowerCase())
  .join('-');
}

function deleteKeyFromObject(obj, key) {
  if (typeof obj === 'undefined' || typeof key === 'undefined') return obj;
  if (obj.hasOwnProperty(key)) delete obj[key];
  return obj;
}

function omit(obj, arr) {
  arr = Array.isArray(arr) ? arr : [arr];
  return arr.reduce(deleteKeyFromObject, obj);
}

function toNum(str) {
  str = parseInt(str, 0);
  return !(isNaN(str)) ? str : 0;
}

module.exports = { slugify, omit, toNum };

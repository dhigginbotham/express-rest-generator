// sluggify method names from `camelCase` to `camel-case`
// used for generating endpoints from statics.
function slugify(str) {
  return str.split(/(?=[A-Z])/)
  .map(word => word.toLowerCase())
  .join('-');
}

function deleteKeyFromObject(obj, key) {
  if (typeof obj === 'undefined' || typeof key === 'undefined') return obj;
  if (typeof prop({ obj, key }) !== 'undefined') prop({ obj, key, remove: true });
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

function prop({ obj = {}, str = '', val = undefined, remove = false }) {
  str = typeof str === 'string' ? str : `${str}`;
  const props = str.indexOf('.') !== -1 ? str.split('.') : [str];
  const final = props.pop();
  if (props.length) {
    let p;
    while (p = props.shift()) { // eslint-disable-line
      if (typeof obj[p] === 'undefined') {
        if (typeof val === 'undefined') return undefined;
        obj[p] = {};
      }
      obj = obj[p];
    }
  }
  if (remove === true) return delete obj[final];
  return typeof val !== 'undefined' ? (obj[final] = val) : obj[final];
}

module.exports = { slugify, omit, prop, toNum };

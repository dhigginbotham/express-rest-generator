const log = require('debug')('rest:helpers:');

// sluggify method names from `camelCase` to `camel-case`
// used for generating endpoints from statics.
function slugify(str) {
  return str.split(/(?=[A-Z])/)
  .map(word => word.toLowerCase())
  .join('-');
}

function deleteKeyFromObject(obj, key) {
  if (typeof obj === 'undefined' || typeof key === 'undefined') return obj;
  prop({ obj, key, remove: true });
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

function prop({ obj = {}, key = '', val, remove = false }) {
  key = typeof key === 'string' ? key : `${key}`;
  const props = key.indexOf('.') !== -1 ? key.split('.') : [key];
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
  if (remove === true) {
    delete obj[final];
    return obj;
  }
  return typeof val !== 'undefined' ? (obj[final] = val) : obj[final];
}

module.exports = { slugify, omit, prop, toNum };

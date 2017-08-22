import Dom7 from './dom7-class';
import $ from './$';

const Utils = {
  parseUrlQuery(url) {
    const query = {};
    let urlToParse = url || window.location.href;
    let i;
    let params;
    let param;
    let length;
    if (typeof urlToParse === 'string' && urlToParse.length) {
      urlToParse = urlToParse.indexOf('?') > -1 ? urlToParse.replace(/\S*\?/, '') : '';
      params = urlToParse.split('&').filter(paramsPart => paramsPart !== '');
      length = params.length;

      for (i = 0; i < length; i += 1) {
        param = params[i].replace(/#\S+/g, '').split('=');
        query[decodeURIComponent(param[0])] = typeof param[1] === 'undefined' ? undefined : decodeURIComponent(param[1]) || '';
      }
    }
    return query;
  },
  isArray(arr) {
    return Array.isArray(arr);
  },
  each(obj, callback) {
      // Check it's iterable
      // TODO: Should probably raise a value error here
    if (typeof obj !== 'object') return;
    // Don't bother continuing without a callback
    if (!callback) return;
    if (Array.isArray(obj) || obj instanceof Dom7) {
      // Array
      for (let i = 0; i < obj.length; i++) {
        // If callback returns false
        if (callback(i, obj[i]) === false) {
          // Break out of the loop
          return;
        }
      }
    } else {
      // Object
      for (let prop in obj) {
        // Check the propertie belongs to the object
        // not it's prototype
        if (obj.hasOwnProperty(prop)) {
          // If the callback returns false
          if (callback(prop, obj[prop]) === false) {
            // Break out of the loop;
            return;
          }
        }
      }
    }
  },
  unique(arr) {
    const uniqueArray = [];
    for (let i = 0; i < arr.length; i += 1) {
      if (uniqueArray.indexOf(arr[i]) === -1) uniqueArray.push(arr[i]);
    }
    return uniqueArray;
  },
  serializeObject(obj, parents = []) {
    if (typeof obj === 'string') return obj;
    const resultArray = [];
    const separator = '&';
    let newParents;
    function varName(name) {
      if (parents.length > 0) {
        let parentParts = '';
        for (let j = 0; j < parents.length; j += 1) {
          if (j === 0) parentParts += parents[j];
          else parentParts += `[${encodeURIComponent(parents[j])}]`;
        }
        return `${parentParts}[${encodeURIComponent(name)}]`;
      }
      return encodeURIComponent(name);
    }
    function varValue(value) {
      return encodeURIComponent(value);
    }
    for (let prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        let toPush;
        if (Array.isArray(obj[prop])) {
          toPush = [];
          for (let i = 0; i < obj[prop].length; i += 1) {
            if (!Array.isArray(obj[prop][i]) && typeof obj[prop][i] === 'object') {
              newParents = parents.slice();
              newParents.push(prop);
              newParents.push(String(i));
              toPush.push(Utils.serializeObject(obj[prop][i], newParents));
            } else {
              toPush.push(`${varName(prop)}[]=${varValue(obj[prop][i])}`);
            }
          }
          if (toPush.length > 0) resultArray.push(toPush.join(separator));
        } else if (obj[prop] === null || obj[prop] === '') {
          resultArray.push(`${varName(prop)}=`);
        } else if (typeof obj[prop] === 'object') {
          // Object, convert to named array
          newParents = parents.slice();
          newParents.push(prop);
          toPush = Utils.serializeObject(obj[prop], newParents);
          if (toPush !== '') resultArray.push(toPush);
        } else if (typeof obj[prop] !== 'undefined' && obj[prop] !== '') {
          // Should be string or plain value
          resultArray.push(`${varName(prop)}=${varValue(obj[prop])}`);
        } else if (obj[prop] === '') resultArray.push(varName(prop));
      }
    }
    return resultArray.join(separator);
  },
  toCamelCase(string) {
    return string.toLowerCase().replace(/-(.)/g, (match, group1) => group1.toUpperCase());
  },
  dataset(el) {
    return $(el).dataset();
  },
  getTranslate(el, axis = 'x') {
    const curStyle = window.getComputedStyle(el, null);
    let matrix;
    let curTransform;
    let transformMatrix;

    if (window.WebKitCSSMatrix) {
      curTransform = curStyle.transform || curStyle.webkitTransform;
      if (curTransform.split(',').length > 6) {
        curTransform = curTransform.split(', ').map(function map(a) {
          return a.replace(',', '.');
        }).join(', ');
      }
      // Some old versions of Webkit choke when 'none' is passed; pass
      // empty string instead in this case
      transformMatrix = new window.WebKitCSSMatrix(curTransform === 'none' ? '' : curTransform);
    } else {
      transformMatrix = curStyle.transform || curStyle.getPropertyValue('transform').replace('translate(', 'matrix(1, 0, 0, 1,');
      matrix = transformMatrix.toString().split(',');
    }

    if (axis === 'x') {
      // Latest Chrome and webkits Fix
      if (window.WebKitCSSMatrix) curTransform = transformMatrix.m41;
      // Crazy IE10 Matrix
      else if (matrix.length === 16) curTransform = parseFloat(matrix[12]);
      // Normal Browsers
      else curTransform = parseFloat(matrix[4]);
    }
    if (axis === 'y') {
      // Latest Chrome and webkits Fix
      if (window.WebKitCSSMatrix) curTransform = transformMatrix.m42;
      // Crazy IE10 Matrix
      else if (matrix.length === 16) curTransform = parseFloat(matrix[13]);
      // Normal Browsers
      else curTransform = parseFloat(matrix[5]);
    }

    return curTransform || 0;
  },
  requestAnimationFrame(callback) {
    if (window.requestAnimationFrame) return window.requestAnimationFrame(callback);
    else if (window.webkitRequestAnimationFrame) return window.webkitRequestAnimationFrame(callback);
    return window.setTimeout(callback, 1000 / 60);
  },
  cancelAnimationFrame(id) {
    if (window.cancelAnimationFrame) return window.cancelAnimationFrame(id);
    else if (window.webkitCancelAnimationFrame) return window.webkitCancelAnimationFrame(id);
    return window.clearTimeout(id);
  },
  extend(...args) {
    const to = Object(args[0]);
    for (let i = 1; i < args.length; i += 1) {
      const nextSource = args[i];
      if (nextSource !== undefined && nextSource !== null) {
        const keysArray = Object.keys(Object(nextSource));
        for (let nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex += 1) {
          const nextKey = keysArray[nextIndex];
          const desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
          if (desc !== undefined && desc.enumerable) {
            if (typeof to[nextKey] === 'object' && typeof nextSource[nextKey] === 'object') {
              Utils.extend(to[nextKey], nextSource[nextKey]);
            } else {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
    }
    return to;
  },
};

// Aliases
Utils.parseQuery = Utils.parseUrlQuery;
Utils.param = Utils.serializeObject;

export default Utils;

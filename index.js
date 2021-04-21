'use strict';

const path = require('path');

const m = new Map();

module.exports = {
  getSchema: function(name) {
    if (!m.has(name)) {
      try {
        m.set(name,require(path.resolve('.','schema',name+'.json')));
      }
      catch (ex) {
        m.set(name,{ error: ex.message });
      }
    }
    return m.get(name);
  }
};


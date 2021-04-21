#!/usr/bin/env node

'use strict';

const engine = require('./index');

if (process.argv[2]) {
  const json = engine.getSchema(process.argv[2]);
  console.log(JSON.stringify(json,null,2));
}
else {
  console.log('Usage: test {schema-org-type}');
}


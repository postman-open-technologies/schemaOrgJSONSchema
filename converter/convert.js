'use strict';

const { convert } = require('./generate');

async function main() {
  await convert(process.argv[2]);
}

main();

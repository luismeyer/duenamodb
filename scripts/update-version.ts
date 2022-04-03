import fs from 'fs';
import path from 'path';
import prettier from 'prettier';

import pjson from '../package.json';

const { RELEASE_VERSION } = process.env;

if (!RELEASE_VERSION) {
  throw new Error("Couldn't find realese version in env variables");
}

pjson.version = RELEASE_VERSION.slice(1);

const output = prettier.format(JSON.stringify(pjson), {
  parser: 'json-stringify',
});

fs.writeFileSync(path.resolve(__dirname, '../package.json'), output);

console.info('Updated Version in package.json');

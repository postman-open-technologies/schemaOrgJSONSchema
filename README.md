## Schema.Org types in JSON Schema Draft 2020-12 format

The schemas at https://schema.org/ are very helpful for formats like JSON-LD, but they lack a canonical JSON representation.

This repository includes a canonical plain-JSON serialisation for each of the schema.org types, as well as the scrapers and converters used in their production.

### Schema.Org version

* `13.0`
* Previous versions, from `12.0`, see [GitHub tags](https://github.com/postman-open-technologies/schemaOrgJSONSchema/releases) or install a specific version from npm

## Usage:

```js
const schemaOrg = require('@postman-open-tech/schemaorgjsonschema');

const bookSchema = schemaOrg.getSchema('Book');
```

```shell
node test.js {schema.org type}
```

### Source of converter / scrapers

* https://github.com/geraintluff/schema-org-gen - MIT
* https://github.com/mhausenblas/schema-org-rdf - Public Domain

### License

* Software - MIT
* Types - [Creative Commons Attribution Share Alike 4.0 International](https://spdx.org/licenses/CC-BY-SA-4.0.html)


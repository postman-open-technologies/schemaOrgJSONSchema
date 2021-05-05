Generating JSON Schemas from schema.org data
==============

The schemas at http://schema.org/ are very helpful for formats like JSON-LD, but they lack a canonical JSON representation.

This tool generates schemas describing a canonical plain-JSON serialisation for each of the schema.org types.

## Installation and execution

...

## See also

* https://github.com/schemaorg/schemaorg.git
* https://github.com/link-fish/schema-org-rdf
* https://github.com/shexSpec/shex.js

## Multiplicity of relations

The documentation at schema.org gives no indication which properties/relations can have multiple entries.  A `PostalAddress` should (intuitively) only have one `streetAddress`, but many other properties are one-to-many mappings (represented in JSON as arrays instead of direct values).

Most of these were initially guessed based on whether their descriptions started with "A(n)" or "The".  This is sometimes inaccurate (e.g. http://schema.org/follows), so hand-edits should be made to `property-multiplicity.json`.

## Standard definitions

### `#/definitions/array`

This definition is added to all generated schemas, to make it easy to represent an array of instances.

### `#/definitions/possibleRef`

This definition is added to all generated schemas, and it represents a type that can either be a reference (URL string) to an external resource or an actual inlined resource.

### `#/definitions/possibleRefArray`

A combination of the above two - an array of possible refs.

const OUTPUT_DIR = "../schema";
const OUTPUT_SUFFIX = ".json";
const URL_PREFIX = 'https://schema.org/';
const URL_SUFFIX = '.json';
const REL_PREFIX = 'https://schema.org/';

const path = require('path');
const fs = require('fs');

const fetch = require('node-fetch');

const hardcodedSchemas = require('./hardcoded-schemas.json');
const propertyMultiplicity = require('./property-multiplicity.json');
const ignoreProperties = require('./ignore-properties.json');

try {
  fs.mkdirSync(OUTPUT_DIR);
} catch (e) {
}

function createRel(key) {
  if (key === 'url') {
    return 'self';
  }
  return REL_PREFIX + encodeURIComponent(key);
}

async function convert(localFile) {

  let allSchemas = {};
  let allData = {};

  if (localFile) {
    allData = JSON.parse(fs.readFileSync(localFile,'utf8'));
  }
  else {
    const res = await fetch('http://schema.link.fish/downloads/all.json');
    allData = await res.json();
  }
  
  function getHardcoded(key) {
    return JSON.parse(JSON.stringify(hardcodedSchemas[key]));
  }
  
  function merge(objA) {
    var result = {};
    for (var i = 0; i < arguments.length; i++) {
      var obj = arguments[i];
      for (var key in obj) {
        result[key] = obj[key];
      }
    }
    return result;
  }
  
  function trimSchema(schema) {
    if (!schema.title) {
      delete schema.title;
    }
    if (!schema.description) {
      delete schema.description;
    }
    if (schema.enum.length == 0) {
      delete schema.enum;
    }    
    if (schema.type.length == 0) {
      delete schema.type;
    }    
    if (schema.allOf.length == 0) {
      delete schema.allOf;
    }    
    if (schema.links.length == 0) {
      delete schema.links;
    }    
    if (Object.keys(schema.properties).length == 0) {
      delete schema.properties;
      if (schema.type == 'object' && schema.allOf) {
        delete schema.type;
      }
    }
    if (Object.keys(schema.$defs).length == 0) {
      delete schema.$defs;
    }
    return schema;
  }
  
  function createSchema(key, spec) {
    var schema = {
      '$schema': 'https://json-schema.org/draft/2020-12/schema',
      '$id': URL_PREFIX + spec['id'] + URL_SUFFIX,
      '$comment': 'Autogenerated with schema-org-gen',
      'title': spec['label'],
      'description': spec['comment_plain'],
      //'format': spec['url'],
      'media': {"type": "application/json;profile=" + spec['url'].split('http:').join('https:')},
      "allOf": [],
      "type": [],
      "properties": {},
      "links": [],
      '$defs': {}
    };
    if (spec.instances) {
      schema['enum'] = spec.instances;
    //} else {
      schema.type = 'object';
      schema.properties = {};
      schema.$defs['arrayOf'+key+'s'] = {
        "type": "array",
        "items": {"$ref": "#"}
      };
      if (hardcodedSchemas[key]) {
        return trimSchema(merge(schema, getHardcoded(key)));
      }
      schema.$defs.possibleRef = {
        "oneOf": [
          {"$ref": "#"},
          {
            "type": "string",
            "format": "uri",
            "links": [{
              "rel": "full",
              "href": "{+$}"
            }]
          }
        ]
      };
      schema.$defs.possibleRefArray = {
        "oneOf": [
          {
            "type": "string",
            "format": "uri",
            "links": [{
              "rel": "full",
              "href": "{+$}"
            }]
          },
          {
            "type": "array",
            "items": {"$ref": "#/$defs/possibleRef"}
          }
        ]
      };
      schema.allOf = spec.supertypes.map(function (supertype) {
        return {"$ref": supertype + URL_SUFFIX};
      });
      spec.specific_properties.forEach(function (key) {
        if (key === 'array' || key === 'possibleRef' || key === 'possibleRefArray') {
          throw new Error('Not allowed key: ' + key);
        }
        var propSpec = allData.properties[key];
        if (ignoreProperties[key] || /\(legacy spelling;/.test(propSpec['comment_plain'])) {
          ignoreProperties[key] = true;
          return;
        }
        if (hardcodedSchemas[key]) {
          schema.properties[key] = getHardcoded(key);
        } else {
          var options = [];
          propSpec.ranges.forEach(function (type) {
            if (hardcodedSchemas[type]) {
              options.push(getHardcoded(type));
            } else {
              options.push({"$ref": type + URL_SUFFIX + "#/$defs/possibleRef"});
            }
          });
          if (options.length == 1) {
            schema.properties[key] = options[0];
          } else {
            schema.properties[key] = {"anyOf": options};
          }
        }
        var description = propSpec['comment_plain'];
        if (typeof propertyMultiplicity[key] !== 'boolean') {
          if (/^An? /.test(description)) {
            propertyMultiplicity[key] = true;
          } else if (/^The /.test(description) || /^is[A-Z]/.test(key)) {
            propertyMultiplicity[key] = false;
          } else {
            propertyMultiplicity[key] = description;
          }
        }
        var subSchema = schema.properties[key];
        var shouldAddLink = (subSchema.format === 'uri');
        if (!schema.properties[key]['$ref'] && !shouldAddLink) {
          var subSchema = schema.properties[key];
          subSchema = merge({
            title: propSpec['label'],
            description: propSpec['comment_plain']
          }, subSchema);
          schema['$defs'][key] = subSchema
          schema['properties'][key] = {"$ref": '#/$defs/' + key}
        }
        if (propertyMultiplicity[key] === true) {
          var subSchema = schema['properties'][key];
          if (subSchema['$ref'] && /^[^#]+#\/\$defs\/possibleRef?$/.test(subSchema['$ref'])) {
            subSchema['$ref'] += 'Array';
          } else if (shouldAddLink) {
            if (subSchema['$ref']) {
              subSchema = {
                allOf: [subSchema]
              };
            }
            subSchema.links = subSchema.links || [];
            subSchema.links.push({
              "rel": createRel(key),
              "href": "{+$}",
              "linkSource": 2
            });
            schema.properties[key] = {
              type: "array",
              items: subSchema
            };
          } else {
            schema.properties[key] = {
              type: "array",
              items: subSchema
            };
          }
        } else if (propertyMultiplicity[key] === false) {
          if (shouldAddLink) {
            schema.links.push({
              "rel": createRel(key),
              "href": "{+" + encodeURIComponent(key) + "}"
            });
          }
        } else {
          var subSchema = schema['properties'][key];
          if (shouldAddLink) {
            if (subSchema['$ref']) {
              subSchema = {
                allOf: [subSchema]
              };
            }
            subSchema.links = subSchema.links || [];
            subSchema.links.push({
              "rel": "full",
              "href": "{+$}"
            });
          }
          schema.properties[key] = {
            oneOf: [
              subSchema,
              {
                type: "array",
                items: subSchema
              }
            ]
          };
        }
      });
    }
    
    return trimSchema(schema);
  }

  for (let key in allData.types) {
    console.log(key,'...');
    allSchemas[key] = createSchema(key, allData.types[key]);
  }
  for (let key in allData.types) {
    const spec = allData.types[key];
    const filename = path.join(OUTPUT_DIR, spec.id + OUTPUT_SUFFIX);
    fs.writeFileSync(filename, JSON.stringify(allSchemas[key],null,2),'utf8');
  }
  
  fs.writeFileSync('./property-multiplicity.json', JSON.stringify(propertyMultiplicity,null,2),'utf8');
  fs.writeFileSync('./ignore-properties.json', JSON.stringify(ignoreProperties,null,2),'utf8');
}

module.exports = {
  convert
};


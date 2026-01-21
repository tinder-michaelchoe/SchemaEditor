const Ajv = require('ajv');
const fs = require('fs');

// Load schema
const schema = JSON.parse(fs.readFileSync('/Users/michael.choe/Desktop/PROGRAMMING/CladsRenderer/CLADS/Schema/clads-schema.json', 'utf8'));

// Your test JSON
const testJSON = {
  "id": "settings-check",
  "version": "1.0",
  "root": {
    "children": [
      {
        "type": "sectionLayout",
        "sectionSpacing": 16,
        "sections": [
          {
            "id": "header-section",
            "layout": {
              "type": "vertical",  // INVALID - should be horizontal/list/grid/flow
              "itemSpacing": 12
            },
            "children": [
              {
                "type": "vstack",
                "spacing": 12,
                "children": [
                  {
                    "type": "image",
                    "image": {
                      "sfsymbol": "xmark"
                    },
                    "frame": {
                      "width": 24,
                      "height": 24
                    }
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
};

// Validate
const ajv = new Ajv({ allErrors: true, verbose: true, strict: false });
const validate = ajv.compile(schema);
const valid = validate(testJSON);

console.log('Is valid?', valid);
console.log('\nErrors:');
if (validate.errors) {
  validate.errors.forEach((error, i) => {
    console.log(`\n${i + 1}. ${error.instancePath || '/'}`);
    console.log(`   Keyword: ${error.keyword}`);
    console.log(`   Message: ${error.message}`);
    console.log(`   Params:`, error.params);
    if (error.data !== undefined) {
      console.log(`   Data:`, JSON.stringify(error.data, null, 2).substring(0, 100));
    }
  });
} else {
  console.log('No errors found');
}

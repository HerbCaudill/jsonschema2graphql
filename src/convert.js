"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ajv_1 = require("ajv");
const graphql_1 = require("graphql");
const converter_1 = require("./converter");
const objectify = (m) => 
// tslint:disable-next-line
[...m.entries()].reduce((o, [k, v]) => ((o[k] = v), o), {});
function _convert(jsonSchema) {
    const ajv = new ajv_1.default({ schemaId: '$id' });
    ajv.addSchema(jsonSchema);
    // TODO: throw any validation errors
    const context = converter_1.newContext();
    converter_1.convert(context, jsonSchema);
    const types = objectify(context.types);
    const schema = Object.assign({}, types);
    return new graphql_1.GraphQLSchema(schema);
}
exports.default = _convert;
//# sourceMappingURL=convert.js.map
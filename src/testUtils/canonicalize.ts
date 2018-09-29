const ASCENDING_BY_NAME = (a, b) => a.name < b.name
export default function canonicalize(introspectionResult): any {
  introspectionResult.data.__schema.directives.sort(ASCENDING_BY_NAME)
  for (const type of introspectionResult.data.__schema.types) {
    if (type.fields) {
      type.fields.sort(ASCENDING_BY_NAME)
    }
    if (type.inputFields) {
      type.inputFields.sort(ASCENDING_BY_NAME)
    }
  }
  return introspectionResult
}

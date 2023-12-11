// Taken from https://github.com/seamapi/nextlove-sdk-generator/blob/main/src/lib/openapi/flatten-obj-schema.ts

type AllOfSchema = any
type ObjSchema = any
type PrimitiveSchema = any
type PropertySchema = any

import lodash from "lodash"

const { intersectionWith, isEqual } = lodash

export const flattenObjSchema = (
  s:
    | ObjSchema
    | {
        oneOf: Array<ObjSchema>
      }
): ObjSchema => {
  if ("type" in s && s.type === "object") return s

  if ("oneOf" in s) {
    if (!s.oneOf[0]) {
      throw new Error("oneOf must have at least one element")
    }

    const super_obj: ObjSchema = {
      type: "object",
      properties: {},
      required: [...s.oneOf[0].required],
    }
    for (const obj of s.oneOf) {
      for (const [k, v] of Object.entries(obj.properties)) {
        super_obj.properties[k] = v
      }
      super_obj.required = intersectionWith(
        super_obj.required,
        obj.required,
        isEqual
      )
    }
    return super_obj as ObjSchema
  }
  throw new Error(`Unknown schema type "${s.type}"`)
}

export const deepFlattenAllOfSchema = (
  s: AllOfSchema
): Exclude<PropertySchema, AllOfSchema> | undefined => {
  if (s.allOf.length === 1 && s.allOf[0]) {
    const recursive = s.allOf[0]

    if ("allOf" in recursive) {
      return deepFlattenAllOfSchema(recursive)
    }

    return recursive
  }

  const properties: Record<string, PropertySchema[]> = {}
  const required = new Set<string>()
  const primitives: PrimitiveSchema[] = []

  for (let subschema of s.allOf) {
    if ("allOf" in subschema) {
      const recursive = deepFlattenAllOfSchema(subschema)
      if (!recursive) continue

      subschema = recursive
    }

    if ("oneOf" in subschema) {
      console.error("oneOf not currently supported when flattening allOf")
      continue
    }

    if ("$ref" in subschema) {
      console.error("$ref not currently supported when flattening allOf")
      continue
    }

    if (subschema.type === "object") {
      for (const [k, v] of Object.entries(subschema.properties)) {
        if (!properties[k]) properties[k] = []
        properties[k]!.push(v)

        if (subschema.required?.includes(k)) required.add(k)
      }

      continue
    }

    primitives.push(subschema)
  }

  if (Object.keys(properties).length > 0 && primitives.length > 0) {
    console.error(
      "Found invalid allOf schema with both properties and primitives",
      new Error(JSON.stringify(s, null, 2))
    )
  }

  if (primitives.length > 0) {
    // TODO: check that all primitives are the same, then merge nullability/unions
    return primitives[0]
  }

  if (Object.keys(properties).length > 0) {
    return {
      type: "object",
      required: [...required],
      properties: Object.fromEntries(
        Object.entries(properties)
          .map(([k, v]) => [
            k,
            deepFlattenAllOfSchema({
              allOf: v,
            }),
          ])
          .filter(([, v]) => v)
      ),
    }
  }

  return undefined
}

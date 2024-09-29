import { Type } from '@sinclair/typebox'
import { ModelValues } from '@/types/model'

export const TModelValues = Type.Record(Type.String(), Type.Any())

export const TModelSchema = Type.Record(Type.String(), TProperty)
export const TModelClass = Type.Object({
  schema: TModelSchema,
  create: Type.Function(
    [TModelValues],
    Type.Promise(Type.Record(Type.String(), Type.Any())),
  ),
})

export abstract class IModelClass {
  static originalConstructor: new () => any

  static async create(values: ModelValues<any>): Promise<Item<any>> {
    const item = new Item<any>(values)
    await item.initialize()
    return item
  }

  static getOriginalClass(): new () => any {
    return this.originalConstructor
  }
}

export const Model: ModelConstructor = <
  T extends { new (...args: any[]): IModelClass },
>(
  constructor: T,
) => {
  class ModelClass extends constructor {
    private static _schema: Record<string, TSchema> = {}
    static originalConstructor = constructor

    static _initializeSchema() {
      const properties =
        Reflect.getMetadata(PropertyMetadataKey, this.prototype) || []

      properties.forEach(
        ({
          propertyKey,
          propertyType,
        }: {
          propertyKey: string
          propertyType: TSchema
        }) => {
          // console.log(
          //   `setting ${propertyKey} to ${JSON.stringify(propertyType)}`,
          // )
          this._schema[propertyKey] = propertyType
        },
      )
    }

    static async create(values: ModelValues<any>): Promise<Item<any>> {
      const item = new Item<any>(values)
      await item.initialize()
      return item
    }

    static getOriginalClass(): T {
      return this.originalConstructor
    }

    static get schema() {
      return this._schema
    }

    get schema() {
      return this.constructor.prototype._schema
    }
  }

  ModelClass._initializeSchema()

  return ModelClass as T & IModelClass
}
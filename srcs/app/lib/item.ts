import { type Asset, type ComponentSchemas } from './types.js';

export function processRefs(
  schema: ComponentSchemas,
  assets: Asset[],
): [schema: ComponentSchemas, assets: Asset[]] {
  const outputSchema = schema;
  switch (schema.type) {
    case 'div': {
      if (schema.descendants) {
        schema.descendants = schema.descendants.map(
          (descendant) => processRefs(descendant, assets)[0],
        );
      }
      return [outputSchema, assets];
    }
    case 'input': {
      const figure = schema.descendants;
      if (figure) {
        const index = Number(figure.content);
        if (assets.length < index) {
          throw Error;
        }
        assets[index].name = figure.name;
        assets[index].mime = figure.mime;
        figure.content = assets[index].id as string;
      }
      return [outputSchema, assets];
    }
    case 'figure': {
      const index = Number(schema.content);
      if (assets.length < index) {
        throw Error;
      }
      assets[index].name = schema.name;
      assets[index].mime = schema.mime;
      schema.content = assets[index].id as string;
      return [outputSchema, assets];
    }
    case 'break': {
      return [outputSchema, assets];
    }
  }
}

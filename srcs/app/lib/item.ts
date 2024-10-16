import { type Descendant } from 'slate';

import { type Asset } from './types.js';

export function processRefs(
  schema: Descendant,
  assets: Asset[],
): [schema: Descendant, assets: Asset[]] {
  const outputSchema = schema;

  if ('type' in schema) {
    switch (schema.type) {
      case 'heading':
      case 'heading_two':
      case 'check_list_item':
      case 'bulleted_list':
      case 'list_item':
      case 'link':
      case 'code_line':
      case 'code_block': {
        return [outputSchema, assets];
      }
      case 'block_quote':
      case 'button':
      case 'paragraph': {
        if (schema.children) {
          schema.children = schema.children.map(
            (descendant) => processRefs(descendant, assets)[0],
          );
        }
        return [outputSchema, assets];
      }
      case 'image': {
        const index = Number(schema.uuid);
        if (assets.length < index) {
          throw Error;
        }
        assets[index].name = schema.name;
        assets[index].mime = schema.mime;
        schema.uuid = assets[index].id as string;
        return [outputSchema, assets];
      }
      // case 'video': {
      //   // TODO: implement
      //   return [outputSchema, assets];
      // }
      // case 'input': {
      //   const figure = schema.descendants;
      //   if (figure) {
      //     const index = Number(figure.content);
      //     if (assets.length < index) {
      //       throw Error;
      //     }
      //     assets[index].name = figure.name;
      //     assets[index].mime = figure.mime;
      //     figure.content = assets[index].id as string;
      //   }
      //   return [outputSchema, assets];
      // }
    }
  } else {
    return [outputSchema, assets];
  }
}

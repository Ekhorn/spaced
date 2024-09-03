// sum.test.js
import { expect, test } from 'vitest';

import { processRefs } from './item.js';
import { type Asset, type ComponentSchemas } from './types.js';

test('processRefs should write ids to schema and assets', () => {
  const inputSchema: ComponentSchemas = {
    type: 'div',
    name: 'test',
    mime: 'text/plain',
    content: 'test',
    styles: '{ display: none; }',
    descendants: [
      {
        type: 'div',
        name: 'test',
        mime: 'text/plain',
        content: 'test',
        styles: '{ display: none; }',
        descendants: [
          {
            type: 'input',
            name: 'test',
            mime: 'text/plain',
            content: '',
            styles: '{ display: none; }',
            descendants: {
              type: 'figure',
              name: 'test',
              mime: 'image/png',
              content: '3',
              styles: '{ display: none; }',
            },
          },
        ],
      },
      {
        type: 'div',
        name: 'test',
        mime: 'text/plain',
        content: 'test',
        styles: '{ display: none; }',
        descendants: [
          {
            type: 'figure',
            name: 'test',
            mime: 'image/png',
            content: '1',
            styles: '{ display: none; }',
          },
          {
            type: 'figure',
            name: 'test',
            mime: 'image/png',
            content: '2',
            styles: '{ display: none; }',
          },
        ],
      },
      {
        type: 'figure',
        name: 'test',
        mime: 'image/png',
        content: '0',
        styles: '{ display: none; }',
      },
    ],
  };
  const assets = Array.from({ length: 4 }).fill({
    id: crypto.randomUUID(),
    name: 'image',
    mime: '',
    data: [],
  }) as Asset[];
  const [schema, preparedAssets] = processRefs(inputSchema, assets);
  expect(preparedAssets).toHaveLength(4);
  for (const asset of preparedAssets) {
    expect(asset.id).toMatch(
      /[\dA-Fa-f]{8}(?:-[\dA-Fa-f]{4}){3}-[\dA-Fa-f]{12}/,
    );
    expect(asset.name).toBe('test');
    expect(asset.mime).toBe('image/png');
    expect(asset.data).toStrictEqual([]);
  }
  expect(schema).toMatchInlineSnapshot(`
    {
      "content": "test",
      "descendants": [
        {
          "content": "test",
          "descendants": [
            {
              "content": "",
              "descendants": {
                "content": "${assets[3].id}",
                "mime": "image/png",
                "name": "test",
                "styles": "{ display: none; }",
                "type": "figure",
              },
              "mime": "text/plain",
              "name": "test",
              "styles": "{ display: none; }",
              "type": "input",
            },
          ],
          "mime": "text/plain",
          "name": "test",
          "styles": "{ display: none; }",
          "type": "div",
        },
        {
          "content": "test",
          "descendants": [
            {
              "content": "${assets[1].id}",
              "mime": "image/png",
              "name": "test",
              "styles": "{ display: none; }",
              "type": "figure",
            },
            {
              "content": "${assets[2].id}",
              "mime": "image/png",
              "name": "test",
              "styles": "{ display: none; }",
              "type": "figure",
            },
          ],
          "mime": "text/plain",
          "name": "test",
          "styles": "{ display: none; }",
          "type": "div",
        },
        {
          "content": "${assets[0].id}",
          "mime": "image/png",
          "name": "test",
          "styles": "{ display: none; }",
          "type": "figure",
        },
      ],
      "mime": "text/plain",
      "name": "test",
      "styles": "{ display: none; }",
      "type": "div",
    }
  `);
});

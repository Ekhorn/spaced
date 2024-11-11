import { type Descendant } from 'slate';
import { type Asset } from 'types';
import { expect, test } from 'vitest';

import { processRefs } from './item.js';

test('processRefs should write ids to schema and assets', () => {
  const inputSchema: Descendant = {
    type: 'paragraph',
    children: [
      {
        text: 'test',
      },
      {
        type: 'paragraph',
        children: [
          {
            text: 'test',
          },
          {
            type: 'paragraph',
            children: [
              { text: 'test' },
              {
                type: 'image',
                name: 'image',
                mime: 'image/png',
                uuid: '3',
              },
            ],
          },
        ],
      },
      {
        type: 'paragraph',
        children: [
          {
            text: 'test',
          },
          {
            type: 'image',
            name: 'image',
            mime: 'image/png',
            uuid: '1',
          },
          {
            type: 'image',
            name: 'image',
            mime: 'image/png',
            uuid: '2',
          },
        ],
      },
      {
        type: 'image',
        name: 'image',
        mime: 'image/png',
        uuid: '0',
      },
    ],
  };
  const assets = Array.from({ length: 4 }).fill({
    id: crypto.randomUUID(),
    data: [],
  }) as Asset[];
  const [schema, preparedAssets] = processRefs(inputSchema, assets);
  expect(preparedAssets).toHaveLength(4);
  for (const asset of preparedAssets) {
    expect(asset.id).toMatch(
      /[\dA-Fa-f]{8}(?:-[\dA-Fa-f]{4}){3}-[\dA-Fa-f]{12}/,
    );
    expect(asset.name).toBe('image');
    expect(asset.mime).toBe('image/png');
    expect(asset.data).toStrictEqual([]);
  }
  expect(schema).toMatchInlineSnapshot(`
    {
      "children": [
        {
          "text": "test",
        },
        {
          "children": [
            {
              "text": "test",
            },
            {
              "children": [
                {
                  "text": "test",
                },
                {
                  "mime": "image/png",
                  "name": "image",
                  "type": "image",
                  "uuid": "${assets[3].id}",
                },
              ],
              "type": "paragraph",
            },
          ],
          "type": "paragraph",
        },
        {
          "children": [
            {
              "text": "test",
            },
            {
              "mime": "image/png",
              "name": "image",
              "type": "image",
              "uuid": "${assets[1].id}",
            },
            {
              "mime": "image/png",
              "name": "image",
              "type": "image",
              "uuid": "${assets[2].id}",
            },
          ],
          "type": "paragraph",
        },
        {
          "mime": "image/png",
          "name": "image",
          "type": "image",
          "uuid": "${assets[0].id}",
        },
      ],
      "type": "paragraph",
    }
  `);
});

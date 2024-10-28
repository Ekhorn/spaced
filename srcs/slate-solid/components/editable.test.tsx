import { render } from '@solidjs/testing-library';
import { createEditor, Text, Transforms } from 'slate';
import { createEffect } from 'solid-js';
import { expect, test, describe, vi } from 'vitest';

import { Editable } from './editable.js';
import { Slate } from './slate.js';
import { withSolid } from '../plugin/with-solid.js';

describe('slate-solid', () => {
  describe('Editable', () => {
    describe('NODE_TO_KEY logic', () => {
      test('should not unmount the node that gets split on a split_node operation', async () => {
        const editor = withSolid(createEditor());
        const initialValue = [{ type: 'block', children: [{ text: 'test' }] }];

        const mounts = vi.fn();

        render(() => (
          <Slate
            editor={editor}
            initialValue={initialValue}
            onChange={() => {}}
          >
            <Editable
              renderElement={({ children }) => {
                createEffect(() => mounts());

                return children;
              }}
            />
          </Slate>
        ));

        // slate updates at next tick, so we need this to be async
        await Transforms.splitNodes(editor, {
          at: { path: [0, 0], offset: 2 },
        });

        // 3 renders, one for the first element, then 2 for the split elements
        expect(mounts).toHaveBeenCalledTimes(3);
      });

      test('should not unmount the node that gets merged into on a merge_node operation', async () => {
        const editor = withSolid(createEditor());
        const initialValue = [
          { type: 'block', children: [{ text: 'te' }] },
          { type: 'block', children: [{ text: 'st' }] },
        ];

        const mounts = vi.fn();

        render(() => (
          <Slate
            editor={editor}
            initialValue={initialValue}
            onChange={() => {}}
          >
            <Editable
              renderElement={({ children }) => {
                createEffect(() => mounts());

                return children;
              }}
            />
          </Slate>
        ));

        // slate updates at next tick, so we need this to be async
        await Transforms.mergeNodes(editor, {
          at: { path: [0, 0], offset: 0 },
        });

        // only 2 renders for the initial render
        expect(mounts).toHaveBeenCalledTimes(2);
      });
    });

    test('calls onSelectionChange when editor select change', async () => {
      const editor = withSolid(createEditor());
      const initialValue = [
        { type: 'block', children: [{ text: 'te' }] },
        { type: 'block', children: [{ text: 'st' }] },
      ];

      const onChange = vi.fn();
      const onValueChange = vi.fn();
      const onSelectionChange = vi.fn();

      render(() => (
        <Slate
          editor={editor}
          initialValue={initialValue}
          onChange={onChange}
          onValueChange={onValueChange}
          onSelectionChange={onSelectionChange}
        >
          <Editable />
        </Slate>
      ));

      await Transforms.select(editor, { path: [0, 0], offset: 2 });

      expect(onSelectionChange).toHaveBeenCalled();
      expect(onChange).toHaveBeenCalled();
      expect(onValueChange).not.toHaveBeenCalled();
    });

    test('calls onValueChange when editor children change', async () => {
      const editor = withSolid(createEditor());
      const initialValue = [{ type: 'block', children: [{ text: 'test' }] }];

      const onChange = vi.fn();
      const onValueChange = vi.fn();
      const onSelectionChange = vi.fn();

      render(() => (
        <Slate
          editor={editor}
          initialValue={initialValue}
          onChange={onChange}
          onValueChange={onValueChange}
          onSelectionChange={onSelectionChange}
        >
          <Editable />
        </Slate>
      ));

      await Transforms.insertText(editor, 'Hello word!');

      expect(onValueChange).toHaveBeenCalled();
      expect(onChange).toHaveBeenCalled();
      expect(onSelectionChange).not.toHaveBeenCalled();
    });

    test('calls onValueChange when editor setNodes', async () => {
      const editor = withSolid(createEditor());
      const initialValue = [{ type: 'block', children: [{ text: 'test' }] }];

      const onChange = vi.fn();
      const onValueChange = vi.fn();
      const onSelectionChange = vi.fn();

      render(() => (
        <Slate
          editor={editor}
          initialValue={initialValue}
          onChange={onChange}
          onValueChange={onValueChange}
          onSelectionChange={onSelectionChange}
        >
          <Editable />
        </Slate>
      ));

      await Transforms.setNodes(
        editor,
        { bold: true },
        {
          at: { path: [0, 0], offset: 2 },
          match: Text.isText,
          split: true,
        },
      );

      expect(onChange).toHaveBeenCalled();
      expect(onValueChange).toHaveBeenCalled();
      expect(onSelectionChange).not.toHaveBeenCalled();
    });

    test('calls onValueChange when editor children change', async () => {
      const editor = withSolid(createEditor());
      const initialValue = [{ type: 'block', children: [{ text: 'test' }] }];

      const onChange = vi.fn();
      const onValueChange = vi.fn();
      const onSelectionChange = vi.fn();

      render(() => (
        <Slate
          editor={editor}
          initialValue={initialValue}
          onChange={onChange}
          onValueChange={onValueChange}
          onSelectionChange={onSelectionChange}
        >
          <Editable />
        </Slate>
      ));

      await Transforms.insertText(editor, 'Hello word!');

      expect(onValueChange).toHaveBeenCalled();
      expect(onChange).toHaveBeenCalled();
      expect(onSelectionChange).not.toHaveBeenCalled();
    });
  });
});

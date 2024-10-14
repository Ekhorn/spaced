/* eslint-disable unicorn/no-null */
import { render } from '@solidjs/testing-library';
import { createEditor, Transforms } from 'slate';
import { expect, test, describe, vi } from 'vitest';

import { Editable } from './editable.js';
import { Slate } from './slate.js';
import { SolidEditor } from '../plugin/solid-editor.js';
import { withSolid } from '../plugin/with-solid.js';

describe('slate-solid', () => {
  describe('SolidEditor', () => {
    describe('.focus', () => {
      test('should set focus in top of document with no editor selection', async () => {
        const editor = withSolid(createEditor());
        const initialValue = [{ type: 'block', children: [{ text: 'test' }] }];

        const testSelection = {
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [0, 0], offset: 0 },
        };

        render(() => (
          <Slate editor={editor} initialValue={initialValue}>
            {/* @ts-expect-error TODO: resolve */}
            <Editable />
          </Slate>
        ));

        expect(editor.selection).toBe(null);

        // Await .focus to wait setTimeout
        await SolidEditor.focus(editor);

        expect(editor.selection).toEqual(testSelection);

        const windowSelection = SolidEditor.getWindow(editor).getSelection();
        expect(windowSelection?.focusNode?.textContent).toBe('test');
        expect(windowSelection?.anchorNode?.textContent).toBe('test');
        expect(windowSelection?.anchorOffset).toBe(testSelection.anchor.offset);
        expect(windowSelection?.focusOffset).toBe(testSelection.focus.offset);
      });

      test('should be able to call .focus without getting toDOMNode errors', async () => {
        const editor = withSolid(createEditor());
        const initialValue = [{ type: 'block', children: [{ text: 'test' }] }];

        const propagatedValue = [
          { type: 'block', children: [{ text: 'foo' }] },
          { type: 'block', children: [{ text: 'bar' }] },
        ];

        const testSelection = {
          anchor: { path: [1, 0], offset: 0 },
          focus: { path: [1, 0], offset: 3 },
        };

        render(() => (
          <Slate editor={editor} initialValue={initialValue}>
            {/* @ts-expect-error TODO: resolve */}
            <Editable />
          </Slate>
        ));

        Transforms.removeNodes(editor, { at: [0] });
        Transforms.insertNodes(editor, propagatedValue);
        SolidEditor.focus(editor); // Note: calling focus in the middle of these transformations.
        Transforms.select(editor, testSelection);

        expect(editor.selection).toEqual(testSelection);

        SolidEditor.focus(editor);

        // Call timeout after .focus to wait for .focus timeout
        setTimeout(() => {
          const windowSelection = SolidEditor.getWindow(editor).getSelection();
          expect(windowSelection?.focusNode?.textContent).toBe('bar');
          expect(windowSelection?.anchorNode?.textContent).toBe('bar');
          expect(windowSelection?.anchorOffset).toBe(
            testSelection.anchor.offset,
          );
          expect(windowSelection?.focusOffset).toBe(testSelection.focus.offset);
        }, 100);
      });

      test('should not trigger onValueChange when focus is called', async () => {
        const editor = withSolid(createEditor());
        const initialValue = [{ type: 'block', children: [{ text: 'test' }] }];

        const onChange = vi.fn();
        const onValueChange = vi.fn();
        const onSlectionChange = vi.fn();

        render(() => (
          <Slate
            editor={editor}
            initialValue={initialValue}
            onValueChange={onValueChange}
            onChange={onChange}
            onSelectionChange={onSlectionChange}
          >
            {/* @ts-expect-error TODO: resolve */}
            <Editable />
          </Slate>
        ));

        expect(editor.selection).toBe(null);

        // Await .focus to wait setTimeout
        await SolidEditor.focus(editor);

        expect(editor.selection).toEqual({
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [0, 0], offset: 0 },
        });

        expect(onChange).toHaveBeenCalled();
        expect(onSlectionChange).toHaveBeenCalled();
        expect(onValueChange).not.toHaveBeenCalled();
      });
    });
  });
});

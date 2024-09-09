import {
  type Node,
  type Path,
  type Point,
  type BaseEditor,
  Range,
  Editor,
  Element,
  Scrubber,
  Transforms,
} from 'slate';

import { type TextDiff } from '../utils/diff-text.js';
import {
  type DOMElement,
  type DOMPoint,
  type DOMRange,
  type DOMSelection,
  type DOMStaticRange,
  type DOMNode,
  hasShadowRoot,
  isDOMElement,
  isDOMNode,
  isDOMSelection,
  normalizeDOMPoint,
  DOMText,
  getSelection,
} from '../utils/dom.js';
import { IS_ANDROID, IS_CHROME, IS_FIREFOX } from '../utils/environment.js';
import { Key } from '../utils/key.js';
import {
  EDITOR_TO_ELEMENT,
  EDITOR_TO_KEY_TO_ELEMENT,
  EDITOR_TO_PENDING_DIFFS,
  EDITOR_TO_SCHEDULE_FLUSH,
  EDITOR_TO_WINDOW,
  ELEMENT_TO_NODE,
  IS_COMPOSING,
  IS_FOCUSED,
  IS_READ_ONLY,
  NODE_TO_INDEX,
  NODE_TO_KEY,
  NODE_TO_PARENT,
} from '../utils/weakmaps.js';

/**
 * A React and DOM-specific version of the `Editor` interface.
 */
export interface SolidEditor extends BaseEditor {
  hasEditableTarget: (
    editor: SolidEditor,
    target: EventTarget | null,
  ) => target is DOMNode;
  hasRange: (editor: SolidEditor, range: Range) => boolean;
  hasSelectableTarget: (
    editor: SolidEditor,
    target: EventTarget | null,
  ) => boolean;
  hasTarget: (
    editor: SolidEditor,
    target: EventTarget | null,
  ) => target is DOMNode;
  insertData: (data: DataTransfer) => void;
  insertFragmentData: (data: DataTransfer) => boolean;
  insertTextData: (data: DataTransfer) => boolean;
  isTargetInsideNonReadonlyVoid: (
    editor: SolidEditor,
    target: EventTarget | null,
  ) => boolean;
  setFragmentData: (
    data: DataTransfer,
    originEvent?: 'drag' | 'copy' | 'cut',
  ) => void;
}

export interface SolidEditorInterface {
  /**
   * Experimental and android specific: Get pending diffs
   */
  androidPendingDiffs: (editor: Editor) => TextDiff[] | undefined;

  /**
   * Experimental and android specific: Flush all pending diffs and cancel composition at the next possible time.
   */
  androidScheduleFlush: (editor: Editor) => void;

  /**
   * Blur the editor.
   */
  blur: (editor: SolidEditor) => void;

  /**
   * Deselect the editor.
   */
  deselect: (editor: SolidEditor) => void;

  /**
   * Find the DOM node that implements DocumentOrShadowRoot for the editor.
   */
  findDocumentOrShadowRoot: (editor: SolidEditor) => Document | ShadowRoot;

  /**
   * Get the target range from a DOM `event`.
   */
  findEventRange: (editor: SolidEditor, event: any) => Range;

  /**
   * Find a key for a Slate node.
   */
  findKey: (editor: SolidEditor, node: Node) => Key;

  /**
   * Find the path of Slate node.
   */
  findPath: (editor: SolidEditor, node: Node) => Path;

  /**
   * Focus the editor.
   */
  focus: (editor: SolidEditor, options?: { retries: number }) => void;

  /**
   * Return the host window of the current editor.
   */
  getWindow: (editor: SolidEditor) => Window;

  /**
   * Check if a DOM node is within the editor.
   */
  hasDOMNode: (
    editor: SolidEditor,
    target: DOMNode,
    options?: { editable?: boolean },
  ) => boolean;

  /**
   * Check if the target is editable and in the editor.
   */
  hasEditableTarget: (
    editor: SolidEditor,
    target: EventTarget | null,
  ) => target is DOMNode;

  /**
   *
   */
  hasRange: (editor: SolidEditor, range: Range) => boolean;

  /**
   * Check if the target can be selectable
   */
  hasSelectableTarget: (
    editor: SolidEditor,
    target: EventTarget | null,
  ) => boolean;

  /**
   * Check if the target is in the editor.
   */
  hasTarget: (
    editor: SolidEditor,
    target: EventTarget | null,
  ) => target is DOMNode;

  /**
   * Insert data from a `DataTransfer` into the editor.
   */
  insertData: (editor: SolidEditor, data: DataTransfer) => void;

  /**
   * Insert fragment data from a `DataTransfer` into the editor.
   */
  insertFragmentData: (editor: SolidEditor, data: DataTransfer) => boolean;

  /**
   * Insert text data from a `DataTransfer` into the editor.
   */
  insertTextData: (editor: SolidEditor, data: DataTransfer) => boolean;

  /**
   * Check if the user is currently composing inside the editor.
   */
  isComposing: (editor: SolidEditor) => boolean;

  /**
   * Check if the editor is focused.
   */
  isFocused: (editor: SolidEditor) => boolean;

  /**
   * Check if the editor is in read-only mode.
   */
  isReadOnly: (editor: SolidEditor) => boolean;

  /**
   * Check if the target is inside void and in an non-readonly editor.
   */
  isTargetInsideNonReadonlyVoid: (
    editor: SolidEditor,
    target: EventTarget | null,
  ) => boolean;

  /**
   * Sets data from the currently selected fragment on a `DataTransfer`.
   */
  setFragmentData: (
    editor: SolidEditor,
    data: DataTransfer,
    originEvent?: 'drag' | 'copy' | 'cut',
  ) => void;

  /**
   * Find the native DOM element from a Slate node.
   */
  toDOMNode: (editor: SolidEditor, node: Node) => HTMLElement;

  /**
   * Find a native DOM selection point from a Slate point.
   */
  toDOMPoint: (editor: SolidEditor, point: Point) => DOMPoint;

  /**
   * Find a native DOM range from a Slate `range`.
   *
   * Notice: the returned range will always be ordinal regardless of the direction of Slate `range` due to DOM API limit.
   *
   * there is no way to create a reverse DOM Range using Range.setStart/setEnd
   * according to https://dom.spec.whatwg.org/#concept-range-bp-set.
   */
  toDOMRange: (editor: SolidEditor, range: Range) => DOMRange;

  /**
   * Find a Slate node from a native DOM `element`.
   */
  toSlateNode: (editor: SolidEditor, domNode: DOMNode) => Node;

  /**
   * Find a Slate point from a DOM selection's `domNode` and `domOffset`.
   */
  toSlatePoint: <T extends boolean>(
    editor: SolidEditor,
    domPoint: DOMPoint,
    options: {
      exactMatch: boolean;
      suppressThrow: T;
    },
  ) => T extends true ? Point | null : Point;

  /**
   * Find a Slate range from a DOM range or selection.
   */
  toSlateRange: <T extends boolean>(
    editor: SolidEditor,
    domRange: DOMRange | DOMStaticRange | DOMSelection,
    options: {
      exactMatch: boolean;
      suppressThrow: T;
    },
  ) => T extends true ? Range | null : Range;
}

export const SolidEditor: SolidEditorInterface = {
  androidPendingDiffs: (editor) => EDITOR_TO_PENDING_DIFFS.get(editor),

  androidScheduleFlush: (editor) => {
    EDITOR_TO_SCHEDULE_FLUSH.get(editor)?.();
  },

  blur: (editor) => {
    const el = SolidEditor.toDOMNode(editor, editor);
    const root = SolidEditor.findDocumentOrShadowRoot(editor);
    IS_FOCUSED.set(editor, false);

    if (root.activeElement === el) {
      el.blur();
    }
  },

  deselect: (editor) => {
    const { selection } = editor;
    const root = SolidEditor.findDocumentOrShadowRoot(editor);
    const domSelection = getSelection(root);

    if (domSelection && domSelection.rangeCount > 0) {
      domSelection.removeAllRanges();
    }

    if (selection) {
      Transforms.deselect(editor);
    }
  },

  findDocumentOrShadowRoot: (editor) => {
    const el = SolidEditor.toDOMNode(editor, editor);
    const root = el.getRootNode();

    if (root instanceof Document || root instanceof ShadowRoot) {
      return root;
    }

    return el.ownerDocument;
  },

  findEventRange: (editor, event) => {
    if ('nativeEvent' in event) {
      event = event.nativeEvent;
    }

    const { clientX: x, clientY: y, target } = event;

    if (x == undefined || y == undefined) {
      throw new Error(
        `Cannot resolve a Slate range from a DOM event: ${event}`,
      );
    }

    const node = SolidEditor.toSlateNode(editor, event.target);
    const path = SolidEditor.findPath(editor, node);

    // If the drop target is inside a void node, move it into either the
    // next or previous node, depending on which side the `x` and `y`
    // coordinates are closest to.
    if (Element.isElement(node) && Editor.isVoid(editor, node)) {
      const rect = target.getBoundingClientRect();
      const isPrev = editor.isInline(node)
        ? x - rect.left < rect.left + rect.width - x
        : y - rect.top < rect.top + rect.height - y;

      const edge = Editor.point(editor, path, {
        edge: isPrev ? 'start' : 'end',
      });
      const point = isPrev
        ? Editor.before(editor, edge)
        : Editor.after(editor, edge);

      if (point) {
        const range = Editor.range(editor, point);
        return range;
      }
    }

    // Else resolve a range from the caret position where the drop occured.
    let domRange;
    const { document } = SolidEditor.getWindow(editor);

    // COMPAT: In Firefox, `caretRangeFromPoint` doesn't exist. (2016/07/25)
    if (document.caretRangeFromPoint) {
      domRange = document.caretRangeFromPoint(x, y);
    } else {
      const position = document.caretPositionFromPoint(x, y);

      if (position) {
        domRange = document.createRange();
        domRange.setStart(position.offsetNode, position.offset);
        domRange.setEnd(position.offsetNode, position.offset);
      }
    }

    if (!domRange) {
      throw new Error(
        `Cannot resolve a Slate range from a DOM event: ${event}`,
      );
    }

    // Resolve a Slate range from the DOM range.
    const range = SolidEditor.toSlateRange(editor, domRange, {
      exactMatch: false,
      suppressThrow: false,
    });
    return range;
  },

  findKey: (editor, node: Node) => {
    let key = NODE_TO_KEY.get(node);

    if (!key) {
      key = new Key();
      NODE_TO_KEY.set(node, key);
    }

    return key;
  },

  findPath: (editor, node: Node) => {
    const path: Path = [];
    let child = node;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const parent = NODE_TO_PARENT.get(child);

      if (parent == undefined) {
        if (Editor.isEditor(child)) {
          return path;
        } else {
          break;
        }
      }

      const i = NODE_TO_INDEX.get(child);

      if (i == undefined) {
        break;
      }

      path.unshift(i);
      child = parent;
    }

    throw new Error(
      `Unable to find the path for Slate node: ${Scrubber.stringify(node)}`,
    );
  },

  // eslint-disable-next-line unicorn/no-object-as-default-parameter
  focus: (editor, options = { retries: 5 }) => {
    // Return if already focused
    if (IS_FOCUSED.get(editor)) {
      return;
    }

    // Retry setting focus if the editor has pending operations.
    // The DOM (selection) is unstable while changes are applied.
    // Retry until retries are exhausted or editor is focused.
    if (options.retries <= 0) {
      throw new Error(
        'Could not set focus, editor seems stuck with pending operations',
      );
    }
    if (editor.operations.length > 0) {
      setTimeout(() => {
        SolidEditor.focus(editor, { retries: options.retries - 1 });
      }, 10);
      return;
    }

    const el = SolidEditor.toDOMNode(editor, editor);
    const root = SolidEditor.findDocumentOrShadowRoot(editor);
    if (root.activeElement !== el) {
      // Ensure that the DOM selection state is set to the editor's selection
      if (editor.selection && root instanceof Document) {
        const domSelection = getSelection(root);
        const domRange = SolidEditor.toDOMRange(editor, editor.selection);
        domSelection?.removeAllRanges();
        domSelection?.addRange(domRange);
      }
      // Create a new selection in the top of the document if missing
      if (!editor.selection) {
        Transforms.select(editor, Editor.start(editor, []));
      }
      // IS_FOCUSED should be set before calling el.focus() to ensure that
      // FocusedContext is updated to the correct value
      IS_FOCUSED.set(editor, true);
      el.focus({ preventScroll: true });
    }
  },

  getWindow: (editor) => {
    const window = EDITOR_TO_WINDOW.get(editor);
    if (!window) {
      throw new Error('Unable to find a host window element for this editor');
    }
    return window;
  },

  hasDOMNode: (editor, target, options = {}) => {
    const { editable = false } = options;
    const editorEl = SolidEditor.toDOMNode(editor, editor);
    let targetEl;

    // COMPAT: In Firefox, reading `target.nodeType` will throw an error if
    // target is originating from an internal "restricted" element (e.g. a
    // stepper arrow on a number input). (2018/05/04)
    // https://github.com/ianstormtaylor/slate/issues/1819
    try {
      targetEl = (
        isDOMElement(target) ? target : target.parentElement
      ) as HTMLElement;
    } catch (error) {
      if (
        error instanceof Error &&
        !error.message.includes(
          'Permission denied to access property "nodeType"',
        )
      ) {
        throw error;
      }
    }

    if (!targetEl) {
      return false;
    }

    return (
      targetEl.closest(`[data-slate-editor]`) === editorEl &&
      (!editable || targetEl.isContentEditable
        ? true
        : (typeof targetEl.isContentEditable === 'boolean' && // isContentEditable exists only on HTMLElement, and on other nodes it will be undefined
            // this is the core logic that lets you know you got the right editor.selection instead of null when editor is contenteditable="false"(readOnly)
            targetEl.closest('[contenteditable="false"]') === editorEl) ||
          !!targetEl.dataset.slateZeroWidth)
    );
  },

  hasEditableTarget: (editor, target): target is DOMNode =>
    isDOMNode(target) &&
    SolidEditor.hasDOMNode(editor, target, { editable: true }),

  hasRange: (editor, range) => {
    const { anchor, focus } = range;
    return (
      Editor.hasPath(editor, anchor.path) && Editor.hasPath(editor, focus.path)
    );
  },

  hasSelectableTarget: (editor, target) =>
    SolidEditor.hasEditableTarget(editor, target) ||
    SolidEditor.isTargetInsideNonReadonlyVoid(editor, target),

  hasTarget: (editor, target): target is DOMNode =>
    isDOMNode(target) && SolidEditor.hasDOMNode(editor, target),

  insertData: (editor, data) => {
    editor.insertData(data);
  },

  insertFragmentData: (editor, data) => editor.insertFragmentData(data),

  insertTextData: (editor, data) => editor.insertTextData(data),

  isComposing: (editor) => {
    return !!IS_COMPOSING.get(editor);
  },

  isFocused: (editor) => !!IS_FOCUSED.get(editor),

  isReadOnly: (editor) => !!IS_READ_ONLY.get(editor),

  isTargetInsideNonReadonlyVoid: (editor, target) => {
    if (IS_READ_ONLY.get(editor)) return false;

    const slateNode =
      SolidEditor.hasTarget(editor, target) &&
      SolidEditor.toSlateNode(editor, target);
    return Element.isElement(slateNode) && Editor.isVoid(editor, slateNode);
  },

  setFragmentData: (editor, data, originEvent) =>
    editor.setFragmentData(data, originEvent),

  toDOMNode: (editor, node: Node) => {
    const KEY_TO_ELEMENT = EDITOR_TO_KEY_TO_ELEMENT.get(editor);

    const domNode = Editor.isEditor(node)
      ? EDITOR_TO_ELEMENT.get(editor)
      : KEY_TO_ELEMENT?.get(SolidEditor.findKey(editor, node));

    // console.trace('test');
    if (!domNode) {
      throw new Error(
        `Cannot resolve a DOM node from Slate node: ${Scrubber.stringify(node)}`,
      );
    }

    return domNode;
  },

  toDOMPoint: (editor, point) => {
    const [node] = Editor.node(editor, point.path);
    const el = SolidEditor.toDOMNode(editor, node);
    let domPoint: DOMPoint | undefined;

    // If we're inside a void node, force the offset to 0, otherwise the zero
    // width spacing character will result in an incorrect offset of 1
    if (Editor.void(editor, { at: point })) {
      point = { path: point.path, offset: 0 };
    }

    // For each leaf, we need to isolate its content, which means filtering
    // to its direct text and zero-width spans. (We have to filter out any
    // other siblings that may have been rendered alongside them.)
    const selector = `[data-slate-string], [data-slate-zero-width]`;
    const texts = [...el.querySelectorAll(selector)];
    let start = 0;

    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      const domNode = text.childNodes[0] as HTMLElement;

      if (domNode == undefined || domNode.textContent == undefined) {
        continue;
      }

      const { length } = domNode.textContent;
      const attr = text.dataset.slateLength;
      const trueLength = attr == undefined ? length : Number.parseInt(attr, 10);
      const end = start + trueLength;

      // Prefer putting the selection inside the mark placeholder to ensure
      // composed text is displayed with the correct marks.
      const nextText = texts[i + 1];
      if (
        point.offset === end &&
        nextText?.hasAttribute('data-slate-mark-placeholder')
      ) {
        const domText = nextText.childNodes[0];

        domPoint = [
          // COMPAT: If we don't explicity set the dom point to be on the actual
          // dom text element, chrome will put the selection behind the actual dom
          // text element, causing domRange.getBoundingClientRect() calls on a collapsed
          // selection to return incorrect zero values (https://bugs.chromium.org/p/chromium/issues/detail?id=435438)
          // which will cause issues when scrolling to it.
          domText instanceof DOMText ? domText : nextText,
          nextText.textContent?.startsWith('\uFEFF') ? 1 : 0,
        ];
        break;
      }

      if (point.offset <= end) {
        const offset = Math.min(length, Math.max(0, point.offset - start));
        domPoint = [domNode, offset];
        break;
      }

      start = end;
    }

    if (!domPoint) {
      throw new Error(
        `Cannot resolve a DOM point from Slate point: ${Scrubber.stringify(
          point,
        )}`,
      );
    }

    return domPoint;
  },

  toDOMRange: (editor, range) => {
    const { anchor, focus } = range;
    const isBackward = Range.isBackward(range);
    const domAnchor = SolidEditor.toDOMPoint(editor, anchor);
    const domFocus = Range.isCollapsed(range)
      ? domAnchor
      : SolidEditor.toDOMPoint(editor, focus);

    const window = SolidEditor.getWindow(editor);
    const domRange = window.document.createRange();
    const [startNode, startOffset] = isBackward ? domFocus : domAnchor;
    const [endNode, endOffset] = isBackward ? domAnchor : domFocus;

    // A slate Point at zero-width Leaf always has an offset of 0 but a native DOM selection at
    // zero-width node has an offset of 1 so we have to check if we are in a zero-width node and
    // adjust the offset accordingly.
    const startEl = (
      isDOMElement(startNode) ? startNode : startNode.parentElement
    ) as HTMLElement;
    const isStartAtZeroWidth = !!startEl.dataset.slateZeroWidth;
    const endEl = (
      isDOMElement(endNode) ? endNode : endNode.parentElement
    ) as HTMLElement;
    const isEndAtZeroWidth = !!endEl.dataset.slateZeroWidth;

    domRange.setStart(startNode, isStartAtZeroWidth ? 1 : startOffset);
    domRange.setEnd(endNode, isEndAtZeroWidth ? 1 : endOffset);
    return domRange;
  },

  toSlateNode: (editor, domNode: DOMNode) => {
    let domEl = isDOMElement(domNode) ? domNode : domNode.parentElement;

    // eslint-disable-next-line unicorn/prefer-dom-node-dataset
    if (domEl && !domEl.hasAttribute('data-slate-node')) {
      domEl = domEl.closest(`[data-slate-node]`);
    }

    const node = domEl ? ELEMENT_TO_NODE.get(domEl as HTMLElement) : null;

    if (!node) {
      throw new Error(`Cannot resolve a Slate node from DOM node: ${domEl}`);
    }

    return node;
  },

  toSlatePoint: <T extends boolean>(
    editor: SolidEditor,
    domPoint: DOMPoint,
    options: {
      exactMatch: boolean;
      suppressThrow: T;
    },
  ): T extends true ? Point | null : Point => {
    const { exactMatch, suppressThrow } = options;
    const [nearestNode, nearestOffset] = exactMatch
      ? domPoint
      : normalizeDOMPoint(domPoint);
    const parentNode = nearestNode.parentNode as DOMElement;
    let textNode: DOMElement | null = null;
    let offset = 0;

    if (parentNode) {
      const editorEl = SolidEditor.toDOMNode(editor, editor);
      const potentialVoidNode = parentNode.closest('[data-slate-void="true"]');
      // Need to ensure that the closest void node is actually a void node
      // within this editor, and not a void node within some parent editor. This can happen
      // if this editor is within a void node of another editor ("nested editors", like in
      // the "Editable Voids" example on the docs site).
      const voidNode =
        potentialVoidNode && editorEl.contains(potentialVoidNode)
          ? potentialVoidNode
          : null;
      let leafNode = parentNode.closest('[data-slate-leaf]');
      let domNode: DOMElement | null = null;

      // Calculate how far into the text node the `nearestNode` is, so that we
      // can determine what the offset relative to the text node is.
      if (leafNode) {
        textNode = leafNode.closest('[data-slate-node="text"]');

        if (textNode) {
          const window = SolidEditor.getWindow(editor);
          const range = window.document.createRange();
          range.setStart(textNode, 0);
          range.setEnd(nearestNode, nearestOffset);

          const contents = range.cloneContents();
          const removals = [
            ...Array.prototype.slice.call(
              contents.querySelectorAll('[data-slate-zero-width]'),
            ),
            ...Array.prototype.slice.call(
              contents.querySelectorAll('[contenteditable=false]'),
            ),
          ];

          for (const el of removals) {
            // COMPAT: While composing at the start of a text node, some keyboards put
            // the text content inside the zero width space.
            if (
              IS_ANDROID &&
              !exactMatch &&
              Object.hasOwn(el.dataset, 'slateZeroWidth') &&
              el.textContent.length > 0 &&
              el.textContext !== '\uFEFF'
            ) {
              if (el.textContent.startsWith('\uFEFF')) {
                el.textContent = el.textContent.slice(1);
              }

              continue;
            }

            el.remove();
          }

          // COMPAT: Edge has a bug where Range.prototype.toString() will
          // convert \n into \r\n. The bug causes a loop when slate-react
          // attempts to reposition its cursor to match the native position. Use
          // textContent.length instead.
          // https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/10291116/
          offset = contents.textContent!.length;
          domNode = textNode;
        }
      } else if (voidNode) {
        // For void nodes, the element with the offset key will be a cousin, not an
        // ancestor, so find it by going down from the nearest void parent and taking the
        // first one that isn't inside a nested editor.
        const leafNodes = voidNode.querySelectorAll('[data-slate-leaf]');
        for (const current of leafNodes) {
          if (SolidEditor.hasDOMNode(editor, current)) {
            leafNode = current;
            break;
          }
        }

        // COMPAT: In read-only editors the leaf is not rendered.
        if (leafNode) {
          textNode = leafNode.closest('[data-slate-node="text"]')!;
          domNode = leafNode;
          offset = domNode.textContent!.length;
          for (const el of domNode.querySelectorAll(
            '[data-slate-zero-width]',
          )) {
            offset -= el.textContent!.length;
          }
        } else {
          offset = 1;
        }
      }

      if (
        domNode &&
        offset === domNode.textContent!.length &&
        // COMPAT: Android IMEs might remove the zero width space while composing,
        // and we don't add it for line-breaks.
        IS_ANDROID &&
        domNode.dataset.slateZeroWidth === 'z' &&
        domNode.textContent?.startsWith('\uFEFF') &&
        // COMPAT: If the parent node is a Slate zero-width space, editor is
        // because the text node should have no characters. However, during IME
        // composition the ASCII characters will be prepended to the zero-width
        // space, so subtract 1 from the offset to account for the zero-width
        // space character.
        (Object.hasOwn(parentNode.dataset, 'slateZeroWidth') ||
          // COMPAT: In Firefox, `range.cloneContents()` returns an extra trailing '\n'
          // when the document ends with a new-line character. This results in the offset
          // length being off by one, so we need to subtract one to account for this.
          (IS_FIREFOX && domNode.textContent?.endsWith('\n\n')))
      ) {
        offset--;
      }
    }

    if (IS_ANDROID && !textNode && !exactMatch) {
      const node = Object.hasOwn(parentNode.dataset, 'slateNode')
        ? parentNode
        : parentNode.closest('[data-slate-node]');

      if (node && SolidEditor.hasDOMNode(editor, node, { editable: true })) {
        const slateNode = SolidEditor.toSlateNode(editor, node);
        let { offset, path } = Editor.start(
          editor,
          SolidEditor.findPath(editor, slateNode),
        );

        if (!node.querySelector('[data-slate-leaf]')) {
          offset = nearestOffset;
        }

        return { path, offset } as T extends true ? Point | null : Point;
      }
    }

    if (!textNode) {
      if (suppressThrow) {
        return null as T extends true ? Point | null : Point;
      }
      throw new Error(
        `Cannot resolve a Slate point from DOM point: ${domPoint}`,
      );
    }

    // COMPAT: If someone is clicking from one Slate editor into another,
    // the select event fires twice, once for the old editor's `element`
    // first, and then afterwards for the correct `element`. (2017/03/03)
    const slateNode = SolidEditor.toSlateNode(editor, textNode!);
    const path = SolidEditor.findPath(editor, slateNode);
    return { path, offset } as T extends true ? Point | null : Point;
  },

  toSlateRange: <T extends boolean>(
    editor: SolidEditor,
    domRange: DOMRange | DOMStaticRange | DOMSelection,
    options: {
      exactMatch: boolean;
      suppressThrow: T;
    },
  ): T extends true ? Range | null : Range => {
    const { exactMatch, suppressThrow } = options;
    const el = isDOMSelection(domRange)
      ? domRange.anchorNode
      : domRange.startContainer;
    let anchorNode;
    let anchorOffset;
    let focusNode;
    let focusOffset;
    let isCollapsed;

    if (el) {
      if (isDOMSelection(domRange)) {
        // COMPAT: In firefox the normal seletion way does not work
        // (https://github.com/ianstormtaylor/slate/pull/5486#issue-1820720223)
        if (IS_FIREFOX && domRange.rangeCount > 1) {
          focusNode = domRange.focusNode; // Focus node works fine
          const firstRange = domRange.getRangeAt(0);
          const lastRange = domRange.getRangeAt(domRange.rangeCount - 1);

          // Here we are in the contenteditable mode of a table in firefox
          if (
            focusNode instanceof HTMLTableRowElement &&
            firstRange.startContainer instanceof HTMLTableRowElement &&
            lastRange.startContainer instanceof HTMLTableRowElement
          ) {
            // HTMLElement, becouse Element is a slate element
            function getLastChildren(element: HTMLElement): HTMLElement {
              return element.childElementCount > 0
                ? getLastChildren(<HTMLElement>element.children[0])
                : element;
            }

            const firstNodeRow = <HTMLTableRowElement>firstRange.startContainer;
            const lastNodeRow = <HTMLTableRowElement>lastRange.startContainer;

            // This should never fail as "The HTMLElement interface represents any HTML element."
            const firstNode = getLastChildren(
              <HTMLElement>firstNodeRow.children[firstRange.startOffset],
            );
            const lastNode = getLastChildren(
              <HTMLElement>lastNodeRow.children[lastRange.startOffset],
            );

            // Zero, as we allways take the right one as the anchor point
            focusOffset = 0;

            anchorNode =
              lastNode.childNodes.length > 0
                ? lastNode.childNodes[0]
                : lastNode;

            focusNode =
              firstNode.childNodes.length > 0
                ? firstNode.childNodes[0]
                : firstNode;

            // eslint-disable-next-line unicorn/prefer-ternary
            if (lastNode instanceof HTMLElement) {
              anchorOffset = (<HTMLElement>lastNode).innerHTML.length;
            } else {
              // Fallback option
              anchorOffset = 0;
            }
          } else {
            // This is the read only mode of a firefox table
            // Right to left
            if (firstRange.startContainer === focusNode) {
              anchorNode = lastRange.endContainer;
              anchorOffset = lastRange.endOffset;
              focusOffset = firstRange.startOffset;
            } else {
              // Left to right
              anchorNode = firstRange.startContainer;
              anchorOffset = firstRange.endOffset;
              focusOffset = lastRange.startOffset;
            }
          }
        } else {
          anchorNode = domRange.anchorNode;
          anchorOffset = domRange.anchorOffset;
          focusNode = domRange.focusNode;
          focusOffset = domRange.focusOffset;
        }

        // COMPAT: There's a bug in chrome that always returns `true` for
        // `isCollapsed` for a Selection that comes from a ShadowRoot.
        // (2020/08/08)
        // https://bugs.chromium.org/p/chromium/issues/detail?id=447523
        // IsCollapsed might not work in firefox, but this will
        isCollapsed =
          (IS_CHROME && hasShadowRoot(anchorNode)) || IS_FIREFOX
            ? domRange.anchorNode === domRange.focusNode &&
              domRange.anchorOffset === domRange.focusOffset
            : domRange.isCollapsed;
      } else {
        anchorNode = domRange.startContainer;
        anchorOffset = domRange.startOffset;
        focusNode = domRange.endContainer;
        focusOffset = domRange.endOffset;
        isCollapsed = domRange.collapsed;
      }
    }

    if (
      anchorNode == undefined ||
      focusNode == undefined ||
      anchorOffset == undefined ||
      focusOffset == undefined
    ) {
      throw new Error(
        `Cannot resolve a Slate range from DOM range: ${domRange}`,
      );
    }

    // COMPAT: Firefox sometimes includes an extra \n (rendered by TextString
    // when isTrailing is true) in the focusOffset, resulting in an invalid
    // Slate point. (2023/11/01)
    if (
      IS_FIREFOX &&
      focusNode.textContent?.endsWith('\n\n') &&
      focusOffset === focusNode.textContent.length
    ) {
      focusOffset--;
    }

    // COMPAT: Triple-clicking a word in chrome will sometimes place the focus
    // inside a `contenteditable="false"` DOM node following the word, which
    // will cause `toSlatePoint` to throw an error. (2023/03/07)
    if (
      'getAttribute' in focusNode &&
      (focusNode as HTMLElement).getAttribute('contenteditable') === 'false' &&
      (focusNode as HTMLElement.dataset.slateVoid) !== 'true'
    ) {
      focusNode = anchorNode;
      focusOffset = anchorNode.textContent?.length || 0;
    }

    const anchor = SolidEditor.toSlatePoint(
      editor,
      [anchorNode, anchorOffset],
      {
        exactMatch,
        suppressThrow,
      },
    );
    if (!anchor) {
      return null as T extends true ? Range | null : Range;
    }

    const focus = isCollapsed
      ? anchor
      : SolidEditor.toSlatePoint(editor, [focusNode, focusOffset], {
          exactMatch,
          suppressThrow,
        });
    if (!focus) {
      return null as T extends true ? Range | null : Range;
    }

    let range: Range = { anchor: anchor as Point, focus: focus as Point };
    // if the selection is a hanging range that ends in a void
    // and the DOM focus is an Element
    // (meaning that the selection ends before the element)
    // unhang the range to avoid mistakenly including the void
    if (
      Range.isExpanded(range) &&
      Range.isForward(range) &&
      isDOMElement(focusNode) &&
      Editor.void(editor, { at: range.focus, mode: 'highest' })
    ) {
      range = Editor.unhangRange(editor, range, { voids: true });
    }

    return range as unknown as T extends true ? Range | null : Range;
  },
};

import './custom-types.js';

export { Slate } from './components/slate.js';
export {
  Editable,
  type RenderElementProps,
  type RenderLeafProps,
  type RenderPlaceholderProps,
} from './components/editable.js';
export { useSlate } from './hooks/use-slate.js';
export { withSolid } from './plugin/with-solid.js';
export { type SolidEditor } from './plugin/solid-editor.js';

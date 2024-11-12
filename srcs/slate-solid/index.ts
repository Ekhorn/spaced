// Components
export { Slate } from './components/slate.js';
export {
  Editable,
  type RenderElementProps,
  type RenderLeafProps,
  type RenderPlaceholderProps,
} from './components/editable.js';

// Hooks
export { useSlate } from './hooks/use-slate.js';
export { useSlateStatic } from './hooks/use-slate-static.js';
export { useFocused } from './hooks/use-focused.js';

// Plugin
export { withSolid } from './plugin/with-solid.js';
export { SolidEditor } from './plugin/solid-editor.js';

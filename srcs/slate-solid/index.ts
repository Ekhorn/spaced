// Components
export { Slate } from './components/slate.tsx';
export {
  Editable,
  type RenderElementProps,
  type RenderLeafProps,
  type RenderPlaceholderProps,
} from './components/editable.tsx';

// Hooks
export { useSlate } from './hooks/use-slate.tsx';
export { useSlateStatic } from './hooks/use-slate-static.tsx';
export { useFocused } from './hooks/use-focused.ts';

// Plugin
export { withSolid } from './plugin/with-solid.ts';
export { SolidEditor } from './plugin/solid-editor.ts';

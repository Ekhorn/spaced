use leptos::prelude::*;

#[component]
pub fn Editor(
  value: String,
  decorate: bool,
  readonly: bool,
  render_element: bool,
  render_leaf: bool,
  // #[prop(default = "currentColor")] color: &'static str,
  #[prop(optional)] placeholder: &'static str,
  #[prop(optional)] style: &'static str,
  #[prop(optional)] on_value_changed: &'static str,
  #[prop(optional)] on_key_down: &'static str,
  children: ChildrenFn,
) -> impl IntoView {
  view! {
    <div contenteditable=true>test</div>
  }
}

// style={{
//   padding: '4px',
//   'background-color': 'white',
//   'border-radius': '4px',
//   'padding-bottom': '12px',
//   'pointer-events': 'auto',
// }}
// onKeyDown={(event: KeyboardEvent) => {
//   for (const hotkey in HOTKEYS) {
//     if (isHotkey(hotkey, event)) {
//       event.preventDefault();
//       const mark = HOTKEYS[hotkey as keyof typeof HOTKEYS];
//       toggleMark(editor, mark);
//     }
//   }
// }}

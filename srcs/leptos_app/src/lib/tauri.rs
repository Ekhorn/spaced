use leptos::tachys::dom::window;

pub fn is_tauri() -> bool {
  window().get("__TAURI__").is_some()
}

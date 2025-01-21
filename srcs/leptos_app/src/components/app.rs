use leptos::prelude::*;

use super::background::Background;

#[component]
pub fn App() -> impl IntoView {
  view! {
    <Background />
    <main class="absolute h-full w-full"></main>
  }
}

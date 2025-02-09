use leptos::prelude::*;

use crate::{
  components::icon::{
    FaBrandsMarkdown, FaSolidFileCirclePlus, HiOutlineCircleStack, HiSolidArrowRight,
  },
  lib::tauri::is_tauri,
};

#[component]
pub fn LogOutButton() -> impl IntoView {
  view! {
    <Show when=move || false>
      <button class="control-btn" title="Log Out">
        <HiSolidArrowRight />
      </button>
    </Show>
  }
}

#[component]
pub fn StorageSelector() -> impl IntoView {
  view! {
    <div class="control-btn">
      // connected
      <Show when=|| false>
        <span class="before:absolute before:-left-[0.125rem] before:-top-[0.125rem] before:h-[0.375rem] before:w-[0.375rem] before:rounded-full before:bg-yellow-600 before:shadow before:shadow-[#2D2D2D]" />
      </Show>
      <HiOutlineCircleStack class="absolute" />
      <select
        class="z-50 appearance-none overflow-visible bg-transparent text-transparent outline-none"
        // onChange={handleChange}
        title="Connect to storage"
      >
        <option value="browser">Browser</option>
        <option disabled={!is_tauri()} value="local">
          Local
        </option>
        <option value="cloud">Cloud</option>
      </select>
    </div>
  }
}

#[component]
pub fn RichTextButton() -> impl IntoView {
  view! {
    <button class="control-btn" title="Create Item">
      <FaSolidFileCirclePlus />
    </button>
  }
}

#[component]
pub fn MarkdownButton() -> impl IntoView {
  view! {
    <button class="control-btn" title="Create Markdown">
      <FaBrandsMarkdown />
    </button>
  }
}

#[component]
pub fn Search() -> impl IntoView {
  view! {
    <input
      type="text"
      placeholder="Enter code"
      class="absolute z-50 m-2 w-[412px] rounded border-0 bg-white p-1 text-lg ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset"
      // onChange={handleChange}
      // onPaste={handlePaste}
    />
  }
}

#[component]
pub fn Controls() -> impl IntoView {
  view! {
    <>
      <Search />
      <div class="absolute right-1 top-1 flex flex-col gap-1 overflow-visible">
        <Show when=move || !is_tauri()>
          <LogOutButton />
        </Show>
        <StorageSelector />
        <RichTextButton />
        <MarkdownButton />
      </div>
    </>
  }
}

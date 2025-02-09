use leptos::{
  ev::{FocusEvent, PointerEvent},
  html::Div,
  prelude::*,
};
use reactive_stores::Store;
use wasm_bindgen::JsCast;
use web_sys::{HtmlDivElement, Node};

use crate::lib::{
  selection::{Selection, SelectionStoreFields},
  vector::{absolute_to_relative, Vec2D},
};

use super::app::Item;

#[component]
pub fn Container(props: Item) -> impl IntoView {
  let absolute_viewport_position =
    use_context::<ReadSignal<Vec2D>>().expect("to have found the getter provided");
  let scalar = use_context::<ReadSignal<f64>>().expect("to have found the getter provided");

  let translation = move || {
    absolute_to_relative(
      &Vec2D {
        x: props.x as f64,
        y: props.y as f64,
      },
      &absolute_viewport_position.get(),
      scalar.get(),
    )
  };

  let selection = use_context::<Store<Selection>>().expect("to have found the getter provided");

  let selections = selection.selections();
  let holding_ctrl = selection.holding_ctrl();
  let holding_shift = selection.holding_shift();
  let selecting = selection.selecting();

  let node_ref = NodeRef::<Div>::new();

  // const { deleteItem } = useIPC();

  let cloned_ref = node_ref.clone();
  let selected = move || cloned_ref.get().is_some() && selections.get().get(&props.id).is_some();

  let cloned_ref = node_ref.clone();
  let handle_click = move |_| {
    selections.write().insert(props.id, cloned_ref);
  };

  let cloned_ref = node_ref.clone();
  let handle_pointer_move = move |event: PointerEvent| {
    if event.buttons() == 1 && !holding_shift.get() && selections.get().get(&props.id).is_some() {
      event.stop_propagation();
      selections.write().insert(props.id, cloned_ref);
      selecting.set(true);
    }
  };

  // async function handle_key_up(event: keyboard_event) {
  //   event.stop_propagation();
  //   if (event.key === 'delete' && selected()) {
  //     try {
  //       const id = await delete_item(props.item.id!);
  //       props.set_items((prev) => prev.filter((item) => item.id != id));
  //     } catch {
  //       /**/
  //     }
  //     return;
  //   }
  // }

  let handle_focus_out = move |event: FocusEvent| {
    if let (Some(current_target), Some(related_target)) =
      (event.current_target(), event.related_target())
    {
      if current_target
        .dyn_ref::<HtmlDivElement>()
        .unwrap()
        .contains(related_target.dyn_ref::<Node>())
      {
        return;
      }
    }
    if holding_ctrl.get() || holding_shift.get() {
      return;
    }
    selections.write().remove(&props.id);
  };

  // const schema = createMemo<Descendant[]>(() => JSON.parse(props.item.schema!));
  // const renderProps = mergeProps({ selected }, props);

  view! {
    <div
      class="absolute min-h-8 min-w-8 whitespace-pre rounded bg-white"
      data-spaced-item=props.id
      style="pointer-events: all; transform-origin: top left"
      style:translate=move || format!("{}px {}px", translation().x, -translation().y)
      style:scale=move || scalar.get().to_string()
      style:width=move || format!("{}px", props.w)
      // TEMP
      style:height="30px"
      tabindex=0
      on:click=handle_click
      on:pointermove=handle_pointer_move
      // on:keyup=handleKeyUp
      on:focusout=handle_focus_out
      node_ref=node_ref
    >
      <div class="pointer-events-none">
        <div class="pointer-events-auto h-7" contenteditable=move || format!("{}", selected())>
        </div>
      </div>
      // <ErrorBoundary fallback=|| view! { <RenderFallback {...props} /> }>
      //   // <Render initialValue={schema()} {...renderProps} />
      // </ErrorBoundary>
    </div>
  }
}

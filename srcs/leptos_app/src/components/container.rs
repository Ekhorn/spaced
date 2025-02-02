use leptos::prelude::*;

use crate::lib::vector::{absolute_to_relative, Vec2D};

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

  // const { holdingCtrl, holdingShift, selections, setSelecting } =
  //   useSelection();
  // const { deleteItem } = useIPC();

  // let ref!: HTMLDivElement;

  // onMount(() => {
  //   ITEM_TO_SELECTION[props.item.id!] = ref;
  //   onCleanup(() => {
  //     delete ITEM_TO_SELECTION[props.item.id!];
  //   });
  // });

  // const selected = () => Boolean(ref && selections.get(ref));
  // function handleClick() {
  //   selections.set(ref, true);
  // }
  // function handlePointerMove(event: PointerEvent) {
  //   if (event.buttons === 1 && !holdingShift() && selections.get(ref)) {
  //     event.stopPropagation();
  //     setSelecting(true);
  //   }
  // }

  // function handleFocusOut(event: FocusEvent) {
  //   if (
  //     (event.currentTarget as Node).contains(event.relatedTarget as Node) ||
  //     holdingCtrl() ||
  //     holdingShift()
  //   ) {
  //     return;
  //   }
  //   selections.set(ref, false);
  // }
  // async function handleKeyUp(event: KeyboardEvent) {
  //   event.stopPropagation();
  //   if (event.key === 'Delete' && selected()) {
  //     try {
  //       const id = await deleteItem(props.item.id!);
  //       props.setItems((prev) => prev.filter((item) => item.id != id));
  //     } catch {
  //       /**/
  //     }
  //     return;
  //   }
  // }
  // const schema = createMemo<Descendant[]>(() => JSON.parse(props.item.schema!));
  // const renderProps = mergeProps({ selected }, props);

  view! {
    <div
      class="absolute min-h-8 min-w-8 whitespace-pre rounded bg-white"
      // data-spaced-item={props.item.id}
      style="pointer-events: all; transform-origin: top left"
      style:translate=move || format!("{}px {}px", translation().x, -translation().y)
      style:scale=move || scalar.get().to_string()
      style:width=move || format!("{}px", props.w)
      // TEMP
      style:height="30px"
      tabindex=0
      // on:click=handleClick
      // on:pointermove=handlePointerMove
      // on:keyup=handleKeyUp
      // on:focusout=handleFocusOut
      // ref=ref
    >
      // <ErrorBoundary fallback=|| view! { <RenderFallback {...props} /> }>
      //   // <Render initialValue={schema()} {...renderProps} />
      // </ErrorBoundary>
    </div>
  }
}

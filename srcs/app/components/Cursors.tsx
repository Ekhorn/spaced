import {
  type CursorOverlayData,
  useRemoteCursorOverlayPositions,
} from 'slate-yjs-solid';
import { For, Show } from 'solid-js';

export function Cursors(props) {
  let containerRef!: HTMLDivElement;
  const [cursors] = useRemoteCursorOverlayPositions({ containerRef });

  return (
    <div class="cursors" ref={containerRef}>
      {props.children}
      <For each={cursors()}>
        {(cursor) => {
          console.log(cursor);
          return <Selection key={cursor.clientId} {...cursor} />;
        }}
      </For>
    </div>
  );
}

function Selection(props: any) {
  return (
    <Show when={props.data}>
      <For each={props.selectionRects}>
        {(position) => (
          <div
            style={{
              'background-color': props.data.color,
              ...position,
            }}
            class="selection"
          />
        )}
      </For>
      <Show when={props.caretPosition}>
        <Caret caretPosition={props.caretPosition} data={props.data} />
      </Show>
    </Show>
  );
}

function Caret(props) {
  return (
    <div
      style={{
        ...props.caretPosition,
        background: props.data?.color,
      }}
      class="caretMarker"
    >
      <div
        class="caret"
        style={{
          transform: 'translateY(-100%)',
          background: props.data?.color,
        }}
      >
        {props.data?.name}
      </div>
    </div>
  );
}

import { Component, createEffect, onMount } from 'solid-js';
import Vec2D from '../../lib/vector';
import { useView } from '../Viewport';
import { draw } from '../../lib/draw';
import { useOverlay } from '../Overlay';

let canvas: HTMLCanvasElement;

const App: Component = () => {
  const [
    view,
    {
      setPosition,
      setLastMousePosition,
      setDimensions,
      scaleViewUpTo,
      scaleViewDownTo,
    },
  ] = useView();
  const [_, { toggleEditOverlay }] = useOverlay();

  function handleMousemove(e: MouseEvent) {
    if (e.buttons == 1) {
      setPosition(new Vec2D(-e.clientX, e.clientY));
    }
    setLastMousePosition(new Vec2D(-e.clientX, e.clientY));
  }

  function handleScroll(e: WheelEvent) {
    if (e.ctrlKey) {
      return;
    }
    if (e.deltaY < 0 && view.scale.level < 160) {
      scaleViewUpTo(new Vec2D(e.offsetX, -e.offsetY));
    } else if (e.deltaY > 0 && view.scale.level > 0.01) {
      scaleViewDownTo(new Vec2D(e.offsetX, -e.offsetY));
    }
  }

  onMount(() => {
    const handleResize = () => {
      const { height, width } = canvas.getBoundingClientRect();
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        setDimensions(height, width);
      }
    };
    handleResize();
    window.addEventListener('resize', () => {
      handleResize();
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        toggleEditOverlay();
      }
    });
  });

  createEffect(() => {
    draw(canvas, view);
  });

  return (
    <main class="absolute">
      <canvas
        class="w-screen h-screen"
        onmousemove={handleMousemove}
        onwheel={handleScroll}
        ref={canvas}
      />
    </main>
  );
};

export default App;

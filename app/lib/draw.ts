import { ViewportState } from "../components/Viewport";
import { globalToView } from "./utils";
import Vec2D from "./vector";

export const draw = (canvas: HTMLCanvasElement, view: ViewportState, drawableState?: []) => {
  const ctx = canvas?.getContext('2d')
  const level = view.scale.level
  const viewPos = globalToView(new Vec2D(-100, 0), view.position, level)

  clearCanvas(canvas)
  drawGrid(canvas, view)
  if (ctx) ctx.fillStyle = 'black'
  ctx?.fillRect(viewPos.x, -viewPos.y, 50 * level, 50 * level)
}

function clearCanvas(canvas: HTMLCanvasElement) {
  canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
}

type GridOptions =
  | 'dotted'
  | 'lines'

function drawGrid(canvas: HTMLCanvasElement, view: ViewportState, option: GridOptions = 'dotted') {
  const ctx = canvas?.getContext('2d')
  if (ctx) ctx.fillStyle = 'rgb(169, 169, 169)'

  // todo: find a way to set steps to a higher number, but only splitting once each time
  const dist = 25 * 2 ** (Math.log2(view.scale.level) % 1)
  // 25
  // 2**... *= 25 = 1

  const rows = view.width / dist
  const cols = view.height / dist

  const { x, y } = globalToView(new Vec2D(0, 0), view.position, view.scale.level)

  ctx?.beginPath();
  if (option === 'dotted') { // move into separate function
    for (let row = 0; row < rows + 1; row++) {
      for (let col = 0; col < cols + 1; col++) {
        ctx?.moveTo(col * dist, row * dist)
        ctx?.arc(col * dist + x % dist, row * dist + -y % dist, 2, 0, 2 * Math.PI);
      }
    }
    ctx?.fill();
  }
}

// context.beginPath();
// 	for (let col = 0; col < cols; col++) {
// 		context.moveTo(col * dist + offsetX, 0);
// 		context.lineTo(col * dist + offsetX, h);
// 	}
// 	for (let row = 0; row < rows; row++) {
// 		context.moveTo(0, row * dist + offsetY);
// 		context.lineTo(w, row * dist + offsetY);
// 	}
// 	context.strokeStyle = color;
// 	context.stroke();

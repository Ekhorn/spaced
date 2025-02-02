use std::{cell::RefCell, rc::Rc};

use leptos::{
  ev::{PointerEvent, WheelEvent},
  prelude::*,
};

use crate::lib::vector::{scale_viewport_out_from, scale_viewport_up_to, Vec2D};

#[component]
pub fn Viewport(children: ChildrenFn) -> impl IntoView {
  let children = StoredValue::new(children);

  fn selecting() -> bool {
    false
  }

  let (wheel_factor, _set_wheel_factor) = signal(1.2);
  let (pinch_factor, _set_pinch_factor) = signal(1.05);
  let (scalar, set_scalar) = signal(1_f64);
  let (absolute_viewport_position, set_absolute_viewport_position) = signal(Vec2D::default());

  let handle_zoom_in = move |relative_mouse_position: Vec2D, factor: f64| {
    set_absolute_viewport_position.update(|prev| {
      *prev = scale_viewport_up_to(&relative_mouse_position, prev, scalar.get(), factor)
    });
    set_scalar.update(|prev| *prev *= factor);
  };

  let handle_zoom_out = move |relative_mouse_position: Vec2D, factor: f64| {
    set_absolute_viewport_position.update(|prev| {
      *prev = scale_viewport_out_from(&relative_mouse_position, prev, scalar.get(), factor)
    });
    set_scalar.update(|prev| *prev /= factor);
  };

  // TODO: just find a way to pass mutable references without reference counting please
  let pointers: Rc<RefCell<Vec<PointerEvent>>> = Rc::new(RefCell::new(vec![]));
  let mut last_distance = 0_f64;
  let mut pointer_delta = Vec2D::default();
  let (last_relative_pointer_position, set_last_relative_pointer_position) =
    signal(Vec2D::default());

  fn get_distance(pointer1: &PointerEvent, pointer2: &PointerEvent) -> f64 {
    let dx = pointer1.client_x() - pointer2.client_x();
    let dy = pointer1.client_y() - pointer2.client_y();
    return (dx as f64).hypot(dy.into());
  }

  fn get_location(pointer1: &PointerEvent, pointer2: &PointerEvent) -> Vec2D {
    let mid_x = (pointer1.client_x() + pointer2.client_x()) / 2;
    let mid_y = -(pointer1.client_y() + pointer2.client_y()) / 2;
    return Vec2D {
      x: mid_x as f64,
      y: mid_y as f64,
    };
  }

  let cloned_pointers = Rc::clone(&pointers);
  let handle_pointer_down = move |event: PointerEvent| {
    let mut pointers = cloned_pointers.take();
    if event.pointer_type() == "touch" {
      pointers.push(event.clone());
      set_last_relative_pointer_position.set(Vec2D {
        x: event.client_x() as f64,
        y: -event.client_y() as f64,
      });
      if pointers.len() == 2 {
        last_distance = get_distance(pointers.get(0).unwrap(), pointers.get(1).unwrap());
      }
    }
  };

  let cloned_pointers = Rc::clone(&pointers);
  let handle_pointer_move = move |event: PointerEvent| {
    let mut pointers = cloned_pointers.take();
    if event.pointer_type() == "touch" && pointers.len() == 2 {
      for i in 0..pointers.len() {
        if pointers[i].pointer_id() == event.pointer_id() {
          pointers[i] = event;
          break;
        }
      }

      let distance = get_distance(&pointers[0], &pointers[1]);
      let relative_pointer_position = get_location(&pointers[0], &pointers[1]);
      let is_zoom_in = distance > last_distance;
      let is_zoom_out = distance < last_distance;

      if is_zoom_in && scalar.get() < 160_f64 {
        handle_zoom_in(relative_pointer_position, pinch_factor.get());
      } else if is_zoom_out && scalar.get() > 0.01 {
        handle_zoom_out(relative_pointer_position, pinch_factor.get());
      }
      last_distance = distance;
      return;
    }

    pointer_delta = Vec2D {
      x: event.client_x() as f64,
      y: -event.client_y() as f64,
    }
    .sub(&last_relative_pointer_position.get())
    .div(scalar.get());
    if event.shift_key() && event.buttons() == 1 {
    } else if event.buttons() == 1 && !selecting() {
      set_absolute_viewport_position.update(|prev| *prev = prev.add(&pointer_delta.neg()));
    }
    set_last_relative_pointer_position.set(Vec2D {
      x: event.client_x() as f64,
      y: -event.client_y() as f64,
    });
  };

  let cloned_pointers = Rc::clone(&pointers);
  let handle_pointer_remove = move |event: PointerEvent| {
    let mut pointers = cloned_pointers.take();
    pointers = pointers
      .iter()
      .filter_map(|pointer| {
        if pointer.pointer_id() != event.pointer_id() {
          Some(pointer.clone())
        } else {
          None
        }
      })
      .collect::<Vec<PointerEvent>>();
    if pointers.get(0).is_some() {
      set_last_relative_pointer_position.set(Vec2D {
        x: event.client_x() as f64,
        y: -event.client_y() as f64,
      });
    }
  };

  let handle_wheel = move |event: WheelEvent| {
    let is_zoom_in = event.delta_y() < 0.0;
    let is_zoom_out = event.delta_y() > 0.0;
    let relative_mouse_position = Vec2D {
      x: event.client_x() as f64,
      y: -event.client_y() as f64,
    };

    if is_zoom_in && scalar.get() < 160.0 {
      handle_zoom_in(relative_mouse_position, wheel_factor.get());
    } else if is_zoom_out && scalar.get() > 0.01 {
      handle_zoom_out(relative_mouse_position, wheel_factor.get());
    }
  };

  provide_context(absolute_viewport_position);
  provide_context(scalar);

  view! {
    <div
      id="viewport"
      class="h-full w-full"
      on:pointerdown=handle_pointer_down
      on:pointermove=handle_pointer_move
      on:pointercancel=handle_pointer_remove.clone()
      on:pointerup=handle_pointer_remove
      on:wheel=handle_wheel
    >
      {children.read_value()()}
    </div>
  }
}

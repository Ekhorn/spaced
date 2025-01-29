#[derive(Debug, Default, Clone)]
pub struct Vec2D {
  pub x: f64,
  pub y: f64,
}

impl Vec2D {
  pub fn add(&self, other: &Vec2D) -> Vec2D {
    return Vec2D {
      x: self.x + other.x,
      y: self.y + other.y,
    };
  }

  pub fn sub(&self, other: &Vec2D) -> Vec2D {
    return Vec2D {
      x: self.x - other.x,
      y: self.y - other.y,
    };
  }

  pub fn mul(&self, scalar: f64) -> Vec2D {
    return Vec2D {
      x: self.x * scalar,
      y: self.y * scalar,
    };
  }

  pub fn div(&self, scalar: f64) -> Vec2D {
    return Vec2D {
      x: self.x / scalar,
      y: self.y / scalar,
    };
  }

  pub fn neg(&self) -> Vec2D {
    return Vec2D {
      x: -self.x,
      y: -self.y,
    };
  }
}

/**
 * @param absolute the absolute target vector.
 * @param viewport the absolute viewport position.
 * @param scalar the scalar value to apply.
 * @returns the relative position of the `absolute` target vector.
 */
pub fn absolute_to_relative(absolute: &Vec2D, viewport: &Vec2D, scalar: f64) -> Vec2D {
  return absolute.sub(viewport).mul(scalar);
}

/**
 * @param relative the relative target vector.
 * @param viewport the absolute viewport position.
 * @param scalar the scalar value to apply.
 * @returns the absolute position of the `relative` target vector.
 */
pub fn relative_to_absolute(relative: &Vec2D, viewport: &Vec2D, scalar: f64) -> Vec2D {
  return relative.div(scalar).add(viewport);
}

/**
 * scale the viewport up towards the `relative` position.
 * @param relative the relative position to scale up towards.
 * @param viewport the absolute viewport position.
 * @param scalar the scalar value to apply.
 * @param factor the factor by which the scalar value is scaled.
 * @returns the new absolute viewport position.
 */
pub fn scale_viewport_up_to(relative: &Vec2D, viewport: &Vec2D, scalar: f64, factor: f64) -> Vec2D {
  let absolute = &relative_to_absolute(relative, viewport, scalar);
  return viewport.sub(absolute).div(factor).add(absolute);
}

/**
 * scale the viewport out from the `relative` position.
 * @param relative the relative position to scale out from.
 * @param viewport the absolute viewport position.
 * @param scalar the scalar value to apply.
 * @param factor the factor by which the scalar value is scaled.
 * @returns the new absolute viewport position.
 */
pub fn scale_viewport_out_from(
  relative: &Vec2D,
  viewport: &Vec2D,
  scalar: f64,
  factor: f64,
) -> Vec2D {
  let absolute = &relative_to_absolute(relative, viewport, scalar);
  return viewport.sub(absolute).mul(factor).add(absolute);
}

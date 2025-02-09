use std::collections::HashMap;

use leptos::{html::Div, prelude::NodeRef};
use reactive_stores::Store;

#[derive(Debug, Default, Clone, Store)]
pub struct Selection {
  selections: HashMap<i64, NodeRef<Div>>,
  holding_ctrl: bool,
  holding_shift: bool,
  selecting: bool,
}

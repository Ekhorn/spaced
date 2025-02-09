use leptos::prelude::*;

#[component]
fn IconTemplate(
  #[prop(default = "currentColor")] color: &'static str,
  #[prop(default = "currentColor")] fill: &'static str,
  #[prop(optional)] stroke: &'static str,
  viewbox: &'static str,
  #[prop(default = "1em")] size: &'static str,
  #[prop(optional)] class: &'static str,
  #[prop(optional)] style: &'static str,
  children: ChildrenFn,
) -> impl IntoView {
  view! {
    <svg
      stroke-width="0"
      stroke=stroke
      color=color
      fill=fill
      style:overflow="visible"
      class=class
      style=style
      viewBox=viewbox
      height=size
      width=size
      xmlns="http://www.w3.org/2000/svg">
      {children()}
    </svg>
  }
}

#[component]
pub fn FaSolidFileCirclePlus(#[prop(optional)] class: &'static str) -> impl IntoView {
  view! {
    <IconTemplate viewbox="0 0 576 512" class=class>
      <path d="M0 64C0 28.7 28.7 0 64 0h160v128c0 17.7 14.3 32 32 32h128v38.6c-73.9 20.9-128 88.8-128 169.4 0 59.1 29.1 111.3 73.7 143.3-3.2.5-6.4.7-9.7.7H64c-35.3 0-64-28.7-64-64V64zm384 64H256V0l128 128zm48 96a144 144 0 1 1 0 288 144 144 0 1 1 0-288zm16 80c0-8.8-7.2-16-16-16s-16 7.2-16 16v48h-48c-8.8 0-16 7.2-16 16s7.2 16 16 16h48v48c0 8.8 7.2 16 16 16s16-7.2 16-16v-48h48c8.8 0 16-7.2 16-16s-7.2-16-16-16h-48v-48z"/>
    </IconTemplate>
  }
}

#[component]
pub fn FaBrandsMarkdown(#[prop(optional)] class: &'static str) -> impl IntoView {
  view! {
    <IconTemplate viewbox="0 0 640 512" class=class>
      <path d="M593.8 59.1H46.2C20.7 59.1 0 79.8 0 105.2v301.5c0 25.5 20.7 46.2 46.2 46.2h547.7c25.5 0 46.2-20.7 46.1-46.1V105.2c0-25.4-20.7-46.1-46.2-46.1zM338.5 360.6H277v-120l-61.5 76.9-61.5-76.9v120H92.3V151.4h61.5l61.5 76.9 61.5-76.9h61.5v209.2zm135.3 3.1L381.5 256H443V151.4h61.5V256H566z"/>
    </IconTemplate>
  }
}

#[component]
pub fn HiSolidArrowRight(#[prop(optional)] class: &'static str) -> impl IntoView {
  view! {
    <IconTemplate fill="none" stroke="currentColor" viewbox="0 0 24 24" class=class>
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/>
    </IconTemplate>
  }
}

#[component]
pub fn HiOutlineCircleStack(#[prop(optional)] class: &'static str) -> impl IntoView {
  view! {
    <IconTemplate fill="none" stroke="currentColor" viewbox="0 0 24 24" class=class>
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"/>
    </IconTemplate>
  }
}

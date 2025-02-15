# Schema

## CURRENT

### STANDARD

Structure

slate editor
- element blocks
- text
  - variations

ELEMENTS

Are the atomic structures of Spaced UI

Properties
- descendants
- readonly
- events
- variant
- styling
  - positioning
  - looks

### ELEMENTS

```rs
#[derive(Serialize, PartialEq, Deserialize, Clone, Debug)]
#[serde(rename_all = "snake_case")]
#[serde(tag = "type")]
pub enum Element {
  BlockQuote(BlockQuoteElement),
  BulletedList(BulletedListElement),
  CheckListItem(CheckListItemElement),
  Heading(HeadingElement),
  HeadingTwo(HeadingTwoElement),
  Image(ImageElement),
  Link(LinkElement),
  Button(ButtonElement),
  ListItem(ListItemElement),
  Paragraph(ParagraphElement),
  CodeBlock(CodeBlockElement),
  CodeLine(CodeLineElement),
}

#[derive(Serialize, PartialEq, Deserialize, Clone, Debug)]
#[serde(untagged)]
pub enum Descendant {
  Text(CustomText),
  Element(Element),
}
```

## PROPOSED

How to get to Spaced - Interactive Rendering Engine v1

### STANDARD

STRUCTURE

core
- schema structures
>
> elements -> variants -> html element relation

engine
- depends on core
- depends on leptos
> (others can depend on this as library / what about allowing other to define their own schema, schema agnostic?)

app
- depends on engine
- depends on core
- reuses the engine viewport
- defines the Spaced state management

tauri
- "depends on app"
- depends on core

ELEMENTS

> Are the "atoms" of Spaced UI
>
> Properties
> - children / descendants
> - readonly
> - variant (questionable, would nest things and non flat structures are BAD, I expect for this to work at all need to avoid all overhead, BUT lets ignore that ;)
> - styling
>   - positioning
>   - looks
> - events (callbacks)



### ELEMENTS

| Elements  | Description                                                                                                                                                                                      | Variants                                                                          | Allowed descendants                  |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- | ------------------------------------ |
| div       | Renders text, the component records which characters are per each of the following options: italic, bold, strikeout, heading, sub, sup, font, marking. The text may wrap around nested elements. | Markdown                                                                          | Any\* (Markdown uses it's own style) |
| input     | The input can have decorators depending on the type to e.g. make a password field, to add icons or a label                                                                                       | single-line, multi-line, time, date-time, date, radio, check, number, file, color | Decorators                           |
| select    |                                                                                                                                                                                                  |                                                                                   | Decorators                           |
| button    |                                                                                                                                                                                                  |                                                                                   | Decorators                           |
| link      |                                                                                                                                                                                                  |                                                                                   | Decorators                           |
| aside     |                                                                                                                                                                                                  |                                                                                   | Any                                  |
| audio     |                                                                                                                                                                                                  |                                                                                   | Decorators                           |
| break     |                                                                                                                                                                                                  |                                                                                   | None                                 |
| separator |                                                                                                                                                                                                  |                                                                                   | None                                 |
| figure    | Displays anything a `<canvas>` or `<img>` tag can do.                                                                                                                                            |                                                                                   |                                      |
| code      |                                                                                                                                                                                                  |                                                                                   |                                      |
| details   | Can hide content, supports a summary                                                                                                                                                             |                                                                                   | Any                                  |
| dialog    |                                                                                                                                                                                                  |                                                                                   | Any                                  |
| list      |                                                                                                                                                                                                  |                                                                                   |                                      |
| embed     |                                                                                                                                                                                                  |                                                                                   | None                                 |
| progress  |                                                                                                                                                                                                  |                                                                                   | Decorators                           |
| table     | Dedicated component to render borders for each cell in any style imaginable. The component should allow for sorting.                                                                             |                                                                                   | Any                                  |
| video     |                                                                                                                                                                                                  |                                                                                   |                                      |

```rs
#[derive(Serialize, PartialEq, Deserialize, Clone, Debug)]
#[serde(rename_all = "snake_case")]
#[serde(tag = "type")]
pub enum Element {
  BlockQuote(BlockQuoteElement),
  BulletedList(BulletedListElement),
  CheckListItem(CheckListItemElement),
  Heading(HeadingElement),
  HeadingTwo(HeadingTwoElement),
  Image(ImageElement),
  Link(LinkElement),
  Button(ButtonElement),
  ListItem(ListItemElement),
  Paragraph(ParagraphElement),
  CodeBlock(CodeBlockElement),
  CodeLine(CodeLineElement),
}
```
- div
- select
- button
- link
- aside
- audio
- break
- separator
- figure
- code
- details
- dialog
- list
- embed
- progress
- table
- video
-




Structural Elements

    <html>, <head>, <body>

Metadata Elements

    <title>, <meta>, <link>, <style>, <script>

Sectioning Elements

    <header>, <nav>, <section>, <article>, <aside>, <footer>

Grouping Content

    <p>, <div>, <ol>, <ul>, <li>, <blockquote>, <hr>

Text-Level Semantics

    <a>, <em>, <strong>, <small>, <i>, <b>, <u>, <span>

Edits

    <ins>, <del>

Embedded Content

    <img>, <iframe>, <video>, <audio>, <canvas>

Table Content

    <table>, <tr>, <th>, <td>, <caption>

Forms

    <form>, <input>, <button>, <select>, <textarea>

Interactive Elements

    <details>, <summary>, <dialog>

Template and Slot

    <template>, <slot>


> `<a>`
>
> - `href` attribute, creates a hyperlink to web pages, files, email addresses, locations in the same page, or anything else a URL can address
> - `download` to make external resources downloads.
> - `type` MIME type

> `<abbr>`
>
> Used for abbreviations

> `<acronym>` Deprecated, replaced by `<abbr>`

> `<address>`
>
> Wrapper for contact information like `mailto:` links and `tel:` link

> `<area>`
>
> Used inside an image `<map>` to add shapes that are clickable
> - href
> - coords
> - alt
> - download
> - shape

> `<article>`
>
> element represents a self-contained composition in a document, page, application, or site, which is intended to be independently distributable or reusable (e.g., in syndication). Examples include: a forum post, a magazine or newspaper article, or a blog entry, a product card, a user-submitted comment, an interactive widget or gadget, or any other independent item of content.

> `<aside>`
>
> indirectly related to the document's main content

> `<audio>`
>
> Plays audio
> - controls: volume, seeking, and pause/resume playback
> - controlslist
> - autoplay
> - download
> - loop
> - src

> `<b>`
>
> makes text bold

> `<base>`
>
> Wrapper to define the base url to link elements `<a>` `<area>` `<from>`
> - `href`

> `<bdi>`
>
> The Bidirectional Isolate element for text IDK what it actually does

> `<bdo>`
>
> - `dir` allows to override directionality

> `<big>` Deprecated

> `<blockquote>`
>
> declares a block of text should be quoted, a decoration
> - `cite` link to context the quote is from

> `<body>`
>
> metadata tag for HTML containing visible tags

> `<br>`
>
> A line break

> `<button>`
>
> - `autofocus`
> - `command`
> - ``
> - `disabled`
> - `form`
> - `formaction`
> - `formenctype`
> - `formmethod`
> - `formvalidate`
> - `formtarget`
> - `name`
> - `popovertarget`
> - `popovertargetaction`
> - `type`
> - `value`

> `<canvas>`
>
> Drawing
>
> - `height`
> - `width`

> `<caption>`
>
> Caption (or title) of a table

> `<center>` Deprecated

> `<cite>`

> `<code>`

> `<col>`

> `<colgroup>`

> `<data>`

> `<datalist>`

> `<dd>`

> `<del>`

> `<details>`

> `<dfn>`

> `<dialog>`

> `<dir>` Deprecated

> `<div>`

> `<dl>`

> `<dt>`

> `<em>`

> `<embed>`

> `<fencedframe>` Experimental

> `<fieldset>`

> `<figcaption>`

> `<figure>`

> `<font>` Deprecated

> `<footer>`

> `<form>`

> `<frame>` Deprecated

> `<frameset>` Deprecated

> `<h1>`

> `<head>`

> `<header>`

> `<hgroup>`

> `<hr>`

> `<html>`

> `<i>`

> `<iframe>`

> `<img>`

> `<input>`

> `<ins>`

> `<kbd>`

> `<label>`

> `<legend>`

> `<li>`

> `<link>`

> `<main>`

> `<map>`

> `<mark>`

> `<marquee>` Deprecated

> `<menu>`

> `<meta>`

> `<meter>`

> `<nav>`

> `<nobr>` Deprecated

> `<noembed>` Deprecated

> `<noframes>` Deprecated

> `<noscript>`

> `<object>`

> `<ol>`

> `<optgroup>`

> `<option>`

> `<output>`

> `<p>`

> `<param>` Deprecated

> `<picture>`

> `<plaintext>` Deprecated

> `<pre>`

> `<progress>`

> `<q>`

> `<rb>` Deprecated

> `<rp>`

> `<rt>`

> `<rtc>` Deprecated

> `<ruby>`

> `<s>`

> `<samp>`

> `<script>`

> `<search>`

> `<section>`

> `<select>`

> `<slot>`

> `<small>`

> `<source>`

> `<span>`

> `<strike>` Deprecated

> `<strong>`

> `<style>`

> `<sub>`

> `<summary>`

> `<sup>`

> `<table>`

> `<tbody>`

> `<td>`

> `<template>`

> `<textarea>`

> `<tfoot>`

> `<th>`

> `<thead>`

> `<time>`

> `<title>`

> `<tr>`

> `<track>`

> `<tt>` Deprecated

> `<u>`

> `<ul>`

> `<var>`

> `<video>`

> `<wbr>`

> `<xmp>`

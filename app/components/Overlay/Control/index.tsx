import { Component } from 'solid-js';

type Control = {};

export const Control: Component = () => {
  return (<div></div>) as
    | HTMLDivElement
    | HTMLButtonElement
    | HTMLInputElement
    | HTMLSpanElement;
};

function generateControl() {}

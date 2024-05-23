import axios from 'axios';
import { render } from 'solid-js/web';

import { App } from './components/App.js';
import './index.css';

window.addEventListener('dragover', (e) => {
  e.preventDefault();
});
window.addEventListener('drop', (e) => {
  e.preventDefault();
});

axios.create({
  baseURL: window.location.origin,
});

render(App, document.body);

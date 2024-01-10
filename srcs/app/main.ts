import axios from 'axios';
import { render } from 'solid-js/web';

import { App } from './components/App.js';
import './index.css';

axios.create({
  baseURL: window.location.origin,
});

render(App, document.body);

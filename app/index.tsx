/* @refresh reload */
import { render } from 'solid-js/web';

import './index.css'
import App from './components/App';
import { ViewProvider } from './components/Viewport';
import { OverlayProvider } from './components/Overlay';

render(() =>
  <ViewProvider>
    {/* TODO: figure out why moving the providers to the app component breaks. */}
    <OverlayProvider>
      <App />
    </OverlayProvider>
  </ViewProvider>,
  document.getElementById('app') as HTMLElement
);

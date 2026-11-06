import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { KeyGate } from './components/KeyGate';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <KeyGate appName="WebInsights AI">
      <App />
    </KeyGate>
  </StrictMode>,
);

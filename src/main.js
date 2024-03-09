import App from './App.svelte';
import './app.css';
import './content_script.js?worker';
import './worker.js?worker';

const app = new App({
  target: document.getElementById('app')
});

export default app;

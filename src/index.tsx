/* @refresh reload */
import { render } from 'solid-js/web'
import { Router, Route } from '@solidjs/router'
import 'virtual:uno.css'
import '@unocss/reset/tailwind.css'
import '@fontsource/inria-sans/300.css';
import '@fontsource/inria-sans/400.css';
import '@fontsource/inria-sans/700.css';
import '@fontsource/inria-sans/300-italic.css';
import '@fontsource/inria-sans/400-italic.css';
import '@fontsource/inria-sans/700-italic.css';

import App from './App'

const root = document.getElementById('root')


render(
  () =>
    <Router>
      <Route path="/:tree" component={App} />
    </Router>,
  root!)

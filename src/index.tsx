/* @refresh reload */
import { render } from 'solid-js/web'
import { Router, Route } from '@solidjs/router'
import 'virtual:uno.css'
import '@unocss/reset/tailwind.css'

import App from './App'

const root = document.getElementById('root')


render(
  () =>
    <Router>
      <Route path="/:tree" component={App} />
    </Router>,
  root!)

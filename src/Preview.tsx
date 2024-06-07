import autoRenderMath from 'katex/contrib/auto-render'
import { JSXElement, createMemo, createSignal, createEffect, createResource } from 'solid-js'
import { BuildNotification, BuildResult } from '../common/api'
import './style.css'
import './custom.css'
import ky from 'ky'

export interface PreviewProps {
  tree: string,
  showHelp: boolean
}

type PreviewLoading = {
  state: 'loading'
}

type PreviewBuilding = {
  state: 'building'
}

type PreviewLoaded = {
  state: 'loaded',
  result: BuildResult
}

function Help(): JSXElement {
  return (<div class="preview">
    <h1 class="py-2">Important keybindings</h1>
    <table class="py-2">
      <thead><tr><th>Keyboard shortcut</th><th>Effect</th></tr></thead>
      <tbody>
      <tr><td>Ctrl-enter, Ctrl-s</td><td>Build</td></tr>
      <tr><td>Ctrl-k, Ctrl-s</td><td>Quick jump between trees</td></tr>
      <tr><td>Ctrl-i</td><td>Insert transclude to new tree</td></tr>
      </tbody>
    </table>
    <h1 class="py-2">Quick Forester Reference</h1>
    <p>Forester uses LaTeX syntax (i.e. <code>\tag[optional argument]&lbrace;main argument&rbrace;</code>), but HTML names for common tags.</p>
    <p>For instance, instead of <code>\begin&lbrace;itemize&rbrace; \item A \item B \end&lbrace;itemize&rbrace;</code>, one would use <code>\ul&lbrace;\li&lbrace;A&rbrace;\li&lbrace;B&rbrace;&rbrace;</code>, mimicking the equivalent HTML <code>&lt;ul&gt;&lt;li&gt;A&lt;/li&gt;&lt;li&gt;B&lt;/li&gt;&lt;/ul&gt;</code>.</p>
    <p>Instead of dollar signs, forester uses <code>#&lbrace;math&rbrace;</code> for inline math, and <code>##&lbrace;math&rbrace;</code> for display math.</p>
    <p>The best way to get a feel for Forester is by browsing through some documents</p>
    <p>The second best way is to read some tutorials:</p>
      <ul>
        <li><span class="link external"><a href="https://forest.localcharts.org/lc-0002.xml">Forester for the Woodland Skeptic</a></span></li>
        <li><span class="link external"><a href="http://www.jonmsterling.com/jms-0052.xml">Build your own Stacks Project in 10 minutes</a></span></li>
      </ul>
    <h1 class="py-2">About Silviculture</h1>
    <table class="py-2">
      <tbody>
        <tr>
          <td>Source:</td>
          <td>
            <span class="link external">
            <a href="https://github.com/LocalCharts/silviculture">
              github.com/LocalCharts/silviculture</a>
            </span>
          </td>
        </tr>
        <tr>
          <td>Homepage:</td>
          <td>
            <span class="link external">
            <a href="https://forest.localcharts.org/silviculture-0001.xml">
              forest.localcharts.org/silviculture-0001.xml
            </a>
            </span>
          </td>
        </tr>
      </tbody>
    </table>
    <p>
      Thanks to the <a href="https://topos.institute">Topos Institute</a> and <a href="https://www.goodforever.org">GoodForever</a> for supporting development of Silviculture.
    </p>
  </div>
  )
}

type PreviewState = PreviewLoading | PreviewLoaded | PreviewBuilding

export function Preview (props: PreviewProps): JSXElement {
  const parser = new DOMParser()

  const [processor, {}] = createResource(async () => {
    const style = await (await ky.get('/built/forest.xsl')).text()
    const xsl = parser.parseFromString(style, 'application/xml')
    const processor = new XSLTProcessor()
    processor.importStylesheet(xsl)
    return processor
  })

  const [getState, setState] = createSignal<PreviewState>({ state: 'loading' })

  createEffect((oldSocket: WebSocket | null) => {
    if (oldSocket) {
      oldSocket.close()
    }
    const socket = new WebSocket(`/preview/${props.tree}`)
    socket.onmessage = (ev: MessageEvent<any>) => {
      const message = JSON.parse(ev.data) as BuildNotification
      if (message.state == 'building') {
        setState({ state: 'building' })
      } else if (message.state == 'finished') {
        setState({
          state: 'loaded',
          result: message.result
        })
      }
    }
    return socket
  }, null)

  const content = createMemo(() => {
    const state = getState()
    if (props.showHelp) {
      return Help()
    }
    if (state.state == 'loaded') {
      if (state.result.success) {
        const p = processor()
        if (!p) {
          return
        }
        const transformed = parser.parseFromString(
          state.result.content,
          'application/xml'
        )
        const doc = p.transformToDocument(transformed)
        const content = doc.getElementById('grid-wrapper') as HTMLElement
        autoRenderMath(content)
        return content
      } else {
        return (
          <>
            <pre class="whitespace-pre-wrap text-xs">
              {state.result.stderr}
            </pre>
            <pre class="whitespace-pre-wrap text-xs">
              {state.result.stdout}
            </pre>
          </>
        )
      }
    } else if (state.state == 'building') {
      return (
        <div>
          {"building".split("").map((char, index) => (
            <span class={`animated-letter letter-${index + 1}`}>{char}</span>
          ))}
        </div>
      )
    } else {
      return (
        <div>
          {"loading".split("").map((char, index) => (
            <span class={`animated-letter letter-${index + 1}`}>{char}</span>
          ))}
        </div>
      )
    }
  })

  return (
    <div class="m-2 preview">
      {content()}
    </div>
  )
}

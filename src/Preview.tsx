import autoRenderMath from 'katex/contrib/auto-render'
import { JSXElement, createMemo, createSignal, createEffect, createResource } from 'solid-js'
import { BuildNotification, BuildResult } from '../common/api'
import './style.css'
import './custom.css'
import ky from 'ky'

export interface PreviewProps {
  tree: string,
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
    const socket = new WebSocket(`ws://localhost:1234/preview/${props.tree}`)
    socket.onmessage = (ev: MessageEvent<any>) => {
      console.log(ev)
      const message = JSON.parse(ev.data) as BuildNotification
      if (message.state == 'building') {
        setState({ state: 'building' })
      } else if (message.state == 'finished') {
        console.log(message.result)
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

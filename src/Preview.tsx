import autoRenderMath from 'katex/contrib/auto-render'
import { JSXElement, createMemo, Switch, Match } from 'solid-js'
import { BuildResult } from '../common/api'

export interface PreviewProps {
  result: BuildResult,
  xsl: string,
  fullWidth: boolean
}

export function Preview (props: PreviewProps): JSXElement {
  const parser = new DOMParser()

  const processor = createMemo(() => {
    const xsl = parser.parseFromString(props.xsl, 'application/xml')
    const processor = new XSLTProcessor()
    processor.importStylesheet(xsl)
    return processor
  })

  const content = createMemo(() => {
    console.log(props.result)
    if (props.result.success) {
      const transformed = parser.parseFromString(props.result.content, 'application/xml')
      const doc = processor().transformToDocument(transformed)
      const content = doc.getElementsByClassName('tree-content')[0] as HTMLElement
      autoRenderMath(content)
      return content
    }
  })

  return (
    <Switch>
      <Match when={props.result.success}>
        {content()}
      </Match>
      <Match when={!props.result.success}>
        <pre class="whitespace-pre-wrap text-xs">
          {(props.result as any).stderr}
        </pre>
        <pre class="whitespace-pre-wrap text-xs">
          {(props.result as any).stdout}
        </pre>
      </Match>
    </Switch>
  )
}

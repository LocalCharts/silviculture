import autoRenderMath from 'katex/contrib/auto-render'
import { createMemo } from "solid-js"

export type PreviewProps = {
  content: string,
  xsl: string
}

export function Preview(props: PreviewProps) {
  const parser = new DOMParser()

  const processor = createMemo(() => {
    const xsl = parser.parseFromString(props.xsl, 'application/xml')
    const processor = new XSLTProcessor()
    processor.importStylesheet(xsl)
    return processor
  })

  const content = createMemo(() => {
    console.log(props.content)
    const transformed = parser.parseFromString(props.content, 'application/xml')
    const doc = processor().transformToDocument(transformed)
    const content = doc.getElementsByClassName('tree-content')[0]
    autoRenderMath(content)
    return content
  })

  return (
    <div>
      <div>
        {content()}
      </div>
    </div>
  )
}

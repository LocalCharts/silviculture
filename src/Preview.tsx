import { Button } from "./Button"
import autoRenderMath from 'katex/contrib/auto-render'
import ky from 'ky'

async function loadBuild(into: Element) {
  const parser = new DOMParser()
  const xml = parser.parseFromString(await (await ky.get("/built/ocl-0001.xml")).text(), 'application/xml')
  const xsl = parser.parseFromString(await (await ky.get("/built/forest.xsl")).text(), 'application/xml')
  const processor = new XSLTProcessor();
  processor.importStylesheet(xsl);
  const result = processor.transformToDocument(xml);
  const body = result.getElementsByClassName('tree-content')[0]
  autoRenderMath(body)
  while (into.firstChild) {
    into.removeChild(into.firstChild);
  }
  into.appendChild(body)
}

export function Preview() {
  let ref: Element
  return (
    <div>
      <Button onClick={_ => loadBuild(ref)}>Refresh</Button>
      <div ref={elt => {ref = elt; loadBuild(elt)}}>
      </div>
    </div>
  )
}

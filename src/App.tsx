import { HocuspocusProvider } from "@hocuspocus/provider"
import * as Y from "yjs"
import * as random from "lib0/random"
import ky from 'ky'
import { yCollab } from 'y-codemirror.next'
import { EditorView, basicSetup } from "codemirror"
import { EditorState } from "@codemirror/state"
import { JSX, splitProps } from "solid-js"
import autoRenderMath from 'katex/contrib/auto-render'

type ButtonProps = {
  children: string
} & JSX.HTMLAttributes<HTMLButtonElement>

function Button(props: ButtonProps) {
  const [, rest] = splitProps(props, ["children"])
  return (
    <button
      class="font-bold py-2 px-2 rounded border-2 border-solid border-black hover:bg-slate-100"
      {...rest}>
      {props.children}
    </button>
  )
}

async function loadBuild(into: Element) {
  const parser = new DOMParser()
  const xml = parser.parseFromString(await (await ky.get("/built/ocl-0001.xml")).text(), 'application/xml')
  const xsl = parser.parseFromString(await (await ky.get("/built/forest.xsl")).text(), 'application/xml')
  const processor = new XSLTProcessor();
  processor.importStylesheet(xsl);
  const result = processor.transformToDocument(xml);
  const body = result.body
  autoRenderMath(body)
  while (into.firstChild) {
    into.removeChild(into.firstChild);
  }
  into.appendChild(body)
}

function Preview() {
  let ref: Element
  return (
    <div>
      <Button onClick={_ => loadBuild(ref)}>Refresh</Button>
      <div ref={elt => {ref = elt; loadBuild(elt)}}>
      </div>
    </div>

  )
}

export const usercolors = [
  { color: '#30bced', light: '#30bced33' },
  { color: '#6eeb83', light: '#6eeb8333' },
  { color: '#ffbc42', light: '#ffbc4233' },
  { color: '#ecd444', light: '#ecd44433' },
  { color: '#ee6352', light: '#ee635233' },
  { color: '#9ac2c9', light: '#9ac2c933' },
  { color: '#8acb88', light: '#8acb8833' },
  { color: '#1be7ff', light: '#1be7ff33' }
]

// select a random color for this user
export const userColor = usercolors[random.uint32() % usercolors.length]


function App() {
  // Connect it to the backend
  const provider = new HocuspocusProvider({
    url: "/collaboration",
    name: "ocl-0001.tree",
  });

  // Define `tasks` as an Array

  const ytext = provider.document.getText('content')

  const undoManager = new Y.UndoManager(ytext)

  provider.awareness?.setLocalStateField('user', {
    name: 'Anonymous ' + Math.floor(Math.random() * 100),
    color: userColor.color,
    colorLight: userColor.light
  })

  const state = EditorState.create({
    doc: ytext.toString(),
    extensions: [
      basicSetup,
      EditorView.lineWrapping,
      yCollab(ytext, provider.awareness, { undoManager })
    ]
  })

  function onload(ref: Element) {
    new EditorView({
      state,
      parent: ref
    })
  }

  return (
    <div class="font-sans container mx-auto flex flex-row">
      <div class="flex-1 p-4">
        <Button onClick={_ => ky.post("/api/build")}>Build</Button>
        <div ref={onload}></div>
      </div>
      <div class="flex-1 p-4">
        <Preview />
      </div>
    </div>
  )
}

export default App

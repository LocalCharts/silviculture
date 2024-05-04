import * as random from "lib0/random"
import * as Y from "yjs"
import ky from 'ky'
// @ts-ignore
import { yCollab } from 'y-codemirror.next'
import { EditorView, basicSetup } from "codemirror"
import { EditorState } from "@codemirror/state"
import { HocuspocusProvider } from "@hocuspocus/provider"
import { vim, Vim } from '@replit/codemirror-vim'

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

type EditorProps = {
  ytext: Y.Text,
  provider: HocuspocusProvider,
  setContent: (content: string) => void
}

type BuildResult = {
  content: string
}

export function Editor(props: EditorProps) {
  var ref: Element

  props.provider.awareness?.setLocalStateField('user', {
    name: 'Anonymous ' + Math.floor(Math.random() * 100),
    color: userColor.color,
    colorLight: userColor.light
  })

  async function build() {
    const result = await ky
      .post("/api/build", { json: { tree: 'ocl-0001' }, timeout: false })
      .json() as BuildResult
    props.setContent(result.content)
  }

  function onload(elt: Element) {
    ref = elt

    const ytext = props.ytext
    const provider = props.provider

    const undoManager = new Y.UndoManager(ytext)

    Vim.defineEx('write', 'w', build)

    const state = EditorState.create({
      doc: ytext.toString(),
      extensions: [
        vim(),
        basicSetup,
        EditorView.lineWrapping,
        yCollab(ytext, provider.awareness, { undoManager })
      ]
    })

    new EditorView({
      state,
      parent: ref
    })
  }

  return (
    <div>
      <div ref={onload}></div>
    </div>
  )
}

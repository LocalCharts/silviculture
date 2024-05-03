import * as random from "lib0/random"
import * as Y from "yjs"
import ky from 'ky'
import { Button } from "./Button"
import { yCollab } from 'y-codemirror.next'
import { EditorView, basicSetup } from "codemirror"
import { EditorState } from "@codemirror/state"
import { HocuspocusProvider } from "@hocuspocus/provider"

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
  provider: HocuspocusProvider
}

export function Editor(props: EditorProps) {
  var ref: Element
  var view: EditorView

  props.provider.awareness?.setLocalStateField('user', {
    name: 'Anonymous ' + Math.floor(Math.random() * 100),
    color: userColor.color,
    colorLight: userColor.light
  })

  function onload(elt: Element) {
    ref = elt

    const ytext = props.ytext
    const provider = props.provider

    const undoManager = new Y.UndoManager(ytext)

    const state = EditorState.create({
      doc: ytext.toString(),
      extensions: [
        basicSetup,
        EditorView.lineWrapping,
        yCollab(ytext, provider.awareness, { undoManager })
      ]
    })

    view = new EditorView({
      state,
      parent: ref
    })
  }

  return (
    <div>
      <Button onClick={_ => ky.post("/api/build")}>Build</Button>
      <div ref={onload}></div>
    </div>
  )
}
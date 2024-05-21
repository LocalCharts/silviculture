import * as random from 'lib0/random'
import * as Y from 'yjs'
import ky from 'ky'
// @ts-expect-error
import { yCollab } from 'y-codemirror.next'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { HocuspocusProvider } from '@hocuspocus/provider'
import { vim, Vim } from '@replit/codemirror-vim'
import { JSXElement } from 'solid-js'
import { BuildResult } from '../common/api'

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

interface EditorProps {
  ytext: Y.Text
  provider: HocuspocusProvider
  setResult: (content: BuildResult) => void
}


export function Editor (props: EditorProps): JSXElement {
  let ref: Element

  props.provider.awareness?.setLocalStateField('user', {
    name: 'Anonymous ' + Math.floor(Math.random() * 100).toString(),
    color: userColor.color,
    colorLight: userColor.light
  })

  async function build (): Promise<void> {
    const result = await ky
      .post('/api/build', { json: { tree: 'ocl-0001' }, timeout: false })
      .json() as BuildResult
    props.setResult(result)
  }

  function onload (elt: Element): void {
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
      <div ref={onload} />
    </div>
  )
}

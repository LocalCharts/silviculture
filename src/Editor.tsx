import * as random from 'lib0/random'
import * as Y from 'yjs'
// @ts-expect-error
import { yCollab } from 'y-codemirror.next'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState, Compartment } from '@codemirror/state'
import { keymap } from '@codemirror/view'
import { HocuspocusProvider } from '@hocuspocus/provider'
import { vim, Vim } from '@replit/codemirror-vim'
import { JSXElement, createEffect, createSignal, onCleanup, onMount } from 'solid-js'
import { NewTreeRequest, NewTreeResponse } from '../common/api'
import ky from 'ky'

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
  vibindings : boolean
  buildFn: () => void
  tree: string
}

async function newTransclude(req: NewTreeRequest, ev: EditorView) {
  const response = (await (
    await ky.post('/api/newtree', { json: req })
  ).json()) as NewTreeResponse
  const selection = ev.state.selection.main
  const toInsert = `\\transclude{${response.name}}`
  ev.dispatch({
    changes: {
      from: selection.head,
      insert: toInsert
    },
    selection: {
      anchor: selection.head + toInsert.length
    }
  })
}

type TextInputProps = {
  name: string,
  focus: boolean,
  ref?: (elt: HTMLElement) => void
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function TextInput (props: TextInputProps) {
  let ref: HTMLElement


  if (props.focus) {
    onMount(() => ref.focus())
  }

  return (
    <>
      <label class="w-1/3 m-2 text-right" for={props.name}>{capitalize(props.name)}: </label>
      <input ref={elt => { ref = elt; if (props.ref) { props.ref(elt) } }} class="w-1/2 my-2" name={props.name} type="text"></input>
    </>
  )
}

type NewTreeModalProps = {
  visible: boolean,
  submit: (req: NewTreeRequest) => Promise<void>,
  defaultNamespace: string,
  cancel: () => void
}

function undefIfEmpty(s: string | undefined) {
  return s == '' ? undefined : s
}


function NewTreeModal (props: NewTreeModalProps): JSXElement {
  async function onSubmit(evt: SubmitEvent) {
    console.log('submitted')
    evt.preventDefault()
    const form = evt.target as HTMLFormElement
    const formData = new FormData(form)
    await props.submit({
      namespace: formData.get('namespace')?.toString() as string,
      taxon: undefIfEmpty(formData.get('taxon')?.toString()),
      title: undefIfEmpty(formData.get('title')?.toString()),
    })
    form.reset()
  }

  onMount(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Escape') props.cancel()
    }

    document.addEventListener('keydown', down)
    onCleanup(() => document.removeEventListener('keydown', down))
  })


  let ref: HTMLElement
  let namespaceInput: HTMLElement | undefined

  createEffect(() => {
    if (props.visible) {
      if (namespaceInput) {
        namespaceInput.focus()
      }
    }
  })

  const clickOutside = (e: MouseEvent) => {
    if (ref && !ref.contains(e.target as any)) {
      props.cancel()
    }
  }

  document.addEventListener('click', clickOutside)

  onCleanup(() => {
    document.removeEventListener('mousedown', clickOutside);
  });
  return (
    <div
      ref={elt => ref = elt}
      class="fixed top-5 left-1/2 -translate-x-1/2 bg-white p-4 border border-black border-solid border-2 rounded flex flex-col"
      classList={{invisible: !props.visible}}
    >
      <div class="w-full font-bold text-lg text-center m-b-2">New Tree</div>
      <form class="flex flex-wrap" onSubmit={onSubmit}>
        <TextInput ref={(elt: HTMLElement) => namespaceInput = elt} name="namespace" focus={true} />
        <TextInput name="taxon" focus={false} />
        <TextInput name="title" focus={false} />
        <input type="submit" hidden />
      </form>
      <div class="text-slate-400">Hit enter to create new tree</div>
    </div>
  )
}

export function Editor (props: EditorProps): JSXElement {
  let ref: HTMLElement
  let view: EditorView

  props.provider.awareness?.setLocalStateField('user', {
    name: 'Anonymous ' + Math.floor(Math.random() * 100).toString(),
    color: userColor.color,
    colorLight: userColor.light
  })

  const [newTreeShown, setNewTreeShown] = createSignal(false)

  function onload (elt: HTMLElement): void {
    ref = elt

    const ytext = props.ytext
    const provider = props.provider
    const vimConf = new Compartment
    const undoManager = new Y.UndoManager(ytext)

    Vim.defineEx('write', 'w', props.buildFn)

    let state = EditorState.create({
      doc: ytext.toString(),
      extensions: [
        keymap.of([
          {
            key: "Mod-Enter",
            run: _ => {props.buildFn(); return true}
          },
          {
            key: "Ctrl-s",
            run: _ => {props.buildFn(); return true},
            preventDefault: true
          },
          {
            key: "Ctrl-i",
            run: (_ev) => {
              setNewTreeShown(true)
              return true
            },
            preventDefault: true
          }
        ]),    
        vimConf.of(vim()),
        basicSetup,
        EditorView.lineWrapping,
        yCollab(ytext, provider.awareness, { undoManager })
      ]
    })

    view = new EditorView({
      state,
      parent: ref
    })

    createEffect(() => {
      if (props.vibindings) {
        view.dispatch({
          effects: vimConf.reconfigure(vim())
        })
      } else {
        view.dispatch({
          effects: vimConf.reconfigure([])
        })
      }
    })
  }


  return (
    <>
      <div
        ref={onload}
      />
      <NewTreeModal
        visible={newTreeShown()}
        submit={async (req) => {
          await newTransclude(req, view)
          setNewTreeShown(false)
          view.focus()
        }}
        defaultNamespace=''
        cancel={() => {
          setNewTreeShown(false)
          view.focus()
        }} />
    </>
  )
}

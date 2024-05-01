import { HocuspocusProvider } from "@hocuspocus/provider"
import { For, JSX, splitProps } from "solid-js"
import { yArraySignal } from "./YSignal"
import * as Y from "yjs"
import * as random from "lib0/random"

import { yCollab } from 'y-codemirror.next'
import { EditorView, basicSetup } from "codemirror"
import { EditorState } from "@codemirror/state"

type Task = Y.Map<any> & {
  get(_: "description"): string
  get(_: "id"): number
  set(_: "description", val: string): void
}

function newTask() {
  const t = new Y.Map()
  t.set("description", "")
  t.set("id", 0)
  return (t as Task)
}


type TodoListProps = {
  ytasks: Y.Array<Task>
}

function TodoList(props: TodoListProps) {
  const tasks = yArraySignal(props.ytasks)

  return (
    <ul class="list-disc list-inside my-2">
      <For each={tasks()}>
        {(task,i) =>
        <li> {task.get("id") + task.get("description")} <Trash onClick={_ => props.ytasks.delete(i())}/> </li>}
      </For>
    </ul>
  )
}

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

function Trash(props: JSX.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button class="relative align-baseline top-[1.5px]" {...props}>
      <div class="i-tabler-trash" />
    </button>
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
    url: "ws://127.0.0.1:1234/collaboration",
    name: "example-document",
  });

  // Define `tasks` as an Array

  const ytasks: Y.Array<Task> = provider.document.getArray("tasks");

  const ytext = provider.document.getText('codemirror')

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
    <div class="font-sans container mx-auto">
      <h1 class="text-xl font-bold">Todo</h1>
      <TodoList ytasks={ytasks} />
      <Button onClick={_ => ytasks.push([newTask()])}>Add Todo</Button>
      <div ref={onload}></div>
    </div>
  )
}

export default App

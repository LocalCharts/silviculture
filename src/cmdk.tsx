import { Command } from 'cmdk-solid'
import { createSignal, onMount, onCleanup, Show, createResource, Resource, For } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import ky from 'ky';
export { CommandMenu };
//const navigate = useNavigate()
type ItemProps = {
  name: string
  onSelect: (value: any) => void
}

function Item(props: ItemProps) {
  return (
    <Command.Item
      onSelect={props.onSelect}
      class="p-2 bg-gray-50 my-2 cursor-pointer">
      {props.name}
    </Command.Item>
  )
}

type Tree = {
  title: string,
  route: string,
  taxon: string | null,
  tags: string[],
}

type Trees = Record<string, Tree>

type CommandMenuProps = {
  buildFunction: () => void,
  trees: Resource<Trees>,
  done: () => void
}

const CommandMenu = (props: CommandMenuProps) => {
  const [open, setOpen] = createSignal(false)

  const [trees, {}] = createResource<Trees>(async () => {
    return await (await ky.get('/built/forest.json')).json()
  })

  let menuRef: HTMLElement
  // Toggle the menu when ⌘K is pressed
  onMount(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('keydown', down)
    onCleanup(() => document.removeEventListener('keydown', down))
  })

  const clickOutside = (e: MouseEvent) => {
    if (menuRef && !menuRef.contains(e.target as any)) {
      setOpen(false);
    }
  }

  document.addEventListener('click', clickOutside)

  onCleanup(() => {
    document.removeEventListener('mousedown', clickOutside);
  });

  return (
    <Show when={open()}>
      <div ref={el => menuRef = el}>
        <CommandInner
          buildFunction={props.buildFunction}
          trees={trees}
          done={() => setOpen(false)} />
      </div>
    </Show>
  );
}


function CommandInner(props: CommandMenuProps) {
  let ref: HTMLElement
  onMount(() => {
    ref.focus()
  })
  const navigate = useNavigate();
  return <Command
    class="fixed top-5 left-1/2 -translate-x-1/2 bg-white p-6 border border-gray-200 rounded text-lg w-128 z-1000"
    label="Global Command Menu">
    <Command.Input
      class="w-full border border-gray-200 rounded p-2 focus:outline-none focus:border-blue-500 my-2"
      ref={el => ref = el} placeholder="type somethin'" />
    <Command.List>
      <Command.Empty>No results found.</Command.Empty>
      <Show when={props.trees()}>
        {trees =>
          <For each={Object.entries(trees())}>
            {nt => {
              const [name, tree] = nt;
              const title = (tree.title == null) ? name : tree.title
              return <Item name={title} onSelect={_ => { navigate("/" + name); props.done(); } } />
            }}
          </For>
        }
      </Show>
      <Item name="build" onSelect={_ => { props.buildFunction(); props.done() }} />
    </Command.List>
  </Command>
}


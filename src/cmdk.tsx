import { Command } from 'cmdk-solid'
import { createSignal, onMount, onCleanup, Show, createResource, Resource, For } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import ky from 'ky';
export { CommandMenu };
import './cmdk.css'

type TreeItemProps = {
  tree: Tree,
  name: string
  goto: (tree: string) => void
}

function TreeItem(props: TreeItemProps) {
  const tree = props.tree
  let title: string

  if (tree.taxon == null && tree.title == null) {
    title = 'Untitled'
  } else if (tree.taxon == null) {
    title = tree.title!
  } else if (tree.title == null) {
    title = tree.taxon
  } else {
    title = `${tree.taxon}. ${tree.title}`
  }
  
  return (
    <Command.Item
      onSelect={_ => props.goto(props.name)}
      class="p-4 bg-gray-50 my-2 cursor-pointer text-sm border-none border-l-solid border-l-2 border-l-transparent rounded-sm">
      {`${title} [${props.name}]`}
    </Command.Item>
  )
}

type Tree = {
  title: string | null,
  route: string,
  taxon: string | null,
  tags: string[],
}

type Trees = Record<string, Tree>

type CommandMenuProps = {
  buildFunction: () => void,
}

const CommandMenu = (_props: CommandMenuProps) => {
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
          trees={trees}
          done={() => setOpen(false)} />
      </div>
    </Show>
  );
}

type CommandInnerProps = {
  done: () => void,
  trees: Resource<Trees>
}

function CommandInner(props: CommandInnerProps) {
  const navigate = useNavigate()

  function goto(name: string) {
    navigate('/' + name)
    props.done()
  }

  let ref: HTMLElement
  onMount(() => {
    ref.focus()
  })
  return <Command
    class="fixed top-5 left-1/2 -translate-x-1/2 bg-white p-6 border border-gray-200 rounded text-lg w-128 z-1000 h-128 flex flex-col"
    label="Global Command Menu"
    filter={(value, search) => {
      if (value.includes(search)) return 1
      return 0
    }}>
    <Command.Input
      class="w-full border border-gray-200 rounded p-2 focus:outline-none focus:border-blue-500 my-2"
      ref={el => ref = el} placeholder="search for a tree" />
    <Command.List class="flex-grow overflow-y-auto">
      <Command.Empty>No results found.</Command.Empty>
      <Show when={props.trees()}>
        {trees =>
          <For each={Object.entries(trees()).sort(
            (a, b) => a[0].localeCompare(b[0])
          )}>
            {nt => <TreeItem name={nt[0]} tree={nt[1]} goto={goto} />}
          </For>
        }
      </Show>
    </Command.List>
  </Command>
}


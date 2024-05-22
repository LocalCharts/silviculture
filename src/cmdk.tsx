import {Command } from 'cmdk-solid'
import {createSignal, onMount, onCleanup, Show} from 'solid-js'
export {CommandMenu};

type ItemProps = {
  name: string
}

function Item (props: ItemProps) {
  return (
    <Command.Item
      class="p-2 bg-gray-50 my-2">
      {props.name}
    </Command.Item>
  )
}

const CommandMenu = () => {
  const [open, setOpen] = createSignal(false)
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
        <CommandInner />
      </div>
    </Show>
  );
}

function CommandInner () {
  let ref: HTMLElement
  onMount(() => {
    ref.focus()
  })
  return <Command
        class="fixed top-5 left-1/2 -translate-x-1/2 bg-white p-6 border border-gray-200 rounded text-lg w-128"
        label="Global Command Menu"  
      >
        <Command.Input
          class="w-full border border-gray-200 rounded p-2 focus:outline-none focus:border-blue-500 my-2" 
        ref={el => ref = el} placeholder="type somethin'" />
        <Command.List>
          <Command.Empty>No results found.</Command.Empty>
          <Item name="Here's a tree" />
          <Item name="Here's a command" />
        </Command.List>
      </Command>
}


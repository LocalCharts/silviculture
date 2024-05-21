import {Command } from 'cmdk-solid'
import {createSignal, onMount, onCleanup} from 'solid-js'
import "./styles/test.css";
export {CommandMenu};


const CommandMenu = () => {
  const [open, setOpen] = createSignal(false)

  // Toggle the menu when ⌘K is pressed
  onMount(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    onCleanup(() => document.removeEventListener('keydown', down))
  })

  return (
    <Command.Dialog class= "test" open={open()} onOpenChange={setOpen} label="Global Command Menu">
      <Command.Input placeholder="type somethin'"/>
      <Command.List>
        <Command.Empty>No results found.</Command.Empty>

        <Command.Group heading="Letters">
          <Command.Item>a</Command.Item>
          <Command.Item>b</Command.Item>
          <Command.Separator />
          <Command.Item>c</Command.Item>
        </Command.Group>

        <Command.Item>Apple</Command.Item>
      </Command.List>
    </Command.Dialog>
  )
}


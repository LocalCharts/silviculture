import { UI } from "./quiver/ui.js"
import { DOM } from "./quiver/dom.js"
import { onMount } from "solid-js"
import "./quiver/main.css"

export function Quiver () {
  let elt: Element

  onMount(() => {
    const body = new DOM.Element(elt)
    const ui = new UI(body)
    ui.initialise()
  })

  return (
    <div class="fixed w-screen h-screen top-0 left-0 bg-transparent pointer-events-none">
      <div class="box-border w-full h-full bg-white border-solid border-black border-2 pointer-events-auto">
        <div class="bg-transparent w-full h-full" ref={e => elt = e}></div>
      </div>
    </div>
  )
}

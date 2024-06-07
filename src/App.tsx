import { HocuspocusProvider } from '@hocuspocus/provider'
import { useParams } from '@solidjs/router'
import { Editor } from './Editor'
import { Preview } from './Preview'
import { createSignal, JSXElement, createMemo } from 'solid-js'
import {CommandMenu} from './cmdk'
import ky from 'ky'
import { Pane, PaneState } from './Pane'
/* import { Quiver } from './Quiver' */
import { TopBar } from './TopBar'
import './styles/anim.css'

function hasEditor (s: PaneState): boolean {
  return (s === PaneState.EDITOR_ONLY || s === PaneState.EDITOR_AND_PREVIEW)
}

function hasPreview (s: PaneState): boolean {
  return (s === PaneState.PREVIEW_ONLY || s === PaneState.EDITOR_AND_PREVIEW)
}

function App (): JSXElement {
  const params = useParams()
  const tree = createMemo(() => {
    return params.tree.replace(/\.xml$/, '')
  })
  // Connect it to the backend
  const provider = createMemo((oldProvider: HocuspocusProvider | null) => {
    if (oldProvider != null) {
      oldProvider.destroy()
    }
    return new HocuspocusProvider({
      url: '/collaboration',
      name: tree() + '.tree'
    })
  }, null)

  // Define `tasks` as an Array

  const ytext = createMemo(() => {
    return provider().document.getText("content");
  });

  const [paneState, setPaneState] = createSignal(PaneState.EDITOR_AND_PREVIEW);
  const [vimState, setVimState] = createSignal(false);
  const [helpState, setHelpState] = createSignal(false);

  function build() {
    ky.post("/api/build", { json: { } })
  }

  const editor = createMemo(() => {
    const ytextNow = ytext()
    const providerNow = provider()
    const treeNow = tree()

    return (
      <Editor
        ytext={ytextNow}
        provider={providerNow}
        tree={treeNow}
        vibindings={vimState()}
        buildFn={build}
      />
    )
  })

  //not sure the top-8 positioning will always look good
  return (
    <div class="lg-container font-sans mx-auto h-screen max-h-screen box-border max-w-296">
      <div class="flex flex-col h-full w-full box-border">
        <TopBar
          state={paneState()}
          vimstate={vimState()}
          helpState={helpState()}
          setHelpState={setHelpState}
          setState={setPaneState}
          setVimState={setVimState}
          buildFunction={build}
        />
        <CommandMenu buildFunction={build} />
        <div
          classList={{
            "max-w-160": paneState() !== PaneState.EDITOR_AND_PREVIEW,
            "max-w-full": paneState() === PaneState.EDITOR_AND_PREVIEW,
          }}
          class="flex flex-grow flex-row overflow-y-auto box-border border-2px border-black border-solid mx-auto w-full"
        >
          {hasEditor(paneState()) && (
            <Pane fullWidth={paneState() === PaneState.EDITOR_ONLY}>
              {editor()}
            </Pane>
          )}
          {paneState() === PaneState.EDITOR_AND_PREVIEW && (
            <div class="w-2px h-full bg-black mx-1"></div>
          )}
          {hasPreview(paneState()) && (
            <Pane fullWidth={paneState() === PaneState.PREVIEW_ONLY}>
              <Preview tree={tree()} showHelp={helpState()} />
            </Pane>
          )}
        </div>
      </div>
    </div>
  )
}

export default App

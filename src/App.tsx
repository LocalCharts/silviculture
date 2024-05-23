import { HocuspocusProvider } from '@hocuspocus/provider'
import { useParams } from '@solidjs/router'
import { Editor } from './Editor'
import { Preview, PreviewProps } from './Preview'
import { createResource, createSignal, JSX, JSXElement, Show, splitProps,createMemo, Accessor, createEffect } from 'solid-js'
import { BuildResult } from '../common/api'
import {CommandMenu} from './cmdk'
import ky from 'ky'
import { Pane, PaneState } from './Pane'
import { TopBar } from './TopBar'

function hasEditor (s: PaneState): boolean {
  return (s === PaneState.EDITOR_ONLY || s === PaneState.EDITOR_AND_PREVIEW)
}

function hasPreview (s: PaneState): boolean {
  return (s === PaneState.PREVIEW_ONLY || s === PaneState.EDITOR_AND_PREVIEW)
}

async function loadResult (treeName: string): Promise<BuildResult> {
  const content = await (await ky.get(`/built/${treeName}.xml`)).text()
  console.log('got new content')
  return { success: true, content }
}

async function loadXSL (): Promise<string> {
  return await (await ky.get('/built/forest.xsl')).text()
}

function App (): JSXElement {
  const params = useParams()
  const tree = createMemo(() => {
    return params.tree.replace(/\.xml$/, '')
  })
  // Connect it to the backend
  const provider = createMemo(() => {
    return new HocuspocusProvider({
      url: '/collaboration',
      name: tree() + '.tree'
    })
  })

  // Define `tasks` as an Array

  const ytext = createMemo(() => {
    return provider().document.getText("content");
  });

  const [paneState, setPaneState] = createSignal(PaneState.EDITOR_AND_PREVIEW);
  const [vimState, setVimState] = createSignal(false);
  const [xsl, {}] = createResource(loadXSL);

  const [
    buildResult,
    { mutate: mutateBuildResult, refetch: refetchBuildResult },
  ] = createResource(() => loadResult(tree()));

  async function build(): Promise<void> {
    const result = (await ky
      .post("/api/build", { json: { tree: tree() }, timeout: false })
      .json()) as BuildResult;
    mutateBuildResult(result);
  }

  const previewProps: Accessor<PreviewProps | null> = createMemo(() => {
    const xslVal = xsl();
    const buildResultVal = buildResult();
    if (xslVal !== undefined && buildResultVal !== undefined) {
      return { xsl: xslVal, result: buildResultVal };
    } else {
      return null;
    }
  });

  const editor = createMemo(() => {
    const ytextNow = ytext()
    const providerNow = provider()
    const treeNow = tree()

    refetchBuildResult()

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

  return (
    <div class='lg-container font-sans mx-auto h-screen max-h-screen box-border max-w-296'>
      <div class="flex flex-col h-full box-border">
        <TopBar state={paneState()} vimstate={vimState()} setState={setPaneState} setVimState={setVimState} buildFn={build}/>
        <CommandMenu />
        <div
          classList={{
            'max-w-160': paneState() !== PaneState.EDITOR_AND_PREVIEW,
            'max-w-full': paneState() === PaneState.EDITOR_AND_PREVIEW
          }}
          class='flex flex-grow flex-row overflow-y-auto box-border border-2px border-black border-solid mx-auto'>
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
              <Show when={previewProps()}>
                {props => <Preview {...props()} />}
              </Show>
            </Pane>
          )}
        </div>
      </div>
    </div>
  )
}

export default App

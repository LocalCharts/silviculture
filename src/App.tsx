import { HocuspocusProvider } from '@hocuspocus/provider'
import { useParams } from '@solidjs/router'
import { Editor } from './Editor'
import { Preview, PreviewProps } from './Preview'
import { createResource, createSignal, JSX, JSXElement, Show, splitProps,createMemo, Accessor, createEffect } from 'solid-js'
import { BuildResult } from '../common/api'
import {CommandMenu} from './cmdk'
import ky from 'ky'
import { Pane } from './Pane'
//import { prototype } from 'events'

enum PaneState {
  EDITOR_AND_PREVIEW,
  EDITOR_ONLY,
  PREVIEW_ONLY
}

function hasEditor (s: PaneState): boolean {
  return (s === PaneState.EDITOR_ONLY || s === PaneState.EDITOR_AND_PREVIEW)
}

function hasPreview (s: PaneState): boolean {
  return (s === PaneState.PREVIEW_ONLY || s === PaneState.EDITOR_AND_PREVIEW)
}

type TopBarChoiceProps = {
  enabled: boolean
} & JSX.HTMLAttributes<HTMLButtonElement>

//split into topbar.tsx?
function TopBarChoice (props: TopBarChoiceProps): JSXElement {
  const [, rest] = splitProps(props, ['enabled'])
  return (
    <button
      class='py-1 px-3 border-1 border-solid border-black' //should use Button.tsx?
      classList={{
        'bg-slate-200': props.enabled,
        'hover:bg-slate-300': props.enabled,
        'hover:bg-slate-100': !props.enabled
      }}
      {...rest}
    >
      {props.children}
    </button>
  )
}

interface TopBarProps {
  state: PaneState
  vimstate: boolean
  setState: (s: PaneState) => void
  setVimState: (s: boolean) => void
}

function TopBar (props: TopBarProps): JSXElement {
  return (
    <div class='flex flex-row m-2'>
      <TopBarChoice
        enabled={props.state === PaneState.EDITOR_ONLY}
        onClick={_ => props.setState(PaneState.EDITOR_ONLY)}
      >
        <div class='i-tabler-ballpen-filled' />
      </TopBarChoice>
      <TopBarChoice
        enabled={props.state === PaneState.EDITOR_AND_PREVIEW}
        onClick={_ => props.setState(PaneState.EDITOR_AND_PREVIEW)}
      >
        <div class='i-tabler-ballpen-filled' />
        <div class='i-tabler-eye' />
      </TopBarChoice>
      <TopBarChoice
        enabled={props.state === PaneState.PREVIEW_ONLY}
        onClick={_ => props.setState(PaneState.PREVIEW_ONLY)}
      >
        <div class='i-tabler-eye' />
      </TopBarChoice>
      <div style="margin: 3px"></div>
      <TopBarChoice
        enabled={props.vimstate === true}
        onClick={_ => props.setVimState(!props.vimstate)}
      >
        <div class="i-simple-icons:vim"></div>
      </TopBarChoice>
    </div>
  )
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
  // Connect it to the backend
  const provider = new HocuspocusProvider({
    url: '/collaboration',
    name: params.tree + '.tree'
  })

  // Define `tasks` as an Array

  const ytext = provider.document.getText('content')

  const [paneState, setPaneState] = createSignal(PaneState.EDITOR_AND_PREVIEW)
  const [vimState,setVimState] = createSignal(false)
  createEffect(() => {console.log('vimstate changed to',vimState())})
  const [xsl, {}] = createResource(loadXSL)
  const [buildResult, { mutate: mutateBuildResult }] =
    createResource(() => loadResult(params.tree))

  const previewProps: Accessor<PreviewProps | null> = createMemo(() => {
    const xslVal = xsl()
    const buildResultVal = buildResult()
    if (xslVal !== undefined && buildResultVal !== undefined) {
      return { xsl: xslVal, result: buildResultVal }
    } else {
      return null;
    }
  })
  return (
    <div class='lg-container font-sans mx-auto h-screen max-h-screen box-border max-w-296'>
      <div class="flex flex-col h-full box-border">
        <TopBar state={paneState()} vimstate={vimState()} setState={setPaneState} setVimState={setVimState}/>
        <CommandMenu />
        <div
          classList={{
            'max-w-160': paneState() !== PaneState.EDITOR_AND_PREVIEW,
            'max-w-full': paneState() === PaneState.EDITOR_AND_PREVIEW
          }}
          class='flex flex-grow flex-row overflow-y-auto box-border border-2px border-black border-solid mx-auto'>
          {hasEditor(paneState()) && (
            <Pane fullWidth={paneState() === PaneState.EDITOR_ONLY}>
              <Editor
                ytext={ytext}
                provider={provider}
                vibindings={vimState()}
                setResult={mutateBuildResult}
                tree={params.tree}
              />
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

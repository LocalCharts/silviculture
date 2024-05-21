import { HocuspocusProvider } from '@hocuspocus/provider'
import { Editor } from './Editor'
import { Preview, PreviewProps } from './Preview'
import { createResource, createSignal, JSX, JSXElement, Show, splitProps,createMemo, Accessor } from 'solid-js'
import { BuildResult } from '../common/api'
import ky from 'ky'

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
      class='py-1 px-3 border-1 border-solid border-black'
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
  setState: (s: PaneState) => void
}

function TopBar (props: TopBarProps): JSXElement {
  return (
    <div class='flex flex-row'>
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
    </div>
  )
}

async function loadResult (): Promise<BuildResult> {
  const content = await (await ky.get('/built/ocl-0001.xml')).text()
  console.log('got new content')
  return { success: true, content }
}

async function loadXSL (): Promise<string> {
  return await (await ky.get('/built/forest.xsl')).text()
}

function App (): JSXElement {
  // Connect it to the backend
  const provider = new HocuspocusProvider({
    url: '/collaboration',
    name: 'ocl-0001.tree'
  })

  // Define `tasks` as an Array

  const ytext = provider.document.getText('content')

  const [paneState, setPaneState] = createSignal(PaneState.EDITOR_AND_PREVIEW)

  const [xsl, {}] = createResource(loadXSL)
  const [buildResult, { mutate: mutateBuildResult }] = createResource(loadResult)

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
    <div class='container font-sans mx-auto'>
      <TopBar state={paneState()} setState={setPaneState} />
      <div class='flex flex-1'>
        {hasEditor(paneState()) && (
          <div class={paneState() === PaneState.EDITOR_ONLY ? 'w-full p-4' : 'w-1/2 p-4'}>
            <Editor
              ytext={ytext}
              provider={provider}
              setResult={mutateBuildResult}
            />
          </div>
        )}
      {hasPreview(paneState()) && (
          <div class={paneState() === PaneState.PREVIEW_ONLY ? 'w-full p-4' : 'w-1/2 p-4'}>
            <Show when={previewProps()}>
              {props => <Preview {...props()} />}
            </Show>
          </div>
        )}
      </div>
    </div>
  )
}

export default App

import { JSX, JSXElement, splitProps } from 'solid-js'
import { PaneState } from './Pane'
export { TopBar }


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
  buildFunction : () => Promise<void>
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
      <TopBarChoice //tooltips!!!
        enabled={false}
        onClick={_ => props.buildFunction()}
      >
        <div >build</div>
      </TopBarChoice>
    </div>
  )
}
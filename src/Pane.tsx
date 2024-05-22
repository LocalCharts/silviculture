import { JSX, splitProps } from 'solid-js'

type PaneProps = {
  fullWidth: boolean
  children: any
} & JSX.HTMLAttributes<HTMLDivElement>

export function Pane(props: PaneProps) {
  const [, rest] = splitProps(props, ['fullWidth', 'children'])
  return (
    <div
      class="h-full max-h-full overflow-y-auto box-border"
      classList={{
        'w-full': props.fullWidth,
        'w-1/2': !props.fullWidth
      }}
      {...rest}>
      {props.children}
    </div>
  )
}

export enum PaneState {
  EDITOR_AND_PREVIEW,
  EDITOR_ONLY,
  PREVIEW_ONLY
}
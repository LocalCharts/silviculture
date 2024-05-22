type PaneProps = {
  fullWidth: boolean
  children: any
}

export function Pane(props: PaneProps) {
  return (
    <div
      class="h-full max-h-full overflow-y-auto box-border"
      classList={{
        'w-full': props.fullWidth,
        'w-1/2': !props.fullWidth
      }}>
      {props.children}
    </div>
  )
}

import { JSX, JSXElement, splitProps } from 'solid-js'

type ButtonProps = {
  children: string
} & JSX.HTMLAttributes<HTMLButtonElement>

export function Button (props: ButtonProps): JSXElement {
  const [, rest] = splitProps(props, ['children'])
  return (
    <button
      class='font-bold py-2 px-2 rounded border-2 border-solid border-black hover:bg-slate-100'
      {...rest}
    >
      {props.children}
    </button>
  )
}

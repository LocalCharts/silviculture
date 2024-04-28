import { createSignal, createEffect, Match, Switch } from 'solid-js'
import ky from 'ky'
import './App.css'
import { GreetRequest } from './bindings/GreetRequest'
import { GreetResponse } from './bindings/GreetResponse'

async function getGreeting(name: string, setState: (state: State) => void) {
  let request: GreetRequest = { name }
  let json: GreetResponse = await ky.post('/api', {json: request}).json()
  console.log(json)
  setState({
    tag: 'DisplayingResponse',
    response: json.message
  })
}

type NameFormProps = {
  setState: (state: State) => void
}

function NameForm(props: NameFormProps) {
  let [name, setName] = createSignal('')

  return (
    <div>
      <input
        type="text"
        oninput={evt => setName(evt.target.value)}
        value={name()}>
      </input>

      <button onclick={_ => getGreeting(name(), props.setState)}>
        Greet!
      </button>
    </div>
  )
}

type InputtingName = {
  tag: 'InputtingName'
}

type DisplayingResponse = {
  tag: 'DisplayingResponse',
  response: string
}

type State = InputtingName | DisplayingResponse;

type ResponseDisplayProps = {
  state: () => State
  setState: (s: State) => void
}

function ResponseDisplay(props: ResponseDisplayProps) {
  let {state,setState} = props
  return (
    <Switch>
      <Match when={state().tag === 'InputtingName'}>
        <div></div>
      </Match>
      <Match when={state().tag === 'DisplayingResponse'}>
        <div>
          <p>{(state() as DisplayingResponse).response}</p>
          <button onclick={_ => setState({tag: 'InputtingName'})}>
            Dismiss
          </button>
        </div>
      </Match>
    </Switch>
  )
}

function App() {
  let [state, setState] = createSignal<State>({
    tag: 'InputtingName'
  })

  return (
    <div>
      <NameForm setState={setState}/>
      <ResponseDisplay state={state} setState={setState}/>
    </div>
  )
}

export default App

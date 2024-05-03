import { HocuspocusProvider } from "@hocuspocus/provider"
import { Editor } from "./Editor"
import { Preview } from "./Preview"

enum EditorState {
  EDITOR_ONLY,
  EDITOR_AND_VIEWER,
  VIEWER
}

function App() {
  // Connect it to the backend
  const provider = new HocuspocusProvider({
    url: "/collaboration",
    name: "ocl-0001.tree",
  });

  // Define `tasks` as an Array

  const ytext = provider.document.getText('content')

  return (
    <div class="font-sans container mx-auto flex flex-row">
      <div class="flex-1 p-4">
        <Editor ytext={ytext} provider={provider}/>
      </div>
      <div class="flex-1 p-4">
        <Preview />
      </div>
    </div>
  )
}

export default App

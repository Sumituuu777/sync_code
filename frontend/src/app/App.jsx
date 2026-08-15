import './App.css'
import {Editor} from "@monaco-editor/react"

function App() {

  return (
    <main className='w-screen h-screen p-3 bg-gray-950 flex justify-center gap-3'>

      <aside className='h-full w-1/4 bg-gray-700 rounded-lg'>

      </aside>
      <section className='h-full w-3/4 bg-gray-800 rounded-lg'>
        <Editor
        height="100%"
          defaultLanguage='javascript'
          defaultValue='// comments'
          theme='vs-dark'
        />
      </section>
    </main>
  )
}

export default App

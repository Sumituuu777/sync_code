import './App.css'
import {Editor} from "@monaco-editor/react"
import {MonacoBinding} from "y-monaco"
import { useRef,useMemo } from 'react'
import * as Y from "yjs"
import {SocketIOProvider} from "y-socket.io"

function App() {

  const editorRef=useRef(null)

  const ydoc=useMemo(()=>new Y.Doc() , [])
  const yText=useMemo(()=>ydoc.getText("monaco"),[ydoc])

  const handleMount=(editor)=>{
    editorRef.current=editor

    const provider=new SocketIOProvider("http://localhost:3000","monaco",ydoc,{
      autoConnect:true
    })
    const monacoBinding=new MonacoBinding(
      yText,
      editorRef.current.getModel(),
      new Set([editorRef.current]),
      provider.awareness
    )
  }

  return (
    <main className='w-screen h-screen p-3 bg-gray-950 flex justify-center gap-3'>

      <aside className='h-full w-1/4 bg-gray-700 rounded-lg'>

      </aside>

      <section className='h-full w-3/4 bg-gray-800 rounded-lg overflow-hidden'>
        <Editor
        height="100%"
          defaultLanguage='javascript'
          defaultValue='// comments'
          theme='vs-dark'
          onMount={handleMount}
        />
      </section>
    </main>
  )
}

export default App

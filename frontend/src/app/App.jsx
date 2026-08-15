import './App.css'
import {Editor} from "@monaco-editor/react"
import {MonacoBinding} from "y-monaco"
import { useRef,useMemo } from 'react'
import * as Y from "yjs"
import {SocketIOProvider} from "y-socket.io"
import { useState } from 'react'
import { useEffect } from 'react'

function App() {

  const [username,setUsername]=useState(()=>{
    return new URLSearchParams(window.location.search).get("username") || ""
  })
  const editorRef=useRef(null)
  const [users,setUsers]=useState([])

  const ydoc=useMemo(()=>new Y.Doc() , [])
  const yText=useMemo(()=>ydoc.getText("monaco"),[ydoc])

  const handleMount=(editor)=>{
    editorRef.current=editor

    
  }

  const handleJoin=(e)=>{
    e.preventDefault()

    setUsername(e.target.username.value)
    window.history.pushState({},"","?username="+e.target.username.value)
  }

  useEffect(()=>{
    if(username && editorRef.current){

      const provider=new SocketIOProvider("http://localhost:3000","monaco",ydoc,{
      autoConnect:true
      })

      provider.awareness.setLocalStateField("user",{username})

      provider.awareness.on("change",()=>{
        const states=Array.from(provider.awareness.getStates().value())
        setUsers(states.filter(user=>user && user.username).map(state=>state.user))
      })

      function handleBeforeUnload(){
        provider.awareness.setLocalStateField("user",null)
      }

      window.addEventListener("beforeunload",handleBeforeUnload)

      const monacoBinding=new MonacoBinding(
        yText,
        editorRef.current.getModel(),
        new Set([editorRef.current]),
        provider.awareness
      )

      return()=>{
        monacoBinding.destroy()
        provider.disconnect()
        window.removeEventListener("beforeunload",handleBeforeUnload)
      }

    }
  },[
    username,
    editorRef.current
  ])

  if(!username){
    return(
      <main className='w-screen h-screen p-3 bg-gray-950 flex justify-center items-center gap-3'> 
        <form onSubmit={handleJoin}
              className='flex flex-col gap-2 '
        >

          <input type="text" 
          placeholder='Enter your username'
          className='p-2 rounded-lg bg-gray-800 text-white'
          name='username'
          />

          <button className='p-2 bg-gray-50 text-gray-800 rounded-md cursor-pointer'>
            Join
          </button>

        </form>
      </main>
    )
  }

  return (
    <main className='w-screen h-screen p-3 bg-gray-950 flex justify-center gap-3'>

      <aside className='h-full w-1/4 bg-gray-800 rounded-lg'>

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

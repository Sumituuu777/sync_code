import "./App.css";
import { Editor } from "@monaco-editor/react";
import { MonacoBinding } from "y-monaco";
import { useMemo, useState, useEffect } from "react";
import * as Y from "yjs";
import { SocketIOProvider } from "y-socket.io";

function App() {
  const [username, setUsername] = useState(() => {
    return (
      new URLSearchParams(window.location.search).get("username") || ""
    );
  });

  const [editor, setEditor] = useState(null);
  const [users, setUsers] = useState([]);

  // Yjs document
  const ydoc = useMemo(() => new Y.Doc(), []);

  //gets the shared text area named "monaco" from that document.
  const yText = useMemo(() => {
    return ydoc.getText("monaco");
  }, [ydoc]);

//   2. Why useMemo?

// You could technically write:

// const ydoc = new Y.Doc();

// But there's a problem.

// React can re-render your component many times.

// If you do:

// const ydoc = new Y.Doc();

// then every render could create a new Y.Doc.

//The empty dependency array [] means there are no values that should cause the memoized value to be recalculated.



  // Called when Monaco editor finishes mounting
  const handleMount = (editor) => {
    setEditor(editor);
  };

  // Join collaboration room
  const handleJoin = (e) => {
    e.preventDefault();

    const name = e.target.username.value.trim();

    if (!name) return;

    setUsername(name);

    //This code is used to change the URL to include the username without refreshing the page.
    //window.history.pushState(state, title, url);

    //Why encodeURIComponent(name)?
    // This protects the username if it contains special characters or spaces
    // For example:

    // encodeURIComponent("Sumit Kumar")

    // produces:

    // Sumit%20Kumar

    // So the URL becomes:

    // http://localhost:5173/?username=Sumit%20Kumar

    window.history.pushState(
      {},
      "",
      `?username=${encodeURIComponent(name)}`
    );
  };

  useEffect(() => {
    // Wait until both username AND Monaco editor are available
    if (!username || !editor) return;

    const provider = new SocketIOProvider(
      "/",             // socket io /yjs address
      "monaco",                        //This is the room/document name.
      ydoc,
      {
        autoConnect: true,
      }
    );

    // Add current user to awareness
    provider.awareness.setLocalStateField("user", {               //Awareness lets users share temporary information such as
      username,                                                //username, cursor position, selection, online/offline state
    });

    // Update sidebar users
    const updateUsers = () => {

      const states = Array.from(
        provider.awareness.getStates().values()
      );
      // Getting all awareness states
      // const states = Array.from(
      //   provider.awareness.getStates().values()
      // );

      // This looks complicated, but conceptually it's simple.

      // provider.awareness.getStates()

      // gets the awareness information of all connected clients.

      // Imagine it contains:

      // Map


      // Client 1 → { user: { username: "Sumit" } }
      // Client 2 → { user: { username: "Rahul" } }
      // Client 3 → { user: { username: "Aman" } }

      // .values() gets the values:

      // { user: { username: "Sumit" } }
      // { user: { username: "Rahul" } }
      // { user: { username: "Aman" } }

      // And:

      // Array.from(...)

      // turns them into a normal JavaScript array:

      // [
      //   { user: { username: "Sumit" } },
      //   { user: { username: "Rahul" } },
      //   { user: { username: "Aman" } }
      // ]

      const currentUsers = states
        .filter((state) => state.user?.username)
        .map((state) => state.user);
// for map Suppose you have:

        // [
        //   { user: { username: "Sumit" } },
        //   { user: { username: "Rahul" } }
        // ]

        // After:

        // .map((state) => state.user)

        // you get:

        // [
        //   { username: "Sumit" },
        //   { username: "Rahul" }
        // ]

      console.log("Current users:", currentUsers);

      setUsers(currentUsers);
    };

    // Listen for users joining/leaving
    provider.awareness.on("change", updateUsers);  //updateusers me change hone par listen karta h

    // Get current users immediately
    updateUsers();

    // Remove user when tab/browser closes
    const handleBeforeUnload = () => {
      provider.awareness.setLocalStateField("user", null);
    };

    window.addEventListener( "beforeunload", handleBeforeUnload);  //When the browser is about to unload this page, run handleBeforeUnload.

    // Connect Yjs document with Monaco
    const monacoBinding = new MonacoBinding(
      yText,
      editor.getModel(), //Monaco stores the actual editor content inside a model.
      new Set([editor]), //This tells the binding which Monaco editor instance should be connected to the Yjs text.(we only have one editor)
      provider.awareness // shares awareness information to the Monaco binding which
                         // is useful for collaborative features such as showing other users' cursors/selections.
    );

    // Cleanup function
    // React runs it when the effect needs to be cleaned up, such as when:

    // the component unmounts
    // dependencies change and the effect runs again
    return () => {
      provider.awareness.off("change", updateUsers);

      monacoBinding.destroy();

      provider.disconnect();

      window.removeEventListener(
        "beforeunload",
        handleBeforeUnload
      );
    };
  }, [username, editor, ydoc, yText]);



  // Show username form

  if (!username) {
    return (
      <main className="w-screen h-screen p-3 bg-gray-950 flex justify-center items-center">
        <form
          onSubmit={handleJoin}
          className="flex flex-col gap-2"
        >
          <input
            type="text"
            placeholder="Enter your username"
            className="p-2 rounded-lg bg-gray-800 text-white outline-none"
            name="username"
          />

          <button className="p-2 bg-gray-50 text-gray-800 rounded-md cursor-pointer hover:bg-gray-200 transition">
            Join
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="w-screen h-screen p-3 bg-gray-950 flex gap-3">
      {/* Sidebar */}
      <aside className="h-full w-1/4 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              Collaborators
            </h2>
          </div>

          <p className="text-xs text-gray-500 mt-1">
            {users.length}{" "}
            {users.length === 1 ? "user" : "users"} online
          </p>
        </div>

        <ul className="p-3 space-y-1">
          {users.map((user, index) => (
            <li
              key={index}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-800 transition-colors"
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-xs font-semibold text-gray-300">
                {user.username.charAt(0).toUpperCase()}
              </div>

              {/* Username */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 truncate">
                  {user.username}
                </p>

                <p className="text-[11px] text-green-500">
                  Online
                </p>
              </div>

              {/* Status */}
              <span className="w-2 h-2 rounded-full bg-green-500" />
            </li>
          ))}
        </ul>
      </aside>

      {/* Editor */}
      <section className="h-full w-3/4 bg-gray-800 rounded-xl overflow-hidden border border-gray-800">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          defaultValue="// Start coding..."
          theme="vs-dark"
          onMount={handleMount}
        />
      </section>
    </main>
  );
}

export default App;

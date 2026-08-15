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

  // Shared text inside the Yjs document
  const yText = useMemo(() => {
    return ydoc.getText("monaco");
  }, [ydoc]);

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
      "http://localhost:3000",
      "monaco",
      ydoc,
      {
        autoConnect: true,
      }
    );

    // Add current user to awareness
    provider.awareness.setLocalStateField("user", {
      username,
    });

    // Update sidebar users
    const updateUsers = () => {
      const states = Array.from(
        provider.awareness.getStates().values()
      );

      const currentUsers = states
        .filter((state) => state.user?.username)
        .map((state) => state.user);

      console.log("Current users:", currentUsers);

      setUsers(currentUsers);
    };

    // Listen for users joining/leaving
    provider.awareness.on("change", updateUsers);

    // Get current users immediately
    updateUsers();

    // Remove user when tab/browser closes
    const handleBeforeUnload = () => {
      provider.awareness.setLocalStateField("user", null);
    };

    window.addEventListener(
      "beforeunload",
      handleBeforeUnload
    );

    // Connect Yjs document with Monaco
    const monacoBinding = new MonacoBinding(
      yText,
      editor.getModel(),
      new Set([editor]),
      provider.awareness
    );

    // Cleanup
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

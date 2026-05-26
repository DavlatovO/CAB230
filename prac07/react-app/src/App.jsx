import { useState, useEffect } from "react";

const API = "http://localhost:3001/api";

export default function App() {
  const [notes, setNotes] = useState([]);
  const [input, setInput] = useState("");

  // Load notes on mount
  useEffect(() => {
    fetch(`${API}/notes`)
      .then((r) => r.json())
      .then(setNotes);
  }, []);

  const addNote = async () => {
    if (!input.trim()) return;
    const res = await fetch(`${API}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: input }),
    });
    const note = await res.json();
    setNotes((prev) => [...prev, note]);
    setInput("");
  };

  const deleteNote = async (id) => {
    await fetch(`${API}/notes/${id}`, { method: "DELETE" });
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div style={{ maxWidth: 480, margin: "60px auto", fontFamily: "sans-serif", padding: "0 16px" }}>
      <h1 style={{ fontSize: 28, marginBottom: 24 }}>📝 Notes</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addNote()}
          placeholder="Add a note…"
          style={{
            flex: 1, padding: "10px 14px", borderRadius: 8,
            border: "1px solid #ccc", fontSize: 15,
          }}
        />
        <button
          onClick={addNote}
          style={{
            padding: "10px 18px", borderRadius: 8, border: "none",
            background: "#2563eb", color: "#fff", fontWeight: 600,
            cursor: "pointer", fontSize: 15,
          }}
        >
          Add
        </button>
      </div>

      {notes.length === 0 && (
        <p style={{ color: "#888" }}>No notes yet. Add one above!</p>
      )}

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {notes.map((note) => (
          <li
            key={note.id}
            style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 16px", marginBottom: 8, borderRadius: 8,
              background: "#f8fafc", border: "1px solid #e2e8f0",
            }}
          >
            <span style={{ fontSize: 15 }}>{note.text}</span>
            <button
              onClick={() => deleteNote(note.id)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#ef4444", fontSize: 18, lineHeight: 1,
              }}
              title="Delete"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
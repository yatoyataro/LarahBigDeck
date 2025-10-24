export default function Page() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>LarahBigDeck API</h1>
      <p>Backend API is running!</p>
      <h2>Available Endpoints:</h2>
      <ul>
        <li><code>POST /api/auth/signup</code> - Register user</li>
        <li><code>POST /api/auth/login</code> - Login user</li>
        <li><code>POST /api/auth/logout</code> - Logout user</li>
        <li><code>GET /api/auth/user</code> - Get current user</li>
        <li><code>GET /api/decks</code> - List decks</li>
        <li><code>POST /api/decks</code> - Create deck</li>
        <li><code>GET /api/decks/[id]</code> - Get deck</li>
        <li><code>PATCH /api/decks/[id]</code> - Update deck</li>
        <li><code>DELETE /api/decks/[id]</code> - Delete deck</li>
        <li><code>GET /api/decks/[id]/cards</code> - List cards</li>
        <li><code>POST /api/decks/[id]/cards</code> - Create card</li>
        <li><code>PATCH /api/cards/[id]</code> - Update card</li>
        <li><code>DELETE /api/cards/[id]</code> - Delete card</li>
        <li><code>POST /api/upload</code> - Upload file</li>
        <li><code>GET /api/upload</code> - List uploads</li>
      </ul>
      <p>
        <a href="/api/auth/user" style={{ color: '#0070f3' }}>Test authentication →</a>
      </p>
    </div>
  )
}

# API Testing Guide for LarahBigDeck

This guide provides step-by-step instructions for testing all API endpoints using Postman or Insomnia.

## Setup

1. **Start the API server**: `npm run dev:api`
2. **Base URL**: `http://localhost:3001`
3. **Import this collection or create requests manually**

## Testing Flow

### 1. Authentication Flow

#### 1.1 Sign Up

**POST** `http://localhost:3001/api/auth/signup`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "test@example.com",
  "password": "password123",
  "displayName": "Test User"
}
```

**Expected Response (201):**
```json
{
  "user": {
    "id": "...",
    "email": "test@example.com"
  },
  "session": { ... },
  "message": "User registered successfully..."
}
```

**Save**: Copy the `user.id` for later tests.

---

#### 1.2 Login

**POST** `http://localhost:3001/api/auth/login`

**Body:**
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

**Expected Response (200):**
```json
{
  "user": { ... },
  "session": { ... },
  "message": "Logged in successfully"
}
```

**Important**: The session is stored in cookies. Ensure your HTTP client (Postman/Insomnia) is configured to save and send cookies automatically.

---

#### 1.3 Get Current User

**GET** `http://localhost:3001/api/auth/user`

**Headers:**
```
(Cookies automatically included)
```

**Expected Response (200):**
```json
{
  "user": {
    "id": "...",
    "email": "test@example.com",
    "profile": { ... }
  }
}
```

---

### 2. Deck Management

#### 2.1 Create Deck

**POST** `http://localhost:3001/api/decks`

**Body:**
```json
{
  "name": "Spanish Vocabulary",
  "description": "Basic Spanish words and phrases"
}
```

**Expected Response (201):**
```json
{
  "deck": {
    "id": "deck-uuid-here",
    "name": "Spanish Vocabulary",
    "description": "Basic Spanish words and phrases",
    "card_count": 0,
    "created_at": "...",
    "updated_at": "..."
  }
}
```

**Save**: Copy the `deck.id` for subsequent tests.

---

#### 2.2 List All Decks

**GET** `http://localhost:3001/api/decks`

**Expected Response (200):**
```json
{
  "decks": [
    {
      "id": "...",
      "name": "Spanish Vocabulary",
      "card_count": 0,
      ...
    }
  ]
}
```

---

#### 2.3 Get Single Deck

**GET** `http://localhost:3001/api/decks/{deckId}`

Replace `{deckId}` with actual deck ID from step 2.1.

**Expected Response (200):**
```json
{
  "deck": {
    "id": "...",
    "name": "Spanish Vocabulary",
    ...
  }
}
```

---

#### 2.4 Update Deck

**PATCH** `http://localhost:3001/api/decks/{deckId}`

**Body:**
```json
{
  "name": "Spanish Vocabulary - Updated",
  "description": "Updated description"
}
```

**Expected Response (200):**
```json
{
  "deck": {
    "id": "...",
    "name": "Spanish Vocabulary - Updated",
    ...
  }
}
```

---

### 3. Card Management

#### 3.1 Create Flashcard

**POST** `http://localhost:3001/api/decks/{deckId}/cards`

**Body:**
```json
{
  "question": "What is 'hello' in Spanish?",
  "answer": "hola",
  "card_type": "flashcard",
  "tags": ["greetings", "basic"]
}
```

**Expected Response (201):**
```json
{
  "card": {
    "id": "card-uuid-here",
    "deck_id": "...",
    "question": "What is 'hello' in Spanish?",
    "answer": "hola",
    "card_type": "flashcard",
    "difficulty": 0,
    "times_reviewed": 0,
    "position": 0,
    ...
  }
}
```

**Save**: Copy the `card.id`.

---

#### 3.2 Create Multiple Choice Card

**POST** `http://localhost:3001/api/decks/{deckId}/cards`

**Body:**
```json
{
  "question": "What is the capital of Spain?",
  "answer": "Madrid",
  "card_type": "multiple_choice",
  "options": ["Barcelona", "Madrid", "Valencia", "Seville"],
  "correct_option_index": 1
}
```

**Expected Response (201):**
```json
{
  "card": {
    "id": "...",
    "question": "What is the capital of Spain?",
    "card_type": "multiple_choice",
    "options": ["Barcelona", "Madrid", "Valencia", "Seville"],
    "correct_option_index": 1,
    ...
  }
}
```

---

#### 3.3 List Cards in Deck

**GET** `http://localhost:3001/api/decks/{deckId}/cards`

**Expected Response (200):**
```json
{
  "cards": [
    {
      "id": "...",
      "question": "What is 'hello' in Spanish?",
      ...
    },
    {
      "id": "...",
      "question": "What is the capital of Spain?",
      ...
    }
  ]
}
```

---

#### 3.4 Update Card Progress

**PATCH** `http://localhost:3001/api/cards/{cardId}`

**Body:**
```json
{
  "difficulty": 2,
  "times_reviewed": 5,
  "times_correct": 4,
  "last_reviewed_at": "2024-10-22T12:00:00Z"
}
```

**Expected Response (200):**
```json
{
  "card": {
    "id": "...",
    "difficulty": 2,
    "times_reviewed": 5,
    "times_correct": 4,
    ...
  }
}
```

---

#### 3.5 Delete Card

**DELETE** `http://localhost:3001/api/cards/{cardId}`

**Expected Response (200):**
```json
{
  "message": "Card deleted successfully"
}
```

---

### 4. File Upload

#### 4.1 Upload File

**POST** `http://localhost:3001/api/upload`

**Headers:**
```
Content-Type: multipart/form-data
```

**Body (form-data):**
```
file: [Select a PDF/DOCX/TXT file]
deckId: {optional-deck-uuid}
```

**Expected Response (201):**
```json
{
  "upload": {
    "id": "upload-uuid-here",
    "file_name": "test.pdf",
    "file_url": "https://...",
    "status": "pending",
    "mime_type": "application/pdf",
    ...
  },
  "message": "File uploaded successfully. Processing will begin shortly."
}
```

**Save**: Copy the `upload.id`.

---

#### 4.2 List Uploads

**GET** `http://localhost:3001/api/upload`

**Optional Query Params:**
- `?deckId={deck-uuid}` - Filter by deck

**Expected Response (200):**
```json
{
  "uploads": [
    {
      "id": "...",
      "file_name": "test.pdf",
      "status": "pending",
      ...
    }
  ]
}
```

---

#### 4.3 Get Upload Status

**GET** `http://localhost:3001/api/upload/{uploadId}`

**Expected Response (200):**
```json
{
  "upload": {
    "id": "...",
    "file_name": "test.pdf",
    "status": "pending",
    ...
  }
}
```

---

#### 4.4 Update Upload Status

**PATCH** `http://localhost:3001/api/upload/{uploadId}`

**Body:**
```json
{
  "status": "completed",
  "processed_at": "2024-10-22T12:00:00Z"
}
```

**Expected Response (200):**
```json
{
  "upload": {
    "id": "...",
    "status": "completed",
    "processed_at": "2024-10-22T12:00:00Z",
    ...
  }
}
```

---

#### 4.5 Delete Upload

**DELETE** `http://localhost:3001/api/upload/{uploadId}`

**Expected Response (200):**
```json
{
  "message": "Upload deleted successfully"
}
```

---

### 5. Cleanup

#### 5.1 Delete Deck (cascades to cards)

**DELETE** `http://localhost:3001/api/decks/{deckId}`

**Expected Response (200):**
```json
{
  "message": "Deck deleted successfully"
}
```

---

#### 5.2 Logout

**POST** `http://localhost:3001/api/auth/logout`

**Expected Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

## Error Testing

### Test Invalid Scenarios

1. **Unauthorized Access**
   - Try accessing `/api/decks` without logging in
   - Expected: 401 Unauthorized

2. **Invalid Input**
   - Create deck without name
   - Expected: 400 Validation error

3. **Resource Not Found**
   - GET `/api/decks/invalid-uuid`
   - Expected: 404 Not found

4. **File Upload Limits**
   - Upload file > 10MB
   - Expected: 400 Validation error

5. **Cross-User Access**
   - Login as User A
   - Try to access User B's deck
   - Expected: 404 Not found (due to RLS)

---

## Postman Collection

You can create a Postman collection with these requests and use variables:

**Variables:**
- `baseUrl`: `http://localhost:3001`
- `deckId`: Set after creating deck
- `cardId`: Set after creating card
- `uploadId`: Set after upload

**Tests Script (add to requests):**
```javascript
// Save deck ID from response
if (pm.response.code === 201) {
    const jsonData = pm.response.json();
    if (jsonData.deck) {
        pm.environment.set("deckId", jsonData.deck.id);
    }
    if (jsonData.card) {
        pm.environment.set("cardId", jsonData.card.id);
    }
}
```

---

## Notes

- All authenticated requests automatically include session cookies
- Ensure cookies are enabled in your HTTP client
- RLS policies ensure users can only access their own data
- File uploads are limited to 10MB
- Supported file types: PDF, TXT, DOCX, DOC, MD, PPTX

# Troubleshooting AI Flashcard Generation

## ⚠️ Known Issue: DOCX/PPT Files Not Supported

### The Problem
Gemini's Document Vision API **only supports PDF files**. When you try to upload DOCX or PPT files, you'll see this error:

```
Error: Unable to submit request because it has a mimeType parameter 
with value application/vnd.openxmlformats-officedocument.wordprocessingml.document, 
which is not supported.
```

### The Solution

You have **3 options**:

#### Option 1: Convert to PDF Before Upload (Recommended)
1. Open your DOCX/PPT file
2. Click "File" → "Save As" or "Export"
3. Choose "PDF" as the format
4. Upload the PDF file to the app

**This is the easiest and most reliable solution.**

#### Option 2: Only Upload PDF Files
- Currently, the app only supports PDF files for AI generation
- Manual card creation still works for all file types

#### Option 3: Implement Text Extraction (Developer Task)
For developers who want to support DOCX/PPT:

1. Install text extraction library:
   ```bash
   npm install mammoth --legacy-peer-deps  # For DOCX
   ```

2. Update the API route to extract text from DOCX before sending to Gemini
3. Send extracted text as plain text instead of document vision

See the code example below for implementation.

---

## 🔍 Reading Backend Logs

When you upload a file, detailed logs appear in the **backend terminal** (the one running `npm run dev:api`). Look for:

### Successful Processing
```
=== AI Processing Started ===
Upload ID: abc123...
Upload record found: { ... }
Status updated to: processing
Downloading file from storage: user_id/file.pdf
File downloaded successfully, size: 123456 bytes
File converted to base64, length: 164608
Original MIME type: application/pdf
Calling Gemini API...
Model: gemini-2.5-flash
✅ Gemini API response received
Response length: 5000 characters
Parsing JSON response...
✅ JSON parsed successfully
Number of flashcards: 15
Flashcards to create: 15
Deck found: My Deck
Inserting 15 cards into database...
✅ Cards created successfully: 15
✅ Upload status updated to: completed
=== AI Processing Completed Successfully ===
```

### Failed Processing
```
=== AI Processing Started ===
Upload ID: abc123...
Upload record found: { ... }
❌ Non-PDF file detected. Gemini API only supports PDF for document vision.
❌ For DOCX/PPT files, consider converting to PDF first or extracting text.
Calling Gemini API...
=== AI Processing Failed ===
❌ Error type: ApiError
❌ Error message: Unable to submit request because it has a mimeType parameter...
❌ Error stack: [stack trace]
Upload status updated to: failed
```

### Key Log Indicators

| Log Message | Meaning |
|------------|---------|
| `=== AI Processing Started ===` | Request received |
| `✅` | Step completed successfully |
| `❌` | Error occurred |
| `⚠️` | Warning (non-critical) |
| `Status updated to: processing` | AI analysis in progress |
| `Status updated to: completed` | Success! |
| `Status updated to: failed` | Something went wrong |

---

## 🐛 Common Errors & Solutions

### Error: "DOCX/PPT not supported"
**Cause**: You uploaded a DOCX or PPT file  
**Solution**: Convert to PDF first (see Option 1 above)

### Error: "Failed to download file from storage"
**Cause**: File wasn't uploaded properly to Supabase Storage  
**Solution**: 
1. Check Supabase Storage bucket: `deck-uploads`
2. Verify file exists
3. Try uploading again

### Error: "Failed to parse AI response"
**Cause**: Gemini returned unexpected format  
**Solution**: 
1. Check backend logs for the raw response
2. The content might not be suitable for flashcards
3. Try a different document

### Error: "Upload not found"
**Cause**: Upload record doesn't exist in database  
**Solution**: 
1. Check database `uploads` table
2. Verify upload was created successfully
3. Try uploading again

### Error: "Gemini API key invalid"
**Cause**: Missing or wrong API key  
**Solution**: 
1. Get key from https://aistudio.google.com/apikey
2. Update `.env`: `GOOGLE_GEMINI_API_KEY=your_key`
3. Restart backend: Stop and run `npm run dev:api`

---

## 📊 Supported File Formats

| Format | File Extension | AI Generation | Manual Creation |
|--------|---------------|---------------|-----------------|
| PDF | `.pdf` | ✅ Yes | ✅ Yes |
| Word | `.docx` | ❌ No* | ✅ Yes |
| PowerPoint | `.pptx` | ❌ No* | ✅ Yes |
| Text | `.txt` | ❌ No | ✅ Yes |

*\*Convert to PDF first to use AI generation*

---

## 🔧 Developer: Adding DOCX Support

If you want to add DOCX text extraction:

### 1. Install Dependencies
```bash
npm install mammoth --legacy-peer-deps
npm install @types/mammoth --save-dev --legacy-peer-deps
```

### 2. Update API Route

Add text extraction before Gemini call:

```typescript
import mammoth from 'mammoth'

// Inside the POST handler, after downloading file:
if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
  console.log('Extracting text from DOCX...')
  
  // Convert DOCX to plain text
  const result = await mammoth.extractRawText({
    buffer: Buffer.from(arrayBuffer)
  })
  
  const extractedText = result.value
  console.log('Text extracted, length:', extractedText.length)
  
  // Send as plain text instead of document vision
  const response = await genAI.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      { text: prompt },
      { text: `Document content:\n\n${extractedText}` }
    ],
  })
} else if (mimeType === 'application/pdf') {
  // Use document vision for PDFs
  const response = await genAI.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      { text: prompt },
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: base64Data,
        },
      },
    ],
  })
}
```

### 3. Test
1. Upload a DOCX file
2. Check backend logs for "Extracting text from DOCX..."
3. Verify flashcards are generated

---

## 📝 Testing Checklist

Before reporting an issue, please verify:

- [ ] Backend server is running (`npm run dev:api`)
- [ ] Frontend server is running (`npm run dev`)
- [ ] File is in PDF format (or converted to PDF)
- [ ] File is under 20MB
- [ ] Gemini API key is valid in `.env`
- [ ] Checked backend terminal for detailed logs
- [ ] File uploaded successfully to Supabase Storage
- [ ] Internet connection is stable

---

## 📞 Need More Help?

1. **Check Backend Logs**: Most issues show detailed error messages in the terminal
2. **Review AI_INTEGRATION_GUIDE.md**: Comprehensive setup documentation
3. **Check Supabase Console**: Verify database and storage are working
4. **Test Gemini API**: Visit https://aistudio.google.com to test your API key

---

## 🎯 Quick Fix Flowchart

```
Upload fails?
│
├─ Is it a PDF?
│  ├─ No → Convert to PDF first
│  └─ Yes → Continue
│
├─ Check backend logs
│  ├─ "DOCX not supported" → Convert to PDF
│  ├─ "API key invalid" → Update .env
│  ├─ "Failed to download" → Check Supabase Storage
│  └─ Other error → See error details in logs
│
└─ Still not working?
   └─ Check all items in Testing Checklist above
```

---

## ✨ Summary

**Current Limitation**: Only PDF files work with AI generation  
**Workaround**: Convert DOCX/PPT to PDF before uploading  
**Future Enhancement**: Text extraction from DOCX/PPT (see developer section)  
**Logging**: All detailed errors appear in backend terminal (`npm run dev:api`)

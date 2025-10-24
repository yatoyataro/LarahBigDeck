export const metadata = {
  title: 'LarahBigDeck API',
  description: 'Backend API for LarahBigDeck flashcard application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

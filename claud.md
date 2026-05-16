Build a full-stack web application called "AudioBook Hub" using Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui, Prisma + PostgreSQL, and NextAuth.js.

**CORE REQUIREMENTS:**

**1. Internationalization i18n** 
Support 2 languages: Ukrainian `uk` and English `en`.
- Use next-intl or next-i18next. 
- Default language: `uk`. Detect browser locale, store choice in localStorage.
- Language switcher in header: UA | EN toggle.
- All UI text, button labels, form placeholders, error messages must be translated.
- DB content like book titles/descriptions stays in original language, but UI labels are translated.

Translation keys needed: 
login, logout, register, email, password, confirm_password, dashboard, listen, back_to_catalog, add_book, save, delete, title, author, duration, genre, language, year, short_description, full_description, youtube_url, published, draft, no_books_yet, login_required, invalid_credentials, password_too_short.

**2. Authentication**
- NextAuth.js with Credentials Provider.
- Pages: /login, /register
- Fields: email, password, confirm_password on register. Validate: valid email, min 8 chars, passwords match.
- 2 roles in User model: `USER` and `ADMIN`. First registered user = ADMIN.
- Protected routes: /dashboard, /book/[id] for any logged-in user. /admin only for ADMIN.
- Use middleware.ts for route protection.
- Show errors in active language.

**3. Database Schema - Prisma**
model User {
  id String @id @default(cuid())
  email String @unique
  password String
  role Role @default(USER)
  createdAt DateTime @default(now())
}
model Audiobook {
  id String @id @default(cuid())
  title String
  author String
  imageUrl String
  youtubeId String
  descriptionShort String @db.Text
  descriptionLong String @db.Text
  duration String
  genre String
  language String // UA or EN - це мова озвучки, не UI
  year Int
  isPublished Boolean @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
enum Role { USER ADMIN }

**4. Main Pages & Features**

4.1 /dashboard - Catalog
- Grid of cards. Mobile: 1 col, tablet: 2 cols, desktop: 3-4 cols.
- Each card shows: imageUrl, title, author, descriptionShort, duration, genre badge.
- Button "Listen" -> /book/[id]. Text changes based on locale.
- Skeleton loaders while fetching.
- Empty state if no books: "No books yet" / "Поки що немає книг".
- Header with Logo, Language Switcher UA|EN, and Logout button.

4.2 /book/[id] - Audiobook Page
- YouTube embed: <iframe src={`https://www.youtube.com/embed/${youtubeId}`} allowFullScreen>
- Display: title, author, full descriptionLong, duration, genre, year, language of audio.
- Back button to /dashboard.
- If not logged in, redirect to /login.

4.3 /admin - Admin Panel
- Accessible only by ADMIN role.
- Table with all books: title, author, isPublished status, Edit/Delete actions.
- Button "Add Book" opens Dialog with form.
- Form fields: title*, author*, imageUrl, youtubeUrl*, descriptionShort*, descriptionLong*, duration, genre* select: Fantasy/Фантастика, Non-fiction/Нон-фікшн, Detective/Детектив, Classic/Класика, year, language* select: UA, EN, isPublished toggle.
- On youtubeUrl input: extract video ID from full URL using regex. Validate URL.
- All form labels/validation errors translated.
- Use Zod for validation. Show toast on success/error in active language.

**5. YouTube Integration**
- Admin pastes full URL like https://www.youtube.com/watch?v=dQw4w9WgXcQ or https://youtu.be/dQw4w9WgXcQ
- Extract and store only ID: dQw4w9WgXcQ
- On /book/[id] render responsive iframe 16:9. No autoplay.

**6. UI/UX**
- Use shadcn/ui: Button, Card, Input, Dialog, Select, Toast, Skeleton, Badge.
- Dark/Light mode toggle using next-themes. Persist choice.
- Responsive mobile-first.
- Clean, modern design. Use Inter font.

**7. API Routes / Server Actions**
- POST /api/register - create user, hash password with bcrypt.
- GET /api/audiobooks - return isPublished=true for users.
- GET /api/audiobooks/[id] - return single book.
- POST/PUT/DELETE /api/admin/audiobooks - CRUD, ADMIN only.

**8. Do NOT implement in MVP:**
Search, filters, comments, likes, user playlists, progress tracking, mp3 upload, payments.

Generate all code, file structure, and add seed script that creates 1 admin user: admin@audiobook.dev / admin123 and 2 demo books with real YouTube IDs.
# PremiumPlay Frontend - Installation Guide

## 🚀 Quick Start

### Step 1: Install Dependencies

Navigate to the `frontend` directory and install all required packages:

```bash
cd frontend
npm install
```

This will install all dependencies including:
- Next.js 14
- React 18
- Tailwind CSS
- Framer Motion
- React Player
- Icons and more

### Step 2: Run Development Server

```bash
npm run dev
```

The development server will start on [http://localhost:3000](http://localhost:3000)

### Step 3: Open in Browser

Visit [http://localhost:3000](http://localhost:3000) to see your application running.

## 📋 Prerequisites

- **Node.js** 18.0 or higher
- **npm** or **yarn** package manager
- Modern web browser (Chrome, Firefox, Safari, Edge)

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the `frontend` directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Environment
NODE_ENV=development
```

### Backend Connection

Update the API URL in `.env.local` to point to your backend server:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

For production:

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com/api/v1
```

## 📦 Available Scripts

- **`npm run dev`** - Start development server with hot reload
- **`npm run build`** - Build production-ready app
- **`npm start`** - Start production server
- **`npm run lint`** - Run ESLint for code quality

## 🎨 Features to Explore

1. **Dark/Light Mode** - Click the moon/sun icon in the navbar
2. **Video Player** - Click any video to watch
3. **Upload Modal** - Click "Upload" button in navbar
4. **Profile Page** - Click user icon in navbar
5. **Sidebar Navigation** - Explore different sections
6. **Responsive Design** - Resize browser or use dev tools

## 🏗️ Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── globals.css        # Global styles
│   ├── watch/[id]/        # Video player
│   ├── profile/           # User profile
│   └── [other pages]      # All other pages
├── components/            # React components
│   ├── navbar.tsx
│   ├── sidebar.tsx
│   ├── video-card.tsx
│   └── upload-modal.tsx
├── lib/                  # Utilities
│   ├── utils.ts
│   └── api.ts            # API client
├── types/                # TypeScript types
│   └── index.ts
├── public/             # Static assets
└── [config files]       # Configuration
```

## 🔗 Backend Integration

The frontend is ready to connect to your existing Node.js backend.

### API Endpoints Ready

All API functions are set up in `lib/api.ts`:
- Video CRUD operations
- User authentication
- Comments & likes
- Subscriptions
- Playlists

### Connecting to Backend

1. Make sure your backend is running on `http://localhost:8000`
2. Update `.env.local` with correct API URL
3. The frontend will automatically connect to backend endpoints

## 🎯 Key Features

✅ Dark/Light Mode Toggle
✅ Fully Responsive Design
✅ Smooth Animations
✅ Video Player Interface
✅ Upload Modal
✅ User Profile
✅ Trending & Subscriptions
✅ Settings Page
✅ Help Center

## 🐛 Troubleshooting

### Module Not Found
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build Errors
```bash
# Clear Next.js cache and rebuild
rm -rf .next
npm run build
```

### Port Already in Use
```bash
# Kill the process using port 3000
npx kill-port 3000
# Or change the port
PORT=3001 npm run dev
```

### TypeScript Errors
```bash
# Make sure TypeScript is properly configured
npm install --save-dev typescript @types/react @types/node
```

## 🚢 Production Build

Build the application for production:

```bash
npm run build
npm start
```

## 📱 Mobile Testing

Test on mobile devices:

1. Find your local IP address
2. Run: `npm run dev -- --hostname 0.0.0.0`
3. Access from mobile: `http://your-ip:3000`

## 🔐 Authentication

To add authentication:

1. Implement login/signup pages
2. Store JWT tokens in localStorage
3. Update API interceptors in `lib/api.ts`
4. Add protected routes

## 🎨 Customization

### Changing Colors

Edit `app/globals.css` to customize the color scheme.

### Changing Fonts

Update `app/layout.tsx` to use different fonts.

### Adding Components

Create new components in `components/` directory.

## 📚 Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)
- [React Player](https://github.com/cookpete/react-player)

## 💡 Tips

- Use VS Code with ESLint extension for better development
- Install "Tailwind CSS IntelliSense" for autocomplete
- Use React DevTools for debugging
- Check browser console for any errors
- Use Network tab to monitor API calls

## 🎓 Learning Resources

- [Next.js Learn](https://nextjs.org/learn)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Happy Coding! 🚀**


# Drive Sections - Google Drive Link Manager

A full-stack web application for organizing Google Drive links by sections with additional notes. Built with Node.js, Express, MongoDB, and vanilla HTML/CSS/JavaScript.

## Features

- **Add Page**: Create sections and add Google Drive links with notes
- **View Page**: Read-only display of all sections and links
- **Orange Theme**: Consistent orange color scheme (no blue)
- **MongoDB Storage**: Persistent data storage with MongoDB Atlas
- **Responsive Design**: Works on desktop and mobile devices

## Pages

- **Add Page** (`/`): Create new sections and add Google Drive links
- **View Page** (`/view`): View all sections and links (read-only)

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Deployment**: Render.com (or Railway/Heroku)

## Local Development

### Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account (free tier available)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/your-repo.git
   cd your-repo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `env.example` to `.env`
   - Update `MONGODB_URI` with your MongoDB Atlas connection string
   ```bash
   cp env.example .env
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Add page: `http://localhost:3000`
   - View page: `http://localhost:3000/view`

## Deployment to Render.com

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main
```

### Step 2: Deploy on Render

1. Go to [render.com](https://render.com) and sign up/login
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Runtime**: Node
5. Add environment variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `PORT`: 3000 (optional, Render provides this automatically)
6. Click "Create Web Service"
7. Wait for deployment to complete

### Your MongoDB Atlas Connection String

```
mongodb+srv://subhashkrishna:kondamuri@1@cluster0.qt4xf.mongodb.net/drive_links_sections?retryWrites=true&w=majority
```

**Important**: Make sure to:
- Replace the database name in the connection string (currently `drive_links_sections`)
- Ensure your MongoDB Atlas cluster allows connections from anywhere (0.0.0.0/0) for Render deployment
- Keep your credentials secure - never commit them to GitHub

## API Endpoints

- `GET /api/sections` - Get all sections
- `POST /api/sections` - Create a new section
- `GET /api/sections/:id/links` - Get links for a section
- `POST /api/sections/:id/links` - Add a link to a section

## Project Structure

```
├── public/
│   ├── index.html          # Add page
│   ├── view.html           # View page
│   ├── add.js              # Add page JavaScript
│   ├── view.js             # View page JavaScript
│   └── styles.css          # Shared styles
├── server.js               # Express server
├── package.json            # Dependencies
├── env.example             # Environment variables template
├── .gitignore              # Git ignore rules
└── README.md               # This file
```

## Environment Variables

- `MONGODB_URI`: MongoDB Atlas connection string
- `PORT`: Server port (defaults to 3000)

## Deploying the static frontend to Vercel

If you only want to deploy the static frontend (the contents of `public/`) to Vercel, you can use the Vercel CLI.

1. Install or use via npx:

```powershell
npx vercel login
npx vercel
```

2. When prompted by `npx vercel`, choose the project settings and set the output directory to `public` if asked. The included `vercel.json` rewrites routes so the deployed site will behave like the local app.

Notes:
- This flow deploys only static files. Your Express API (server.js) will not be deployed by this method. To deploy the API on Vercel you would need to refactor the server into serverless functions under an `api/` directory and configure env vars in the Vercel dashboard.


## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).
# study-cast

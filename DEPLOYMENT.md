# Deployment Guide

This repository contains:
- `frontend/`: Vite React app
- `backend/`: Node.js + Express API with MySQL

## 1. Deploy MySQL on Railway
1. Create a free Railway account at https://railway.app
2. Create a new project and add a MySQL plugin.
3. Copy the connection details: host, port, database, user, password.
4. Use these values in `backend/.env` or Render environment variables.

## 2. Deploy the backend on Render
1. Create a free Render account at https://render.com
2. Connect your GitHub repository and select this repo.
3. Add a new Web Service.
4. Use the following settings:
   - Root Directory: `backend`
   - Environment: `Node`
   - Branch: `main`
   - Build Command: `npm install`
   - Start Command: `npm run start`
5. In Render service settings, add environment variables from Railway:
   - `DB_HOST`
   - `DB_PORT`
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME`
6. Save and deploy. Render will provide a public URL like `https://your-backend.onrender.com`.

> Note: Render uses an ephemeral filesystem, so uploaded files under `backend/uploads` will not persist between deploys.

## 3. Deploy the frontend on Vercel
1. Create a free Vercel account at https://vercel.com
2. Import this GitHub repository.
3. Set the project root directory to `frontend`.
4. Use the default build settings or:
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Add an environment variable:
   - `VITE_API_BASE_URL`: set it to your Render backend URL, e.g. `https://your-backend.onrender.com`
6. Deploy the Vercel project.
7. Vercel will provide a public URL for your frontend app.

## 4. Final verification
1. Open the Vercel frontend URL.
2. Sign up or log in to verify the frontend can communicate with the backend.
3. If the app cannot connect, confirm the backend URL in Vercel and CORS is working.

## 5. Notes
- The frontend uses `VITE_API_BASE_URL` to target the backend.
- The backend connects to MySQL using environment variables.
- If your backend URL changes, update `VITE_API_BASE_URL` in Vercel and redeploy.

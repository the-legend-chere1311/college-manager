# Task/Project Manager For College Students

This website helps you manage you manage your entire degree with the following features: <br />
- Tasks & Exam Manager <br /> 
- Analytics + AI Assistant <br />
- Spotify Integration + Quick Notes <br />

## Set-Up

### Hosting the database online with MongoDB Atlas

1. Create a free cluster in MongoDB Atlas.
2. Create a database user and copy the Atlas connection string.
3. Replace the local `MONGO_URI` value in `backend/.env` with the Atlas string.
4. In Atlas Network Access, allow your deployment environment to connect.
5. Deploy the backend to a host that can run Node.js continuously, then set `MONGO_URI`, `ALLOWED_ORIGINS`, and `NODE_ENV=production` there.

### Important

The backend already reads `MONGO_URI` from the environment, so the database itself is not started by Vercel. Vercel hosts the frontend; Atlas hosts the database; the Express API needs its own runtime.

If any real credentials were placed in `backend/.env`, rotate them and move them to hosted environment variables before sharing or deploying the project.

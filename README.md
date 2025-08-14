# Groundwork Books Website

**Two completely independent applications**

## Project Structure

```
gw-website-react/
├── frontend/          # Next.js React application (completely independent)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env           # Frontend environment variables
└── backend/           # Express.js API server (completely independent)
    ├── src/
    │   ├── routes/    # API route handlers
    │   ├── lib/       # Utilities (Square integration)
    │   └── server.js  # Express server setup
    ├── package.json
    └── .env           # Backend environment variables
```

## Quick Start

### 1. Install Dependencies
Each app has its own dependencies:
```bash
# Backend
cd backend
npm install

# Frontend  
cd frontend
npm install
```

### 2. Environment Setup
Configure environment variables:

**Backend** (`backend/.env`):
```env
PORT=8080
SQUARE_ACCESS_TOKEN=your_square_access_token_here
SQUARE_ENVIRONMENT=sandbox
```

**Frontend** (`frontend/.env`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 3. Development
Run each app independently:

**Backend:**
```bash
cd backend
npm run dev  # Runs on port 8080
```

**Frontend:**
```bash
cd frontend  
npm run dev  # Runs on port 3000 (or next available)
```

## Key resources:

- The figma (frontend mockup) is available [here](https://www.figma.com/design/Al34xSygT7JdXAEx5f4dCN/Groundworks-Website-Redesign---Adelina?node-id=1242-591&t=MRPcgBKGXxqGE7XO-1)
- The interactable version is [here](https://www.figma.com/proto/Al34xSygT7JdXAEx5f4dCN/Groundworks-Website-Redesign---Adelina?page-id=1242%3A591&node-id=1248-841&p=f&viewport=640%2C457%2C0.06&t=TLR5ffCjCBj7H6jy-1&scaling=scale-down&content-scaling=responsive&starting-point-node-id=1242%3A592)

- Here's the [UML diagram](https://lucid.app/lucidchart/289f0f0f-0f51-4941-9058-acae8b7a1fa6/edit?viewport_loc=-1419%2C-182%2C3728%2C1933%2C0_0&invitationId=inv_685847b7-897c-4279-9bb1-4733dbcaf95d) for the backend
- The [Google Doc](https://docs.google.com/document/d/1AeKpgdtLg-37bRi7_E3IqE8llGRSC2xY2aoAoLFohLA/edit?usp=sharing) for important api information
- [Project Board](https://github.com/orgs/Groundwork-Books/projects/2/views/1) of GitHub issues


## Development Workflow:
Look at the [project board](https://github.com/orgs/Groundwork-Books/projects/2/views/1) for open issues, pick one that works for you, assign yourself and move it to in progress.


All changes should be developed on a feature branch (new branch specific to the issue) and then once it's done and tested, you just make a pull request (a request to merge it with main), and then one of the older ppl on the project will review it and then approve the merge.


## Tech Stack
- **Frontend:** React, Next.JS 15.4.6, Firebase Auth, TailwindCSS
- **Backend:** Node.js, Express.js, Square API
- **Cart:** React Context + localStorage
- **Architecture:** Separated frontend/backend with API communication

---

## Setup Instructions

### Install Dependencies and Run Locally

Get these vscode extensions

austenc.tailwind-docs
bradlc.vscode-tailwindcss
stivo.tailwind-fold

then
```

npm install
npm run dev
```

**Other useful information about the repo:**

- Each page is in a folder of it's name aside from home.
- tailwind color stuff is set in globals.css
- if you get stuck look at the next.js and react documentation

--- 
## Features
- Email/password login/signup (Firebase Auth)
- Book catalog from Square
- Cart (add/remove/update)
- Checkout via Square (redirect)
- Thank you page
- Protected routes (cart/checkout/account)

---


## Notes
- **Never expose your Square Access Token in frontend code!**
- All inventory/pricing managed in Square Dashboard
- No Firestore or Firebase Cloud Functions used 

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

---

### For Backend:

*This is old, needs to be updated. Links are useful tho*

 Square API Credentials


- Create a `.env` file in the `api/` directory:
  ```env
  SQUARE_ACCESS_TOKEN=your_square_access_token_here
  SQUARE_LOCATION_ID=your_square_location_id_here
  CHECKOUT_REDIRECT_URL=http://localhost:3000/thank-you
  ```
- Get your credentials from the [Square Developer Dashboard](https://developer.squareup.com/).

Firebase Auth Setup

- Go to [Firebase Console](https://console.firebase.google.com/), create a project, enable Email/Password Auth.
- Copy your config into `frontend/src/firebase.js`:
  ```js
  const firebaseConfig = {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'YOUR_AUTH_DOMAIN',
    projectId: 'YOUR_PROJECT_ID',
    appId: 'YOUR_APP_ID',
  };
  ```


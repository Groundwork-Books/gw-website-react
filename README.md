# Groundwork Books Website

NOTICE: the repo is now public, so make sure you don't fuck up the git ignore and don't push any env's

**Google Form For Events and Instagram:**
https://docs.google.com/spreadsheets/d/1S1Vw0w3CUGwjYVYNG60kUpBagEB7KXD4IfY6mLH6PEI/edit?usp=sharing

## Project Structure

**Single Next.js Full-Stack Application**

```
gw-website-react/
├── frontend/          # Next.js full-stack application 
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/           # Backend API routes
│   │   │   │   ├── events/    # Events management
│   │   │   │   ├── instagram/ # Instagram integration
│   │   │   │   ├── orders/    # Order processing & management
│   │   │   │   ├── search/    # Book search functionality
│   │   │   │   └── square/    # Square Point of Sale (POS) integration
│   │   │   ├── (pages)/       # Frontend pages
│   │   │   └── layout.tsx
│   │   ├── components/        # Reusable React components
│   │   └── lib/              # Utilities, contexts, types
│   ├── public/               # Static assets
│   ├── package.json
│   └── .env                  # Environment variables
└── package.json              # Root workspace config
```

## Quick Start

### 1. Install Dependencies

Install dependencies for the Next.js full-stack application:
```bash
# Frontend & API
cd frontend
npm install
```
Get these vscode extensions

```bash
austenc.tailwind-docs
bradlc.vscode-tailwindcss
stivo.tailwind-fold  #this one is up to user preference
```
### 2. Environment Setup
Configure environment variables. They are available in the Slack or upon request from mpodgore@ucsd.edu or lmohler@ucsd.edu:

**Frontend & API** (`frontend/.env`)  

### 3. Development
Start the development server (includes both frontend and API):
```bash
cd frontend  
npm run dev  # Runs on port 3000 (or next available)
```

The application includes:
- **Frontend pages** at `http://localhost:3000/`
- **API endpoints** at `http://localhost:3000/api/*`

### 4. Before committing
Run this to test that the full-stack application can be built   
*(because it gets autodeployed on vercel)*

```bash
cd frontend
npm run build 
npm start    
```

Make sure to add your email to your commits so that Vercel doesn't freak out. It takes 20 seconds just do what [this](https://docs.github.com/en/account-and-profile/how-tos/setting-up-and-managing-your-personal-account-on-github/managing-email-preferences/setting-your-commit-email-address#setting-your-commit-email-address-in-git) says

### 5. Current Deployment

The full-stack application is deployed via [Vercel](https://vercel.com/groundwork-books/gw-website-react-frontend) (login via GW email).   
- Vercel autodeploys main if the last commit was done by the sole allowed user (which is currently Maxim but you can change it in the app)
- Both frontend and API routes are deployed together as a single Next.js application   
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
- **Backend:** Next.js API Routes (serverless functions)
- **Integrations:** Square POS API, Instagram Basic Display API, Google Sheets API
- **Cart:** React Context + localStorage
- **Hosting:** Vercel (full-stack deployment)
- **Architecture:** Next.js full-stack application with integrated API routes


**Other useful information about the repo:**

- Each page is in a folder of it's name aside from home.
- tailwind color stuff is set in globals.css
- if you get stuck look at the next.js and react documentation

## API Routes

The backend functionality is implemented using Next.js API routes located in `frontend/src/app/api/`:

- **`/api/events`** - Events management and retrieval
- **`/api/instagram`** - Instagram feed integration
- **`/api/orders`** - Order processing, payment handling, and admin management
  - `/api/orders/create` - Create new orders
  - `/api/orders/[orderId]` - Order details and updates
  - `/api/orders/admin/*` - Admin order management
  - `/api/orders/webhook/*` - Payment webhooks
- **`/api/search`** - Book search functionality with text and status endpoints
- **`/api/square`** - Square POS integration
  - `/api/square/books` - Book inventory management
  - `/api/square/categories` - Category management
  - `/api/square/images` - Image handling

All API routes are serverless functions that deploy automatically with the frontend.

## Features
- Email/password login/signup (Firebase Auth)
- Book catalog from Square
- Cart (add/remove/update)
- Checkout via Square (redirect)
- Thank you page
- Protected routes (cart/checkout/account)




## Notes
- **Never expose your Square Access Token in frontend code!** Use environment variables and API routes.
- All inventory/pricing managed in Square Dashboard
- API routes handle server-side logic and external integrations
- No separate backend server needed - everything runs on Vercel's serverless platform
- No Firestore or Firebase Cloud Functions used 

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).




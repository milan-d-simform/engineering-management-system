# Engineering Management System

A multi-tenant SaaS Engineering Management System with role-based access control.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Nuxt 3 (Vue 3, Composition API, Pinia, Tailwind CSS) |
| Backend | NestJS (Modular Monolith) |
| Database | MongoDB (Mongoose ORM) |
| Auth | JWT (Access + Refresh tokens) |

---

## Roles & Permissions

| Feature | SUPERADMIN | ADMIN | MEMBER |
|---------|-----------|-------|--------|
| Create teams | ✅ | ❌ | ❌ |
| View all teams | ✅ | ✅ (own) | ❌ |
| Manage all users | ✅ | ❌ | ❌ |
| Manage team members | ✅ | ✅ | ❌ |
| View/edit own profile | ✅ | ✅ | ✅ |
| Reset any user password | ✅ | ✅ (team) | ❌ |
| Assign team admins | ✅ | ❌ | ❌ |

---

## Getting Started

### Prerequisites
- Node.js >= 18
- MongoDB running locally or a MongoDB Atlas connection string

### Backend Setup

```bash
cd backend
cp .env.example .env   # fill in your values
npm install
npm run seed           # creates default SUPERADMIN
npm run start:dev      # runs on http://localhost:8001
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev            # runs on http://localhost:8000
```
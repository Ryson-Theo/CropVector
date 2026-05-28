# CropVector — Agriculture Tech Platform

[![Maintained by Ryson-Theo](https://img.shields.io/badge/Maintained%20by-Ryson--Theo-blue?logo=github&logoColor=white)](https://github.com/Ryson-Theo)

![Status](https://img.shields.io/badge/Status-Active%20Development-brightgreen)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-9.2-47A248?logo=mongodb&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black)
![Socket.io](https://img.shields.io/badge/Socket.io-4.8-010101)

CropVector is a personal full-stack agricultural platform created by Ribin K Roy. It helps farmers, buyers, experts, and administrators manage crops, marketplaces, consultations, weather alerts, and farm operations with a unified dashboard experience.

---

## Features

- **Crop Management** - Track crop lifecycle, disease records, and location-based field data.
- **Crop Recommendations** - AI-assisted, data-driven recommendations for crop selection, planting dates, and inputs based on soil, weather, and market signals.
- **Weather Alerts** - Real-time weather monitoring and configurable alerts (frost, heavy rain, heatwaves, wind) using OpenMeteo.
- **Soil Analysis & Remote Sensing** - Soil health insights and satellite-derived indices (NDVI, moisture) via Kaegro for better field planning.
- **Marketplace & Daily Prices** - Create listings, browse products, place orders, and view daily market (mandi) prices to inform selling decisions.
- **Expert Consultation** - Send and receive expert suggestions and recommendations.
- **Real-time Messaging** - Real-time chat and presence updates via Socket.io.
- **Pest & Disease Alerts** - Receive notifications and recommended actions for observed pest or disease risks.
- **Inventory Tracking** - Manage equipment, stock, and farm resources.
- **PDF Reports** - Export farm and crop reports as PDFs.
- **Role-based Dashboards** - Separate views for Farmer, Buyer, Expert, and Admin.

---

## Tech Stack

- Runtime: Node.js + Express.js.
- Language: JavaScript.
- Frontend: React + Bootstrap.
- Database: MongoDB.
- Authentication: Firebase + JWT.
- Real-time: Socket.io.
- File Uploads: Multer.
- Testing: Jest + Supertest.
- Hosting: Vercel / Netlify for frontend, any Node host for backend.

---

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB local or MongoDB Atlas
- Firebase project credentials
- Git

### Installations

**Clone the repository**

```bash
git clone https://github.com/Ryson-Theo/CropVector.git
```

**Install dependencies**

```bash
cd backend && npm install
cd ../frontend && npm install
```

**Environment setup**

```bash
cd backend
cp .env.example .env
cd ../frontend
cp .env.example .env
```

> On Windows CMD use: `copy .env.example .env`

Update both `.env` files with your configuration.

### Development

```bash
cd backend && npm run dev
cd ../frontend && npm start
```

Visit: `http://localhost:3000`

### Production Build

```bash
cd frontend && npm run build
cd ../backend && npm start
```

---

## Repository Structure

```
CropVector/
├── backend/
│   ├── config/                 # DB, mail, and app config
│   ├── controllers/            # Route handlers and business logic
│   ├── models/                 # Mongoose schemas
│   ├── routes/                 # Express endpoints
│   ├── middleware/             # Auth and validation middleware
│   ├── services/               # External service helpers
│   ├── utils/                  # Utility helpers
│   ├── data/                   # Static JSON data
│   ├── uploads/                # Uploaded files and assets
│   ├── tests/                  # Backend tests
│   ├── server.js               # Express app entry point
│   └── package.json            # Backend dependencies and scripts
│
├── frontend/
│   ├── public/                 # Static public files
│   ├── src/                    # React source code
│   │   ├── components/         # UI components
│   │   ├── firebase.js         # Firebase config
│   │   ├── App.js              # Main app and routing
│   │   ├── index.js            # React entry point
│   │   └── index.css           # Global styles
│   ├── package.json            # Frontend dependencies and scripts
│   └── .env.example            # Frontend env template
│
├── backend/.env.example        # Backend env template
├── frontend/.env.example       # Frontend env template
├── CHANGELOG.md                # Release history and project changes
├── CONTRIBUTING.md             # Contribution guidelines
├── LICENSE                    # Project license
├── README.md                   # Project documentation
└── SECURITY.md                 # Security policy
```

- Serves file uploads from `/uploads`.
- Uses Socket.io for real-time messaging.

---

## Example API Endpoints

### Auth Routes

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/register` | POST | Register a new user |
| `/api/auth/login` | POST | Login with email/password |
| `/api/auth/login-firebase` | POST | Login via Firebase token |
| `/api/auth/profile` | GET | Get current user profile |
| `/api/auth/profile/update` | PATCH | Update user profile |
| `/api/auth/forgot-password` | POST | Request password reset |
| `/api/auth/reset-password` | POST | Reset password with OTP |
| `/api/auth/contact` | POST | Submit a contact request |

### Farmer Routes

| Endpoint | Method | Description |
|---|---|---|
| `/api/farmer/crops` | GET | List crops |
| `/api/farmer/crops` | POST | Add a crop |
| `/api/farmer/crops/:id` | PUT | Update a crop |
| `/api/farmer/crops/:id` | DELETE | Delete a crop |
| `/api/farmer/diseases` | GET | List diseases |
| `/api/farmer/diseases` | POST | Add disease record |
| `/api/farmer/locations` | GET | List locations |
| `/api/farmer/locations` | POST | Add a location |

### Marketplace Routes

| Endpoint | Method | Description |
|---|---|---|
| `/api/marketplace/listings` | GET | Browse listings |
| `/api/marketplace/listings` | POST | Create a listing |
| `/api/marketplace/listings/:id` | GET | Listing details |
| `/api/marketplace/orders` | POST | Place an order |
| `/api/marketplace/orders` | GET | Get user orders |
| `/api/marketplace/orders/:id` | PATCH | Update order |
| `/api/marketplace/reviews/listing/:id` | GET | Listing reviews |
| `/api/marketplace/webhook/shipment` | POST | Shipment webhook |

### Expert Routes

| Endpoint | Method | Description |
|---|---|---|
| `/api/expert/suggestions` | POST | Create expert suggestion |
| `/api/expert/suggestions/:sessionId` | GET | Get session suggestions |

### Example Request

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "farmer@example.com",
  "password": "StrongPassword123"
}
```

### Example Response

```json
{
  "success": true,
  "token": "eyJhbGci...",
  "user": {
    "id": "64a5...",
    "role": "farmer",
    "email": "farmer@example.com"
  }
}
```

---

## Authentication

Frontend authentication is handled with Firebase, while backend routes use JWT verification for protected requests.

Example Firebase setup:

```js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
```

---

## Environment Variables
### Backend `.env.example`

```env
# Server
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_here_min_32_chars
MONGODB_URI=mongodb://localhost:27017/cropvector

# Mail
MAIL_SERVICE=gmail
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_16_character_app_password

# Frontend URL for emails
FRONTEND_URL=http://localhost:3000

# External API keys (placeholders only)
OPENMETEO_API_KEY=your_openmeteo_key_here
KAEGRO_API_KEY=your_kaegro_key_here
MANDI_API_KEY=your_mandi_key_here
DATA_GOV_API_KEY=your_data_gov_api_key_here

# Optional production values
# MONGODB_ATLAS_URI=mongodb+srv://username:password@cluster.mongodb.net/cropvector
# JWT_EXPIRE=7d
```

### External APIs

- **OpenMeteo** — Weather forecasts, historical weather, and alerts used for real-time weather intelligence and automated alerting.
- **Kaegro** — Satellite-derived soil and vegetation analytics (NDVI, moisture, soil health) used to power soil analysis, field-level insights, and improve crop recommendations.
- **Mandi (Market) API** — Daily mandi/market price feeds and market metadata used to surface current crop prices and trends to farmers and to factor into crop recommendation logic.

These external services are combined by the backend recommendation service to produce daily crop recommendations, soil-driven advisories, weather-informed alerts, and market-aware pricing signals for farmers.

### Frontend `.env.example`

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-name.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-name
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-name.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=1:your_app_id:web:your_web_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=G-your_measurement_id
```

---

## Testing

Run backend tests with:

```bash
cd backend
npm test
```

Add tests for new endpoints, controllers, and critical workflows before merging.

---

## Continuous Integration (CI)

Add a GitHub Actions workflow to run backend tests and build the frontend on every push and pull request.

Example:

```yaml
name: CropVector CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install backend dependencies
        run: |
          cd backend
          npm ci
          npm test
      - name: Install frontend dependencies
        run: |
          cd frontend
          npm ci
          npm run build
```

---

## Versioning & Changelog

Use Semantic Versioning:

- `MAJOR.MINOR.PATCH`
- `1.0.0` — initial release
- `1.1.0` — new feature
- `1.1.1` — bug fix

Keep a `CHANGELOG.md` for release notes if the project is actively evolving.

---

## Contributing

We welcome contributions to CropVector!

1. Fork the repository.
2. Clone your fork.
3. Create a feature branch:

```bash
git checkout -b feat/your-feature-name
```

4. Install dependencies in both `backend` and `frontend`.
5. Implement your changes.
6. Run tests.
7. Commit with a clear message.
8. Open a pull request with a short summary and any related issue references.

---

## Code of Conduct

- Be respectful and constructive.
- Keep communication professional.
- Welcome feedback and collaborate.
- Avoid discriminatory or offensive language.
- Credit contributors fairly.

---

## Deployment

Recommended production strategy:

- Backend: deploy on a Node-compatible host.
- Frontend: deploy on Vercel or Netlify.
- Database: use MongoDB Atlas.
- Keep secrets in environment variables.
- Do not commit `.env` files.

---

## License

This project is licensed under the MIT License. See `LICENSE` for details.

---

## Author

CropVector is a personal project by the maintainer behind the GitHub account [Ryson-Theo](https://github.com/Ryson-Theo). It is not maintained by a company or organization.

<div align="center">
  <table>
    <tr>
      <td align="center" style="padding: 12px; border: 1px solid #ddd; border-radius: 16px;">
        <a href="https://github.com/Ryson-Theo" target="_blank">
          <img src="https://github.com/Ryson-Theo.png?size=120" alt="Ryson-Theo" width="120" height="120" style="border-radius: 50%;" />
        </a>
        <br />
        <strong>Ryson-Theo</strong>
        <br />
        <small>Main account</small>
      </td>
      <td width="24"></td>
      <td align="center" style="padding: 12px; border: 1px solid #ddd; border-radius: 16px;">
        <a href="https://github.com/Ribin-K-Roy" target="_blank">
          <img src="https://github.com/Ribin-K-Roy.png?size=120" alt="Ribin-K-Roy" width="120" height="120" style="border-radius: 50%;" />
        </a>
        <br />
        <strong>Ribin-K-Roy</strong>
        <br />
        <small>Other / practice account</small>
      </td>
    </tr>
  </table>
</div>

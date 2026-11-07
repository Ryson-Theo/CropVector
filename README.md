# CropVector

**Smarter insights. Better decisions. More sustainable farming.**

CropVector is a full-stack agriculture technology platform created by **Ribin K Roy**. It brings farmers, buyers, agricultural experts, and administrators together through crop management, field intelligence, marketplace services, weather insights, and farm operations.

<p align="center">
  <strong>A unified digital workspace for modern agriculture.</strong>
  <br />
  Built with React, Node.js, Express, MongoDB, Firebase, and Socket.io.
</p>

<p align="center">
  <a href="https://github.com/Ryson-Theo/CropVector">
    <img src="https://img.shields.io/badge/Repository-CropVector-181717?style=flat&logo=github" alt="GitHub Repository" />
  </a>
  <a href="https://nodejs.org/">
    <img src="https://img.shields.io/badge/Node.js-18%2B-339933?style=flat&logo=nodedotjs&logoColor=white" alt="Node.js" />
  </a>
  <a href="https://react.dev/">
    <img src="https://img.shields.io/badge/React-19.2-61DAFB?style=flat&logo=react&logoColor=black" alt="React" />
  </a>
  <a href="https://www.mongodb.com/">
    <img src="https://img.shields.io/badge/MongoDB-9.2-47A248?style=flat&logo=mongodb&logoColor=white" alt="MongoDB" />
  </a>
  <a href="https://firebase.google.com/">
    <img src="https://img.shields.io/badge/Firebase-Authentication-FFCA28?style=flat&logo=firebase&logoColor=black" alt="Firebase" />
  </a>
  <a href="https://socket.io/">
    <img src="https://img.shields.io/badge/Socket.io-4.8-010101?style=flat&logo=socketdotio&logoColor=white" alt="Socket.io" />
  </a>
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat" alt="MIT License" />
  </a>
  <a href="https://github.com/Ryson-Theo/CropVector/releases">
    <img src="https://img.shields.io/github/v/release/Ryson-Theo/CropVector?include_prereleases&label=Release" alt="Release" />
  </a>
</p>

<p align="center">
  Crop management • Field intelligence • Marketplace • Expert consultation
  <br />
  Weather insights • Real-time communication • Farm operations
</p>

<p align="center">
  <a href="#key-features">Features</a>
  •
  <a href="#screenshots-and-ui">Screenshots</a>
  •
  <a href="#architecture">Architecture</a>
  •
  <a href="#technology-stack">Stack</a>
  •
  <a href="#getting-started">Installation</a>
  •
  <a href="#api-documentation">API</a>
  •
  <a href="#external-integrations">Integrations</a>
  •
  <a href="#contributors-and-maintainer">Creator</a>
</p>

---

> **Project status:** Active development. Features, integrations, screenshots, and application behavior may change as the project evolves.

## Overview

CropVector is a personal full-stack agriculture technology project designed to connect different participants in the agricultural ecosystem through a unified platform.

The application provides separate role-based experiences for:

- **Farmers** — Manage crops, fields, farm resources, weather alerts, and marketplace activity.
- **Buyers** — Browse agricultural listings, place orders, and interact with sellers.
- **Experts** — Provide agricultural suggestions and consultation.
- **Administrators** — Manage users, platform activity, and administrative workflows.

The platform combines farm-level information with external weather, soil, satellite, and market data to support more informed agricultural decisions.

## Screenshots and UI

Explore the application's interface and page-by-page walkthrough:

<p align="center">
  <a href="./UI_PREVIEW.md">
    <img src="https://img.shields.io/badge/View-Project%20UI%20Walkthrough-2E7D32?style=for-the-badge&logo=readthedocs&logoColor=white" alt="View Project UI Walkthrough" />
  </a>
</p>

The walkthrough is maintained separately in [`UI_PREVIEW.md`](./UI_PREVIEW.md), keeping the main README focused on the project, architecture, and setup.

---

## Key Features

### Crop and Farm Management

- Create and manage crop records.
- Track crop lifecycle and growing stages.
- Maintain field and location information.
- Record crop-related disease observations.
- Organize farm resources and inventory.
- View field-level information through location-based workflows.

### Crop Recommendations and Farm Intelligence

- Rule-based crop recommendations.
- Use soil, weather, and market signals to support crop selection.
- Generate field-level insights from available agricultural data.
- Provide soil-driven advisories and planning information.
- Support better decisions around crop selection and cultivation.

### Weather Monitoring and Alerts

- Weather information through Open-Meteo.
- Weather forecasts and historical weather data.
- Location-based weather information.
- Configurable alerts for:
  - Heavy rain
  - Frost
  - Heatwaves
  - Strong winds
- Weather-informed crop and field advisories.

### Soil Analysis and Remote Sensing

- Soil health insights.
- Satellite-derived vegetation information through Kaegro.
- NDVI-based field analysis.
- Soil moisture insights.
- Field-level information to support agricultural planning.

### Marketplace and Daily Market Prices

- Create and browse agricultural product listings.
- View listing details.
- Place and manage orders.
- Review marketplace listings.
- Access daily mandi and market price information.
- Use market signals to support selling and crop-planning decisions.

### Expert Consultation

- Submit requests for agricultural suggestions.
- Create expert recommendations.
- Retrieve suggestions associated with a consultation session.
- Support communication between farmers and agricultural experts.

### Real-Time Messaging

- Real-time communication through Socket.io.
- Conversation and message handling.
- Online presence updates.
- Role-aware communication workflows.

### Pest and Disease Management

- Maintain disease records.
- Track observed crop-health issues.
- Provide pest and disease risk notifications.
- Support recommended preventive actions.

### Farm Inventory and Resources

- Track farm equipment and resources.
- Manage inventory-related information.
- Organize farm operational records.

### Reports and Role-Based Dashboards

- Generate PDF farm and crop reports.
- Separate dashboards for farmers, buyers, experts, and administrators.
- Role-aware access to platform functionality.

---

## Architecture

CropVector follows a full-stack client-server architecture. The React frontend communicates with the Express backend, which manages authentication, application logic, database operations, external integrations, and real-time communication.

The following diagram describes the main application layers and their relationships.

```mermaid
flowchart TD
    Users["Platform Users"]

    subgraph FRONTEND["Frontend · React"]
        App["App.js · Application Routing"]

        subgraph DASHBOARDS["Role-Based Dashboards"]
            Farmer["Farmer Dashboard"]
            Buyer["Buyer Dashboard"]
            Expert["Expert Dashboard"]
            Admin["Admin Dashboard"]
        end

        UI["Shared UI Components"]
    end

    subgraph BACKEND["Backend · Node.js + Express"]
        Server["Express Server"]

        subgraph API["API Routes"]
            Auth["Authentication Routes"]
            FarmerAPI["Farmer Routes"]
            MarketAPI["Marketplace Routes"]
            ExpertAPI["Expert Routes"]
        end

        subgraph LOGIC["Application Logic"]
            AuthLogic["Authentication & Authorization"]
            CropLogic["Crop & Field Management"]
            MarketLogic["Marketplace & Orders"]
            ExpertLogic["Expert Suggestions"]
            WeatherLogic["Weather & Recommendation Services"]
            ReportLogic["Report Generation"]
        end

        Socket["Socket.io · Messaging & Presence"]
        Uploads["Multer · File Uploads"]
    end

    DB[("MongoDB")]

    subgraph SERVICES["External Services"]
        Firebase["Firebase Authentication"]
        OpenMeteo["Open-Meteo · Weather"]
        Kaegro["Kaegro · Soil & Satellite Data"]
        Mandi["Mandi · Market Prices"]
        DataGov["Data.gov · API Configuration"]
    end

    Users --> App
    App --> DASHBOARDS
    App --> UI

    Farmer --> Server
    Buyer --> Server
    Expert --> Server
    Admin --> Server

    Server --> API
    Auth --> AuthLogic
    FarmerAPI --> CropLogic
    MarketAPI --> MarketLogic
    ExpertAPI --> ExpertLogic

    AuthLogic --> DB
    CropLogic --> DB
    MarketLogic --> DB
    ExpertLogic --> DB
    ReportLogic --> DB

    AuthLogic <--> Firebase
    WeatherLogic <--> OpenMeteo
    WeatherLogic <--> Kaegro
    WeatherLogic <--> Mandi
    WeatherLogic -. Configured integration .-> DataGov

    CropLogic --> WeatherLogic
    Server <--> Socket
    Server --> Uploads
```

### Application flow

```text
User
  │
  ▼
React Frontend
  │
  ├── Farmer Dashboard
  ├── Buyer Dashboard
  ├── Expert Dashboard
  └── Admin Dashboard
  │
  ▼
Express REST API
  │
  ├── Authentication & Authorization
  ├── Crop and Field Management
  ├── Marketplace and Orders
  ├── Expert Consultation
  ├── Weather and Recommendation Services
  └── Reports and File Handling
  │
  ▼
MongoDB
  │
  └── Application Data

Supporting Services
  ├── Firebase       → Authentication
  ├── Open-Meteo     → Weather Information
  ├── Kaegro         → Soil and Satellite Insights
  ├── Mandi API      → Market Price Information
  └── Socket.io      → Real-Time Messaging
```

The diagram represents the documented application design and integrations. Actual availability depends on the corresponding service configuration and credentials.

---

## Technology Stack

| Layer | Technology |
| --- | --- |
| Runtime | Node.js 18+ |
| Backend | Express.js |
| Language | JavaScript |
| Frontend | React 19.2 |
| UI Framework | Bootstrap |
| Database | MongoDB |
| Database ODM | Mongoose |
| Authentication | Firebase Authentication + JWT |
| Real-Time Communication | Socket.io 4.8 |
| File Uploads | Multer |
| Testing | Jest + Supertest |
| Weather Data | Open-Meteo |
| Soil and Satellite Insights | Kaegro |
| Market Information | Mandi API |
| Frontend Hosting | Vercel / Netlify |
| Backend Hosting | Node.js-compatible hosting |

---

## Project Structure

```text
CropVector/
│
├── backend/
│   ├── config/                 # Database, mail, and app configuration
│   ├── controllers/            # Route handlers and business logic
│   ├── models/                 # Mongoose schemas
│   ├── routes/                 # Express API endpoints
│   ├── middleware/             # Authentication and validation
│   ├── services/               # External service integrations
│   ├── utils/                  # Utility helpers
│   ├── data/                   # Static JSON data
│   ├── uploads/                # Uploaded files and assets
│   ├── tests/                  # Backend tests
│   ├── server.js               # Express application entry point
│   └── package.json            # Backend dependencies and scripts
│
├── frontend/
│   ├── public/                 # Static public files
│   ├── src/
│   │   ├── components/         # React UI components
│   │   ├── firebase.js         # Firebase configuration
│   │   ├── App.js              # Main app and routing
│   │   ├── index.js            # React entry point
│   │   └── index.css           # Global styles
│   ├── package.json            # Frontend dependencies and scripts
│   └── .env.example            # Frontend environment template
│
├── backend/.env.example        # Backend environment template
├── frontend/.env.example       # Frontend environment template
├── CHANGELOG.md                # Release history and project changes
├── CONTRIBUTING.md             # Contribution guidelines
├── LICENSE                     # Project license
├── README.md                   # Project documentation
└── SECURITY.md                 # Security policy
```

The backend serves uploaded files through `/uploads` and uses Socket.io for real-time messaging.

---

## Getting Started

### Requirements

Install the following before running CropVector:

- Node.js 18 or later.
- npm, included with Node.js.
- MongoDB local installation or MongoDB Atlas.
- Firebase project and web application credentials.
- Git.

### 1. Clone the Repository

```bash
git clone https://github.com/Ryson-Theo/CropVector.git

cd CropVector
```

### 2. Install Dependencies

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd ../frontend
npm install
```

### 3. Configure Environment Variables

Create the backend environment file:

```bash
cd ../backend
cp .env.example .env
```

Create the frontend environment file:

```bash
cd ../frontend
cp .env.example .env
```

On Windows Command Prompt, use:

```cmd
copy .env.example .env
```

Update both files with your MongoDB, Firebase, mail, and external service configuration.

### 4. Start the Backend

```bash
cd backend
npm run dev
```

The backend uses port `5000` by default.

### 5. Start the Frontend

Open another terminal:

```bash
cd frontend
npm start
```

Open the application at:

```text
http://localhost:3000
```

### Production Build

Build the frontend:

```bash
cd frontend
npm run build
```

Start the backend:

```bash
cd backend
npm start
```

---

## API Documentation

The backend exposes REST API endpoints through Express.

**Default local API base URL:**

```text
http://localhost:5000/api
```

The following tables document the example application endpoints.

### Authentication Routes

| Endpoint | Method | Description |
| --- | --- | --- |
| `/api/auth/register` | POST | Register a new user |
| `/api/auth/login` | POST | Login with email and password |
| `/api/auth/login-firebase` | POST | Login using a Firebase token |
| `/api/auth/profile` | GET | Retrieve current user profile |
| `/api/auth/profile/update` | PATCH | Update user profile |
| `/api/auth/forgot-password` | POST | Request password reset |
| `/api/auth/reset-password` | POST | Reset password with OTP |
| `/api/auth/contact` | POST | Submit a contact request |

### Farmer Routes

| Endpoint | Method | Description |
| --- | --- | --- |
| `/api/farmer/crops` | GET | Retrieve crops |
| `/api/farmer/crops` | POST | Add a crop |
| `/api/farmer/crops/:id` | PUT | Update a crop |
| `/api/farmer/crops/:id` | DELETE | Delete a crop |
| `/api/farmer/diseases` | GET | Retrieve disease records |
| `/api/farmer/diseases` | POST | Add a disease record |
| `/api/farmer/locations` | GET | Retrieve field locations |
| `/api/farmer/locations` | POST | Add a field location |

### Marketplace Routes

| Endpoint | Method | Description |
| --- | --- | --- |
| `/api/marketplace/listings` | GET | Browse marketplace listings |
| `/api/marketplace/listings` | POST | Create a listing |
| `/api/marketplace/listings/:id` | GET | Retrieve listing details |
| `/api/marketplace/orders` | POST | Place an order |
| `/api/marketplace/orders` | GET | Retrieve user orders |
| `/api/marketplace/orders/:id` | PATCH | Update an order |
| `/api/marketplace/reviews/listing/:id` | GET | Retrieve listing reviews |
| `/api/marketplace/webhook/shipment` | POST | Handle shipment webhook |

### Expert Routes

| Endpoint | Method | Description |
| --- | --- | --- |
| `/api/expert/suggestions` | POST | Create an expert suggestion |
| `/api/expert/suggestions/:sessionId` | GET | Retrieve suggestions for a session |

### Example Login Request

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "farmer@example.com",
  "password": "StrongPassword123"
}
```

### Example Login Response

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

Protected routes use backend JWT verification. Request and response formats may vary by endpoint.

---

## Authentication

CropVector uses Firebase Authentication on the frontend and JWT verification for protected backend requests.

The Firebase web configuration is supplied through frontend environment variables.

Example Firebase initialization:

```javascript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

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

Do not commit private credentials, service-account files, or populated `.env` files to the repository.

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

# External API keys / configuration placeholders
OPENMETEO_API_KEY=your_openmeteo_key_here
KAEGRO_API_KEY=your_kaegro_key_here
MANDI_API_KEY=your_mandi_key_here
DATA_GOV_API_KEY=your_data_gov_api_key_here

# Optional production values
# MONGODB_ATLAS_URI=mongodb+srv://username:password@cluster.mongodb.net/cropvector
# JWT_EXPIRE=7d
```

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

Use the environment variable names expected by the corresponding application code. The values above are placeholders, not working credentials.

---

## External Integrations

CropVector is designed to combine agricultural information from external services with application data.

### Open-Meteo — Weather Information

Used for weather-related information, including:

- Weather forecasts.
- Historical weather information.
- Location-based weather data.
- Weather-informed alerts and advisories.

Website: https://open-meteo.com/

### Kaegro — Soil and Satellite Insights

The documented integration is intended to provide satellite-derived agricultural information, including:

- NDVI vegetation indices.
- Soil moisture insights.
- Soil health information.
- Field-level analysis.

### Mandi API — Market Information

Used as a market-data integration for:

- Daily mandi prices.
- Market price information.
- Market metadata.
- Price signals for crop planning and selling decisions.

### Data.gov

A `DATA_GOV_API_KEY` configuration placeholder is included in the backend environment template. The specific endpoint and operational usage should be configured according to the selected Data.gov dataset.

External integrations require valid service configuration and credentials where applicable. A variable in an environment template does not, by itself, establish that an external service is active.

---

## Testing

Run backend tests:

```bash
cd backend
npm test
```

Add tests for new endpoints, controllers, and important application workflows before merging changes.

The backend test setup uses Jest and Supertest.

---

## Continuous Integration

A GitHub Actions workflow can be used to run backend tests and build the frontend on pushes and pull requests.

Example workflow:

```yaml
name: CropVector CI

on:
  push:
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Install backend dependencies and test
        run: |
          cd backend
          npm ci
          npm test

      - name: Install frontend dependencies and build
        run: |
          cd frontend
          npm ci
          npm run build
```

This is an example workflow configuration. Add it to `.github/workflows/` to enable it in the repository.

---

## Deployment

CropVector uses a separate frontend and backend deployment model.

| Component | Deployment |
| --- | --- |
| Frontend | Vercel or Netlify |
| Backend | Node.js-compatible hosting |
| Database | MongoDB Atlas or managed MongoDB |
| Authentication | Firebase project configuration |

### Production considerations

- Configure production environment variables.
- Use MongoDB Atlas or another appropriately secured database.
- Configure the frontend API URL to point to the deployed backend.
- Configure the correct frontend origin for backend requests.
- Keep JWT secrets and mail credentials private.
- Enable HTTPS.
- Validate file uploads and access permissions.
- Review authentication and API authorization.
- Configure external service credentials separately for production.

Never commit `.env` files or production secrets.

---

## Versioning and Changelog

CropVector follows Semantic Versioning:

```text
MAJOR.MINOR.PATCH
```

Examples:

- `1.0.0` — Initial release.
- `1.1.0` — New feature.
- `1.1.1` — Bug fix.

See [`CHANGELOG.md`](./CHANGELOG.md) for project release history and changes.

---

## Contributing

Contributions and suggestions are welcome.

### Development workflow

1. Fork the repository.
2. Clone your fork.
3. Create a feature branch:

```bash
git checkout -b feat/your-feature-name
```

4. Install dependencies in the backend and frontend.
5. Implement your changes.
6. Run the relevant tests.
7. Commit with a clear message.
8. Open a pull request with a summary of your changes.

Please review [`CONTRIBUTING.md`](./CONTRIBUTING.md) before submitting changes.

## Security

If you discover a security vulnerability, please follow the instructions in [`SECURITY.md`](./SECURITY.md) rather than publishing sensitive details in a public issue.

---

## License

CropVector is distributed under the **MIT License**.

See [`LICENSE`](./LICENSE) for the complete license text.

---

## Contributors and Maintainer

<p align="center">
  <strong>Created and developed by</strong>
</p>

<table align="center">
  <tr>
    <td align="center" width="220">
      <a href="https://github.com/Ryson-Theo">
        <img src="https://github.com/Ryson-Theo.png?size=240" width="120" height="120" alt="Ribin K Roy GitHub profile" />
      </a>
      <br />
      <br />
      <strong>
        <a href="https://github.com/Ryson-Theo">Ribin K Roy</a>
      </strong>
      <br />
      <sub>Project Creator · Main Account</sub>
      <br />
      <br />
      <a href="https://github.com/Ryson-Theo">
        <img src="https://img.shields.io/badge/GitHub-Ryson--Theo-181717?style=flat&logo=github" alt="Ryson-Theo GitHub" />
      </a>
    </td>
    <td width="32"></td>
    <td align="center" width="220">
      <a href="https://github.com/Ribin-K-Roy">
        <img src="https://github.com/Ribin-K-Roy.png?size=240" width="120" height="120" alt="Ribin K Roy alternate GitHub profile" />
      </a>
      <br />
      <br />
      <strong>
        <a href="https://github.com/Ribin-K-Roy">Ribin-K-Roy</a>
      </strong>
      <br />
      <sub>Other / Practice Account</sub>
      <br />
      <br />
      <a href="https://github.com/Ribin-K-Roy">
        <img src="https://img.shields.io/badge/GitHub-Ribin--K--Roy-181717?style=flat&logo=github" alt="Ribin-K-Roy GitHub" />
      </a>
    </td>
  </tr>
</table>

<p align="center">
  <sub>CropVector is an independent personal project created by Ribin K Roy.</sub>
</p>

---

<p align="center">
  <strong>CropVector</strong>
  <br />
  <sub>Connecting agriculture, technology, and better farming decisions.</sub>
  <br />
  <br />
  <a href="https://github.com/Ryson-Theo/CropVector">GitHub Repository</a>
  •
  <a href="./UI_PREVIEW.md">UI Walkthrough</a>
  •
  <a href="./CHANGELOG.md">Changelog</a>
</p>

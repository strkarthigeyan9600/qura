# REST API Specifications

Base URL: `http://localhost:5000/api/v1`

## Endpoints Summary

### 1. Health Check
- `GET /api/v1/health`
  - Returns server health status, version, and current system timestamp.

### 2. AI Assistant RAG Query
- `POST /api/v1/ai/chat`
  - **Body**: `{ "query": "Where is Dr. Alan Turing cabin?", "language": "en" }`
  - **Response**: Returns grounded AI message response with source citations and navigation action triggers.

### 3. Navigation Services
- `GET /api/v1/navigation/buildings`
  - Returns array of campus building records.
- `GET /api/v1/navigation/nodes?buildingId={id}&floorNumber={num}`
  - Returns array of map nodes filtered by building or floor.
- `POST /api/v1/navigation/route`
  - **Body**: `{ "fromNodeId": "n-kiosk-start", "toNodeId": "n-cabin-hod-cs", "accessibleOnly": false }`
  - **Response**: Calculated `NavigationRoute` object with total meters, walking time, path array, and step instructions.

### 4. Faculty Finder
- `GET /api/v1/faculty?search={query}&department={dept}`
  - Returns matching faculty members with cabins, office hours, and photos.

### 5. Transport & Bus Management
- `GET /api/v1/bus/routes`
  - Returns campus bus shuttle routes, vehicle numbers, driver contacts, and stop schedules.

### 6. Hostel & Mess Menu
- `GET /api/v1/hostels`
  - Returns hostel details, wardens, rules, and weekly breakfast/lunch/dinner mess menus.

### 7. Campus Events
- `GET /api/v1/events`
  - Returns hackathons, seminars, placement drives, and guest lectures.

### 8. Analytics
- `GET /api/v1/analytics`
  - Returns visitor traffic numbers, top searched building heatmaps, and language usage percentages.

### 9. Admin Auth
- `POST /api/v1/admin/login`
  - **Body**: `{ "username": "admin", "password": "admin123" }`
  - **Response**: Returns JWT token and admin user payload.

FROM node:22-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
FROM python:3.10-slim
WORKDIR /app
COPY backend/requirements.lock backend/requirements.lock
RUN pip install --no-cache-dir -r backend/requirements.lock
COPY backend backend
COPY --from=frontend /app/dist dist
CMD ["python", "-m", "backend.start_hosted"]

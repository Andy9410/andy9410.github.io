FROM node:20-alpine as build
WORKDIR /app
ARG VITE_CHAT_API_URL=http://localhost:8080
ARG VITE_AUTH_API_URL=http://localhost:8081
ARG VITE_DOCUMENT_API_URL=http://localhost:8083
ENV VITE_CHAT_API_URL=$VITE_CHAT_API_URL
ENV VITE_AUTH_API_URL=$VITE_AUTH_API_URL
ENV VITE_DOCUMENT_API_URL=$VITE_DOCUMENT_API_URL
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: static server con Vite preview
FROM node:20-alpine
WORKDIR /app
RUN npm i -g serve
COPY --from=build /app/dist /app/dist
EXPOSE 5173
CMD ["serve", "dist", "-l", "5173", "--single"]

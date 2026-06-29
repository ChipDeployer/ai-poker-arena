# Stage 1: Build the Go application
FROM golang:1.25-alpine AS build
WORKDIR /app

# Install git for dependency fetching
RUN apk add --no-cache git

# Copy all source files
COPY . .

# Resolve dependencies and build
RUN go mod tidy && go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -o poker-backend .

# Stage 2: Minimal runtime image
FROM alpine:3.19
WORKDIR /app
COPY --from=build /app/poker-backend .

EXPOSE 8080
CMD ["./poker-backend"]

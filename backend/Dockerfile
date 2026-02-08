ARG GO_VERSION=1.25.5

FROM golang:${GO_VERSION}-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -buildvcs=false -o sitgame ./cmd/api

FROM alpine:3.23.2
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=build /src/sitgame /app/sitgame
COPY migrations /app/migrations
COPY docs /app/docs
CMD ["/app/sitgame"]

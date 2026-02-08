ARG GO_VERSION=1.25.5

FROM golang:${GO_VERSION}-alpine AS build
WORKDIR /src

RUN apk add --no-cache git

COPY go.mod go.sum ./
RUN go mod download

RUN go install github.com/swaggo/swag/cmd/swag@latest

COPY . .
RUN swag init -g cmd/api/main.go -o ./docs

RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -buildvcs=false -o sitgame ./cmd/api

FROM alpine:3.23.2
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=build /src/sitgame /app/sitgame
COPY --from=build /src/migrations /app/migrations
COPY --from=build /src/docs /app/docs
CMD ["/app/sitgame"]

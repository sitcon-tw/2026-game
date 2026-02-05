BINARY_NAME=2026-game

build:
	go build -o tmp/$(BINARY_NAME) ./cmd/api
	chmod +x tmp/$(BINARY_NAME)

run: build
	./tmp/$(BINARY_NAME)

dev:
	swag init -g cmd/api/main.go -o ./docs && air --build.cmd "go build -o tmp/$(BINARY_NAME) ./cmd/api" --build.bin "./tmp/$(BINARY_NAME)"

test:
	go test ./...

lint:
	go fmt ./...
	go vet ./...
	golint ./...

generate-docs:
	swag init -g cmd/api/main.go -o ./docs

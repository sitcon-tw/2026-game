BINARY_NAME=2026-game

build:
	go build -o tmp/$(BINARY_NAME) ./cmd/backend
	chmod +x tmp/$(BINARY_NAME)

run: build
	./tmp/$(BINARY_NAME)

web:
	cd website && pnpm run dev

dev:
	swag init -g cmd/main.go -o ./docs && air --build.cmd "go build -o tmp/$(BINARY_NAME) ./cmd" --build.bin "./tmp/$(BINARY_NAME)"

test:
	go test ./...

lint:
	go fmt ./...
	go vet ./...
	golint ./...

generate-docs:
	swag init -g cmd/main.go -o ./docs
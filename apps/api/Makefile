.PHONY: dev build start test vet format tidy clean migrate migrate-up migrate-down

# Development with hot-reload (requires: go install github.com/air-verse/air@latest)
dev:
	air

# Build the server binary
build:
	go build -o ./build/server ./cmd/server

# Run the built binary
start:
	./build/server

# Run tests
test:
	go test ./...

# Run go vet
vet:
	go vet ./...

# Format code
format:
	gofmt -w -s .

# Tidy modules
tidy:
	go mod tidy

# Clean build artifacts
clean:
	rm -rf ./build ./tmp

# Run all pending migrations (interactive confirmation)
migrate-up:
	go run ./cmd/migrate -dir=up

# Roll back the last migration (interactive confirmation)
migrate-down:
	go run ./cmd/migrate -dir=down -step=1

# Generic passthrough: `make migrate ARGS="-only=001 -yes"`
migrate:
	go run ./cmd/migrate $(ARGS)

# Update dependencies
update:
	go get -u ./... && go mod tidy && go mod verify

# Build for production (static, stripped)
build-prod:
	CGO_ENABLED=0 go build -ldflags="-s -w" -o ./build/server ./cmd/server

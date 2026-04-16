.PHONY: dev build start test vet format tidy clean

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

# Update dependencies
update:
	go get -u ./... && go mod tidy && go mod verify

# Build for production (static, stripped)
build-prod:
	CGO_ENABLED=0 go build -ldflags="-s -w" -o ./build/server ./cmd/server

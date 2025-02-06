FROM mcr.microsoft.com/devcontainers/javascript-node:20

# Install pnpm
RUN su node -c "npm i -g pnpm"

# Install additional OS packages
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends postgresql-client redis-tools

# Clean up
RUN apt-get autoremove -y \
    && apt-get clean -y \
    && rm -rf /var/lib/apt/lists/*

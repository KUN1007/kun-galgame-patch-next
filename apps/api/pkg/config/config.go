package config

import "os"

type Config struct {
	Server       ServerConfig
	Database     DatabaseConfig
	Redis        RedisConfig
	OAuth        OAuthConfig
	NextMoeAPI   NextMoeAPIConfig
	ImageService ImageServiceConfig
	Artifact     ArtifactConfig
	Trust        TrustConfig
	CORS         CORSConfig
}

type ServerConfig struct {
	Port string
	Mode string
}

type DatabaseConfig struct {
	URL             string
	MaxIdleConns    int
	MaxOpenConns    int
	ConnMaxLifetime int
}

type RedisConfig struct {
	Host     string
	Port     string
	Password string
	DB       int
}

type OAuthConfig struct {
	ServerURL    string
	ClientID     string
	ClientSecret string
	RedirectURI  string
}

type NextMoeAPIConfig struct {
	BaseURL string
	APIKey  string
}

type ImageServiceConfig struct {
	BaseURL      string
	CDNBase      string
	ClientID     string
	ClientSecret string
}

type ArtifactConfig struct {
	BaseURL      string
	ClientID     string
	ClientSecret string
}

type TrustConfig struct {
	BaseURL        string
	Site           string
	CallbackSecret string
}

type CORSConfig struct {
	AllowOrigins string
}

func Load() *Config {
	mode := getEnv("KUN_SERVER_MODE", "dev")
	return &Config{
		Server: ServerConfig{
			Port: getEnv("KUN_SERVER_PORT", "5214"),
			Mode: mode,
		},
		Database: DatabaseConfig{
			URL:             mustGetEnv("KUN_DATABASE_URL"),
			MaxIdleConns:    10,
			MaxOpenConns:    100,
			ConnMaxLifetime: 60,
		},
		Redis: RedisConfig{
			Host:     getEnv("REDIS_HOST", "127.0.0.1"),
			Port:     getEnv("REDIS_PORT", "6379"),
			Password: getEnv("REDIS_PASSWORD", ""),
			DB:       0,
		},
		OAuth: OAuthConfig{
			ServerURL:    getEnv("OAUTH_SERVER_URL", "http://127.0.0.1:9277/api/v1"),
			ClientID:     getEnv("OAUTH_CLIENT_ID", ""),
			ClientSecret: getEnv("OAUTH_CLIENT_SECRET", ""),
			RedirectURI:  getEnv("OAUTH_REDIRECT_URI", ""),
		},
		NextMoeAPI: NextMoeAPIConfig{
			BaseURL: getEnv("KUN_NEXTMOE_API_BASE", "http://127.0.0.1:19281"),
			APIKey:  getEnv("KUN_NEXTMOE_API_KEY", ""),
		},
		ImageService: ImageServiceConfig{
			BaseURL:      getEnvProd("KUN_IMAGE_SERVICE_BASE_URL", "http://127.0.0.1:9278", mode),
			CDNBase:      getEnvProd("KUN_IMAGE_CDN_BASE", "http://127.0.0.1:9000/kun-images-dev", mode),
			ClientID:     getEnv("KUN_IMAGE_OAUTH_CLIENT_ID", ""),
			ClientSecret: getEnv("KUN_IMAGE_OAUTH_CLIENT_SECRET", ""),
		},
		Artifact: ArtifactConfig{
			BaseURL:      getEnvProd("KUN_ARTIFACT_SERVICE_BASE_URL", "http://127.0.0.1:9279", mode),
			ClientID:     getEnv("KUN_ARTIFACT_OAUTH_CLIENT_ID", ""),
			ClientSecret: getEnv("KUN_ARTIFACT_OAUTH_CLIENT_SECRET", ""),
		},
		Trust: TrustConfig{
			BaseURL:        getEnvOptionalProd("KUN_TRUST_BASE_URL", "http://127.0.0.1:9283", mode),
			Site:           getEnv("KUN_TRUST_SITE", "moyu"),
			CallbackSecret: getEnv("KUN_TRUST_CALLBACK_SECRET", ""),
		},
		CORS: CORSConfig{
			AllowOrigins: getEnv(
				"CORS_ALLOW_ORIGINS",
				"http://127.0.0.1:5213,http://127.0.0.1:6969",
			),
		},
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func mustGetEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		panic("required environment variable not set: " + key)
	}
	return v
}

func getEnvProd(key, devFallback, mode string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	if mode == "prod" {
		panic("required environment variable not set in prod mode: " + key)
	}
	return devFallback
}

func getEnvOptionalProd(key, devFallback, mode string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	if mode == "prod" {
		return ""
	}
	return devFallback
}

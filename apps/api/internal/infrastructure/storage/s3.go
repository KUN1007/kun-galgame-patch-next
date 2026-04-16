package storage

import (
	"bytes"
	"context"
	"log/slog"

	"kun-galgame-patch-api/pkg/config"

	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type S3Client struct {
	client *s3.Client
	bucket string
}

func NewS3(cfg config.S3Config) *S3Client {
	if cfg.Endpoint == "" {
		slog.Warn("S3 not configured, storage disabled")
		return &S3Client{}
	}

	awsCfg, err := awsconfig.LoadDefaultConfig(context.Background(),
		awsconfig.WithRegion(cfg.Region),
		awsconfig.WithCredentialsProvider(
			credentials.NewStaticCredentialsProvider(cfg.AccessKey, cfg.SecretKey, ""),
		),
	)
	if err != nil {
		panic("failed to load S3 config: " + err.Error())
	}

	client := s3.NewFromConfig(awsCfg, func(o *s3.Options) {
		o.BaseEndpoint = &cfg.Endpoint
		o.UsePathStyle = true
	})

	slog.Info("S3 storage connected", "bucket", cfg.Bucket)
	return &S3Client{client: client, bucket: cfg.Bucket}
}

func (s *S3Client) Upload(ctx context.Context, key string, data []byte, contentType string) error {
	_, err := s.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      &s.bucket,
		Key:         &key,
		Body:        bytes.NewReader(data),
		ContentType: &contentType,
	})
	return err
}

func (s *S3Client) Delete(ctx context.Context, key string) error {
	_, err := s.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: &s.bucket,
		Key:    &key,
	})
	return err
}

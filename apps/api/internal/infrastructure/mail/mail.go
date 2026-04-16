package mail

import (
	"fmt"
	"log/slog"
	"net/smtp"

	"kun-galgame-patch-api/pkg/config"
)

type Mailer struct {
	host     string
	port     string
	from     string
	username string
	password string
}

func NewMailer(cfg config.MailConfig) *Mailer {
	if cfg.Host == "" {
		slog.Warn("Mail not configured, email sending disabled")
	}
	return &Mailer{
		host:     cfg.Host,
		port:     cfg.Port,
		from:     cfg.From,
		username: cfg.Username,
		password: cfg.Password,
	}
}

func (m *Mailer) Send(to, subject, body string) error {
	if m.host == "" {
		slog.Warn("Mail not configured, skipping send", "to", to)
		return nil
	}

	msg := fmt.Sprintf(
		"From: %s\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=\"utf-8\"\r\n\r\n%s",
		m.from, to, subject, body,
	)

	auth := smtp.PlainAuth("", m.username, m.password, m.host)
	addr := fmt.Sprintf("%s:%s", m.host, m.port)
	return smtp.SendMail(addr, auth, m.from, []string{to}, []byte(msg))
}

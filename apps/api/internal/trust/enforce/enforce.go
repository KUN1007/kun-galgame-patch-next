package enforce

import (
	"context"
	"log/slog"
	"strconv"

	"kun-galgame-patch-api/internal/trust/dto"

	"gorm.io/gorm"
)

const (
	ActionNone        int16 = 0
	ActionHide        int16 = 1
	ActionRemove      int16 = 2
	ActionWarnUser    int16 = 3
	ActionRestrict    int16 = 4
	ActionEscalateIdp int16 = 5
)

type Adapter struct {
	Hide     func(ctx context.Context, id int) error
	Remove   func(ctx context.Context, id int) error
	Restore  func(ctx context.Context, id int) error
	AuthorID func(ctx context.Context, id int) (int, error)
}

type Registry map[string]Adapter

type WarnFunc func(ctx context.Context, userID int, reasonCode string) error

type Service struct {
	db       *gorm.DB
	registry Registry
	warn     WarnFunc
}

func NewService(db *gorm.DB, registry Registry, warn WarnFunc) *Service {
	return &Service{db: db, registry: registry, warn: warn}
}

func (s *Service) Apply(ctx context.Context, cb dto.TrustCallback) error {
	var exists bool
	if err := s.db.WithContext(ctx).
		Raw("SELECT EXISTS(SELECT 1 FROM trust_disposition_applied WHERE disposition_id = ?)", cb.DispositionID).
		Scan(&exists).Error; err != nil {
		return err
	}
	if exists {
		return nil
	}

	if err := s.dispatch(ctx, cb); err != nil {
		return err
	}
	slog.Info("trust disposition applied",
		"disposition_id", cb.DispositionID, "subject_kind", cb.SubjectKind,
		"subject_id", cb.SubjectID, "action", cb.Action, "reason_code", cb.ReasonCode)

	return s.db.WithContext(ctx).Exec(
		"INSERT INTO trust_disposition_applied (disposition_id, action) VALUES (?, ?) ON CONFLICT DO NOTHING",
		cb.DispositionID, cb.Action,
	).Error
}

func (s *Service) dispatch(ctx context.Context, cb dto.TrustCallback) error {
	id, err := strconv.Atoi(cb.SubjectID)
	if err != nil {
		slog.Warn("trust callback: non-numeric subject_id",
			"subject_id", cb.SubjectID, "disposition_id", cb.DispositionID)
		return nil
	}
	adapter, hasAdapter := s.registry[cb.SubjectKind]

	switch cb.Action {
	case ActionHide:
		if hasAdapter && adapter.Hide != nil {
			return adapter.Hide(ctx, id)
		}
	case ActionRemove:
		if hasAdapter && adapter.Remove != nil {
			return adapter.Remove(ctx, id)
		}
	case ActionWarnUser:
		if hasAdapter && adapter.AuthorID != nil && s.warn != nil {
			authorID, err := adapter.AuthorID(ctx, id)
			if err != nil {
				return err
			}
			if authorID > 0 {
				return s.warn(ctx, authorID, cb.ReasonCode)
			}
		}
	case ActionNone:
		if hasAdapter && adapter.Restore != nil {
			return adapter.Restore(ctx, id)
		}
	case ActionRestrict, ActionEscalateIdp:
	}

	slog.Info("trust callback: no local enforcement",
		"subject_kind", cb.SubjectKind, "action", cb.Action, "disposition_id", cb.DispositionID)
	return nil
}

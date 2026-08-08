package repository

import (
	"kun-galgame-patch-api/internal/auth/model"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type AuthRepository struct {
	db *gorm.DB
}

func New(db *gorm.DB) *AuthRepository {
	return &AuthRepository{db: db}
}

func (r *AuthRepository) FindUserByID(id int) (*model.User, error) {
	var user model.User
	if err := r.db.First(&user, id).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *AuthRepository) CreateUser(user *model.User) error {
	return r.db.Clauses(clause.OnConflict{DoNothing: true}).Create(user).Error
}

func (r *AuthRepository) UpdateLastLoginTime(userID int, t string) error {
	return r.db.Model(&model.User{}).Where("id = ?", userID).Update("last_login_time", t).Error
}

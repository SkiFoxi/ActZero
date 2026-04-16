package models

// UserRegistrationRequest represents user registration request
// @Description Данные для регистрации нового пользователя
type UserRegistrationRequest struct {
	// Email пользователя (используется как логин)
	// @example john@example.com
	Username string `json:"username" binding:"required"`

	// Пароль пользователя
	// @example securepassword123
	Password string `json:"password" binding:"required"`

	// Email (дублирует username)
	// @example john@example.com
	Email string `json:"email,omitempty"`

	// Полное имя пользователя
	// @example Иван Иванов
	FullName string `json:"full_name,omitempty"`

	// Номер телефона
	// @example +79991234567
	Phone string `json:"phone,omitempty"`
}
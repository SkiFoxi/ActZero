FROM golang:1.23-alpine AS builder

WORKDIR /app

# Установка зависимостей для сборки
RUN apk add --no-cache git

# Копирование go mod файлов
COPY go.mod go.sum* ./
RUN go mod download

# Копирование исходного кода
COPY . .

# Сборка ТОЛЬКО OAuth2 сервера
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main ./cmd/server

FROM alpine:latest

RUN apk --no-cache add ca-certificates curl

WORKDIR /root/

# Копирование бинарника
COPY --from=builder /app/main .

# Копирование папки с миграциями (ВАЖНО!)
COPY --from=builder /app/migrations ./migrations

EXPOSE 8080

CMD ["./main"]
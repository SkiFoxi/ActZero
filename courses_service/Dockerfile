FROM golang:1.23-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

# Копируем только go.mod — go.sum сгенерируется автоматически
COPY go.mod ./
RUN go mod download && go mod tidy 2>/dev/null || go mod download

# Копируем весь исходный код
COPY . .

# Финальный go mod tidy на случай если что-то изменилось
RUN go mod tidy

RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main ./cmd/server

FROM alpine:latest

RUN apk --no-cache add ca-certificates curl

WORKDIR /root/

COPY --from=builder /app/main .
COPY --from=builder /app/migrations ./migrations

EXPOSE 8082

CMD ["./main"]

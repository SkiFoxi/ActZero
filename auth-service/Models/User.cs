namespace AuthService.Models;

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public decimal Balance { get; set; } = new Random().Next(1000, 10001); //временный баланс средств
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

//База данных. Каждое свойство это колонка в таблице
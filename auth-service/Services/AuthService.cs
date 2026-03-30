using AuthService.Data;
using AuthService.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace AuthService.Services;

public class AuthService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public AuthService(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    //Регистрация
    public async Task<(User User, string Token)?> Register(string name, string email, string phone, string password)
    {
        if (await _db.Users.AnyAsync(u => u.Email == email))
            return null;

        var user = new User
        {
            Name = name,
            Email = email,
            Phone = phone,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password)
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        
        var token = GenerateToken(user);
        return (user, token);
    }

    // Вход
    public async Task<(string Token, string Name)?> Login(string email, string password)
{
    var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
    if (user == null) return null;
    if (!BCrypt.Net.BCrypt.Verify(password, user.PasswordHash)) return null;

    var token = GenerateToken(user);
    return (token, user.Name);
}

    //Создание Токена JWT
    private string GenerateToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Secret"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Name)
        };

        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public User? GetUserFromToken(string token)
    {
        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);
        
        var userIdClaim = jwt.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return null;
        
        var userId = int.Parse(userIdClaim.Value);
        return _db.Users.FirstOrDefault(u => u.Id == userId);
    }

    public async Task<User?> GetUserById(int id)
    {
        return await _db.Users.FindAsync(id);
    }
}
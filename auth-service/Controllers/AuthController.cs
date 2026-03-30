using AuthService.Services;
using Microsoft.AspNetCore.Mvc;
using AuthService.Models;

namespace AuthService.Controllers;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase 
{

    private readonly Services.AuthService _authService;

    public AuthController(Services.AuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        var result = await _authService.Register(req.Name, req.Email, req.Phone, req.Password);
        if (result == null)
            return Conflict(new { message = "Email уже занят" });

        return Ok(new { token = result.Value.Token, message = "Аккаунт создан" });
    }


    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        // if (string.IsNullOrEmpty(req.Email) || string.IsNullOrEmpty(req.Password))
        //     return BadRequest(new {message = "Заполните все поля"});
        var result = await _authService.Login(req.Email, req.Password);
        if (result == null)
            return Unauthorized(new {message = "Неверный email или пароль"});
        return Ok(new { token = result.Value.Token });
    }

    [HttpGet("me")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<IActionResult> Me()
    {
        var idClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (idClaim == null) return Unauthorized();
        
        var userId = int.Parse(idClaim);
        var user = await _authService.GetUserById(userId);
        if (user == null) return NotFound();

        return Ok(new { id = user.Id, email = user.Email, name = user.Name, phone = user.Phone, balance = user.Balance });
    }
}
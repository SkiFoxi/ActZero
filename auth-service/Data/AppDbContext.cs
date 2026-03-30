using Microsoft.EntityFrameworkCore;
using AuthService.Models;

namespace AuthService.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) 
    {

    }


    //таблица в базе данных
    public DbSet<User> Users { get; set; }
}

//связь между C# и Postgres
using Microsoft.EntityFrameworkCore;
using MangaStudio.Backend.Models.Entities;

namespace MangaStudio.Backend.Data;

public class AppDbContext : MangaStudioContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }
}
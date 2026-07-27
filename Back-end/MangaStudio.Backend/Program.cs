using MangaStudio.Backend.Data;
using MangaStudio.Backend.Services.Implementations;
using MangaStudio.Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using Microsoft.Extensions.FileProviders;
using System.IO;
using MangaStudio.Backend.Serialization;

var builder = WebApplication.CreateBuilder(args);


builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.Converters.Add(new UtcDateTimeJsonConverter());
    options.JsonSerializerOptions.Converters.Add(new NullableUtcDateTimeJsonConverter());
});


builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});


builder.Services.AddEndpointsApiExplorer();


builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Manga Studio API", Version = "v1" });
    
    
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Nhập JWT Token của bạn dưới dạng: Bearer {chuỗi_token_của_bạn}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});


builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
    );
});


var jwtKey = builder.Configuration["Jwt:Key"] ?? "MangaStudioWorkflowSuperSecretKey12345!";
var key = Encoding.UTF8.GetBytes(jwtKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false; 
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "MangaStudio.Backend",
        ValidateAudience = true,
        ValidAudience = builder.Configuration["Jwt:Audience"] ?? "MangaStudio.Frontend",
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero 
    };
});


builder.Services.AddScoped<IMangakaService, MangakaService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ISeriesService, SeriesService>();
builder.Services.AddScoped<IChapterService, ChapterService>();
builder.Services.AddScoped<IPageService, PageService>();
builder.Services.AddScoped<ITaskService, TaskService>();
builder.Services.AddScoped<IWorkflowService, WorkflowService>();
builder.Services.AddScoped<IStorageService, CloudinaryService>();


var app = builder.Build();
await DatabaseSchemaInitializer.EnsureCompatibleSchemaAsync(app.Services);

app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new
        {
            message = "An unexpected server error occurred."
        });
    });
});


app.UseSwagger();
app.UseSwaggerUI();


if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
var uploadsPath = Path.Combine(app.Environment.ContentRootPath, "Uploads");
if (!Directory.Exists(uploadsPath))
{
    Directory.CreateDirectory(uploadsPath);
}
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPath),
    RequestPath = "/Uploads"
});
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});


app.UseCors("AllowAll");


app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

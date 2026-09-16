using Application.Abstractions;
using Application.IRepositories;
using Infrastructure.Persistence;
using Infrastructure.Repositories;
using Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, string connectionString)
    {
        services.AddDbContext<AppDbContext>(opt => opt.UseNpgsql(connectionString));

        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IHabitRepository, HabitRepository>();
        services.AddScoped<ICheckInRepository, CheckInRepository>();
        services.AddScoped<ISyncOperationRepository, SyncOperationRepository>();

        services.AddScoped<ISequenceProvider, DbSequenceProvider>();
        services.AddSingleton<IClock, SystemClock>();

        return services;
    }
}

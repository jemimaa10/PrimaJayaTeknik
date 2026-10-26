using Microsoft.Data.Sqlite;

namespace PrimaJayaTeknik.Services;

public class Database
{
    private readonly string _connectionString;

    public Database(IConfiguration config, IWebHostEnvironment env)
    {
        var builder = new SqliteConnectionStringBuilder(config.GetConnectionString("Default"));
        builder.DataSource = Path.Combine(env.ContentRootPath, builder.DataSource);
        Directory.CreateDirectory(Path.GetDirectoryName(builder.DataSource)!);
        _connectionString = builder.ToString();
    }

    public void EnsureCreated()
    {
        Execute("""
            CREATE TABLE IF NOT EXISTS ContactMessages (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                FullName TEXT NOT NULL,
                Email TEXT NOT NULL,
                CompanyName TEXT NOT NULL,
                CountryId INTEGER NOT NULL,
                PhoneNumber TEXT NOT NULL,
                Message TEXT NOT NULL,
                IpAddress TEXT,
                EmailSent INTEGER NOT NULL DEFAULT 0,
                CreatedAt TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS Leads (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                ContactType TEXT NOT NULL,
                PagePath TEXT,
                IpAddress TEXT,
                UserAgent TEXT,
                CreatedAt TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS PageViews (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                Kind TEXT NOT NULL,
                ProductId INTEGER,
                PagePath TEXT,
                IpAddress TEXT,
                CreatedAt TEXT NOT NULL
            );
            """);
    }

    public long Execute(string sql, params (string Name, object? Value)[] parameters)
    {
        using var connection = new SqliteConnection(_connectionString);
        connection.Open();
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        foreach (var (name, value) in parameters)
            command.Parameters.AddWithValue(name, value ?? DBNull.Value);
        command.ExecuteNonQuery();
        command.CommandText = "SELECT last_insert_rowid()";
        command.Parameters.Clear();
        return (long)command.ExecuteScalar()!;
    }
}

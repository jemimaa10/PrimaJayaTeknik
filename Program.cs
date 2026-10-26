using System.Net;
using System.Net.Mail;
using System.Text.RegularExpressions;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.HttpOverrides;
using PrimaJayaTeknik.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<Database>();
builder.Services.AddSingleton<ProductCatalog>();
builder.Services.AddSingleton<SearchPage>();
builder.Services.AddSingleton<ContactMailer>();
builder.Services.Configure<ForwardedHeadersOptions>(o =>
{
    o.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    o.KnownIPNetworks.Clear();
    o.KnownProxies.Clear();
});
builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    o.AddPolicy("contact", ctx => RateLimitPartition.GetFixedWindowLimiter(
        ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 5, Window = TimeSpan.FromMinutes(10) }));
    o.AddPolicy("leads", ctx => RateLimitPartition.GetFixedWindowLimiter(
        ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 60, Window = TimeSpan.FromMinutes(1) }));
});

var app = builder.Build();

app.Services.GetRequiredService<Database>().EnsureCreated();

var notFoundPage = File.ReadAllText(Path.Combine(app.Environment.ContentRootPath, "Templates", "404.html"));
var countries = Regex.Matches(
        File.ReadAllText(Path.Combine(app.Environment.WebRootPath, "contact-us", "index.html")),
        """<option value="(\d+)"[^>]*>([^<]*)</option>""")
    .GroupBy(m => int.Parse(m.Groups[1].Value))
    .ToDictionary(g => g.Key, g => WebUtility.HtmlDecode(g.First().Groups[2].Value.Trim()));

app.UseForwardedHeaders();

// Pages are stored as folder/index.html, but the site links to them without the trailing
// index.html (and often without the trailing slash), like the original server did.
app.Use(async (ctx, next) =>
{
    var path = ctx.Request.Path.Value ?? "/";
    if (HttpMethods.IsGet(ctx.Request.Method) || HttpMethods.IsHead(ctx.Request.Method))
    {
        // The search box posts to the relative "find", so it can arrive under any page's folder.
        if (path.EndsWith("/find", StringComparison.OrdinalIgnoreCase))
        {
            ctx.Request.Path = path.StartsWith("/en/", StringComparison.OrdinalIgnoreCase) ? "/en/find" : "/find";
        }
        else if (!Path.HasExtension(path))
        {
            var index = Path.Combine(app.Environment.WebRootPath, path.Trim('/'), "index.html");
            if (File.Exists(index))
                ctx.Request.Path = "/" + Path.GetRelativePath(app.Environment.WebRootPath, index).Replace('\\', '/');
        }
    }
    await next();
});

app.UseStaticFiles(new StaticFileOptions
{
    // Pages change whenever the site is rebuilt; make browsers check instead of showing a stale copy.
    OnPrepareResponse = ctx =>
    {
        if (ctx.File.Name.EndsWith(".html", StringComparison.OrdinalIgnoreCase))
            ctx.Context.Response.Headers.CacheControl = "no-cache";
    },
});
// Routing has to run after the rewrite above, otherwise the fallback 404 would win for every page.
app.UseRouting();
app.UseRateLimiter();

IResult Search(string lang, string? q, int? page, SearchPage search) =>
    Results.Content(search.Render(lang, q ?? "", page ?? 1), "text/html; charset=utf-8");

app.MapGet("/find", (string? q, int? page, SearchPage search) => Search("id", q, page, search));
app.MapGet("/en/find", (string? q, int? page, SearchPage search) => Search("en", q, page, search));

app.MapPost("/contact-us", async (ContactRequest req, HttpContext ctx, Database db, ContactMailer mailer) =>
{
    const string invalid = "Mohon lengkapi semua data dengan benar.";

    // Hidden field only bots fill in: pretend it worked and drop it.
    if (!string.IsNullOrEmpty(req.Website))
        return Results.Json(new { success = true });

    if (string.IsNullOrWhiteSpace(req.VisitorFullName) || req.VisitorFullName.Length > 255 ||
        string.IsNullOrWhiteSpace(req.VisitorCompanyName) || req.VisitorCompanyName.Length > 255 ||
        string.IsNullOrWhiteSpace(req.VisitorPhoneNumber) || req.VisitorPhoneNumber.Length > 50 ||
        string.IsNullOrWhiteSpace(req.Message) || req.Message.Trim().Length < 10 || req.Message.Length > 5000 ||
        req.VisitorCountryId is not int countryId || !countries.TryGetValue(countryId, out var country) ||
        string.IsNullOrWhiteSpace(req.VisitorEmail) || req.VisitorEmail.Length > 255 ||
        !MailAddress.TryCreate(req.VisitorEmail, out _))
    {
        return Results.Json(new { success = false, message = invalid });
    }

    var id = db.Execute("""
        INSERT INTO ContactMessages (FullName, Email, CompanyName, CountryId, PhoneNumber, Message, IpAddress, CreatedAt)
        VALUES ($name, $email, $company, $country, $phone, $message, $ip, $at)
        """,
        ("$name", req.VisitorFullName.Trim()), ("$email", req.VisitorEmail.Trim()),
        ("$company", req.VisitorCompanyName.Trim()), ("$country", countryId),
        ("$phone", req.VisitorPhoneNumber.Trim()), ("$message", req.Message.Trim()),
        ("$ip", ctx.Connection.RemoteIpAddress?.ToString()), ("$at", DateTime.UtcNow.ToString("O")));

    if (await mailer.SendAsync(req, country))
        db.Execute("UPDATE ContactMessages SET EmailSent = 1 WHERE Id = $id", ("$id", id));

    return Results.Json(new { success = true });
}).RequireRateLimiting("contact");

void RecordView(Database db, HttpContext ctx, string kind, long? productId) =>
    db.Execute("INSERT INTO PageViews (Kind, ProductId, PagePath, IpAddress, CreatedAt) VALUES ($kind, $product, $path, $ip, $at)",
        ("$kind", kind), ("$product", productId), ("$path", ctx.Request.Headers.Referer.ToString()),
        ("$ip", ctx.Connection.RemoteIpAddress?.ToString()), ("$at", DateTime.UtcNow.ToString("O")));

app.MapPost("/leads/company", (HttpContext ctx, Database db) =>
{
    RecordView(db, ctx, "company", null);
    return Results.Json(new { });
}).RequireRateLimiting("leads");

app.MapPost("/leads/product/{productId:long}", (long productId, HttpContext ctx, Database db) =>
{
    RecordView(db, ctx, "product", productId);
    return Results.Json(new { });
}).RequireRateLimiting("leads");

// The page only holds an encrypted placeholder for each contact; the real value is handed
// out on click so every reveal is recorded as a lead.
app.MapPost("/leads/{contactType}", (string contactType, HttpContext ctx, Database db, IConfiguration config) =>
{
    var value = contactType switch
    {
        "phone" => config["Contact:Phone"],
        "whatsapp" => config["Contact:WhatsApp"],
        "email" => config["Contact:Email"],
        _ => null,
    };
    if (string.IsNullOrEmpty(value))
        return Results.Json("");

    db.Execute("INSERT INTO Leads (ContactType, PagePath, IpAddress, UserAgent, CreatedAt) VALUES ($type, $path, $ip, $ua, $at)",
        ("$type", contactType), ("$path", ctx.Request.Headers.Referer.ToString()),
        ("$ip", ctx.Connection.RemoteIpAddress?.ToString()), ("$ua", ctx.Request.Headers.UserAgent.ToString()),
        ("$at", DateTime.UtcNow.ToString("O")));
    return Results.Json(value);
}).RequireRateLimiting("leads");

app.MapFallback(() => Results.Content(notFoundPage, "text/html; charset=utf-8", statusCode: StatusCodes.Status404NotFound));

app.Run();

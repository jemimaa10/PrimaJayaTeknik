using System.Net;
using System.Net.Mail;

namespace PrimaJayaTeknik.Services;

public record ContactRequest(
    string? VisitorFullName,
    string? VisitorEmail,
    string? VisitorCompanyName,
    int? VisitorCountryId,
    string? VisitorPhoneNumber,
    string? Message,
    string? Website);

public class ContactMailer
{
    private readonly IConfiguration _config;
    private readonly ILogger<ContactMailer> _logger;

    public ContactMailer(IConfiguration config, ILogger<ContactMailer> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task<bool> SendAsync(ContactRequest req, string country)
    {
        var smtp = _config.GetSection("Smtp");
        var user = smtp["User"];
        if (string.IsNullOrWhiteSpace(user))
        {
            _logger.LogWarning("Smtp:User belum diisi, pesan kontak hanya disimpan ke database");
            return false;
        }

        var from = string.IsNullOrWhiteSpace(smtp["From"]) ? user : smtp["From"]!;
        using var mail = new MailMessage(from, smtp["To"]!)
        {
            Subject = $"Pesan baru dari website - {req.VisitorFullName}",
            Body = $"""
                Nama       : {req.VisitorFullName}
                Email      : {req.VisitorEmail}
                Perusahaan : {req.VisitorCompanyName}
                Negara     : {country}
                Telepon    : {req.VisitorPhoneNumber}

                {req.Message}
                """,
        };
        mail.ReplyToList.Add(new MailAddress(req.VisitorEmail!, req.VisitorFullName));

        using var client = new SmtpClient(smtp["Host"], smtp.GetValue("Port", 587))
        {
            EnableSsl = smtp.GetValue("EnableSsl", true),
            Credentials = new NetworkCredential(user, smtp["Password"]),
        };

        try
        {
            await client.SendMailAsync(mail);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Gagal mengirim email pesan kontak");
            return false;
        }
    }
}

using System.Net;
using System.Text.RegularExpressions;

namespace PrimaJayaTeknik.Services;

public record Product(long Id, string Name, string Url, string Image, string? Price);

// Search reads the same product cards the listing pages show, so the results always match the site.
public partial class ProductCatalog
{
    private readonly Dictionary<string, List<Product>> _products = new();

    [GeneratedRegex("""<div class="product-grid main-shadow card p-2 mb-3">\s*<a href="(?<url>[^"]+)">\s*<img[^>]*data-src="(?<img>[^"]+)"[^>]*/>\s*<div class="product-name[^"]*">(?<name>[^<]*)</div>\s*(?:<div class="[^"]*rupiah">(?<price>[^<]*)</div>)?""")]
    private static partial Regex CardRegex();

    [GeneratedRegex(@"-(\d+)$")]
    private static partial Regex IdRegex();

    public ProductCatalog(IWebHostEnvironment env)
    {
        _products["id"] = Load(Path.Combine(env.WebRootPath, "products"));
        _products["en"] = Load(Path.Combine(env.WebRootPath, "en", "products"));
    }

    public int Count(string lang) => _products[lang].Count;

    public List<Product> Search(string lang, string query)
    {
        // The original matches the whole query as one phrase: "ss316 ptfe" does not match "SS316L PTFE".
        var phrase = string.Join(' ', query.Split(' ', StringSplitOptions.RemoveEmptyEntries));
        if (phrase.Length == 0)
            return [];
        return _products[lang]
            .Where(p => string.Join(' ', p.Name.Split(' ', StringSplitOptions.RemoveEmptyEntries))
                .Contains(phrase, StringComparison.OrdinalIgnoreCase))
            .ToList();
    }

    private static List<Product> Load(string dir)
    {
        var products = new Dictionary<string, Product>();
        if (!Directory.Exists(dir))
            return [];
        foreach (var file in Directory.EnumerateFiles(dir, "index.html", SearchOption.AllDirectories))
        {
            foreach (Match m in CardRegex().Matches(File.ReadAllText(file)))
            {
                var url = m.Groups["url"].Value;
                var id = IdRegex().Match(url);
                products.TryAdd(url, new Product(
                    id.Success ? long.Parse(id.Groups[1].Value) : 0,
                    WebUtility.HtmlDecode(m.Groups["name"].Value),
                    url,
                    m.Groups["img"].Value,
                    m.Groups["price"].Success ? WebUtility.HtmlDecode(m.Groups["price"].Value) : null));
            }
        }
        return products.Values.OrderByDescending(p => p.Id).ToList();
    }
}

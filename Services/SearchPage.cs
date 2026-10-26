using System.Net;
using System.Text;

namespace PrimaJayaTeknik.Services;

// Renders /find with the original page as template: only the query, the product grid and the pagination change.
public class SearchPage
{
    public const int PageSize = 24;
    private const int PageWindow = 5;

    private readonly ProductCatalog _catalog;
    private readonly Dictionary<string, string> _templates = new();

    public SearchPage(ProductCatalog catalog, IWebHostEnvironment env)
    {
        _catalog = catalog;
        foreach (var lang in new[] { "id", "en" })
            _templates[lang] = File.ReadAllText(Path.Combine(env.ContentRootPath, "Templates", $"find.{lang}.html"));
    }

    public string Render(string lang, string query, int page)
    {
        query = query.Trim();
        var results = _catalog.Search(lang, query);
        var pageCount = Math.Max(1, (int)Math.Ceiling(results.Count / (double)PageSize));
        page = Math.Clamp(page, 1, pageCount);

        var content = results.Count == 0
            ? NotFound()
            : Results(lang, results.Skip((page - 1) * PageSize).Take(PageSize), Pagination(lang, query, page, pageCount));

        return _templates[lang]
            .Replace("{{Q}}", WebUtility.HtmlEncode(query))
            .Replace("{{QURL}}", Uri.EscapeDataString(query))
            .Replace("{{CONTENT}}", content);
    }

    private static string NotFound() => """
            <div class="row">
                <div class="col-12">
                    <div class="alert alert-warning text-center">
                        Produk yang anda cari tidak ditemukan
                    </div>
                </div>
            </div>
        """;

    private static string Results(string lang, IEnumerable<Product> products, string pagination)
    {
        var sb = new StringBuilder();
        sb.Append("    <div class=\"row mb-3\">\n");
        sb.Append($"        <h2 class=\"pb-3 fw-bold\">{(lang == "en" ? "Catalog Product" : "Katalog Produk")}</h2>\n");
        foreach (var p in products)
        {
            sb.Append($"""
                            <div class="col-6 col-md-4 col-xxl-2 pb-3">

                    <div class="product-grid main-shadow card p-2 mb-3">
                        <a href="{p.Url}">
                            <img class="img-fluid full-image pb-1 lazyload" src="/images/icon/spinner.svg" data-src="{p.Image}" />
                            <div class="product-name my-2 px-2 text-black">{WebUtility.HtmlEncode(p.Name)}</div>

                """);
            if (p.Price != null)
                sb.Append($"                <div class=\"pb-2 px-2 text-black rupiah\">{WebUtility.HtmlEncode(p.Price)}</div>\n");
            sb.Append("""
                        </a>
                    </div>

                            </div>

                """);
        }
        sb.Append("    </div>\n");
        sb.Append("        <div class=\"row\">\n            <div class=\"col-12\">\n\n");
        sb.Append(pagination);
        sb.Append("            </div>\n        </div>");
        return sb.ToString();
    }

    private static string Pagination(string lang, string query, int page, int pageCount)
    {
        if (pageCount <= 1)
            return "";

        var basePath = (lang == "en" ? "/en/find" : "/find") + "?q=" + Uri.EscapeDataString(query);
        string Link(int n) => n == 1 ? basePath : $"{basePath}&amp;page={n}";
        string Item(int n, string text) =>
            $"            <li class=\"page-item\">\n                <a class=\"page-link\" href=\"{Link(n)}\">{text}</a>\n            </li>\n";

        var first = Math.Max(1, Math.Min(page - PageWindow / 2, pageCount - PageWindow + 1));
        var last = Math.Min(pageCount, first + PageWindow - 1);

        var sb = new StringBuilder("<ul class=\"pagination d-flex justify-content-center\">\n");
        if (page > 1)
        {
            sb.Append(Item(1, "&lt;&lt;"));
            sb.Append(Item(page - 1, "&lt;"));
        }
        for (var n = first; n <= last; n++)
        {
            sb.Append(n == page
                ? $"            <li class=\"page-item active\">\n                <span class=\"page-link\">{n}</span>\n            </li>\n"
                : Item(n, n.ToString()));
        }
        if (page < pageCount)
        {
            sb.Append(Item(page + 1, "&gt;"));
            sb.Append(Item(pageCount, "&gt;&gt;"));
        }
        sb.Append("</ul>\n");
        return sb.ToString();
    }
}

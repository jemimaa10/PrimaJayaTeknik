var CompanyViewCount = function () {
  $.ajax({
    type: "POST",
    url: "/leads/company",
    dataType: "json",
    crossDomain: true,
    success: function (response) {},
  });
};

var ProductViewCount = function (ProductId) {
  $.ajax({
    type: "POST",
    url: "/leads/product/" + ProductId,
    dataType: "json",
    crossDomain: true,
    success: function (response) {},
  });
};

$(document).on("click", ".leads-click", function (e) {
  e.preventDefault();
  e.stopPropagation();

  var currentElement = $(this);

  // A second click while the first is in flight would send a duplicate lead.
  if (currentElement.hasClass("loading")) return;
  currentElement.addClass("loading");

  var contactInfo = currentElement.data("text");
  var contactType = currentElement.data("type");
  var contactText = currentElement.find(".contact-text");
  var originalText = contactText.text();

  // Direct mode (CTA buttons): record the lead, then go straight to WhatsApp. The tab is opened
  // now, inside the click, because browsers block window.open after an async call.
  var direct = currentElement.data("open") === "direct" && contactType === "whatsapp";
  var directWindow = direct ? window.open("", "_blank") : null;
  if (directWindow) directWindow.opener = null;

  var swapText = function (text) {
    if (direct) return;
    contactText.removeClass("fade-in").addClass("fade-out");
    setTimeout(function () {
      contactText.text(text).removeClass("fade-out").addClass("fade-in");
    }, 150);
  };

  // Put the masked label back and keep the contact clickable.
  var restore = function () {
    currentElement.removeClass("loading").removeAttr("aria-busy");
    if (directWindow) directWindow.close();
    swapText(originalText);
  };

  if (direct) currentElement.attr("aria-busy", "true");
  else swapText("Tunggu...");

  $.ajax({
    type: "POST",
    url: "/leads/" + contactType,
    data: JSON.stringify({ ContactInfo: contactInfo }),
    contentType: "application/json; charset=UTF-8",
    dataType: "json",
    success: function (response) {
      // The server answers "" whenever the API rejected the lead.
      if (!response) {
        restore();
        return;
      }

      if (direct) {
        var text = currentElement.data("message") || "Hallo, kami mendapat nomor anda dari Indonetwork.co.id";
        var url = "https://api.whatsapp.com/send?phone=" + response + "&text=" + encodeURIComponent(text);
        if (directWindow) directWindow.location.href = url;
        else window.location.href = url;
        currentElement.removeClass("loading").removeAttr("aria-busy");
        return;
      }

      currentElement.removeClass("leads-click loading");

      if (contactType === "phone") {
        currentElement.attr("href", "tel:" + response);
      } else if (contactType === "whatsapp") {
        var message = "Hallo, kami mendapat nomor anda dari Indonetwork.co.id";
        currentElement.attr(
          "href",
          "https://api.whatsapp.com/send?phone=" + response + "&text=" + encodeURIComponent(message)
        );
        currentElement.attr("target", "_blank");
      } else if (contactType === "email") {
        currentElement.attr("href", "mailto:" + response);
        currentElement.attr("target", "_blank");
      }

      swapText(response);
    },
    error: restore,
  });
});

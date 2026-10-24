$(function () {
  var form = $("#contact-us-form");
  if (form.length < 1) return;

  var submitButton = $("#contact-us-submit");
  var alertBox = $("#contact-us-alert");

  var showAlert = function (message, isSuccess) {
    alertBox
      .removeClass("d-none alert-success alert-danger")
      .addClass(isSuccess ? "alert-success" : "alert-danger")
      .text(message);
  };

  var hideAlert = function () {
    alertBox.addClass("d-none").removeClass("alert-success alert-danger").text("");
  };

  var setSending = function (isSending) {
    submitButton.prop("disabled", isSending);
    submitButton.text(
      isSending
        ? submitButton.data("sending-text")
        : submitButton.data("default-text")
    );
  };

  form.on("submit", function (e) {
    e.preventDefault();

    hideAlert();

    if (this.checkValidity() === false) {
      form.addClass("was-validated");
      return;
    }
    form.removeClass("was-validated");

    var request = {
      VisitorFullName: $("#contact-us-full-name").val(),
      VisitorEmail: $("#contact-us-email").val(),
      VisitorCompanyName: $("#contact-us-company-name").val(),
      VisitorCountryId: parseInt($("#contact-us-country").val(), 10),
      VisitorPhoneNumber: $("#contact-us-phone-number").val(),
      Message: $("#contact-us-message").val(),
      Website: $("#contact-us-website").val(),
    };

    setSending(true);

    $.ajax({
      type: "POST",
      url: "/contact-us",
      data: JSON.stringify(request),
      contentType: "application/json; charset=UTF-8",
      dataType: "json",
      success: function (response) {
        setSending(false);

        if (response && response.success) {
          showAlert(submitButton.data("success-text"), true);
          form[0].reset();
          submitButton.prop("disabled", true);
          return;
        }

        showAlert(
          response && response.message
            ? response.message
            : submitButton.data("error-text"),
          false
        );
      },
      error: function () {
        setSending(false);
        showAlert(submitButton.data("error-text"), false);
      },
    });
  });
});

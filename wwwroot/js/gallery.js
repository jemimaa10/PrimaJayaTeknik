const gallery = new Swiper(".gallery-slider", {
  loop: false,
  spaceBetween: 10,
  slidesPerView: 2,
  breakpoints: {
    // four across from the lg breakpoint up
    992: {
      slidesPerView: 4,
    },
  },
  navigation: {
    prevEl: ".gallery-prev",
    nextEl: ".gallery-next",
  },
  pagination: {
    el: ".gallery-dots",
    clickable: true,
  },
});

const galleryTiles = Array.prototype.slice.call(document.querySelectorAll(".gallery-tile"));
const galleryViewer = document.getElementById("galleryViewer");

if (galleryViewer && galleryTiles.length > 0) {
  const galleryViewerImage = document.getElementById("galleryViewerImage");
  const galleryViewerCount = document.getElementById("galleryViewerCount");
  let galleryCurrent = 0;
  let galleryOpener = null;

  const showGalleryImage = function (index) {
    galleryCurrent = (index + galleryTiles.length) % galleryTiles.length;
    galleryViewerImage.src = galleryTiles[galleryCurrent].getAttribute("data-gallery-full");
    galleryViewerCount.textContent = galleryCurrent + 1 + " / " + galleryTiles.length;
  };

  const openGallery = function (index) {
    galleryOpener = document.activeElement;
    galleryViewer.hidden = false;
    document.body.classList.add("gallery-viewer-open");
    showGalleryImage(index);
    document.getElementById("galleryViewerClose").focus();
  };

  const closeGallery = function () {
    galleryViewer.hidden = true;
    galleryViewerImage.src = "";
    document.body.classList.remove("gallery-viewer-open");
    if (galleryOpener) galleryOpener.focus();
  };

  galleryTiles.forEach(function (tile, index) {
    tile.addEventListener("click", function () {
      openGallery(index);
    });
  });

  document.getElementById("galleryViewerClose").addEventListener("click", closeGallery);
  document.getElementById("galleryViewerPrev").addEventListener("click", function () {
    showGalleryImage(galleryCurrent - 1);
  });
  document.getElementById("galleryViewerNext").addEventListener("click", function () {
    showGalleryImage(galleryCurrent + 1);
  });

  galleryViewer.addEventListener("click", function (event) {
    if (event.target === galleryViewer) closeGallery();
  });

  document.addEventListener("keydown", function (event) {
    if (galleryViewer.hidden) return;
    if (event.key === "Escape") closeGallery();
    if (event.key === "ArrowLeft") showGalleryImage(galleryCurrent - 1);
    if (event.key === "ArrowRight") showGalleryImage(galleryCurrent + 1);
  });
}

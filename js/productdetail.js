$(function () {
	const swiper = new Swiper('.product-image-mobile', {  
	  loop: true,  
	  spaceBetween: 5,
	  autoplay: {
		delay : 5000,
	  }, 
	  speed : 600,
	  navigation: {
		nextEl: '.swiper-button-next',
		prevEl: '.swiper-button-prev',
	  }
	});

	// const ImageDesktopSlider = new Swiper(".product-list-desktop", {
	// 	loop: true,
	// 	spaceBetween: 5,
	// 	slidesPerView: 1,
	// 	breakpoints: {
	// 		992: {
	// 			slidesPerView: 3
	// 		}
	// 	},
	// 	navigation: {
	// 		nextEl: '.swiper-button-next',
	// 		prevEl: '.swiper-button-prev',
	// 	}
	// });

	var ImageDesktopSlider = new Swiper(".verticalSwiper", {
      direction: "vertical", 
	  autoHeight:true,
	  slidesPerView: 3,
	  loop:true,
	  draggable:true,
      autoplay: {
        delay: 2000, 
        disableOnInteraction: false,
    },
    }); 

	const ImageModal = new bootstrap.Modal(document.getElementById('image-modal'), {});
	$(".image-view").on("click", function () {
		var id = $(this).data("ref");
		$("#" + id).trigger("click");
		ImageModal.show();
	});
	
	 $(".image-modal-view").click(function () {
		 $(".view-normal").empty().removeClass("video-normal").addClass("image-normal");
		 var image = $(this).data("image");
		 $(".view-normal").html("<img class='img-fluid' src='" + image + "'>");
	 });
	 
	 $(".video-modal-view").click(function () {
		$(".view-normal").empty().removeClass("image-normal").addClass("video-normal");
		var videoid = $(this).data("video");
		$(".view-normal").html('<iframe src="https://www.youtube.com/embed/' + videoid + '?autoplay=0" scrolling="no" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>');
	}); 
});

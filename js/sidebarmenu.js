$(function () {
	$(".tree-toggle").on("click", function(){
		var parent = $(this).closest(".tree-list"); // get current parent
		if($(parent).siblings(".tree-list").hasClass("active")){ // check if parent siblings has active class
			var siblings = $(parent).siblings(".tree-list");
			$(siblings).find(".group-tree").slideUp(300);
			$(siblings).removeClass("active"); // remove all active class on parent siblings
			$(siblings).find(".tree-list").removeClass("active"); // remove all active class on children of parent siblings
		}
		$(parent).children(".group-tree").slideToggle(300);
		$(parent).toggleClass("active"); // toggle active class of parent
	});
});
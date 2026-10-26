$(function () {
	document.querySelectorAll('.menu-list.dropdown-item').forEach(item => {
	  const submenu = item.querySelector('.menu-dropdown.child');
	  if (!submenu) return;

	  item.addEventListener('mouseenter', () => {
		const viewportHeight = window.innerHeight;
		const rect = item.getBoundingClientRect();
		submenu.style.top = rect.top + 'px';
		submenu.style.left = rect.left + 'px';
		submenu.style.display = 'block';
		
		const rectSubmenu = submenu.getBoundingClientRect();
		submenu.style.left = ((rect.left - rectSubmenu.width) + 5) + 'px';
		if(rectSubmenu.bottom > viewportHeight) {
			submenu.style.top = 'auto';
			submenu.style.bottom = '5px';
		}
	  });

	  item.addEventListener('mouseleave', () => {
		submenu.style = '';
	  });
	});
});
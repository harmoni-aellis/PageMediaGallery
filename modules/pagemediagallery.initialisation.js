

$(document).ready(function (){

	var primaryGallery = new pagemediagallery.ui.PrimaryGallery();
	primaryGallery.init();
	
	$(".msuploadContainer").each(function (i) {
		new pagemediagallery.ui.SecondaryGallery(this, primaryGallery);
	});
	
	
});
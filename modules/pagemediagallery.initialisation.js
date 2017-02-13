var pagemediagallery = {};


$(document).ready(function (){

	console.log(typeof pagemediagallery.ui.SecondaryGallery);

	var primaryGallery = new pagemediagallery.ui.PrimaryGallery();
	console.log(primaryGallery.constructor.name);
	primaryGallery.init();
	
	$(".msuploadContainer").each(function (i) {
		new pagemediagallery.ui.SecondaryGallery(this, primaryGallery);
	});
	
	
});
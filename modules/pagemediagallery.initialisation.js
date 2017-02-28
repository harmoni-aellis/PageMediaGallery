

$(document).ready(function (){

	var primaryGallery = new pagemediagallery.ui.PrimaryGallery();
	primaryGallery.init();
	
	$(".msuploadContainer").not('.multipleTemplateStarter .msuploadContainer').each(function (i) {
		new pagemediagallery.ui.SecondaryGallery(this, primaryGallery);
	});
	
	// add event on new step button, to appli VE on new steps
	mw.hook( 'pf.addTemplateInstance' ).add( function(div) {
		console.log('add step');
			$(div).find('.msuploadContainer').each(function() {
				console.log('add gallery on step');
				new pagemediagallery.ui.SecondaryGallery(this, primaryGallery);
			});
		} );
	
	
});
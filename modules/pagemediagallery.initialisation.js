

$(document).ready(function (){

	var primaryGallery = new pagemediagallery.ui.PrimaryGallery();
	primaryGallery.init();
	
	$(".msuploadContainer").not('.multipleTemplateStarter .msuploadContainer').each(function (i) {
		new pagemediagallery.ui.SecondaryGallery(this, primaryGallery);
	});
	
	// add event on new step button, to appli VE on new steps
	mw.hook( 'pf.addTemplateInstance' ).add( function(div) {
			$(div).find('.msuploadContainer').each(function() {
				new pagemediagallery.ui.SecondaryGallery(this, primaryGallery);
			});
		} );
	
	
});
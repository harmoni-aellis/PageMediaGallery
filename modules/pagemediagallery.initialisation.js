

$(document).ready(function (){

	$(".msuploadContainer").not('.multipleTemplateStarter .msuploadContainer').each(function (i) {
		new pagemediagallery.ui.SecondaryGallery(this);
	});


	// add event on new step button, to appli VE on new steps
	mw.hook( 'pf.addTemplateInstance' ).add( function(div) {
			// set timeout enable to run it in a new 'thread',
			// and to continue hook execution without wait for VE to be loaded
			setTimeout(function(){
				$(div).find('.msuploadContainer').each(function() {
					new pagemediagallery.ui.SecondaryGallery(this);
				});
			}, 10);
		} );

	$('.simplePMG').find('.addFileAttachment').prev().each(function () {
		//setup the multipleTemplateStarter for future instances
		if($(this).parents('.multipleTemplateStarter').length > 0){
			$(this).addClass('simplemsuploadContainer');
			$(this).children().hide();
			$(this).parent().next('.instanceAddAbove').children().hide();
		//create a SecondaryGallery for existing instances
		} else {
			new pagemediagallery.ui.SecondaryGallery(this);
		}
	});

	//add event to create secondaryGallery on every attachment instance
	mw.hook('pf.addSimpleTemplateInstance').add(function (container) {
		var secondaryGallery = new pagemediagallery.ui.SecondaryGallery(container);
		MediaManager.start(secondaryGallery);
	});

});
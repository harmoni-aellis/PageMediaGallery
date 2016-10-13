var pageMediaGallery = {

	open: function() {
		$('#PageGallery').width(250);
		$('#main').css('marginLeft','250px');
	},
	close: function() {
		$('#PageGallery').width(0);
		$('#main').css('marginLeft','0px');
	},
	
	callMsUpload() {
		uploader = MsUpload.createUploaderOnElement($('#PageGallery'));
		MsUpload.initWithImgElement(uploader);
	},
	init: function () {
		pageMediaGallery.open();
		setTimeout(pageMediaGallery.callMsUpload, 300);
	}
};

$( pageMediaGallery.init );





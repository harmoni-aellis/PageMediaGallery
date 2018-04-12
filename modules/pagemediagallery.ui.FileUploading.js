
pagemediagallery.ui = pagemediagallery.ui || {};

( function ( $, mw, pagemediagallery,plupload ) {
	'use strict';


	/**
	 * FileUploading class
	 * represent a file dropped into form, but not yet uploaded
 	 *
	 * @param container node
	 * @constructor
	 */
	pagemediagallery.ui.FileUploading = function ( file, secondaryGallery ) {

		var currentFile = this;
		this.secondaryGallery = secondaryGallery;
		var uploader = secondaryGallery.primaryGallery.uploader;

		this.file = file;
		this.isUploaded = false;

		// init class
		if(! pagemediagallery.ui.FileUploading.initialised ){
			// to avoid bind many time the same event, check if it is done before
			pagemediagallery.ui.FileUploading.initialised = true;
			uploader.bind('FileUploaded', pagemediagallery.ui.FileUploading.onFileUpload);
			uploader.bind('FilesAdded', pagemediagallery.ui.FileUploading.onFilesAdded);
			uploader.bind('FilesRemoved', pagemediagallery.ui.FileUploading.onFilesRemoved);
		}

		this.fileAdded();

		// add file to the page gallery uploader
		uploader.addFile(file);

		// register instance
		pagemediagallery.ui.FileUploading.instances.push(this);
	};

	pagemediagallery.ui.FileUploading.initialised = false;
	pagemediagallery.ui.FileUploading.instances = [];


	/**
	 * call when instance is created, before trigger upload, to show loading images
	 */
	pagemediagallery.ui.FileUploading.prototype.fileAdded = function ( ) {

		// todo : find a way to get the real image
		this.tempImage = $('<div>').attr('class', 'tempFileLoader');
		//this.tempImage = img.clone();
		this.secondaryGallery.addTempImage(this.tempImage, this.file.name);
	}

	/**
	 * call when file is uploaded, use to update files in forms
	 */
	pagemediagallery.ui.FileUploading.prototype.confirmUpload = function ( file ) {

		if(this.isUploaded) {
			// security to avoid many calls
			return;
		}
		this.isUploaded = true;

		$(this.tempImage).parents('li.fileToBeUpload').remove();

		//to use it later
		var instance = this;
		
		if (file.extension == "stl"){
			$.ajax({
				type: "POST",
				url: mw.util.wikiScript('api'),
				data: {
					iiprop: 'url',
					action:'query',
					format:'json',
					titles: 'File:' + file.name,
					iiurlwidth: '800px',
					prop: 'imageinfo'
				},
			    dataType: 'json',
			    // Function to be called if the request succeeds
				success: function( jsondata ){

					var pages = jsondata['query']['pages'];
					for (var firstkey in pages);
					var thumbnail = pages[firstkey]['imageinfo'][0]['thumburl'];

					var img = document.createElement("img");
					img.setAttribute('src', thumbnail);
					img.setAttribute('class', 'file-thumb stl');
					img.setAttribute('style', 'width: 100%;');
					instance.secondaryGallery.addImage(img, file.name, this.tempImage);
				}
			});
		}else{
			var img = file.li.find('img.file-thumb');
		}
		if ( img.length == 0) {
			var img = file.li.find('video.file-thumb');
		}
		this.secondaryGallery.addImage(img.clone(), file.name, this.tempImage);
	};

	pagemediagallery.ui.FileUploading.prototype.cancelUpload = function ( file ) {

		if(this.isCanceled) {
			// security to avoid many calls
			return;
		}
		this.isCanceled = true;

		this.secondaryGallery.removeTempImage(file.name, this.tempImage);
	};

	pagemediagallery.ui.FileUploading.prototype.updateFileTempImage = function ( file ) {

		var tempImage = this.tempImage;

		// add image on loader
		// this does not work, :/
		try {
			var image = new o.Image();
			image.onload = function () {
				this.embed( tempImage, {
					width: 30,
					height: 30,
					crop: true
				});
			};
			image.load( file.getSource() );
			this.tempImage.addClass( 'file-load' );
		} catch ( event ) {
			this.tempImage.addClass( 'image' );
		}
	};

	/**
	 * static method to listen FilesRemoved event 
	 */
	pagemediagallery.ui.FileUploading.onFilesRemoved = function (uploader, files) {
		//console.log('pagemediagallery.file.onFilesRemoved');
		for (var a = 0; a < files.length; a++) {
			var file = files[a];
			for (var i = 0; i < pagemediagallery.ui.FileUploading.instances.length; i++) {
				// here, in case of multiple file upload,
				// I cannot find an exact condition to find if the uploaded file match the one for this object
				var initName = pagemediagallery.ui.FileUploading.instances[i].file.name;

				// this fix issue with filename with space : change them to '_' :
				initName = initName.replace(/[^A-Za-z0-9\-_\.:]+/g,"_");

				if (file.name.indexOf(initName, file.name.length - initName.length) !== -1) {
					pagemediagallery.ui.FileUploading.instances[i].cancelUpload(file);
				}
			}
		}
	}

	/**
	 * static method to listen FileAdded event and call updateFileTempImage on corresponding items
	 */
	pagemediagallery.ui.FileUploading.onFilesAdded = function (uploader, files) {
		//console.log('pagemediagallery.file.onFilesAdded');
		for (var a = 0; a < files.length; a++) {
			var file = files[a];
			for (var i = 0; i < pagemediagallery.ui.FileUploading.instances.length; i++) {
				// here, in case of multiple file upload,
				// I cannot find an exact condition to find if the uploaded file match the one for this object
				var initName = pagemediagallery.ui.FileUploading.instances[i].file.name;

				// this fix issue with filename with space : change them to '_' :
				initName = initName.replace(/[^A-Za-z0-9\-_\.:]+/g,"_");

				if (file.name.indexOf(initName, file.name.length - initName.length) !== -1) {
				//if (pagemediagallery.ui.FileUploading.instances[i].file.name == file.name) {
					pagemediagallery.ui.FileUploading.instances[i].updateFileTempImage(file);
				}
			}
		}
	}

	/**
	 * static method to listen FileUpload event and call confirmUpload on corresponding items
	 */
	pagemediagallery.ui.FileUploading.onFileUpload = function (uploader, file, success) {

		//console.log('pagemediagallery.file.onFileUpload');
		for (var i = 0; i < pagemediagallery.ui.FileUploading.instances.length; i++) {
			// here, in case of multiple file upload,
			// I cannot find an exact condition to find if the uploaded file match the one for this object
			var initName = pagemediagallery.ui.FileUploading.instances[i].file.name;
			// this fix issue with filename with space : change them to '_' :
			initName = initName.replace(/[^A-Za-z0-9\-_\.:]+/g,"_");
			//initName =  mw.util.wikiUrlencode(initName);
			
			if (file.name.indexOf(initName, file.name.length - initName.length) !== -1) {
			//if (pagemediagallery.ui.FileUploading.instances[i].file.name == file.name) {

				var result = false;
				try{
					if(success) {
						$.parseJSON( success.response );
						if ( result.error ) {
							pagemediagallery.ui.FileUploading.instances[i].cancelUpload(file);
						} else {
							pagemediagallery.ui.FileUploading.instances[i].confirmUpload(file);
						}
					} else {
						pagemediagallery.ui.FileUploading.instances[i].confirmUpload(file);
					}
					
				} catch ( e) {
					pagemediagallery.ui.FileUploading.instances[i].cancelUpload(file);
				}
			}
		}
	}

	/**
	 * static method to remove file from queue when thumb of uploading image is removed from secondary gallery
	 */
	pagemediagallery.ui.FileUploading.onFileRemove = function (filename) {
		for (var i = 0; i < pagemediagallery.ui.FileUploading.instances.length; i++) {
			// here, in case of multiple file upload,
			// I cannot find an exact condition to find if the uploaded file match the one for this object
			var initName = pagemediagallery.ui.FileUploading.instances[i].file.name;
			// this fix issue with filename with space : change them to '_' :
			initName = initName.replace(/[^A-Za-z0-9\-_\.:]+/g,"_");

			if (filename.indexOf(initName, filename.length - initName.length) !== -1) {
				pagemediagallery.ui.FileUploading.instances.splice(i, 1);
			}
		}
	}


}( jQuery, mediaWiki, pagemediagallery, plupload ) );

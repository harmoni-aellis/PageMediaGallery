
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
		var img = file.li.find('img.file-thumb');
		if ( img.length == 0) {
			img = file.li.find('video.file-thumb');
		}
		this.secondaryGallery.addImage(img.clone(), file.name, this.tempImage);
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

	pagemediagallery.ui.FileUploading.prototype.cancelUpload = function (  ) {

	};

	/**
	 * static method to listen FileAdded event and call updateFileTempImage on corresponding items
	 */
	pagemediagallery.ui.FileUploading.onFilesAdded = function (uploader, files) {
		for (var a = 0; a < files.length; a++) {
			var file = files[a];
			for (var i = 0; i < pagemediagallery.ui.FileUploading.instances.length; i++) {
				// here, in case of multiple file upload,
				// I cannot find an exact condition to find if the uploaded file match the one for this object
				var initName = pagemediagallery.ui.FileUploading.instances[i].file.name;
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
		if(success) {
			for (var i = 0; i < pagemediagallery.ui.FileUploading.instances.length; i++) {
				// here, in case of multiple file upload,
				// I cannot find an exact condition to find if the uploaded file match the one for this object
				var initName = pagemediagallery.ui.FileUploading.instances[i].file.name;
				// this fix issue with filename with space : change them to '_' :
				initName = initName.replace(/[^A-Za-z0-9\-_\.:]+/g,"_");
				//initName =  mw.util.wikiUrlencode(initName);
				
				if (file.name.indexOf(initName, file.name.length - initName.length) !== -1) {
				//if (pagemediagallery.ui.FileUploading.instances[i].file.name == file.name) {
					pagemediagallery.ui.FileUploading.instances[i].confirmUpload(file);
				}
			}
		}
	}


}( jQuery, mediaWiki, pagemediagallery, plupload ) );

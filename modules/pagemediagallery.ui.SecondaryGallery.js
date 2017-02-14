
pagemediagallery.ui = pagemediagallery.ui || {};

( function ( $, mw, pagemediagallery ) {
	'use strict';
	
	/**
	 * SecondaryGallery class
	 * create html linked to form input to create a secondary gallery on inputs, linked to the PrimaryGallery for Upload and drag/drop
	 * container node should be the one with class .msuploadContainer
 	 *
	 * @param container node
	 * @constructor
	 */
	pagemediagallery.ui.SecondaryGallery = function ( container, primaryGallery ) {
		
		var secondaryGallery = this;
		
		this.primaryGallery = primaryGallery;
		this.$container = container;
		
		//file to be uploaded
		this.filesUploading = [];
		
		if ($(this.$container).find('.formmediagallery').length > 0) {
			return ;
		}
		// hide all inputs in container
		$(this.$container).children().hide();

		// replace by formmediagallery list 
		this.ol = $('<div>').addClass('formmediagallery');
		this.ol.append($('<ul>'));
		$(this.$container).prepend(this.ol);
		
		this.addUploadButton();
		
		// add image present in inputs
		$(this.$container).find('input.createboxInput').each(function (i) {
			if ($(this).val()) {
				var image = $(this).parentsUntil('div').nextAll('.pfImagePreviewWrapper').find('img,video').first();
				secondaryGallery.addThumb( image.clone(), $(this).val());
			}
		});
		this.manageDropOnFormField();
	};
	
	pagemediagallery.ui.SecondaryGallery.prototype.addUploadButton = function() {
		var secondaryGallery = this;
		// add upload button
		this.uploadButton = $('<a>'+ mw.msg( 'msu-upload-all' )+'</a>').addClass('uploadButton');
		
		this.uploadButton.click(function() {
			$(this).addClass('loading');
			secondaryGallery.primaryGallery.startUpload();
			return false;
		});
		this.uploadButton.hide();
		
		
		this.selectFileButton = $('<div>').addClass('select-file');
		
		this.selectFileButton.click(function () {
			
		});

		
		this.buttonbar = $('<div>').addClass('buttonBar');
		this.buttonbar.append(this.uploadButton);
		this.buttonbar.append(this.selectFileButton);
		$(this.$container).append(this.buttonbar);
		
		this.addBrowseButton();
	}
	pagemediagallery.ui.SecondaryGallery.prototype.addFileToUpload = function (file) {
		this.filesUploading.push( new pagemediagallery.ui.FileUploading(file,this));
	}
	
	pagemediagallery.ui.SecondaryGallery.prototype.addBrowseButton = function() {
		var secondaryGallery = this;
		var fileInput = new mOxie.FileInput({
			browse_button: this.selectFileButton[ 0 ], // or document.getElementById('file-picker')
			container: this.$container[ 0 ],
			multiple: true // allow multiple file selection
		});

		fileInput.onchange = function(e) {
			// do something to files array
			console.info(e.target.files); // or this.files or fileInput.files
			for (var index = 0; index < e.target.files.length; ++index) {
				// add file to be uploaded in mediaGallery
				secondaryGallery.addFileToUpload(e.target.files[index]);
			}
			
		};

		fileInput.init();
	}

	pagemediagallery.ui.SecondaryGallery.prototype.addThumb = function ( img, filename, isTemp = false, tempToReplace = false ) {
		var li;
		
		if (tempToReplace && tempToReplace.parent('li').length == 1) {
			li = tempToReplace.parent('li').empty().attr('class','').append(img);
		} else {
			li = $('<li>').attr('data-filename', filename).append(img);
		}
		var secondaryGallery = this;
		
		var cancelbutton = $( '<span>' ).attr({ 'class': 'file-cancel', 'title': mw.msg( 'msu-cancel-upload' ) });
		cancelbutton.click( function () {
			secondaryGallery.removeImg( this );
		});
		li.prepend( cancelbutton );
		
		if (isTemp) {
			li.addClass('fileToBeUpload');
		}
		
		$(this.$container).find('.formmediagallery ul').append(li);
	};
	
	
	
	pagemediagallery.ui.SecondaryGallery.prototype.removeImg = function ( closeButton ) {
		
		var filename = $(closeButton).parent('li').attr('data-filename');
		$(closeButton).parent('li').remove();
		if (filename) {
			var inputs = $(this.$container).find('input.createboxInput');
			if (inputs.length == 0) {
				return;
			}
			inputs = inputs.filter(function() { 
				return this.value == filename; 
			});
			if (inputs.length > 0) {
				// remove filename from input
				inputs.first().val('');
			} 
		}
	};
	

	/**
	 * this function automaticaly add image to forminputs included in container div
	 * if all inputs are allready filled, it mark file as error, because not possible to add more
	 * if there is no input in container div, , no check , just return OK (case of page gallery)
	 * 
	 *  @param String filename filename to add
	 */
	pagemediagallery.ui.SecondaryGallery.prototype.addImageToFormsInputs = function ( filename ) {
		
		var inputs = $(this.$container).find('input.createboxInput');
		
		if (inputs.length == 0) {
			return true;
		}
		
		var emptiesInputs = inputs.filter(function() { 
			return this.value == "" || this.value == 'No-image-yet.jpg'; 
		});
		
		if (emptiesInputs.length > 0) {
			// if we get an input with no value, we add filename to it
			emptiesInputs.first().val(filename);
		} else {
			$('<span>').html( mw.msg( 'msu-upload-nbfile-exceed' )).appendTo($(this.$container));
			return false;
		}
		return true;
	};


	/**
	 * add an image to the secondary gallery
	 * 
	 *  @param String filename filename to add
	 */
	pagemediagallery.ui.SecondaryGallery.prototype.addImage = function ( img, filename, tempToReplace) {
		
		var result = this.addImageToFormsInputs(filename);
		
		if ( result) { 
			this.addThumb(img, filename, false, tempToReplace);
		} 
		// TODO : manage error if too many files
		this.uploadButton.hide();

	};

	/**
	 * add temporary image to the secondary gallery 
	 * (image of file to be uploaded)
	 * 
	 *  @param String filename filename to add
	 */
	pagemediagallery.ui.SecondaryGallery.prototype.addTempImage = function ( img, filename) {
		this.addThumb(img, filename, true);

		this.uploadButton.show();
		this.uploadButton.removeClass('loading');
	};
	

	pagemediagallery.ui.SecondaryGallery.prototype.affFileFromGallery = function( draggedObject) {
		var image = draggedObject.find('img').clone();
		if (image.length == 0 && draggedObject.find('video').length > 0) {
			image = draggedObject.find('video').clone();
		}
		var filename = draggedObject.attr('data-filename');
		if (!filename) {
			filename = draggedObject.find('.file-name').first().text();
		}
		this.addImage(image, filename);

		// trick to hide the 'revert' movement of the image back to the gallery
		$('.ui-draggable-dragging').hide();
	};
	

	
	pagemediagallery.ui.SecondaryGallery.prototype.affFilesToLoad = function( files) {
		for (var index = 0; index < files.length; ++index) {
			// add file to be uploaded in mediaGallery
			this.addFileToUpload(files[index]);
		}
	}
	
	
	pagemediagallery.ui.SecondaryGallery.prototype.manageDropOnFormField = function () {

		var secondaryGallery = this;
		var target = $(this.$container);
		
		target.css('border', '2px dotted #0B85A1');
		if(target.find('.dropHelp').length == 0) {
			target.append('<span class="dropHelp">'+mw.msg( 'msu-dropzone' )+'</span>');
		}
		target.off( "dragenter").on('dragenter', function (e) 
				{
				    e.stopPropagation();
				    e.preventDefault();
				    $(this).css('border', '2px solid #0B85A1');
				});
		target.off( "dragleave").on('dragleave', function (e) 
				{
				    e.stopPropagation();
				    e.preventDefault();
				    $(this).css('border', '2px dotted #0B85A1');
				});
		target.off( "dragover").on('dragover', function (e) 
		{
		     e.stopPropagation();
		     e.preventDefault();
		});
		

		// accept items match file uploads from filesystem
		target.off( "drop").on('drop', function (e) 
		{
			if (!e.originalEvent.dataTransfer) {
				return;
			}
			e.stopPropagation();
			e.preventDefault();

			$(this).css('border', '2px dotted #0B85A1');
			secondaryGallery.primaryGallery.open();
			
			var files = e.originalEvent.dataTransfer.files;
			secondaryGallery.affFilesToLoad(files);
			
			// uploader.start();
			secondaryGallery.primaryGallery.onRefresh();

		});
		
		// accept drop item from Primary gallery
		target.droppable({
		      accept: ".msupload-list > li",
		      classes: {
		        "ui-droppable-active": "ui-state-default",
		        "ui-droppable-hover": "ui-state-hover"
		      },
		      drop: function( event, ui ) {
		    	  secondaryGallery.affFileFromGallery(ui.draggable);
		      }
		    });
		
		// avoid opening file when drop outside of areas :
		$(document).on('drop', function (e) 
				{
				    e.stopPropagation();
				    e.preventDefault();
				});
		
	}
	
	
	
}( jQuery, mediaWiki, pagemediagallery ) );
		
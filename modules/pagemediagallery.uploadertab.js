mediaWiki.pagemediagallery = mediaWiki.pagemediagallery || {};

( function ( $, mw, window, MsUpload ) {

	mw.pagemediagallery.uploadertab = function() {
		this.uploader = null;
	}

	mw.pagemediagallery.uploadertab.prototype.initcallMsUpload = function() {

		this.uploader = MsUpload.createUploaderOnElement($('#MsUpload'), true);

		var dropzone = $( '#'+ this.uploader.uploaderId + '-dropzone' );

		//target.css('border', '2px dotted var(--main-btn-color)');
		dropzone.addClass('dropOverInactive');

		dropzone.off( "dragenter").on('dragenter', function (e)
		{
		    e.stopPropagation();
		    e.preventDefault();
			$(this).addClass('dropOverActive');
			$(this).removeClass('dropOverInactive');
		});
		dropzone.off( "dragleave").on('dragleave', function (e)
		{
		    e.stopPropagation();
		    e.preventDefault();
		    $(this).removeClass('dropOverActive');
			$(this).addClass('dropOverInactive');
		});
		dropzone.off( "dragover").on('dragover', function (e)
		{
		    e.stopPropagation();
		    e.preventDefault();
		    $(this).addClass('dropOverActive');
		    $(this).removeClass('dropOverInactive');
		});

		dropzone.off("drop").on("drop", function() {
			$(this).removeClass('dropOverActive');
			$(this).addClass('dropOverInactive');
		});

		this.uploader.bind('FileUploaded', this.onFileUploaded);

		// overrides MsUpload's warningText method
		MsUpload.warningText = function ( fileItem, warning, uploader ) {

			switch ( warning ) {
				case '':
				case '&nbsp;':
				case '&#160;':
					$( fileItem.warning ).empty()
						.siblings( '.file-name' ).show()
						.siblings( '.file-name-input' ).hide()
						.siblings( '.file-extension' ).hide();
					break;

				case 'Error: Unknown result from API':
				case 'Error: Request failed':
					$( fileItem.warning ).text( warning );
					break;

				default:
					// IMPORTANT! The code below assumes that every warning not captured by the code above is about a file being replaced
					$( fileItem.warning ).html( warning );

					// We break when the particula warning when a file name starts with IMG
					if ( warning.indexOf( 'The name of the file you are uploading begins with' ) === 0 ) {
						break; // When the file name starts with "IMG", MediaWiki issues this warning. Display it and continue.
					}
					if ( warning.indexOf( 'Der Dateiname beginnt mit' ) === 0 ) {
						break; // Make it work for German too. Must be done this way because the error response doesn't include an error code.
					}

					// When hovering over the link to the file about to be replaced, show the thumbnail
					// $( fileItem.warning ).find( 'a' ).mouseover( function () {
					// 	$( fileItem.warning ).find( 'div.thumb' ).show();
					// }).mouseout( function () {
					// 	$( fileItem.warning ).find( 'div.thumb' ).hide();
					// });

					$( fileItem.warning ).find('.mw-selflink.selflink').attr({ href: $( fileItem.warning ).find( '.image' ).attr('href'), target: "_blank"});

					// If a file with the same name already exists, add a checkbox to confirm the replacement
					if ( window.msuVars.confirmReplace ) {

						MsUpload.unconfirmedReplacements++;

						var title = $( fileItem.warning ).siblings( '.file-name' );

						var checkbox = $( '<input>' ).attr( 'type', 'checkbox' ).click( function ( event ) {
							if ( $( this ).is( ':checked' ) ) {
								title.show().next().hide();
								MsUpload.unconfirmedReplacements--;
							} else {
								title.hide().next().show().select();
								MsUpload.unconfirmedReplacements++;
							}
							uploader.trigger( 'CheckFiles' );
						});
						$( '<label>' ).append( checkbox ).append( mw.msg( 'msu-replace-file' ) ).appendTo( fileItem.warning );
					}
					break;
			}
			this.uploader.trigger( 'CheckFiles' );
			fileItem.loading.hide();
		}
	}

	mw.pagemediagallery.uploadertab.prototype.onFileUploaded = function ( uploader, file, success ) {

		uploadertab = this;

		$(file.li[0]).addClass('image');
		$(file.li[0]).on('click', function(){
			MediaManager.window.$modal.find('.image').not($(this)).removeClass('toAddToPage');
			$(this).toggleClass('toAddToPage');
			if ($(this).hasClass('toAddToPage')) {
				$("#addToPage").prop( "disabled", false );
			} else {
				$("#addToPage").prop( "disabled", true );
			}
		});
		$( '#'+ uploader.uploaderId + '-bottom' ).hide(); //doesn't work
	}

	mw.pagemediagallery.uploadertab.prototype.init = function () {

		uploadertab = this;
		setTimeout(function () {
		  uploadertab.initcallMsUpload();
		}, 300);
	}

	mw.pagemediagallery.uploadertab.prototype.startUpload = function() {
		this.uploader.start();
	}

})( jQuery, mediaWiki, window, MsUpload);
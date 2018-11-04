window.MediaManager = {

	container: undefined, //secondaryGallery
	isInit: false,
	start: function (container) {
		MediaManager.container = container;

		if (!MediaManager.isInit) {
			this.init();
		}

		MediaManager.reset();

		MediaManager.window.open();
	},
	reset: function (){
		MediaManager.window.$modal.find('.image').removeClass('toAddToPage');
		$("#addToPage").prop('disabled', true);
		$("a[href=#search]").click();
		$("[id^=msupload][id$=list]").html("");

		MediaManager.browser.init();

	},
	init: function (){

		mediamanager = this;

		MediaManager.browser.init();
		MediaManager.uploader.init();

		$("#addToPage").off().on('click', function() {
			MediaManager.addToPage();
		});

		MediaManager.isInit = true;
	},
	addToPage: function (){
		var $toAddToPage = $(MediaManager.window.$modal.find('.toAddToPage')[0]);
		var file = $($toAddToPage.find('img')[0]).clone();
		var fileName = '';
		if ($toAddToPage[0].hasAttribute('data-imagename')) {
			fileName = $toAddToPage.data('imagename');
		} else { //uploaded with MsUpload
			fileName = $toAddToPage.find('.file-name').first().text();
		}

		mediamanager.container.addImage(file, fileName);
		mediamanager.close();
	},
	close: function () {
		MediaManager.window.close();
	}
}

window.MediaManager.window = {

	$modal: $('#MediaManager'),
	open: function () {
		MediaManager.window.$modal.modal('show');
	},
	close: function () {
		MediaManager.window.$modal.modal('hide');
	}
}

window.MediaManager.browser = {

	requestRunning: false,
	init: function() {
		browser = this;

		$('#querymedia-input').on('input', function (e) {
			browser.browse( e.target.value );
		});

		browser.browse( $('#querymedia-input')[0].value );
	},
	/**
	 * @param {string} input - The input provided by the user.
	 * @param {string|integer} offset - Value from which to get the next matches (if any).
	 */
	browse: function(input, offset) {

		var browser = this;

		browser.requestRunning = true;

		// first request to get token
		$.ajax({
			type: "GET",
			url: mw.util.wikiScript('api'),
			data: { action:'query', format:'json',  meta: 'tokens', type:'csrf'},
		    dataType: 'json',
		    success: browse
		});

		// function to do second request to execute follow action
		function browse(jsondata) {

			var token = jsondata.query.tokens.csrftoken;
			var data = {};
			data.action = "pagemediagallery_browse";
			data.format = "json";
			data.input = input;
			data.token = token;
			if (offset) {
				data.offset = offset;
			}

			$.ajax({ 
				type: "POST",
				url: mw.util.wikiScript('api'),
				data: data,
			    dataType: 'json',
				success: function ( result ) {
					if ( result && result.pagemediagallery_browse ) {
						var results = result.pagemediagallery_browse;

						if (!offset) { //if offset, we append the results to the content
							MediaManager.window.$modal.find('.search-content-body').html('');
						}

						if ( results.search ) {
							$.each( results.search, function ( index, value ) {
								var $div = $( document.createElement('div') );
								$div.addClass( 'image' );
								$div.attr('data-imagename', value.filename);
								var $img = $( document.createElement('img') );
								$img.attr('src', value.fileurl);
								var $label = $( document.createElement('label') );
								$label.html(value.filename);
								$div.append($img);
								$div.append($label);
								$div.on('click', function() {
									$(this).toggleClass( 'toAddToPage' );
									if ($(this).hasClass('toAddToPage')) {
										$("#addToPage").prop( "disabled", false );
									} else {
										$("#addToPage").prop( "disabled", true );
									}
									MediaManager.window.$modal.find( '.image' ).not($(this)).removeClass('toAddToPage');
								});
								MediaManager.window.$modal.find('.search-content-body').append($div);
							});
						}

						if ( results.continue && results.continue.offset ) {


							MediaManager.window.$modal.find('.search-content').data('offset', results.continue.offset );		

							$searchcontent = MediaManager.window.$modal.find('.search-content');
							$searchcontentbody = MediaManager.window.$modal.find('.search-content-body');
							$searchcontent.off().scroll(function() {

							    if( parseInt( $searchcontent.scrollTop() + $searchcontent.height() ) == parseInt( $searchcontentbody.outerHeight( true ) + $( '#load-more-content' ).outerHeight( true ) ) ) {

							    	$( '#load-more-content-spinner' ).show();

							    		var offset = MediaManager.window.$modal.find('.search-content').data('offset');

										if (typeof offset == 'string') {
											//API:allimages returns something like 20180927124202|Trgrol_kk.jpg
											offset = String(offset).split("|")[0];
										}

										MediaManager.browser.browse(input, offset);

										$( '#load-more-content-spinner' ).hide();
							    }
							});
						} else {
							$searchcontent = MediaManager.window.$modal.find('.search-content');
							$searchcontent.off();
						}

					}else {
						MediaManager.window.$modal.find('.search-content-body').html( mw.message('pmg-no-match-found') );
					}
				}, error: function () {
					console.log( mw.message('pmg-error-encountered') );
				}
			});
		};
	}
}

window.MediaManager.uploader = {

	initcallMsUpload: function() {

		this.uploader = MsUpload.createUploaderOnElement($('#MsUpload'), true);
		this.uploader.mediaManagerUploader = this;

		console.log("this.uploader");
		console.log(this.uploader);

		this.uploader.bind('FileUploaded', MediaManager.uploader.onFileUploaded);

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
					$( fileItem.warning ).find( 'a' ).mouseover( function () {
						$( fileItem.warning ).find( 'div.thumb' ).show();
					}).mouseout( function () {
						$( fileItem.warning ).find( 'div.thumb' ).hide();
					});

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
			uploader.trigger( 'CheckFiles' );
			fileItem.loading.hide();
		}
	},
	onFileUploaded: function ( uploader, file, success ) {
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
	},
	init: function () {
		var mediaManagerUploader = this;

		setTimeout(function () {
		  mediaManagerUploader.initcallMsUpload();
		}, 300);
	},
	startUpload: function() {
		this.uploader.start();
	}
}
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

	init: function() {
		browser = this;

		var data = {
			ailimit: '5',
			aiprop: 'url',
			aisort: 'timestamp',
			aidir: 'descending'
		};

		function doQuery(e) {

			if ( e.value !== '' ) {
				data = {
					ailimit: '5',
					aiprop: 'url'
				};
			} else {
				data = {
					ailimit: '5',
					aiprop: 'url',
					aisort: 'timestamp',
					aidir: 'descending'
				};
			}

			if ($('#linkedToPageCheck').is(':checked')) {
				data['aiprefix'] = mw.config.get('wgPageName').replace(/(.*)\//g,"").replace(":","-") + '_' + e.value;
			} else {
				if (e.value !== '') {
					data['aiprefix'] = e.value;
				}
			}

			browser.queryMedia( data );
		}

		$('#querymedia-input').on('input', function (e) {
			doQuery(e.target);
		});

		$('#linkedToPageCheck').off().on('click', function(){
			doQuery($('#querymedia-input')[0]);
		});

		MediaManager.window.$modal.on('browser:contentChanged', function () {
			$modal = $(this);
			$(this).find( '.image' ).on('click', function() {
				$(this).toggleClass( 'toAddToPage' );
				if ($(this).hasClass('toAddToPage')) {
					$("#addToPage").prop( "disabled", false );
				} else {
					$("#addToPage").prop( "disabled", true );
				}
				$modal.find( '.image' ).not($(this)).removeClass('toAddToPage');
			});
		});

		doQuery($('#querymedia-input')[0]);
	},
	/**
	 * @arg args key-value array arguments for the query to the AllImages API
	 * @arg loadMore bool content will not be erased before new content
	 */
	queryMedia: function(args, loadMore) {

		var browser = this;

		// first request to get token
		$.ajax({
			type: "GET",
			url: mw.util.wikiScript('api'),
			data: { action:'query', format:'json',  meta: 'tokens', type:'csrf'},
		    dataType: 'json',
		    success: queryMedia
		});

		// function to do second request to execute follow action
		function queryMedia(jsondata) {
			console.log('queryMedia');
			var token = jsondata.query.tokens.csrftoken;
			var data = {
				format: 'json',
				action: 'query',
				list: 'allimages'
			};

			for (var arg in args){
			    if (args.hasOwnProperty(arg)) {
			    	data[arg] = args[arg];
			    }
			}
			$.ajax({ url: mw.util.wikiScript( 'api' ), dataType: 'json', type: 'POST',
				data: data,
				success: function ( result ) {
					console.log(result);
					if ( result && result.query && result.query.allimages ) {
						var allimages = result.query.allimages;

						if (!loadMore) {
							MediaManager.window.$modal.find('.search-content').html('');
						}

						$.each( allimages, function ( index, value ) {
							var $div = $( document.createElement('div') );
							$div.addClass( 'image' );
							$div.attr('data-imagename', value.name);
							var $img = $( document.createElement('img') );
							$img.attr('src', value.url);
							var $label = $( document.createElement('label') );
							$label.html(value.name);
							$div.append($img);
							$div.append($label);
							MediaManager.window.$modal.find('.search-content').append($div);
						});

						if (result.continue) {

							var $button = $( document.createElement('button') );
							$button.html('Load more');
							$button.attr('type', 'button');
							$button.attr('id', 'loadMoreImages');
							MediaManager.window.$modal.find('.search-content').append($button);

							$('#loadMoreImages').on('click', function(){
								console.log('hello');
								console.log(args);
								if (args.hasOwnProperty('aisort') && args['aisort'] == 'timestamp') {
									args['aistart'] = result.continue.aicontinue.substr(0, result.continue.aicontinue.indexOf('|'));
								}else {
									args['aifrom'] = result.continue.aicontinue;
								}
								
								$('#loadMoreImages').remove();
								MediaManager.browser.queryMedia(args, true);
							});
						}

						MediaManager.window.$modal.trigger('browser:contentChanged');
					}
				}, error: function () {
					//MsUpload.warningText( fileItem, 'Error: Request failed', uploader );
				}
			});
		};
	}
	// /**
	//  * @arg args key-value array arguments for the query to the AllImages API
	//  * @arg loadMore bool content will not be erased before new content
	//  */
	// queryMedia: function(args, loadMore) {

	// 	var browser = this;

	// 	// first request to get token
	// 	$.ajax({
	// 		type: "GET",
	// 		url: mw.util.wikiScript('api'),
	// 		data: { action:'query', format:'json',  meta: 'tokens', type:'csrf'},
	// 	    dataType: 'json',
	// 	    success: queryMedia
	// 	});

	// 	// function to do second request to execute follow action
	// 	function queryMedia(jsondata) {
	// 		console.log('queryMedia');
	// 		var token = jsondata.query.tokens.csrftoken;
	// 		var data = {
	// 			format: 'json',
	// 			action: 'query',
	// 			list: 'search',
	// 			srsearch: 'tutorial',
	// 			srnamespace: 6
	// 		};

	// 		// for (var arg in args){
	// 		//     if (args.hasOwnProperty(arg)) {
	// 		//     	data[arg] = args[arg];
	// 		//     }
	// 		// }
	// 		$.ajax({ url: mw.util.wikiScript( 'api' ), dataType: 'json', type: 'POST',
	// 			data: data,
	// 			success: function ( result ) {
	// 				console.log(result);
	// 				if ( result && result.query && result.query.search ) {
	// 					var searchResults = result.query.search;

	// 					if (!loadMore) {
	// 						MediaManager.window.$modal.find('.search-content').html('');
	// 					}

	// 					$.each( searchResults, function ( index, value ) {
	// 						var file = wfLocalFile(Title::newFromText(value.title));
	// 						console.log(file);
	// 						// var $div = $( document.createElement('div') );
	// 						// $div.addClass( 'image' );
	// 						// $div.attr('data-imagename', value.name);
	// 						// var $img = $( document.createElement('img') );
	// 						// $img.attr('src', value.url);
	// 						// var $label = $( document.createElement('label') );
	// 						// $label.html(value.name);
	// 						// $div.append($img);
	// 						// $div.append($label);
	// 						// MediaManager.window.$modal.find('.search-content').append($div);
	// 					});

	// 					// if (result.continue) {

	// 					// 	var $button = $( document.createElement('button') );
	// 					// 	$button.html('Load more');
	// 					// 	$button.attr('type', 'button');
	// 					// 	$button.attr('id', 'loadMoreImages');
	// 					// 	MediaManager.window.$modal.find('.search-content').append($button);
	// 					// 	$('#loadMoreImages').on('click', function(){
	// 					// 		console.log('hello');
	// 					// 		console.log(args);
	// 					// 		if (args.hasOwnProperty('aisort') && args['aisort'] == 'timestamp') {
	// 					// 			args['aistart'] = result.continue.aicontinue.substr(0, result.continue.aicontinue.indexOf('|'));
	// 					// 		}else {
	// 					// 			args['aifrom'] = result.continue.aicontinue;
	// 					// 		}
								
	// 					// 		$('#loadMoreImages').remove();
	// 					// 		MediaManager.browser.queryMedia(args, true);
	// 					// 	});
	// 					// }

	// 					// MediaManager.window.$modal.trigger('browser:contentChanged');
	// 				}
	// 				console.log(result);
	// 			}, error: function () {
	// 				//MsUpload.warningText( fileItem, 'Error: Request failed', uploader );
	// 			}
	// 		});
	// 	};
	// }
}

window.MediaManager.uploader = {

	initcallMsUpload: function() {

		this.uploader = MsUpload.createUploaderOnElement($('#MsUpload'), true);
		this.uploader.mediaManagerUploader = this;

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
var pageMediaGallery, formGallery;

formGallery = {
		
	removeImg: function (closeButton){
		$(closeButton).parent('li').remove();
		filename = $(closeButton).parent('li').attr('data-filename');
		if (filename) {
			var inputs = $(container ).find('input.createboxInput');
			
			if (inputs.length == 0) {
				return;
			}
			
			inputs = inputs.filter(function() { 
				return this.value == filename; 
			});
			
			
			
			if (emptiesInputs.length > 0) {
				// remove filename from input
				emptiesInputs.first().val('');
			} 
		}
	},

	addThumb: function(container, img, filename) {
		li = $('<li>').attr('data-filename', filename).append(img);
		
		var cancelbutton = $( '<span>' ).attr({ 'class': 'file-cancel', 'title': mw.msg( 'msu-cancel-upload' ) });
		cancelbutton.click( function () {
			formGallery.removeImg( this );
		});
		li.prepend( cancelbutton );
		
		//li.append('<span class="file-cancel" title="<msu-remove-image>"></span>');
		
		$(container).find('.formmediagallery').append(li);
	},
	addImageToFormsInputs: function (container, filename) {
		
		// this function automaticaly add image to forminputs included in container div
		// if all inputs are allready filled, it mark file as error, because not possible to add more
		// if there is no input in container div, , no check , just return OK (case of page gallery)
		
		// file.name : nom du fichier à ajouter :
		
		var inputs = $(container ).find('input.createboxInput');
		
		if (inputs.length == 0) {
			return true;
		}
		
		emptiesInputs = inputs.filter(function() { 
			return this.value == "" || this.value == 'No-image-yet.jpg'; 
		});
		
		
		
		if (emptiesInputs.length > 0) {
			// if we get an input with no value, we add filename to it
			emptiesInputs.first().val(filename);
		} else {
			$('<span>').html( mw.msg( 'msu-upload-nbfile-exceed' )).appendTo(container);
			return false;
		}
		return true;
	},
	addImage: function(container, img, filename) {
		
		result = formGallery.addImageToFormsInputs(container,filename);
		
		if ( result) { 
			formGallery.addThumb(container, img, filename);
		}
		// TODO : add image name to form input
		// TODO : manage error if too many files
	},
	init: function () {
		$(".msuploadContainer").each(function (i) {
			container = this;
			$(this).children().hide();
			ol = $('<ul>').addClass('formmediagallery');
			$(this).prepend(ol);
			$(this).find('input').each(function (i) {
				if ($(this).val()) {
					var image = $(this).parentsUntil('div').nextAll('.sfImagePreviewWrapper').find('img').first();
					formGallery.addThumb(container, image.clone(), $(this).val());
				}
			});
		});
	}
}

/**
 * this manage the gallery of image, 
 * feature :
 *  we we can drop image from disk to upload it
 *  we ca drag an image to a formgallery, to add it in a form input
 */
pageMediaGallery = {

	open: function() {
		$('#PageGallery').width(250);
		$('body').css('marginLeft','250px');
	},
	close: function() {
		$('#PageGallery').width(0);
		$('body').css('marginLeft','0px');
	},
	
	initDraggaBleBehaviour() {
		
	    var $gallery = $( ".msupload-list" ),
	     $trash = $( ".msuploadContainer" );
		
	    // Let the gallery items be draggable
	    $( "li", $gallery ).draggable({
	      cancel: "a.ui-icon", // clicking an icon won't initiate dragging
	      revert: true, // when not dropped, the item will revert back to its initial position
	      containment: "document",
	      helper: "clone",
	      cursor: "move",
	      start: function() {
	          $(".msuploadContainer").addClass('ui-droppable-active');
	      },
	      stop: function() {
	          $(".ui-droppable-active").removeClass('ui-droppable-active');
	      }
	    });
		
	    // Let the trash be droppable, accepting the gallery items
	    $trash.droppable({
	      accept: ".msupload-list > li",
	      classes: {
	        "ui-droppable-active": "ui-state-default",
	        "ui-droppable-hover": "ui-state-hover"
	      },
	      drop: function( event, ui ) {
	    	  var image = ui.draggable.find('img').clone();
	    	  var filename = ui.draggable.attr('data-filename');
	    	  formGallery.addImage(this, image, filename );
	    	  
	    	  // trick to hide the 'revert' movement of the image back to the gallery
	    	  $('.ui-draggable-dragging').hide();
	      }
	    });
		/*var i, $this, $log = $('#log');
		 
		
	    $('#PageGallery li').on({
	        // on commence le drag
	        dragstart: function(e) {
	            $this = $(this);
	 
	            i = $this.index();
	            $this.css('opacity', '0.5');
	 
	            // on garde le texte en mémoire (A, B, C ou D)
	            e.dataTransfer.setData('text', $this.text());
	        },
	        // on passe sur un élément draggable
	        dragenter: function(e) {
	            // on augmente la taille pour montrer le draggable
	            $(this).animate({
	                width: '90px'
	            }, 'fast');
	 
	            e.preventDefault();
	        },
	        // on quitte un élément draggable
	        dragleave: function() {
	            // on remet la taille par défaut
	            $(this).animate({
	                width: '75px'
	            }, 'fast');
	        },
	        // déclenché tant qu on a pas lâché l élément
	        dragover: function(e) {
	            e.preventDefault();
	        },
	        // on lâche l élément
	        drop: function(e) {
	            // si l élément sur lequel on drop n'est pas l'élément de départ
	            if (i !== $(this).index()) {
	                // on récupère le texte initial
	                var data = e.dataTransfer.getData('text');
	 
	                // on log
	                $log.html(data + ' > ' + $(this).text()).fadeIn('slow').delay(1000).fadeOut();
	 
	                // on met le nouveau texte à la place de l ancien et inversement
	                $this.text($(this).text());
	                $(this).text(data);
	            }
	 
	            // on remet la taille par défaut
	            $(this).animate({
	                width: '75px'
	            }, 'fast');
	        },
	        // fin du drag (même sans drop)
	        dragend: function() {
	            $(this).css('opacity', '1');
	        },
	        // au clic sur un élément
	        click: function() {
	            alert($(this).text());
	        }
	    });*/
		
		/*
		MsUpload.dropableAreaCount ++;
		var areaId = 'msupload-drop-' + MsUpload.dropableAreaCount ;
		var picturesList = $( '<ol>' ).attr( 'class', 'msupload-dropableImgList ' ).attr('data-target','#myCarousel1');

		picturesList.attr('id', areaId);
		$(msUploadContainer).prepend(picturesList);

		var p = $( '<img>' ).attr( 'src', 'http://wikifab-build.localtest.me/skins/wikifabStyleModule/wiki.png' );
		var pI = $( '<li>' ).attr( 'class', 'msupload-dropableImgItem' ).append(p);
		picturesList.append(pI);
		var p2 = $( '<img>' ).attr( 'src', 'http://wikifab-build.localtest.me/skins/wikifabStyleModule/wiki.png' );
		var pI2 = $( '<li>' ).attr( 'class', 'msupload-dropableImgItem' ).append(p2);
		picturesList.append(pI2);

	    $("#" + areaId).sortable({
			revert : true
		});
		$("#" + areaId + " ul").draggable({
			connectToSortable : "#" + areaId,
			helper : "clone",
			revert : "invalid"
		});
		$("#" + areaId + " ul").draggable({
			connectToSortable : ".msupload-list",
			helper : "clone",
			revert : "invalid"
		});
		$("ul, li").disableSelection();
		*/
		
	},
	
	
	callMsUpload() {
		uploader = MsUpload.createUploaderOnElement($('#PageGallery'), true);
		MsUpload.initWithImgElement(uploader);
	},
	init: function () {
		//var openlink = $( '<a>Open</a>' ).click(pageMediaGallery.callMsUpload);
		
		//alert(openlink);
		//$('#PageGallery').prepend(openlink)
		pageMediaGallery.open();
		setTimeout(pageMediaGallery.callMsUpload, 300);
		setTimeout(pageMediaGallery.initDraggaBleBehaviour, 600);
	}
};

$( pageMediaGallery.init );
$( formGallery.init );





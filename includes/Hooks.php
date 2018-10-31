<?php

namespace PageMediaGallery;

use GroupsPage\GroupsPageCore;
use PFFormEdit;

class Hooks {

	static public function onExtensionLoad() {

	}

	static function addToForm($text) {

		static $isStarted = false;
		if (!$isStarted) {
			self::start();
			$isStarted = true;
		}

	}
	static function start( $pFFormEdit) {
		global $wgOut, $wgScriptPath, $wgJsMimeType, $wgFileExtensions, $wgUser, $wgpmgEnabledForms;

		if($wgpmgEnabledForms && isset($pFFormEdit) && isset($pFFormEdit->mForm)) {

			if ( ! in_array($pFFormEdit->mForm, $wgpmgEnabledForms)) {
				// pagemediagallery is not enable for this form :
				return ;
			}
		} else if ($wgpmgEnabledForms && ! $pFFormEdit instanceof PFFormEdit) {
			// pagemediagallery not enable out of pageForms:
			return ;
		}




		$wgOut->addModules ( 'ext.pageMediaGallery' );
		$wgOut->addJsConfigVars ( array (
				'wgFileExtensions' => array_values ( array_unique ( $wgFileExtensions ) )
		) );

		$pmgVars = array (
				'scriptPath' => $wgScriptPath
		);

		$pmgVars = json_encode ( $pmgVars );

		if ($wgUser->getId ()) {
			$mediaManager = self::getModal();
			$wgOut->addHTML ( $mediaManager );
		}
		$wgOut->addScript ( "<script type=\"$wgJsMimeType\">window.pmgVars = $pmgVars;</script>\n" );

		return true;
	}

	private static function getModal() {

		global $wgOut;

		$out = '';

		$out .= '<div class="modal" id="MediaManager" tabindex="-1" role="dialog" role="document">';
		$out .=  '<div class="modal-dialog" role="document">';
		$out .=    '<div class="modal-content">';
		$out .=      '<div class="modal-header">';
		$out .=        '<button type="button" data-dismiss="modal" aria-label="Close">';
		$out .=          '<span>Annuler</span>';
		$out .=        '</button>';
		$out .=        '<h5 class="modal-title">Paramètres du média</h5>';
		$out .=        '<button type="button" id="addToPage" disabled>Insérer dans la page</button>';
		$out .=      '</div>';
		$out .=      '<ul class="nav nav-tabs" id="tabContent">';
		$out .=	      '<li class="active"><a href="#search" data-toggle="tab" role="tab" aria-controls="search" >Rechercher</a></li>';
		$out .=	      '<li><a href="#upload" role="tab" aria-controls="upload" data-toggle="tab">Téléverser</a></li>';
		$out .=	  '</ul>';
		$out .=      '<div class="tab-content">';
		$out .=       '<div class="tab-pane active" id="search">';
		$out .=	        '<div class="search-input">';
		$out .=	          '<input id="querymedia-input" class="oo-ui-dropdownWidget-handle" type="text">';
		$out .=           '<input type="checkbox" id="linkedToPageCheck" name="linkedToPage"> only files linked to this page';
		$out .=	        '</div>';
		$out .=	        '<div class="search-content">';
		$out .=	        	'Aucun résultat trouvé';
		$out .=	        '</div>';
		$out .=        '</div>';
		$out .=	      '<div class="tab-pane" id="upload">';
		$out .=	    	self::getMediaManagerUploaderContent( );
		$out .=	      '</div> ';
		$out .=	    '</div>';
		$out .=	  '</div>';
		$out .=    '</div>';
		$out .=  '</div>';
		$out .= '</div>';

		return $out;
	}

	static function getMediaManagerUploaderContent() {

		$out = '';
		$out .= '<div>';
		$out .=   '<div id="MediaManagerUploader">';
		$out .=     '<div id="MsUpload"></div>';
		$out .=   '</div>';
		$out .= '</div>';

		return $out;
	}

	public static function beforePageDisplay( $out ) {
		$out->addModules( 'ext.userswatchbutton.js' );
	}

	static function getFileMatching($filename) {

		$len = strlen($filename);

		$dbr = wfGetDB( DB_SLAVE );
		$res = $dbr->select(
				'page',
				array(
						'page_id',
						'page_title',
						'page_namespace'
				), array(
						"SUBSTR(page_title,1,$len)" =>  $filename,
						'page_namespace' => NS_FILE
				),
				__METHOD__
				);

		$files = array();
		if ( $res->numRows() > 0 ) {
			foreach ( $res as $row ) {
				$files[] = wfLocalFile(\Title::newFromRow($row));
			}
			$res->free();
		}
		return $files;
	}

	static function getGalleryFiles(\Title $page) {
		$files = [];
		if ($page) {
			$fileTitles = GroupsPageCore::getInstance()->getMemberPages($page);
			foreach ($fileTitles as $title) {
				$file = wfLocalFile( $title );
				//$file = \LocalFile::newFromTitle($fileTitles);
				if($file) {
					$files[] = $file;
				}
			}
			if( ! $page->exists()) {
				// if page doesn't exist yet,
				// we look for any files that could be linked to the page by name
				$titleKey = $page->getDBkey();
				if(strrpos($titleKey, '/')) {
					$titleKey = substr($titleKey, strrpos($titleKey, '/') +1);
				}
				$t = \Title::newFromText($titleKey);
				// the creation of Title object enable to get formatted DBKey
				$files = self::getFileMatching($t->getDBkey());
			}
		}
		return $files;
	}

	static function getGalleryBody($page) {

		// get all existing image linked to the page
		$files = self::getGalleryFiles($page);

		$out = '';
		$out .= '<div id="PageGallery" class="pg_sidebar" style="display:none">

				<h6 class="PageGalleryTitle" title="'.wfMessage( 'pmg-gallery-subtitle' )->parse().'"
								type="button" data-toggle="tooltip" data-placement="right">'
					. wfMessage( 'pmg-gallery-title' )->parse().'
					<span class="smwtticon info"></span></h6>

				<div id="PageGalleryUploader">';

		foreach ($files as $file) {
			$fileUrl = $file->getUrl();
			$params = ['width' => 400];
			$mto = $file->transform( $params );
			if ( $mto && !$mto->isError() ) {
				// thumb Ok, change the URL to point to a thumbnail.
				$fileUrl = wfExpandUrl( $mto->getUrl(), PROTO_RELATIVE );
			}
			$out .= '<img class="mediaGalleryFile" src="' . $fileUrl . '" alt="' . $file->getName() . '"/> ';
		}

		$out .= '</div>
			<div class="pageGalleryControls">
			</div>
		</div>
				';
		return $out;
	}

	public static function onUploadComplete( &$image ) {

		// if file comment contain a link to a page, we expressaly link it to the page
		// Warning : page is not recorded yet, so it has no id !!!

		$text = $image->getLocalFile()->getDescription();


		$pattern = '/\[\[(.*)\]\]/';
		if (preg_match($pattern, $text, $matches)) {
			$pageUri = $matches[1];
			$page = \Title::newFromText($pageUri);
			$fileTitle = $image->getLocalFile()->getTitle();
			if ($page->exists()) {
				GroupsPageCore::getInstance()->addPagesToGroup($page, [$fileTitle]);
			}
		}
	}

	/**
	 * on page creation : we check if files exist with name starting like page name
	 * and we add found files to the page galery
	 *
	 * This is a hack to manage files added to the gallery before page is saved at least once.
	 *
	 *
	 * @param unknown $wikiPage
	 * @param User $user
	 * @param unknown $content
	 * @param unknown $summary
	 * @param unknown $isMinor
	 * @param unknown $isWatch
	 * @param unknown $section
	 * @param unknown $flags
	 * @param Revision $revision
	 */
	public static function onPageContentInsertComplete( \Wikipage $wikiPage, \User $user, $content, $summary, $isMinor,$isWatch, $section, $flags, \Revision $revision ) {

		$filename = $wikiPage->getTitle()->getDBkey();
		$files = self::getFileMatching($filename);
		foreach ($files as $file) {
			GroupsPageCore::getInstance()->addPagesToGroup($wikiPage->getTitle(),[$file->getTitle()]);
		}
	}


}
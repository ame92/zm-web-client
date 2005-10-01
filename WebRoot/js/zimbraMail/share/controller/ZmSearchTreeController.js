/*
 * ***** BEGIN LICENSE BLOCK *****
 * Version: ZPL 1.1
 * 
 * The contents of this file are subject to the Zimbra Public License
 * Version 1.1 ("License"); you may not use this file except in
 * compliance with the License. You may obtain a copy of the License at
 * http://www.zimbra.com/license
 * 
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See
 * the License for the specific language governing rights and limitations
 * under the License.
 * 
 * The Original Code is: Zimbra Collaboration Suite.
 * 
 * The Initial Developer of the Original Code is Zimbra, Inc.
 * Portions created by Zimbra are Copyright (C) 2005 Zimbra, Inc.
 * All Rights Reserved.
 * 
 * Contributor(s):
 * 
 * ***** END LICENSE BLOCK *****
 */

/**
* Creates a saved search tree controller.
* @constructor
* @class
* This class controls a tree display of saved searches.
*
* @author Conrad Damon
* @param appCtxt	[ZmAppCtxt]		app context
*/
function ZmSearchTreeController(appCtxt) {

	ZmFolderTreeController.call(this, appCtxt, ZmOrganizer.SEARCH);

	this._listeners[ZmOperation.RENAME_SEARCH] = new AjxListener(this, this._renameListener);
	this._listeners[ZmOperation.MODIFY_SEARCH] = new AjxListener(this, this._modifySearchListener);
}

ZmSearchTreeController.prototype = new ZmFolderTreeController;
ZmSearchTreeController.prototype.constructor = ZmSearchTreeController;

// Public methods

ZmSearchTreeController.prototype.toString = 
function() {
	return "ZmSearchTreeController";
}

/**
* Enables/disables operations based on context.
*
* @param parent		the widget that contains the operations
* @param id			the currently selected/activated organizer
*/
ZmSearchTreeController.prototype.resetOperations = 
function(parent, type, id) {
	parent.enableAll(true);
	var search = this._dataTree.getById(id);
	parent.enable(ZmOperation.EXPAND_ALL, (search.size() > 0));
}

// Private methods

/*
* Returns ops available for "Searches" container.
*/
ZmSearchTreeController.prototype._getHeaderActionMenuOps =
function() {
	return [ZmOperation.EXPAND_ALL];
}

/*
* Returns ops available for saved searches.
*/
ZmSearchTreeController.prototype._getActionMenuOps =
function() {
	var list = new Array();
	list.push(ZmOperation.DELETE,
			  ZmOperation.RENAME_SEARCH,
			  ZmOperation.MOVE,
			  ZmOperation.EXPAND_ALL);
	return list;
}

/*
* Underlying model is a tree of saved searches. Note that saved searches
* may also be in folders, in which case they are handled by the folder
* tree controller.
*/
ZmSearchTreeController.prototype._getData =
function() {
	return this._appCtxt.getSearchTree();
}

/*
* Returns a "New Saved Search" dialog.
*/
ZmSearchTreeController.prototype._getNewDialog =
function() {
	return this._appCtxt.getNewSearchDialog();
}

// Listeners

/*
* Called when a left click occurs (by the tree view listener). The saved
* search will be run.
*
* @param search		ZmSearchFolder		search that was clicked
*/
ZmSearchTreeController.prototype._itemClicked =
function(search) {
	var searchController = this._appCtxt.getSearchController();
	var types = searchController.getTypes(ZmSearchToolBar.FOR_ANY_MI);
	searchController.search(search.query, search.types, search.sortBy);
}

// Callbacks

/*
* Called when a "New Search" dialog is submitted. This override is necessary because we
* need to pass the search object to _doCreate().
*
* @param 0	[string]	name of the new saved search
* @param 1	[ZmFolder]	folder (or search) that will contain it
* @param 2	[constant]	always ZmOrganizer.SEARCH
* @param 3	[ZmSearch]	search object with details of the search
*/
ZmSearchTreeController.prototype._newCallback =
function(args) {
	this._schedule(this._doCreate, {name: args[0], parent: args[1], type: args[2], search: args[3]});
	this._getNewDialog().popdown();
}

// Miscellaneous

/*
* Returns a title for moving a saved search.
*/
ZmSearchTreeController.prototype._getMoveDialogTitle =
function() {
	return AjxStringUtil.resolve(ZmMsg.moveSearch, this._pendingActionData.name);
}

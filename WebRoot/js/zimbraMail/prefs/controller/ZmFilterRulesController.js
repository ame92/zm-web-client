/*
 * ***** BEGIN LICENSE BLOCK *****
 * Zimbra Collaboration Suite Web Client
 * Copyright (C) 2005, 2006, 2007, 2008, 2009, 2010, 2011 Zimbra, Inc.
 * 
 * The contents of this file are subject to the Zimbra Public License
 * Version 1.3 ("License"); you may not use this file except in
 * compliance with the License.  You may obtain a copy of the License at
 * http://www.zimbra.com/license.
 * 
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied.
 * ***** END LICENSE BLOCK *****
 */

/**
 * Creates a new, empty filter rules controller.
 * @class
 * This class represents the filter rules controller. This controller manages
 * the filter rules page, which has a button toolbar and a list view of the rules.
 *
 * @author Conrad Damon
 *
 * @param {DwtShell}		container		the shell
 * @param {ZmPreferencesApp}	prefsApp		the preferences application
 * 
 * @extends		ZmController
 */
ZmFilterRulesController = function(container, prefsApp, prefsView, parent, outgoing) {

	ZmController.call(this, container, prefsApp);

	this._prefsView = prefsView;
	this._parent = parent;

	this._filterRulesView = new ZmFilterRulesView(this._prefsView, this);

	this._outgoing = Boolean(outgoing);

	this._buttonListeners = {};
	this._buttonListeners[ZmOperation.ADD_FILTER_RULE] = new AjxListener(this, this._addListener);
	this._buttonListeners[ZmOperation.EDIT_FILTER_RULE] = new AjxListener(this, this._editListener);
	this._buttonListeners[ZmOperation.REMOVE_FILTER_RULE] = new AjxListener(this, this._removeListener);
	this._buttonListeners[ZmOperation.RUN_FILTER_RULE] = new AjxListener(this, this._runListener);
	this._buttonListeners[ZmOperation.MOVE_UP_FILTER_RULE] = new AjxListener(this, this._moveUpListener);
	this._buttonListeners[ZmOperation.MOVE_DOWN_FILTER_RULE] = new AjxListener(this, this._moveDownListener);

	this._progressController = new ZmProgressController(container, prefsApp);
};

ZmFilterRulesController.prototype = new ZmController();
ZmFilterRulesController.prototype.constructor = ZmFilterRulesController;

ZmFilterRulesController.prototype.toString =
function() {
	return "ZmFilterRulesController";
};

ZmFilterRulesController.prototype.isOutgoing =
function() {
	return this._outgoing;
};

/**
 * Gets the filter rules view, which is comprised of a toolbar and a list view.
 * 
 * @return	{ZmFilterRulesView}		the filter rules view
 */
ZmFilterRulesController.prototype.getFilterRulesView =
function() {
	return this._filterRulesView;
};

/**
 * Initializes the controller.
 * 
 * @param	{ZmToolBar}	toolbar		the toolbar
 * @param	{ZmListView}	listView		the list view
 */
ZmFilterRulesController.prototype.initialize =
function(toolbar, listView) {
	// always reset the the rules to make sure we get the right one for the *active* account
	this._rules = AjxDispatcher.run(this._outgoing ? "GetOutgoingFilterRules" : "GetFilterRules");

	if (toolbar) {
		var buttons = this.getToolbarButtons();
		for (var i = 0; i < buttons.length; i++) {
			var id = buttons[i];
			if (this._buttonListeners[id]) {
				toolbar.addSelectionListener(id, this._buttonListeners[id]);
			}
		}
		this._resetOperations(toolbar, 0);
	}

	if (listView) {
		this._listView = listView;
		listView.addSelectionListener(new AjxListener(this, this._listSelectionListener));
		listView.addActionListener(new AjxListener(this, this._listActionListener));
		this.resetListView();
	}
};

ZmFilterRulesController.prototype.getRules =
function() {
	if (!this._rules)
		this._rules = AjxDispatcher.run(this._outgoing ? "GetOutgoingFilterRules" : "GetFilterRules");
	return this._rules;
};

ZmFilterRulesController.prototype.getToolbarButtons =
function() {
	var ops = [
		ZmOperation.ADD_FILTER_RULE,
		ZmOperation.SEP,
		ZmOperation.EDIT_FILTER_RULE,
		ZmOperation.SEP,
		ZmOperation.REMOVE_FILTER_RULE
	];

	// bug: 42903 - disable running filters in offline for now
	if (!appCtxt.isOffline) {
		ops.push(ZmOperation.SEP, ZmOperation.RUN_FILTER_RULE);
	}

	ops.push(ZmOperation.FILLER,
			ZmOperation.MOVE_UP_FILTER_RULE,
			ZmOperation.SEP,
			ZmOperation.MOVE_DOWN_FILTER_RULE
	);

	return ops;
};

ZmFilterRulesController.prototype.resetListView =
function(selectedIndex) {
	if (!this._listView) { return; }

	var respCallback = new AjxCallback(this, this._handleResponseSetListView, [selectedIndex]);
	this._rules.loadRules(appCtxt.isOffline, respCallback);		// bug #15044 - force loading rules in offline mode
};

ZmFilterRulesController.prototype._handleResponseSetListView =
function(selectedIndex, result) {
	this._listView.set(result.getResponse().clone());

	var rule = this._rules.getRuleByIndex(selectedIndex || 0);
	if (rule) {
		this._listView.setSelection(rule);
	}
};

/**
 * Handles left-clicking on a rule. Double click opens up a rule for editing.
 *
 * @param	{DwtEvent}	ev		the click event
 * 
 * @private
 */
ZmFilterRulesController.prototype._listSelectionListener =
function(ev) {
	if (ev.detail == DwtListView.ITEM_DBL_CLICKED) {
		this._editListener(ev);
	} else {
		var tb = this._filterRulesView.getToolbar();
		this._resetOperations(tb, this._listView.getSelectionCount(), this._listView.getSelection());
	}
};

ZmFilterRulesController.prototype._listActionListener =
function(ev) {
	var actionMenu = this.getActionMenu();
	this._resetOperations(actionMenu, this._listView.getSelectionCount(), this._listView.getSelection());
	actionMenu.popup(0, ev.docX, ev.docY);
};

/**
 * Gets the action menu.
 * 
 * @return	{ZmActionMenu}		the action menu
 */
ZmFilterRulesController.prototype.getActionMenu =
function() {
	if (!this._actionMenu) {
		this._initializeActionMenu();
		this._resetOperations(this._actionMenu, 0, this._listView.getSelection());
	}
	return this._actionMenu;
};

// action menu: menu items and listeners
ZmFilterRulesController.prototype._initializeActionMenu =
function() {
	if (this._actionMenu) { return; }

	var menuItems = this._getActionMenuOps();
	if (menuItems) {
		var params = {
			parent:this._shell,
			menuItems:menuItems,
			context:this._getMenuContext(),
			controller:this
		};
		this._actionMenu = new ZmActionMenu(params);
		this._addMenuListeners(this._actionMenu);
	}
};

ZmFilterRulesController.prototype._getActionMenuOps =
function() {
	var ops = [
		ZmOperation.EDIT_FILTER_RULE,
		ZmOperation.REMOVE_FILTER_RULE
	];

	// bug: 42903 - disable running filters in offline for now
	if (!appCtxt.isOffline) {
		ops.push(ZmOperation.RUN_FILTER_RULE);
	}

	ops.push(ZmOperation.SEP,
			ZmOperation.MOVE_UP_FILTER_RULE,
			ZmOperation.MOVE_DOWN_FILTER_RULE
	);

	return ops;
};

/**
 * Returns the context for the action menu created by this controller (used to create
 * an ID for the menu).
 */
ZmFilterRulesController.prototype._getMenuContext =
function() {
	return this._app && this._app._name;
};

ZmFilterRulesController.prototype._addMenuListeners =
function(menu) {
	var menuItems = menu.opList;
	for (var i = 0; i < menuItems.length; i++) {
		var menuItem = menuItems[i];
		if (this._buttonListeners[menuItem]) {
			menu.addSelectionListener(menuItem, this._buttonListeners[menuItem], 0);
		}
	}
	menu.addPopdownListener(this._menuPopdownListener);
};

/**
* The "Add Filter" button has been pressed.
*
* @ev		[DwtEvent]		the click event
*/
ZmFilterRulesController.prototype._addListener =
function(ev) {
	if (!this._listView) { return; }
	this.handleBeforeFilterChange(new AjxCallback(this, this._popUpAdd));
};

ZmFilterRulesController.prototype.handleBeforeFilterChange =
function(okCallback, cancelCallback) {
	if (this._outgoing && (appCtxt.getSettings().getSetting(ZmSetting.SAVE_TO_SENT).getValue()===false || ZmPref.getFormValue(ZmSetting.SAVE_TO_SENT)===false)) {
		var dialog = appCtxt.getConfirmationDialog();
		if (!this._saveToSentMessage) {
			var html = [];
			var i = 0;
			html[i++] = "<table cellspacing=0 cellpadding=0 border=0><tr><td valign='top'>";
			html[i++] = AjxImg.getImageHtml("Warning_32");
			html[i++] = "</td><td class='DwtMsgArea'>";
			html[i++] = ZmMsg.filterOutgoingNoSaveToSentWarning;
			html[i++] = "</td></tr></table>";
			this._saveToSentMessage = html.join("");
		}
		var handleSaveToSentYesListener = new AjxListener(this, this._handleSaveToSentYes, [okCallback]);
		var handleSaveToSentNoListener = new AjxListener(this, this._handleSaveToSentNo, [okCallback]);
		
		dialog.popup(this._saveToSentMessage, handleSaveToSentYesListener, handleSaveToSentNoListener, cancelCallback);
		dialog.setTitle(AjxMsg.warningMsg);
	} else {
		if (okCallback)
			okCallback.run();
	}
};

ZmFilterRulesController.prototype._handleSaveToSentYes =
function(callback) {
	var settings = appCtxt.getSettings();
	var setting = settings.getSetting(ZmSetting.SAVE_TO_SENT);
	ZmPref.setFormValue(ZmSetting.SAVE_TO_SENT, true);
	if (!setting.getValue()) {
		setting.setValue(true);
		settings.save([setting], callback);
	} else {
		if (callback)
			callback.run();
	}
};

ZmFilterRulesController.prototype._handleSaveToSentNo =
function(callback) {
	if (callback)
		callback.run();
};

ZmFilterRulesController.prototype._popUpAdd =
function() {
	var sel = this._listView.getSelection();
	var refRule = sel.length ? sel[sel.length - 1] : null;
	appCtxt.getFilterRuleDialog().popup(null, false, refRule, null, this._outgoing);
};

/**
* The "Edit Filter" button has been pressed.
*
* @ev		[DwtEvent]		the click event
*/
ZmFilterRulesController.prototype._editListener =
function(ev) {
	if (!this._listView) { return; }

	var sel = this._listView.getSelection();
	appCtxt.getFilterRuleDialog().popup(sel[0], true, null, null, this._outgoing);
};

/**
* The "Delete Filter" button has been pressed.
*
* @ev			[DwtEvent]		the click event
*/
ZmFilterRulesController.prototype._removeListener =
function(ev) {
	if (!this._listView) { return; }

	var sel = this._listView.getSelection();

	var rule = sel[0];
	//bug:16053 changed getYesNoCancelMsgDialog to getYesNoMsgDialog
	var ds = this._deleteShield = appCtxt.getYesNoMsgDialog();
	ds.reset();
	ds.registerCallback(DwtDialog.NO_BUTTON, this._clearDialog, this, this._deleteShield);
	ds.registerCallback(DwtDialog.YES_BUTTON, this._deleteShieldYesCallback, this, rule);
	var msg = AjxMessageFormat.format(ZmMsg.askDeleteFilter, rule.name);
	ds.setMessage(msg, DwtMessageDialog.WARNING_STYLE);
	ds.popup();
};

ZmFilterRulesController.prototype._runListener =
function(ev) {
	// !!! do *NOT* get choose folder dialog from appCtxt since this one has checkboxes!
	if (!this._chooseFolderDialog) {
		AjxDispatcher.require("Extras");
		this._chooseFolderDialog = new ZmChooseFolderDialog(appCtxt.getShell());
	}
	this._chooseFolderDialog.reset();
	this._chooseFolderDialog.registerCallback(DwtDialog.OK_BUTTON, this._runFilterOkCallback, this, this._chooseFolderDialog);

	// bug 42725: always omit shared folders
	var omit = {};
	var tree = appCtxt.getTree(ZmOrganizer.FOLDER);
	var children = tree.root.children.getArray();
	for (var i = 0; i < children.length; i++) {
		var child = children[i];
		if (child.type == ZmOrganizer.FOLDER && child.isRemote()) {
			omit[child.id] = true;
		}
	}

	var params = {
		treeIds:		[ZmOrganizer.FOLDER],
		title:			ZmMsg.chooseFolder,
		overviewId:		this.toString() + (this._outgoing ? "_outgoing":"_incoming"),
		description:	ZmMsg.chooseFolderToFilter,
		skipReadOnly:	true,
		hideNewButton:	true,
		treeStyle:		DwtTree.CHECKEDITEM_STYLE,
		appName:		ZmApp.MAIL,
		omit:			omit
	};
	this._chooseFolderDialog.popup(params);

	var foundForwardAction;
	var sel = this._listView && this._listView.getSelection();
	for (var i = 0; i < sel.length; i++) {
		if (sel[i].actions[ZmFilterRule.A_NAME_FORWARD]) {
			foundForwardAction = true;
			break;
		}
	}

	if (foundForwardAction) {
		var dialog = appCtxt.getMsgDialog();
		dialog.setMessage(ZmMsg.filterForwardActionWarning);
		dialog.popup();
	}
};

ZmFilterRulesController.prototype._runFilterOkCallback =
function(dialog, folderList) {
	dialog.popdown();

	var filterSel = this._listView && this._listView.getSelection();
	if (!(filterSel && filterSel.length)) {
		return;
	}

	var work = new ZmFilterWork(filterSel);

	this._progressController.start(folderList, work);

};

/**
* The user has agreed to delete a filter rule.
*
* @param rule	[ZmFilterRule]		rule to delete
*/
ZmFilterRulesController.prototype._deleteShieldYesCallback =
function(rule) {
	this._rules.removeRule(rule);
	this._clearDialog(this._deleteShield);
	this._resetOperations(this._filterRulesView.getToolbar(), 0);
};

/**
* The "Move Up" button has been pressed.
*
* @param	ev		[DwtEvent]		the click event
*/
ZmFilterRulesController.prototype._moveUpListener =
function(ev) {
	if (!this._listView) { return; }

	var sel = this._listView.getSelection();
	this._rules.moveUp(sel[0]);
};

/**
* The "Move Down" button has been pressed.
*
* @ev		[DwtEvent]		the click event
*/
ZmFilterRulesController.prototype._moveDownListener =
function(ev) {
	if (!this._listView) { return; }

	var sel = this._listView.getSelection();
	this._rules.moveDown(sel[0]);
};

/**
* Resets the toolbar button states, depending on which rule is selected.
* The list view enforces single selection only. If the first rule is selected,
* "Move Up" is disabled. Same for last rule and "Move Down". They're both
* disabled if there aren't at least two rules.
*
* @param parent		[ZmButtonToolBar]	the toolbar
* @param numSel		[int]				number of rules selected (0 or 1)
* @param sel		[Array]				list of selected rules
*/
ZmFilterRulesController.prototype._resetOperations =
function(parent, numSel, sel) {
	var numRules = this._rules.getNumberOfRules();
	if (numSel == 1) {
		parent.enableAll(true);
		var index = this._rules.getIndexOfRule(sel[0]);
		if (index == 0) {
			parent.enable(ZmOperation.MOVE_UP_FILTER_RULE, false);
		}
		if (index == (numRules - 1)) {
			parent.enable(ZmOperation.MOVE_DOWN_FILTER_RULE, false);
		}
	} else {
		parent.enableAll(false);
		parent.enable(ZmOperation.ADD_FILTER_RULE, true);
		if (numSel > 1) {
			parent.enable(ZmOperation.RUN_FILTER_RULE, true);
		}
	}

	if (numRules <= 1) {
		parent.enable(ZmOperation.MOVE_UP_FILTER_RULE, false);
		parent.enable(ZmOperation.MOVE_DOWN_FILTER_RULE, false);
	} else if (numRules == 0) {
		parent.enable(ZmOperation.EDIT_FILTER_RULE, false);
		parent.enable(ZmOperation.REMOVE_FILTER_RULE, false);
	}
};

ZmFilterRulesController.prototype.getListView =
function(){
    return this._listView;
};



/**
 * class that holds the work specification (in this case, filtering specific filters. Keeps track of progress stats too.
 * an instance of this is passed to ZmFilterRulesController to callback for stuff specific to this work. (template pattern, I believe)
 * @param filterSel
 */
ZmFilterWork = function(filterSel) {
	this._filterSel = filterSel;
	this._totalNumMessagesAffected = 0;

};

/**
 * return the summary message when finished everything.
 */
ZmFilterWork.prototype.getFinishedMessage =
function(messagesProcessed) {
	return AjxMessageFormat.format(ZmMsg.filterRuleApplied, [messagesProcessed, this._totalNumMessagesAffected]);
};

/**
 * return the progress so far summary.
 */
ZmFilterWork.prototype.getProgressMessage =
function(messagesProcessed) {
	return AjxMessageFormat.format(ZmMsg.filterRunInProgress, [messagesProcessed, this._totalNumMessagesAffected]);
};

/**
 * return the finished dialog title.
 */
ZmFilterWork.prototype.getFinishedTitle =
function(messagesProcessed) {
	return AjxMessageFormat.format(ZmMsg.filterRunFinished);
};

/**
 * return the progress dialog title.
 */
ZmFilterWork.prototype.getProgressTitle =
function(messagesProcessed) {
	return AjxMessageFormat.format(ZmMsg.filterRunInProgressTitle);
};


/**
 * do the work. (in this case apply filters).
 * @param msgIds - chunk of message ids to do the work on.
 * @param callback
 */
ZmFilterWork.prototype.doWork =
function(msgIds, callback) {
	var filterSel = this._filterSel;
	var soapDoc = AjxSoapDoc.create(this._outgoing ? "ApplyOutgoingFilterRulesRequest" : "ApplyFilterRulesRequest", "urn:zimbraMail");
	var filterRules = soapDoc.set("filterRules", null);
	for (var i = 0; i < filterSel.length; i++) {
		var rule = soapDoc.set("filterRule", null, filterRules);
		rule.setAttribute("name", filterSel[i].name);
	}

	var m = soapDoc.set("m");
	m.setAttribute("ids", msgIds.join(","));

	var params = {
		soapDoc: soapDoc,
		asyncMode: true,
		callback: (new AjxCallback(this, this._handleRunFilter, [callback]))
	};
	appCtxt.getAppController().sendRequest(params);
};

/**
 * private method - gets the result of the filter request, and keeps track of total messages affected.
 * @param callback
 * @param result
 */
ZmFilterWork.prototype._handleRunFilter =
function(callback, result) {
	var r = result.getResponse();
	var resp = this._outgoing ? r.ApplyOutgoingFilterRulesResponse : r.ApplyFilterRulesResponse;
	var num = (resp && resp.m && resp.m.length)
		? (resp.m[0].ids.split(",").length) : 0;
	this._totalNumMessagesAffected += num;
	callback.run();
};

/**
 * return pause between chunks
 */
ZmFilterWork.prototype.getChunkPause =
function() {
	return 500;
};




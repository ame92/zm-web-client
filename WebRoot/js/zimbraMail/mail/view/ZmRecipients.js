/*
 * ***** BEGIN LICENSE BLOCK *****
 * Zimbra Collaboration Suite Web Client
 * Copyright (C) 2011 Zimbra, Inc.
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


ZmRecipients = function(controller, resetContainerSizeMethod, enableContainerInputs, reenter) {

    //DwtComposite.call(this, {parent:parent, posStyle:posStyle, className:className, id:uid});

    this._useAcAddrBubbles = appCtxt.get(ZmSetting.USE_ADDR_BUBBLES);
	this._divId = {};
	this._buttonTdId = {};
	this._fieldId = {};
	this._using = {};
	this._button = {};
	this._field = {};
	this._divEl = {};
    if (this._useAcAddrBubbles) {
        this._addrInputField = {};
    }

    this._controller = controller;
    this._resetContainerSize = resetContainerSizeMethod;
    this._enableContainerInputs = enableContainerInputs;
    this._reenter = reenter;
};

ZmRecipients.prototype.attachFromSelect =
function(fromSelect) {
    this._fromSelect = fromSelect;
}


ZmRecipients.prototype.createRecipientHtml =
function(parent, viewId, htmlElId, fieldNames, bccToggleId) {
    this._fieldNames = fieldNames;

    	// init autocomplete list
	if (appCtxt.get(ZmSetting.CONTACTS_ENABLED) || appCtxt.get(ZmSetting.GAL_ENABLED) || appCtxt.isOffline) {
		var params = {
			dataClass:		appCtxt.getAutocompleter(),
			matchValue:		ZmAutocomplete.AC_VALUE_FULL,
			compCallback:	(new AjxCallback(this, this._acCompHandler)),
			keyUpCallback:	(new AjxCallback(this, this._acKeyupHandler)),
			options:		{addrBubbles:this._useAcAddrBubbles}
		};
		this._acAddrSelectList = new ZmAutocompleteListView(params);
	}

	var isPickerEnabled = (appCtxt.get(ZmSetting.CONTACTS_ENABLED) ||
						   appCtxt.get(ZmSetting.GAL_ENABLED) ||
						   appCtxt.multiAccounts);
	this._pickerButton = {};

	// process compose fields
	for (var i = 0; i < fieldNames.length; i++) {
		var type = fieldNames[i];
		var typeStr = AjxEmailAddress.TYPE_STRING[type];

		// save identifiers
		this._divId[type] = [htmlElId, typeStr, "row"].join("_");
		this._buttonTdId[type] = [htmlElId, typeStr, "picker"].join("_");
		var inputId = this._fieldId[type] = [htmlElId, typeStr, "control"].join("_");

		// save field elements
		this._divEl[type] = document.getElementById(this._divId[type]);
		var aifId;
		if (this._useAcAddrBubbles) {
			var aifParams = {
				parent:								parent,
				autocompleteListView:				this._acAddrSelectList,
				bubbleAddedCallback:				(new AjxCallback(this, this._bubblesChangedCallback)),
				bubbleRemovedCallback:				(new AjxCallback(this, this._bubblesChangedCallback)),
				bubbleMenuCreatedCallback:			(new AjxCallback(this, this._bubbleMenuCreated)),
				bubbleMenuResetOperationsCallback:	(new AjxCallback(this, this._bubbleMenuResetOperations)),
				inputId:							inputId,
				type:								type
			}
			var aif = this._addrInputField[type] = new ZmAddressInputField(aifParams);
			aifId = aif._htmlElId;
			var cellId = [htmlElId, typeStr, "cell"].join("_");
			aif.reparentHtmlElement(cellId);
		}

		// save field control
		this._field[type] = document.getElementById(this._fieldId[type]);
		if (this._field[type]) {
			this._field[type].addrType = type;
			if (!this._useAcAddrBubbles) {
				this._setEventHandler(this._fieldId[type], "onFocus");
			}
		}

		// create picker
		if (isPickerEnabled) {
			var pickerId = this._buttonTdId[type];
			var pickerEl = document.getElementById(pickerId);
			if (pickerEl) {
				var buttonId = ZmId.getButtonId(viewId, ZmComposeView.OP[type]);
				var button = this._pickerButton[type] = new DwtButton({parent:parent, id:buttonId});
				button.setText(pickerEl.innerHTML);
				button.replaceElement(pickerEl);

				button.addSelectionListener(new AjxListener(this, this.addressButtonListener));
				button.addrType = type;

				// autocomplete-related handlers
				if (appCtxt.get(ZmSetting.CONTACTS_ENABLED) || appCtxt.isOffline) {
					this._acAddrSelectList.handle(this._field[type], aifId);
				} else {
					this._setEventHandler(this._fieldId[type], "onKeyUp");
				}

				this._button[type] = button;
			}
		}
	}

	// Toggle BCC
	this._toggleBccEl = document.getElementById(bccToggleId);
	if (this._toggleBccEl) {
		Dwt.setHandler(this._toggleBccEl, DwtEvent.ONCLICK, AjxCallback.simpleClosure(this._toggleBccField, this));
	}
}

ZmRecipients.prototype.reset =
function() {

	// reset To/CC/BCC fields
	for (var i = 0; i < this._fieldNames.length; i++) {
		var type = this._fieldNames[i];
		var textarea = this._field[type];
		textarea.value = "";
		this._adjustAddrHeight(textarea, true);
		if (this._useAcAddrBubbles) {
			var addrInput = this._addrInputField[type];
			if (addrInput) {
				addrInput.clear();
			}
		}
	}
}


ZmRecipients.prototype.resetPickerButtons =
function(account) {
	var ac = window.parentAppCtxt || window.appCtxt;
	var isEnabled = ac.get(ZmSetting.CONTACTS_ENABLED, null, account) ||
					ac.get(ZmSetting.GAL_ENABLED, null, account);

	for (var i in this._pickerButton) {
		var button = this._pickerButton[i];
		button.setEnabled(isEnabled);
	}
};

ZmRecipients.prototype.setup =
function() {
    // reset To/Cc/Bcc fields
    this._showAddressField(AjxEmailAddress.TO, true, true, true);
    this._showAddressField(AjxEmailAddress.CC, true, true, true);
    //Set BCC Field to Default
    this._toggleBccField(null, appCtxt.get(ZmSetting.SHOW_BCC));
}

ZmRecipients.prototype.getField =
function(type) {
    return document.getElementById(this._fieldId[type]);
}


ZmRecipients.prototype.getUsing =
function(type) {
    return this._using[type];
}

ZmRecipients.prototype.getACAddrSelectList =
function() {
    return this._acAddrSelectList;
}

ZmRecipients.prototype.getAddrInputField =
function(type) {
    return this._addrInputField[type];
}



// Adds the given addresses to the form. If we're using address bubbles, we need to add each
// address separately in case it's a DL.
ZmRecipients.prototype.addAddresses =
function(type, addrVec, used) {

	var addrAdded = false;
	used = used || {};
	var addrList = [];
	var addrs = addrVec && addrVec.getArray();
	if (addrs && addrs.length) {
		for (var i = 0, len = addrs.length; i < len; i++) {
			var addr = addrs[i];
			var email = addr.isAjxEmailAddress ? addr && addr.getAddress() : addr;
			if (!email) { continue; }
			email = email.toLowerCase();
			if (!used[email]) {
				if (this._useAcAddrBubbles) {
					this.setAddress(type, addr);	// add the bubble now
				} else {
					addrList.push(addr);
				}
				used[email] = true;
				addrAdded = true;
			}
		}
		if (!this._useAcAddrBubbles) {
			// calls implicit toString() on each addr object
			var addrStr = addrList.join(AjxEmailAddress.SEPARATOR);
			this.setAddress(type, addrStr);
		}
	}
	return addrAdded;
};


/**
 * Sets an address field.
 *
 * @param type	the address type
 * @param addr	the address string
 *
 * XXX: if addr empty, check if should hide field
 *
 * @private
 */
ZmRecipients.prototype.setAddress =
function(type, addr) {

	addr = addr || "";

	var addrStr = addr.isAjxEmailAddress ? addr.toString() : addr;

	//show first, so focus works on IE.
	if (addrStr.length && !this._using[type]) {
		this._using[type] = true;
		this._showAddressField(type, true);
	}

	if (this._useAcAddrBubbles) {
		var addrInput = this._addrInputField[type];
		if (!addrStr) {
			addrInput.clear();
		}
		else {
			if (addr.isAjxEmailAddress) {
				var match = {isDL: addr.isGroup && addr.canExpand, email: addrStr};
				addrInput.addBubble({address:addrStr, match:match, skipNotify:true});
			}
			else {
				this._setAddrFieldValue(type, addrStr);
			}
		}
	}
	else {
		this._setAddrFieldValue(type, addrStr);
	}

	// Use a timed action so that first time through, addr textarea
	// has been sized by browser based on content before we try to
	// adjust it (bug 20926)
	AjxTimedAction.scheduleAction(new AjxTimedAction(this,
		function() {
			this._adjustAddrHeight(this._field[type]);
		}), 0);
};


/**
 * Gets the field values for each of the addr fields.
 *
 * @return	{Array}	an array of addresses
 */
ZmRecipients.prototype.getRawAddrFields =
function() {
	var addrs = {};
	for (var i = 0; i < this._fieldNames.length; i++) {
		var type = this._fieldNames[i];
		if (this._using[type]) {
			addrs[type] = this.getAddrFieldValue(type);
		}
	}
	return addrs;
};

// returns address fields that are currently visible
ZmRecipients.prototype.getAddrFields =
function() {
	var addrs = [];
	for (var i = 0; i < this._fieldNames.length; i++) {
		var type = this._fieldNames[i];
		if (this._using[type]) {
			addrs.push(this._field[type]);
		}
	}
	return addrs;
};


// Grab the addresses out of the form. Optionally, they can be returned broken
// out into good and bad addresses, with an aggregate list of the bad ones also
// returned. If the field is hidden, its contents are ignored.
ZmRecipients.prototype.collectAddrs =
function() {

	var addrs = {};
	addrs[ZmComposeView.BAD] = new AjxVector();
	for (var i = 0; i < this._fieldNames.length; i++) {
		var type = this._fieldNames[i];
		if (!this._using[type]) { continue; }

		var val = this.getAddrFieldValue(type);
		if (val.length == 0) { continue; }
		var result = AjxEmailAddress.parseEmailString(val, type, false);
		if (result.all.size() == 0) { continue; }
		addrs.gotAddress = true;
		addrs[type] = result;
		if (result.bad.size()) {
			addrs[ZmComposeView.BAD].addList(result.bad);
			if (!addrs.badType) {
				addrs.badType = type;
			}
		}
	}
	return addrs;
};


ZmRecipients.prototype.getAddrFieldValue =
function(type) {

	var val = "";
	if (this._useAcAddrBubbles) {
		var addrInput = this._addrInputField[type];
		if (addrInput) {
			val = addrInput.getValue();
		}
	}
	else {
		val = AjxStringUtil.trim(this._field[type].value)
	}

	return val;
};


ZmRecipients.prototype.enableInputs =
function(bEnable) {
	// disable input elements so they dont bleed into top zindex'd view
	for (var i = 0; i < this._fieldNames.length; i++) {
		this._field[this._fieldNames[i]].disabled = !bEnable;
	}
};



// Address buttons invoke contact picker
ZmRecipients.prototype.addressButtonListener =
function(ev, addrTypet) {
	var obj = ev ? DwtControl.getTargetControl(ev) : null;
	this._enableContainerInputs(false);

	if (!this._contactPicker) {
		AjxDispatcher.require("ContactsCore");
		var buttonInfo = [
			{ id: AjxEmailAddress.TO,	label: ZmMsg[AjxEmailAddress.TYPE_STRING[AjxEmailAddress.TO]] },
			{ id: AjxEmailAddress.CC,	label: ZmMsg[AjxEmailAddress.TYPE_STRING[AjxEmailAddress.CC]] },
			{ id: AjxEmailAddress.BCC,	label: ZmMsg[AjxEmailAddress.TYPE_STRING[AjxEmailAddress.BCC]] }
		];
		this._contactPicker = new ZmContactPicker(buttonInfo);
		this._contactPicker.registerCallback(DwtDialog.OK_BUTTON, this._contactPickerOkCallback, this);
		this._contactPicker.registerCallback(DwtDialog.CANCEL_BUTTON, this._contactPickerCancelCallback, this);
	}

	var curType = obj ? obj.addrType : addrType;
	var addrList = {};
	var addrs = !this._useAcAddrBubbles && this.collectAddrs();
	for (var i = 0; i < this._fieldNames.length; i++) {
		var type = this._fieldNames[i];
		addrList[type] = this._useAcAddrBubbles ? this._addrInputField[type].getAddresses(true) :
				   								  addrs[type] && addrs[type].good.getArray();
	}
	this._contactPicker.addPopdownListener(this._controller._dialogPopdownListener);
	var str = (this._field[curType].value && !(addrList[curType] && addrList[curType].length))
		? this._field[curType].value : "";

	var account;
	if (appCtxt.multiAccounts && this._fromSelect) {
		var addr = this._fromSelect.getSelectedOption().addr;
		account = appCtxt.accountList.getAccountByEmail(addr.address);
	}
	this._contactPicker.popup(curType, addrList, str, account);
};




// Private methods

// Show address field
ZmRecipients.prototype._showAddressField =
function(type, show, skipNotify, skipFocus) {
	this._using[type] = show;
	Dwt.setVisible(this._divEl[type], show);
	this._setAddrFieldValue(type, "");	 // bug fix #750 and #3680
	this._field[type].noTab = !show;
	var setting = ZmComposeView.ADDR_SETTING[type];
	if (setting) {
		appCtxt.set(setting, show, null, false, skipNotify);
	}
	if ((type == AjxEmailAddress.BCC) && this._toggleBccEl) {
		Dwt.setInnerHtml(this._toggleBccEl, show ? ZmMsg.hideBCC : ZmMsg.showBCC );
	}
	this._resetContainerSize();
};



ZmRecipients.prototype._acCompHandler =
function(text, el, match) {
	if (this._useAcAddrBubbles) { return; }
	this._adjustAddrHeight(el);
};

ZmRecipients.prototype._acKeyupHandler =
function(ev, acListView, result, element) {
	var key = DwtKeyEvent.getCharCode(ev);
	// process any printable character or enter/backspace/delete keys
	if (result && element && (ev.inputLengthChanged ||
		(key == 3 || key == 13 || key == 8 || key == 46 ||
		(AjxEnv.isMac && key == 224)))) // bug fix #24670
	{
		this._adjustAddrHeight(element);
	}
};

ZmRecipients.prototype._adjustAddrHeight =
function(textarea, skipResetBodySize) {

	if (this._useAcAddrBubbles || !textarea) { return; }

	if (textarea.value.length == 0) {
		textarea.style.height = "21px";

		if (AjxEnv.isIE) {
			// for IE use overflow-y
			textarea.style.overflowY = "hidden";
		} else {
			textarea.style.overflow = "hidden";
		}

		if (!skipResetBodySize) {
			this._resetContainerSize();
		}

		return;
	}

	var sh = textarea.scrollHeight;
	if (sh > textarea.clientHeight) {
		var taHeight = parseInt(textarea.style.height) || 0;
		if (taHeight <= 65) {
			if (sh >= 65) {
				sh = 65;
				if (AjxEnv.isIE)
					textarea.style.overflowY = "scroll";
				else
					textarea.style.overflow = "auto";
			}
			textarea.style.height = sh + 13;
			this._resetContainerSize();
		} else {
			if (AjxEnv.isIE) {
				// for IE use overflow-y
				textarea.style.overflowY = "scroll";
			}
			else {
				textarea.style.overflow = "auto";
			}

			textarea.scrollTop = sh;
		}
	}
};



/**
 * a callback that's called when bubbles are added or removed, since we need to resize the msg body in those cases.
 */
ZmRecipients.prototype._bubblesChangedCallback =
function() {
	if (!this._useAcAddrBubbles) { return; }
	this._resetContainerSize(); // body size might change due to change in size of address field (due to new bubbles).
};

ZmRecipients.prototype._bubbleMenuCreated =
function(addrInput, menu) {

	if (!this._useAcAddrBubbles) { return; }

	this._bubbleActionMenu = menu;

	menu.addOp(ZmOperation.SEP);
	var ops = [ZmOperation.MOVE_TO_TO, ZmOperation.MOVE_TO_CC, ZmOperation.MOVE_TO_BCC];
	var listener = new AjxListener(this, this._bubbleMove);
	for (var i = 0; i < ops.length; i++) {
		menu.addOp(ops[i]);
		menu.addSelectionListener(ops[i], listener);
	}
};

ZmRecipients.prototype._bubbleMenuResetOperations =
function(addrInput, menu) {
	var sel = addrInput.getSelection();
	var ops = [ZmOperation.MOVE_TO_TO, ZmOperation.MOVE_TO_CC, ZmOperation.MOVE_TO_BCC];
	for (var i = 0; i < ops.length; i++) {
		var op = ops[i];
		var type = ZmComposeView.MOVE_TO_FIELD[op];
		menu.enable(op, sel.length > 0 && (type != addrInput.type));
	}
};

ZmRecipients.prototype._bubbleMove =
function(ev) {

	var sourceInput = ZmAddressInputField.menuContext.addrInput;
	var op = ev && ev.item && ev.item.getData(ZmOperation.KEY_ID);
	var type = ZmComposeView.MOVE_TO_FIELD[op];
	var targetInput = this._addrInputField[type];
	if (sourceInput && targetInput) {
		var sel = sourceInput.getSelection();
		if (sel.length) {
			for (var i = 0; i < sel.length; i++) {
				var bubble = sel[i];
				this._showAddressField(type, true);
				targetInput.addBubble({bubble:bubble});
				sourceInput.removeBubble(bubble.id);
			}
		}
	}
};


ZmRecipients.prototype._setAddrFieldValue =
function(type, value) {

	if (this._useAcAddrBubbles) {
		var addrInput = this._addrInputField[type];
		if (addrInput) {
			addrInput.setValue(value, true);
		}
	} else {
		this._field[type].value = value || "";
	}
};

// Generic routine for attaching an event handler to a field. Since "this" for the handlers is
// the incoming event, we need a way to get at ZmComposeView, so it's added to the event target.
ZmRecipients.prototype._setEventHandler =
function(id, event, addrType) {
	var field = document.getElementById(id);
	field._recipients = this;
	if (addrType) {
		field._addrType = addrType;
	}
	var lcEvent = event.toLowerCase();
	field[lcEvent] = ZmRecipients["_" + event];
};


ZmRecipients._onKeyUp =
function(ev) {
	ev = DwtUiEvent.getEvent(ev);
	var element = DwtUiEvent.getTargetWithProp(ev, "id");
	if (!element) { return true; }
    element._recipients._adjustAddrHeight(element);
	return true;
};

// set focus within tab group to element so tabbing works
ZmRecipients._onFocus =
function(ev) {

	ev = DwtUiEvent.getEvent(ev);
	var element = DwtUiEvent.getTargetWithProp(ev, "id");
	if (!element) { return true; }

	var kbMgr = appCtxt.getKeyboardMgr();
	if (kbMgr.__currTabGroup) {
		kbMgr.__currTabGroup.setFocusMember(element);
	}
};




// Transfers addresses from the contact picker to the compose view.
ZmRecipients.prototype._contactPickerOkCallback =
function(addrs) {

	this._enableContainerInputs(true);
	for (var i = 0; i < this._fieldNames.length; i++) {
		var type = this._fieldNames[i];
		this.setAddress(type, "");
		this.addAddresses(type, addrs[type]);
	}

	//I still need this here since REMOVING stuff with the picker does not call removeBubble in the ZmAddresInputField.
	//Also - it's better to do it once than for every bubble in this case. user might add many addresses with the picker
	this._bubblesChangedCallback();

	this._contactPicker.removePopdownListener(this._controller._dialogPopdownListener);
	this._contactPicker.popdown();
	this._reenter();
};

ZmRecipients.prototype._contactPickerCancelCallback =
function() {
	this._enableContainerInputs(true);
	this._reenter();
};


ZmRecipients.prototype._toggleBccField =
function(ev, force) {
	var isBccFieldVisible = Dwt.getVisible(this._divEl[AjxEmailAddress.BCC]);
	if (typeof force != "undefined") {
		isBccFieldVisible = !force;
	}
	this._showAddressField(AjxEmailAddress.BCC, !isBccFieldVisible);
};
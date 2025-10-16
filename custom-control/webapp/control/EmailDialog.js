sap.ui.define([
    'sap/m/Dialog',
    'sap/ui/base/DataType',
    'sap/m/Label',
    'sap/m/MultiInput',
    'sap/m/Token',
    'sap/m/Text',
    'sap/m/TextArea',
    'sap/ui/layout/form/SimpleForm',
    'sap/m/Button',
    'sap/m/MessageToast',
    'sap/ui/core/Item',
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], (Dialog, DataType, Label, MultiInput, Token, Text, TextArea, SimpleForm, Button, MessageToast, Item, Filter, FilterOperator) => {
    "use strict";

    let thisLib = {
        _emailDialogType: { Compose: 'Compose', Query: 'Query', Reply: 'Reply', Approve: 'Approve', Reject: 'Reject' }
    }
    DataType.registerEnum('app.util.EmailDialogType', thisLib._emailDialogType);

    return Dialog.extend("app.customcontrol.control.EmailDialog", {
        metadata: {
            properties: {
                emailDialogType: { type: 'app.util.EmailDialogType', defaultValue: 'Compose' },
                to: { type: 'object', defaultValue: [] },
                cc: { type: 'object', defaultValue: [] },
                showPreviousMessage: { type: 'boolean' },
                previousMessage: { type: 'string' },
                previousMessageLabel: { type: 'string', defaultValue: 'Message' },
                messageLabel: { type: 'string', defaultValue: 'Comments' },
                beginButtonText: { type: 'string', defaultValue: 'Send' },
                endButtonText: { type: 'string', defaultValue: 'Close' },
            },
            events: {
                send: {},
                cancel: {}
            }
        },
        renderer: {},

        init: function () {
            Dialog.prototype.init.apply(this);
            this._formatter = this._getFormatter.apply(this, arguments);

            this._toLabel = new Label({ text: 'To', required: true });
            this._toMultiInput = new MultiInput({ showSuggestions: true, showValueHelp: false });
            this._toMultiInput.addValidator(this._formatter.validateEmail);

            this._ccLabel = new Label({ text: 'Cc' });
            this._ccMultiInput = new MultiInput({ showSuggestions: true, showValueHelp: false });
            this._ccMultiInput.addValidator(this._formatter.validateEmail);

            this._prevMsgLabel = new Label();
            this._prevMsgText = new Text();

            this._msgLabel = new Label({ required: true });
            this._msgTextArea = new TextArea({ rows: 5, cols: 10, placeholder: 'Write your message...' });
            const oContent = new SimpleForm({
                content: [
                    this._toLabel,
                    this._toMultiInput,
                    this._ccLabel,
                    this._ccMultiInput,
                    this._prevMsgLabel,
                    this._prevMsgText,
                    this._msgLabel,
                    this._msgTextArea
                ]
            });
            this.addContent(oContent);

            this._beginBtn = new Button({ type: 'Emphasized', press: this._onBeginBtnPress.bind(this) });
            this.setBeginButton(this._beginBtn);

            this._endBtn = new Button({ press: this._onEndBtnPress.bind(this) });
            this.setEndButton(this._endBtn);
        },
        onBeforeRendering: function () {
            Dialog.prototype.onBeforeRendering.apply(this, arguments);

            this.setTitle(this._formatter.setDialogTitle(this.getTitle(), this.getEmailDialogType()));

            this._addMailId(this._toMultiInput, this.getTo());
            this._addMailId(this._ccMultiInput, this.getCc());

            const bShowPreviousMsg = this._formatter.showPreviousMessage(this.getShowPreviousMessage(), this.getEmailDialogType());
            this._prevMsgLabel.setVisible(bShowPreviousMsg);
            this._prevMsgLabel.setText(this.getPreviousMessageLabel());
            this._prevMsgText.setVisible(bShowPreviousMsg);
            this._prevMsgText.setText(this.getPreviousMessage());

            this._msgLabel.setText(this.getMessageLabel());

            this._beginBtn.setText(this._formatter.setBeginButtonText(this.getBeginButtonText(), this.getEmailDialogType()));
            this._endBtn.setText(this.getEndButtonText());
        },
        clear: function () {
            this._toMultiInput.removeAllTokens();
            this._ccMultiInput.removeAllTokens();
            this._prevMsgText.setText();
            this._msgTextArea.setValue();
        },
        bindMailSuggestions: function (sModelName = '', sEntityName, sPropertyName) {
            if (!(sEntityName && sPropertyName)) return MessageToast.show('To bind suggestions Entity and Property names are required!');

            const sModel = (sModelName) ? sModelName + '>' : '';
            const sPath = sModel + '/' + sEntityName;
            const sProperty = sModel + sPropertyName;

            [this._toMultiInput, this._ccMultiInput].forEach(oMultiInput => {
                oMultiInput.bindAggregation("suggestionItems", {
                    path: sPath,
                    template: new Item({
                        text: `{${sProperty}}`
                    })
                });
                oMultiInput.setModel(this.getModel(sModelName), sModelName);
                oMultiInput.attachSuggest(this._multiInputOnSuggest.bind(this,sPropertyName));
            });

        },
        _addMailId: function (oMultiInput, aMailId = []) {
            aMailId.forEach(sMailId => {
                const oToken = this._formatter.validateEmail({ text: sMailId });
                if (oToken) oMultiInput.addToken(oToken);
            });
        },
        _onBeginBtnPress: function () {
            const aTo = this._getTokens(this._toMultiInput);
            const aCc = this._getTokens(this._ccMultiInput);
            const sMsg = this._msgTextArea.getValue();

            if (!aTo.length) return MessageToast.show('Please enter atleast one recipient mail address');
            if (!sMsg) return MessageToast.show('Please enter the message');

            this.fireSend({ aTo, aCc, sMsg });
        },
        _onEndBtnPress: function () {
            this.close();
        },
        _getTokens: function (oMultiInput) {
            return oMultiInput.getTokens().map(oToken => oToken.getKey());
        },
        _multiInputOnSuggest: function (sPropertyName, oEvent) {
            const sTerm = oEvent.getParameter("suggestValue");
            const aFilters = [];
            if (sTerm) {
                // Create a filter to search for the typed value in the "Name" property
                aFilters.push(new Filter(sPropertyName, FilterOperator.Contains, sTerm));
            }

            // Get the binding for the suggestionItems aggregation
            const oBinding = oEvent.getSource().getBinding("suggestionItems");

            // Apply the filter to the binding
            oBinding.filter(aFilters);
        },
        _getFormatter: function () {
            return {
                setDialogTitle: (sTitle, sDialogType) => {
                    if (sTitle) return sTitle;
                    else switch (sDialogType) {
                        case 'Compose': return 'Send Mail';
                        case 'Query': return 'Raise Query';
                        case 'Reply': return 'Reply to Query';
                        case 'Approve': return 'Approve Request';
                        case 'Reject': return 'Reject Request';
                        default: return '';
                    }
                },
                showPreviousMessage: (bShowMsg, sDialogType) => {
                    if ([true, false].includes(bShowMsg)) return bShowMsg;
                    else switch (sDialogType) {
                        case 'Reply':
                        case 'Approve': return true;
                        default: return false;
                    }
                },
                setBeginButtonText: (sText, sDialogType) => {
                    if (sText) return sText;
                    else switch (sDialogType) {
                        case 'Query': return 'Raise';
                        case 'Reply': return 'Reply';
                        case 'Approve': return 'Approve';
                        case 'Reject': return 'Reject';
                        default: return 'Send';
                    }
                },
                validateEmail: (args) => {
                    const sText = args.text;
                    const oMailRegRx = new RegExp(/^[a-zA-Z0-9]+([._+-][a-zA-Z0-9]+)*@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/);
                    if (sText.match(oMailRegRx)) return new Token({ key: sText, text: sText });
                    else {
                        MessageToast.show(`${sText} is not a valid mail address`);
                        return false;
                    }
                }
            }
        }
    });
});
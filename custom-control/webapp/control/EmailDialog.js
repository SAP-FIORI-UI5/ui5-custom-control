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
    'sap/m/MessageToast'
], (Dialog, DataType, Label, MultiInput, Token, Text, TextArea, SimpleForm, Button, MessageToast) => {
    "use strict";

    let thisLib = {
        _emailDialogType: { Compose: 'Compose', Query: 'Query', Reply: 'Reply', Approve: 'Approve', Reject: 'Reject' }
    }
    DataType.registerEnum('app.util.EmailDialogType', thisLib._emailDialogType);

    return Dialog.extend("app.customcontrol.control.EmailDialog", {
        metadata: {
            properties: {
                emailDialogType: { type: 'app.util.EmailDialogType', defaultValue: 'Compose' },
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
            this._toMultiInput = new MultiInput({ showSuggestions: true });
            this._toMultiInput.addValidator(this._formatter.validateEmail);

            this._ccLabel = new Label({ text: 'Cc' });
            this._ccMultiInput = new MultiInput({ showSuggestions: true });
            this._ccMultiInput.addValidator(this._formatter.validateEmail);

            this._prevMsgLabel = new Label();
            this._prevMsgText = new Text();

            this._msgLabel = new Label({ required: true });
            this._msgText = new TextArea({ roes: 5, cols: 10, placeholder: 'Write your message...' });
            const oContent = new SimpleForm({
                content: [
                    this._toLabel,
                    this._toMultiInput,
                    this._ccLabel,
                    this._ccMultiInput,
                    this._prevMsgLabel,
                    this._prevMsgText,
                    this._msgLabel,
                    this._msgText
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
            this.clear();

            this.setTitle(this._formatter.setDialogTitle(this.getTitle(), this.getEmailDialogType()));

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
            this._msgText.setValue();
        },
        addTo: function (aMailId) {
            aMailId.forEach(sMailId => {
                const oToken = this._formatter.validateEmail({ text: sMailId });
                if (oToken) this._toMultiInput.addToken(oToken);
            });
        },
        addCc: function (aMailId) {
            aMailId.forEach(sMailId => {
                const oToken = this._formatter.validateEmail({ text: sMailId });
                if (oToken) this._ccMultiInput.addToken(oToken);
            });
        },
        _onBeginBtnPress: function () {
            const aTo = this._getToken(this._toMultiInput);
            const aCc = this._getToken(this._ccMultiInput);
            const sMsg = this._msgInput.getValue();

            if (!aTo.length) return MessageToast.show('Please enter atleast one recipient mail address');
            if (!sMsg) return MessageToast.show('Please enter the message');

            this.fireSend({ aTo, aCc, sMsg });
        },
        _onEndBtnPress: function () {
            this.close();
        },
        _getTokens: function (oMultiInput) {
            return oMultiInput.getTokens().map(oToken => oToken.getkey());
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
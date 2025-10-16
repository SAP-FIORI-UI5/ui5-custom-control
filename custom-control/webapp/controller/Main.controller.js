sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "app/customcontrol/control/EmailDialog",
    "sap/ui/model/json/JSONModel"
], (Controller, EmailDialog, JSONModel) => {
    "use strict";

    return Controller.extend("app.customcontrol.controller.Main", {
        onInit() {
            this._getMailSuggestions();
        },
        onTriggerMail() {
            if (!this._oMailDialog) {
                this._oMailDialog = new EmailDialog();
                this.getView().addDependent(this._oMailDialog);
                this._oMailDialog.setModel(this.getView().getModel('mailSuggestions'),"mailSuggestions");
                this._oMailDialog.bindMailSuggestions('mailSuggestions','mails','id');
            }
            this._oMailDialog.clear();
            this._oMailDialog.setTo(['jeffin@george.com']);
            this._oMailDialog.open();
        },
        _getMailSuggestions() {
            const oSuggestions = new JSONModel({
                'mails': [
                    { 'id': 'jack@gmail.com' },
                    { 'id': 'ann@gmail.com' },
                    { 'id': 'ben@gmail.com' },
                    { 'id': 'ben@yahoo.com' }
                ]
            });

            this.getView().setModel(oSuggestions, "mailSuggestions");
        }
    });
});
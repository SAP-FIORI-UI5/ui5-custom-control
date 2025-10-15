sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "app/customcontrol/control/EmailDialog"
], (Controller, EmailDialog) => {
    "use strict";

    return Controller.extend("app.customcontrol.controller.Main", {
        onInit() {
        },
        onTriggerMail() {
            if(!this._oMailDialog) {
                this._oMailDialog = new EmailDialog();
            }
            this._oMailDialog.open();
        }
    });
});
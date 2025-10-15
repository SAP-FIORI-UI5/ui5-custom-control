/* global QUnit */
QUnit.config.autostart = false;

sap.ui.require(["app/customcontrol/test/integration/AllJourneys"
], function () {
	QUnit.start();
});

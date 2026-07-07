function togglePropertiesPanel() {
    var cmdId = app.findMenuCommandId("Properties");
    if (cmdId === null || cmdId === undefined) {
        alert("Couldn't find the 'Properties' menu command in this AE version.\n" +
              "Check Window menu for the exact label and update the script if it differs.");
        return;
    }
    app.executeCommand(cmdId);
}

togglePropertiesPanel();
// SelectPanelSearchField.jsx

// Bring the Effects & Presets panel into focus (opens it if closed, focuses if already open)
var panelCmd = app.findMenuCommandId("Effects & Presets");
if (panelCmd) {
    app.executeCommand(panelCmd);
} else {
    alert("Couldn't find the Effects & Presets menu command.");
}

// Place the cursor in that panel's search field
var findCmd = app.findMenuCommandId("Find");
if (!findCmd) {
    findCmd = app.findMenuCommandId("Find..."); // fallback in case of ellipsis naming
}

if (findCmd) {
    app.executeCommand(findCmd);
} else {
    alert("Couldn't find the Find menu command.");
}
(function () {

    app.beginUndoGroup("Inspect SAFE");

    var comp = app.project.activeItem;

    if (!(comp instanceof CompItem)) {
        alert("Open a comp");
        return;
    }

    if (comp.selectedLayers.length !== 1) {
        alert("Select ONE layer");
        return;
    }

    var layer = comp.selectedLayers[0];

    if (!layer.property("Source Text")) {
        alert("Select a TEXT layer only");
        return;
    }

    function buildJSON(obj) {
        var json = "";

        json += "{\n";
        json += "  \"compName\": \"" + comp.name + "\",\n";
        json += "  \"template\": {\n";
        json += "    \"index\": " + layer.index + ",\n";
        json += "    \"name\": \"" + layer.name + "\"\n";
        json += "  }\n";
        json += "}";

        return json;
    }

    var json = buildJSON();

    var file = File.saveDialog("Save Formatting.json", "*.json");

    if (!file) return;

    file.open("w");
    file.write(json);
    file.close();

    alert("Formatting saved");

    app.endUndoGroup();

})();
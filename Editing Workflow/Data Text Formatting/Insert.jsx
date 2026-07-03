(function () {

    app.beginUndoGroup("Insert Data SAFE DEBUG");

    function readTextFile(file) {
        file.open("r");
        var content = file.read();
        file.close();
        return content;
    }

    function readJSON(file) {
        file.open("r");
        var content = file.read();
        file.close();

        // remove hidden BOM / garbage
        content = content.replace(/^\uFEFF/, "");
        content = content.replace(/^\s+/, "");

        if (!content || content === "") {
            alert("Formatting.json is EMPTY");
            return null;
        }

        try {
            return eval("(" + content + ")");
        } catch (e) {
            alert("Formatting.json is BROKEN:\n" + e.toString());
            return null;
        }
    }

    function findCompByName(name) {
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (item instanceof CompItem && item.name === name) {
                return item;
            }
        }
        return null;
    }

    function cleanLine(line) {
        if (!line) return "";

        line = line.replace(/^\s+|\s+$/g, "");

        var match = line.match(/^\d+\s*[:.]\s*(.+)$/);
        if (match) line = match[1];

        return line.replace(/^\s+|\s+$/g, "");
    }

    function isValid(text) {
        return text && text.replace(/\s/g, "") !== "";
    }

    if (!app.project) {
        alert("No project open");
        return;
    }

    var formatFile = File.openDialog("Select Formatting.json");
    var dataFile = File.openDialog("Select Data.txt");

    if (!formatFile || !dataFile) {
        alert("Files not selected");
        return;
    }

    var format = readJSON(formatFile);

    if (!format) return;

    if (!format.compName || !format.template) {
        alert("Formatting.json missing compName or template");
        return;
    }

    var comp = findCompByName(format.compName);

    if (!comp) {
        alert("Comp not found: " + format.compName);
        return;
    }

    var templateLayer = comp.layer(format.template.index);

    if (!templateLayer) {
        alert("Template layer not found (index broken)");
        return;
    }

    if (!templateLayer.property("Source Text")) {
        alert("Template is NOT a text layer");
        return;
    }

    var raw = readTextFile(dataFile);
    raw = raw.replace(/\r/g, "");

    var lines = raw.split("\n");

    var created = 0;

    for (var i = 0; i < lines.length; i++) {

        var text = cleanLine(lines[i]);
        if (!isValid(text)) continue;

        var layer = templateLayer.duplicate();
        layer.name = text;

        var t = layer.property("Source Text");
        if (!t) continue;

        var doc = t.value;
        doc.text = text;
        t.setValue(doc);

        created++;
    }

    alert("Created " + created + " layers");

    app.endUndoGroup();

})();
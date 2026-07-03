/*
    Insert.jsx
    --------------------------
    Reads:
        Formatting.json

    Prompts for:
        - Formatting.json
        - Images folder

    Duplicates the inspected image layer,
    replaces its source,
    and automatically scales every imported
    image to match the template's visible size.
*/

(function () {

    app.beginUndoGroup("Insert Images");

    function readJSON(file) {
        file.open("r");
        var txt = file.read();
        file.close();
        return eval("(" + txt + ")");
    }

    function findCompByName(name) {
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);

            if (item instanceof CompItem && item.name == name) {
                return item;
            }
        }

        return null;
    }

    function getImageFiles(folder) {

        var files = folder.getFiles(function (f) {

            if (!(f instanceof File)) return false;

            var n = f.name.toLowerCase();

            return n.match(/\.(png|jpg|jpeg|tif|tiff|psd|bmp|gif|webp|ai)$/);

        });

        files.sort(function (a, b) {

            var na = parseInt(a.name, 10);
            var nb = parseInt(b.name, 10);

            if (isNaN(na)) na = 999999;
            if (isNaN(nb)) nb = 999999;

            return na - nb;

        });

        return files;
    }

    if (!app.project) {
        alert("No project open.");
        return;
    }

    var formatFile = File.openDialog("Select Formatting.json", "*.json");
    if (!formatFile) return;

    var format = readJSON(formatFile);

    var imagesFolder = Folder.selectDialog("Select images folder");
    if (!imagesFolder) return;

    var comp = findCompByName(format.composition.name);

    if (!comp) {
        alert("Composition not found.");
        return;
    }

    var templateLayer = comp.layer(format.template.index);

    if (!templateLayer) {
        alert("Template layer not found.");
        return;
    }

    var files = getImageFiles(imagesFolder);

    if (files.length === 0) {
        alert("No supported images found.");
        return;
    }

    var imported = 0;

    for (var i = 0; i < files.length; i++) {

        var importOptions = new ImportOptions(files[i]);

        if (!importOptions.canImportAs(ImportAsType.FOOTAGE))
            continue;

        importOptions.importAs = ImportAsType.FOOTAGE;

        var footage = app.project.importFile(importOptions);

        var newLayer = templateLayer.duplicate();

        newLayer.replaceSource(footage, false);

        var sx = (format.source.width / footage.width) * format.transform.scale[0];
        var sy = (format.source.height / footage.height) * format.transform.scale[1];

        if (format.template.is3D) {
            newLayer.scale.setValue([
                sx,
                sy,
                format.transform.scale[2]
            ]);
        } else {
            newLayer.scale.setValue([
                sx,
                sy
            ]);
        }

        newLayer.name = files[i].name.replace(/\.[^\.]+$/, "");

        imported++;
    }

    alert("Inserted " + imported + " images.");

    app.endUndoGroup();

})();
(function NavigateBreadcrumb() {
    app.beginUndoGroup("Navigate Breadcrumb");

    var proj = app.project;
    if (!proj) {
        alert("No project open.");
        return;
    }

    var currentComp = proj.activeItem;
    if (!(currentComp instanceof CompItem)) {
        alert("Please open a comp.");
        return;
    }

    var found = false;

    for (var i = 1; i <= proj.numItems; i++) {
        var item = proj.item(i);
        if (!(item instanceof CompItem)) continue;

        for (var l = 1; l <= item.numLayers; l++) {
            var layer = item.layer(l);

            if (layer.source === currentComp) {
                item.openInViewer();

                // Deselect all layers
                for (var k = 1; k <= item.numLayers; k++) {
                    item.layer(k).selected = false;
                }

                layer.selected = true;
                found = true;
                break;
            }
        }
        if (found) break;
    }

    if (!found) {
        alert("No parent comp found for this comp.");
    }

    app.endUndoGroup();
})();
app.beginUndoGroup("Disable All Effects");

for (var i = 1; i <= app.project.numItems; i++) {
    var item = app.project.item(i);

    if (item instanceof CompItem) {
        for (var j = 1; j <= item.numLayers; j++) {
            var layer = item.layer(j);
            var effects = layer.property("ADBE Effect Parade");

            if (effects !== null) {
                for (var k = 1; k <= effects.numProperties; k++) {
                    effects.property(k).enabled = false;
                }
            }
        }
    }
}

app.endUndoGroup();
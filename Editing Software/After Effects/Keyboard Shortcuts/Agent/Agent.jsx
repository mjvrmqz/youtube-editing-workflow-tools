(function () {

    app.beginUndoGroup("Reflow From Layer 43");

    var comp = app.project.activeItem;

    if (!(comp instanceof CompItem)) {
        alert("Open a comp first");
        return;
    }

    var startTime = 5.09;

    var layer43 = comp.layer(43);

    if (!layer43) {
        alert("Layer 43 not found");
        return;
    }

    // set layer 43 start time
    layer43.startTime = startTime;

    var currentTime = layer43.outPoint;

    // chain layers 42 downwards
    for (var i = 42; i >= 1; i--) {

        var lyr = comp.layer(i);

        if (!lyr) continue;

        lyr.startTime = currentTime;
        currentTime = lyr.outPoint;
    }

    app.endUndoGroup();

})();
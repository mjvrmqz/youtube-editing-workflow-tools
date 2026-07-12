(function ResolutionToggle() {

    var CUSTOM_FACTOR = 19;

    app.beginUndoGroup("Resolution Toggle");

    var comp = app.project.activeItem;

    if (!(comp instanceof CompItem)) {
        alert("Please select or open a composition.");
        app.endUndoGroup();
        return;
    }

    if (comp.resolutionFactor[0] === 1 && comp.resolutionFactor[1] === 1) {
        comp.resolutionFactor = [CUSTOM_FACTOR, CUSTOM_FACTOR];
    } else {
        comp.resolutionFactor = [1, 1];
    }

    app.endUndoGroup();

})();
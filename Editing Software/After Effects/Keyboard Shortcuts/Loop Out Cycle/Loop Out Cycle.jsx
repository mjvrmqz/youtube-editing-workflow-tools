function addLoopOutCycle() {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Please select a composition.");
        return;
    }

    var selectedProps = comp.selectedProperties;
    if (selectedProps.length === 0) {
        alert("Please select at least one property (e.g. Position, Rotation) in the Timeline panel.");
        return;
    }

    app.beginUndoGroup("Add loopOut Cycle Expression");

    var appliedCount = 0;
    var skippedCount = 0;

    for (var i = 0; i < selectedProps.length; i++) {
        var prop = selectedProps[i];

        // Only actual keyframe-able properties support expressions
        // (skip groups, effects headers, etc. that might sneak into selection)
        if (!(prop instanceof Property)) {
            skippedCount++;
            continue;
        }

        try {
            prop.expression = 'loopOut("cycle")';
            appliedCount++;
        } catch (e) {
            skippedCount++;
        }
    }

    app.endUndoGroup();

    if (appliedCount === 0) {
        alert("Couldn't apply the expression to any selected property.");
    }
}

addLoopOutCycle();
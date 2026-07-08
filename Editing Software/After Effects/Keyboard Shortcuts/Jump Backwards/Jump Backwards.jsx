app.beginUndoGroup("Jump Backwards");

var comp = app.project.activeItem;

if (comp && comp instanceof CompItem) {
    var section = "JumpBackwardsScript";
    var key = "cycleIndex";
    var steps = [0.5, 0.5, 1.25, 3.0];

    var index = 0;
    if (app.settings.haveSetting(section, key)) {
        index = parseInt(app.settings.getSetting(section, key), 10);
        if (isNaN(index) || index < 0 || index >= steps.length) {
            index = 0;
        }
    }

    var offset = steps[index];
    comp.time = Math.max(0, comp.time - offset);

    var nextIndex = (index + 1) % steps.length;
    app.settings.saveSetting(section, key, nextIndex.toString());
}

app.endUndoGroup();
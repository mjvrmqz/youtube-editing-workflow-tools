// SelectEffectProperty.jsx

function collectLeafProps(group, props) {
    for (var i = 1; i <= group.numProperties; i++) {
        var prop = group.property(i);
        if (prop.propertyType === PropertyType.PROPERTY) {
            props.push(prop);
        } else if (prop.propertyType === PropertyType.INDEXED_GROUP || prop.propertyType === PropertyType.NAMED_GROUP) {
            collectLeafProps(prop, props);
        }
    }
}

function getEffectProperties(layer) {
    var props = [];
    var effects;
    try {
        effects = layer.property("ADBE Effect Parade");
    } catch (e) {
        effects = null;
    }
    if (effects) {
        for (var i = 1; i <= effects.numProperties; i++) {
            collectLeafProps(effects.property(i), props);
        }
    }
    return props;
}

var comp = app.project.activeItem;
if (comp && comp instanceof CompItem && comp.selectedLayers.length > 0) {
    var layer = comp.selectedLayers[0];
    var props = getEffectProperties(layer);

    if (props.length === 0) {
        alert("No effect properties found on this layer.");
    } else {
        var section = "SelectEffectProperty";
        var key = "index_" + comp.id + "_" + layer.index;

        var currentIndex = -1;
        if (app.settings.haveSetting(section, key)) {
            currentIndex = parseInt(app.settings.getSetting(section, key), 10);
            if (isNaN(currentIndex)) currentIndex = -1;
        }

        var nextIndex = (currentIndex + 1) % props.length;

        for (var j = 0; j < props.length; j++) {
            try { props[j].selected = false; } catch (e) {}
        }

        props[nextIndex].selected = true;

        app.settings.saveSetting(section, key, nextIndex.toString());

        // Simulate the "SS" shortcut (Show only selected properties) via Hammerspoon
        system.callSystem('/opt/homebrew/bin/hs -c "hs.eventtap.keyStroke({}, \'s\'); hs.timer.usleep(50000); hs.eventtap.keyStroke({}, \'s\')" > /dev/null 2>&1 &');
    }
} else {
    alert("No layer selected or no active composition.");
}
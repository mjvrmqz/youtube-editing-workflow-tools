/*
    Inspect.jsx
    --------------------------
    Select ONE image (footage) layer before running.

    Creates:
        Formatting.json

    Stores:
        - Project
        - Composition
        - Template layer
        - Transform values
        - Layer switches
        - Template image dimensions
*/

(function () {

    app.beginUndoGroup("Inspect Image Template");

    function stringify(value) {

        if (value === null) return "null";

        if (typeof value === "string") {
            return "\"" + value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"") + "\"";
        }

        if (typeof value === "number" || typeof value === "boolean") {
            return String(value);
        }

        if (value instanceof Array) {
            var out = [];
            for (var i = 0; i < value.length; i++) {
                out.push(stringify(value[i]));
            }
            return "[" + out.join(",") + "]";
        }

        if (typeof value === "object") {
            var parts = [];
            for (var k in value) {
                parts.push("\"" + k + "\":" + stringify(value[k]));
            }
            return "{\n" + parts.join(",\n") + "\n}";
        }

        return "\"\"";
    }

    if (!app.project) {
        alert("No project open.");
        return;
    }

    var comp = app.project.activeItem;

    if (!(comp instanceof CompItem)) {
        alert("Open a composition.");
        return;
    }

    if (comp.selectedLayers.length !== 1) {
        alert("Select exactly one image layer.");
        return;
    }

    var layer = comp.selectedLayers[0];

    if (!(layer.source instanceof FootageItem)) {
        alert("Selected layer is not a footage/image layer.");
        return;
    }

    var data = {

        version: 1,

        project: app.project.file
            ? app.project.file.name
            : "Unsaved Project",

        composition: {
            name: comp.name,
            width: comp.width,
            height: comp.height,
            duration: comp.duration,
            frameRate: comp.frameRate
        },

        template: {
            name: layer.name,
            index: layer.index,
            is3D: layer.threeDLayer
        },

        source: {
            width: layer.source.width,
            height: layer.source.height
        },

        transform: {
            position: layer.position.value,
            anchorPoint: layer.anchorPoint.value,
            scale: layer.scale.value,
            opacity: layer.opacity.value
        },

        switches: {
            enabled: layer.enabled,
            shy: layer.shy,
            solo: layer.solo,
            locked: layer.locked,
            motionBlur: layer.motionBlur,
            adjustmentLayer: layer.adjustmentLayer,
            guideLayer: layer.guideLayer
        }

    };

    if (layer.threeDLayer) {

        data.transform.xRotation = layer.xRotation.value;
        data.transform.yRotation = layer.yRotation.value;
        data.transform.zRotation = layer.zRotation.value;

    } else {

        data.transform.rotation = layer.rotation.value;

    }

    var file = File.saveDialog(
        "Save Formatting.json",
        "*.json"
    );

    if (!file) return;

    file.encoding = "UTF-8";

    file.open("w");
    file.write(stringify(data));
    file.close();

    alert("Formatting exported successfully.");

    app.endUndoGroup();

})();
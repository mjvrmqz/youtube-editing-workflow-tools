function precompKeepSlot() {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Please select a composition.");
        return;
    }
    var selected = comp.selectedLayers;
    if (selected.length === 0) {
        alert("Please select at least one layer.");
        return;
    }

    // ---- Gather timing + bounds info before showing UI ----
    var earliestIn = selected[0].inPoint;
    var latestOut = selected[0].outPoint;
    var indices = [];

    // Bounding box union in comp pixel space.
    // Using sourceRectAtTime + the layer's own position/scale/anchor directly,
    // rather than toComp(), since toComp() can throw on layers with certain
    // transform states (zero scale, unresolved expressions, etc).
    var boundsValid = false;
    var minX, minY, maxX, maxY;
    var skippedBoundsCount = 0;

    for (var i = 0; i < selected.length; i++) {
        var layer = selected[i];
        indices.push(layer.index);
        if (layer.inPoint < earliestIn) earliestIn = layer.inPoint;
        if (layer.outPoint > latestOut) latestOut = layer.outPoint;

        if (layer instanceof CameraLayer || layer instanceof LightLayer) {
            skippedBoundsCount++;
            continue;
        }

        try {
            var r = layer.sourceRectAtTime(comp.time, false);
            if (r.width === 0 || r.height === 0) {
                skippedBoundsCount++;
                continue;
            }

            var pos = layer.transform.position.value;
            var anchor = layer.transform.anchorPoint.value;
            var scale = layer.transform.scale.value; // percentage, e.g. [100,100,100]

            var sx = scale[0] / 100;
            var sy = scale[1] / 100;

            // Layer-space corners relative to anchor, scaled, then offset by position.
            // (Rotation ignored for simplicity - see note below.)
            var localCorners = [
                [r.left, r.top],
                [r.left + r.width, r.top],
                [r.left, r.top + r.height],
                [r.left + r.width, r.top + r.height]
            ];

            for (var c = 0; c < localCorners.length; c++) {
                var lx = localCorners[c][0];
                var ly = localCorners[c][1];
                var x = pos[0] + (lx - anchor[0]) * sx;
                var y = pos[1] + (ly - anchor[1]) * sy;
                if (minX === undefined || x < minX) minX = x;
                if (minY === undefined || y < minY) minY = y;
                if (maxX === undefined || x > maxX) maxX = x;
                if (maxY === undefined || y > maxY) maxY = y;
                boundsValid = true;
            }
        } catch (e) {
            skippedBoundsCount++;
        }
    }

    var duration = latestOut - earliestIn;
    var topIndex = indices[0];
    for (var i = 1; i < indices.length; i++) {
        if (indices[i] < topIndex) topIndex = indices[i];
    }

    var defaultName = comp.name + " #1";
    var cropWidth, cropHeight, cropX, cropY;
    if (boundsValid) {
        cropWidth = Math.max(2, Math.round(maxX - minX));
        cropHeight = Math.max(2, Math.round(maxY - minY));
        cropX = minX;
        cropY = minY;
    }

    // ---- Build the dialog ----
    var win = new Window("dialog", "Precompose Options");
    win.orientation = "column";
    win.alignChildren = "left";

    win.add("statictext", undefined, "New comp name:");
    var nameField = win.add("edittext", undefined, defaultName);
    nameField.characters = 30;

    var collapseCheckbox = win.add("checkbox", undefined, "Collapse Transformation");
    collapseCheckbox.value = true;

    var threeDCheckbox = win.add("checkbox", undefined, "Switch precomp layer to 3D");
    threeDCheckbox.value = true;

    var cropCheckbox = win.add("checkbox", undefined, "Crop comp to layer bounds");
    cropCheckbox.value = boundsValid;
    if (!boundsValid) {
        cropCheckbox.enabled = false;
        var warn = win.add("statictext", undefined, "(No layer in selection has usable bounds)");
        warn.graphics.foregroundColor = warn.graphics.newPen(warn.graphics.PenType.SOLID_COLOR, [0.9, 0.6, 0.2], 1);
    } else if (skippedBoundsCount > 0) {
        var note = win.add("statictext", undefined, "(" + skippedBoundsCount + " layer(s) skipped - no bounds)");
    }

    var btnGroup = win.add("group");
    var okBtn = btnGroup.add("button", undefined, "OK", { name: "ok" });
    var cancelBtn = btnGroup.add("button", undefined, "Cancel", { name: "cancel" });

    var result = win.show();
    if (result !== 1) return; // user cancelled

    var newName = nameField.text || defaultName;
    var doCollapse = collapseCheckbox.value;
    var doThreeD = threeDCheckbox.value;
    var doCrop = cropCheckbox.value && boundsValid;

    // ---- Do the actual work ----
    app.beginUndoGroup("Precomp Keep Slot");

    var newComp = comp.layers.precompose(indices, newName, true);
    newComp.duration = duration;
    newComp.displayStartTime = 0;

    if (doCrop) {
        newComp.width = cropWidth;
        newComp.height = cropHeight;
    }

    // Snap every inner layer's time so the earliest layer starts at comp time 0.
    // precompose(..., true) preserves original absolute layer timing, so if the
    // selection didn't start at comp time 0 originally, inner layers won't
    // start at time 0 in the new comp unless we shift them here.
    var timeShift = -earliestIn;
    if (timeShift !== 0) {
        for (var j = 1; j <= newComp.numLayers; j++) {
            var innerLayer = newComp.layer(j);
            innerLayer.startTime += timeShift;
        }
    }

    var precompLayer = comp.layer(topIndex);
    precompLayer.startTime = earliestIn;
    precompLayer.inPoint = earliestIn;
    precompLayer.outPoint = latestOut;

    if (doCollapse) {
        precompLayer.collapseTransformation = true;
    }
    if (doThreeD) {
        precompLayer.threeDLayer = true;
    }

    // Also apply 3D / Collapse Transform to every layer INSIDE the new precomp,
    // skipping adjustment layers (they don't support 3D and collapse doesn't
    // apply to them the same way).
    for (var k = 1; k <= newComp.numLayers; k++) {
        var childLayer = newComp.layer(k);
        if (childLayer.adjustmentLayer) continue;

        if (doThreeD) {
            try { childLayer.threeDLayer = true; } catch (e) {}
        }
        if (doCollapse) {
            try { childLayer.collapseTransformation = true; } catch (e) {}
        }
    }

    // If we cropped, the new comp is smaller and its (0,0) origin no longer
    // lines up with the parent comp's original (0,0). We compensate by
    // shifting the precomp layer's ANCHOR POINT (not position) by the crop
    // offset. Anchor point shifts move correctly with the layer regardless
    // of collapse transform state, whereas manually offsetting position
    // fights with AE's own collapsed-transform math and corrupts
    // scale/position in the main comp.
    if (doCrop) {
        try {
            var curAnchor = precompLayer.transform.anchorPoint.value;
            precompLayer.transform.anchorPoint.setValue([
                curAnchor[0] + cropX,
                curAnchor[1] + cropY,
                curAnchor[2] || 0
            ]);
        } catch (e) {
            // anchor point unavailable (rare) - skip silently
        }
    }

    app.endUndoGroup();
}

precompKeepSlot();
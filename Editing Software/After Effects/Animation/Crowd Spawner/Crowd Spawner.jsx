// CrowdSpawner.jsx
// Select your 2 puppet precomp layers in the active comp, then run this script.
// It duplicates them into a randomized crowd, positioned within a Z range,
// with slight X/Y offsets, random horizontal flips, and staggered timing.

(function crowdSpawner() {

    // ---------- SETTINGS (tweak these) ----------
    var TOTAL_COPIES = 50;      // total crowd members to create (split across selected layers)
    var Z_MIN = -120;
    var Z_MAX = 611;
    var X_MIN = 300;            // random X position range (absolute, not offset)
    var X_MAX = 1300;
    var Y_JITTER = 80;          // +/- pixels random offset on Y
    var TIME_OFFSET_MAX = 1.5;  // ADJUST HERE: how many seconds earlier (before comp start) layers can begin (0 = no offset, all start exactly at frame 0)
    var FLIP_CHANCE = 0.5;      // probability (0-1) a duplicate gets horizontally flipped
    // ----------------------------------------------

    app.beginUndoGroup("Spawn Crowd");

    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
        alert("Please open/select an active comp first.");
        return;
    }

    var sourceLayers = [];
    for (var i = 1; i <= comp.selectedLayers.length; i++) {
        sourceLayers.push(comp.selectedLayers[i - 1]);
    }

    if (sourceLayers.length < 1) {
        alert("Please select your puppet precomp layer(s) first.");
        return;
    }

    var copiesPerSource = Math.floor(TOTAL_COPIES / sourceLayers.length);

    for (var s = 0; s < sourceLayers.length; s++) {
        var sourceLayer = sourceLayers[s];

        // Make sure layer is 3D so Z position works
        sourceLayer.threeDLayer = true;

        var basePos = sourceLayer.property("Transform").property("Position").value;
        var baseX = basePos[0];
        var baseY = basePos[1];

        for (var c = 0; c < copiesPerSource; c++) {
            var dup = sourceLayer.duplicate();
            dup.threeDLayer = true;

            // ---- Random position ----
            var randX = X_MIN + Math.random() * (X_MAX - X_MIN);
            var randY = baseY + (Math.random() * 2 - 1) * Y_JITTER;
            var randZ = Z_MIN + Math.random() * (Z_MAX - Z_MIN);
            dup.property("Transform").property("Position").setValue([randX, randY, randZ]);

            // ---- Random horizontal flip (some flipped, some kept the same) ----
            var scaleProp = dup.property("Transform").property("Scale");
            var baseScale = scaleProp.value; // [x, y, z]
            if (Math.random() < FLIP_CHANCE) {
                scaleProp.setValue([-Math.abs(baseScale[0]), baseScale[1], baseScale[2]]);
            } else {
                scaleProp.setValue([Math.abs(baseScale[0]), baseScale[1], baseScale[2]]);
            }

            // ---- Time offset: layers start at or before comp start (time 0) ----
            // never later, so every puppet is already visible/animating from frame 0
            var offset = Math.random() * TIME_OFFSET_MAX; // 0 to TIME_OFFSET_MAX seconds
            dup.startTime = -offset;

            // Rename for clarity
            dup.name = sourceLayer.name + "_crowd_" + (c + 1);
        }
    }

    app.endUndoGroup();
    alert("Crowd spawned: " + (copiesPerSource * sourceLayers.length) + " new layers created.");

})();
var MAP_START_TILE = 1;

function main() {
    if (typeof ui === "undefined") {
        return;
    }

    var windowState = createWindowState();

    ui.registerMenuItem("Generate multiplayer plots", function () {
        openMainWindow(windowState);
    });
}

function createWindowState() {
    return {
        plotsX: 4,
        plotsY: 4,
        plotXLength: 16,
        plotYLength: 24,
        pathWidth: 2,
        outerMargin: 2,
        landHeight: 14,
        terrainSurfaceSelection: 0,
        terrainEdgeSelection: 0,
        pathSurfaceSelection: 0,
        railingSelection: 0,
        isGenerating: false
    };
}

function openMainWindow(state) {
    var existing = ui.getWindow("build-plot-generator");
    if (existing) {
        existing.bringToFront();
        return;
    }

    var pathOptions = getAvailablePathObjects();
    if (!pathOptions) {
        ui.showError("Missing path objects", "Could not find loaded path surfaces and railing styles.");
        return;
    }

    var terrainOptions = getAvailableTerrainObjects();
    if (!terrainOptions) {
        ui.showError("Missing terrain objects", "Could not find loaded terrain surfaces and edge styles.");
        return;
    }

    state.pathSurfaceSelection = clampInt(state.pathSurfaceSelection, 0, pathOptions.surfaces.length - 1);
    state.railingSelection = clampInt(state.railingSelection, 0, pathOptions.railings.length - 1);
    state.terrainSurfaceSelection = clampInt(state.terrainSurfaceSelection, 0, terrainOptions.surfaces.length - 1);
    state.terrainEdgeSelection = clampInt(state.terrainEdgeSelection, 0, terrainOptions.edges.length - 1);

    ui.openWindow({
        classification: "build-plot-generator",
        title: "Multiplayer Plot Generator",
        width: 390,
        height: 333,
        minWidth: 390,
        maxWidth: 390,
        minHeight: 333,
        maxHeight: 333,
        colours: [24, 26],
        widgets: [
            makeLabel("plotsXLabel", 10, 20, 110, 14, "Plots in X"),
            makeSpinner("plotsX", String(state.plotsX), 130, 18, 250, 14, function () {
                updateSpinnerValue("plotsX", clampInt(state.plotsX - 1, 1, 256));
            }, function () {
                updateSpinnerValue("plotsX", clampInt(state.plotsX + 1, 1, 256));
            }),

            makeLabel("plotsYLabel", 10, 42, 110, 14, "Plots in Y"),
            makeSpinner("plotsY", String(state.plotsY), 130, 40, 250, 14, function () {
                updateSpinnerValue("plotsY", clampInt(state.plotsY - 1, 1, 256));
            }, function () {
                updateSpinnerValue("plotsY", clampInt(state.plotsY + 1, 1, 256));
            }),

            makeLabel("plotXLengthLabel", 10, 64, 110, 14, "Plot X Length"),
            makeSpinner("plotXLength", String(state.plotXLength), 130, 62, 250, 14, function () {
                updateSpinnerValue("plotXLength", clampInt(state.plotXLength - 1, 1, 256));
            }, function () {
                updateSpinnerValue("plotXLength", clampInt(state.plotXLength + 1, 1, 256));
            }),

            makeLabel("plotYLengthLabel", 10, 86, 110, 14, "Plot Y Length"),
            makeSpinner("plotYLength", String(state.plotYLength), 130, 84, 250, 14, function () {
                updateSpinnerValue("plotYLength", clampInt(state.plotYLength - 1, 1, 256));
            }, function () {
                updateSpinnerValue("plotYLength", clampInt(state.plotYLength + 1, 1, 256));
            }),

            makeLabel("pathWidthLabel", 10, 108, 110, 14, "Path Width"),
            makeSpinner("pathWidth", String(state.pathWidth), 130, 106, 250, 14, function () {
                updateSpinnerValue("pathWidth", clampInt(state.pathWidth - 1, 1, 64));
            }, function () {
                updateSpinnerValue("pathWidth", clampInt(state.pathWidth + 1, 1, 64));
            }),

            makeLabel("outerMarginLabel", 10, 130, 110, 14, "Outer Margin"),
            makeSpinner("outerMargin", String(state.outerMargin), 130, 128, 250, 14, function () {
                updateSpinnerValue("outerMargin", clampInt(state.outerMargin - 1, 0, 128));
            }, function () {
                updateSpinnerValue("outerMargin", clampInt(state.outerMargin + 1, 0, 128));
            }),

            makeLabel("landHeightLabel", 10, 152, 110, 14, "Land Height"),
            makeSpinner("landHeight", String(state.landHeight), 130, 150, 250, 14, function () {
                updateSpinnerValue("landHeight", clampLandHeight(state.landHeight - 2));
            }, function () {
                updateSpinnerValue("landHeight", clampLandHeight(state.landHeight + 2));
            }),

            makeLabel("terrainSurfaceLabel", 10, 174, 110, 14, "Terrain Surface"),
            {
                type: "dropdown",
                name: "terrainSurface",
                x: 130,
                y: 172,
                width: 250,
                height: 12,
                items: buildObjectNames(terrainOptions.surfaces),
                selectedIndex: state.terrainSurfaceSelection,
                onChange: function (index) {
                    state.terrainSurfaceSelection = index;
                }
            },

            makeLabel("terrainEdgeLabel", 10, 196, 110, 14, "Terrain Edge"),
            {
                type: "dropdown",
                name: "terrainEdge",
                x: 130,
                y: 194,
                width: 250,
                height: 12,
                items: buildObjectNames(terrainOptions.edges),
                selectedIndex: state.terrainEdgeSelection,
                onChange: function (index) {
                    state.terrainEdgeSelection = index;
                }
            },

            makeLabel("pathSurfaceLabel", 10, 218, 110, 14, "Path Style"),
            {
                type: "dropdown",
                name: "pathSurface",
                x: 130,
                y: 216,
                width: 250,
                height: 12,
                items: buildObjectNames(pathOptions.surfaces),
                selectedIndex: state.pathSurfaceSelection,
                onChange: function (index) {
                    state.pathSurfaceSelection = index;
                }
            },

            makeLabel("railingStyleLabel", 10, 240, 110, 14, "Railing Style"),
            {
                type: "dropdown",
                name: "railingStyle",
                x: 130,
                y: 238,
                width: 250,
                height: 12,
                items: buildObjectNames(pathOptions.railings),
                selectedIndex: state.railingSelection,
                onChange: function (index) {
                    state.railingSelection = index;
                }
            },

            {
                type: "button",
                name: "generateButton",
                x: 10,
                y: 280,
                width: 370,
                height: 16,
                text: "Generate",
                onClick: function () {
                    runGeneration(state);
                }
            }
        ]
    });

    function updateSpinnerValue(key, value) {
        state[key] = value;
        var window = ui.getWindow("build-plot-generator");
        if (!window) {
            return;
        }

        var widget = window.findWidget(key);
        if (widget) {
            widget.text = String(value);
        }
    }
}

function makeLabel(name, x, y, width, height, text) {
    return {
        type: "label",
        name: name,
        x: x,
        y: y,
        width: width,
        height: height,
        text: text
    };
}

function makeSpinner(name, text, x, y, width, height, onDecrement, onIncrement) {
    return {
        type: "spinner",
        name: name,
        x: x,
        y: y,
        width: width,
        height: height,
        text: text,
        onDecrement: onDecrement,
        onIncrement: onIncrement,
        onClick: function () {
            promptForNumber(name);
        }
    };
}

function promptForNumber(key) {
    var titles = {
        plotsX: "Plots in X",
        plotsY: "Plots in Y",
        plotXLength: "Plot X Length",
        plotYLength: "Plot Y Length",
        pathWidth: "Path Width",
        outerMargin: "Outer Margin",
        landHeight: "Land Height"
    };

    var mins = {
        plotsX: 1,
        plotsY: 1,
        plotXLength: 1,
        plotYLength: 1,
        pathWidth: 1,
        outerMargin: 0,
        landHeight: 0
    };

    var maxs = {
        plotsX: 256,
        plotsY: 256,
        plotXLength: 256,
        plotYLength: 256,
        pathWidth: 64,
        outerMargin: 128,
        landHeight: 248
    };

    var window = ui.getWindow("build-plot-generator");
    if (!window) {
        return;
    }

    ui.showTextInput({
        title: titles[key],
        description: "Enter a whole number between " + mins[key] + " and " + maxs[key] + ".",
        initialValue: window.findWidget(key).text,
        callback: function (value) {
            var parsed = parseInt(value, 10);
            if (isNaN(parsed)) {
                ui.showError("Invalid value", "Please enter a whole number.");
                return;
            }

            if (key === "landHeight") {
                parsed = clampLandHeight(parsed);
            } else {
                parsed = clampInt(parsed, mins[key], maxs[key]);
            }
            window.findWidget(key).text = String(parsed);
        }
    });
}

function readStateFromWindow(window, state) {
    state.plotsX = parseSpinnerValue(window, "plotsX", 1);
    state.plotsY = parseSpinnerValue(window, "plotsY", 1);
    state.plotXLength = parseSpinnerValue(window, "plotXLength", 1);
    state.plotYLength = parseSpinnerValue(window, "plotYLength", 1);
    state.pathWidth = parseSpinnerValue(window, "pathWidth", 1);
    state.outerMargin = parseSpinnerValue(window, "outerMargin", 0);
    state.landHeight = clampLandHeight(parseSpinnerValue(window, "landHeight", 0));
    window.findWidget("landHeight").text = String(state.landHeight);
    state.terrainSurfaceSelection = window.findWidget("terrainSurface").selectedIndex;
    state.terrainEdgeSelection = window.findWidget("terrainEdge").selectedIndex;
    state.pathSurfaceSelection = window.findWidget("pathSurface").selectedIndex;
    state.railingSelection = window.findWidget("railingStyle").selectedIndex;
}

function parseSpinnerValue(window, name, min) {
    var widget = window.findWidget(name);
    var parsed = parseInt(widget.text, 10);
    if (isNaN(parsed) || parsed < min) {
        return min;
    }
    return parsed;
}

function runGeneration(state) {
    var window = ui.getWindow("build-plot-generator");
    if (!window) {
        return;
    }

    if (state.isGenerating) {
        ui.showError("Generation in progress", "Please wait for the current plot generation to finish.");
        return;
    }

    readStateFromWindow(window, state);

    if (context.mode !== "normal" && context.mode !== "scenario_editor") {
        ui.showError("Unsupported mode", "Open a map or scenario editor before generating plots.");
        return;
    }

    var pathObjects = getSelectedPathObjects(state);
    if (!pathObjects) {
        ui.showError("Missing path objects", "Could not find a loaded path surface and railing style.");
        return;
    }

    var terrainObjects = getSelectedTerrainObjects(state);
    if (!terrainObjects) {
        ui.showError("Missing terrain objects", "Could not find a loaded terrain surface and edge style.");
        return;
    }

    var layout = buildLayout(state);
    if (!layout) {
        ui.showError("Layout failed", "Could not generate a valid layout from the current values.");
        return;
    }

    var previousSandbox = cheats.sandboxMode;
    cheats.sandboxMode = true;
    state.isGenerating = true;

    clearPathsThenGenerate(layout, pathObjects, terrainObjects, state, previousSandbox);
}

function getAvailableTerrainObjects() {
    var surfaces = objectManager.getAllObjects("terrain_surface");
    var edges = objectManager.getAllObjects("terrain_edge");

    if (!surfaces || !surfaces.length || !edges || !edges.length) {
        return null;
    }

    return {
        surfaces: surfaces,
        edges: edges
    };
}

function getAvailablePathObjects() {
    var surfaces = objectManager.getAllObjects("footpath_surface");
    var railings = objectManager.getAllObjects("footpath_railings");

    if (!surfaces || !surfaces.length || !railings || !railings.length) {
        return null;
    }

    return {
        surfaces: surfaces,
        railings: railings
    };
}

function getSelectedTerrainObjects(state) {
    var terrainOptions = getAvailableTerrainObjects();
    if (!terrainOptions) {
        return null;
    }

    var surfaceIndex = clampInt(state.terrainSurfaceSelection, 0, terrainOptions.surfaces.length - 1);
    var edgeIndex = clampInt(state.terrainEdgeSelection, 0, terrainOptions.edges.length - 1);

    state.terrainSurfaceSelection = surfaceIndex;
    state.terrainEdgeSelection = edgeIndex;

    return {
        surface: terrainOptions.surfaces[surfaceIndex],
        edge: terrainOptions.edges[edgeIndex]
    };
}

function getSelectedPathObjects(state) {
    var pathOptions = getAvailablePathObjects();
    if (!pathOptions) {
        return null;
    }

    var surfaceIndex = clampInt(state.pathSurfaceSelection, 0, pathOptions.surfaces.length - 1);
    var railingIndex = clampInt(state.railingSelection, 0, pathOptions.railings.length - 1);

    state.pathSurfaceSelection = surfaceIndex;
    state.railingSelection = railingIndex;

    return {
        surface: pathOptions.surfaces[surfaceIndex],
        railings: pathOptions.railings[railingIndex]
    };
}

function buildObjectNames(objects) {
    var names = [];
    var i;

    for (i = 0; i < objects.length; i++) {
        names.push(objects[i].name);
    }

    return names;
}

function buildLayout(state) {
    var plotRects = [];
    var pathTiles = {};
    var occupiedTiles = {};
    var buildAreaStart = MAP_START_TILE + state.outerMargin;
    var startX = buildAreaStart + state.pathWidth;
    var startY = buildAreaStart + state.pathWidth;

    var rowOffsets = buildRowOffsets(state);
    var columnOffsets = buildColumnOffsets(state);

    var row;
    var column;
    for (row = 0; row < state.plotsY; row++) {
        for (column = 0; column < state.plotsX; column++) {
            var size = getPlotSize(state, column, row);
            var rect = {
                x: startX + rowOffsets[row][column],
                y: startY + columnOffsets[column][row],
                width: size.width,
                height: size.height
            };

            plotRects.push(rect);
            markRectangle(occupiedTiles, rect.x, rect.y, rect.width, rect.height);
        }
    }

    for (row = 0; row < plotRects.length; row++) {
        var plot = plotRects[row];
        var minX = plot.x - state.pathWidth;
        var maxX = plot.x + plot.width + state.pathWidth - 1;
        var minY = plot.y - state.pathWidth;
        var maxY = plot.y + plot.height + state.pathWidth - 1;
        var y;
        var x;

        for (y = minY; y <= maxY; y++) {
            for (x = minX; x <= maxX; x++) {
                if (x < buildAreaStart || y < buildAreaStart) {
                    continue;
                }

                if (isInsideRectangle(x, y, plot)) {
                    continue;
                }

                if (occupiedTiles[keyForTile(x, y)]) {
                    continue;
                }

                pathTiles[keyForTile(x, y)] = { x: x, y: y };
            }
        }
    }

    var extents = getTileExtents(pathTiles, occupiedTiles);
    if (!extents) {
        return null;
    }

    return {
        width: extents.maxX + state.outerMargin + MAP_START_TILE + 1,
        height: extents.maxY + state.outerMargin + MAP_START_TILE + 1,
        pathTiles: pathTiles
    };
}

function buildRowOffsets(state) {
    var rows = [];
    var row;
    var column;

    for (row = 0; row < state.plotsY; row++) {
        var offsets = [];
        var x = 0;

        for (column = 0; column < state.plotsX; column++) {
            offsets.push(x);
            x += getPlotSize(state, column, row).width + state.pathWidth;
        }

        rows.push(offsets);
    }

    return rows;
}

function buildColumnOffsets(state) {
    var columns = [];
    var column;
    var row;

    for (column = 0; column < state.plotsX; column++) {
        var offsets = [];
        var y = 0;

        for (row = 0; row < state.plotsY; row++) {
            offsets.push(y);
            y += getPlotSize(state, column, row).height + state.pathWidth;
        }

        columns.push(offsets);
    }

    return columns;
}

function getPlotSize(state, column, row) {
    if (((column + row) % 2) === 0) {
        return {
            width: state.plotXLength,
            height: state.plotYLength
        };
    }

    return {
        width: state.plotYLength,
        height: state.plotXLength
    };
}

function clearPathsThenGenerate(layout, pathObjects, terrainObjects, state, previousSandbox) {
    var existingPaths = collectExistingPaths();

    if (!existingPaths.length) {
        resizeMapAndGenerate(layout, pathObjects, terrainObjects, state, previousSandbox);
        return;
    }

    removePathsInBatches(
        existingPaths,
        function () {
            resizeMapAndGenerate(layout, pathObjects, terrainObjects, state, previousSandbox);
        },
        function (error) {
            state.isGenerating = false;
            cheats.sandboxMode = previousSandbox;
            ui.showError("Path removal failed", String(error));
        }
    );
}

function resizeMapAndGenerate(layout, pathObjects, terrainObjects, state, previousSandbox) {
    var resizeArgs = {
        targetSizeX: layout.width,
        targetSizeY: layout.height,
        shiftX: 0,
        shiftY: 0
    };

    context.queryAction("mapchangesize", resizeArgs, function (queryResult) {
        if (queryResult && queryResult.error) {
            state.isGenerating = false;
            cheats.sandboxMode = previousSandbox;
            showActionError(queryResult, "Resize failed");
            return;
        }

        context.executeAction("mapchangesize", resizeArgs, function (resizeResult) {
            if (resizeResult && resizeResult.error) {
                state.isGenerating = false;
                cheats.sandboxMode = previousSandbox;
            showActionError(resizeResult, "Resize failed");
            return;
        }

            setAllLandHeight(
                state.landHeight,
                function () {
                    setTerrainStyles(
                        terrainObjects,
                        function () {
                            placePathsInBatches(
                                getSortedPathTiles(layout.pathTiles),
                                pathObjects.surface.index,
                                pathObjects.railings.index,
                                function () {
                                    setAllLandOwned(
                                        function () {
                                            state.isGenerating = false;
                                            cheats.sandboxMode = previousSandbox;
                                            park.postMessage(
                                                "Build Plot Generator created " +
                                                (state.plotsX * state.plotsY) +
                                                " plots on a " +
                                                layout.width +
                                                " x " +
                                                layout.height +
                                                " map, with all land owned."
                                            );
                                        },
                                        function (result) {
                                            state.isGenerating = false;
                                            cheats.sandboxMode = previousSandbox;
                                            showActionError(result, "Land ownership failed");
                                        }
                                    );
                                },
                                function (error) {
                                    state.isGenerating = false;
                                    cheats.sandboxMode = previousSandbox;
                                    ui.showError("Path placement failed", String(error));
                                }
                            );
                        },
                        function (result) {
                            state.isGenerating = false;
                            cheats.sandboxMode = previousSandbox;
                            showActionError(result, "Terrain style failed");
                        }
                    );
                },
                function (error) {
                    state.isGenerating = false;
                    cheats.sandboxMode = previousSandbox;
                    ui.showError("Land height failed", String(error));
                }
            );
        });
    });
}

function setAllLandHeight(targetHeight, onComplete, onError) {
    var size = map.size;
    var batchSize = 256;
    var x = MAP_START_TILE;
    var y = MAP_START_TILE;
    var mapEndX = size.x - MAP_START_TILE;
    var mapEndY = size.y - MAP_START_TILE;

    function processBatch() {
        try {
            var processed = 0;
            while (y < mapEndY && processed < batchSize) {
                var surface = getSurfaceElement(x, y);
                if (surface) {
                    surface.baseHeight = targetHeight;
                    surface.clearanceHeight = targetHeight;
                    surface.slope = 0;
                    surface.waterHeight = 0;
                }

                processed++;
                x++;
                if (x >= mapEndX) {
                    x = MAP_START_TILE;
                    y++;
                }
            }

            if (y < mapEndY) {
                context.setTimeout(processBatch, 1);
                return;
            }

            onComplete();
        } catch (error) {
            onError(error);
        }
    }

    processBatch();
}

function setTerrainStyles(terrainObjects, onComplete, onError) {
    var size = map.size;
    var args = {
        x1: MAP_START_TILE * 32,
        y1: MAP_START_TILE * 32,
        x2: (size.x - MAP_START_TILE - 1) * 32,
        y2: (size.y - MAP_START_TILE - 1) * 32,
        surfaceStyle: terrainObjects.surface.index,
        edgeStyle: terrainObjects.edge.index
    };

    context.queryAction("surfacesetstyle", args, function (queryResult) {
        if (queryResult && queryResult.error) {
            onError(queryResult);
            return;
        }

        context.executeAction("surfacesetstyle", args, function (executeResult) {
            if (executeResult && executeResult.error) {
                onError(executeResult);
                return;
            }

            onComplete();
        });
    });
}

function collectExistingPaths() {
    var paths = [];
    var size = map.size;
    var x;
    var y;
    var mapEndX = size.x - MAP_START_TILE;
    var mapEndY = size.y - MAP_START_TILE;

    for (y = MAP_START_TILE; y < mapEndY; y++) {
        for (x = MAP_START_TILE; x < mapEndX; x++) {
            var tile = map.getTile(x, y);
            var i;

            for (i = 0; i < tile.numElements; i++) {
                var element = tile.getElement(i);
                if (element.type === "footpath") {
                    paths.push({
                        x: x,
                        y: y,
                        z: element.baseZ
                    });
                }
            }
        }
    }

    return paths;
}

function removePathsInBatches(paths, onComplete, onError) {
    var batchSize = 64;
    var index = 0;

    function processBatch() {
        try {
            var end = Math.min(index + batchSize, paths.length);
            while (index < end) {
                var path = paths[index];
                context.executeAction("footpathremove", {
                    x: path.x * 32,
                    y: path.y * 32,
                    z: path.z
                });
                index++;
            }

            if (index < paths.length) {
                context.setTimeout(processBatch, 1);
                return;
            }

            onComplete();
        } catch (error) {
            onError(error);
        }
    }

    processBatch();
}

function setAllLandOwned(onComplete, onError) {
    var size = map.size;
    var args = {
        x1: MAP_START_TILE * 32,
        y1: MAP_START_TILE * 32,
        x2: (size.x - MAP_START_TILE - 1) * 32,
        y2: (size.y - MAP_START_TILE - 1) * 32,
        setting: 4,
        ownership: 32
    };

    context.queryAction("landsetrights", args, function (queryResult) {
        if (queryResult && queryResult.error) {
            onError(queryResult);
            return;
        }

        context.executeAction("landsetrights", args, function (executeResult) {
            if (executeResult && executeResult.error) {
                onError(executeResult);
                return;
            }

            onComplete();
        });
    });
}

function placePathsInBatches(pathTiles, surfaceObject, railingsObject, onComplete, onError) {
    var batchSize = 64;
    var index = 0;

    function processBatch() {
        try {
            var end = Math.min(index + batchSize, pathTiles.length);
            while (index < end) {
                placeSinglePath(pathTiles[index], surfaceObject, railingsObject);
                index++;
            }

            if (index < pathTiles.length) {
                context.setTimeout(processBatch, 1);
                return;
            }

            onComplete();
        } catch (error) {
            onError(error);
        }
    }

    processBatch();
}

function placeSinglePath(tile, surfaceObject, railingsObject) {
    var surface = getSurfaceElement(tile.x, tile.y);
    if (!surface) {
        return;
    }

    context.executeAction("footpathplace", {
        x: tile.x * 32,
        y: tile.y * 32,
        z: surface.baseZ,
        direction: 255,
        object: surfaceObject,
        railingsObject: railingsObject,
        slopeType: 0,
        slopeDirection: 0,
        constructFlags: 0
    });
}

function getSurfaceElement(tileX, tileY) {
    var tile = map.getTile(tileX, tileY);
    var i;

    for (i = 0; i < tile.numElements; i++) {
        var element = tile.getElement(i);
        if (element.type === "surface") {
            return element;
        }
    }

    return null;
}

function markRectangle(store, x, y, width, height) {
    var iy;
    var ix;
    for (iy = y; iy < y + height; iy++) {
        for (ix = x; ix < x + width; ix++) {
            store[keyForTile(ix, iy)] = true;
        }
    }
}

function isInsideRectangle(x, y, rect) {
    return x >= rect.x && x < rect.x + rect.width && y >= rect.y && y < rect.y + rect.height;
}

function getTileExtents(pathTiles, occupiedTiles) {
    var maxX = -1;
    var maxY = -1;
    var keys = Object.keys(pathTiles);
    var i;

    for (i = 0; i < keys.length; i++) {
        var pathTile = pathTiles[keys[i]];
        if (pathTile.x > maxX) {
            maxX = pathTile.x;
        }
        if (pathTile.y > maxY) {
            maxY = pathTile.y;
        }
    }

    keys = Object.keys(occupiedTiles);
    for (i = 0; i < keys.length; i++) {
        var parts = keys[i].split(",");
        var x = parseInt(parts[0], 10);
        var y = parseInt(parts[1], 10);
        if (x > maxX) {
            maxX = x;
        }
        if (y > maxY) {
            maxY = y;
        }
    }

    if (maxX < 0 || maxY < 0) {
        return null;
    }

    return {
        maxX: maxX,
        maxY: maxY
    };
}

function getSortedPathTiles(pathTiles) {
    var keys = Object.keys(pathTiles);
    var tiles = [];
    var i;

    for (i = 0; i < keys.length; i++) {
        tiles.push(pathTiles[keys[i]]);
    }

    tiles.sort(function (a, b) {
        if (a.y !== b.y) {
            return a.y - b.y;
        }
        return a.x - b.x;
    });

    return tiles;
}

function keyForTile(x, y) {
    return x + "," + y;
}

function clampInt(value, min, max) {
    if (value < min) {
        return min;
    }
    if (value > max) {
        return max;
    }
    return value;
}

function clampLandHeight(value) {
    var clamped = clampInt(value, 0, 248);
    if ((clamped % 2) !== 0) {
        clamped -= 1;
    }
    return clamped;
}

function showActionError(result, fallbackTitle) {
    var title = result && result.errorTitle ? result.errorTitle : fallbackTitle;
    var message = result && result.errorMessage ? result.errorMessage : "OpenRCT2 rejected the requested action.";
    ui.showError(title, message);
}

registerPlugin({
    name: "Multiplayer Plot Generator",
    version: "0.1.0",
    authors: ["Multiplayer Plot Generator contributors"],
    type: "local",
    licence: "MIT",
    minApiVersion: 77,
    targetApiVersion: context.apiVersion,
    main: main
});

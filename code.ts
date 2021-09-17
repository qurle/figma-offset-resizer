// This plugin resizes frames or component to a fixed offset from their contents.

// The 'input' event listens for text change in the Quick Actions box after a plugin is 'Tabbed' into.
figma.parameters.on("input", ({ query, result }: ParameterInputEvent) => {
    const offsetSizes = ["8", "16", "24", "48", "64"]
    result.setSuggestions(offsetSizes.filter((s) => s.includes(query)))
})

// When the user presses Enter after inputting all parameters, the 'run' event is fired.
figma.on("run", ({ parameters }: RunEvent) => {
    if (parameters) {
        startPluginWithParameters(parameters)
    }
})

function startPluginWithParameters(parameters: ParameterValues) {
    const offset = parseInt(parameters["offset"])

    // Check the input parameters make sense
    if (isNaN(offset) || offset < 0) {
        figma.notify("Try entering a positive number")
    } else {
        // Get the selection of frames
        const selection = figma.currentPage.selection.filter(
            (node) =>
                (node.type === "FRAME" ||
                    node.type === "COMPONENT" ||
                    node.type === "COMPONENT_SET") &&
                node.children.length > 0
        )

        if (selection.length > 0) {
            selection.forEach((item) => {
                resizeWithOffset(item, offset)
            })
            if (selection.length === 1) {
                figma.notify("1 layer resized")
            } else {
                figma.notify(`${selection.length} layers resized`)
            }
        } else {
            figma.notify("Select at least one frame or component")
        }
    }

    // Make sure to close the plugin when you're done. Otherwise the plugin will
    // keep running, which shows the cancel button at the bottom of the screen.
    figma.closePlugin()
}

function resizeWithOffset(parent, offset) {
    const children = parent.children

    if (children.length === 0) return

    if (parent.layoutMode === "NONE") {
        // Calculate bounding box
        const topLeftX = Math.min(...children.map((child) => child.x))
        const topLeftY = Math.min(...children.map((child) => child.y))
        const bottomRigthX = Math.max(
            ...children.map((child) => child.x + child.width)
        )
        const bottomRigthY = Math.max(
            ...children.map((child) => child.y + child.height)
        )
        const width = bottomRigthX - topLeftX
        const height = bottomRigthY - topLeftY

        // Move and resize parent
        parent.x = parent.x + topLeftX - offset
        parent.y = parent.y + topLeftY - offset
        parent.resizeWithoutConstraints(width + offset * 2, height + offset * 2)

        // Children move with parent, so they need to be moved back
        children.forEach((child) => {
            child.x = child.x - topLeftX + offset
            child.y = child.y - topLeftY + offset
        })
    } else {
        parent.x = parent.x + parent.paddingLeft - offset
        parent.y = parent.y + parent.paddingTop - offset
        parent.paddingLeft = offset
        parent.paddingRight = offset
        parent.paddingTop = offset
        parent.paddingBottom = offset
    }
}

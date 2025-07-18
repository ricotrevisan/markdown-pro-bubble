    
    try {
        // Store initial state - converter will be created in update
        instance.data.currentStyle = "Default";
        instance.data.stylesheetIsSetup = false;
        instance.data.currentLatexEnabled = null; // Track latex state changes
    } catch(error) {
        console.error("error", error);
    }
    
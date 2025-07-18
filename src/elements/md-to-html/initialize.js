
    
    
    try {



        const converter = new showdown.Converter({
            extensions: [
                showdownKatex({
                    displayMode: true,
                    throwOnError: false, // allows katex to fail silently
                    errorColor: '#ff0000',
                    delimiters: [
                        { left: '~', right: '~', display: false, asciimath: true },
                        { left: "$$", right: "$$", display: true }, // For display mode
                        { left: "$", right: "$", display: false },  // For inline mode
                        { left: "\\(", right: "\\)", display: false }, // Alternative inline
                        { left: "\\[", right: "\\]", display: true }  
                    ],
                })
            ]
        }
                                                              );
        converter.setOption("tables", true);
        converter.setOption("simpleLineBreaks", true);
        converter.setOption("smoothLivePreview", true);
        converter.setOption("parseImgDimensions", true);
        converter.setOption("strikethrough", true);
        converter.setOption("emoji", true);
        converter.setOption("disableForced4SpacesIndentedSublists", true);
        converter.setOption("openLinksInNewWindow", false);

        instance.data.converter = converter;
        window.showdownJS = converter;
        instance.data.currentStyle = "Default";
        instance.data.stylesheetIsSetup = false;
    } catch(error) {
        console.error("error", error);
    }
    

    
  instance.data.nextStyle = properties.style;

  if (!!properties.dynamicStyle) {
    instance.data.nextStyle = properties.dynamicStyle;
  }

  if (instance.data.currentStyle !== instance.data.nextStyle) {
    document
      .querySelector(`link[title="${instance.data.nextStyle}"]`)
      .removeAttribute("disabled");
    document
      .querySelector(`link[title="${instance.data.currentStyle}"]`)
      .setAttribute("disabled", "disabled");
    instance.data.currentStyle = instance.data.nextStyle;
  }

  // Check if LaTeX setting changed or converter doesn't exist
  if (instance.data.currentLatexEnabled !== properties.latex || !instance.data.converter) {
    // Create converter with or without KaTeX extension
    const extensions = [];
    
    if (properties.latex) {
      extensions.push(showdownKatex({
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
      }));
    }

    const converter = new showdown.Converter({ extensions });
    
    // Set all showdown options
    converter.setOption("tables", properties.tables);
    converter.setOption("simpleLineBreaks", properties.simplelinebreaks);
    converter.setOption("smoothLivePreview", properties.smoothlivepreview);
    converter.setOption("parseImgDimensions", properties.parseimgdimensions);
    converter.setOption("strikethrough", properties.strikethrough);
    converter.setOption("emoji", properties.emoji);
    converter.setOption("disableForced4SpacesIndentedSublists", properties.disableForced4SpacesIndentedSublists);
    converter.setOption("openLinksInNewWindow", properties.openLinksInNewWindow);

    instance.data.converter = converter;
    window.showdownJS = converter;
    instance.data.currentLatexEnabled = properties.latex;
  } else {
    // Just update showdown options if converter exists and latex setting unchanged
    instance.data.converter.setOption("tables", properties.tables);
    instance.data.converter.setOption("simpleLineBreaks", properties.simplelinebreaks);
    instance.data.converter.setOption("smoothLivePreview", properties.smoothlivepreview);
    instance.data.converter.setOption("parseImgDimensions", properties.parseimgdimensions);
    instance.data.converter.setOption("strikethrough", properties.strikethrough);
    instance.data.converter.setOption("emoji", properties.emoji);
    instance.data.converter.setOption("disableForced4SpacesIndentedSublists", properties.disableForced4SpacesIndentedSublists);
    instance.data.converter.setOption("openLinksInNewWindow", properties.openLinksInNewWindow);
  }

  let text = properties.markdown,
    html = instance.data.converter.makeHtml(text);

  instance.publishState("html", html);
  instance.triggerEvent("md_converted");
  
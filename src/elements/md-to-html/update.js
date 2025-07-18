
    
  instance.data.nextStyle = properties.style;

  if (!!properties.dynamicStyle) {
    instance.data.nextStyle = properties.dynamicStyle;
  }


  if (instance.data.currentStyle !== instance.data.nextStyle) {
    document
      .querySelector(`link[title="${instance.data.nextStyle}"]`)
      .removeAttribute("disabled");
    //        	.setAttribute("disabled", "true");
    document
      .querySelector(`link[title="${instance.data.currentStyle}"]`)
      .setAttribute("disabled", "disabled");
    instance.data.currentStyle = instance.data.nextStyle;
  }

  // switches
  instance.data.converter.setOption("tables", properties.tables);
  instance.data.converter.setOption(
    "simpleLineBreaks",
    properties.simplelinebreaks
  );
  instance.data.converter.setOption(
    "smoothLivePreview",
    properties.smoothlivepreview
  );
  instance.data.converter.setOption(
    "parseImgDimensions",
    properties.parseimgdimensions
  );
  instance.data.converter.setOption("strikethrough", properties.strikethrough);
  instance.data.converter.setOption("emoji", properties.emoji);
  instance.data.converter.setOption(
    "disableForced4SpacesIndentedSublists",
    properties.disableForced4SpacesIndentedSublists
  );
  instance.data.converter.setOption(
    "openLinksInNewWindow",
    properties.openLinksInNewWindow
  );


  let text = properties.markdown,
    html = instance.data.converter.makeHtml(text);

  instance.publishState("html", html);
  instance.triggerEvent("md_converted");
  


module.exports = function headerSections(md) {

  function addSections(state) {
    var tokens = [];  // output
    var Token = state.Token;
    var sections = [];
    var nestedLevel = 0;

    function openSection(attrs) {
      var t = new Token('section_open', 'section', 1);
      t.block = true;
      t.attrs = attrs && attrs.map(function (attr) { return [attr[0], attr[1]] });  // copy
      return t;
    }

    function closeSection() {
      var t = new Token('section_close', 'section', -1);
      t.block = true;
      return t;
    }

    function closeSections(section) {
      while (last(sections) && section.header <= last(sections).header) {
        sections.pop();
        tokens.push(closeSection());
      }
    }

    function closeSectionsToCurrentNesting(nesting) {
      while (last(sections) && nesting < last(sections).nesting) {
        sections.pop();
        tokens.push(closeSection());
      }
    }

    function closeAllSections() {
      while (sections.pop()) {
        tokens.push(closeSection());
      }
    }

    for (var i = 0, l = state.tokens.length; i < l; i++) {
      var token = state.tokens[i];
      let keepToken = true;

      // record level of nesting
      if (token.type.search('heading') !== 0) {
        nestedLevel += token.nesting;
      }
      if (last(sections) && nestedLevel < last(sections).nesting) {
        closeSectionsToCurrentNesting(nestedLevel);
      }

      // add sections before headers
      if (token.type == 'heading_open') {
        var section = {
          header: headingLevel(token.tag),
          nesting: nestedLevel
        };
        if (last(sections) && section.header <= last(sections).header) {
          closeSections(section);
        }
        tokens.push(openSection(token.attrs));
        if (token.attrIndex('id') !== -1) {
          // remove ID from token
          token.attrs.splice(token.attrIndex('id'), 1);
        }
        sections.push(section);
      }
      else
      {
        if (token.type === 'hr') {
          const lastSection = last(sections);
          switch(token.markup){
            case '___': //3x_
              //close current section
              if (last(sections)) {
                keepToken = false;
                closeSections(section);
              }
              break;
            case '______': //6x_
              //close all sections
              if (last(sections)) {
                keepToken = false;
                closeAllSections();
              }
              break;
            case '---': //3x-
              //anon section
              keepToken = false;
              let lastHeader = 0;
              if (lastSection){
                lastHeader = lastSection.header;
              }
              var newSection = {
                header: headingLevel(`h${lastHeader}`),
                nesting: nestedLevel
              };
              tokens.push(openSection([]));
              sections.push(newSection);
              break;
            case '***': //3x*
              //split section
              if (lastSection) {
                keepToken = false;
                closeSections(section);
                var newSection = {
                  header: headingLevel(`h${lastSection.header}`),
                  nesting: nestedLevel
                };
                tokens.push(openSection([]));
                sections.push(newSection);
              }
              break;
          }
        }
      
      }
      if (keepToken)
        tokens.push(token);
    }  // end for every token
    closeAllSections();

    state.tokens = tokens;
  }

  md.core.ruler.push('header_sections', addSections);

};

function headingLevel(header) {
  return parseInt(header.charAt(1));
}

function last(arr) {
  return arr.slice(-1)[0];
}

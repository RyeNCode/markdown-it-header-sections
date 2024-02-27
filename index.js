
module.exports = function headerSections(md, options) {
  const defaults = {
    explicitCloseEnabled: false,
    explicitCloseOptions: {
      closeOneMarkDown: '___',
      closeAllMarkDown: '______',
      addAnanMarkDown: '---',
      splitSectionMarkDown: '***'
    }
  }

  const opts = md.utils.assign({}, defaults, options || {});

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
      else if (opts.explicitCloseEnabled)
      {
        //token type must be hr
        if (token.type === 'hr') {
          const lastSection = last(sections);
          if(token.markup === opts.explicitCloseOptions.closeOneMarkDown){
            //close current section
            if (last(sections)) {
              keepToken = false;
              closeSections(section);
            }
          }
          else if (token.markup === opts.explicitCloseOptions.closeAllMarkDown) {
            //close all sections
            if (last(sections)) {
              keepToken = false;
              closeAllSections();
            }
          }
          else if (token.markup === opts.explicitCloseOptions.addAnanMarkDown) {
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
          }
          else if (token.markup === opts.explicitCloseOptions.splitSectionMarkDown) {
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

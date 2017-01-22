import MarkdownIt from 'markdown-it';
import {toConstant} from 'constantinople';
import {Lexer} from 'pug-lexer';
import mdItContainer from './container';
import slug from 'slug';

/**
 * Parses the pug style tag & attributes
 */
function parseInfo(filename, startingLine, src) {
  const lexer = new Lexer(src, {filename, startingLine});
  if (!lexer.tag()) {
    lexer.fail();
  }
  const hasAttrs = lexer.attrs();
  const hasDot = lexer.dot();
  if (!lexer.eos()) {
    lexer.fail();
  }
  const attrs = {};
  if (hasAttrs) {
    lexer.tokens.filter(token => token.type === 'attribute').forEach(({name, val, line}) => {
      try {
        attrs[name] = toConstant(val);
      } catch (err) {
        throw new Error(`${JSON.stringify(val)} is not constant; used in ${filename}:${line}`);
      }
    });
  }
  return {component: lexer.tokens[0].val, attrs, hasDot};
}

class DocDown {
  constructor() {
    const md = new MarkdownIt({
      html: false,
      typographer: true,
    });
    md.use(mdItContainer, 'custom-element');
    this._md = md;
  }
  parse(filename, str) {
    const md = this._md;
    function parseInner(str, startingLine) {
      let tokens = md.parse(str, {});

      // this is a dirty, and I mean really dirty, hack to remove invalid duplicated tokens that get inserted when
      // custom elements immediately follow bullet lists
      let changed = true;
      function removeInvalidTokens(token, i, tokens) {
        if (token.type !== 'list_item_close' && tokens[i + 1] && tokens[i + 1].type === 'bullet_list_close') {
          changed = true;
          return false;
        }
        return true;
      }
      while (changed) {
        changed = false;
        tokens = tokens.filter(removeInvalidTokens);
      }

      function convertTokensToAst(tokens) {
        let i = 0;
        function toAst() {
          const nodes = [];
          for (; i < tokens.length && tokens[i].nesting >= 0; i++) {
            if (tokens[i].type === 'code_inline') {
              nodes.push({
                type: 'code_inline',
                code: tokens[i].content,
              });
            } else if (tokens[i].type === 'container_custom-element') {
              const line = tokens[i].map[0] + startingLine;
              const {component, attrs, hasDot} = parseInfo(
                filename,
                line,
                tokens[i].info.title.trim(),
              );
              const body = tokens[i].info.body.join('\n').trimEnd();
              let children;
              if (hasDot) {
                children = [{type: 'text', content: body}];
              } else {
                children = parseInner(body, line);
              }
              nodes.push({
                type: 'element',
                elementType: 'custom_element',
                tag: component,
                attrs,
                children,
              });
            } else if (tokens[i].type === 'fence') {
              nodes.push({
                type: 'code',
                lang: tokens[i].info,
                code: tokens[i].content.replace(/\n$/, ''),
              });
            } else if (tokens[i].type === 'text') {
              nodes.push({
                type: 'text',
                content: tokens[i].content,
              });
            } else if (tokens[i].type === 'inline') {
              nodes.push(...convertTokensToAst(tokens[i].children));
            } else if (tokens[i].nesting){
              const parent = tokens[i++];

              const node = {
                type: 'element',
                elementType: parent.type.replace(/_open$/, ''),
                tag: parent.tag,
                attrs: {},
                children: toAst(),
              };

              if (node.elementType === 'heading') {
                const lastChild = node.children[node.children.length - 1];
                if (lastChild.type === 'text' && lastChild.content.indexOf(' ~~ ') !== -1) {
                  const sp = lastChild.content.split(' ~~ ');
                  const anchor = sp.pop();
                  lastChild.content = sp.join(' ~~ ');
                  node.attrs.id = slug(anchor, {lower: true});
                } else {
                  const title = tokens[tokens.indexOf(parent) + 1].children
                    .map(token => {
                      if (token.type === 'code_inline') {
                        return token.content;
                      }
                      if (token.type === 'text') {
                        return token.content;
                      }
                      return '';
                    }).join('');
                  node.attrs.id = slug(title, {lower: true});
                }
                node.children.push({
                  type: 'element',
                  elementType: 'permalink',
                  tag: 'a',
                  attrs: {'aria-hidden': 'true', 'className': 'header-anchor', 'href': `#${node.attrs.id}`},
                  children: [{
                    type: 'text',
                    content: '¶',
                  }],
                });
              }
              nodes.push(node);
              // close token is automatically ignored because the next thing that happens is an increment
            } else {
              const parent = tokens[i];

              const node = {
                type: 'element',
                elementType: parent.type.replace(/_open$/, ''),
                tag: parent.tag,
                attrs: {},
                children: [],
              };
              nodes.push(node);
            }
          }
          return nodes;
        }
        return toAst();
      }
      return convertTokensToAst(tokens);
    }
    return parseInner(str, 0);
  }
}

module.exports = DocDown;

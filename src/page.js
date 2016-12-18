import React from 'react';

function toReact(node, {customElements, overrideElements, codeComponent, inlineCodeComponent}, i) {
  if (node.type === 'text') {
    return node.content;
  }
  if (node.type === 'code') {
    const CodeComponent = codeComponent;
    return <CodeComponent key={i} lang={node.lang} code={node.code} />;
  }
  if (node.type === 'code_inline') {
    const InlineCodeComponent = inlineCodeComponent;
    return <InlineCodeComponent key={i} code={node.code} />;
  }
  // node.type === 'element'
  const Component = (
    node.elementType === 'custom_element'
    ? customElements[node.tag]
    // TODO: suppor overriding all elements in a class (e.g. all headings)
    : overrideElements[node.tag] || node.tag
  );
  if (!Component) {
    throw new Error('Unrecognised component ' + node.tag);
  }
  // TODO: provide special rendering for headings
  return (
    <Component key={i} {...node.attrs}>
      {
        node.children.map((n, i) => toReact(
          n,
          {customElements, overrideElements, codeComponent, inlineCodeComponent},
          i,
        ))
      }
    </Component>
  );
}
function DefaultCodeComponent({lang, code}) {
  return <code>{code}</code>;
}
function DefaultInlineCodeComponent({code}) {
  return <code>{code}</code>;
}
function Page({data, customElements, overrideElements, codeComponent, inlineCodeComponent}) {
  customElements = customElements || {};
  overrideElements = overrideElements || {};
  codeComponent = codeComponent || DefaultCodeComponent;
  inlineCodeComponent = inlineCodeComponent || DefaultInlineCodeComponent;
  return (
    <div>
      {data.map((n, i) => toReact(n, {customElements, overrideElements, codeComponent, inlineCodeComponent}, i))}
    </div>
  );

}
export default Page;

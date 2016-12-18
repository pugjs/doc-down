# doc-down

Renders markdown with custom elements inline for documentation

[![Build Status](https://img.shields.io/travis/pugjs/doc-down/master.svg)](https://travis-ci.org/pugjs/doc-down)
[![Dependency Status](https://img.shields.io/david/pugjs/doc-down/master.svg)](http://david-dm.org/pugjs/doc-down)
[![NPM version](https://img.shields.io/npm/v/doc-down.svg)](https://www.npmjs.org/package/doc-down)

## Installation

```
npm install doc-down --save
```

## Usage

```md
Some **markdown**

This is a custom element where the content is treated as markdown:

: MyElementName(attribute="value")
  This content **must** be indented to appear inside the element.

This is a custom element where the content is treated as plain text:

: MyElementName(attribute="value").
  This is plain text.

This is an element without any content

: MyElementName(attribute="value")

```

On the server side/in advance if possible:

```js
var DocDown = require('doc-down');

const dd = new DocDown();

fs.writeFileSync('data.json', JSON.stringify(dd.parse('some **markdown**')));
```

On the client side:

```js
const data = require('./data.json');

// you can use any kind of react component here
function MyElementName(props) {
  return <div>{props.children}</div>;
}
const customElements = {
  MyElementName,
};

ReactDOM.render(
  <Page data={data} customElements={customElements}/>,
  document.body,
)
```



## License

MIT

import {readFileSync, readdirSync} from 'fs';
import React from 'react';
import renderer from 'react-test-renderer';
import DocDown from '../';
import Page from '../page';

readdirSync(__dirname + '/__cases__').forEach(testCase => {
  test(testCase, () => {
    const filename = __dirname + '/__cases__/' + testCase;
    const src = readFileSync(filename, 'utf8');
    const dd = new DocDown();
    const data = dd.parse(filename, src);
    expect(data).toMatchSnapshot();

    const customElements = {
      Hello: 'Hello',
      World: 'World',
    };
    expect(
      renderer.create(
        <Page data={data} customElements={customElements} />,
      ).toJSON(),
    ).toMatchSnapshot();
  });
});

'use strict';

import { describe, expect, it } from 'vitest';
import { XmlBuilder } from '../../src/utils/xmlBuilder.js';

describe('XmlBuilder', () => {
  it('renders attributes and nests child elements', () => {
    const builder = new XmlBuilder({ attributeNamePrefix: '@', format: true, indentBy: '  ' });
    const xml = builder.build({
      root: {
        '@id': 1,
        child: { '@name': 'a' },
      },
    });

    expect(xml).toBe('<root id="1">\n  <child name="a"/>\n</root>\n');
  });

  it('repeats a tag for each array item', () => {
    const builder = new XmlBuilder();
    const xml = builder.build({ list: { item: ['a', 'b'] } });

    expect(xml).toBe('<list>\n  <item>a</item>\n  <item>b</item>\n</list>\n');
  });

  it('self-closes an element with no attributes and no children', () => {
    const builder = new XmlBuilder();
    const xml = builder.build({ methods: {} });

    expect(xml).toBe('<methods/>\n');
  });

  it('self-closes a primitive element with an empty string value', () => {
    const builder = new XmlBuilder();
    const xml = builder.build({ note: '' });

    expect(xml).toBe('<note/>\n');
  });

  it('omits keys with undefined values from both attributes and elements', () => {
    const builder = new XmlBuilder();
    const xml = builder.build({ root: { '@skip': undefined, '@keep': 'x', skip: undefined, keep: 'y' } });

    expect(xml).toBe('<root keep="x">\n  <keep>y</keep>\n</root>\n');
  });

  it('omits a top-level key with an undefined value', () => {
    const builder = new XmlBuilder();
    const xml = builder.build({ skip: undefined, root: 'x' });

    expect(xml).toBe('<root>x</root>\n');
  });

  it('escapes double quotes and apostrophes in attribute values but not other characters', () => {
    const builder = new XmlBuilder();
    const xml = builder.build({ root: { '@val': `a "b" & <c> 'd'` } });

    expect(xml).toBe(`<root val="a &quot;b&quot; & <c> &apos;d&apos;"/>\n`);
  });

  it('produces unindented, unbroken output when format is false', () => {
    const builder = new XmlBuilder({ format: false });
    const xml = builder.build({ root: { '@id': 1, child: { '@name': 'a' } } });

    expect(xml).toBe('<root id="1"><child name="a"/></root>');
  });
});

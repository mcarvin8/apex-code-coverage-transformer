'use strict';

export type XmlBuilderOptions = {
  attributeNamePrefix?: string;
  format?: boolean;
  indentBy?: string;
};

type XmlNode = Record<string, unknown>;

const DEFAULT_OPTIONS: Required<XmlBuilderOptions> = {
  attributeNamePrefix: '@',
  format: true,
  indentBy: '  ',
};

/**
 * Minimal XML serializer for this plugin's coverage-object shapes: nested plain
 * objects become elements, `@`-prefixed keys become attributes, arrays repeat
 * the tag, and childless elements self-close. Replaces fast-xml-builder, which
 * this codebase only ever used with a fixed, narrow slice of its options.
 */
export class XmlBuilder {
  private readonly options: Required<XmlBuilderOptions>;

  constructor(options: XmlBuilderOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  build(obj: XmlNode): string {
    return this.buildChildren(obj, 0);
  }

  private buildChildren(obj: XmlNode, level: number): string {
    let out = '';
    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined) continue;
      out += Array.isArray(value)
        ? value.map((item) => this.buildElement(key, item, level)).join('')
        : this.buildElement(key, value, level);
    }
    return out;
  }

  private buildElement(key: string, value: unknown, level: number): string {
    const indent = this.options.format ? this.options.indentBy.repeat(level) : '';
    const newline = this.options.format ? '\n' : '';

    if (value !== null && typeof value === 'object') {
      const { attrStr, children } = this.splitAttributesAndChildren(value as XmlNode);
      if (!children) {
        return `${indent}<${key}${attrStr}/>${newline}`;
      }
      const inner = this.buildChildren(children, level + 1);
      return `${indent}<${key}${attrStr}>${newline}${inner}${indent}</${key}>${newline}`;
    }

    const text = String(value);
    return text === '' ? `${indent}<${key}/>${newline}` : `${indent}<${key}>${text}</${key}>${newline}`;
  }

  private splitAttributesAndChildren(obj: XmlNode): { attrStr: string; children?: XmlNode } {
    const prefix = this.options.attributeNamePrefix;
    let attrStr = '';
    let children: XmlNode | undefined;

    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined) continue;
      if (key.startsWith(prefix)) {
        attrStr += this.buildAttribute(key.slice(prefix.length), value);
      } else {
        children ??= {};
        children[key] = value;
      }
    }

    return { attrStr, children };
  }

  private buildAttribute(name: string, value: unknown): string {
    const escaped = String(value).replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    return ` ${name}="${escaped}"`;
  }
}

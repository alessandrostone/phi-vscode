/** @jsx jsx */
import { jsx } from "@emotion/core";
import * as T from "../../types";
import { column, heading, colors, shadow1 } from "../../styles";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";

const editorCustomStyle = {
  backgroundColor: colors.canvasBackground,
  fontSize: "13px"
};

type Props = {
  component: T.Component;
};

export function kebabToPascal(kebab: string): string {
  return capitalizeFirstLetter(kebabToCamel(kebab));
}

export function kebabToCamel(kebab: string): string {
  let result = "";
  let isMaj = false;
  for (let i = 0; i < kebab.length; i++) {
    const charCode = kebab.charCodeAt(i);
    if (isMaj && charCode >= 97 && charCode <= 122) {
      result += String.fromCharCode(charCode - 32);
      isMaj = false;
    } else if (charCode === 45) {
      // i++;
      isMaj = true;
    } else {
      result += kebab[i];
    }
  }
  return result;
}

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function componentImport(name: string) {
  return `import { ${name} } from './path/to/file.phi';`;
}

function componentWithoutProps(name: string) {
  return `function Basic() {
  return (
    <${name} />
  );
}`;
}

function propAssignment(propName: string, value: string) {
  return `      ${kebabToCamel(propName)}="${value}"`;
}

function componentExampleToCode(
  name: string,
  index: number,
  example: T.ComponentExample
) {
  return `function Example${index + 1}() {
  return (
    <${name}
${Object.entries(example.props)
  .map(([key, value]) => propAssignment(key, value))
  .join("\n")} />
  );
}`;
}

function componentToCodeExample(component: T.Component) {
  const componentName = kebabToPascal(component.name);
  return `${componentImport(componentName)}

${componentWithoutProps(componentName)}

${component.examples
  .map((example, index) =>
    componentExampleToCode(componentName, index, example)
  )
  .join("\n\n")}
`;
}

export default function CodeExamples({ component }: Props) {
  return (
    <div
      css={[
        column,
        shadow1,
        {
          zIndex: 2,
          flex: 0,
          padding: "20px 40px",
          height: "300px",
          maxHeight: "300px",
          minHeight: "300px",
          background: colors.sideBarBackground,
          borderLeft: "solid 1px #DDD",
          borderRight: "solid 1px #DDD"
        }
      ]}
    >
      <h1 css={heading}>React</h1>
      <SyntaxHighlighter language="jsx" customStyle={editorCustomStyle}>
        {componentToCodeExample(component)}
      </SyntaxHighlighter>
    </div>
  );
}

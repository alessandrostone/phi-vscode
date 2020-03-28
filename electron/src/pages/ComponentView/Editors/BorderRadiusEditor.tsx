/** @jsx jsx */
import { jsx } from "@emotion/core";
import * as T from "../../../types";
import { row } from "../../../styles";
import Section from "./Section";
import { LengthPropertyEditor } from "./StylePropertyEditor";

type Props = {
  style: T.LayerStyle;
  onChange: (style: T.LayerStyle) => void;
};

export default function BorderRadius({ style, onChange }: Props) {
  return (
    <Section title="Border Radius">
      <div css={row}>
        <LengthPropertyEditor
          label="T/L"
          style={style}
          onChange={onChange}
          property="borderTopLeftRadius"
          onlyPositive={true}
        />
        <LengthPropertyEditor
          label="T/R"
          style={style}
          onChange={onChange}
          property="borderTopRightRadius"
          onlyPositive={true}
        />
        <LengthPropertyEditor
          label="B/R"
          style={style}
          onChange={onChange}
          property="borderBottomRightRadius"
          onlyPositive={true}
        />
        <LengthPropertyEditor
          label="B/L"
          style={style}
          onChange={onChange}
          property="borderBottomLeftRadius"
          onlyPositive={true}
        />
      </div>
    </Section>
  );
}

/** @jsx jsx */
import { jsx } from "@emotion/core";
import React from "react";
import * as T from "../types";
import { column, row, mainPadding, heading } from "../styles";
import { useState } from "react";
import Modal from "../components/Modal";
import Input from "../components/Input";
import SecondaryButton from "../components/SecondaryButton";
import { del, set } from "../helpers/immutable-map";
import SelectableCard from "../components/SelectableCard";
import AddModal from "../components/AddModal";
import { getContrastColor } from "../utils";
import { Layout } from "../components/Layout";
import Menu from "../components/Menu";
import TopBar from "../components/TopBar";

type Props = {
  refs: T.Refs;
  colors: Map<string, T.ColorDefinition>;
  onColorsChange: (newColors: Map<string, T.ColorDefinition>) => void;
};

function Colors({ refs, colors, onColorsChange }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [colorName, setColorName] = useState("");
  const [colorValue, setColorValue] = useState("");
  const [hasTryToSubmit, setHasTryToSubmit] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  function isFormValid() {
    return isColorNameValid() && isColorValueValid();
  }

  function isColorNameValid() {
    return colorName.length > 0 && !colors.has(colorName);
  }

  function isColorValueValid() {
    return isHexRGB(colorValue);
  }

  function resetForm() {
    setColorName("");
    setColorValue("");
    setHasTryToSubmit(false);
  }

  return (
    <Layout
      topBar={<TopBar fileName={refs.fileName} isSaved={refs.isSaved} />}
      left={<Menu components={refs.components} />}
      center={
        <div css={[column, mainPadding]}>
          <div css={[row, { marginBottom: "20px", alignItems: "flex-end" }]}>
            <h1 css={heading}>Colors</h1>
            <div css={[row, { marginLeft: "28px" }]}>
              <SecondaryButton
                text="Add"
                onClick={() => {
                  resetForm();
                  setIsModalOpen(true);
                }}
                margin="0 10px 0 0"
              />
              <SecondaryButton
                text="Delete"
                disabled={selectedColor === null}
                onClick={() => {
                  onColorsChange(del(colors, selectedColor!));
                  setSelectedColor(null);
                }}
              />
            </div>
          </div>

          <div css={[row, { flexWrap: "wrap" }]}>
            {Array.from(colors.entries()).map(entry => {
              const contrast = getContrastColor(entry[1].value);
              return (
                <SelectableCard
                  key={entry[0]}
                  overrides={{
                    margin: "0 16px 16px 0"
                  }}
                  isSelected={selectedColor === entry[0]}
                  onClick={() =>
                    setSelectedColor(
                      selectedColor === entry[0] ? null : entry[0]
                    )
                  }
                >
                  <div
                    css={{
                      color: contrast,
                      fontSize: "12px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "80px",
                      width: "80px",
                      background: entry[1].value,
                      borderRadius: "2px",
                      margin: "8px"
                    }}
                  >
                    <div>{entry[1].name}</div>
                    <div>{entry[1].value}</div>
                  </div>
                </SelectableCard>
              );
            })}
          </div>
          <Modal isOpen={isModalOpen}>
            <AddModal
              title="Add color"
              form={
                <React.Fragment>
                  <p
                    css={{
                      color: "rgb(102, 102, 102)",
                      fontWeight: 400,
                      fontSize: "14px",
                      lineHeight: "24px"
                    }}
                  >
                    The name should unique. <br /> The value should be in
                    hexadecimal (e.g: #AABBCC).
                  </p>
                  <Input
                    placeholder="Name"
                    margin="0 0 12px"
                    value={colorName}
                    onChange={e => setColorName(e.target.value)}
                    isInvalid={hasTryToSubmit && !isColorNameValid()}
                  />
                  <Input
                    placeholder="Value in hex. (e.g: #AABBCC)"
                    value={colorValue}
                    onChange={e => setColorValue(e.target.value)}
                    isInvalid={hasTryToSubmit && !isColorValueValid()}
                  />
                </React.Fragment>
              }
              onCancel={() => setIsModalOpen(false)}
              onAdd={() => {
                if (!isFormValid()) {
                  setHasTryToSubmit(true);
                } else {
                  onColorsChange(
                    set(colors, colorName, {
                      name: colorName,
                      value: colorValue
                    })
                  );
                  setIsModalOpen(false);
                }
              }}
            />
          </Modal>
        </div>
      }
    />
  );
}

export default Colors;

function isHexRGB(str: string) {
  return /^#[0-9a-f]{6}$/i.test(str);
}

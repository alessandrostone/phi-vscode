/** @jsx jsx */
import { jsx } from "@emotion/core";
import { column, row, sectionTitle } from "../styles";
import * as T from "../types";
import { Link } from "react-router-dom";
import { useRouter } from "../useRouter";
import AddButton from "./AddButton";
import OkCancelModal, { useOkCancelModal } from "./OkCancelModal";
import React from "react";
import { useStringFormEntry, useForm, FormInput } from "./Form";

type Props = {
  components: T.ComponentMap;
  onAddComponent: (name: string) => void;
};

function MenuItem({ href, text }: { href: string; text: string }) {
  const pathname = useRouter().location.pathname;
  const isSelected = pathname === href;
  return (
    <div
      css={{
        padding: "8px 8px 8px 24px",
        paddingLeft: isSelected ? "20px" : "24px",
        borderLeft: isSelected ? "4px solid black" : "none"
      }}
    >
      <Link
        to={href}
        css={{
          fontSize: "14px",
          color: "rgb(0, 0, 0)",
          boxSizing: "border-box",
          textDecoration: "none",
          fontWeight: isSelected ? 600 : 400,
          cursor: "pointer"
        }}
      >
        {text}
      </Link>
    </div>
  );
}

function Menu({ components, onAddComponent }: Props) {
  const modal = useOkCancelModal();
  const nameEntry = useStringFormEntry("", value => {
    if (value.length === 0) {
      return "Component name is required";
    }
  });
  const submit = useForm([nameEntry], () => {
    onAddComponent(nameEntry.value);
    modal.close();
  });
  return (
    <div
      css={[
        column,
        {
          paddingTop: "24px",
          width: "240px",
          height: "100%",
          justifyContent: "space-between"
        }
      ]}
    >
      <div
        css={[
          column,
          {
            paddingBottom: "24px",
            width: "240px"
          }
        ]}
      >
        <span
          css={[
            sectionTitle,
            {
              paddingLeft: "24px",
              paddingBottom: "16px"
            }
          ]}
        >
          Styles
        </span>
        <MenuItem href="/typography" text="Typography" />
        <MenuItem href="/colors" text="Colors" />
        <MenuItem href="/breakpoints" text="Breakpoints" />
        <div
          css={[
            row,
            { margin: "40px 24px 16px 24px", justifyContent: "space-between" }
          ]}
        >
          <span css={[sectionTitle]}>Components</span>
          <AddButton onClick={modal.open} />
        </div>
        {Array.from(components.entries()).map(entry => (
          <MenuItem
            key={entry[0]}
            href={`/components/${entry[0]}`}
            text={entry[1].name}
          />
        ))}
      </div>
      <OkCancelModal
        isOpen={modal.isOpen}
        title="Create new component"
        description="Name should be unique"
        onOk={submit}
        onCancel={modal.close}
        form={
          <React.Fragment>
            <FormInput
              placeholder="Name"
              margin="0 0 12px"
              autoFocus
              {...nameEntry.inputProps}
            />
          </React.Fragment>
        }
      />
    </div>
  );
}

export default Menu;

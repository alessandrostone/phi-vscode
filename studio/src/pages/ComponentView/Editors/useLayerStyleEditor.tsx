import * as T from "../../../types";
import { useState } from "react";

export default function useLayerStyleEditor<TStyle>(layer: T.ILayer<TStyle>) {
  const [mediaQuery, setMediaQuery] = useState("default");
  const isDefault = mediaQuery === "default";
  const style = isDefault
    ? layer.style
    : layer.mediaQueries.find(mq => mq.id === mediaQuery)!.style;
  return {
    style,
    mediaQuery,
    setMediaQuery,
    updateStyle: (newProps: Partial<TStyle>): Partial<T.ILayer<TStyle>> => {
      return isDefault
        ? { style: { ...style, ...newProps } }
        : {
            mediaQueries: layer.mediaQueries.map(mq =>
              mq.id === mediaQuery
                ? {
                    ...mq,
                    style: { ...style, ...newProps }
                  }
                : mq
            )
          };
    },
    addMediaQuery: (
      id: string,
      breakpoint: T.Ref
    ): Partial<T.ILayer<TStyle>> => {
      setMediaQuery(id);
      return {
        mediaQueries: [
          ...layer.mediaQueries,
          {
            id,
            minWidth: breakpoint,
            style: { ...layer.style }
          }
        ]
      };
    }
  };
}
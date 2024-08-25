import React from "react";

export type BookmarkButton = {
  title: string;
  pageLink: string;
  children: React.ReactNode;
};

const UIBookmarkButton: ({title, pageLink, children}: BookmarkButton) => JSX.Element = ({title, pageLink, children}: BookmarkButton): JSX.Element => (
  <button
    className={""}
    title={title}
    onClick={() => pageLink}
  >
    {children}
  </button>
);

export default UIBookmarkButton;
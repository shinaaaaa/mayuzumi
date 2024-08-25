import React, { useReducer } from "react";
import UIBookmarkButton, {BookmarkButton} from "./bookmarkLink";
import {RiShoppingCart2Line} from "react-icons/ri";

const Sidebar = () => {
  const bookmarkLinks: BookmarkButton[] = [
    {
      title: "shop",
      pageLink:"https://shinycolors.enza.fun/shop/money",
      children: <RiShoppingCart2Line />
    },
    {
      title: "shop",
      pageLink:"https://shinycolors.enza.fun/shop/money",
      children: <RiShoppingCart2Line />
    },
    {
      title: "shop",
      pageLink:"https://shinycolors.enza.fun/shop/money",
      children: <RiShoppingCart2Line />
    }
  ];

  return (
    <div>
      {bookmarkLinks.map((e)=>(
        <UIBookmarkButton title={e.title} pageLink={e.pageLink}>
          {e.children}
        </UIBookmarkButton>
      ))}
    </div>
  );
};

export default Sidebar;
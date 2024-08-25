import React from "react";
import ReactDOM from "react-dom/client";
import "tailwindcss/tailwind.css";

import App from "./components/App";

const rootElement =document.getElementById('root');
if(!rootElement)throw new Error('Startup failed, "root" is not found')
const root = ReactDOM.createRoot(rootElement);
root.render(
  <App />
);

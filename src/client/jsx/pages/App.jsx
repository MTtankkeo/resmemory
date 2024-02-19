import "../styles/variable.css";
import "../styles/main.css";
import "../styles/template.css";
import "../styles/keyframe.css";

import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HomePage } from "./Home.jsx";
import { WritePage } from "./Write.jsx";

// 최상위 컴포넌트
const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" Component={HomePage}></Route>
        <Route path="/write" Component={WritePage}></Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App;
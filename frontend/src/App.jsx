
import { useState } from "react";
import ExamPage from "./ExamPage";
import CreateExam from "./CreateExam";

import Users from './Users.jsx';
import Login from './Login.jsx';
import LatexEditor from './LatexEditor.jsx';
import Editor from './Editor.jsx';
import 'katex/dist/katex.min.css';

function App() {
  const [user, setUser] = useState(null);
  const path = window.location.pathname;



  if (path.startsWith("/exam/")) {
    return <ExamPage />;
  }

  // bara admin/login här
  if (!user) {
    return <Login />;
  }
}

export default App;
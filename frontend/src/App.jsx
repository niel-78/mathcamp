
import ExamPage from "./ExamPage";
import CreateExam from "./CreateExam";

import Users from './Users.jsx';
import Questions from './Questions.jsx';
import LatexEditor from './LatexEditor.jsx';
import Editor from './Editor.jsx';
import 'katex/dist/katex.min.css';

function App() {

    const path = window.location.pathname;

    if (path.startsWith("/exam")) {
      return <ExamPage />;
    }
    return <CreateExam />;
}

export default App;
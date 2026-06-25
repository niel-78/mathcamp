import { useRef } from "react";
import 'mathlive';

export default function Editor() {
  const mfRef = useRef(null);


  const handleSave = () => {
    const latex = mfRef.current.value;
    console.log(latex);
  }  

  return (
    <div>
      <math-field
        ref={mfRef}
      >
      </math-field>

      <button onClick={handleSave}>
        Spara
      </button>
    </div>
  );
}
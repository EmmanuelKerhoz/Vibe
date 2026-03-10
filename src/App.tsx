import React from 'react';
import ImportModal from './ImportModal'; // ImportModal is imported only once

function App() {
  return (
    <div>
      <TopRibbon onImportClick={triggerImportFilePicker} /> {/* Changed prop */}
      <ImportModal />
    </div>
  );
}

export default App;
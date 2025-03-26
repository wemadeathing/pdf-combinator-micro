import React, { useState, useRef } from 'react';
import { FileX, MoveUp, MoveDown, FilePlus, Download, RotateCcw } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [combined, setCombined] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  
  // Create refs for file inputs
  const initialFileInputRef = useRef<HTMLInputElement>(null);
  const additionalFileInputRef = useRef<HTMLInputElement>(null);

  // Maximum sizes - these could be modified based on your requirements
  // Use 0 for unlimited size
  const MAX_INDIVIDUAL_FILE_SIZE = 0; // No individual file size limit
  const MAX_TOTAL_SIZE = 0; // No total size limit

  const getTotalSize = () => {
    return files.reduce((sum, file) => sum + file.size, 0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const pdfFiles = droppedFiles.filter(file => 
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    );
    
    if (pdfFiles.length > 0) {
      // Check file sizes if limits are set
      if (MAX_INDIVIDUAL_FILE_SIZE > 0) {
        const oversizedFiles = pdfFiles.filter(file => file.size > MAX_INDIVIDUAL_FILE_SIZE);
        if (oversizedFiles.length > 0) {
          const filesNames = oversizedFiles.map(f => f.name).join(', ');
          const maxSizeMB = (MAX_INDIVIDUAL_FILE_SIZE / (1024 * 1024)).toFixed(2);
          alert(`The following files exceed the maximum size of ${maxSizeMB} MB: ${filesNames}`);
          return;
        }
      }
      
      // Check total size if limit is set
      if (MAX_TOTAL_SIZE > 0) {
        const newTotalSize = getTotalSize() + pdfFiles.reduce((sum, file) => sum + file.size, 0);
        if (newTotalSize > MAX_TOTAL_SIZE) {
          const currentMB = (getTotalSize() / (1024 * 1024)).toFixed(2);
          const newMB = (newTotalSize / (1024 * 1024)).toFixed(2);
          const maxMB = (MAX_TOTAL_SIZE / (1024 * 1024)).toFixed(2);
          alert(`Adding these files would increase the total size from ${currentMB} MB to ${newMB} MB, which exceeds the limit of ${maxMB} MB.`);
          return;
        }
      }
      
      setFiles(prevFiles => [...prevFiles, ...pdfFiles]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const selectedFiles = Array.from(e.target.files);
    const pdfFiles = selectedFiles.filter(file => 
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    );
    
    if (pdfFiles.length > 0) {
      // Check file sizes if limits are set
      if (MAX_INDIVIDUAL_FILE_SIZE > 0) {
        const oversizedFiles = pdfFiles.filter(file => file.size > MAX_INDIVIDUAL_FILE_SIZE);
        if (oversizedFiles.length > 0) {
          const filesNames = oversizedFiles.map(f => f.name).join(', ');
          const maxSizeMB = (MAX_INDIVIDUAL_FILE_SIZE / (1024 * 1024)).toFixed(2);
          alert(`The following files exceed the maximum size of ${maxSizeMB} MB: ${filesNames}`);
          return;
        }
      }
      
      // Check total size if limit is set
      if (MAX_TOTAL_SIZE > 0) {
        const newTotalSize = getTotalSize() + pdfFiles.reduce((sum, file) => sum + file.size, 0);
        if (newTotalSize > MAX_TOTAL_SIZE) {
          const currentMB = (getTotalSize() / (1024 * 1024)).toFixed(2);
          const newMB = (newTotalSize / (1024 * 1024)).toFixed(2);
          const maxMB = (MAX_TOTAL_SIZE / (1024 * 1024)).toFixed(2);
          alert(`Adding these files would increase the total size from ${currentMB} MB to ${newMB} MB, which exceeds the limit of ${maxMB} MB.`);
          return;
        }
      }
      
      setFiles(prevFiles => [...prevFiles, ...pdfFiles]);
    }
    
    // Clear the file input value so the same file can be selected again
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    setCombined(false);
  };

  const moveFileUp = (index: number) => {
    if (index === 0) return;
    const newFiles = [...files];
    const temp = newFiles[index];
    newFiles[index] = newFiles[index - 1];
    newFiles[index - 1] = temp;
    setFiles(newFiles);
    setCombined(false);
  };

  const moveFileDown = (index: number) => {
    if (index === files.length - 1) return;
    const newFiles = [...files];
    const temp = newFiles[index];
    newFiles[index] = newFiles[index + 1];
    newFiles[index + 1] = temp;
    setFiles(newFiles);
    setCombined(false);
  };

  const combineFiles = async () => {
    try {
      setIsProcessing(true);
      setProcessingProgress(0);
      
      // Create a new PDF document
      const mergedPdf = await PDFDocument.create();
      
      // Process each file with progress tracking
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          // Convert File to ArrayBuffer
          const fileBuffer = await file.arrayBuffer();
          // Load the PDF document - this could be slow for large files
          const pdf = await PDFDocument.load(fileBuffer, {
            ignoreEncryption: true,
          });
          // Copy all pages
          const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
          // Add each page to the new document
          pages.forEach(page => mergedPdf.addPage(page));
          
          // Update progress
          setProcessingProgress(Math.round(((i + 1) / files.length) * 100));
        } catch (fileError) {
          console.error(`Error processing file ${file.name}:`, fileError);
          alert(`Error processing file ${file.name}. This file may be corrupted or password-protected.`);
          // Continue with other files instead of stopping the whole process
        }
      }
      
      setCombined(true);
      setIsProcessing(false);
      setProcessingProgress(100);
    } catch (error) {
      console.error('Error combining PDFs:', error);
      alert('There was an error combining the PDFs. Please try again.');
      setIsProcessing(false);
    }
  };

  const resetApp = () => {
    setFiles([]);
    setCombined(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const downloadCombinedPDF = async () => {
    try {
      setIsProcessing(true);
      setProcessingProgress(0);
      
      // Create a new PDF document
      const mergedPdf = await PDFDocument.create();
      
      // Process each file with progress tracking
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          // Convert File to ArrayBuffer
          const fileBuffer = await file.arrayBuffer();
          // Load the PDF document
          const pdf = await PDFDocument.load(fileBuffer, {
            ignoreEncryption: true,
          });
          // Copy all pages
          const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
          // Add each page to the new document
          pages.forEach(page => mergedPdf.addPage(page));
          
          // Update progress
          setProcessingProgress(Math.round((i / files.length) * 80)); // Use 80% for processing
        } catch (fileError) {
          console.error(`Error processing file ${file.name}:`, fileError);
          alert(`Error processing file ${file.name}. This file may be corrupted or password-protected.`);
          // Continue with other files
        }
      }
      
      setProcessingProgress(90); // 90% for PDF saving
      // Save the merged PDF as bytes
      const mergedPdfBytes = await mergedPdf.save();
      
      setProcessingProgress(95); // 95% for blob creation
      // Create a blob from the PDF bytes
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      
      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = 'combined.pdf';
      
      // Append to document, click, and cleanup
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Release the URL object
      window.URL.revokeObjectURL(url);
      setProcessingProgress(100);
      setIsProcessing(false);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('There was an error downloading the PDF. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white text-gray-800 font-sans">
      {/* Header */}
      <header className="bg-gray-100 shadow-sm p-4 flex items-center border-b border-gray-200">
        <div className="flex items-center">
          <div className="bg-blue-600 rounded w-8 h-8 flex items-center justify-center text-white font-bold text-lg mr-2">P</div>
          <span className="text-lg font-semibold">PDF Combinator</span>
        </div>
        <div className="ml-8 text-sm">Combine PDFs Easily</div>
      </header>

      <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
          <h1 className="text-xl font-semibold mb-4">Combine PDF Files</h1>
          <p className="text-gray-600 mb-6">Upload multiple PDF files to combine them into a single PDF document.</p>

          {/* File upload area */}
          {files.length === 0 && (
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => initialFileInputRef.current?.click()}
            >
              <FilePlus className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <p className="text-gray-500 mb-2">Drag and drop PDF files here</p>
              <p className="text-gray-400 text-sm mb-4">or</p>
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                Select Files
              </button>
              <input 
                id="file-input" 
                ref={initialFileInputRef}
                type="file" 
                accept=".pdf,application/pdf" 
                multiple 
                className="hidden" 
                onChange={handleFileInput}
              />
            </div>
          )}

          {/* File list */}
          {files.length > 0 && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">PDF Files ({files.length})</h2>
                <button 
                  onClick={resetApp}
                  className="text-gray-500 hover:text-gray-700 flex items-center text-sm"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </button>
              </div>
              
              <div className="border rounded-lg overflow-hidden mb-4">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filename</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {files.map((file, index) => (
                      <tr key={`${file.name}-${index}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{file.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatFileSize(file.size)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button 
                              onClick={() => moveFileUp(index)}
                              disabled={index === 0}
                              className={`p-1 rounded ${index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'}`}
                              title="Move up"
                            >
                              <MoveUp className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => moveFileDown(index)}
                              disabled={index === files.length - 1}
                              className={`p-1 rounded ${index === files.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'}`}
                              title="Move down"
                            >
                              <MoveDown className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => removeFile(index)}
                              className="p-1 rounded text-gray-500 hover:bg-gray-100"
                              title="Remove"
                            >
                              <FileX className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between">
                <button 
                  onClick={() => additionalFileInputRef.current?.click()}
                  className="border border-gray-300 bg-gray-50 text-gray-700 px-4 py-2 rounded hover:bg-gray-100 transition-colors flex items-center"
                >
                  <FilePlus className="h-4 w-4 mr-2" />
                  Add More Files
                </button>
                <input 
                  ref={additionalFileInputRef}
                  type="file" 
                  accept=".pdf,application/pdf" 
                  multiple 
                  className="hidden" 
                  onChange={handleFileInput}
                />
                <button 
                  onClick={combineFiles}
                  disabled={files.length < 2 || combined || isProcessing}
                  className={`px-4 py-2 rounded flex items-center ${
                    files.length < 2 || combined || isProcessing ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isProcessing ? `Processing... ${processingProgress}%` : combined ? 'Files Combined' : 'Combine Files'}
                </button>
              </div>

              {isProcessing && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                      style={{ width: `${processingProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Download section (only shown after combining) */}
          {combined && (
            <div className="mt-6 border-t pt-6">
              <h2 className="text-lg font-medium mb-4">Combined PDF Ready</h2>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-start">
                <div className="flex-1">
                  <p className="text-green-800 font-medium">Your files have been successfully combined!</p>
                  <p className="text-green-700 text-sm mt-1">Combined file size: {formatFileSize(files.reduce((sum, file) => sum + file.size, 0))}</p>
                </div>
                <button 
                  onClick={downloadCombinedPDF}
                  disabled={isProcessing}
                  className={`bg-green-600 text-white px-4 py-2 rounded flex items-center ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'}`}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isProcessing ? `Processing... ${processingProgress}%` : 'Download PDF'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-blue-800 font-medium mb-2">About this tool</h3>
          <p className="text-blue-700 text-sm">
            This tool combines multiple PDF files into one document. There is no file size limit, but very large files (100+ MB) may take longer to process.
            The processing speed depends on your device's capabilities. The original files remain unchanged.
          </p>
        </div>
      </main>

      <footer className="bg-gray-100 p-4 text-center text-xs text-gray-500 border-t border-gray-200">
        PDF Combinator — Free Online PDF Merger
      </footer>
    </div>
  );
}

export default App;
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Dashboard from "@/pages/Dashboard";
import NewTicket from "@/pages/NewTicket";
import ViewTicket from "@/pages/ViewTicket";
import PublicTicket from "@/pages/PublicTicket";

function App() {
  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <div className="noise-overlay" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/new" element={<NewTicket />} />
          <Route path="/ticket/:id" element={<ViewTicket />} />
          <Route path="/t/:publicId" element={<PublicTicket />} />
        </Routes>
      </BrowserRouter>
      <Toaster 
        position="bottom-right" 
        toastOptions={{
          style: {
            background: '#1a1a1a',
            color: '#eaeaea',
            border: '1px solid #27272a',
          },
        }}
      />
    </div>
  );
}

export default App;

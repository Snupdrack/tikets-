import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { formatCurrency, getWhatsAppUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Download, Share2 } from 'lucide-react';
import axios from 'axios';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PublicTicket() {
  const { publicId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTicket = async () => {
      try {
        const response = await axios.get(`${API_URL}/tickets/public/${publicId}`);
        setTicket(response.data);
      } catch (err) {
        console.error('Error loading ticket:', err);
        setError('Ticket no encontrado');
      } finally {
        setLoading(false);
      }
    };

    loadTicket();
  }, [publicId]);

  const handleDownloadPdf = () => {
    if (ticket) {
      window.open(`${API_URL}/tickets/${ticket.id}/pdf`, '_blank');
    }
  };

  const handleShare = () => {
    if (ticket) {
      const url = getWhatsAppUrl(ticket.customer_phone, ticket.public_id);
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="animate-pulse-subtle text-muted-foreground">Cargando ticket...</div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl">{error || 'Ticket no encontrado'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center p-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Montserrat:wght@600;700&family=Space+Mono:wght@400;700&display=swap');
        
        .ticket-container {
          font-family: 'Inter', sans-serif;
        }
        
        .mono {
          font-family: 'Space Mono', monospace;
        }
        
        .heading {
          font-family: 'Montserrat', sans-serif;
        }
      `}</style>

      {/* Ticket */}
      <div className="ticket-container w-full max-w-sm animate-fade-in">
        <div 
          className="bg-[#1a1a1a] rounded-t-2xl p-8 relative"
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 60px -15px rgba(234, 234, 234, 0.05)'
          }}
        >
          {/* Header con Logo */}
          <div className="text-center mb-6">
            <div className="mb-4">
              <img 
                src="https://customer-assets.emergentagent.com/job_ticket-generator-12/artifacts/8akxn5rj_logo%20%28800%20x%20400%20px%29_20260304_043507_0000.png" 
                alt="SynkData Logo"
                className="max-w-[180px] mx-auto"
              />
            </div>
            <p className="text-[10px] text-[#a1a1aa] uppercase tracking-[3px] mt-1">
              Comprobante de Pago
            </p>
          </div>

          <div className="text-center text-[#00d4ff] text-xs tracking-widest my-4">
            ✦════════════════════✦
          </div>

          {/* Meta Info */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[10px] uppercase tracking-wider text-[#a1a1aa]">Recibo #</span>
              <span className="mono text-white">{ticket.receipt_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] uppercase tracking-wider text-[#a1a1aa]">Fecha</span>
              <span className="mono text-white">{ticket.datetime_str}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] uppercase tracking-wider text-[#a1a1aa]">Atendido por</span>
              <span className="mono text-white">{ticket.employee}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] uppercase tracking-wider text-[#a1a1aa]">Terminal</span>
              <span className="mono text-white">{ticket.tpv}</span>
            </div>
          </div>

          {/* Customer */}
          <div className="bg-white/[0.03] rounded-lg p-4 my-5">
            <p className="text-[10px] uppercase tracking-wider text-[#a1a1aa] mb-1">Cliente</p>
            <p className="heading text-lg font-semibold text-white">
              {ticket.customer}
            </p>
          </div>

          <div className="border-t-2 border-dashed border-white/15 my-5" />

          {/* Items Header */}
          <div className="flex justify-between text-[10px] uppercase tracking-wider text-[#71717a] pb-2 border-b border-white/10 mb-3">
            <span>Descripción</span>
            <span>Cant.</span>
            <span>Importe</span>
          </div>

          {/* Items */}
          <div className="space-y-2 mb-4">
            {ticket.items.map((item, index) => (
              <div key={index} className="flex justify-between items-start py-2 border-b border-white/5">
                <span className="flex-1 text-sm text-white">{item.name}</span>
                <span className="mono text-xs text-[#a1a1aa] min-w-[50px] text-center">
                  x{item.qty}
                </span>
                <span className="mono text-sm text-white min-w-[80px] text-right">
                  {formatCurrency(item.line_total)}
                </span>
              </div>
            ))}
          </div>

          {/* Double separator */}
          <div className="border-t-2 border-b-2 border-dashed border-white/15 h-2 my-5" />

          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-[#a1a1aa]">
              <span>Subtotal</span>
              <span className="mono">{formatCurrency(ticket.subtotal)}</span>
            </div>
            {ticket.discount > 0 && (
              <div className="flex justify-between text-sm text-[#22c55e]">
                <span>Descuento</span>
                <span className="mono">-{formatCurrency(ticket.discount)}</span>
              </div>
            )}
          </div>

          {/* Grand Total */}
          <div className="text-center my-6">
            <p className="text-[10px] uppercase tracking-[3px] text-[#a1a1aa] mb-2">
              Total a Pagar
            </p>
            <p className="mono text-4xl font-bold text-white">
              <span className="text-xl text-[#a1a1aa] align-super">$</span>
              {ticket.total.toFixed(2)}
            </p>
            <span className={`inline-block mt-3 px-4 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
              ticket.payment_method === 'Binance' 
                ? 'bg-[#f3ba2f]/15 text-[#f3ba2f]' 
                : 'bg-[#22c55e]/15 text-[#22c55e]'
            }`}>
              {ticket.payment_method}
            </span>
          </div>

          {ticket.notes && (
            <div className="bg-white/[0.03] rounded-lg p-3 text-sm text-[#a1a1aa] italic">
              {ticket.notes}
            </div>
          )}

          <div className="text-center text-[#00d4ff] text-xs tracking-widest my-4">
            ✦════════════════════✦
          </div>

          {/* Footer personalizado */}
          <div className="text-center">
            <p className="text-sm text-white mb-2">
              🙏 Muchas gracias por su compra
            </p>
            <p className="text-[11px] text-[#a1a1aa] italic leading-relaxed mb-4">
              𝘊𝘰𝘯𝘴𝘦𝘳𝘷𝘦 𝘦𝘴𝘵𝘦 𝘳𝘦𝘤𝘪𝘣𝘰<br/>
              𝘱𝘢𝘳𝘢 𝘤𝘶𝘢𝘭𝘲𝘶𝘪𝘦𝘳<br/>
              𝘥𝘶𝘥𝘢, 𝘲𝘶𝘦𝘫𝘢 𝘰 𝘢𝘤𝘭𝘢𝘳𝘢𝘤𝘪ó𝘯
            </p>
            
            {/* QR Section */}
            <div className="inline-block p-3 bg-[#1a1a1a] rounded-lg border border-white/10 my-4">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://www.AsyncData.online&bgcolor=1a1a1a&color=eaeaea`}
                alt="QR Code"
                className="w-20 h-20"
              />
            </div>
            
            <div className="mt-4">
              <p className="text-[11px] text-[#71717a]">◇ ─ Comprobante digital ─ ◇</p>
              <p className="mono text-xs text-[#00d4ff] mt-2">
                🌐 www.AsyncData.online
              </p>
            </div>
            
            <div className="mt-4">
              <p className="text-[9px] text-[#71717a] tracking-wider">
                ⋆ ᵖᵒʷᵉʳᵉᵈ ᵇʸ ⋆
              </p>
              <p className="text-[11px] text-[#00d4ff] font-semibold mt-1">
                ✧ AsyncData Infrastructure ✧ 🚀
              </p>
            </div>
          </div>

          <div className="text-center text-[#00d4ff] text-xs tracking-widest mt-4">
            ✦════════════════════✦
          </div>
        </div>

        {/* Zigzag bottom */}
        <div 
          className="h-5 mx-auto"
          style={{
            background: 'linear-gradient(135deg, transparent 10px, #1a1a1a 0) 0 0, linear-gradient(225deg, transparent 10px, #1a1a1a 0) 0 0',
            backgroundSize: '20px 20px',
            backgroundRepeat: 'repeat-x',
            backgroundPosition: 'top',
          }}
        />
      </div>

      {/* Actions */}
      <div className="w-full max-w-sm mt-8 flex gap-3">
        <Button
          onClick={handleDownloadPdf}
          className="flex-1 h-14 rounded-full bg-white text-black hover:bg-white/90 font-semibold text-base"
          style={{ boxShadow: '0 0 20px rgba(255, 255, 255, 0.1)' }}
          data-testid="download-pdf-btn"
        >
          <Download className="w-5 h-5 mr-2" />
          Descargar PDF
        </Button>
        <Button
          onClick={handleShare}
          className="flex-1 h-14 rounded-full font-semibold text-base"
          style={{ backgroundColor: '#25D366', boxShadow: '0 0 20px rgba(37, 211, 102, 0.2)' }}
          data-testid="share-whatsapp-btn"
        >
          <Share2 className="w-5 h-5 mr-2" />
          WhatsApp
        </Button>
      </div>
    </div>
  );
}

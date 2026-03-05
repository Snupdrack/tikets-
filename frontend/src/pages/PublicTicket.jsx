import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { formatCurrency, getWhatsAppUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Montserrat:wght@600;700;800&family=Space+Mono:wght@400;700&display=swap');
        
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
      <div className="ticket-container w-full max-w-[420px] animate-fade-in">
        <div 
          className="bg-[#1a1a1a] rounded-t-[20px] p-10 relative"
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 60px -15px rgba(234, 234, 234, 0.05)'
          }}
        >
          {/* Header con datos de empresa */}
          <div className="text-center mb-7">
            <div className="mb-5">
              <img 
                src="https://customer-assets.emergentagent.com/job_ticket-generator-12/artifacts/8akxn5rj_logo%20%28800%20x%20400%20px%29_20260304_043507_0000.png" 
                alt="SynkData Logo"
                className="max-w-[200px] mx-auto"
              />
            </div>
            
            <h1 className="heading text-[28px] font-extrabold text-white mb-2">Async</h1>
            
            <div className="text-[#888] text-sm tracking-wider my-3">✧─────────────────────✧</div>
            
            <div className="text-[#a1a1aa] text-base mb-2">✧ AsyncData Solutions ✧</div>
            
            <div className="text-[#888] text-sm tracking-wider my-3">✧─────────────────────✧</div>
            
            <div className="text-[#00d4ff] text-sm italic mb-4">Tecnología que convierte datos en soluciones ✧</div>
            
            <div className="text-sm leading-[1.8] text-white">
              <div className="my-1.5 text-[#ff6b6b]">📍 Av. México 1100, Pto.Vallarta</div>
              <div className="my-1.5">💬 WhatsApp: 81 4695 4100</div>
              <div className="my-1.5">☎ Llamadas: 314 341 1022</div>
            </div>
          </div>

          <div className="border-t-2 border-dashed border-white/20 my-6" />

          {/* Total grande */}
          <div className="text-center my-7">
            <p className="mono text-[56px] font-bold text-white tracking-tighter">
              <span className="text-[32px] text-[#a1a1aa] align-super">$</span>
              {ticket.total.toFixed(2)}
            </p>
            <p className="text-base uppercase tracking-[3px] text-[#a1a1aa] mt-2">Total</p>
          </div>

          <div className="border-t-2 border-dashed border-white/20 my-6" />

          {/* Datos del recibo */}
          <div className="my-5 space-y-2">
            <div className="flex text-[15px]">
              <span className="font-semibold text-white min-w-[120px]">Recibo #:</span>
              <span className="mono text-white">{ticket.receipt_number}</span>
            </div>
            <div className="flex text-[15px]">
              <span className="font-semibold text-white min-w-[120px]">Fecha:</span>
              <span className="mono text-white">{ticket.datetime_str}</span>
            </div>
            <div className="flex text-[15px]">
              <span className="font-semibold text-white min-w-[120px]">Empleado:</span>
              <span className="mono text-white">{ticket.employee}</span>
            </div>
            <div className="flex text-[15px]">
              <span className="font-semibold text-white min-w-[120px]">TPV:</span>
              <span className="mono text-white">{ticket.tpv}</span>
            </div>
            <div className="flex text-[16px] mt-3 pt-3 border-t border-white/10">
              <span className="font-semibold text-white min-w-[120px]">Cliente:</span>
              <span className="heading font-semibold text-white text-lg">{ticket.customer}</span>
            </div>
          </div>

          <div className="border-t-2 border-dashed border-white/20 my-6" />

          {/* Items Header */}
          <div className="flex justify-between text-xs uppercase tracking-wider text-[#71717a] pb-2.5 border-b border-white/10 mb-3">
            <span>Descripción</span>
            <span>Cant.</span>
            <span>Importe</span>
          </div>

          {/* Items */}
          <div className="mb-4">
            {ticket.items.map((item, index) => (
              <div key={index} className="flex justify-between items-start py-3 border-b border-white/5 text-[15px]">
                <span className="flex-1 text-white">{item.name}</span>
                <span className="mono text-sm text-[#a1a1aa] min-w-[60px] text-center">
                  x{item.qty}
                </span>
                <span className="mono text-white min-w-[90px] text-right">
                  {formatCurrency(item.line_total)}
                </span>
              </div>
            ))}
          </div>

          {/* Double separator */}
          <div className="border-t-2 border-b-2 border-dashed border-white/20 h-2.5 my-6" />

          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between text-[15px] text-[#a1a1aa]">
              <span>Subtotal</span>
              <span className="mono">{formatCurrency(ticket.subtotal)}</span>
            </div>
            {ticket.discount > 0 && (
              <div className="flex justify-between text-[15px] text-[#22c55e]">
                <span>Descuento</span>
                <span className="mono">-{formatCurrency(ticket.discount)}</span>
              </div>
            )}
          </div>

          {/* Payment badge */}
          <div className="text-center mt-5">
            <span className={`inline-block px-[18px] py-2 rounded-full text-[13px] font-semibold uppercase tracking-wider ${
              ticket.payment_method === 'Binance' 
                ? 'bg-[#f3ba2f]/15 text-[#f3ba2f]' 
                : 'bg-[#22c55e]/15 text-[#22c55e]'
            }`}>
              {ticket.payment_method}
            </span>
          </div>

          {ticket.notes && (
            <div className="bg-white/[0.03] rounded-lg p-3.5 mt-5 text-sm text-[#a1a1aa] italic">
              {ticket.notes}
            </div>
          )}

          <div className="text-center text-[#00d4ff] text-xs tracking-widest mt-7">
            ✦════════════════════════✦
          </div>

          {/* Footer personalizado */}
          <div className="text-center mt-5">
            <p className="text-base text-white mb-2.5">
              🙏 Muchas gracias por su compra
            </p>
            <p className="text-[13px] text-[#a1a1aa] italic leading-[1.6] mb-5">
              𝘊𝘰𝘯𝘴𝘦𝘳𝘷𝘦 𝘦𝘴𝘵𝘦 𝘳𝘦𝘤𝘪𝘣𝘰<br/>
              𝘱𝘢𝘳𝘢 𝘤𝘶𝘢𝘭𝘲𝘶𝘪𝘦𝘳<br/>
              𝘥𝘶𝘥𝘢, 𝘲𝘶𝘦𝘫𝘢 𝘰 𝘢𝘤𝘭𝘢𝘳𝘢𝘤𝘪ó𝘯
            </p>
            
            {/* QR Section */}
            <div className="inline-block p-3.5 bg-[#1a1a1a] rounded-[10px] border border-white/10 my-5">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=https://www.AsyncData.online&bgcolor=1a1a1a&color=eaeaea`}
                alt="QR Code"
                className="w-[110px] h-[110px]"
              />
            </div>
            
            <div className="my-5">
              <p className="text-xs text-[#71717a]">◇ ─ Comprobante digital ─ ◇</p>
              <p className="mono text-sm text-[#00d4ff] mt-2.5">
                🌐 www.AsyncData.online
              </p>
            </div>
            
            <div className="mt-4">
              <p className="text-[10px] text-[#71717a] tracking-wider">
                ⋆ ᵖᵒʷᵉʳᵉᵈ ᵇʸ ⋆
              </p>
              <p className="text-[13px] text-[#00d4ff] font-semibold mt-1.5">
                ✧ AsyncData Infrastructure ✧ 🚀
              </p>
            </div>
          </div>

          <div className="text-center text-[#00d4ff] text-xs tracking-widest mt-5">
            ✦════════════════════════✦
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
      <div className="w-full max-w-[420px] mt-10 flex gap-3">
        <Button
          onClick={handleDownloadPdf}
          className="flex-1 h-14 rounded-full bg-white text-black hover:bg-white/90 font-semibold text-[15px]"
          style={{ boxShadow: '0 0 20px rgba(255, 255, 255, 0.1)' }}
          data-testid="download-pdf-btn"
        >
          <Download className="w-5 h-5 mr-2" />
          Descargar PDF
        </Button>
        <Button
          onClick={handleShare}
          className="flex-1 h-14 rounded-full font-semibold text-[15px]"
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

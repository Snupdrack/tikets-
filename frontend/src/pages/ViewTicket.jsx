import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ticketsApi, formatCurrency, getWhatsAppUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Download, Share2, Copy, ExternalLink } from 'lucide-react';

export default function ViewTicket() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTicket = async () => {
      try {
        const data = await ticketsApi.getById(id);
        setTicket(data);
      } catch (error) {
        console.error('Error loading ticket:', error);
        toast.error('Error al cargar el ticket');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    loadTicket();
  }, [id, navigate]);

  const handleDownloadPdf = () => {
    window.open(ticketsApi.getPdfUrl(id), '_blank');
  };

  const handleShare = () => {
    const url = getWhatsAppUrl(ticket?.customer_phone, ticket?.public_id);
    window.open(url, '_blank');
  };

  const handleCopyLink = () => {
    const url = ticketsApi.getPublicUrl(ticket?.public_id);
    navigator.clipboard.writeText(url);
    toast.success('Link copiado al portapapeles');
  };

  const handleViewPublic = () => {
    const url = ticketsApi.getPublicUrl(ticket?.public_id);
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse-subtle text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (!ticket) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] py-8 px-4">
      {/* Header */}
      <div className="max-w-[420px] mx-auto mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="rounded-full hover:bg-white/10"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Recibo {ticket.receipt_number}
            </h1>
            <p className="text-muted-foreground text-sm">
              Vista previa del ticket
            </p>
          </div>
        </div>
      </div>

      {/* Ticket Preview */}
      <div className="max-w-[420px] mx-auto animate-fade-in">
        <div className="ticket-card bg-[#1a1a1a] rounded-t-[20px] p-10 relative shadow-2xl" style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 60px -15px rgba(234, 234, 234, 0.05)'
        }}>
          {/* Header con datos de empresa */}
          <div className="text-center mb-7">
            <div className="mb-5">
              <img 
                src="https://customer-assets.emergentagent.com/job_ticket-generator-12/artifacts/8akxn5rj_logo%20%28800%20x%20400%20px%29_20260304_043507_0000.png" 
                alt="SynkData Logo"
                className="max-w-[200px] mx-auto"
              />
            </div>
            
            <h2 className="text-[28px] font-extrabold text-white mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>Async</h2>
            
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
              <span className="text-[32px] text-muted-foreground align-super">$</span>
              {ticket.total.toFixed(2)}
            </p>
            <p className="text-base uppercase tracking-[3px] text-muted-foreground mt-2">Total</p>
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
              <span className="font-semibold text-white text-lg" style={{ fontFamily: 'Montserrat, sans-serif' }}>{ticket.customer}</span>
            </div>
          </div>

          <div className="border-t-2 border-dashed border-white/20 my-6" />

          {/* Items Header */}
          <div className="flex justify-between text-xs uppercase tracking-wider text-zinc-500 pb-2.5 border-b border-white/10 mb-3">
            <span>Descripción</span>
            <span>Cant.</span>
            <span>Importe</span>
          </div>

          {/* Items */}
          <div className="mb-4">
            {ticket.items.map((item, index) => (
              <div key={index} className="flex justify-between items-start py-3 border-b border-white/5 text-[15px]">
                <span className="flex-1 text-white">{item.name}</span>
                <span className="mono text-sm text-muted-foreground min-w-[60px] text-center">
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
            <div className="flex justify-between text-[15px] text-muted-foreground">
              <span>Subtotal</span>
              <span className="mono">{formatCurrency(ticket.subtotal)}</span>
            </div>
            {ticket.discount > 0 && (
              <div className="flex justify-between text-[15px] text-emerald-400">
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
                : 'bg-emerald-500/15 text-emerald-400'
            }`}>
              {ticket.payment_method}
            </span>
          </div>

          {ticket.notes && (
            <div className="bg-white/[0.03] rounded-lg p-3.5 mt-5 text-sm text-muted-foreground italic">
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
            <p className="text-[13px] text-muted-foreground italic leading-[1.6] mb-5">
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
              <p className="text-xs text-zinc-500">◇ ─ Comprobante digital ─ ◇</p>
              <p className="mono text-sm text-[#00d4ff] mt-2.5">
                🌐 www.AsyncData.online
              </p>
            </div>
            
            <div className="mt-4">
              <p className="text-[10px] text-zinc-500 tracking-wider">
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
      <div className="max-w-[420px] mx-auto mt-10 space-y-3">
        <div className="flex gap-3">
          <Button
            onClick={handleDownloadPdf}
            className="flex-1 h-14 rounded-full bg-white text-black hover:bg-white/90 font-semibold text-[15px] btn-glow"
            data-testid="download-pdf-btn"
          >
            <Download className="w-5 h-5 mr-2" />
            Descargar PDF
          </Button>
          <Button
            onClick={handleShare}
            className="flex-1 h-14 rounded-full btn-whatsapp font-semibold text-[15px]"
            data-testid="share-whatsapp-btn"
          >
            <Share2 className="w-5 h-5 mr-2" />
            WhatsApp
          </Button>
        </div>
        
        <div className="flex gap-3">
          <Button
            onClick={handleCopyLink}
            variant="outline"
            className="flex-1 h-12 rounded-full bg-transparent border-border hover:bg-white/5"
            data-testid="copy-link-btn"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copiar Link
          </Button>
          <Button
            onClick={handleViewPublic}
            variant="outline"
            className="flex-1 h-12 rounded-full bg-transparent border-border hover:bg-white/5"
            data-testid="view-public-btn"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Ver Público
          </Button>
        </div>
      </div>
    </div>
  );
}

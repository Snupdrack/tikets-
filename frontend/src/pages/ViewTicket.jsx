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
      <div className="max-w-md mx-auto mb-6">
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
      <div className="max-w-sm mx-auto animate-fade-in">
        <div className="ticket-card bg-[#1a1a1a] rounded-t-2xl p-8 relative shadow-2xl" style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 60px -15px rgba(234, 234, 234, 0.05)'
        }}>
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              ASYNCTICKET
            </h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[3px] mt-1">
              Comprobante de Pago
            </p>
          </div>

          <div className="receipt-separator" />

          {/* Meta Info */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Recibo #</span>
              <span className="mono text-white">{ticket.receipt_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Fecha</span>
              <span className="mono text-white">{ticket.datetime_str}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Atendido por</span>
              <span className="mono text-white">{ticket.employee}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Terminal</span>
              <span className="mono text-white">{ticket.tpv}</span>
            </div>
          </div>

          {/* Customer */}
          <div className="bg-white/[0.03] rounded-lg p-4 my-5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Cliente</p>
            <p className="text-lg font-semibold text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              {ticket.customer}
            </p>
          </div>

          <div className="receipt-separator" />

          {/* Items Header */}
          <div className="flex justify-between text-[10px] uppercase tracking-wider text-zinc-500 pb-2 border-b border-white/10 mb-3">
            <span>Descripción</span>
            <span>Cant.</span>
            <span>Importe</span>
          </div>

          {/* Items */}
          <div className="space-y-2 mb-4">
            {ticket.items.map((item, index) => (
              <div key={index} className="flex justify-between items-start py-2 border-b border-white/5">
                <span className="flex-1 text-sm text-white">{item.name}</span>
                <span className="mono text-xs text-muted-foreground min-w-[50px] text-center">
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
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span className="mono">{formatCurrency(ticket.subtotal)}</span>
            </div>
            {ticket.discount > 0 && (
              <div className="flex justify-between text-sm text-emerald-400">
                <span>Descuento</span>
                <span className="mono">-{formatCurrency(ticket.discount)}</span>
              </div>
            )}
          </div>

          {/* Grand Total */}
          <div className="text-center my-6">
            <p className="text-[10px] uppercase tracking-[3px] text-muted-foreground mb-2">
              Total a Pagar
            </p>
            <p className="mono text-4xl font-bold text-white">
              <span className="text-xl text-muted-foreground align-super">$</span>
              {ticket.total.toFixed(2)}
            </p>
            <span className="inline-block mt-3 px-4 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-emerald-500/15 text-emerald-400">
              {ticket.payment_method}
            </span>
          </div>

          {ticket.notes && (
            <div className="bg-white/[0.03] rounded-lg p-3 text-sm text-muted-foreground italic">
              {ticket.notes}
            </div>
          )}

          <div className="receipt-separator" />

          {/* QR Section */}
          <div className="text-center">
            <div className="inline-block p-3 bg-[#1a1a1a] rounded-lg border border-white/10">
              <div className="w-20 h-20 bg-white/5 rounded flex items-center justify-center text-muted-foreground text-xs">
                QR Code
              </div>
            </div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 mt-3">
              Visita nuestra plataforma
            </p>
            <p className="mono text-xs text-muted-foreground mt-1">
              www.AsyncData.online
            </p>
          </div>

          <p className="text-center text-[11px] text-zinc-600 mt-6">
            ¡Gracias por su preferencia!
          </p>
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
      <div className="max-w-sm mx-auto mt-8 space-y-3">
        <div className="flex gap-3">
          <Button
            onClick={handleDownloadPdf}
            className="flex-1 h-14 rounded-full bg-white text-black hover:bg-white/90 font-semibold text-base btn-glow"
            data-testid="download-pdf-btn"
          >
            <Download className="w-5 h-5 mr-2" />
            Descargar PDF
          </Button>
          <Button
            onClick={handleShare}
            className="flex-1 h-14 rounded-full btn-whatsapp font-semibold text-base"
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

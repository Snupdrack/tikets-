import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketsApi, formatCurrency, formatDate, getWhatsAppUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Plus, 
  Search, 
  Eye, 
  Download, 
  Copy, 
  Share2, 
  MoreHorizontal,
  Receipt,
  Calendar,
  TrendingUp,
  DollarSign
} from 'lucide-react';

const paymentMethodColors = {
  'Efectivo': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  'Transferencia': 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  'Tarjeta': 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  'Binance': 'bg-[#f3ba2f]/15 text-[#f3ba2f] border-[#f3ba2f]/20',
  'Depósito': 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  'Otro': 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [ticketsData, statsData] = await Promise.all([
        ticketsApi.getAll(search, filterDate),
        ticketsApi.getStats(),
      ]);
      setTickets(ticketsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [search, filterDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDuplicate = async (id) => {
    try {
      const newTicket = await ticketsApi.duplicate(id);
      toast.success(`Ticket duplicado: ${newTicket.receipt_number}`);
      loadData();
    } catch (error) {
      toast.error('Error al duplicar el ticket');
    }
  };

  const handleDownloadPdf = (id) => {
    window.open(ticketsApi.getPdfUrl(id), '_blank');
  };

  const handleShare = (ticket) => {
    const url = getWhatsAppUrl(ticket.customer_phone, ticket.public_id);
    window.open(url, '_blank');
  };

  const handleView = (id) => {
    navigate(`/ticket/${id}`);
  };

  const dateFilters = [
    { label: 'Todos', value: '' },
    { label: 'Hoy', value: 'today' },
    { label: 'Semana', value: 'week' },
    { label: 'Mes', value: 'month' },
  ];

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            AsyncTicket
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tus recibos digitales
          </p>
        </div>
        <Button 
          onClick={() => navigate('/new')}
          className="bg-white text-black hover:bg-white/90 rounded-full px-6 h-12 text-base font-semibold btn-hover-lift btn-glow"
          data-testid="create-ticket-btn"
        >
          <Plus className="w-5 h-5 mr-2" />
          Crear Ticket
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="stat-card rounded-xl p-5 card-hover" data-testid="stat-total-tickets">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Total Tickets</p>
            <p className="text-2xl font-bold text-white mono">{stats.total_tickets}</p>
          </div>
          
          <div className="stat-card rounded-xl p-5 card-hover" data-testid="stat-today-tickets">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Hoy</p>
            <p className="text-2xl font-bold text-white mono">{stats.today_tickets}</p>
          </div>
          
          <div className="stat-card rounded-xl p-5 card-hover" data-testid="stat-today-revenue">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Venta Hoy</p>
            <p className="text-2xl font-bold text-emerald-400 mono">{formatCurrency(stats.today_revenue)}</p>
          </div>
          
          <div className="stat-card rounded-xl p-5 card-hover" data-testid="stat-week-revenue">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Venta Semana</p>
            <p className="text-2xl font-bold text-blue-400 mono">{formatCurrency(stats.week_revenue)}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente o recibo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-secondary/50 border-transparent h-11"
            data-testid="search-input"
          />
        </div>
        
        <div className="flex gap-2">
          {dateFilters.map((filter) => (
            <Button
              key={filter.value}
              variant={filterDate === filter.value ? 'default' : 'outline'}
              onClick={() => setFilterDate(filter.value)}
              className={`rounded-full ${
                filterDate === filter.value 
                  ? 'bg-white text-black hover:bg-white/90' 
                  : 'bg-transparent border-border hover:bg-white/5'
              }`}
              data-testid={`filter-${filter.value || 'all'}`}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-xl overflow-hidden bg-card/30">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50 hover:bg-secondary/50 border-b border-border">
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Recibo #</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Fecha</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Cliente</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground text-right">Total</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Método</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="animate-pulse-subtle text-muted-foreground">Cargando...</div>
                </TableCell>
              </TableRow>
            ) : tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Receipt className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No hay tickets</p>
                  <Button 
                    variant="link" 
                    onClick={() => navigate('/new')}
                    className="text-white mt-2"
                  >
                    Crear el primero
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((ticket) => (
                <TableRow 
                  key={ticket.id} 
                  className="table-row-hover border-b border-border/50 cursor-pointer"
                  onClick={() => handleView(ticket.id)}
                  data-testid={`ticket-row-${ticket.receipt_number}`}
                >
                  <TableCell className="font-medium mono text-white">{ticket.receipt_number}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDate(ticket.created_at)}</TableCell>
                  <TableCell className="text-white">{ticket.customer}</TableCell>
                  <TableCell className="text-right font-semibold mono text-emerald-400">
                    {formatCurrency(ticket.total)}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`${paymentMethodColors[ticket.payment_method] || paymentMethodColors['Otro']} border`}
                    >
                      {ticket.payment_method}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card border-border">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleView(ticket.id); }}>
                          <Eye className="w-4 h-4 mr-2" />
                          Ver
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDownloadPdf(ticket.id); }}>
                          <Download className="w-4 h-4 mr-2" />
                          Descargar PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDuplicate(ticket.id); }}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleShare(ticket); }}>
                          <Share2 className="w-4 h-4 mr-2" />
                          Compartir WhatsApp
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

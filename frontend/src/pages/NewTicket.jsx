import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketsApi, formatCurrency } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, Save, Eye } from 'lucide-react';

const paymentMethods = [
  'Efectivo',
  'Tarjeta',
  'Transferencia',
  'Binance',
];

const emptyItem = { name: '', qty: 1, unit_price: 0, line_total: 0 };

export default function NewTicket() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    employee: 'Propietario',
    tpv: 'TPV 1',
    customer: '',
    customer_phone: '',
    payment_method: 'Efectivo',
    discount: 0,
    notes: '',
  });
  
  const [items, setItems] = useState([{ ...emptyItem }]);

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    
    // Calculate line total
    if (field === 'qty' || field === 'unit_price') {
      const qty = parseFloat(newItems[index].qty) || 0;
      const price = parseFloat(newItems[index].unit_price) || 0;
      newItems[index].line_total = qty * price;
    }
    
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { ...emptyItem }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const subtotal = items.reduce((sum, item) => sum + (item.line_total || 0), 0);
  const discount = parseFloat(formData.discount) || 0;
  const total = subtotal - discount;

  const handleSubmit = async (viewAfter = false) => {
    // Validation
    if (!formData.customer.trim()) {
      toast.error('Por favor ingresa el nombre del cliente');
      return;
    }
    
    const validItems = items.filter(item => item.name.trim() && item.qty > 0);
    if (validItems.length === 0) {
      toast.error('Por favor agrega al menos un artículo');
      return;
    }

    try {
      setLoading(true);
      
      const ticketData = {
        ...formData,
        items: validItems.map(item => ({
          name: item.name,
          qty: parseFloat(item.qty),
          unit_price: parseFloat(item.unit_price),
          line_total: parseFloat(item.line_total),
        })),
      };
      
      const newTicket = await ticketsApi.create(ticketData);
      toast.success(`Ticket ${newTicket.receipt_number} creado`);
      
      if (viewAfter) {
        navigate(`/ticket/${newTicket.id}`);
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Error al crear el ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
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
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Nuevo Ticket
          </h1>
          <p className="text-muted-foreground text-sm">
            Crea un nuevo recibo de venta
          </p>
        </div>
      </div>

      <div className="form-container">
        {/* Customer Info */}
        <div className="bg-card/50 rounded-xl p-6 border border-border mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Información del Cliente</h2>
          
          <div className="grid gap-4">
            <div>
              <Label htmlFor="customer" className="text-muted-foreground text-sm mb-2 block">
                Nombre del Cliente *
              </Label>
              <Input
                id="customer"
                value={formData.customer}
                onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                placeholder="Ej: Juan Pérez"
                className="h-12 text-lg bg-secondary/50 border-transparent"
                autoFocus
                data-testid="customer-input"
              />
            </div>
            
            <div>
              <Label htmlFor="phone" className="text-muted-foreground text-sm mb-2 block">
                Teléfono (opcional - para WhatsApp)
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.customer_phone}
                onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                placeholder="Ej: 5512345678"
                className="h-12 bg-secondary/50 border-transparent"
                data-testid="phone-input"
              />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-card/50 rounded-xl p-6 border border-border mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Artículos</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
              className="rounded-full border-border hover:bg-white/10"
              data-testid="add-item-btn"
            >
              <Plus className="w-4 h-4 mr-1" />
              Agregar
            </Button>
          </div>
          
          {/* Items Header */}
          <div className="flex gap-3 items-center mb-2 text-xs uppercase tracking-wider text-muted-foreground">
            <div className="flex-1">Nombre del producto</div>
            <div className="w-20 text-center">Cantidad</div>
            <div className="w-28 text-right">Precio</div>
            <div className="w-28 text-right">Total</div>
            <div className="w-11"></div>
          </div>
          
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="flex gap-3 items-start" data-testid={`item-row-${index}`}>
                <div className="flex-1">
                  <Input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                    placeholder="Ej: Camisa, Servicio..."
                    className="h-11 bg-secondary/50 border-transparent"
                    data-testid={`item-name-${index}`}
                  />
                </div>
                <div className="w-20">
                  <Input
                    type="number"
                    value={item.qty}
                    onChange={(e) => updateItem(index, 'qty', e.target.value)}
                    placeholder="1"
                    min="1"
                    step="0.5"
                    className="h-11 bg-secondary/50 border-transparent text-center mono"
                    data-testid={`item-qty-${index}`}
                  />
                </div>
                <div className="w-28">
                  <Input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="h-11 bg-secondary/50 border-transparent text-right mono"
                    data-testid={`item-price-${index}`}
                  />
                </div>
                <div className="w-28 h-11 flex items-center justify-end text-emerald-400 font-semibold mono">
                  {formatCurrency(item.line_total)}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(index)}
                  className="h-11 w-11 text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
                  disabled={items.length === 1}
                  data-testid={`remove-item-${index}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Payment & Totals */}
        <div className="bg-card/50 rounded-xl p-6 border border-border mb-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block">
                  Método de Pago
                </Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                >
                  <SelectTrigger className="h-12 bg-secondary/50 border-transparent" data-testid="payment-method-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {paymentMethods.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block">
                  Descuento (opcional)
                </Label>
                <Input
                  type="number"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="h-12 bg-secondary/50 border-transparent mono"
                  data-testid="discount-input"
                />
              </div>
              
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block">
                  Notas (opcional)
                </Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notas adicionales..."
                  className="bg-secondary/50 border-transparent resize-none"
                  rows={2}
                  data-testid="notes-input"
                />
              </div>
            </div>
            
            <div className="flex flex-col justify-end">
              <div className="bg-secondary/30 rounded-xl p-5 space-y-3">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="mono">{formatCurrency(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Descuento</span>
                    <span className="mono">-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="receipt-separator" />
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-white">Total</span>
                  <span className="text-3xl font-bold text-white mono" data-testid="total-display">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Options (Collapsed) */}
        <details className="bg-card/30 rounded-xl border border-border mb-6">
          <summary className="p-4 cursor-pointer text-muted-foreground text-sm hover:text-white">
            Opciones avanzadas
          </summary>
          <div className="p-4 pt-0 grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-sm mb-2 block">
                Empleado
              </Label>
              <Input
                value={formData.employee}
                onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                className="h-11 bg-secondary/50 border-transparent"
                data-testid="employee-input"
              />
            </div>
            <div>
              <Label className="text-muted-foreground text-sm mb-2 block">
                Terminal (TPV)
              </Label>
              <Input
                value={formData.tpv}
                onChange={(e) => setFormData({ ...formData, tpv: e.target.value })}
                className="h-11 bg-secondary/50 border-transparent"
                data-testid="tpv-input"
              />
            </div>
          </div>
        </details>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => handleSubmit(false)}
            disabled={loading}
            className="flex-1 h-14 rounded-full bg-secondary hover:bg-secondary/80 text-white font-semibold text-base"
            data-testid="save-btn"
          >
            <Save className="w-5 h-5 mr-2" />
            Guardar
          </Button>
          <Button
            onClick={() => handleSubmit(true)}
            disabled={loading}
            className="flex-1 h-14 rounded-full bg-white text-black hover:bg-white/90 font-semibold text-base btn-glow"
            data-testid="save-and-view-btn"
          >
            <Eye className="w-5 h-5 mr-2" />
            Guardar y Ver
          </Button>
        </div>
      </div>
    </div>
  );
}

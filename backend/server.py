from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import StreamingResponse, HTMLResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import secrets
import io
import base64
import qrcode
from weasyprint import HTML, CSS
from jinja2 import Environment, FileSystemLoader

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="AsyncTicket API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Jinja2 templates
templates_dir = ROOT_DIR / "templates"
templates_dir.mkdir(exist_ok=True)
jinja_env = Environment(loader=FileSystemLoader(str(templates_dir)))

# Storage directory for PDFs
storage_dir = ROOT_DIR / "storage"
storage_dir.mkdir(exist_ok=True)


# ============== MODELS ==============
class TicketItem(BaseModel):
    name: str
    qty: float
    unit_price: float
    line_total: float


class TicketCreate(BaseModel):
    receipt_number: Optional[str] = None
    datetime_str: Optional[str] = None
    employee: str = "Propietario"
    tpv: str = "TPV 1"
    customer: str
    customer_phone: Optional[str] = None
    payment_method: str
    items: List[TicketItem]
    discount: float = 0
    notes: Optional[str] = None


class Ticket(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    public_id: str = Field(default_factory=lambda: secrets.token_urlsafe(12))
    receipt_number: str
    datetime_str: str
    employee: str
    tpv: str
    customer: str
    customer_phone: Optional[str] = None
    payment_method: str
    items: List[TicketItem]
    subtotal: float
    discount: float
    total: float
    notes: Optional[str] = None
    pdf_path: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class TicketResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    public_id: str
    receipt_number: str
    datetime_str: str
    employee: str
    tpv: str
    customer: str
    customer_phone: Optional[str] = None
    payment_method: str
    items: List[TicketItem]
    subtotal: float
    discount: float
    total: float
    notes: Optional[str] = None
    pdf_path: Optional[str] = None
    created_at: str


# ============== HELPERS ==============
def generate_qr_base64(url: str) -> str:
    """Generate QR code as base64 string"""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=6,
        border=2,
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#eaeaea", back_color="#1a1a1a")
    
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    return base64.b64encode(buffer.getvalue()).decode()


async def get_next_receipt_number() -> str:
    """Generate next receipt number like 1-0001, 1-0002, etc."""
    last_ticket = await db.tickets.find_one(
        {}, 
        {"_id": 0, "receipt_number": 1},
        sort=[("created_at", -1)]
    )
    
    if last_ticket and last_ticket.get("receipt_number"):
        try:
            parts = last_ticket["receipt_number"].split("-")
            if len(parts) == 2:
                num = int(parts[1]) + 1
                return f"1-{num:04d}"
        except (ValueError, IndexError):
            pass
    
    return "1-0001"


def render_ticket_html(ticket: dict, public_base_url: str) -> str:
    """Render ticket HTML from template"""
    template = jinja_env.get_template("ticket.html")
    
    # Ensure ticket is properly formatted for template
    if hasattr(ticket, 'model_dump'):
        ticket = ticket.model_dump()
    
    # Generate QR code
    ticket_url = f"{public_base_url}/t/{ticket['public_id']}"
    qr_base64 = generate_qr_base64("https://www.AsyncData.online")
    
    return template.render(
        ticket=ticket,
        qr_base64=qr_base64,
        ticket_url=ticket_url
    )


def generate_pdf_from_html(html_content: str) -> io.BytesIO:
    """Generate PDF from HTML content"""
    pdf_buffer = io.BytesIO()
    
    html = HTML(string=html_content, base_url=str(templates_dir))
    html.write_pdf(pdf_buffer)
    pdf_buffer.seek(0)
    
    return pdf_buffer


# ============== ENDPOINTS ==============
@api_router.get("/")
async def root():
    return {"message": "AsyncTicket API"}


@api_router.post("/tickets", response_model=TicketResponse)
async def create_ticket(ticket_data: TicketCreate):
    """Create a new ticket"""
    # Calculate subtotal and total
    subtotal = sum(item.line_total for item in ticket_data.items)
    total = subtotal - ticket_data.discount
    
    # Generate receipt number if not provided
    receipt_number = ticket_data.receipt_number or await get_next_receipt_number()
    
    # Set datetime if not provided
    datetime_str = ticket_data.datetime_str or datetime.now(timezone.utc).strftime("%d/%m/%Y %H:%M")
    
    ticket = Ticket(
        receipt_number=receipt_number,
        datetime_str=datetime_str,
        employee=ticket_data.employee,
        tpv=ticket_data.tpv,
        customer=ticket_data.customer,
        customer_phone=ticket_data.customer_phone,
        payment_method=ticket_data.payment_method,
        items=[item.model_dump() for item in ticket_data.items],
        subtotal=subtotal,
        discount=ticket_data.discount,
        total=total,
        notes=ticket_data.notes
    )
    
    doc = ticket.model_dump()
    await db.tickets.insert_one(doc)
    
    logger.info(f"Ticket created: {ticket.receipt_number}")
    return TicketResponse(**doc)


@api_router.get("/tickets", response_model=List[TicketResponse])
async def get_tickets(
    search: Optional[str] = None,
    filter_date: Optional[str] = None  # today, week, month
):
    """Get all tickets with optional search and filter"""
    query = {}
    
    # Search by customer, receipt_number
    if search:
        query["$or"] = [
            {"customer": {"$regex": search, "$options": "i"}},
            {"receipt_number": {"$regex": search, "$options": "i"}}
        ]
    
    # Date filter
    if filter_date:
        now = datetime.now(timezone.utc)
        if filter_date == "today":
            start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        elif filter_date == "week":
            start = now - timedelta(days=7)
        elif filter_date == "month":
            start = now - timedelta(days=30)
        else:
            start = None
        
        if start:
            query["created_at"] = {"$gte": start.isoformat()}
    
    tickets = await db.tickets.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return tickets


@api_router.get("/tickets/{ticket_id}", response_model=TicketResponse)
async def get_ticket(ticket_id: str):
    """Get a single ticket by ID"""
    ticket = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    return ticket


@api_router.get("/tickets/{ticket_id}/pdf")
async def get_ticket_pdf(ticket_id: str):
    """Generate and download ticket PDF"""
    ticket = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    
    # Get public base URL from environment or use default
    public_base_url = os.environ.get("PUBLIC_BASE_URL", "https://ticket-generator-12.preview.emergentagent.com")
    
    html_content = render_ticket_html(ticket, public_base_url)
    pdf_buffer = generate_pdf_from_html(html_content)
    
    filename = f"ticket_{ticket['receipt_number'].replace('-', '_')}.pdf"
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@api_router.post("/tickets/{ticket_id}/duplicate", response_model=TicketResponse)
async def duplicate_ticket(ticket_id: str):
    """Duplicate an existing ticket"""
    original = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
    if not original:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    
    # Create new ticket with new IDs but same data
    new_receipt = await get_next_receipt_number()
    
    new_ticket = Ticket(
        receipt_number=new_receipt,
        datetime_str=datetime.now(timezone.utc).strftime("%d/%m/%Y %H:%M"),
        employee=original["employee"],
        tpv=original["tpv"],
        customer=original["customer"],
        customer_phone=original.get("customer_phone"),
        payment_method=original["payment_method"],
        items=original["items"],
        subtotal=original["subtotal"],
        discount=original["discount"],
        total=original["total"],
        notes=original.get("notes")
    )
    
    doc = new_ticket.model_dump()
    await db.tickets.insert_one(doc)
    
    logger.info(f"Ticket duplicated: {original['receipt_number']} -> {new_receipt}")
    return TicketResponse(**doc)


@api_router.get("/stats")
async def get_stats():
    """Get dashboard statistics"""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    week_start = (now - timedelta(days=7)).isoformat()
    month_start = (now - timedelta(days=30)).isoformat()
    
    total = await db.tickets.count_documents({})
    today = await db.tickets.count_documents({"created_at": {"$gte": today_start}})
    
    # Today's revenue
    today_tickets = await db.tickets.find(
        {"created_at": {"$gte": today_start}}, 
        {"_id": 0, "total": 1}
    ).to_list(1000)
    today_revenue = sum(t.get("total", 0) for t in today_tickets)
    
    # Week revenue
    week_tickets = await db.tickets.find(
        {"created_at": {"$gte": week_start}}, 
        {"_id": 0, "total": 1}
    ).to_list(1000)
    week_revenue = sum(t.get("total", 0) for t in week_tickets)
    
    return {
        "total_tickets": total,
        "today_tickets": today,
        "today_revenue": today_revenue,
        "week_revenue": week_revenue
    }


# ============== PUBLIC TICKET VIEW ==============
@api_router.get("/public/{public_id}", response_class=HTMLResponse)
async def view_ticket_public(public_id: str):
    """Public ticket view page - returns rendered HTML"""
    ticket = await db.tickets.find_one({"public_id": public_id}, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    
    public_base_url = os.environ.get("PUBLIC_BASE_URL", "https://ticket-generator-12.preview.emergentagent.com")
    html_content = render_ticket_html(ticket, public_base_url)
    
    return HTMLResponse(content=html_content)


@api_router.get("/tickets/public/{public_id}", response_model=TicketResponse)
async def get_ticket_by_public_id(public_id: str):
    """Get a single ticket by public ID"""
    ticket = await db.tickets.find_one({"public_id": public_id}, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    return ticket


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

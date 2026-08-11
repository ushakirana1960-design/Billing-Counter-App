from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, date

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

NO_ID = {"_id": 0}


def now_iso():
    return datetime.now(timezone.utc).isoformat()


class Item(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    name_te: str
    name_en: str = ""
    unit: str = "కేజీ"
    price: float = 0
    category: str = "సాధారణ"
    updated_at: str = Field(default_factory=now_iso)


class ItemIn(BaseModel):
    code: str
    name_te: str
    name_en: str = ""
    unit: str = "కేజీ"
    price: float = 0
    category: str = "సాధారణ"


class PriceRow(BaseModel):
    code: str
    price: float
    name_te: Optional[str] = None
    unit: Optional[str] = None


class BulkPriceIn(BaseModel):
    rows: List[PriceRow]
    dry_run: bool = False
    create_missing: bool = True


class BillLine(BaseModel):
    item_id: str = ""
    code: str
    name_te: str
    unit: str = ""
    qty: float
    price: float
    total: float


class BillIn(BaseModel):
    lines: List[BillLine]
    discount: float = 0
    payment_mode: Literal["cash", "upi", "card", "khata"]
    customer_id: Optional[str] = None
    note: str = ""


class Bill(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    bill_no: int
    lines: List[BillLine]
    subtotal: float
    discount: float
    total: float
    payment_mode: str
    customer_id: Optional[str] = None
    customer_name: str = ""
    note: str = ""
    created_at: str = Field(default_factory=now_iso)


class CustomerIn(BaseModel):
    name_te: str
    phone: str = ""


class Customer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name_te: str
    phone: str = ""
    balance: float = 0
    created_at: str = Field(default_factory=now_iso)


class PaymentIn(BaseModel):
    amount: float
    mode: Literal["cash", "upi", "card"] = "cash"
    note: str = ""


# ---------- Items ----------
@api_router.get("/items", response_model=List[Item])
async def list_items():
    return await db.items.find({}, NO_ID).sort("code", 1).to_list(2000)


@api_router.post("/items", response_model=Item)
async def create_item(payload: ItemIn):
    code = payload.code.strip().lower()
    if await db.items.find_one({"code": code}):
        raise HTTPException(400, "ఈ షార్ట్‌కట్ కోడ్ ఇప్పటికే ఉంది")
    item = Item(**{**payload.model_dump(), "code": code})
    await db.items.insert_one(item.model_dump())
    return item


@api_router.put("/items/{item_id}", response_model=Item)
async def update_item(item_id: str, payload: ItemIn):
    doc = await db.items.find_one({"id": item_id}, NO_ID)
    if not doc:
        raise HTTPException(404, "వస్తువు కనబడలేదు")
    upd = {**payload.model_dump(), "code": payload.code.strip().lower(), "updated_at": now_iso()}
    await db.items.update_one({"id": item_id}, {"$set": upd})
    return Item(**{**doc, **upd})


@api_router.delete("/items/{item_id}")
async def delete_item(item_id: str):
    await db.items.delete_one({"id": item_id})
    return {"ok": True}


@api_router.post("/items/bulk-price")
async def bulk_price(payload: BulkPriceIn):
    updated, created, unchanged = [], [], []
    for row in payload.rows:
        code = row.code.strip().lower()
        if not code:
            continue
        doc = await db.items.find_one({"code": code}, NO_ID)
        if doc:
            if abs(float(doc.get("price", 0)) - row.price) < 0.001:
                unchanged.append({"code": code, "name_te": doc["name_te"], "price": row.price})
                continue
            entry = {"code": code, "name_te": doc["name_te"], "old_price": doc.get("price", 0), "price": row.price}
            updated.append(entry)
            if not payload.dry_run:
                upd = {"price": row.price, "updated_at": now_iso()}
                if row.unit:
                    upd["unit"] = row.unit
                if row.name_te:
                    upd["name_te"] = row.name_te
                await db.items.update_one({"code": code}, {"$set": upd})
        else:
            if not payload.create_missing:
                continue
            name = row.name_te or code
            created.append({"code": code, "name_te": name, "price": row.price})
            if not payload.dry_run:
                item = Item(code=code, name_te=name, price=row.price, unit=row.unit or "కేజీ")
                await db.items.insert_one(item.model_dump())
    return {"dry_run": payload.dry_run, "updated": updated, "created": created,
            "unchanged": unchanged,
            "summary": {"updated": len(updated), "created": len(created), "unchanged": len(unchanged)}}


# ---------- Customers / Khata ----------
@api_router.get("/customers", response_model=List[Customer])
async def list_customers():
    return await db.customers.find({}, NO_ID).sort("name_te", 1).to_list(1000)


@api_router.post("/customers", response_model=Customer)
async def create_customer(payload: CustomerIn):
    c = Customer(**payload.model_dump())
    await db.customers.insert_one(c.model_dump())
    return c


@api_router.get("/customers/{customer_id}/ledger")
async def ledger(customer_id: str):
    c = await db.customers.find_one({"id": customer_id}, NO_ID)
    if not c:
        raise HTTPException(404, "కస్టమర్ కనబడలేదు")
    txns = await db.khata.find({"customer_id": customer_id}, NO_ID).sort("created_at", -1).to_list(500)
    return {"customer": c, "txns": txns}


@api_router.post("/customers/{customer_id}/payment")
async def settle(customer_id: str, payload: PaymentIn):
    c = await db.customers.find_one({"id": customer_id}, NO_ID)
    if not c:
        raise HTTPException(404, "కస్టమర్ కనబడలేదు")
    if payload.amount <= 0:
        raise HTTPException(400, "మొత్తం సున్నా కంటే ఎక్కువ ఉండాలి")
    txn = {"id": str(uuid.uuid4()), "customer_id": customer_id, "type": "payment",
           "amount": payload.amount, "mode": payload.mode, "note": payload.note,
           "created_at": now_iso()}
    await db.khata.insert_one(dict(txn))
    new_bal = round(float(c.get("balance", 0)) - payload.amount, 2)
    await db.customers.update_one({"id": customer_id}, {"$set": {"balance": new_bal}})
    return {"ok": True, "balance": new_bal}


# ---------- Bills ----------
@api_router.post("/bills", response_model=Bill)
async def create_bill(payload: BillIn):
    if not payload.lines:
        raise HTTPException(400, "బిల్లులో వస్తువులు లేవు")
    subtotal = round(sum(l.total for l in payload.lines), 2)
    total = round(subtotal - payload.discount, 2)
    last = await db.bills.find({}, NO_ID).sort("bill_no", -1).limit(1).to_list(1)
    bill_no = (last[0]["bill_no"] + 1) if last else 1
    cust_name = ""
    if payload.payment_mode == "khata":
        if not payload.customer_id:
            raise HTTPException(400, "ఖాతా బిల్లుకు కస్టమర్ ఎంచుకోండి")
        c = await db.customers.find_one({"id": payload.customer_id}, NO_ID)
        if not c:
            raise HTTPException(404, "కస్టమర్ కనబడలేదు")
        cust_name = c["name_te"]
    elif payload.customer_id:
        c = await db.customers.find_one({"id": payload.customer_id}, NO_ID)
        cust_name = c["name_te"] if c else ""
    bill = Bill(bill_no=bill_no, lines=payload.lines, subtotal=subtotal, discount=payload.discount,
                total=total, payment_mode=payload.payment_mode, customer_id=payload.customer_id,
                customer_name=cust_name, note=payload.note)
    await db.bills.insert_one(bill.model_dump())
    if payload.payment_mode == "khata":
        await db.khata.insert_one({"id": str(uuid.uuid4()), "customer_id": payload.customer_id,
                                   "type": "bill", "amount": total, "bill_id": bill.id,
                                   "bill_no": bill_no, "note": "", "created_at": bill.created_at})
        await db.customers.update_one({"id": payload.customer_id}, {"$inc": {"balance": total}})
    return bill


@api_router.get("/bills", response_model=List[Bill])
async def list_bills(day: Optional[str] = None, from_day: Optional[str] = None,
                     to_day: Optional[str] = None, q: Optional[str] = None):
    query = {}
    if day:
        query["created_at"] = {"$gte": f"{day}T00:00:00", "$lte": f"{day}T23:59:59.999999+00:00"}
    elif from_day or to_day:
        rng = {}
        if from_day:
            rng["$gte"] = f"{from_day}T00:00:00"
        if to_day:
            rng["$lte"] = f"{to_day}T23:59:59.999999+00:00"
        query["created_at"] = rng
    bills = await db.bills.find(query, NO_ID).sort("bill_no", -1).to_list(1000)
    if q:
        s = q.strip().lower()
        bills = [
            b for b in bills
            if s == str(b["bill_no"])
            or s in (b.get("customer_name") or "").lower()
            or any(s in l["name_te"].lower() or s == l["code"] for l in b["lines"])
        ]
    return bills[:300]


@api_router.get("/bills/{bill_id}", response_model=Bill)
async def get_bill(bill_id: str):
    doc = await db.bills.find_one({"id": bill_id}, NO_ID)
    if not doc:
        raise HTTPException(404, "బిల్లు కనబడలేదు")
    return doc


@api_router.get("/report/daily")
async def daily_report(day: Optional[str] = None):
    day = day or date.today().isoformat()
    bills = await db.bills.find({"created_at": {"$gte": f"{day}T00:00:00",
                                                "$lte": f"{day}T23:59:59.999999+00:00"}},
                                NO_ID).sort("bill_no", 1).to_list(1000)
    modes = {"cash": 0.0, "upi": 0.0, "card": 0.0, "khata": 0.0}
    counts = {"cash": 0, "upi": 0, "card": 0, "khata": 0}
    item_map = {}
    for b in bills:
        modes[b["payment_mode"]] = round(modes[b["payment_mode"]] + b["total"], 2)
        counts[b["payment_mode"]] += 1
        for l in b["lines"]:
            e = item_map.setdefault(l["code"], {"code": l["code"], "name_te": l["name_te"], "qty": 0, "amount": 0})
            e["qty"] = round(e["qty"] + l["qty"], 3)
            e["amount"] = round(e["amount"] + l["total"], 2)
    payments = await db.khata.find({"type": "payment",
                                    "created_at": {"$gte": f"{day}T00:00:00",
                                                   "$lte": f"{day}T23:59:59.999999+00:00"}},
                                   NO_ID).to_list(500)
    khata_collected = {"cash": 0.0, "upi": 0.0, "card": 0.0}
    for p in payments:
        m = p.get("mode", "cash")
        khata_collected[m] = round(khata_collected[m] + p["amount"], 2)
    gross = round(sum(modes.values()), 2)
    return {
        "day": day,
        "bill_count": len(bills),
        "gross": gross,
        "discount": round(sum(b["discount"] for b in bills), 2),
        "modes": modes,
        "counts": counts,
        "khata_collected": khata_collected,
        "cash_in_hand": round(modes["cash"] + khata_collected["cash"], 2),
        "top_items": sorted(item_map.values(), key=lambda x: -x["amount"])[:15],
        "bills": bills,
    }


SEED_ITEMS = [
    ("a1", "వెన్న", "Butter", "కేజీ", 520, "పాల ఉత్పత్తులు"),
    ("a2", "పాలు", "Milk", "లీటరు", 32, "పాల ఉత్పత్తులు"),
    ("a3", "పెరుగు", "Curd", "కేజీ", 70, "పాల ఉత్పత్తులు"),
    ("a4", "నెయ్యి", "Ghee", "కేజీ", 720, "పాల ఉత్పత్తులు"),
    ("a5", "పనీర్", "Paneer", "కేజీ", 380, "పాల ఉత్పత్తులు"),
    ("b1", "బియ్యం (సోనా మసూరి)", "Sona Masuri Rice", "కేజీ", 62, "పప్పులు, బియ్యం"),
    ("b2", "కందిపప్పు", "Toor Dal", "కేజీ", 165, "పప్పులు, బియ్యం"),
    ("b3", "పెసరపప్పు", "Moong Dal", "కేజీ", 140, "పప్పులు, బియ్యం"),
    ("b4", "మినపపప్పు", "Urad Dal", "కేజీ", 155, "పప్పులు, బియ్యం"),
    ("b5", "శనగపప్పు", "Chana Dal", "కేజీ", 110, "పప్పులు, బియ్యం"),
    ("c1", "పంచదార", "Sugar", "కేజీ", 46, "నిత్యావసరాలు"),
    ("c2", "ఉప్పు", "Salt", "కేజీ", 22, "నిత్యావసరాలు"),
    ("c3", "వేరుశనగ నూనె", "Groundnut Oil", "లీటరు", 195, "నూనెలు"),
    ("c4", "పామాయిల్", "Palm Oil", "లీటరు", 128, "నూనెలు"),
    ("c5", "గోధుమ పిండి", "Wheat Flour", "కేజీ", 48, "నిత్యావసరాలు"),
    ("d1", "పసుపు", "Turmeric", "కేజీ", 260, "మసాలాలు"),
    ("d2", "కారం", "Chilli Powder", "కేజీ", 340, "మసాలాలు"),
    ("d3", "ధనియాలు", "Coriander Seeds", "కేజీ", 220, "మసాలాలు"),
    ("d4", "జీలకర్ర", "Cumin", "కేజీ", 420, "మసాలాలు"),
    ("d5", "ఆవాలు", "Mustard", "కేజీ", 150, "మసాలాలు"),
    ("e1", "టీ పొడి", "Tea Powder", "కేజీ", 480, "పానీయాలు"),
    ("e2", "కాఫీ పొడి", "Coffee Powder", "కేజీ", 620, "పానీయాలు"),
    ("e3", "సబ్బు", "Soap", "పీస్", 42, "ఇంటి సామాను"),
    ("e4", "డిటర్జెంట్", "Detergent", "కేజీ", 130, "ఇంటి సామాను"),
    ("e5", "అగరబత్తి", "Agarbatti", "పీస్", 30, "ఇంటి సామాను"),
]


@api_router.post("/seed")
async def seed():
    created = 0
    for code, te, en, unit, price, cat in SEED_ITEMS:
        if not await db.items.find_one({"code": code}):
            await db.items.insert_one(Item(code=code, name_te=te, name_en=en, unit=unit,
                                           price=price, category=cat).model_dump())
            created += 1
    if await db.customers.count_documents({}) == 0:
        for n, p in [("రమేష్ గారు", "9876543210"), ("లక్ష్మి అక్క", "9848012345"), ("శ్రీను అన్న", "9701234567")]:
            await db.customers.insert_one(Customer(name_te=n, phone=p).model_dump())
    return {"created_items": created}


class Shop(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str = "ఉష కిరాణా"
    phone: str = ""
    address: str = ""
    gstin: str = ""
    footer: str = "ధన్యవాదాలు! మళ్ళీ రండి"


@api_router.get("/settings", response_model=Shop)
async def get_settings():
    doc = await db.settings.find_one({"key": "shop"}, NO_ID)
    return Shop(**(doc or {}))


@api_router.put("/settings", response_model=Shop)
async def put_settings(payload: Shop):
    await db.settings.update_one({"key": "shop"}, {"$set": {**payload.model_dump(), "key": "shop"}}, upsert=True)
    return payload


@api_router.get("/")
async def root():
    return {"message": "కిరాణా బిల్లింగ్ API"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
